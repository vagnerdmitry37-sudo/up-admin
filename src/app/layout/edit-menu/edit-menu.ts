import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { EditAction, EditActionsService } from '@core/edit-actions.service';
import { MenuItem, OpenngIcons } from '@openng/optimus-ui/api';
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

const CANCEL = { label: 'Cancel', icon: OpenngIcons.TIMES_CIRCLE };
const SUGGESTED_CLASS = 'edit-menu-suggested';

@Component({
  selector: 'app-edit-menu',
  imports: [SpeedDial],
  host: { '[class.suggesting]': 'suggested() && !open()' },
  templateUrl: './edit-menu.html',
  styleUrl: './edit-menu.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditMenu {
  private readonly editActions = inject(EditActionsService);
  private readonly dial = viewChild.required(SpeedDial);
  private readonly itemCache = new Map<string, MenuItem>();

  protected readonly open = signal(false);
  protected readonly suggested = this.editActions.suggested;
  protected readonly items = computed<MenuItem[]>(() => {
    const handlers = this.editActions.handlers();
    const cancelling = this.editActions.cancelling();
    const suggested = this.suggested();
    return ACTIONS.map(({ action, label, icon }) => {
      const look = action === cancelling ? CANCEL : { label, icon };
      return this.item(
        action,
        look.label,
        action === suggested ? `${look.icon} ${SUGGESTED_CLASS}` : look.icon,
        Boolean(handlers[action]),
      );
    });
  });

  protected toggle = () => this.open.update((open) => !open);

  private item(action: EditAction, label: string, icon: string, visible: boolean): MenuItem {
    const key = `${action}|${label}|${icon}|${visible}`;
    let item = this.itemCache.get(key);
    if (!item) {
      item = { label, icon, visible, command: () => this.editActions.handlers()[action]?.() };
      this.itemCache.set(key, item);
    }
    return item;
  }

  protected keepOpen(): void {
    queueMicrotask(() => {
      if (this.open()) {
        this.dial().show();
      }
    });
  }
}
