import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { OrderItem } from '@core/api/models';
import { EntityEditPage, EntityWriter } from '@shared/entity/entity-edit-page/entity-edit-page';
import { joinRouteIds } from '@shared/route-ids/route-ids';
import { map } from 'rxjs';
import { OrderItemForm, OrderItemFormValue } from '../order-item-form/order-item-form';
import { OrderItemsService } from '../order-items.service';
import { OrdersService } from '../orders.service';

const toOrderItemRequest = ({ product, startsAt, ...value }: OrderItemFormValue) => ({
  ...value,
  productId: product.id,
  startsAt: startsAt.toISOString(),
});

@Component({
  selector: 'app-edit-order-items-page',
  imports: [EntityEditPage, OrderItemForm],
  templateUrl: './edit-order-items-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditOrderItemsPage {
  readonly orderId = input.required<string>();
  readonly ids = input<string>();

  private readonly ordersService = inject(OrdersService);
  private readonly orderItemsService = inject(OrderItemsService);

  protected readonly loadOrderItems = (ids: string[]) =>
    this.ordersService
      .get([this.orderId()])
      .pipe(
        map((orders) =>
          orders.flatMap((order) => order.items).filter((item) => ids.includes(item.id)),
        ),
      );
  protected readonly orderPath = computed(
    () => `/orders/editor?ids=${joinRouteIds([this.orderId()])}`,
  );
  protected readonly productName = (orderItem: OrderItem) => orderItem.productName;
  protected readonly orderItemWriter: EntityWriter<OrderItem, OrderItemFormValue> = {
    create: (orderItem) =>
      this.orderItemsService.create(this.orderId(), toOrderItemRequest(orderItem)),
    update: (changes) =>
      this.orderItemsService.update(
        this.orderId(),
        changes.map(({ entity, value }) => ({ ...toOrderItemRequest(value), id: entity.id })),
      ),
  };
}
