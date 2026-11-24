import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { OpenngIcons } from '@openng/optimus-ui/api';
import { Action } from '@shared/actions/action-test.service';
import { ConfirmedAction } from '@shared/actions/confirmed-action/confirmed-action';

@Component({
  selector: 'app-delete-action',
  imports: [ConfirmedAction],
  templateUrl: './delete-action.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteAction {
  readonly action = input.required<Action>();

  protected readonly label = 'Delete';
  protected readonly icon = OpenngIcons.TRASH;
}
