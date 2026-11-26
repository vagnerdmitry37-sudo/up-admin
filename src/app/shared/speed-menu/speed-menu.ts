import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  booleanAttribute,
  computed,
  contentChild,
  input,
  output,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { MenuItem } from '@openng/optimus-ui/api';
import { ButtonDirective } from '@openng/optimus-ui/button';
import { Ripple } from '@openng/optimus-ui/ripple';
import { SpeedDial } from '@openng/optimus-ui/speeddial';
import { AppMotion } from '@shared/motion/motion';

export type SpeedMenuDirection = 'up-left' | 'up-right';

const slotCount = 4;

@Component({
  selector: 'app-speed-menu',
  imports: [SpeedDial, ButtonDirective, Ripple, AppMotion, NgTemplateOutlet],
  templateUrl: './speed-menu.html',
  styleUrl: './speed-menu.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpeedMenu {
  readonly items = input.required<MenuItem[]>();
  readonly direction = input.required<SpeedMenuDirection>();
  readonly label = input.required<string>();
  readonly icon = input.required<string>();
  readonly expanded = input(false, { transform: booleanAttribute });
  readonly actionsVisible = input(true, { transform: booleanAttribute });

  readonly pressed = output<MouseEvent>();

  protected readonly itemTemplate =
    contentChild.required<TemplateRef<{ $implicit: MenuItem }>>('item');

  protected readonly slots = computed(() => [
    ...this.items(),
    ...Array.from({ length: slotCount - this.items().length }, (): MenuItem => ({
      visible: false,
    })),
  ]);

  protected readonly position = computed(() => ({
    position: 'absolute',
    bottom: 0,
    [this.direction() === 'up-left' ? 'right' : 'left']: 0,
  }));
}
