import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SpinnerIcon } from '@openng/optimus-ui/icons/spinner';
import { AppMotion } from '@shared/motion/motion';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'failed';

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

  protected readonly busy = computed(() => this.status() === 'saving');
}
