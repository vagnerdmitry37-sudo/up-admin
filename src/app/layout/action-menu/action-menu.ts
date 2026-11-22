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

const ACTIONS: Record<EditAction, ActionDefinition> = {
  create: { label: 'Create', icon: OpenngIcons.PLUS, trigger: 'click' },
  edit: { label: 'Edit', icon: OpenngIcons.PENCIL, trigger: 'click' },
  save: { label: 'Save', icon: OpenngIcons.SAVE, trigger: 'hold' },
  delete: { label: 'Delete', icon: OpenngIcons.TRASH, trigger: 'hold' },
};

const ACTION_ORDER = Object.keys(ACTIONS) as EditAction[];

interface MenuAction {
  action: EditAction;
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
      const availableActions = Object.keys(this.editActionsService.actions());
      if (availableActions.length === 0) {
        this.open.set(false);
      } else if (availableActions.some((action) => !this.availableActions.has(action))) {
        this.open.set(true);
      }
      this.availableActions = new Set(availableActions);
    });
  }

  protected toggle = () => this.open.update((open) => !open);

  protected triggerOf = (action: EditAction) => ACTIONS[action].trigger;

  protected isRunning = (action: EditAction) => this.editActionsService.runningAction() === action;

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
