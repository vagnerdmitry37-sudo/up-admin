import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  afterRenderEffect,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { Textarea } from '@openng/optimus-ui/textarea';
import { FieldFrame } from '../field-frame/field-frame';
import { FormField, formFieldHost } from '../form-field';
import { startWith, switchMap } from 'rxjs';

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
  private readonly value = toSignal(
    toObservable(this.field.control).pipe(
      switchMap((control) => control.valueChanges.pipe(startWith(control.value))),
    ),
  );

  constructor() {
    afterRenderEffect({
      mixedReadWrite: () => {
        this.value();
        this.rows();
        this.textarea().resize();
      },
    });
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
