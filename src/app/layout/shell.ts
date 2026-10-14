import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { SessionService } from '@core/session.service';
import { Toolbar } from '@openng/optimus-ui/toolbar';
import { Button } from '@openng/optimus-ui/button';
import { Manager } from './manager/manager';

@Component({
  selector: 'app-shell',
  imports: [RouterLink, RouterOutlet, Toolbar, Manager, Button],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Shell {
  private readonly router = inject(Router);
  private readonly session = inject(SessionService);

  protected async logout(): Promise<void> {
    await this.session.logout();
    await this.router.navigateByUrl('/login');
  }
}
