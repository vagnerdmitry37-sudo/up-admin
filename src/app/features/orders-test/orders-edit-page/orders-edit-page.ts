import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { EntityEditPage } from '@shared/entity-test/entity-edit-page/entity-edit-page';
import { OrdersService } from '../orders.service';

@Component({
  selector: 'app-orders-edit-page',
  imports: [EntityEditPage],
  templateUrl: './orders-edit-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdersEditPage {
  readonly ids = input<string>();

  protected readonly loadOrders = inject(OrdersService).get;
}
