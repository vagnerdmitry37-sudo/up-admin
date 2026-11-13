import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  inject,
  signal,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { Editor } from '@openng/optimus-ui/editor';
import { Textarea } from '@openng/optimus-ui/textarea';
import { EditorInitEvent } from '@openng/optimus-ui/types/editor';
import { FieldFrame } from '../field-frame/field-frame';
import { FormField, formFieldHost } from '../form-field';

@Component({
  selector: 'app-rich-text-field',
  imports: [ReactiveFormsModule, Editor, FieldFrame, Textarea],
  hostDirectives: [formFieldHost],
  templateUrl: './rich-text-field.html',
  styleUrl: './rich-text-field.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RichTextField {
  protected readonly field = inject(FormField);
  protected readonly showSource = signal(false);
  protected readonly formats = [
    'header',
    'bold',
    'italic',
    'underline',
    'strike',
    'list',
    'blockquote',
    'link',
  ];

  protected labelContent({ editor }: EditorInitEvent): void {
    const content: HTMLElement = editor.root;
    content.setAttribute('aria-labelledby', this.field.labelId);
    content.setAttribute('aria-describedby', this.field.errorId);
  }

  protected toggleSource(): void {
    const control = this.field.control();
    control.setValue(control.value);
    this.showSource.update((shown) => !shown);
  }
}
