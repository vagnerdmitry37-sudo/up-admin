import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  linkedSignal,
} from '@angular/core';
import { Order, OrderItem } from '@core/api/models';
import { TableColumn } from '@shared/data-table/data-table';
import { RowsPageLoader } from '@shared/data-table/lazy-rows';
import { EntityListPage } from '@shared/entity-list-page/entity-list-page';
import { of } from 'rxjs';
import { OrderItemsService } from '../order-items.service';

@Component({
  selector: 'app-order-items-table',
  imports: [EntityListPage],
  templateUrl: './order-items-table.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderItemsTable {
  readonly order = input.required<Order>();

  private readonly orderItemsService = inject(OrderItemsService);
  private readonly items = linkedSignal(() => this.order().items);

  protected readonly editPath = computed(() => `/edit-order-items-page/${this.order().id}`);
  protected readonly loadPage: RowsPageLoader<OrderItem> = (first, rows) =>
    of({ items: this.items().slice(first, first + rows), totalRecords: this.items().length });
  protected readonly deleteItems = async (ids: string[]) => {
    const order = await this.orderItemsService.delete(this.order().id, ids);
    this.items.set(order.items);
  };
  protected readonly columns: TableColumn<OrderItem>[] = [
    { header: 'Product', value: (item) => item.productName },
    { header: 'Starts', value: (item) => item.startsAt },
    { header: 'Passengers', value: (item) => item.passengers, align: 'end' },
    { header: 'Pickup address', value: (item) => item.pickupAddress },
    { header: 'Total', value: (item) => item.totalPrice, align: 'end' },
  ];
}
