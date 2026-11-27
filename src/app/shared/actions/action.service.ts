import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';

export type ActionName = 'create' | 'edit' | 'save' | 'delete' | 'back';

export interface Action {
  run: () => unknown;
  disabled?: () => boolean;
  loading?: () => boolean;
}

export type Actions = Partial<Record<ActionName, Action | null>>;

export type ActionLayer = () => Actions;

@Injectable({ providedIn: 'root' })
export class ActionService {
  private readonly layers = signal<ActionLayer[]>([]);

  readonly actions = computed<Actions>(() =>
    Object.assign({}, ...this.layers().map((layer) => layer())),
  );

  register(layer: ActionLayer): void {
    this.layers.update((layers) => [...layers, layer]);
    inject(DestroyRef).onDestroy(() =>
      this.layers.update((layers) => layers.filter((registered) => registered !== layer)),
    );
  }
}
