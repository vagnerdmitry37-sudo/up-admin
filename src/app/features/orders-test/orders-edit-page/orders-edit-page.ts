import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { Order } from '@core/api/models';
import { EntityEditPage } from '@shared/entity-test/entity-edit-page/entity-edit-page';
import { OrderForm } from '../order-form/order-form';
import { OrdersService } from '../orders.service';

@Component({
  selector: 'app-orders-edit-page',
  imports: [EntityEditPage, OrderForm],
  templateUrl: './orders-edit-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdersEditPage {
  readonly ids = input<string>();

  protected readonly loadOrders = inject(OrdersService).get;
  protected readonly orderNumber = (order: Order) => order.number;
}
