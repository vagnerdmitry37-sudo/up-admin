import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ActionButton } from '@shared/actions/action-button/action-button';
import { Action } from '@shared/actions/action-test.service';

@Component({
  selector: 'app-immediate-action',
  imports: [ActionButton],
  templateUrl: './immediate-action.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImmediateAction {
  readonly label = input.required<string>();
  readonly icon = input.required<string>();
  readonly action = input.required<Action>();

  protected readonly handleClick = () => this.action().run();
}
