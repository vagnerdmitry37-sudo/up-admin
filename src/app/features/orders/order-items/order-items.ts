import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { OrderItem } from '@core/api/models';
import { TableColumn } from '@shared/data-table/data-table';
import { RowsPageLoader } from '@shared/data-table/lazy-rows';
import { EntityListPage } from '@shared/entity-list-page/entity-list-page';
import { OrderItemsService } from '../order-items.service';

@Component({
  selector: 'app-order-items',
  imports: [EntityListPage],
  templateUrl: './order-items.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderItems {
  readonly orderId = input.required<string>();

  private readonly orderItemsService = inject(OrderItemsService);

  protected readonly editPath = computed(() => `/edit-order-items-page/${this.orderId()}`);
  protected readonly loadPage: RowsPageLoader<OrderItem> = (first, rows) =>
    this.orderItemsService.list(this.orderId(), first, rows);
  protected readonly deleteItems = (ids: string[]) =>
    this.orderItemsService.delete(this.orderId(), ids);
  protected readonly columns: TableColumn<OrderItem>[] = [
    { header: 'Product', value: (item) => item.productName },
    { header: 'Starts', value: (item) => item.startsAt },
    { header: 'Passengers', value: (item) => item.passengers, align: 'end' },
    { header: 'Pickup address', value: (item) => item.pickupAddress },
    { header: 'Total', value: (item) => item.totalPrice, align: 'end' },
  ];
}
