import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { NonNullableFormBuilder, Validators } from '@angular/forms';
import { Customer, Order } from '@core/api/models';
import { SearchField } from '@shared/form-fields/search-field/search-field';
import { EntityForm } from '@shared/entity-test/entity-form/entity-form';
import { OrdersService } from '../orders.service';

export interface OrderFormValue {
  customer: Customer;
}

@Component({
  selector: 'app-order-form',
  imports: [SearchField, EntityForm],
  templateUrl: './order-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderForm {
  readonly order = input<Order>();

  private readonly formBuilder = inject(NonNullableFormBuilder);

  protected readonly searchCustomers = inject(OrdersService).searchCustomers;
  protected readonly customerLabel = (customer: Customer) => `${customer.name} · ${customer.email}`;
  protected readonly form = this.formBuilder.group({
    customer: this.formBuilder.control<Customer | null>(null, Validators.required),
  });
}
