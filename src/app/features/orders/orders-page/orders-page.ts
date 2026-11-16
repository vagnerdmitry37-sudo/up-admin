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
import { EditActionConfig, EditActionsService } from '@core/edit-actions.service';
import { ConfirmationService } from '@openng/optimus-ui/api';
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
  private readonly router = inject(Router);
  private readonly locale = inject(LOCALE_ID);
  private readonly confirmationService = inject(ConfirmationService);

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
    inject(EditActionsService).register({
      actions: () => {
        const ids = this.selected().map((order) => order.id);
        return {
          create: this.createAction(ids),
          edit: {
            click: () => this.router.navigate(['/orders', joinRouteIds(ids), 'edit']),
            visible: ids.length > 0,
          },
          delete: this.deleteAction(ids),
        };
      },
    });
  }

  ngOnInit() {
    this.lazyRows.reload();
  }

  private createAction(ids: string[]): EditActionConfig {
    const queryParams = ids.length > 0 ? { from: joinRouteIds(ids) } : undefined;

    return {
      click: () => this.router.navigate(['/orders/new'], { queryParams }),
      suggested: this.lazyRows.empty(),
    };
  }

  private deleteAction(ids: string[]): EditActionConfig {
    return {
      click: () =>
        this.confirmationService.confirm({
          header: ids.length === 1 ? 'Delete order?' : `Delete ${ids.length} orders?`,
          message: 'This cannot be undone.',
          acceptLabel: 'Delete',
          rejectLabel: 'Cancel',
          acceptButtonProps: { severity: 'danger' },
          rejectButtonProps: { severity: 'secondary', text: true },
          accept: () => this.delete(ids),
        }),
      visible: ids.length > 0,
    };
  }

  private async delete(ids: string[]): Promise<void> {
    await this.ordersService.delete(ids);
    this.selected.set([]);
    this.lazyRows.reload();
  }
}
