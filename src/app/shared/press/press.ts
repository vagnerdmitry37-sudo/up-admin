import { DestroyRef, Directive, inject, input, output } from '@angular/core';

@Directive({
  selector: '[appPress]',
  host: {
    '(pointerdown)': 'startHold()',
    '(pointerup)': 'stopHold()',
    '(pointercancel)': 'stopHold()',
    '(pointerleave)': 'stopHold()',
    '(click)': 'onClick($event)',
    '(contextmenu)': '$event.preventDefault()',
  },
})
export class Press {
  readonly longPressMs = input(500);
  readonly press = output<MouseEvent>();
  readonly longPress = output();

  private holdTimer: ReturnType<typeof setTimeout> | undefined;
  private longPressed = false;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.stopHold());
  }

  protected startHold(): void {
    this.stopHold();
    this.longPressed = false;
    this.holdTimer = setTimeout(() => {
      this.longPressed = true;
      this.longPress.emit();
    }, this.longPressMs());
  }

  protected stopHold(): void {
    clearTimeout(this.holdTimer);
  }

  protected onClick(event: MouseEvent): void {
    if (this.longPressed) {
      this.longPressed = false;
      event.preventDefault();
      return;
    }
    this.press.emit(event);
  }
}
