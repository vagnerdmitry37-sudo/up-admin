import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';

export type MenuAction = 'create' | 'edit' | 'save' | 'delete';

export interface MenuActionConfig {
  click?: () => unknown;
  visible?: boolean;
  suggested?: boolean;
}

export type MenuActions = Partial<Record<MenuAction, MenuActionConfig>>;

export interface MenuActionsRegistration {
  actions: () => MenuActions;
}

@Injectable({ providedIn: 'root' })
export class ActionMenuService {
  private readonly stack = signal<MenuActionsRegistration[]>([]);
  private readonly running = signal<MenuAction | undefined>(undefined);

  readonly runningAction = this.running.asReadonly();
  readonly actions = computed(() => {
    const running = this.running();
    return Object.fromEntries(
      this.stack().flatMap((registration) =>
        Object.entries(registration.actions()).filter(
          ([action, config]) => config.visible !== false || action === running,
        ),
      ),
    ) as MenuActions;
  });
  readonly suggested = computed(() =>
    Object.entries(this.actions())
      .filter(([, config]) => config.suggested)
      .map(([action]) => action as MenuAction),
  );

  register(registration: MenuActionsRegistration): void {
    this.stack.update((stack) => [...stack, registration]);
    inject(DestroyRef).onDestroy(() =>
      this.stack.update((stack) => stack.filter((item) => item !== registration)),
    );
  }

  async run(action: MenuAction): Promise<void> {
    const click = this.actions()[action]?.click;
    if (!click || this.running()) {
      return;
    }
    this.running.set(action);
    try {
      await click();
    } finally {
      this.running.set(undefined);
    }
  }
}
