import { Signal, WritableSignal, signal } from '@angular/core';
import { EntityTab } from './entity-tabs';

export interface EntityTabListOptions<T> {
  entityName: () => string;
  entityLabel: (entity: T) => string;
}

export interface EntityTabList<T> {
  tabs: Signal<readonly EntityTab<T>[]>;
  activeId: WritableSignal<string | undefined>;
  addExisting: (entities: readonly T[]) => void;
  addNew: () => void;
  close: (id: string) => void;
}

export const entityTabList = <T extends { id: string }>({
  entityName,
  entityLabel,
}: EntityTabListOptions<T>): EntityTabList<T> => {
  const tabs = signal<readonly EntityTab<T>[]>([]);
  const activeId = signal<string | undefined>(undefined);
  let newTabCount = 0;

  const addExisting = (entities: readonly T[]) =>
    tabs.update((current) => [
      ...current,
      ...entities
        .filter((entity) => !current.some((tab) => tab.id === entity.id))
        .map((entity) => ({ id: entity.id, label: entityLabel(entity), entity })),
    ]);

  const addNew = () => {
    newTabCount += 1;
    const id = `new-${newTabCount}`;
    tabs.update((current) => [
      ...current,
      { id, label: `New ${entityName()} ${newTabCount}`, entity: undefined },
    ]);
    activeId.set(id);
  };

  const close = (id: string) => {
    const current = tabs();
    const closedIndex = current.findIndex((tab) => tab.id === id);
    if (closedIndex === -1) {
      return;
    }
    const remaining = current.filter((tab) => tab.id !== id);
    if (activeId() === id) {
      activeId.set((remaining[closedIndex] ?? remaining[closedIndex - 1])?.id);
    }
    tabs.set(remaining);
  };

  return { tabs: tabs.asReadonly(), activeId, addExisting, addNew, close };
};
