import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { Order } from '@core/api/models';
import { EntityEditPage } from '@shared/entity-edit-page/entity-edit-page';
import { OrderForm, OrderFormValue } from '../order-form/order-form';
import { OrdersService } from '../orders.service';

@Component({
  selector: 'app-edit-orders-page',
  imports: [EntityEditPage, OrderForm],
  templateUrl: './edit-orders-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditOrdersPage {
  readonly ids = input<string>();

  private readonly ordersService = inject(OrdersService);

  protected readonly loadOrders = this.ordersService.get;
  protected readonly orderNumber = (order: Order) => order.number;
  protected readonly createOrder = (order: OrderFormValue) =>
    this.ordersService.create({ customerId: order.customer.id, items: [] });
}
