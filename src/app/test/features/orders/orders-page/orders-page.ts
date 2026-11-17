import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Order } from '@core/api/models';
import { OrdersService } from '@features/orders/orders.service';
import { TableColumn } from '@shared/data-table/data-table';
import { LazyRows } from '@shared/data-table/lazy-rows';
import { joinRouteIds } from '@shared/route-ids/route-ids';
import { EntityTable } from '@tests/shared/entity-table/entity-table';

@Component({
  selector: 'app-orders-page',
  imports: [EntityTable],
  templateUrl: './orders-page.html',
  styleUrl: './orders-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdersPage implements OnInit {
  private readonly router = inject(Router);

  protected readonly lazyRows = new LazyRows<Order>(inject(OrdersService).list);
  protected readonly columns: TableColumn<Order>[] = [
    { header: 'Number', value: (order) => order.number },
    { header: 'Created', value: (order) => order.createdAt },
    { header: 'Customer', value: (order) => order.customerName },
    { header: 'Status', value: (order) => order.status },
    { header: 'Total', value: (order) => order.totalPrice, align: 'end' },
  ];

  ngOnInit() {
    this.lazyRows.reload();
  }

  protected openOrders = (ids: string[]) =>
    this.router.navigate(['/order-test'], {
      queryParams: ids.length > 0 ? { ids: joinRouteIds(ids) } : undefined,
    });
}
