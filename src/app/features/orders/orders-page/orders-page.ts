import { formatDate } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  LOCALE_ID,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { Order } from '@core/api/models';
import { EditActionsService } from '@core/edit-actions.service';
import { DataTable, TableColumn } from '@shared/data-table/data-table';
import { LazyRows } from '@shared/data-table/lazy-rows';
import { EmptyState } from '@shared/empty-state/empty-state';
import { PageTitle } from '@shared/page-title/page-title';
import { joinRouteIds } from '@shared/route-ids/route-ids';
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
  protected readonly selected = signal<Order[]>([]);
  protected readonly columns: TableColumn<Order>[] = [
    { header: 'Number', value: (order) => order.number },
    { header: 'Created', value: (order) => formatDate(order.createdAt, 'short', this.locale) },
    { header: 'Customer', value: (order) => order.customerName },
    { header: 'Status', value: (order) => order.status },
    { header: 'Total', value: (order) => order.totalPrice, align: 'end' },
  ];

  constructor() {
    const router = inject(Router);
    inject(EditActionsService).register({
      actions: () => {
        const ids = this.selected().map((order) => order.id);
        return {
          create: {
            click: () => router.navigate(['/orders/new']),
            suggested: this.lazyRows.empty(),
          },
          edit: {
            click: () => router.navigate(['/orders', joinRouteIds(ids), 'edit']),
            visible: ids.length > 0,
          },
        };
      },
    });
  }

  ngOnInit() {
    this.lazyRows.reload();
  }
}
