import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
import { NonNullableFormBuilder, Validators } from '@angular/forms';
import { TextField } from '@shared/form-fields/text-field/text-field';
import { FormRow } from '@shared/form-row/form-row';
import { formDirty } from '@shared/form-shell/form-dirty';
import { FormShell } from '@shared/form-shell/form-shell';
import { SaveStatus, SaveZone } from '@shared/save-zone/save-zone';

export interface OrderCustomer {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
}

@Component({
  selector: 'app-order-customer-form',
  imports: [FormRow, FormShell, SaveZone, TextField],
  templateUrl: './order-customer-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderCustomerForm {
  readonly customer = input<OrderCustomer>();
  readonly formStatus = input<SaveStatus>('idle');
  readonly submitted = output();

  private readonly formBuilder = inject(NonNullableFormBuilder);

  protected readonly form = this.formBuilder.group({
    customerName: ['', [Validators.required, Validators.maxLength(200)]],
    customerEmail: ['', [Validators.required, Validators.email, Validators.maxLength(256)]],
    customerPhone: ['', [Validators.required, Validators.maxLength(50)]],
  });

  readonly hasUnsavedChanges = formDirty(this.form);

  constructor() {
    effect(() => {
      const customer = this.customer();
      if (customer && !this.form.dirty) {
        this.reset(customer);
      }
    });
  }

  validate = (): OrderCustomer | undefined => {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return undefined;
    }
    return this.form.getRawValue();
  };

  reset = ({ customerName, customerEmail, customerPhone }: OrderCustomer) =>
    this.form.reset({ customerName, customerEmail, customerPhone });
}
