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
  input,
  linkedSignal,
  model,
  signal,
  viewChild,
} from '@angular/core';
import { SafeUrl } from '@angular/platform-browser';
import { Badge } from '@openng/optimus-ui/badge';
import { FileUpload } from '@openng/optimus-ui/fileupload';
import { Message } from '@openng/optimus-ui/message';
import { ProgressBar } from '@openng/optimus-ui/progressbar';
import { AppMotion } from '@shared/motion/motion';

type SelectedFile = File & { objectURL?: SafeUrl };

export interface SavedImage {
  id: string;
  url: string;
}

const megabyte = 1024 * 1024;
const maxFiles = 10;
const maxFileBytes = 10 * megabyte;
const maxTotalBytes = maxFiles * maxFileBytes;

@Component({
  selector: 'app-image-upload',
  imports: [
    FileUpload,
    Badge,
    Message,
    ProgressBar,
    AppMotion,
    CdkDropList,
    CdkDrag,
    CdkDragHandle,
  ],
  templateUrl: './image-upload.html',
  styleUrl: './image-upload.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageUpload {
  readonly images = input<SavedImage[]>([]);
  readonly selection = model<File[]>([]);
  readonly savedSelection = model<SavedImage[]>([]);

  private readonly fileUpload = viewChild.required(FileUpload);
  private readonly pending = signal<File[]>([]);

  readonly pendingFiles = this.pending.asReadonly();
  readonly orderedImages = linkedSignal(() => this.images());
  readonly orderChanged = computed(() =>
    this.orderedImages().some((image, index) => image !== this.images()[index]),
  );

  protected readonly maxFiles = maxFiles;
  protected readonly maxFileBytes = maxFileBytes;
  protected readonly maxTotalSize = `${maxTotalBytes / megabyte} MB`;
  protected readonly messageLife = 6000;

  protected readonly totalSize = (files: File[]) => files.reduce((sum, file) => sum + file.size, 0);

  protected readonly totalSizePercent = (files: File[]) =>
    Math.min(100, (this.totalSize(files) / maxTotalBytes) * 100);

  protected readonly formatSize = (bytes: number) =>
    bytes < megabyte ? `${Math.ceil(bytes / 1024)} KB` : `${(bytes / megabyte).toFixed(1)} MB`;

  protected readonly previewUrl = (file: File) => (file as SelectedFile).objectURL;

  protected readonly isSelected = (file: File) => this.selection().includes(file);

  protected readonly isSavedSelected = (image: SavedImage) => this.savedSelection().includes(image);

  deleteSelected(): void {
    const fileUpload = this.fileUpload();
    for (const file of this.selection()) {
      const index = fileUpload.files.indexOf(file);
      if (index >= 0) {
        fileUpload.remove(new Event('delete'), index);
      }
    }
    this.selection.set([]);
    this.syncPending();
    fileUpload.cd.markForCheck();
  }

  clearPending(): void {
    this.fileUpload().clear();
    this.selection.set([]);
    this.syncPending();
  }

  protected syncPending(): void {
    this.pending.set([...this.fileUpload().files]);
  }

  protected openFilePicker = () => this.fileUpload().choose();

  protected toggle(file: File): void {
    this.selection.update((selected) => toggled(selected, file));
  }

  protected reorder({ previousIndex, currentIndex }: CdkDragDrop<SavedImage[]>): void {
    this.orderedImages.update((images) => {
      const reordered = [...images];
      moveItemInArray(reordered, previousIndex, currentIndex);
      return reordered;
    });
  }

  protected toggleSaved(image: SavedImage): void {
    this.savedSelection.update((selected) => toggled(selected, image));
  }
}

const toggled = <T>(items: T[], item: T): T[] =>
  items.includes(item) ? items.filter((candidate) => candidate !== item) : [...items, item];
