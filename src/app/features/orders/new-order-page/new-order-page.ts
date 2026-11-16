import { ChangeDetectionStrategy, Component, inject, signal, viewChild } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { EditActionsService } from '@core/edit-actions.service';
import { SaveStatuses, afterResultsShown, saveWithStatus } from '@shared/save-zone/save-statuses';
import { OrderForm, OrderFormValue } from '../order-form/order-form';
import { OrdersService } from '../orders.service';

const NEW_ORDER_KEY = 'new';

@Component({
  selector: 'app-new-order-page',
  imports: [OrderForm],
  templateUrl: './new-order-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewOrderPage {
  private readonly router = inject(Router);
  private readonly ordersService = inject(OrdersService);
  private readonly form = viewChild(OrderForm);
  private readonly saving = signal(false);

  protected readonly newOrderKey = NEW_ORDER_KEY;
  protected readonly orderFormStatuses = signal<SaveStatuses>({});
  protected readonly products = rxResource({ stream: () => this.ordersService.getProducts() });

  constructor() {
    inject(EditActionsService).register({
      actions: () => ({
        save: {
          click: () => this.form()?.save(),
          visible: Boolean(this.form()?.hasUnsavedChanges()),
        },
      }),
    });
  }

  protected async create(value: OrderFormValue): Promise<void> {
    if (this.saving()) {
      return;
    }
    this.saving.set(true);
    try {
      await saveWithStatus(this.orderFormStatuses, [NEW_ORDER_KEY], () =>
        this.ordersService.create(value),
      );
      afterResultsShown(() => void this.router.navigateByUrl('/orders', { replaceUrl: true }));
    } finally {
      this.saving.set(false);
    }
  }
}
