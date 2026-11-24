import { ChangeDetectionStrategy, Component } from '@angular/core';
import { OpenngIcons } from '@openng/optimus-ui/api';
import { ConfirmedAction } from '@shared/actions/confirmed-action/confirmed-action';

@Component({
  selector: 'app-save-action',
  imports: [ConfirmedAction],
  templateUrl: './save-action.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SaveAction {
  protected readonly label = 'Save';
  protected readonly icon = OpenngIcons.SAVE;
}
