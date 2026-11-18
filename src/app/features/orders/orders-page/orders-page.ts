import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Order } from '@core/api/models';
import { TableColumn } from '@shared/data-table/data-table';
import { EntityListPage } from '@shared/entity-list-page/entity-list-page';
import { OrdersService } from '../orders.service';

@Component({
  selector: 'app-orders-page',
  imports: [EntityListPage],
  templateUrl: './orders-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdersPage {
  protected readonly loadPage = inject(OrdersService).list;
  protected readonly columns: TableColumn<Order>[] = [
    { header: 'Number', value: (order) => order.number },
    { header: 'Created', value: (order) => order.createdAt },
    { header: 'Status', value: (order) => order.status },
    { header: 'Total', value: (order) => order.totalPrice, align: 'end' },
  ];
}
