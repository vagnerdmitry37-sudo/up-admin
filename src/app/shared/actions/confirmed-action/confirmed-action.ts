import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ActionButton } from '@shared/actions/action-button/action-button';

@Component({
  selector: 'app-confirmed-action',
  imports: [ActionButton],
  templateUrl: './confirmed-action.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmedAction {
  readonly label = input.required<string>();
  readonly icon = input.required<string>();
}
