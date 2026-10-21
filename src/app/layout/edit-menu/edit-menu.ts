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

@Component({
  selector: 'app-edit-menu',
  imports: [SpeedDial],
  templateUrl: './edit-menu.html',
  styleUrl: './edit-menu.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditMenu {
  private readonly editActions = inject(EditActionsService);
  private readonly dial = viewChild.required(SpeedDial);

  protected readonly open = signal(false);
  protected readonly items = computed<MenuItem[]>(() => {
    const handlers = this.editActions.handlers();
    const cancelling = this.editActions.cancelling();
    return ACTIONS.map(({ action, label, icon }) => ({
      ...(action === cancelling ? CANCEL : { label, icon }),
      visible: Boolean(handlers[action]),
      command: () => handlers[action]?.(),
    }));
  });

  protected toggle = () => this.open.update((open) => !open);

  protected keepOpen(): void {
    queueMicrotask(() => {
      if (this.open()) {
        this.dial().show();
      }
    });
  }
}
