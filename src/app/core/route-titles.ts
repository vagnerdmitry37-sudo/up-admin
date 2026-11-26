import { ActivatedRouteSnapshot } from '@angular/router';

export const routeTitles = (root: ActivatedRouteSnapshot): string[] => {
  const titles: string[] = [];
  for (let route: ActivatedRouteSnapshot | null = root; route; route = route.firstChild) {
    const ownTitle = route.routeConfig?.title;
    if (typeof ownTitle === 'string') titles.push(ownTitle);
  }
  return titles;
};
