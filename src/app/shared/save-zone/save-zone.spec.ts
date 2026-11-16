import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MIN_SAVING_MS, SaveStatus, SaveZone } from './save-zone';

@Component({
  imports: [SaveZone],
  template: `
    <app-save-zone [status]="status()" failedMessage="Could not save the photos.">
      <input aria-label="Name" />
    </app-save-zone>
  `,
})
class SaveZoneHost {
  readonly status = signal<SaveStatus>('idle');
}

describe('SaveZone', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const render = async (status: SaveStatus) => {
    const fixture = TestBed.createComponent(SaveZoneHost);
    fixture.componentInstance.status.set(status);
    await fixture.whenStable();
    return fixture;
  };

  const zone = (fixture: ComponentFixture<SaveZoneHost>) => {
    const element = fixture.nativeElement as HTMLElement;
    return {
      overlay: element.querySelector('[role="status"]'),
      content: element.querySelector<HTMLElement>('.content')!,
    };
  };

  const finishSaving = async (status: SaveStatus) => {
    const fixture = await render('saving');
    fixture.componentInstance.status.set(status);
    await fixture.whenStable();
    await vi.advanceTimersByTimeAsync(MIN_SAVING_MS);
    await fixture.whenStable();
    return zone(fixture);
  };

  it('shows only its content while idle', async () => {
    const { overlay, content } = zone(await render('idle'));

    expect(overlay).toBeNull();
    expect(content.inert).toBe(false);
  });

  it('shows a spinner and blocks its content while saving', async () => {
    const { overlay, content } = zone(await render('saving'));

    expect(overlay?.textContent).toContain('Saving…');
    expect(overlay?.querySelector('svg[data-p-icon="spinner"]')).not.toBeNull();
    expect(content.inert).toBe(true);
  });

  it('keeps the spinner for a moment when the save finishes quickly', async () => {
    const fixture = await render('saving');

    fixture.componentInstance.status.set('saved');
    await fixture.whenStable();

    expect(zone(fixture).overlay?.textContent).toContain('Saving…');
    expect(zone(fixture).content.inert).toBe(true);
  });

  it('shows the result at once when saving already took long enough', async () => {
    const fixture = await render('saving');
    await vi.advanceTimersByTimeAsync(MIN_SAVING_MS);

    fixture.componentInstance.status.set('saved');
    await fixture.whenStable();

    expect(zone(fixture).overlay?.textContent).toContain('Saved');
  });

  it('shows a success icon and unblocks its content once saved', async () => {
    const { overlay, content } = await finishSaving('saved');

    expect(overlay?.textContent).toContain('Saved');
    expect(overlay?.querySelector('.pi-check-circle')).not.toBeNull();
    expect(content.inert).toBe(false);
  });

  it('shows its failure message and no success icon when saving failed', async () => {
    const { overlay } = await finishSaving('failed');

    expect(overlay?.textContent).toContain('Could not save the photos.');
    expect(overlay?.querySelector('.pi-check-circle')).toBeNull();
  });

  it('hides the overlay once the status returns to idle', async () => {
    const fixture = await render('saving');
    fixture.componentInstance.status.set('idle');
    await fixture.whenStable();

    expect(zone(fixture).overlay).toBeNull();
  });
});
