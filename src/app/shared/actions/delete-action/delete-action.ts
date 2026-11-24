import { ChangeDetectionStrategy, Component } from '@angular/core';
import { OpenngIcons } from '@openng/optimus-ui/api';
import { ConfirmedAction } from '@shared/actions/confirmed-action/confirmed-action';

@Component({
  selector: 'app-delete-action',
  imports: [ConfirmedAction],
  templateUrl: './delete-action.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteAction {
  protected readonly label = 'Delete';
  protected readonly icon = OpenngIcons.TRASH;
}
