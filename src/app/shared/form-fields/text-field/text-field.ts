import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { InputText } from '@openng/optimus-ui/inputtext';
import { FieldFrame } from '../field-frame/field-frame';
import { FormField, formFieldHost } from '../form-field';

@Component({
  selector: 'app-text-field',
  imports: [ReactiveFormsModule, InputText, FieldFrame],
  hostDirectives: [formFieldHost],
  templateUrl: './text-field.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextField {
  protected readonly field = inject(FormField);
}
