import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { MenuAction, ActionMenuService } from '@core/action-menu.service';
import { ActionTrigger, ActionTriggerKind } from '@shared/action-trigger/action-trigger';
import { MenuItem, OpenngIcons } from '@openng/optimus-ui/api';
import { ButtonDirective, ButtonIcon } from '@openng/optimus-ui/button';
import { Ripple } from '@openng/optimus-ui/ripple';
import { SpeedDial } from '@openng/optimus-ui/speeddial';
import { ProgressRing } from '@shared/progress-ring/progress-ring';
import { AppMotion } from '@shared/motion/motion';

interface ActionDefinition {
  label: string;
  icon: string;
  trigger: ActionTriggerKind;
}

const ACTIONS: Record<MenuAction, ActionDefinition> = {
  create: { label: 'Create', icon: OpenngIcons.PLUS, trigger: 'click' },
  edit: { label: 'Edit', icon: OpenngIcons.PENCIL, trigger: 'click' },
  save: { label: 'Save', icon: OpenngIcons.SAVE, trigger: 'hold' },
  delete: { label: 'Delete', icon: OpenngIcons.TRASH, trigger: 'hold' },
};

const ACTION_ORDER = Object.keys(ACTIONS) as MenuAction[];

interface ActionMenuItem {
  action: MenuAction;
  label: string;
  icon: string;
  visible: boolean;
}

const SUGGESTED_CLASS = 'action-menu-suggested';

@Component({
  selector: 'app-action-menu',
  imports: [SpeedDial, ButtonDirective, ButtonIcon, Ripple, AppMotion, ActionTrigger, ProgressRing],
  host: { '[class.suggesting]': 'suggested().length > 0 && !open()' },
  templateUrl: './action-menu.html',
  styleUrl: './action-menu.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActionMenu {
  private readonly actionMenuService = inject(ActionMenuService);
  private readonly dial = viewChild(SpeedDial);
  private readonly itemCache = new Map<string, MenuItem>();

  protected readonly open = signal(false);
  protected readonly suggested = this.actionMenuService.suggested;
  protected readonly hasActions = computed(
    () => Object.keys(this.actionMenuService.actions()).length > 0,
  );
  protected readonly items = computed<MenuItem[]>(() => {
    const actions = this.actionMenuService.actions();
    const suggested = this.suggested();
    return ACTION_ORDER.map((action) => {
      const { label, icon } = ACTIONS[action];
      return this.item({
        action,
        label,
        icon: suggested.includes(action) ? `${icon} ${SUGGESTED_CLASS}` : icon,
        visible: Boolean(actions[action]),
      });
    });
  });

  private availableActions = new Set<string>();

  constructor() {
    effect(() => {
      const availableActions = Object.keys(this.actionMenuService.actions());
      if (availableActions.length === 0) {
        this.open.set(false);
      } else if (availableActions.some((action) => !this.availableActions.has(action))) {
        this.open.set(true);
      }
      this.availableActions = new Set(availableActions);
    });
  }

  protected toggle = () => this.open.update((open) => !open);

  protected triggerOf = (action: MenuAction) => ACTIONS[action].trigger;

  protected runAction = (action: MenuAction) => this.actionMenuService.run(action);

  private item({ action, label, icon, visible }: ActionMenuItem): MenuItem {
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
