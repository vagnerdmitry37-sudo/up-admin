import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ProgressSpinner } from '@openng/optimus-ui/progressspinner';

@Component({
  selector: 'app-button-ring',
  imports: [ProgressSpinner],
  templateUrl: './button-ring.html',
  styleUrl: './button-ring.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonRing {
  readonly loading = input(false);
}
