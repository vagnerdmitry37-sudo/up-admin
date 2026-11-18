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
import { EntityForm } from '@shared/entity-form/entity-form';

export interface CustomerFormValue {
  name: string;
  email: string;
  phone: string;
}

@Component({
  selector: 'app-customer-form',
  imports: [TextField, EntityForm],
  templateUrl: './customer-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerForm {
  readonly customer = input<CustomerFormValue>();

  private readonly formBuilder = inject(NonNullableFormBuilder);

  protected readonly form = this.formBuilder.group({
    name: ['', [Validators.required, Validators.maxLength(200)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(256)]],
    phone: ['', [Validators.required, Validators.maxLength(50)]],
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
