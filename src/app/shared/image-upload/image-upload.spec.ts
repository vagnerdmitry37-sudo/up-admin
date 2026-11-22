import { CdkDropList } from '@angular/cdk/drag-drop';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Image } from '@core/api/models';
import { ActionMenuService } from '@core/action-menu.service';
import { MessageService } from '@openng/optimus-ui/api';
import { ImageUpload, ImageWriter } from './image-upload';

const image = (id: string, fileName: string): Image => ({
  id,
  entityType: 'Product',
  entityId: 'p1',
  sortOrder: 0,
  fileName,
  url: `https://img/${id}.webp`,
});

describe('ImageUpload', () => {
  let writer: { [Key in keyof ImageWriter]: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => 'blob:preview');
    writer = { upload: vi.fn(), delete: vi.fn(), reorder: vi.fn() };
    TestBed.configureTestingModule({ providers: [MessageService] });
  });

  const render = async (savedImages: Image[] = [], entityId: string | null = 'p1') => {
    const fixture = TestBed.createComponent(ImageUpload);
    fixture.componentRef.setInput('entityId', entityId ?? undefined);
    fixture.componentRef.setInput('savedImages', savedImages);
    fixture.componentRef.setInput('writer', writer);
    await fixture.whenStable();
    return fixture;
  };

  const cardNames = (fixture: ComponentFixture<ImageUpload>) =>
    [...(fixture.nativeElement as HTMLElement).querySelectorAll('.files .file')].map((card) =>
      card.textContent?.trim(),
    );

  const chooseFiles = async (fixture: ComponentFixture<ImageUpload>, files: File[]) => {
    const input = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>(
      'input[type="file"]',
    )!;
    Object.defineProperty(input, 'files', { value: files, configurable: true });
    input.dispatchEvent(new Event('change'));
    await new Promise((resolve) => setTimeout(resolve));
    fixture.detectChanges();
    await fixture.whenStable();
  };

  it('shows nothing until the record has an id', async () => {
    const fixture = await render([], null);

    expect((fixture.nativeElement as HTMLElement).querySelector('p-fileupload')).toBeNull();
  });

  it('shows each image by file name, falls back to its position, and ends with the upload card', async () => {
    const fixture = await render([image('i1', 'bridge.jpg'), image('i2', '')]);

    expect(cardNames(fixture)).toEqual(['bridge.jpg', 'Image 2', 'Add images']);
  });

  it('uploads chosen files at once and adds the returned images before the upload card', async () => {
    const fixture = await render([image('i1', 'bridge.jpg')]);
    writer.upload.mockResolvedValue([image('i2', 'castle.jpg')]);
    const file = new File(['a'], 'castle.jpg', { type: 'image/jpeg' });

    await chooseFiles(fixture, [file]);

    expect(writer.upload).toHaveBeenCalledWith('p1', [file]);
    expect(cardNames(fixture)).toEqual(['bridge.jpg', 'castle.jpg', 'Add images']);
  });

  it('reports a file larger than 10 MB in a toast and does not upload it', async () => {
    const fixture = await render();
    const add = vi.spyOn(TestBed.inject(MessageService), 'add');
    const file = new File(['a'], 'huge.jpg', { type: 'image/jpeg' });
    Object.defineProperty(file, 'size', { value: 11 * 1024 * 1024 });

    await chooseFiles(fixture, [file]);

    expect(writer.upload).not.toHaveBeenCalled();
    expect(add).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: 'error',
        summary: 'Image not added',
        detail: 'huge.jpg is larger than 10 MB.',
      }),
    );
    expect((fixture.nativeElement as HTMLElement).querySelector('p-message')).toBeNull();
  });

  it('saves the new order as soon as an image is dropped in a new place', async () => {
    const first = image('i1', 'bridge.jpg');
    const second = image('i2', 'castle.jpg');
    const fixture = await render([first, second]);
    writer.reorder.mockResolvedValue([second, first]);

    fixture.debugElement
      .query(By.directive(CdkDropList))
      .triggerEventHandler('cdkDropListDropped', { previousIndex: 0, currentIndex: 1 });
    await fixture.whenStable();

    expect(writer.reorder).toHaveBeenCalledWith('p1', ['i2', 'i1']);
    expect(cardNames(fixture)).toEqual(['castle.jpg', 'bridge.jpg', 'Add images']);
  });

  it('deletes the selected images and removes their cards', async () => {
    const fixture = await render([image('i1', 'bridge.jpg'), image('i2', 'castle.jpg')]);
    const actionMenuService = TestBed.inject(ActionMenuService);
    writer.delete.mockResolvedValue(undefined);
    expect(actionMenuService.actions().delete).toBeUndefined();

    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('.files .file')!
      .click();
    await fixture.whenStable();
    actionMenuService.run('delete');
    await new Promise((resolve) => setTimeout(resolve));
    await fixture.whenStable();

    expect(writer.delete).toHaveBeenCalledWith(['i1']);
    expect(cardNames(fixture)).toEqual(['castle.jpg', 'Add images']);
    expect(actionMenuService.actions().delete).toBeUndefined();
  });
});
