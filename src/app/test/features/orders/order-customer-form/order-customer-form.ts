import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  untracked,
} from '@angular/core';
import { NonNullableFormBuilder, Validators } from '@angular/forms';
import { TextField } from '@shared/form-fields/text-field/text-field';
import { EntityForm } from '@tests/shared/entity-form/entity-form';

export interface OrderCustomer {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
}

@Component({
  selector: 'app-order-customer-form',
  imports: [TextField, EntityForm],
  templateUrl: './order-customer-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderCustomerForm {
  readonly customer = input<OrderCustomer>();

  private readonly formBuilder = inject(NonNullableFormBuilder);

  protected readonly form = this.formBuilder.group({
    customerName: ['', [Validators.required, Validators.maxLength(200)]],
    customerEmail: ['', [Validators.required, Validators.email, Validators.maxLength(256)]],
    customerPhone: ['', [Validators.required, Validators.maxLength(50)]],
  });

  constructor() {
    effect(() => {
      const customer = this.customer();
      if (customer) {
        untracked(() => this.form.reset(customer));
      }
    });
  }
}
