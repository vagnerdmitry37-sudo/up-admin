import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  booleanAttribute,
  computed,
  contentChild,
  input,
  model,
} from '@angular/core';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from '@openng/optimus-ui/tabs';

export interface EntityTabContext<T> {
  $implicit: T;
}

const TABBED_PANEL_TOKENS = { tabpanel: { padding: '1.5rem 0 0' } };
const SINGLE_PANEL_TOKENS = { tabpanel: { padding: '0' } };

@Component({
  selector: 'app-entity-tabs',
  imports: [NgTemplateOutlet, Tabs, TabList, Tab, TabPanels, TabPanel],
  templateUrl: './entity-tabs.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntityTabs<T extends { id: string }> {
  readonly entities = input.required<readonly T[]>();
  readonly label = input.required<(entity: T) => string>();
  readonly lazy = input(true, { transform: booleanAttribute });
  readonly active = model<string>();

  protected readonly entityTemplate =
    contentChild.required<TemplateRef<EntityTabContext<T>>>(TemplateRef);
  protected readonly inTabs = computed(() => this.entities().length > 1);
  protected readonly panelTokens = computed(() =>
    this.inTabs() ? TABBED_PANEL_TOKENS : SINGLE_PANEL_TOKENS,
  );
  protected readonly shownId = computed(() => {
    const entities = this.entities();
    const active = this.active();
    return entities.some((entity) => entity.id === active) ? active : entities[0]?.id;
  });

  protected readonly show = (id: string | number | undefined) => this.active.set(id?.toString());
}
