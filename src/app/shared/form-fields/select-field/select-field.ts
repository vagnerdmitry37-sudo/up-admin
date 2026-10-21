import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { Select } from '@openng/optimus-ui/select';
import { FieldFrame } from '../field-frame/field-frame';
import { FormField, formFieldHost } from '../form-field';

@Component({
  selector: 'app-select-field',
  imports: [ReactiveFormsModule, Select, FieldFrame],
  hostDirectives: [formFieldHost],
  templateUrl: './select-field.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectField {
  readonly options = input.required<Select['options']>();
  protected readonly field = inject(FormField);
}
