import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Order } from '@core/api/models';
import { OrdersService } from '@features/orders/orders.service';
import { parseRouteIds } from '@shared/route-ids/route-ids';
import { EntityTabs } from '@tests/shared/entity-tabs/entity-tabs';

@Component({
  selector: 'app-edit-order-page',
  imports: [EntityTabs],
  templateUrl: './edit-order-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditOrderPage {
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
