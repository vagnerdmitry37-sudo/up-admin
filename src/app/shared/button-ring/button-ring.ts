import { ChangeDetectionStrategy, Component, booleanAttribute, input } from '@angular/core';
import { ProgressSpinner } from '@openng/optimus-ui/progressspinner';

@Component({
  selector: 'app-button-ring',
  imports: [ProgressSpinner],
  templateUrl: './button-ring.html',
  styleUrl: './button-ring.scss',
  host: { '[class.contrast]': 'contrast()', '[class.inside]': 'inside()' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonRing {
  readonly loading = input(false);
  readonly contrast = input(false, { transform: booleanAttribute });
  readonly inside = input(false, { transform: booleanAttribute });
}
