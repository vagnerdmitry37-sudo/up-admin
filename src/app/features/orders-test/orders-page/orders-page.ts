import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Order } from '@core/api/models';
import { TableColumn } from '@shared/data-table/data-table';
import { EntityPage } from '@shared/entity-test/entity-page/entity-page';
import { OrdersService } from '../orders.service';

@Component({
  selector: 'app-orders-page-test',
  imports: [EntityPage],
  templateUrl: './orders-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdersPageTest {
  readonly ordersService = inject(OrdersService);

  protected readonly columns: TableColumn<Order>[] = [
    { header: 'Number', value: (order) => order.number },
    { header: 'Created', value: (order) => order.createdAt },
    { header: 'Status', value: (order) => order.status },
    { header: 'Total', value: (order) => order.totalPrice, align: 'end' },
  ];
}
