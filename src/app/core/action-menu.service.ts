import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Activity, ActivityEntity, HttpActivity } from '@core/http-activity.service';

export type MenuAction = 'create' | 'edit' | 'save' | 'delete';

export type ActionStatus = 'running' | 'succeeded' | 'failed';

export type ActionResult = Exclude<ActionStatus, 'running'>;

export const MINIMUM_SPINNER_DURATION_MS = 1000;

export const RESULT_DURATION_MS = 1500;

const REQUEST_ACTIONS: ReadonlySet<string> = new Set<MenuAction>(['save', 'delete']);

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
  private readonly statuses = signal<Partial<Record<MenuAction, ActionStatus>>>({});
  private readonly startTimes = new Map<number, number>();
  private readonly statusTimers = new Map<MenuAction, ReturnType<typeof setTimeout>>();

  private readonly results = signal<Partial<Record<MenuAction, ActionResult>>>({});

  readonly status = this.statuses.asReadonly();
  readonly lastResult = this.results.asReadonly();

  private readonly registeredActions = computed(
    () =>
      Object.fromEntries(
        this.stack().flatMap((registration) =>
          Object.entries(registration.actions())
            .filter(
              ([action, config]) =>
                config.visible !== false ||
                this.httpActivity.isRunning({ source: 'action-menu', operation: action }) ||
                this.statuses()[action as MenuAction] !== undefined,
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

  private readonly statusRunning = computed(() =>
    Object.values(this.statuses()).includes('running'),
  );

  constructor() {
    this.httpActivity
      .on({ kind: 'operation', source: 'action-menu' })
      .pipe(takeUntilDestroyed())
      .subscribe(this.followActivity);
  }

  register(registration: MenuActionsRegistration): void {
    this.stack.update((stack) => [...stack, registration]);
    inject(DestroyRef).onDestroy(() =>
      this.stack.update((stack) => stack.filter((item) => item !== registration)),
    );
  }

  async run(action: MenuAction): Promise<void> {
    const registered = this.registeredActions()[action];
    const click = registered?.config.click;
    if (
      !registered ||
      !click ||
      registered.config.visible === false ||
      this.statusRunning() ||
      this.httpActivity.isRunning({ source: 'action-menu' })
    ) {
      return;
    }
    await this.httpActivity.track(
      { entity: registered.entity, operation: action, source: 'action-menu' },
      click,
    );
  }

  private readonly followActivity = (activity: Activity) => {
    const action = activity.operation as MenuAction | undefined;
    if (!action || !REQUEST_ACTIONS.has(action)) {
      return;
    }
    if (activity.status === 'running') {
      this.startTimes.set(activity.id, Date.now());
      this.setStatus(action, 'running');
      return;
    }
    const startedAt = this.startTimes.get(activity.id) ?? Date.now();
    this.startTimes.delete(activity.id);
    const remainingSpinnerTime = Math.max(
      0,
      MINIMUM_SPINNER_DURATION_MS - (Date.now() - startedAt),
    );
    this.schedule(action, remainingSpinnerTime, () => {
      if (activity.status === 'cancelled') {
        this.setStatus(action, undefined);
        return;
      }
      const result: ActionResult = activity.status === 'succeeded' ? 'succeeded' : 'failed';
      this.results.update((results) => ({ ...results, [action]: result }));
      this.setStatus(action, result);
      this.schedule(action, RESULT_DURATION_MS, () => this.setStatus(action, undefined));
    });
  };

  private readonly schedule = (action: MenuAction, delay: number, work: () => void) => {
    this.statusTimers.set(
      action,
      setTimeout(() => {
        this.statusTimers.delete(action);
        work();
      }, delay),
    );
  };

  private readonly setStatus = (action: MenuAction, status: ActionStatus | undefined) => {
    clearTimeout(this.statusTimers.get(action));
    this.statusTimers.delete(action);
    this.statuses.update((statuses) => {
      const next = { ...statuses, [action]: status };
      if (!status) {
        delete next[action];
      }
      return next;
    });
  };
}
