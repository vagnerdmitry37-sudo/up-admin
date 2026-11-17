import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { Order } from '@core/api/models';
import { OrdersService } from '@features/orders/orders.service';
import { DataTable, TableColumn } from '@shared/data-table/data-table';
import { LazyRows } from '@shared/data-table/lazy-rows';

@Component({
  selector: 'app-test-orders-page',
  imports: [DataTable],
  templateUrl: './orders-page.html',
  styleUrl: './orders-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdersPage implements OnInit {
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
}
