import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { SessionService } from '@core/session.service';
import { ConfirmDialog } from '@openng/optimus-ui/confirmdialog';
import { Toast } from '@openng/optimus-ui/toast';
import { Toolbar } from '@openng/optimus-ui/toolbar';
import { EditMenu } from './edit-menu/edit-menu';
import { NavMenu } from './nav-menu/nav-menu';
import { PageHeading } from './page-heading/page-heading';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, Toolbar, NavMenu, PageHeading, EditMenu, ConfirmDialog, Toast],
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
