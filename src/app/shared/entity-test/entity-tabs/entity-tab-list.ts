import { signal } from '@angular/core';
import { nextNewEntityId } from '@shared/route-ids/route-ids';
import { EntityTab } from './entity-tabs';

export class EntityTabList<T extends { id: string }> {
  private readonly openTabs = signal<readonly EntityTab<T>[]>([]);

  readonly tabs = this.openTabs.asReadonly();
  readonly activeId = signal<string | undefined>(undefined);

  readonly addExisting = (entities: readonly T[]) =>
    this.openTabs.update((tabs) => [
      ...tabs,
      ...entities
        .filter((entity) => !tabs.some((tab) => tab.id === entity.id))
        .map((entity) => ({ id: entity.id, entity })),
    ]);

  addNew() {
    const id = nextNewEntityId(this.openTabs().map((tab) => tab.id));
    this.openTabs.update((tabs) => [...tabs, { id, entity: undefined }]);
    this.activeId.set(id);
  }
}
