import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { routeTitles } from '@core/route-titles';

@Component({
  selector: 'app-page-heading',
  templateUrl: './page-heading.html',
  styleUrl: './page-heading.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageHeading {
  private readonly router = inject(Router);

  protected readonly headings = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      startWith(undefined),
      map(() => routeTitles(this.router.routerState.snapshot.root)),
    ),
    { requireSync: true },
  );
}
