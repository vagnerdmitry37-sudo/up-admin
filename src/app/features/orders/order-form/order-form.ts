import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { NonNullableFormBuilder, Validators } from '@angular/forms';
import { TextField } from '@shared/form-fields/text-field/text-field';
import { EntityForm } from '@shared/entity-form/entity-form';

export interface OrderFormValue {
  customer: string;
}

@Component({
  selector: 'app-order-form',
  imports: [TextField, EntityForm],
  templateUrl: './order-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderForm {
  readonly order = input<OrderFormValue>();

  private readonly formBuilder = inject(NonNullableFormBuilder);

  protected readonly form = this.formBuilder.group({
    customer: ['', [Validators.required, Validators.maxLength(200)]],
  });
}
