import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  input,
  linkedSignal,
} from '@angular/core';
import { Tab, TabList, TabPanel, TabPanels, Tabs } from '@openng/optimus-ui/tabs';

export interface EntityTabContext<T> {
  $implicit: T;
}

@Component({
  selector: 'app-entity-tabs',
  imports: [NgTemplateOutlet, Tabs, TabList, Tab, TabPanels, TabPanel],
  templateUrl: './entity-tabs.html',
  styleUrl: './entity-tabs.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntityTabs<T extends { id: string }> {
  readonly entities = input.required<readonly T[]>();
  readonly label = input.required<(entity: T) => string>();
  readonly template = input.required<TemplateRef<EntityTabContext<T>>>();

  protected readonly activeTap = linkedSignal({
    source: this.entities,
    computation: (entities) => entities[0]?.id,
  });
}
