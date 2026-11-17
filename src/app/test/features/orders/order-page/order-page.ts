import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Order } from '@core/api/models';
import { OrdersService } from '@features/orders/orders.service';
import { parseRouteIds } from '@shared/route-ids/route-ids';
import { EntityTabs } from '@tests/shared/entity-tabs/entity-tabs';

@Component({
  selector: 'app-test-order-page',
  imports: [EntityTabs],
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
  protected readonly orderNumber = (order: Order) => order.number;
}
