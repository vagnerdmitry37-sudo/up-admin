import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';
import { Button as OptimusButton } from '@openng/optimus-ui/button';

@Component({
  selector: 'app-button',
  imports: [OptimusButton],
  templateUrl: './button.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppButton {
  readonly label = input.required<string>();
  readonly icon = input<string>();
  readonly type = input<'button' | 'submit'>('button');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly loading = input(false, { transform: booleanAttribute });
  readonly fluid = input(false, { transform: booleanAttribute });
}
