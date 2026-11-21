import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ProgressSpinner } from '@openng/optimus-ui/progressspinner';

@Component({
  selector: 'app-progress-ring',
  imports: [ProgressSpinner],
  host: { 'aria-hidden': 'true' },
  templateUrl: './progress-ring.html',
  styleUrl: './progress-ring.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressRing {
  readonly value = input<number>();
}
