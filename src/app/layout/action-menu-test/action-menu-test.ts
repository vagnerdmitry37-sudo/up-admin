import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SpeedDial } from '@openng/optimus-ui/speeddial';
import { AppMotion } from '@shared/motion/motion';
import { CreateAction } from '@shared/actions/create-action/create-action';
import { EditAction } from '@shared/actions/edit-action/edit-action';
import { SaveAction } from '@shared/actions/save-action/save-action';
import { DeleteAction } from '@shared/actions/delete-action/delete-action';
import { ActionTestService } from '@shared/actions/action-test.service';

@Component({
  selector: 'app-action-menu-test',
  imports: [SpeedDial, AppMotion, CreateAction, EditAction, DeleteAction, SaveAction],
  templateUrl: './action-menu-test.html',
  styleUrl: './action-menu-test.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActionMenuTest {
  protected readonly actions = inject(ActionTestService).actions.asReadonly();
}
