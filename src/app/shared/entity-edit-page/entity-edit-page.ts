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
import type { EntityForm } from '@shared/entity-form/entity-form';
import { EntityTabs } from '@shared/entity-tabs/entity-tabs';
import { joinRouteIds, parseRouteIds } from '@shared/route-ids/route-ids';
import { Observable } from 'rxjs';

export interface EntityEditContext<T> {
  $implicit: T | undefined;
}

export interface EntityChange<T, V> {
  entity: T;
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
  readonly create = input<(value: V) => Promise<{ id: string }>>();
  readonly update = input<(changes: EntityChange<T, V>[]) => Promise<unknown>>();

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly forms = signal<readonly EntityForm[]>([]);
  private readonly changedForms = computed(() => this.forms().filter((form) => form.dirty()));
  private readonly saving = signal(false);
  private readonly canSave = computed(
    () => (this.ids() ? this.update() : this.create()) !== undefined,
  );

  protected readonly activeId = signal<string | undefined>(undefined);
  protected readonly entityTemplate =
    contentChild.required<TemplateRef<EntityEditContext<T>>>(TemplateRef);
  protected readonly entities = rxResource({
    params: () => {
      const ids = this.ids();
      return ids ? parseRouteIds(ids) : undefined;
    },
    stream: ({ params }) => this.load()(params),
  });

  constructor() {
    inject(EditActionsService).register({
      actions: () => ({
        save: {
          click: () => this.save(),
          visible: this.canSave() && this.changedForms().length > 0 && !this.saving(),
        },
      }),
    });
  }

  readonly connect = (entityForm: EntityForm) =>
    this.forms.update((forms) => [...forms, entityForm]);

  readonly disconnect = (entityForm: EntityForm) =>
    this.forms.update((forms) => forms.filter((form) => form !== entityForm));

  readonly save = async () => {
    const changedForms = this.changedForms();
    if (this.saving() || changedForms.length === 0 || !this.canSave()) {
      return;
    }
    const values = changedForms.map((form) => form.validValue());
    const firstInvalid = values.findIndex((value) => value === undefined);
    if (firstInvalid !== -1) {
      this.activeId.set(changedForms[firstInvalid].value()?.id);
      return;
    }
    this.saving.set(true);
    try {
      if (this.ids()) {
        await this.updateEntities(changedForms, values);
      } else {
        await this.createEntity(changedForms[0], values[0]);
      }
    } finally {
      this.saving.set(false);
    }
  };

  private readonly createEntity = async (entityForm: EntityForm, value: V) => {
    const create = this.create();
    if (!create) {
      return;
    }
    const { id } = await create(value);
    entityForm.form().markAsPristine();
    await this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { ids: joinRouteIds([id]) },
    });
  };

  private readonly updateEntities = async (changedForms: readonly EntityForm[], values: V[]) => {
    const update = this.update();
    if (!update || !this.entities.hasValue()) {
      return;
    }
    const entities = this.entities.value();
    const changes = changedForms.flatMap((form, index) => {
      const entity = entities.find((candidate) => candidate.id === form.value()?.id);
      return entity ? [{ entity, value: values[index] }] : [];
    });
    await update(changes);
    changedForms.forEach((form) => form.form().markAsPristine());
    this.entities.reload();
  };
}
