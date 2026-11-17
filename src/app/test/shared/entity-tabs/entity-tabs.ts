import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';
import { Tab, TabList, Tabs } from '@openng/optimus-ui/tabs';

@Component({
  selector: 'app-entity-tabs',
  imports: [Tabs, TabList, Tab],
  templateUrl: './entity-tabs.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntityTabs<T extends { id: string }> {
  readonly entities = input.required<readonly T[]>();
  readonly label = input.required<(entity: T) => string>();
  readonly active = model<string>();

  protected readonly shownId = computed(() => {
    const entities = this.entities();
    const active = this.active();
    return entities.some((entity) => entity.id === active) ? active : entities[0]?.id;
  });

  protected readonly show = (id: string | number | undefined) => this.active.set(id?.toString());
}
