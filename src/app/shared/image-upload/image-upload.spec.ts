import { TestBed } from '@angular/core/testing';
import { ImageUpload } from './image-upload';

describe('ImageUpload', () => {
  const render = async () => {
    const fixture = TestBed.createComponent(ImageUpload);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  };

  it('shows the drop hint while no image is chosen', async () => {
    const element = await render();

    expect(element.textContent).toContain('Drag and drop images here to upload.');
  });

  it('accepts only JPEG, PNG and WebP images', async () => {
    const element = await render();

    const input = element.querySelector('input[type="file"]');
    expect(input?.getAttribute('accept')).toBe('image/jpeg,image/png,image/webp');
  });

  it('explains why a chosen file was not added', async () => {
    const fixture = TestBed.createComponent(ImageUpload);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const tooLarge = new File(['x'], 'large.jpg', { type: 'image/jpeg' });
    Object.defineProperty(tooLarge, 'size', { value: 11 * 1024 * 1024 });
    const notAnImage = new File(['x'], 'notes.txt', { type: 'text/plain' });
    const input = element.querySelector<HTMLInputElement>('input[type="file"]')!;
    Object.defineProperty(input, 'files', { value: [tooLarge, notAnImage] });

    input.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    await fixture.whenStable();

    const messages = element.querySelectorAll('p-message');
    expect(messages).toHaveLength(2);
    expect(messages[0].textContent).toContain('large.jpg: Invalid file size');
    expect(messages[1].textContent).toContain('notes.txt: Invalid file type');
  });

  it('offers a button to choose images', async () => {
    const element = await render();

    expect(element.querySelector('button[aria-label="Choose images"]')).not.toBeNull();
  });
});
