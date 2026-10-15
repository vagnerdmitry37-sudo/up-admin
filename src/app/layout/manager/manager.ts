import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MenuItem, OpenngIcons } from '@openng/optimus-ui/api';
import { ButtonDirective, ButtonIcon } from '@openng/optimus-ui/button';
import { Menu } from '@openng/optimus-ui/menu';

@Component({
  selector: 'app-manager',
  imports: [ButtonDirective, ButtonIcon, Menu],
  templateUrl: './manager.html',
  styleUrl: './manager.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Manager {
  protected readonly open = signal(false);
  protected readonly items: MenuItem[] = [
    { label: 'Orders', icon: OpenngIcons.RECEIPT, routerLink: '/orders' },
    { label: 'Settings', icon: OpenngIcons.COG, routerLink: '/settings' },
  ].map((item) => ({ ...item, command: () => this.open.set(false) }));

  protected toggle(menu: Menu, event: MouseEvent): void {
    this.open.update((open) => !open);
    menu.toggle(event);
  }
}
