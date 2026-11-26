import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MenuItem, OpenngIcons } from '@openng/optimus-ui/api';
import { Menu } from '@openng/optimus-ui/menu';
import { SpeedMenu } from '@shared/speed-menu/speed-menu';
import { BackAction } from '@shared/actions/back-action/back-action';
import { ActionName, ActionService } from '@shared/actions/action.service';
import { Router } from '@angular/router';
import { navItems } from './nav-items';
import { currentItem } from './current-item';

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
  private readonly router = inject(Router);

  protected readonly openIcon = OpenngIcons.BARS;
  protected readonly closeIcon = OpenngIcons.TIMES;
  protected readonly open = signal(false);

  protected readonly slots: ActionSlot[] = [{ name: 'back' }];

  protected readonly items: MenuItem[] = navItems(this.router).map((item) => ({
    ...item,
    command: () => this.open.set(false),
  }));

  private readonly current = currentItem(this.router, this.items);

  protected readonly actionOf = (name: ActionName) => this.actions()[name];
  protected readonly icon = computed(() => {
    const currentItemIcon = this.current()?.icon || OpenngIcons.QUESTION_CIRCLE;
    return this.open() ? OpenngIcons.TIMES : currentItemIcon;
  });
}
