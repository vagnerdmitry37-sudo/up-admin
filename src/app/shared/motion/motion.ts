import { Directive, input } from '@angular/core';

export type MotionName = 'slide' | 'scale' | 'pop';

@Directive({
  selector: '[appMotion]',
  host: {
    '[animate.enter]': '`motion-${appMotion()}-enter`',
    '[animate.leave]': '`motion-${appMotion()}-leave`',
  },
})
export class AppMotion {
  readonly appMotion = input.required<MotionName>();
}
