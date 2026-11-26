import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MenuItem, OpenngIcons } from '@openng/optimus-ui/api';
import { Menu } from '@openng/optimus-ui/menu';
import { SpeedMenu } from '@shared/speed-menu/speed-menu';
import { BackAction } from '@shared/actions/back-action/back-action';
import { ActionName, ActionService } from '@shared/actions/action.service';

interface ActionSlot extends MenuItem {
  name: ActionName;
}

@Component({
  selector: 'app-nav-menu',
  imports: [SpeedMenu, Menu, BackAction],
  templateUrl: './nav-menu.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavMenu {
  private readonly actions = inject(ActionService).actions;

  protected readonly openIcon = OpenngIcons.BARS;
  protected readonly closeIcon = OpenngIcons.TIMES;
  protected readonly open = signal(false);

  protected readonly slots: ActionSlot[] = [{ name: 'back' }];

  protected readonly items: MenuItem[] = [
    { label: 'Orders', icon: OpenngIcons.RECEIPT, routerLink: '/orders' },
    { label: 'Customers', icon: OpenngIcons.USERS, routerLink: '/customers' },
    { label: 'Products', icon: OpenngIcons.BOX, routerLink: '/products' },
  ].map((item) => ({ ...item, command: () => this.open.set(false) }));

  protected readonly actionOf = (name: ActionName) => this.actions()[name];
}
