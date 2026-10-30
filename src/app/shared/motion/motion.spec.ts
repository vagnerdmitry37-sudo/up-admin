import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AppMotion, MotionName } from './motion';

@Component({
  imports: [AppMotion],
  template: `
    @if (shown()) {
      <p [appMotion]="motion()">Hello</p>
    }
  `,
})
class MotionHost {
  readonly shown = signal(true);
  readonly motion = signal<MotionName>('slide');
}

describe('AppMotion', () => {
  const render = async (motion: MotionName) => {
    const fixture = TestBed.createComponent(MotionHost);
    fixture.componentInstance.motion.set(motion);
    await fixture.whenStable();
    return { fixture, element: fixture.nativeElement as HTMLElement };
  };

  it.each<MotionName>(['slide', 'scale', 'pop'])(
    'shows content using %s motion',
    async (motion) => {
      const { element } = await render(motion);

      expect(element.querySelector('p')?.textContent).toBe('Hello');
    },
  );

  it.each<MotionName>(['slide', 'scale', 'pop'])(
    'removes content using %s motion without getting stuck',
    async (motion) => {
      const { fixture, element } = await render(motion);

      fixture.componentInstance.shown.set(false);
      await fixture.whenStable();

      expect(element.querySelector('p')).toBeNull();
    },
  );
});
