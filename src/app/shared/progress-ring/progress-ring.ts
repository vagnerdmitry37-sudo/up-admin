import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { ProgressSpinner } from '@openng/optimus-ui/progressspinner';

const SPINNER_TURN_MS = 2000;

@Component({
  selector: 'app-progress-ring',
  exportAs: 'progressRing',
  imports: [ProgressSpinner],
  host: { 'aria-hidden': 'true' },
  templateUrl: './progress-ring.html',
  styleUrl: './progress-ring.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressRing {
  readonly value = input<number>();
  readonly running = input(false);

  private readonly spinningState = signal(false);
  private spinningSince = 0;
  private stopTimer: ReturnType<typeof setTimeout> | undefined;

  readonly spinning = this.spinningState.asReadonly();
  protected readonly shown = computed(() => this.value() !== undefined || this.spinning());
  protected readonly turnDuration = `${SPINNER_TURN_MS}ms`;

  private readonly cancelStop = () => {
    clearTimeout(this.stopTimer);
    this.stopTimer = undefined;
  };

  private readonly startSpinning = () => {
    this.cancelStop();
    if (!untracked(this.spinningState)) {
      this.spinningSince = Date.now();
      this.spinningState.set(true);
    }
  };

  private readonly stopSpinningAfterTurn = () => {
    if (!untracked(this.spinningState) || this.stopTimer) {
      return;
    }
    this.stopTimer = setTimeout(
      () => {
        this.stopTimer = undefined;
        this.spinningState.set(false);
      },
      Math.max(0, this.spinningSince + SPINNER_TURN_MS - Date.now()),
    );
  };

  constructor() {
    effect(() => (this.running() ? this.startSpinning() : this.stopSpinningAfterTurn()));
    inject(DestroyRef).onDestroy(this.cancelStop);
  }
}
