import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  InjectionToken,
  Injector,
  TemplateRef,
  computed,
  contentChild,
  inject,
  input,
  linkedSignal,
  signal,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { ActivityEntity } from '@core/http-activity.service';
import { ConfirmationService, OpenngIcons } from '@openng/optimus-ui/api';
import { ActionService } from '@shared/actions/action.service';
import type { EntityForm } from '@shared/entity/entity-form/entity-form';
import { EntityTabs } from '@shared/entity/entity-tabs/entity-tabs';
import {
  firstNewEntityId,
  isNewEntityId,
  joinRouteIds,
  nextNewEntityId,
  parseRouteIds,
} from '@shared/route-ids/route-ids';
import { Observable } from 'rxjs';

const containsAll = (loaded: readonly string[], next: readonly string[]) =>
  next.every((id) => loaded.includes(id));

const isNewTab = (tabId: string | undefined): tabId is string =>
  tabId !== undefined && isNewEntityId(tabId);

export const ENTITY_TAB_ID = new InjectionToken<string>('ENTITY_TAB_ID');

export interface EntityEditContext<T> {
  $implicit: T | undefined;
}

export interface EntityTab<T> {
  id: string;
  entity: T | undefined;
}

export interface EntityChange<T, V> {
  entity: T;
  value: V;
}

export interface EntityWriter<T, V> {
  create: (value: V) => Promise<{ id: string }>;
  update: (changes: EntityChange<T, V>[]) => Promise<unknown>;
}

export interface EntityEditPart {
  readonly tabId: string | undefined;
  readonly dirty: () => boolean;
  readonly save: (entityId: string) => Promise<unknown>;
}

interface FormToSave<V> {
  form: EntityForm;
  value: V;
}

@Component({
  selector: 'app-entity-edit-page',
  imports: [NgTemplateOutlet, EntityTabs],
  templateUrl: './entity-edit-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntityEditPage<T extends { id: string }, V> {
  readonly ids = input<string>();
  readonly load = input.required<(ids: string[]) => Observable<T[]>>();
  readonly label = input.required<(entity: T) => string>();
  readonly entityName = input.required<ActivityEntity>();
  readonly writer = input.required<EntityWriter<T, V>>();
  readonly listPath = input.required<string>();

  private readonly actionService = inject(ActionService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly injector = inject(Injector);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly tabInjectors = new Map<string, Injector>();
  private readonly forms = signal<readonly EntityForm[]>([]);
  private readonly changedForms = computed(() => this.forms().filter((form) => form.dirty()));
  private readonly parts = signal<readonly EntityEditPart[]>([]);
  private readonly changedParts = computed(() => this.parts().filter((part) => part.dirty()));
  private readonly openIds = computed(() => {
    const ids = this.ids();
    return ids ? parseRouteIds(ids) : [firstNewEntityId];
  });
  private readonly savedIds = computed(() => this.openIds().filter((id) => !isNewEntityId(id)));
  private readonly loadedIds = computed(() => this.savedIds(), { equal: containsAll });

  protected readonly activeId = signal<string | undefined>(undefined);
  protected readonly entityTemplate =
    contentChild.required<TemplateRef<EntityEditContext<T>>>(TemplateRef);
  protected readonly entities = rxResource({
    params: () => {
      const ids = this.loadedIds();
      return ids.length > 0 ? ids : undefined;
    },
    stream: ({ params }) => this.load()(params),
  });
  private readonly loadedEntities = linkedSignal<T[] | undefined, T[] | undefined>({
    source: () => (this.entities.hasValue() ? this.entities.value() : undefined),
    computation: (next, previous) => next ?? previous?.value,
  });
  private readonly createdIds = signal<ReadonlySet<string>>(new Set());
  protected readonly tabs = computed<EntityTab<T>[] | undefined>(() => {
    const entities = this.loadedEntities();
    const createdIds = this.createdIds();
    const awaitsLoadedRecords = this.savedIds().some((id) => !createdIds.has(id));
    if (!entities && awaitsLoadedRecords) {
      return undefined;
    }
    return this.openIds().flatMap((id): EntityTab<T>[] => {
      const entity = entities?.find((candidate) => candidate.id === id);
      if (entity) {
        return [{ id, entity }];
      }
      return isNewEntityId(id) || createdIds.has(id) ? [{ id, entity: undefined }] : [];
    });
  });
  protected readonly tabLabel = computed(() => {
    const label = this.label();
    const newEntityLabel = `New ${this.entityName()}`;
    return (tab: EntityTab<T>) => (tab.entity ? label(tab.entity) : newEntityLabel);
  });

  constructor() {
    this.actionService.register({
      create: { run: () => this.addNewTab() },
      save: { run: () => this.save() },
    });
  }

  readonly connect = (entityForm: EntityForm) =>
    this.forms.update((forms) => [...forms, entityForm]);

  readonly disconnect = (entityForm: EntityForm) =>
    this.forms.update((forms) => forms.filter((form) => form !== entityForm));

  readonly connectPart = (part: EntityEditPart) => this.parts.update((parts) => [...parts, part]);

  readonly disconnectPart = (part: EntityEditPart) =>
    this.parts.update((parts) => parts.filter((candidate) => candidate !== part));

  readonly submit = () => this.save();

  protected readonly tabInjector = (tabId: string) => {
    const existing = this.tabInjectors.get(tabId);
    if (existing) {
      return existing;
    }
    const created = Injector.create({
      providers: [{ provide: ENTITY_TAB_ID, useValue: tabId }],
      parent: this.injector,
    });
    this.tabInjectors.set(tabId, created);
    return created;
  };

  private readonly showIds = (ids: readonly string[]) =>
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { ids: joinRouteIds(ids) },
      replaceUrl: true,
    });

  private readonly addNewTab = async () => {
    const openIds = this.openIds();
    const newId = nextNewEntityId(openIds);
    await this.showIds([...openIds, newId]);
    this.activeId.set(newId);
  };

  private readonly changedPartsOf = (tabId: string | undefined) =>
    this.changedParts().filter((part) => part.tabId === tabId);

  private readonly save = async () => {
    const formsToSave = this.forms().filter(
      (form) =>
        form.dirty() || (isNewTab(form.tabId) && this.changedPartsOf(form.tabId).length > 0),
    );
    if (formsToSave.length === 0 && this.changedParts().length === 0) {
      return;
    }
    const values = formsToSave.map((form) => form.validValue());
    const firstInvalid = values.findIndex((value) => value === undefined);
    if (firstInvalid !== -1) {
      this.activeId.set(formsToSave[firstInvalid].tabId);
      return;
    }
    const validForms = formsToSave.map((form, index) => ({ form, value: values[index] as V }));
    const createdIds = new Map<string, string>();
    try {
      await this.updateEntities(validForms.filter(({ form }) => !isNewTab(form.tabId)));
      await this.createEntities(
        validForms.filter(({ form }) => isNewTab(form.tabId)),
        createdIds,
      );
    } finally {
      if (createdIds.size > 0) {
        await this.replaceCreatedIds(createdIds);
      } else {
        this.entities.reload();
      }
    }
  };

  private readonly createEntities = async (
    newForms: readonly FormToSave<V>[],
    createdIds: Map<string, string>,
  ) => {
    for (const { form, value } of newForms) {
      const tabId = form.tabId as string;
      const { id } = await this.writer().create(value);
      createdIds.set(tabId, id);
      form.form().markAsPristine();
      await Promise.allSettled(this.changedPartsOf(tabId).map((part) => part.save(id)));
    }
  };

  private readonly replaceCreatedIds = async (createdIds: ReadonlyMap<string, string>) => {
    const activeId = this.activeId();
    this.createdIds.set(new Set(createdIds.values()));
    await this.showIds(this.openIds().map((id) => createdIds.get(id) ?? id));
    this.activeId.set((activeId && createdIds.get(activeId)) ?? activeId);
    this.pruneTabInjectors();
  };

  private readonly pruneTabInjectors = () => {
    const openIds = this.openIds();
    [...this.tabInjectors.keys()]
      .filter((tabId) => !openIds.includes(tabId))
      .forEach((tabId) => this.tabInjectors.delete(tabId));
  };

  private readonly updateEntities = async (changedForms: readonly FormToSave<V>[]) => {
    const entities = this.loadedEntities() ?? [];
    const changes = changedForms.flatMap(({ form, value }) => {
      const entity = entities.find((candidate) => candidate.id === form.tabId);
      return entity ? [{ entity, value }] : [];
    });
    if (changes.length > 0) {
      await this.writer().update(changes);
      changedForms.forEach(({ form }) => form.form().markAsPristine());
    }
    await Promise.all(
      this.changedParts().flatMap((part) =>
        part.tabId && !isNewEntityId(part.tabId) ? [part.save(part.tabId)] : [],
      ),
    );
  };

  protected readonly close = async (id: string) => {
    const tab = this.tabs()?.find((candidate) => candidate.id === id);
    if (!tab) {
      return;
    }
    const form = this.forms().find((candidate) => candidate.tabId === id);
    if (form?.dirty() || this.changedPartsOf(id).length > 0) {
      this.confirmationService.confirm({
        header: 'Discard changes',
        message: `Close ${this.tabLabel()(tab)} and discard its unsaved changes?`,
        icon: OpenngIcons.EXCLAMATION_TRIANGLE,
        defaultFocus: 'reject',
        acceptButtonProps: { label: 'Discard', severity: 'danger' },
        rejectButtonProps: { label: 'Keep editing', severity: 'secondary', outlined: true },
        accept: () => this.closeTab(id),
      });
      return;
    }
    await this.closeTab(id);
  };

  private readonly closeTab = async (id: string) => {
    const openIds = (this.tabs() ?? []).map((tab) => tab.id);
    const remainingIds = openIds.filter((openId) => openId !== id);
    if (remainingIds.length === 0) {
      await this.router.navigateByUrl(this.listPath(), { replaceUrl: true });
      return;
    }
    const activeId = this.activeId();
    const shownId = activeId && openIds.includes(activeId) ? activeId : openIds[0];
    if (shownId === id) {
      const closedIndex = openIds.indexOf(id);
      this.activeId.set(remainingIds[Math.min(closedIndex, remainingIds.length - 1)]);
    }
    await this.showIds(remainingIds);
    this.pruneTabInjectors();
  };
}
