import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SpeedDial } from '@openng/optimus-ui/speeddial';
import { AppMotion } from '@shared/motion/motion';
import { CreateAction } from '@shared/actions/create-action/create-action';
import { EditAction } from '@shared/actions/edit-action/edit-action';
import { SaveAction } from '@shared/actions/save-action/save-action';
import { DeleteAction } from '@shared/actions/delete-action/delete-action';
import { ActionName, ActionService } from '@shared/actions/action.service';

interface ActionSlot {
  name: ActionName;
}

@Component({
  selector: 'app-action-menu',
  imports: [SpeedDial, AppMotion, CreateAction, EditAction, DeleteAction, SaveAction],
  templateUrl: './action-menu.html',
  styleUrl: './action-menu.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActionMenu {
  private readonly actions = inject(ActionService).actions;

  protected readonly slots: ActionSlot[] = [
    { name: 'create' },
    { name: 'edit' },
    { name: 'save' },
    { name: 'delete' },
  ];

  protected readonly actionOf = (name: ActionName) => this.actions()[name];
}
