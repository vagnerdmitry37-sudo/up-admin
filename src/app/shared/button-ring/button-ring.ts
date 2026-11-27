import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  effect,
  input,
  signal,
  untracked,
} from '@angular/core';
import { ProgressSpinner } from '@openng/optimus-ui/progressspinner';

const rotationMs = 2000;

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

  protected readonly rotationDuration = `${rotationMs}ms`;
  protected readonly spinning = signal(false);
  private spinningSince = 0;

  constructor() {
    effect((onCleanup) => {
      if (this.loading()) {
        if (!untracked(this.spinning)) {
          this.spinningSince = Date.now();
          this.spinning.set(true);
        }
        return;
      }
      const untilFullRotation = this.spinningSince + rotationMs - Date.now();
      const timer = setTimeout(() => this.spinning.set(false), Math.max(untilFullRotation, 0));
      onCleanup(() => clearTimeout(timer));
    });
  }
}
