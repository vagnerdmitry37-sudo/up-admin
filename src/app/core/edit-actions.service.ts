import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map, startWith } from 'rxjs';

export type EditAction = 'create' | 'edit' | 'save' | 'delete';
export type EditGesture = 'press' | 'longPress';

export interface EditActionConfig {
  press?: VoidFunction;
  longPress?: VoidFunction;
  visible?: boolean;
  suggested?: boolean;
}

export type EditActions = Partial<Record<EditAction, EditActionConfig>>;

export interface RouteCancel {
  action: EditAction;
  url: string;
}

export interface EditActionsRegistration {
  actions: () => EditActions;
}

@Injectable({ providedIn: 'root' })
export class EditActionsService {
  private readonly router = inject(Router);
  private readonly stack = signal<EditActionsRegistration[]>([]);
  private readonly routeCancel = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      startWith(null),
      map(() => this.findRouteCancel()),
    ),
    { initialValue: undefined },
  );

  readonly cancelling = computed(() => this.routeCancel()?.action);
  readonly actions = computed(() => {
    const cancel = this.routeCancel();
    const registered = this.stack().at(-1)?.actions() ?? {};
    const actions: EditActions = cancel
      ? { ...registered, [cancel.action]: { press: () => this.router.navigateByUrl(cancel.url) } }
      : registered;
    return Object.fromEntries(
      Object.entries(actions).filter(([, config]) => config.visible !== false),
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

  private findRouteCancel(): RouteCancel | undefined {
    let route = this.router.routerState.snapshot.root;
    while (route.firstChild) {
      route = route.firstChild;
    }
    return route.data['cancel'];
  }
}
