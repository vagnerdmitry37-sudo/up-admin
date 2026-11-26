import { computed, inject, provideAppInitializer } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { ActionService } from '@shared/actions/action.service';

const titledRoutes = (root: ActivatedRoute): ActivatedRoute[] => {
  const routes: ActivatedRoute[] = [];
  for (let route: ActivatedRoute | null = root; route; route = route.firstChild) {
    if (typeof route.routeConfig?.title === 'string') routes.push(route);
  }
  return routes;
};

export const provideBackAction = () =>
  provideAppInitializer(() => {
    const router = inject(Router);
    const routes = toSignal(
      router.events.pipe(
        filter((event) => event instanceof NavigationEnd),
        startWith(undefined),
        map(() => titledRoutes(router.routerState.root)),
      ),
      { requireSync: true },
    );
    const back = computed(() => {
      const current = routes();
      const deepest = current.at(-1);
      return current.length > 1 && deepest
        ? { run: () => router.navigate(['..'], { relativeTo: deepest }) }
        : null;
    });
    inject(ActionService).register(() => ({ back: back() }));
  });
