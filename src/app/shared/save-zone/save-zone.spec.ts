import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SaveStatus, SaveZone } from './save-zone';

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
  const render = async (status: SaveStatus) => {
    const fixture = TestBed.createComponent(SaveZoneHost);
    fixture.componentInstance.status.set(status);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    return {
      overlay: element.querySelector('[role="status"]'),
      content: element.querySelector<HTMLElement>('.content')!,
    };
  };

  it('shows only its content while idle', async () => {
    const { overlay, content } = await render('idle');

    expect(overlay).toBeNull();
    expect(content.inert).toBe(false);
  });

  it('shows a spinner and blocks its content while saving', async () => {
    const { overlay, content } = await render('saving');

    expect(overlay?.textContent).toContain('Saving…');
    expect(overlay?.querySelector('svg[data-p-icon="spinner"]')).not.toBeNull();
    expect(content.inert).toBe(true);
  });

  it('shows a success icon and unblocks its content once saved', async () => {
    const { overlay, content } = await render('saved');

    expect(overlay?.textContent).toContain('Saved');
    expect(overlay?.querySelector('.pi-check-circle')).not.toBeNull();
    expect(content.inert).toBe(false);
  });

  it('shows its failure message and no success icon when saving failed', async () => {
    const { overlay } = await render('failed');

    expect(overlay?.textContent).toContain('Could not save the photos.');
    expect(overlay?.querySelector('.pi-check-circle')).toBeNull();
  });
});
