import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Order } from '@core/api/models';
import { OrdersService } from '@features/orders/orders.service';
import { TableColumn } from '@shared/data-table/data-table';
import { EntityTable } from '@tests/shared/entity-table/entity-table';
import { map } from 'rxjs';

type OrderItem = Order['items'][number];

const ORDERS_TO_LOAD = 50;

@Component({
  selector: 'app-test-order-page',
  imports: [EntityTable],
  templateUrl: './order-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderPage {
  protected readonly items = toSignal(
    inject(OrdersService)
      .list(0, ORDERS_TO_LOAD)
      .pipe(map((page) => page.items.flatMap((order) => order.items))),
  );

  protected readonly columns: TableColumn<OrderItem>[] = [
    { header: 'Product', value: (item) => item.productName },
    { header: 'Start', value: (item) => item.startsAt },
    { header: 'Passengers', value: (item) => item.passengers, align: 'end' },
    { header: 'Pickup address', value: (item) => item.pickupAddress },
    { header: 'Price', value: (item) => item.totalPrice, align: 'end' },
  ];
}
