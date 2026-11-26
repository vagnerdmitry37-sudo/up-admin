import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { SessionService } from '@core/session.service';
import { Toast } from '@openng/optimus-ui/toast';
import { Toolbar } from '@openng/optimus-ui/toolbar';
import { NavMenu } from './nav-menu/nav-menu';
import { PageHeading } from './page-heading/page-heading';
import { ActionMenuTest } from './action-menu-test/action-menu-test';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, Toolbar, NavMenu, PageHeading, Toast, ActionMenuTest],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Shell {
  private readonly router = inject(Router);
  private readonly sessionService = inject(SessionService);

  protected readonly messageLife = 8000;

  protected async logout(): Promise<void> {
    await this.sessionService.logout();
    await this.router.navigateByUrl('/login');
  }
}
