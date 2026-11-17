import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Order } from '@core/api/models';
import { OrdersService } from '@features/orders/orders.service';
import { TableColumn } from '@shared/data-table/data-table';
import { parseRouteIds } from '@shared/route-ids/route-ids';
import { EntityTable } from '@tests/shared/entity-table/entity-table';

type OrderItem = Order['items'][number];

@Component({
  selector: 'app-test-order-page',
  imports: [EntityTable],
  templateUrl: './order-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderPage {
  readonly ids = input<string>();

  private readonly ordersService = inject(OrdersService);

  protected readonly orders = rxResource({
    params: () => {
      const ids = this.ids();
      return ids ? parseRouteIds(ids) : undefined;
    },
    stream: ({ params }) => this.ordersService.get(params),
  });
  protected readonly items = computed(() =>
    this.orders.hasValue() ? this.orders.value().flatMap((order) => order.items) : [],
  );

  protected readonly columns: TableColumn<OrderItem>[] = [
    { header: 'Product', value: (item) => item.productName },
    { header: 'Start', value: (item) => item.startsAt },
    { header: 'Passengers', value: (item) => item.passengers, align: 'end' },
    { header: 'Pickup address', value: (item) => item.pickupAddress },
    { header: 'Price', value: (item) => item.totalPrice, align: 'end' },
  ];
}
