import { ChangeDetectionStrategy, Component } from '@angular/core';
import { OpenngIcons } from '@openng/optimus-ui/api';
import { ImmediateAction } from '@shared/actions/immediate-action/immediate-action';

@Component({
  selector: 'app-create-action',
  imports: [ImmediateAction],
  templateUrl: './create-action.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateAction {
  protected readonly label = 'Create';
  protected readonly icon = OpenngIcons.PLUS;
}
