import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';

export type EditAction = 'create' | 'edit' | 'save' | 'delete';
export type EditGesture = 'press' | 'longPress';

export interface EditActionConfig {
  press?: VoidFunction;
  longPress?: VoidFunction;
  visible?: boolean;
  suggested?: boolean;
  cancel?: boolean;
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

  run(action: EditAction, gesture: EditGesture = 'press'): void {
    const config = this.actions()[action];
    (config?.[gesture] ?? config?.press)?.();
  }
}
