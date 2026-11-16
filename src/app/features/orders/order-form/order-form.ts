import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import { NonNullableFormBuilder, Validators } from '@angular/forms';
import { CreateOrderRequest, Product } from '@core/api/models';
import { DateTimeField } from '@shared/form-fields/date-time-field/date-time-field';
import { NumberField } from '@shared/form-fields/number-field/number-field';
import { SelectField } from '@shared/form-fields/select-field/select-field';
import { TextField } from '@shared/form-fields/text-field/text-field';
import { TextareaField } from '@shared/form-fields/textarea-field/textarea-field';
import { FormRow } from '@shared/form-row/form-row';
import { formDirty } from '@shared/form-shell/form-dirty';
import { FormShell } from '@shared/form-shell/form-shell';
import { SaveStatus, SaveZone } from '@shared/save-zone/save-zone';

export type OrderFormValue = CreateOrderRequest;

@Component({
  selector: 'app-order-form',
  imports: [
    DateTimeField,
    FormRow,
    FormShell,
    NumberField,
    SaveZone,
    SelectField,
    TextField,
    TextareaField,
  ],
  templateUrl: './order-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderForm {
  readonly products = input<Product[]>([]);
  readonly formStatus = input<SaveStatus>('idle');
  readonly submitted = output<OrderFormValue>();

  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly shell = viewChild.required(FormShell);

  protected readonly earliestStart = new Date();
  protected readonly productOptions = computed(() =>
    this.products().map(({ id, name, typeLabel }) => ({
      label: `${name} (${typeLabel})`,
      value: id,
    })),
  );
  protected readonly form = this.formBuilder.group({
    customerName: ['', [Validators.required, Validators.maxLength(200)]],
    customerEmail: ['', [Validators.required, Validators.email, Validators.maxLength(256)]],
    customerPhone: ['', [Validators.required, Validators.maxLength(50)]],
    productId: this.formBuilder.control<string | null>(null, Validators.required),
    startsAt: this.formBuilder.control<Date | null>(null, Validators.required),
    passengers: this.formBuilder.control<number>(1, [
      Validators.required,
      Validators.min(1),
      Validators.max(100),
    ]),
    pickupAddress: ['', [Validators.required, Validators.maxLength(300)]],
    notes: ['', [Validators.maxLength(1000)]],
  });

  readonly hasUnsavedChanges = formDirty(this.form);

  save = () => this.shell().submit();

  protected submit(): void {
    const { customerName, customerEmail, customerPhone, productId, startsAt, ...item } =
      this.form.getRawValue();
    if (productId && startsAt) {
      this.submitted.emit({
        customerName,
        customerEmail,
        customerPhone,
        items: [{ ...item, productId, startsAt: startsAt.toISOString() }],
      });
    }
  }
}
