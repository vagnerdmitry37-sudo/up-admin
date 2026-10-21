import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { InputNumber } from '@openng/optimus-ui/inputnumber';
import { FieldFrame } from '../field-frame/field-frame';
import { FormField, formFieldHost } from '../form-field';

@Component({
  selector: 'app-number-field',
  imports: [ReactiveFormsModule, InputNumber, FieldFrame],
  hostDirectives: [formFieldHost],
  templateUrl: './number-field.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NumberField {
  readonly min = input<number>();
  readonly fractionDigits = input(0);

  protected readonly field = inject(FormField);
}
