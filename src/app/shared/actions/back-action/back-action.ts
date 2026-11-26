import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { OpenngIcons } from '@openng/optimus-ui/api';
import { Action } from '@shared/actions/action.service';
import { ImmediateAction } from '@shared/actions/immediate-action/immediate-action';

@Component({
  selector: 'app-back-action',
  imports: [ImmediateAction],
  templateUrl: './back-action.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BackAction {
  readonly action = input.required<Action>();

  protected readonly label = 'Back';
  protected readonly icon = OpenngIcons.ARROW_LEFT;
}
