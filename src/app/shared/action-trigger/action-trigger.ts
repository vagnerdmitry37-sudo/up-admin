import { DestroyRef, Directive, inject, input, output, signal } from '@angular/core';

export type ActionTriggerKind = 'click' | 'hold';

export const DEFAULT_HOLD_DURATION_MS = 800;

const HOLD_KEYS = new Set(['Enter', ' ']);

@Directive({
  selector: '[appActionTrigger]',
  exportAs: 'actionTrigger',
  host: {
    '[class.action-trigger-hold]': "appActionTrigger() === 'hold'",
    '[class.action-trigger-holding]': 'holding()',
    '[style.--action-trigger-hold-progress]': 'holdProgress()',
    '(click)': 'onClick()',
    '(pointerdown)': 'onPointerDown($event)',
    '(pointerup)': 'cancelHold()',
    '(pointerleave)': 'cancelHold()',
    '(pointercancel)': 'cancelHold()',
    '(keydown)': 'onKeyDown($event)',
    '(keyup)': 'onKeyUp($event)',
    '(blur)': 'cancelHold()',
    '(contextmenu)': 'onContextMenu($event)',
  },
})
export class ActionTrigger {
  readonly appActionTrigger = input<ActionTriggerKind>('click');
  readonly holdDuration = input(DEFAULT_HOLD_DURATION_MS);

  readonly triggered = output<void>();

  readonly holding = signal(false);
  readonly holdProgress = signal(0);

  private holdStartedAt = 0;
  private animationFrame?: number;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.cancelHold());
  }

  protected onClick = () => {
    if (this.appActionTrigger() === 'click') {
      this.triggered.emit();
    }
  };

  protected onPointerDown = (event: PointerEvent) => {
    if (this.appActionTrigger() === 'hold' && event.isPrimary && event.button === 0) {
      this.startHold();
    }
  };

  protected onKeyDown = (event: KeyboardEvent) => {
    if (this.appActionTrigger() !== 'hold' || !HOLD_KEYS.has(event.key)) {
      return;
    }
    event.preventDefault();
    if (!event.repeat) {
      this.startHold();
    }
  };

  protected onKeyUp = (event: KeyboardEvent) => {
    if (this.appActionTrigger() === 'hold' && HOLD_KEYS.has(event.key)) {
      event.preventDefault();
      this.cancelHold();
    }
  };

  protected onContextMenu = (event: Event) => {
    if (this.appActionTrigger() === 'hold') {
      event.preventDefault();
    }
  };

  readonly cancelHold = () => {
    if (this.animationFrame !== undefined) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = undefined;
    }
    this.holding.set(false);
    this.holdProgress.set(0);
  };

  private startHold = () => {
    this.cancelHold();
    this.holding.set(true);
    this.holdStartedAt = performance.now();
    this.animationFrame = requestAnimationFrame(this.advanceHold);
  };

  private advanceHold = (now: number) => {
    const progress = Math.min((now - this.holdStartedAt) / this.holdDuration(), 1);
    this.holdProgress.set(progress);
    if (progress < 1) {
      this.animationFrame = requestAnimationFrame(this.advanceHold);
      return;
    }
    this.cancelHold();
    this.triggered.emit();
  };
}
