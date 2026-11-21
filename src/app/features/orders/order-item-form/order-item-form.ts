import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { NonNullableFormBuilder, Validators } from '@angular/forms';
import { OrderItem, Product } from '@core/api/models';
import { DateTimeField } from '@shared/form-fields/date-time-field/date-time-field';
import { NumberField } from '@shared/form-fields/number-field/number-field';
import { SearchField } from '@shared/form-fields/search-field/search-field';
import { TextField } from '@shared/form-fields/text-field/text-field';
import { TextareaField } from '@shared/form-fields/textarea-field/textarea-field';
import { EntityForm } from '@shared/entity-form/entity-form';
import { OrdersService } from '../orders.service';

export type OrderItemProduct = Pick<Product, 'id' | 'name' | 'typeLabel'>;

export interface OrderItemFormValue {
  product: OrderItemProduct;
  startsAt: Date;
  passengers: number;
  pickupAddress: string;
  notes: string;
}

@Component({
  selector: 'app-order-item-form',
  imports: [DateTimeField, NumberField, SearchField, TextField, TextareaField, EntityForm],
  templateUrl: './order-item-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderItemForm {
  readonly orderItem = input<OrderItem>();

  private readonly formBuilder = inject(NonNullableFormBuilder);

  protected readonly searchProducts = inject(OrdersService).searchProducts;
  protected readonly productLabel = (product: OrderItemProduct) =>
    `${product.name} · ${product.typeLabel}`;
  protected readonly formValue = computed(() => {
    const orderItem = this.orderItem();
    return orderItem
      ? {
          ...orderItem,
          product: {
            id: orderItem.productId,
            name: orderItem.productName,
            typeLabel: orderItem.productTypeLabel,
          },
          startsAt: new Date(orderItem.startsAt),
        }
      : undefined;
  });
  protected readonly form = this.formBuilder.group({
    product: this.formBuilder.control<OrderItemProduct | null>(null, Validators.required),
    startsAt: this.formBuilder.control<Date | null>(null, Validators.required),
    passengers: this.formBuilder.control<number>(1, [
      Validators.required,
      Validators.min(1),
      Validators.max(100),
    ]),
    pickupAddress: ['', [Validators.required, Validators.maxLength(300)]],
    notes: ['', [Validators.maxLength(1000)]],
  });
}
