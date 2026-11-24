import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { OpenngIcons } from '@openng/optimus-ui/api';
import { Action } from '@shared/actions/action-test.service';
import { ImmediateAction } from '@shared/actions/immediate-action/immediate-action';

@Component({
  selector: 'app-edit-action',
  imports: [ImmediateAction],
  templateUrl: './edit-action.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditAction {
  readonly action = input.required<Action>();

  protected readonly label = 'Edit';
  protected readonly icon = OpenngIcons.PENCIL;
}
