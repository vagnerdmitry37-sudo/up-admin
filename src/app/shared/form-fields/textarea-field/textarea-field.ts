import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
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
}
