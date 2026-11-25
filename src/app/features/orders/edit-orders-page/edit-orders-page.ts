import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { Order } from '@core/api/models';
import { EntityEditPage, EntityWriter } from '@shared/entity/entity-edit-page/entity-edit-page';
import { OrderForm, OrderFormValue } from '../order-form/order-form';
import { OrderItemsTable } from '../order-items-table/order-items-table';
import { OrdersService } from '../orders.service';

@Component({
  selector: 'app-edit-orders-page',
  imports: [EntityEditPage, OrderForm, OrderItemsTable],
  templateUrl: './edit-orders-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditOrdersPage {
  readonly ids = input<string>();

  private readonly ordersService = inject(OrdersService);

  protected readonly loadOrders = this.ordersService.get;
  protected readonly orderNumber = (order: Order) => order.number;
  protected readonly orderWriter: EntityWriter<Order, OrderFormValue> = {
    create: (order) => this.ordersService.create({ customerId: order.customer.id, items: [] }),
    update: (changes) =>
      this.ordersService.update(
        changes.map(({ entity, value }) => ({ id: entity.id, customerId: value.customer.id })),
      ),
  };
}
