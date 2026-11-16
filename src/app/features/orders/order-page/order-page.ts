import { formatDate } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  LOCALE_ID,
  computed,
  inject,
  input,
  linkedSignal,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Order } from '@core/api/models';
import { EditActionsService } from '@core/edit-actions.service';
import { DataTable, TableColumn } from '@shared/data-table/data-table';
import { EmptyState } from '@shared/empty-state/empty-state';
import { PageTitle } from '@shared/page-title/page-title';
import { SaveStatuses, saveWithStatus } from '@shared/save-zone/save-statuses';
import { OrderCustomerForm } from '../order-customer-form/order-customer-form';
import { OrderItemForm } from '../order-item-form/order-item-form';
import { OrdersService } from '../orders.service';

type OrderItem = Order['items'][number];

const CUSTOMER_FORM_KEY = 'customer';
const itemFormKey = (formId: number) => `item-${formId}`;

@Component({
  selector: 'app-order-page',
  imports: [DataTable, EmptyState, OrderCustomerForm, OrderItemForm, PageTitle],
  templateUrl: './order-page.html',
  styleUrl: './order-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderPage {
  readonly id = input<string>();

  private readonly router = inject(Router);
  private readonly ordersService = inject(OrdersService);
  private readonly locale = inject(LOCALE_ID);
  private readonly customerForm = viewChild.required(OrderCustomerForm);
  private readonly itemForms = viewChildren(OrderItemForm);
  private readonly saving = signal(false);
  private nextItemFormId = 0;

  protected readonly customerFormKey = CUSTOMER_FORM_KEY;
  protected readonly itemFormKey = itemFormKey;
  protected readonly itemFormIds = linkedSignal<number[]>(() =>
    this.id() ? [] : [this.nextItemFormId++],
  );
  protected readonly formStatuses = signal<SaveStatuses>({});
  protected readonly products = rxResource({ stream: () => this.ordersService.getProducts() });
  protected readonly productList = computed(() =>
    this.products.hasValue() ? this.products.value() : [],
  );
  protected readonly order = rxResource({
    params: () => this.id(),
    stream: ({ params }) => this.ordersService.get(params),
  });
  protected readonly customer = computed(() =>
    this.order.hasValue() ? this.order.value() : undefined,
  );
  protected readonly items = computed(() =>
    this.order.hasValue() ? this.order.value().items : [],
  );
  protected readonly heading = computed(() =>
    this.order.hasValue() ? `Order ${this.order.value().number}` : 'New order',
  );
  protected readonly columns: TableColumn<OrderItem>[] = [
    { header: 'Product', value: (item) => item.productName },
    { header: 'Start', value: (item) => formatDate(item.startsAt, 'short', this.locale) },
    { header: 'Passengers', value: (item) => item.passengers, align: 'end' },
    { header: 'Pickup address', value: (item) => item.pickupAddress },
    { header: 'Total', value: (item) => item.totalPrice, align: 'end' },
  ];

  constructor() {
    inject(EditActionsService).register({
      actions: () => ({
        create: {
          click: () => this.addItemForm(),
          visible: !this.saving(),
        },
        save: {
          click: () => this.submitForms(),
          visible:
            !this.saving() &&
            (this.customerForm().hasUnsavedChanges() ||
              this.itemForms().some((form) => form.hasUnsavedChanges())),
        },
      }),
    });
  }

  protected async submitForms(): Promise<void> {
    if (this.saving()) {
      return;
    }
    this.saving.set(true);
    try {
      const orderId = this.id();
      if (orderId) {
        await this.updateOrder(orderId);
      } else {
        await this.createOrder();
      }
    } finally {
      this.saving.set(false);
    }
  }

  private addItemForm = () =>
    this.itemFormIds.update((formIds) => [...formIds, this.nextItemFormId++]);

  private touchedItemForms = () => this.itemForms().filter((form) => form.hasUnsavedChanges());

  private async createOrder(): Promise<void> {
    const touchedForms = this.touchedItemForms();
    const itemForms = touchedForms.length ? touchedForms : this.itemForms().slice(0, 1);
    const customer = this.customerForm().validate();
    const items = itemForms.map((form) => form.validate());
    const validItems = items.filter((item) => item !== undefined);
    if (!customer || validItems.length === 0 || validItems.length < items.length) {
      return;
    }
    const created = await saveWithStatus(
      this.formStatuses,
      [CUSTOMER_FORM_KEY, ...itemForms.map((form) => itemFormKey(form.formId()))],
      () => this.ordersService.create({ ...customer, items: validItems }),
    );
    await this.router.navigate(['/orders', created.id], { replaceUrl: true });
  }

  private async updateOrder(orderId: string): Promise<void> {
    if (this.customerForm().hasUnsavedChanges()) {
      await this.updateCustomer(orderId);
    }
    await this.addItems(orderId);
  }

  private async updateCustomer(orderId: string): Promise<void> {
    const customer = this.customerForm().validate();
    if (!customer) {
      return;
    }
    const updated = await saveWithStatus(this.formStatuses, [CUSTOMER_FORM_KEY], () =>
      this.ordersService.updateCustomer(orderId, customer),
    );
    this.order.set(updated);
    this.customerForm().reset(updated);
  }

  private async addItems(orderId: string): Promise<void> {
    const itemsToAdd = this.touchedItemForms().map((form) => ({
      formId: form.formId(),
      item: form.validate(),
    }));
    if (itemsToAdd.some(({ item }) => !item)) {
      return;
    }
    for (const { formId, item } of itemsToAdd) {
      if (!item) {
        continue;
      }
      const updated = await saveWithStatus(this.formStatuses, [itemFormKey(formId)], () =>
        this.ordersService.createItem(orderId, item),
      );
      this.order.set(updated);
      this.itemFormIds.update((formIds) => formIds.filter((candidate) => candidate !== formId));
    }
    if (itemsToAdd.length) {
      this.itemFormIds.set([]);
    }
  }
}
