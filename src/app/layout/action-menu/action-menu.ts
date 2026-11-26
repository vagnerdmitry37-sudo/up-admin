import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MenuItem, OpenngIcons } from '@openng/optimus-ui/api';
import { SpeedMenu } from '@shared/speed-menu/speed-menu';
import { CreateAction } from '@shared/actions/create-action/create-action';
import { EditAction } from '@shared/actions/edit-action/edit-action';
import { SaveAction } from '@shared/actions/save-action/save-action';
import { DeleteAction } from '@shared/actions/delete-action/delete-action';
import { ActionName, ActionService } from '@shared/actions/action.service';

interface ActionSlot extends MenuItem {
  name: ActionName;
}

@Component({
  selector: 'app-action-menu',
  imports: [SpeedMenu, CreateAction, EditAction, DeleteAction, SaveAction],
  templateUrl: './action-menu.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActionMenu {
  private readonly actions = inject(ActionService).actions;

  protected readonly openIcon = OpenngIcons.PLUS;
  protected readonly closeIcon = OpenngIcons.TIMES;
  protected readonly actionsVisible = signal(true);

  protected readonly slots: ActionSlot[] = [
    { name: 'create' },
    { name: 'edit' },
    { name: 'save' },
    { name: 'delete' },
  ];

  protected readonly actionOf = (name: ActionName) => this.actions()[name];

  protected readonly toggle = () => this.actionsVisible.update((visible) => !visible);
}
