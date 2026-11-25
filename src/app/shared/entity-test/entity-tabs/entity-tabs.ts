import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  afterRenderEffect,
  computed,
  input,
  model,
  viewChild,
  viewChildren,
} from '@angular/core';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from '@openng/optimus-ui/tabs';

export interface EntityTab<T> {
  id: string;
  entity: T | undefined;
}

export interface EntityTabContext<T> {
  $implicit: T | undefined;
}

@Component({
  selector: 'app-entity-tabs',
  imports: [NgTemplateOutlet, Tabs, TabList, Tab, TabPanels, TabPanel],
  templateUrl: './entity-tabs.html',
  styleUrl: './entity-tabs.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntityTabs<T> {
  readonly tabs = input.required<readonly EntityTab<T>[]>();
  readonly label = input.required<(tab: EntityTab<T>) => string>();
  readonly template = input.required<TemplateRef<EntityTabContext<T>>>();
  readonly active = model<string>();

  protected readonly shownId = computed(() => {
    const tabs = this.tabs();
    const active = this.active();
    return tabs.some((tab) => tab.id === active) ? active : tabs[0]?.id;
  });

  private readonly tabList = viewChild.required(TabList);
  private readonly tabComponents = viewChildren(Tab);

  constructor() {
    afterRenderEffect(() => {
      this.scrollShownTabIntoView();
      this.updateScrollButtons();
    });
  }

  private readonly scrollShownTabIntoView = () => {
    const shownTab = this.tabComponents().find((tab) => tab.active());
    shownTab?.scrollInView(shownTab.el.nativeElement);
  };

  private readonly updateScrollButtons = () => this.tabList().updateButtonState();

  protected readonly show = (id: string | number | undefined) => this.active.set(id?.toString());
}
