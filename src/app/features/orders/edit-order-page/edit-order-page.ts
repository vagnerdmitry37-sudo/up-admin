import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  linkedSignal,
  signal,
  viewChildren,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Order } from '@core/api/models';
import { ConfirmationService } from '@openng/optimus-ui/api';
import { EditActionsService } from '@core/edit-actions.service';
import { EntityTabs } from '@shared/entity-tabs/entity-tabs';
import { parseRouteIds } from '@shared/route-ids/route-ids';
import { SaveStatuses, saveWithStatus } from '@shared/save-zone/save-statuses';
import { OrderForm, OrderFormValue } from '../order-form/order-form';
import { OrdersService } from '../orders.service';

interface OrderChanges {
  form: OrderForm;
  orderId: string;
  value: OrderFormValue;
}

@Component({
  selector: 'app-edit-order-page',
  imports: [EntityTabs, OrderForm],
  templateUrl: './edit-order-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditOrderPage {
  readonly ids = input.required<string>();

  private readonly ordersService = inject(OrdersService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly forms = viewChildren(OrderForm);
  private readonly saving = signal(false);
  private readonly firstOrderId = computed(() =>
    this.orders.hasValue() ? this.orders.value()[0]?.id : undefined,
  );
  private readonly activeForm = computed(() =>
    this.forms().find((form) => form.order()?.id === this.active()),
  );

  protected readonly formStatuses = signal<SaveStatuses>({});
  protected readonly orders = rxResource({
    params: () => parseRouteIds(this.ids()),
    stream: ({ params }) => this.ordersService.get(params),
  });
  protected readonly products = rxResource({ stream: () => this.ordersService.getProducts() });
  protected readonly productList = computed(() =>
    this.products.hasValue() ? this.products.value() : [],
  );
  protected readonly active = linkedSignal(() => this.firstOrderId());
  protected readonly orderNumber = (order: Order) => order.number;

  constructor() {
    inject(EditActionsService).register({
      actions: () => ({
        create: {
          click: () => this.activeForm()?.addItemForm(),
          visible: !this.saving() && Boolean(this.activeForm()),
        },
        save: {
          click: () => this.save(),
          visible: !this.saving() && this.forms().some((form) => form.hasUnsavedChanges()),
        },
        delete: {
          click: () => this.confirmDeleteItems(),
          visible: !this.saving() && Boolean(this.activeForm()?.selectedItems().length),
        },
      }),
    });
  }

  private confirmDeleteItems(): void {
    const form = this.activeForm();
    const orderId = form?.order()?.id;
    if (!form || !orderId) {
      return;
    }
    const itemIds = form.selectedItems().map((item) => item.id);
    this.confirmationService.confirm({
      header: itemIds.length === 1 ? 'Delete item?' : `Delete ${itemIds.length} items?`,
      message: 'This cannot be undone.',
      acceptLabel: 'Delete',
      rejectLabel: 'Cancel',
      acceptButtonProps: { severity: 'danger' },
      rejectButtonProps: { severity: 'secondary', text: true },
      accept: () => this.deleteItems(form.itemsKey(), orderId, itemIds),
    });
  }

  private async deleteItems(itemsKey: string, orderId: string, itemIds: string[]): Promise<void> {
    this.saving.set(true);
    try {
      const updated = await saveWithStatus(this.formStatuses, [itemsKey], () =>
        this.ordersService.deleteItems(orderId, itemIds),
      );
      this.replaceOrder(updated);
    } finally {
      this.saving.set(false);
    }
  }

  protected async save(): Promise<void> {
    if (this.saving()) {
      return;
    }
    const changes: OrderChanges[] = [];
    for (const form of this.forms()) {
      const orderId = form.order()?.id;
      if (!orderId || !form.hasUnsavedChanges()) {
        continue;
      }
      const value = form.validValue();
      if (!value) {
        this.active.set(orderId);
        return;
      }
      changes.push({ form, orderId, value });
    }
    if (!changes.length) {
      return;
    }
    this.saving.set(true);
    try {
      const results = await Promise.allSettled(changes.map((change) => this.updateOrder(change)));
      const failure = results.find((result) => result.status === 'rejected');
      if (failure) {
        throw failure.reason;
      }
    } finally {
      this.saving.set(false);
    }
  }

  private async updateOrder({ form, orderId, value }: OrderChanges): Promise<void> {
    const { customer, customerKey, items } = value;
    if (customer) {
      const updated = await saveWithStatus(this.formStatuses, [customerKey], () =>
        this.ordersService.updateCustomer(orderId, customer),
      );
      this.replaceOrder(updated);
      form.resetCustomer(updated);
    }
    for (const { key, formId, item } of items) {
      const updated = await saveWithStatus(this.formStatuses, [key], () =>
        this.ordersService.createItem(orderId, item),
      );
      this.replaceOrder(updated);
      form.removeItemForm(formId);
    }
  }

  private replaceOrder = (updated: Order) =>
    this.orders.update((orders) =>
      orders?.map((order) => (order.id === updated.id ? updated : order)),
    );
}
