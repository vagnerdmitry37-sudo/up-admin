import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ImageUpload } from './image-upload';

describe('ImageUpload', () => {
  const render = async () => {
    const fixture = TestBed.createComponent(ImageUpload);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  };

  const chooseFiles = async (fixture: ComponentFixture<ImageUpload>, files: File[]) => {
    const input = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>(
      'input[type="file"]',
    )!;
    Object.defineProperty(input, 'files', { value: files, configurable: true });
    input.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    await fixture.whenStable();
    return input;
  };

  const savedImages = [
    { id: 'i1', url: 'https://img/1.webp' },
    { id: 'i2', url: 'https://img/2.webp' },
  ];

  it('shows the drop zone with drag and click instructions', async () => {
    const element = await render();

    expect(element.querySelector('button.drop-zone')?.textContent).toContain(
      'Drag and drop images here, or click to choose files.',
    );
  });

  it('opens the file picker when the drop zone is clicked', async () => {
    const element = await render();
    const input = element.querySelector<HTMLInputElement>('input[type="file"]')!;
    const openPicker = vi.spyOn(input, 'click').mockImplementation(() => undefined);

    element.querySelector<HTMLButtonElement>('button.drop-zone')!.click();

    expect(openPicker).toHaveBeenCalledTimes(1);
  });

  it('does not open the file picker when the area outside the drop zone is clicked', async () => {
    const element = await render();
    const input = element.querySelector<HTMLInputElement>('input[type="file"]')!;
    const openPicker = vi.spyOn(input, 'click').mockImplementation(() => undefined);

    element.querySelector<HTMLElement>('.groups')!.click();

    expect(openPicker).not.toHaveBeenCalled();
  });

  it('does not open the file picker when an image card is clicked', async () => {
    URL.createObjectURL = vi.fn(() => 'blob:preview');
    const fixture = TestBed.createComponent(ImageUpload);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const input = element.querySelector<HTMLInputElement>('input[type="file"]')!;
    Object.defineProperty(input, 'files', {
      value: [new File(['a'], 'photo.jpg', { type: 'image/jpeg' })],
    });
    input.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    await fixture.whenStable();
    const openPicker = vi.spyOn(input, 'click').mockImplementation(() => undefined);

    element.querySelector<HTMLButtonElement>('button[aria-pressed]')!.click();

    expect(openPicker).not.toHaveBeenCalled();
    expect(fixture.componentInstance.selection()).toHaveLength(1);
  });

  it('shows saved images as Saved cards and keeps the drop zone', async () => {
    const fixture = TestBed.createComponent(ImageUpload);
    fixture.componentRef.setInput('images', savedImages);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    const cards = [...element.querySelectorAll('button[aria-pressed]')];
    expect(cards.map((card) => card.querySelector('.name')?.textContent?.trim())).toEqual([
      'Image 1',
      'Image 2',
    ]);
    expect(cards.map((card) => card.querySelector('img')?.getAttribute('src'))).toEqual([
      'https://img/1.webp',
      'https://img/2.webp',
    ]);
    expect(cards.every((card) => card.textContent?.includes('Saved'))).toBe(true);
    expect(element.querySelector('button.drop-zone')).not.toBeNull();
  });

  it('toggles saved images in and out of their own selection', async () => {
    const fixture = TestBed.createComponent(ImageUpload);
    fixture.componentRef.setInput('images', savedImages);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const cards = () => element.querySelectorAll<HTMLButtonElement>('button[aria-pressed]');

    cards()[1].click();
    await fixture.whenStable();
    expect(fixture.componentInstance.savedSelection()).toEqual([savedImages[1]]);
    expect(fixture.componentInstance.selection()).toEqual([]);
    expect(cards()[1].getAttribute('aria-pressed')).toBe('true');

    cards()[1].click();
    await fixture.whenStable();
    expect(fixture.componentInstance.savedSelection()).toEqual([]);
    expect(cards()[1].getAttribute('aria-pressed')).toBe('false');
  });

  it('shows the size bar inside the Pending section only while images are pending', async () => {
    URL.createObjectURL = vi.fn(() => 'blob:preview');
    const fixture = TestBed.createComponent(ImageUpload);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('.size-label')).toBeNull();

    await chooseFiles(fixture, [new File(['ab'], 'photo.jpg', { type: 'image/jpeg' })]);

    const pending = element.querySelector('.group')!;
    expect(pending.querySelector('.group-title')?.textContent).toBe('Pending');
    expect(pending.querySelector('.size-label')?.textContent).toContain('/ 100 MB');
  });

  it('shows rejection messages without an empty Pending block when no file was added', async () => {
    const fixture = TestBed.createComponent(ImageUpload);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    await chooseFiles(fixture, [new File(['x'], 'notes.txt', { type: 'text/plain' })]);

    const pending = element.querySelector('.group')!;
    expect(pending.querySelector('p-message')?.textContent).toContain('notes.txt');
    expect(pending.querySelector('.group-title')).toBeNull();
    expect(pending.querySelector('.size-label')).toBeNull();
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

  it('toggles a chosen image in and out of the selection, like a table row', async () => {
    URL.createObjectURL = vi.fn(() => 'blob:preview');
    const fixture = TestBed.createComponent(ImageUpload);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const first = new File(['a'], 'first.jpg', { type: 'image/jpeg' });
    const second = new File(['b'], 'second.jpg', { type: 'image/jpeg' });
    const input = element.querySelector<HTMLInputElement>('input[type="file"]')!;
    Object.defineProperty(input, 'files', { value: [first, second] });
    input.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    await fixture.whenStable();
    const cards = () => element.querySelectorAll<HTMLButtonElement>('button[aria-pressed]');

    cards()[0].click();
    cards()[1].click();
    await fixture.whenStable();
    expect(fixture.componentInstance.selection()).toEqual([first, second]);
    expect(cards()[0].getAttribute('aria-pressed')).toBe('true');

    cards()[0].click();
    await fixture.whenStable();
    expect(fixture.componentInstance.selection()).toEqual([second]);
    expect(cards()[0].getAttribute('aria-pressed')).toBe('false');
  });

  it('deletes only the selected images', async () => {
    URL.createObjectURL = vi.fn(() => 'blob:preview');
    const fixture = TestBed.createComponent(ImageUpload);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const kept = new File(['a'], 'kept.jpg', { type: 'image/jpeg' });
    const deleted = new File(['b'], 'deleted.jpg', { type: 'image/jpeg' });
    const input = element.querySelector<HTMLInputElement>('input[type="file"]')!;
    Object.defineProperty(input, 'files', { value: [kept, deleted] });
    input.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    await fixture.whenStable();
    element.querySelectorAll<HTMLButtonElement>('button[aria-pressed]')[1].click();
    await fixture.whenStable();

    fixture.componentInstance.deleteSelected();
    await fixture.whenStable();

    const names = [...element.querySelectorAll('button[aria-pressed] .name')].map(
      (name) => name.textContent,
    );
    expect(names).toEqual(['kept.jpg']);
    expect(fixture.componentInstance.selection()).toEqual([]);
  });
});
