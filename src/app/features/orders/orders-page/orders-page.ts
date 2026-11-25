import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Order } from '@core/api/models';
import { TableColumn } from '@shared/data-table/data-table';
import { EntityPage } from '@shared/entity/entity-page/entity-page';
import { OrdersService } from '../orders.service';

@Component({
  selector: 'app-orders-page',
  imports: [EntityPage],
  templateUrl: './orders-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdersPage {
  private readonly ordersService = inject(OrdersService);

  protected readonly loadPage = this.ordersService.list;
  protected readonly deleteEntities = this.ordersService.delete;
  protected readonly columns: TableColumn<Order>[] = [
    { header: 'Number', value: (order) => order.number },
    { header: 'Created', value: (order) => order.createdAt },
    { header: 'Status', value: (order) => order.status },
    { header: 'Total', value: (order) => order.totalPrice, align: 'end' },
  ];
}
