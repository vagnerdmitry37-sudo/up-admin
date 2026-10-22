import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map, startWith } from 'rxjs';

export type EditAction = 'create' | 'edit' | 'save' | 'delete';
export type EditHandlers = Partial<Record<EditAction, VoidFunction>>;

export interface RouteCancel {
  action: EditAction;
  url: string;
}

@Injectable({ providedIn: 'root' })
export class EditActionsService {
  private readonly router = inject(Router);
  private readonly stack = signal<
    { handlers: () => EditHandlers; suggested?: () => EditAction | undefined }[]
  >([]);
  private readonly routeCancel = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      startWith(null),
      map(() => this.findRouteCancel()),
    ),
    { initialValue: undefined },
  );

  readonly cancelling = computed(() => this.routeCancel()?.action);
  readonly suggested = computed(() => this.stack().at(-1)?.suggested?.());
  readonly handlers = computed<EditHandlers>(() => {
    const cancel = this.routeCancel();
    const handlers = this.stack().at(-1)?.handlers() ?? {};
    if (!cancel) {
      return handlers;
    }
    return { ...handlers, [cancel.action]: () => this.router.navigateByUrl(cancel.url) };
  });

  register(handlers: () => EditHandlers, suggested?: () => EditAction | undefined): void {
    const entry = { handlers, suggested };
    this.stack.update((stack) => [...stack, entry]);
    inject(DestroyRef).onDestroy(() =>
      this.stack.update((stack) => stack.filter((item) => item !== entry)),
    );
  }

  private findRouteCancel(): RouteCancel | undefined {
    let route = this.router.routerState.snapshot.root;
    while (route.firstChild) {
      route = route.firstChild;
    }
    return route.data['cancel'];
  }
}
