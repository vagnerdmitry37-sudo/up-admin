import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Order } from '@core/api/models';
import { parseRouteIds } from '@shared/route-ids/route-ids';
import { EntityTabs } from '@shared/entity-tabs/entity-tabs';
import { OrdersService } from '../orders.service';

@Component({
  selector: 'app-edit-orders-page',
  imports: [EntityTabs],
  templateUrl: './edit-orders-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditOrdersPage {
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
