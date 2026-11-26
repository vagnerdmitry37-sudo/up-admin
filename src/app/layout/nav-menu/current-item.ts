import { computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationStart, Router } from '@angular/router';
import { MenuItem } from '@openng/optimus-ui/api';
import { filter, map } from 'rxjs';

export const currentItem = (router: Router, items: MenuItem[]) => {
  const currentUrl = toSignal(
    router.events.pipe(
      filter((event) => event instanceof NavigationStart),
      map((event) => event.url),
    ),
    { initialValue: router.url },
  );

  return computed(() => items.find((item) => currentUrl().startsWith(item.routerLink as string)));
};
