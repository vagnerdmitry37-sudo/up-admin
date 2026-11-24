import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ActionButton } from '@shared/actions/action-button/action-button';

@Component({
  selector: 'app-immediate-action',
  imports: [ActionButton],
  templateUrl: './immediate-action.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImmediateAction {
  readonly label = input.required<string>();
  readonly icon = input.required<string>();

  readonly triggered = output<void>();

  protected readonly handleClick = () => this.triggered.emit();
}
