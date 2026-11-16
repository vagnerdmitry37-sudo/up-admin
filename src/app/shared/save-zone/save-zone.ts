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
import { SpinnerIcon } from '@openng/optimus-ui/icons/spinner';
import { AppMotion } from '@shared/motion/motion';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'failed';

export const MIN_SAVING_MS = 600;

@Component({
  selector: 'app-save-zone',
  imports: [SpinnerIcon, AppMotion],
  templateUrl: './save-zone.html',
  styleUrl: './save-zone.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SaveZone {
  readonly status = input<SaveStatus>('idle');
  readonly failedMessage = input("Couldn't save. Try again.");

  private savingSince = 0;
  private resultTimer?: ReturnType<typeof setTimeout>;

  protected readonly shownStatus = signal<SaveStatus>('idle');
  protected readonly busy = computed(() => this.shownStatus() === 'saving');

  constructor() {
    effect(() => {
      const status = this.status();
      untracked(() => this.show(status));
    });
    inject(DestroyRef).onDestroy(() => clearTimeout(this.resultTimer));
  }

  private show(status: SaveStatus): void {
    clearTimeout(this.resultTimer);
    if (status === 'idle') {
      this.shownStatus.set('idle');
      return;
    }
    if (this.shownStatus() !== 'saving') {
      this.savingSince = Date.now();
      this.shownStatus.set('saving');
    }
    if (status === 'saving') {
      return;
    }
    const remaining = MIN_SAVING_MS - (Date.now() - this.savingSince);
    if (remaining <= 0) {
      this.shownStatus.set(status);
      return;
    }
    this.resultTimer = setTimeout(() => this.shownStatus.set(status), remaining);
  }
}
