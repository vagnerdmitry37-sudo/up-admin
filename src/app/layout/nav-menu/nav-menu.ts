import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MenuItem, OpenngIcons } from '@openng/optimus-ui/api';
import { ButtonDirective, ButtonIcon } from '@openng/optimus-ui/button';
import { Menu } from '@openng/optimus-ui/menu';

@Component({
  selector: 'app-nav-menu',
  imports: [ButtonDirective, ButtonIcon, Menu],
  templateUrl: './nav-menu.html',
  styleUrl: './nav-menu.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavMenu {
  protected readonly open = signal(false);
  protected readonly items: MenuItem[] = [
    { label: 'Orders', icon: OpenngIcons.RECEIPT, routerLink: '/orders' },
    { label: 'Products', icon: OpenngIcons.BOX, routerLink: '/products' },
    { label: 'Profile', icon: OpenngIcons.USER, routerLink: '/profile' },
  ].map((item) => ({ ...item, command: () => this.open.set(false) }));

  protected toggle(menu: Menu, event: MouseEvent): void {
    this.open.update((open) => !open);
    menu.toggle(event);
  }
}
