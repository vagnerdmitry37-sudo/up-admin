import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { HttpActivity } from '@core/http-activity.service';
import { MenuItem, OpenngIcons } from '@openng/optimus-ui/api';
import { ButtonDirective, ButtonIcon } from '@openng/optimus-ui/button';
import { Menu } from '@openng/optimus-ui/menu';
import { ProgressRing } from '@shared/progress-ring/progress-ring';

@Component({
  selector: 'app-nav-menu',
  imports: [ButtonDirective, ButtonIcon, Menu, ProgressRing],
  templateUrl: './nav-menu.html',
  styleUrl: './nav-menu.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavMenu {
  private readonly httpActivity = inject(HttpActivity);
  protected readonly open = signal(false);
  protected readonly busy = computed(() => this.httpActivity.isRunning({ kind: 'request' }));
  protected readonly items: MenuItem[] = [
    { label: 'Orders', icon: OpenngIcons.RECEIPT, routerLink: '/orders' },
    { label: 'Customers', icon: OpenngIcons.USERS, routerLink: '/customers' },
    { label: 'Products', icon: OpenngIcons.BOX, routerLink: '/products' },
  ].map((item) => ({ ...item, command: () => this.open.set(false) }));

  protected toggle(menu: Menu, event: MouseEvent): void {
    this.open.update((open) => !open);
    menu.toggle(event);
  }
}
