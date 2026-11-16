import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { EditActionsService } from '@core/edit-actions.service';
import { SaveStatuses, saveWithStatus } from '@shared/save-zone/save-statuses';
import { OrderForm } from '../order-form/order-form';
import { OrdersService } from '../orders.service';

@Component({
  selector: 'app-order-page',
  imports: [OrderForm],
  templateUrl: './order-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderPage {
  private readonly router = inject(Router);
  private readonly ordersService = inject(OrdersService);
  private readonly form = viewChild.required(OrderForm);
  private readonly saving = signal(false);

  protected readonly formStatuses = signal<SaveStatuses>({});
  protected readonly products = rxResource({ stream: () => this.ordersService.getProducts() });
  protected readonly productList = computed(() =>
    this.products.hasValue() ? this.products.value() : [],
  );

  constructor() {
    inject(EditActionsService).register({
      actions: () => ({
        create: {
          click: () => this.form().addItemForm(),
          visible: !this.saving(),
        },
        save: {
          click: () => this.save(),
          visible: !this.saving() && this.form().hasUnsavedChanges(),
        },
      }),
    });
  }

  protected async save(): Promise<void> {
    if (this.saving()) {
      return;
    }
    const value = this.form().validValue();
    const customer = value?.customer;
    if (!value || !customer) {
      return;
    }
    this.saving.set(true);
    try {
      const created = await saveWithStatus(
        this.formStatuses,
        [value.customerKey, ...value.items.map(({ key }) => key)],
        () =>
          this.ordersService.create({ ...customer, items: value.items.map(({ item }) => item) }),
      );
      await this.router.navigate(['/orders', created.id, 'edit'], { replaceUrl: true });
    } finally {
      this.saving.set(false);
    }
  }
}
