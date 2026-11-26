import { Router } from '@angular/router';
import { MenuItem } from '@openng/optimus-ui/api';

export const navItems = (router: Router): MenuItem[] =>
  router.config
    .flatMap((route) => route.children ?? [])
    .filter((route) => route.data?.['menu'] === true)
    .map((route) => ({
      label: route.title as string,
      icon: route.data?.['icon'],
      routerLink: `/${route.path}`,
    }));
