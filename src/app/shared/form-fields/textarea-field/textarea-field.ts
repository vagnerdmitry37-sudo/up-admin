import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { Textarea } from '@openng/optimus-ui/textarea';
import { FieldFrame } from '../field-frame/field-frame';
import { FormField, formFieldHost } from '../form-field';

@Component({
  selector: 'app-textarea-field',
  imports: [ReactiveFormsModule, Textarea, FieldFrame],
  hostDirectives: [formFieldHost],
  templateUrl: './textarea-field.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextareaField {
  readonly rows = input(4);

  protected readonly field = inject(FormField);

  private readonly textarea = viewChild.required(Textarea);
  private readonly textareaElement = viewChild.required(Textarea, { read: ElementRef });

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      let lastWidth = 0;
      let pendingResizeFrame = 0;
      const widthObserver = new ResizeObserver(([entry]) => {
        const width = entry.contentRect.width;
        if (width === 0 || width === lastWidth) {
          return;
        }
        lastWidth = width;
        cancelAnimationFrame(pendingResizeFrame);
        pendingResizeFrame = requestAnimationFrame(() => this.textarea().resize());
      });
      widthObserver.observe(this.textareaElement().nativeElement);
      destroyRef.onDestroy(() => {
        widthObserver.disconnect();
        cancelAnimationFrame(pendingResizeFrame);
      });
    });
  }
}
