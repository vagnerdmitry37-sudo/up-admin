import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  afterRenderEffect,
  computed,
  contentChild,
  input,
  model,
  output,
  viewChild,
  viewChildren,
} from '@angular/core';
import { ButtonDirective, ButtonIcon } from '@openng/optimus-ui/button';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from '@openng/optimus-ui/tabs';

export interface EntityTabContext<T> {
  $implicit: T;
}

@Component({
  selector: 'app-entity-tabs',
  imports: [NgTemplateOutlet, Tabs, TabList, Tab, TabPanels, TabPanel, ButtonDirective, ButtonIcon],
  templateUrl: './entity-tabs.html',
  styleUrl: './entity-tabs.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntityTabs<T extends { id: string }> {
  readonly entities = input.required<readonly T[]>();
  readonly label = input.required<(entity: T) => string>();
  readonly closable = input(false);
  readonly active = model<string>();
  readonly closeTab = output<string>();

  protected readonly entityTemplate =
    contentChild.required<TemplateRef<EntityTabContext<T>>>(TemplateRef);
  protected readonly shownId = computed(() => {
    const entities = this.entities();
    const active = this.active();
    return entities.some((entity) => entity.id === active) ? active : entities[0]?.id;
  });
  private readonly tabList = viewChild.required(TabList);
  private readonly tabs = viewChildren(Tab);

  constructor() {
    afterRenderEffect(() => {
      const shownTab = this.tabs().find((tab) => tab.active());
      shownTab?.scrollInView(shownTab.el.nativeElement);
      this.tabList().updateButtonState();
    });
  }

  protected readonly show = (id: string | number | undefined) => this.active.set(id?.toString());

  protected readonly close = (id: string, event: Event) => {
    event.stopPropagation();
    this.closeTab.emit(id);
  };
}
