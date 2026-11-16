import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { NonNullableFormBuilder, Validators } from '@angular/forms';
import { CreateOrderItemRequest, Product } from '@core/api/models';
import { DateTimeField } from '@shared/form-fields/date-time-field/date-time-field';
import { NumberField } from '@shared/form-fields/number-field/number-field';
import { SelectField } from '@shared/form-fields/select-field/select-field';
import { TextareaField } from '@shared/form-fields/textarea-field/textarea-field';
import { TextField } from '@shared/form-fields/text-field/text-field';
import { FormRow } from '@shared/form-row/form-row';
import { formDirty } from '@shared/form-shell/form-dirty';
import { FormShell } from '@shared/form-shell/form-shell';
import { SaveStatus, SaveZone } from '@shared/save-zone/save-zone';

@Component({
  selector: 'app-order-item-form',
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
  templateUrl: './order-item-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderItemForm {
  readonly products = input<Product[]>([]);
  readonly formStatus = input<SaveStatus>('idle');
  readonly submitted = output();

  private readonly formBuilder = inject(NonNullableFormBuilder);

  protected readonly earliestStart = new Date();
  protected readonly productOptions = computed(() =>
    this.products().map(({ id, name, typeLabel }) => ({
      label: `${name} (${typeLabel})`,
      value: id,
    })),
  );
  protected readonly form = this.formBuilder.group({
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

  validate = (): CreateOrderItemRequest | undefined => {
    const { productId, startsAt, ...item } = this.form.getRawValue();
    if (this.form.invalid || !productId || !startsAt) {
      this.form.markAllAsTouched();
      return undefined;
    }
    return { ...item, productId, startsAt: startsAt.toISOString() };
  };

  reset = () => this.form.reset();
}
