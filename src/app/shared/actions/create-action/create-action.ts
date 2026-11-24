import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { OpenngIcons } from '@openng/optimus-ui/api';
import { Action } from '@shared/actions/action-test.service';
import { ImmediateAction } from '@shared/actions/immediate-action/immediate-action';

@Component({
  selector: 'app-create-action',
  imports: [ImmediateAction],
  templateUrl: './create-action.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateAction {
  readonly action = input.required<Action>();

  protected readonly label = 'Create';
  protected readonly icon = OpenngIcons.PLUS;
}
