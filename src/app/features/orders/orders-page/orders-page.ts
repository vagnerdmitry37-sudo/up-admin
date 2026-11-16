import { formatDate } from '@angular/common';
import { ChangeDetectionStrategy, Component, LOCALE_ID, OnInit, inject } from '@angular/core';
import { Order } from '@core/api/models';
import { DataTable, TableColumn } from '@shared/data-table/data-table';
import { LazyRows } from '@shared/data-table/lazy-rows';
import { EmptyState } from '@shared/empty-state/empty-state';
import { PageTitle } from '@shared/page-title/page-title';
import { OrdersService } from '../orders.service';

@Component({
  selector: 'app-orders-page',
  imports: [DataTable, EmptyState, PageTitle],
  templateUrl: './orders-page.html',
  styleUrl: './orders-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdersPage implements OnInit {
  private readonly ordersService = inject(OrdersService);
  private readonly locale = inject(LOCALE_ID);

  protected readonly lazyRows = new LazyRows<Order>(this.ordersService.list);
  protected readonly columns: TableColumn<Order>[] = [
    { header: 'Number', value: (order) => order.number },
    { header: 'Created', value: (order) => formatDate(order.createdAt, 'short', this.locale) },
    { header: 'Customer', value: (order) => order.customerName },
    { header: 'Status', value: (order) => order.status },
    { header: 'Total', value: (order) => order.totalPrice, align: 'end' },
  ];

  ngOnInit() {
    this.lazyRows.reload();
  }
}
