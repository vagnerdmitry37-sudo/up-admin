import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Press } from './press';

@Component({
  imports: [Press],
  template: `
    <button
      type="button"
      appPress
      [longPressMs]="longPressMs()"
      (press)="presses = presses + 1"
      (longPress)="longPresses = longPresses + 1"
    >
      Edit
    </button>
  `,
})
class Host {
  readonly longPressMs = signal(500);
  presses = 0;
  longPresses = 0;
}

describe('Press', () => {
  const render = async (longPressMs = 500) => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.longPressMs.set(longPressMs);
    await fixture.whenStable();
    vi.useFakeTimers();
    const host = fixture.componentInstance;
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    const pointer = (type: string) => button.dispatchEvent(new Event(type, { bubbles: true }));
    const hold = (ms: number, end = 'pointerup') => {
      pointer('pointerdown');
      vi.advanceTimersByTime(ms);
      pointer(end);
    };
    return { host, button, pointer, hold };
  };

  afterEach(() => vi.useRealTimers());

  it('reports a click as a press', async () => {
    const { host, button } = await render();

    button.click();

    expect(host.presses).toBe(1);
    expect(host.longPresses).toBe(0);
  });

  it('reports a short press as a press', async () => {
    const { host, button, hold } = await render();

    hold(400);
    button.click();

    expect(host.presses).toBe(1);
    expect(host.longPresses).toBe(0);
  });

  it('reports a long press while the button is still held, without a press on release', async () => {
    const { host, button, pointer } = await render();

    pointer('pointerdown');
    vi.advanceTimersByTime(500);
    expect(host.longPresses).toBe(1);

    pointer('pointerup');
    button.click();
    expect(host.presses).toBe(0);
  });

  it('treats the next click normally after a long press', async () => {
    const { host, button, hold } = await render();
    hold(500);
    button.click();

    button.click();

    expect(host.longPresses).toBe(1);
    expect(host.presses).toBe(1);
  });

  it('cancels the hold when the pointer leaves or is cancelled', async () => {
    const { host, pointer } = await render();

    pointer('pointerdown');
    vi.advanceTimersByTime(300);
    pointer('pointerleave');
    vi.advanceTimersByTime(500);

    pointer('pointerdown');
    vi.advanceTimersByTime(300);
    pointer('pointercancel');
    vi.advanceTimersByTime(500);

    expect(host.longPresses).toBe(0);
  });

  it('uses the configured hold time', async () => {
    const { host, hold } = await render(1000);

    hold(600);
    expect(host.longPresses).toBe(0);

    hold(1000);
    expect(host.longPresses).toBe(1);
  });

  it('stops the context menu that phones show on a long touch', async () => {
    const { button } = await render();
    const event = new Event('contextmenu', { bubbles: true, cancelable: true });

    button.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
  });
});
