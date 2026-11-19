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
  inject,
  input,
  linkedSignal,
  signal,
  viewChild,
} from '@angular/core';
import { EditActionsService } from '@core/edit-actions.service';
import { Image } from '@core/api/models';
import { ConfirmationService, MessageService, OpenngIcons } from '@openng/optimus-ui/api';
import { FileUpload } from '@openng/optimus-ui/fileupload';
import { AppMotion } from '@shared/motion/motion';

export interface ImageWriter {
  upload: (entityId: string, files: File[]) => Promise<Image[]>;
  delete: (imageIds: string[]) => Promise<unknown>;
  reorder: (entityId: string, imageIds: string[]) => Promise<Image[]>;
}

const megabyte = 1024 * 1024;
const maxFiles = 10;
const maxFileBytes = 10 * megabyte;
const errorMessageLife = 8000;

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

  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);
  private readonly fileUpload = viewChild(FileUpload);
  private readonly uploading = signal<File[]>([]);
  private readonly deleting = signal(false);

  readonly images = linkedSignal<Image[]>(() => this.savedImages() ?? []);
  readonly selection = signal<string[]>([]);

  protected readonly maxFileBytes = maxFileBytes;

  protected readonly isSelected = (image: Image) => this.selection().includes(image.id);

  protected readonly toggle = (image: Image) =>
    this.selection.update((selected) => toggled(selected, image.id));

  protected readonly openFilePicker = () => this.fileUpload()?.choose();

  protected readonly keepsUploadCardLast = (index: number) => index < this.images().length;

  constructor() {
    inject(EditActionsService).register({
      actions: () => ({
        delete: {
          click: () => this.confirmDelete(),
          visible: this.selection().length > 0 && !this.deleting(),
        },
      }),
    });
  }

  protected async upload(): Promise<void> {
    const fileUpload = this.fileUpload();
    const entityId = this.entityId();
    if (!fileUpload || !entityId) {
      return;
    }
    this.reportRejectedFiles(fileUpload);
    const files = fileUpload.files.filter((file) => !this.uploading().includes(file));
    if (files.length === 0) {
      return;
    }
    if (files.length > maxFiles) {
      this.showUploadError(`Choose up to ${maxFiles} images at a time.`);
      fileUpload.files = fileUpload.files.filter((file) => !files.includes(file));
      return;
    }
    this.uploading.update((uploading) => [...uploading, ...files]);
    try {
      const created = await this.writer().upload(entityId, files);
      this.images.update((images) => [...images, ...created]);
    } finally {
      this.uploading.update((uploading) => uploading.filter((file) => !files.includes(file)));
      fileUpload.files = fileUpload.files.filter((file) => !files.includes(file));
      fileUpload.cd.markForCheck();
    }
  }

  protected async reorder({ previousIndex, currentIndex }: CdkDragDrop<Image[]>): Promise<void> {
    const entityId = this.entityId();
    if (!entityId || previousIndex === currentIndex) {
      return;
    }
    const previousOrder = this.images();
    const reordered = [...previousOrder];
    moveItemInArray(reordered, previousIndex, currentIndex);
    this.images.set(reordered);
    try {
      const saved = await this.writer().reorder(
        entityId,
        reordered.map((image) => image.id),
      );
      this.images.set(saved);
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
    this.messageService.add({
      severity: 'error',
      summary: 'Image not added',
      detail,
      life: errorMessageLife,
    });

  private readonly confirmDelete = () => {
    const selected = this.selection();
    this.confirmationService.confirm({
      header: 'Delete images',
      message: `Delete ${selected.length === 1 ? 'this image' : `${selected.length} images`}? This cannot be undone.`,
      icon: OpenngIcons.EXCLAMATION_TRIANGLE,
      defaultFocus: 'reject',
      acceptButtonProps: { label: 'Delete', severity: 'danger' },
      rejectButtonProps: { label: 'Cancel', severity: 'secondary', outlined: true },
      accept: () => this.delete(selected),
    });
  };

  private async delete(imageIds: string[]): Promise<void> {
    this.deleting.set(true);
    try {
      await this.writer().delete(imageIds);
      this.images.update((images) => images.filter((image) => !imageIds.includes(image.id)));
      this.selection.update((selection) => selection.filter((id) => !imageIds.includes(id)));
    } finally {
      this.deleting.set(false);
    }
  }
}

const toggled = <T>(items: T[], item: T): T[] =>
  items.includes(item) ? items.filter((candidate) => candidate !== item) : [...items, item];
