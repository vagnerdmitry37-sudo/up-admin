import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  contentChild,
  input,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { parseRouteIds } from '@shared/route-ids/route-ids';
import { Observable } from 'rxjs';
import { EntityTabContext, EntityTabs } from '../entity-tabs/entity-tabs';

@Component({
  selector: 'app-entity-edit-page',
  imports: [EntityTabs],
  templateUrl: './entity-edit-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntityEditPage<T extends { id: string }> {
  readonly ids = input<string>();
  readonly load = input.required<(ids: string[]) => Observable<T[]>>();
  readonly label = input.required<(entity: T) => string>();

  protected readonly entityTemplate =
    contentChild.required<TemplateRef<EntityTabContext<T>>>(TemplateRef);

  private readonly openIds = computed(() => {
    const ids = this.ids();
    return ids ? parseRouteIds(ids) : [];
  });

  protected readonly entities = rxResource({
    params: () => {
      const ids = this.openIds();
      return ids.length > 0 ? ids : undefined;
    },
    stream: ({ params }) => this.load()(params),
  });

  protected readonly tabs = computed(() => (this.entities.hasValue() ? this.entities.value() : []));
}
