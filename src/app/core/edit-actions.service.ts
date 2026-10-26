import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';

export type EditAction = 'create' | 'edit' | 'save' | 'delete';

export interface EditActionConfig {
  click?: VoidFunction;
  visible?: boolean;
  suggested?: boolean;
}

export type EditActions = Partial<Record<EditAction, EditActionConfig>>;

export interface EditActionsRegistration {
  actions: () => EditActions;
}

@Injectable({ providedIn: 'root' })
export class EditActionsService {
  private readonly stack = signal<EditActionsRegistration[]>([]);

  readonly actions = computed(() => {
    const registered = this.stack().at(-1)?.actions() ?? {};
    return Object.fromEntries(
      Object.entries(registered).filter(([, config]) => config.visible !== false),
    ) as EditActions;
  });
  readonly suggested = computed(() =>
    Object.entries(this.actions())
      .filter(([, config]) => config.suggested)
      .map(([action]) => action as EditAction),
  );

  register(registration: EditActionsRegistration): void {
    this.stack.update((stack) => [...stack, registration]);
    inject(DestroyRef).onDestroy(() =>
      this.stack.update((stack) => stack.filter((item) => item !== registration)),
    );
  }

  run = (action: EditAction) => this.actions()[action]?.click?.();
}
