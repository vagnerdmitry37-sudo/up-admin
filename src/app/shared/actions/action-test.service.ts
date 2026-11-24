import { DestroyRef, Injectable, inject, signal } from '@angular/core';

export type ActionName = 'create' | 'edit' | 'save' | 'delete';

export interface Action {
  run: () => unknown;
}

export type Actions = Record<ActionName, Action | null>;

@Injectable({ providedIn: 'root' })
export class ActionTestService {
  private readonly registeredActions = signal<Actions>({
    create: null,
    edit: null,
    save: null,
    delete: null,
  });

  readonly actions = this.registeredActions.asReadonly();

  register(actions: Partial<Actions>): void {
    this.registeredActions.update((current) => ({ ...current, ...actions }));
    this.clearOnDestroy(inject(DestroyRef), actions);
  }

  private clearOnDestroy(destroyRef: DestroyRef, registeredActions: Partial<Actions>): void {
    destroyRef.onDestroy(() =>
      this.registeredActions.update(
        (current) =>
          Object.fromEntries(
            Object.entries(current).map(([name, action]) => [
              name,
              action === registeredActions[name as ActionName] ? null : action,
            ]),
          ) as Actions,
      ),
    );
  }
}
