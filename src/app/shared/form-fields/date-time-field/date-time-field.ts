import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { DatePicker } from '@openng/optimus-ui/datepicker';
import { FieldFrame } from '../field-frame/field-frame';
import { FormField, formFieldHost } from '../form-field';

@Component({
  selector: 'app-date-time-field',
  imports: [ReactiveFormsModule, DatePicker, FieldFrame],
  hostDirectives: [formFieldHost],
  templateUrl: './date-time-field.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DateTimeField {
  readonly minDate = input<Date | null>(null);

  protected readonly field = inject(FormField);
}
