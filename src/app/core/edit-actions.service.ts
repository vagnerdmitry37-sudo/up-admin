import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map, startWith } from 'rxjs';

export type EditAction = 'create' | 'edit' | 'save' | 'delete' | 'cancel';
export type EditHandlers = Partial<Record<EditAction, VoidFunction>>;

@Injectable({ providedIn: 'root' })
export class EditActionsService {
  private readonly router = inject(Router);
  private readonly stack = signal<{ handlers: () => EditHandlers }[]>([]);
  private readonly cancelUrl = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      startWith(null),
      map(() => this.routeCancelUrl()),
    ),
    { initialValue: undefined },
  );

  readonly handlers = computed<EditHandlers>(() => {
    const cancelUrl = this.cancelUrl();
    return {
      ...(cancelUrl && { cancel: () => this.router.navigateByUrl(cancelUrl) }),
      ...this.stack().at(-1)?.handlers(),
    };
  });

  register(handlers: () => EditHandlers): void {
    const entry = { handlers };
    this.stack.update((stack) => [...stack, entry]);
    inject(DestroyRef).onDestroy(() =>
      this.stack.update((stack) => stack.filter((item) => item !== entry)),
    );
  }

  private routeCancelUrl(): string | undefined {
    let route = this.router.routerState.snapshot.root;
    while (route.firstChild) {
      route = route.firstChild;
    }
    return route.data['cancel'];
  }
}
