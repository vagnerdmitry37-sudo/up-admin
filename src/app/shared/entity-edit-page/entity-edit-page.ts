import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  TemplateRef,
  contentChild,
  inject,
  input,
  signal,
} from '@angular/core';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ControlEvent, PristineChangeEvent } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EditActionsService } from '@core/edit-actions.service';
import type { EntityForm } from '@shared/entity-form/entity-form';
import { EntityTabs } from '@shared/entity-tabs/entity-tabs';
import { joinRouteIds, parseRouteIds } from '@shared/route-ids/route-ids';
import { Observable, filter } from 'rxjs';

export interface EntityEditContext<T> {
  $implicit: T | undefined;
}

const isPristineChange = (event: ControlEvent): event is PristineChangeEvent =>
  event instanceof PristineChangeEvent;

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

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dirty = signal(false);
  private readonly saving = signal(false);
  private newEntityForm?: EntityForm;

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
          click: () => this.newEntityForm?.submit(),
          visible: this.dirty() && !this.saving(),
        },
      }),
    });
  }

  readonly connect = (entityForm: EntityForm) => {
    const create = this.create();
    if (this.ids() || !create) {
      return;
    }
    this.newEntityForm = entityForm;
    entityForm.submitted.subscribe(() => this.createEntity(entityForm, create));
    entityForm
      .form()
      .events.pipe(filter(isPristineChange), takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => this.dirty.set(!event.pristine));
  };

  private readonly createEntity = async (
    entityForm: EntityForm,
    create: (value: V) => Promise<{ id: string }>,
  ) => {
    if (this.saving()) {
      return;
    }
    const form = entityForm.form();
    this.saving.set(true);
    try {
      const { id } = await create(form.getRawValue());
      form.markAsPristine();
      this.newEntityForm = undefined;
      await this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { ids: joinRouteIds([id]) },
      });
    } finally {
      this.saving.set(false);
    }
  };
}
