import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { EditAction, EditActionsService } from '@core/edit-actions.service';
import { MenuItem, OpenngIcons } from '@openng/optimus-ui/api';
import { ButtonDirective, ButtonIcon } from '@openng/optimus-ui/button';
import { Ripple } from '@openng/optimus-ui/ripple';
import { SpeedDial } from '@openng/optimus-ui/speeddial';

interface Action {
  action: EditAction;
  label: string;
  icon: string;
}

const ACTIONS: Action[] = [
  { action: 'create', label: 'Create', icon: OpenngIcons.PLUS },
  { action: 'edit', label: 'Edit', icon: OpenngIcons.PENCIL },
  { action: 'save', label: 'Save', icon: OpenngIcons.SAVE },
  { action: 'delete', label: 'Delete', icon: OpenngIcons.TRASH },
];

interface MenuAction extends Action {
  visible: boolean;
}

const SUGGESTED_CLASS = 'edit-menu-suggested';

@Component({
  selector: 'app-edit-menu',
  imports: [SpeedDial, ButtonDirective, ButtonIcon, Ripple],
  host: { '[class.suggesting]': 'suggested().length > 0 && !open()' },
  templateUrl: './edit-menu.html',
  styleUrl: './edit-menu.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditMenu {
  private readonly editActionsService = inject(EditActionsService);
  private readonly dial = viewChild(SpeedDial);
  private readonly itemCache = new Map<string, MenuItem>();

  protected readonly open = signal(false);
  protected readonly suggested = this.editActionsService.suggested;
  protected readonly hasActions = computed(
    () => Object.keys(this.editActionsService.actions()).length > 0,
  );
  protected readonly items = computed<MenuItem[]>(() => {
    const actions = this.editActionsService.actions();
    const suggested = this.suggested();
    return ACTIONS.map(({ action, label, icon }) =>
      this.item({
        action,
        label,
        icon: suggested.includes(action) ? `${icon} ${SUGGESTED_CLASS}` : icon,
        visible: Boolean(actions[action]),
      }),
    );
  });

  constructor() {
    effect(() => {
      if (!this.hasActions()) {
        this.open.set(false);
      }
    });
  }

  protected toggle = () => this.open.update((open) => !open);

  protected runAction = (action: EditAction) => this.editActionsService.run(action);

  private item({ action, label, icon, visible }: MenuAction): MenuItem {
    const key = `${action}|${label}|${icon}|${visible}`;
    let item = this.itemCache.get(key);
    if (!item) {
      item = {
        id: action,
        label,
        icon,
        visible,
      };
      this.itemCache.set(key, item);
    }
    return item;
  }

  protected keepOpen(): void {
    queueMicrotask(() => {
      if (this.open()) {
        this.dial()?.show();
      }
    });
  }
}
