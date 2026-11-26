import {
  CdkDrag,
  CdkDragDrop,
  CdkDragHandle,
  CdkDropList,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  linkedSignal,
  signal,
  viewChild,
} from '@angular/core';
import { AppMessageService } from '@core/app-message.service';
import { Image } from '@core/api/models';
import { HttpActivity } from '@core/http-activity.service';
import { FileUpload } from '@openng/optimus-ui/fileupload';
import { AppMotion } from '@shared/motion/motion';

export interface ImageWriter {
  upload: (entityId: string, files: File[]) => Promise<Image[]>;
  delete: (imageIds: string[]) => Promise<unknown>;
  reorder: (entityId: string, imageIds: string[]) => Promise<Image[]>;
}

type GalleryImage = Pick<Image, 'id' | 'url' | 'fileName'> & { stagedFile?: File };

const megabyte = 1024 * 1024;
const maxFiles = 10;
const maxFileBytes = 10 * megabyte;

@Component({
  selector: 'app-image-upload',
  imports: [FileUpload, AppMotion, CdkDropList, CdkDrag, CdkDragHandle],
  templateUrl: './image-upload.html',
  styleUrl: './image-upload.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageUpload {
  readonly entityId = input<string>();
  readonly savedImages = input<Image[]>();
  readonly writer = input.required<ImageWriter>();

  private readonly messageService = inject(AppMessageService);
  private readonly httpActivity = inject(HttpActivity);
  private readonly fileUpload = viewChild(FileUpload);
  private stagedCount = 0;

  readonly images = linkedSignal<GalleryImage[]>(() => this.savedImages() ?? []);
  readonly selection = signal<string[]>([]);
  readonly dirty = computed(() => this.images().some((image) => image.stagedFile));

  protected readonly maxFileBytes = maxFileBytes;

  protected readonly isSelected = (image: GalleryImage) => this.selection().includes(image.id);

  protected readonly toggle = (image: GalleryImage) =>
    this.selection.update((selected) => toggled(selected, image.id));

  protected readonly openFilePicker = () => this.fileUpload()?.choose();

  protected readonly keepsUploadCardLast = (index: number) => index < this.images().length;

  protected upload(): void {
    const fileUpload = this.fileUpload();
    if (!fileUpload) {
      return;
    }
    this.reportRejectedFiles(fileUpload);
    const files = fileUpload.files;
    fileUpload.files = [];
    fileUpload.cd.markForCheck();
    if (files.length === 0) {
      return;
    }
    const stagedCount = this.images().filter((image) => image.stagedFile).length;
    if (stagedCount + files.length > maxFiles) {
      this.showUploadError(`Add up to ${maxFiles} images before saving.`);
      return;
    }
    this.images.update((images) => [
      ...images,
      ...files.map((file) => ({
        id: `staged-${++this.stagedCount}`,
        url: URL.createObjectURL(file),
        fileName: file.name,
        stagedFile: file,
      })),
    ]);
  }

  protected async reorder({
    previousIndex,
    currentIndex,
  }: CdkDragDrop<GalleryImage[]>): Promise<void> {
    const entityId = this.entityId();
    const previousOrder = this.images();
    const reordered = [...previousOrder];
    moveItemInArray(reordered, previousIndex, currentIndex);
    this.images.set(reordered);
    const savedIds = (images: GalleryImage[]) =>
      images.filter((image) => !image.stagedFile).map((image) => image.id);
    if (!entityId || savedIds(reordered).join() === savedIds(previousOrder).join()) {
      return;
    }
    try {
      await this.httpActivity.track(
        { entity: 'image', operation: 'reorder', source: 'image-upload' },
        () => this.writer().reorder(entityId, savedIds(reordered)),
      );
    } catch (error) {
      this.images.set(previousOrder);
      throw error;
    }
  }

  private reportRejectedFiles(fileUpload: FileUpload): void {
    const rejections = (fileUpload.msgs ?? []) as { text: string }[];
    for (const rejection of rejections) {
      this.showUploadError(rejection.text.trim());
    }
    fileUpload.msgs = [];
  }

  private readonly showUploadError = (detail: string) =>
    this.messageService.error('Image not added', detail);

  readonly save = async (entityId: string) => {
    const gallery = this.images();
    const staged = gallery.filter((image) => image.stagedFile);
    if (staged.length === 0) {
      return;
    }
    const created = await this.httpActivity.track(
      { entity: 'image', operation: 'upload', source: 'image-upload' },
      () =>
        this.writer().upload(
          entityId,
          staged.flatMap((image) => image.stagedFile ?? []),
        ),
    );
    const order = gallery.map((image) =>
      image.stagedFile ? created[staged.indexOf(image)].id : image.id,
    );
    const uploadOrder = [
      ...gallery.filter((image) => !image.stagedFile).map((image) => image.id),
      ...created.map((image) => image.id),
    ];
    if (order.join() !== uploadOrder.join()) {
      await this.httpActivity.track(
        { entity: 'image', operation: 'reorder', source: 'image-upload' },
        () => this.writer().reorder(entityId, order),
      );
    }
  };

  private readonly delete = async (imageIds: string[]) => {
    const savedIds = this.images()
      .filter((image) => imageIds.includes(image.id) && !image.stagedFile)
      .map((image) => image.id);
    if (savedIds.length > 0) {
      await this.writer().delete(savedIds);
    }
    this.images.update((images) => images.filter((image) => !imageIds.includes(image.id)));
    this.selection.update((selection) => selection.filter((id) => !imageIds.includes(id)));
  };
}

const toggled = <T>(items: T[], item: T): T[] =>
  items.includes(item) ? items.filter((candidate) => candidate !== item) : [...items, item];
