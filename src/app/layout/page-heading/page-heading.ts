import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRouteSnapshot, NavigationEnd, Router } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { AppRouteData } from '../../app.routes';

const deepestRoute = (route: ActivatedRouteSnapshot): ActivatedRouteSnapshot =>
  route.firstChild ? deepestRoute(route.firstChild) : route;

@Component({
  selector: 'app-page-heading',
  templateUrl: './page-heading.html',
  styleUrl: './page-heading.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageHeading {
  private readonly router = inject(Router);
  private readonly routeData = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      startWith(undefined),
      map(() => deepestRoute(this.router.routerState.snapshot.root).data as Partial<AppRouteData>),
    ),
    { requireSync: true },
  );

  protected readonly heading = computed(() => {
    const { heading, editPage } = this.routeData();
    return heading ? { title: heading, action: editPage ? 'Editor' : undefined } : undefined;
  });
}
