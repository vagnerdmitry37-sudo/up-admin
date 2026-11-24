import { ChangeDetectionStrategy, Component } from '@angular/core';
import { OpenngIcons } from '@openng/optimus-ui/api';
import { ImmediateAction } from '@shared/actions/immediate-action/immediate-action';

@Component({
  selector: 'app-edit-action',
  imports: [ImmediateAction],
  templateUrl: './edit-action.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditAction {
  protected readonly label = 'Edit';
  protected readonly icon = OpenngIcons.PENCIL;
}
