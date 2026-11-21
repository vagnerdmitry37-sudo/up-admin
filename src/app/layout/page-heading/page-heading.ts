import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRouteSnapshot, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

export interface PageHeadingData {
  heading: string;
  editPage?: boolean;
}

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
  private readonly navigationEnd = toSignal(
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)),
  );

  protected readonly heading = computed(() => {
    this.navigationEnd();
    const route = deepestRoute(this.router.routerState.snapshot.root);
    const data = route.data as Partial<PageHeadingData>;
    if (!data.heading) {
      return undefined;
    }
    const editingLabel = route.queryParamMap.has('ids') ? 'Edit' : 'New';
    return { title: data.heading, action: data.editPage ? editingLabel : undefined };
  });
}
