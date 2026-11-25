import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { OpenngIcons } from '@openng/optimus-ui/api';
import { Action } from '@shared/actions/action.service';
import { ConfirmedAction } from '@shared/actions/confirmed-action/confirmed-action';

@Component({
  selector: 'app-save-action',
  imports: [ConfirmedAction],
  templateUrl: './save-action.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SaveAction {
  readonly action = input.required<Action>();

  protected readonly label = 'Save';
  protected readonly icon = OpenngIcons.SAVE;
}
