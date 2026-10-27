import { ChangeDetectionStrategy, Component, model, viewChild } from '@angular/core';
import { SafeUrl } from '@angular/platform-browser';
import { Badge } from '@openng/optimus-ui/badge';
import { ButtonDirective, ButtonIcon } from '@openng/optimus-ui/button';
import { FileUpload } from '@openng/optimus-ui/fileupload';
import { Message } from '@openng/optimus-ui/message';
import { ProgressBar } from '@openng/optimus-ui/progressbar';

type SelectedFile = File & { objectURL?: SafeUrl };

const megabyte = 1024 * 1024;
const maxFiles = 10;
const maxFileBytes = 10 * megabyte;
const maxTotalBytes = maxFiles * maxFileBytes;

@Component({
  selector: 'app-image-upload',
  imports: [FileUpload, ButtonDirective, ButtonIcon, Badge, Message, ProgressBar],
  templateUrl: './image-upload.html',
  styleUrl: './image-upload.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageUpload {
  readonly selection = model<File[]>([]);

  private readonly fileUpload = viewChild.required(FileUpload);

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

  deleteSelected(): void {
    const fileUpload = this.fileUpload();
    for (const file of this.selection()) {
      const index = fileUpload.files.indexOf(file);
      if (index >= 0) {
        fileUpload.remove(new Event('delete'), index);
      }
    }
    this.selection.set([]);
    fileUpload.cd.markForCheck();
  }

  protected toggle(file: File): void {
    this.selection.update((selected) =>
      selected.includes(file)
        ? selected.filter((candidate) => candidate !== file)
        : [...selected, file],
    );
  }
}
