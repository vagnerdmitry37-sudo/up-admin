import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ButtonDirective } from '@openng/optimus-ui/button';
import { Ripple } from '@openng/optimus-ui/ripple';
import { ButtonRing } from '@shared/button-ring/button-ring';

@Component({
  selector: 'app-action-button',
  imports: [ButtonDirective, Ripple, ButtonRing],
  templateUrl: './action-button.html',
  styleUrl: './action-button.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActionButton {
  readonly label = input.required<string>();
  readonly icon = input.required<string>();
  readonly disabled = input(false);
  readonly loading = input(false);

  readonly pressed = output<void>();
}
