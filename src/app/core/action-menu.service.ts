import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { ActivityEntity, HttpActivity } from '@core/http-activity.service';

export type MenuAction = 'create' | 'edit' | 'save' | 'delete';

export interface MenuActionConfig {
  click?: () => unknown;
  visible?: boolean;
  suggested?: boolean;
}

export type MenuActions = Partial<Record<MenuAction, MenuActionConfig>>;

export interface MenuActionsRegistration {
  entity: () => ActivityEntity;
  actions: () => MenuActions;
}

interface RegisteredAction {
  entity: ActivityEntity;
  config: MenuActionConfig;
}

@Injectable({ providedIn: 'root' })
export class ActionMenuService {
  private readonly httpActivity = inject(HttpActivity);
  private readonly stack = signal<MenuActionsRegistration[]>([]);

  private readonly registeredActions = computed(
    () =>
      Object.fromEntries(
        this.stack().flatMap((registration) =>
          Object.entries(registration.actions())
            .filter(
              ([action, config]) =>
                config.visible !== false ||
                this.httpActivity.isRunning({ source: 'action-menu', operation: action }),
            )
            .map(([action, config]) => [action, { entity: registration.entity(), config }]),
        ),
      ) as Partial<Record<MenuAction, RegisteredAction>>,
  );

  readonly actions = computed(
    () =>
      Object.fromEntries(
        Object.entries(this.registeredActions()).map(([action, { config }]) => [action, config]),
      ) as MenuActions,
  );
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
    const registered = this.registeredActions()[action];
    const click = registered?.config.click;
    if (!registered || !click || this.httpActivity.isRunning({ source: 'action-menu' })) {
      return;
    }
    await this.httpActivity.track(
      { entity: registered.entity, operation: action, source: 'action-menu' },
      click,
    );
  }
}
