import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  contentChild,
  inject,
  input,
  signal,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { EditActionsService } from '@core/edit-actions.service';
import { ConfirmationService, OpenngIcons } from '@openng/optimus-ui/api';
import type { EntityForm } from '@shared/entity-form/entity-form';
import { EntityTabs } from '@shared/entity-tabs/entity-tabs';
import { joinRouteIds, parseRouteIds } from '@shared/route-ids/route-ids';
import { Observable } from 'rxjs';

const containsAll = (loaded: readonly string[] | undefined, next: readonly string[] | undefined) =>
  loaded && next ? next.every((id) => loaded.includes(id)) : loaded === next;

export interface EntityEditContext<T> {
  $implicit: T | undefined;
}

export interface EntityTab<T> {
  id: string;
  entity: T | undefined;
}

const newEntityTabId = 'new';

export interface EntityChange<T, V> {
  entity: T;
  value: V;
}

export interface EntityWriter<T, V> {
  create: (value: V) => Promise<{ id: string }>;
  update: (changes: EntityChange<T, V>[]) => Promise<unknown>;
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
  readonly entityName = input.required<string>();
  readonly writer = input.required<EntityWriter<T, V>>();
  readonly listPath = input.required<string>();

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly forms = signal<readonly EntityForm[]>([]);
  private readonly changedForms = computed(() => this.forms().filter((form) => form.dirty()));
  private readonly openIds = computed(() => {
    const ids = this.ids();
    return ids ? parseRouteIds(ids) : undefined;
  });
  private readonly loadedIds = computed(() => this.openIds(), { equal: containsAll });

  private readonly editActionsService = inject(EditActionsService);

  protected readonly actionRunning = computed(
    () => this.editActionsService.runningAction() !== undefined,
  );
  protected readonly activeId = signal<string | undefined>(undefined);
  protected readonly entityTemplate =
    contentChild.required<TemplateRef<EntityEditContext<T>>>(TemplateRef);
  protected readonly entities = rxResource({
    params: () => this.loadedIds(),
    stream: ({ params }) => this.load()(params),
  });
  protected readonly openEntities = computed(() => {
    if (!this.entities.hasValue()) {
      return undefined;
    }
    const openIds = this.openIds() ?? [];
    return this.entities.value().filter((entity) => openIds.includes(entity.id));
  });
  protected readonly tabs = computed<EntityTab<T>[] | undefined>(() => {
    if (!this.ids()) {
      return [{ id: newEntityTabId, entity: undefined }];
    }
    return this.openEntities()?.map((entity) => ({ id: entity.id, entity }));
  });
  protected readonly tabLabel = computed(() => {
    const label = this.label();
    const newEntityLabel = `New ${this.entityName()}`;
    return (tab: EntityTab<T>) => (tab.entity ? label(tab.entity) : newEntityLabel);
  });

  constructor() {
    this.editActionsService.register({
      actions: () => ({
        save: { click: () => this.save(), visible: this.changedForms().length > 0 },
      }),
    });
  }

  readonly connect = (entityForm: EntityForm) =>
    this.forms.update((forms) => [...forms, entityForm]);

  readonly disconnect = (entityForm: EntityForm) =>
    this.forms.update((forms) => forms.filter((form) => form !== entityForm));

  readonly submit = () => this.editActionsService.run('save');

  private readonly save = async () => {
    const changedForms = this.changedForms();
    if (changedForms.length === 0) {
      return;
    }
    const values = changedForms.map((form) => form.validValue());
    const firstInvalid = values.findIndex((value) => value === undefined);
    if (firstInvalid !== -1) {
      this.activeId.set(changedForms[firstInvalid].value()?.id);
      return;
    }
    if (this.ids()) {
      await this.updateEntities(changedForms, values);
    } else {
      await this.createEntity(changedForms[0], values[0]);
    }
  };

  protected readonly close = async (id: string) => {
    const tab = this.tabs()?.find((candidate) => candidate.id === id);
    if (!tab) {
      return;
    }
    const form = this.forms().find((candidate) => candidate.value()?.id === tab.entity?.id);
    if (form?.dirty()) {
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
    await this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { ids: joinRouteIds(remainingIds) },
      replaceUrl: true,
    });
  };

  private readonly createEntity = async (entityForm: EntityForm, value: V) => {
    const { id } = await this.writer().create(value);
    entityForm.form().markAsPristine();
    await this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { ids: joinRouteIds([id]) },
    });
  };

  private readonly updateEntities = async (changedForms: readonly EntityForm[], values: V[]) => {
    if (!this.entities.hasValue()) {
      return;
    }
    const entities = this.entities.value();
    const changes = changedForms.flatMap((form, index) => {
      const entity = entities.find((candidate) => candidate.id === form.value()?.id);
      return entity ? [{ entity, value: values[index] }] : [];
    });
    await this.writer().update(changes);
    changedForms.forEach((form) => form.form().markAsPristine());
    this.entities.reload();
  };
}
