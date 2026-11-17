import { formatDate, formatNumber } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  LOCALE_ID,
  computed,
  inject,
  input,
  linkedSignal,
  output,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { CreateOrderItemRequest, Order, Product } from '@core/api/models';
import { DataTable, TableColumn } from '@shared/data-table/data-table';
import { EmptyState } from '@shared/empty-state/empty-state';
import { EntityTabs } from '@shared/entity-tabs/entity-tabs';
import { PageTitle } from '@shared/page-title/page-title';
import { SaveStatuses } from '@shared/save-zone/save-statuses';
import { OrderCustomer, OrderCustomerForm } from '../order-customer-form/order-customer-form';
import { OrderItemForm, OrderItemSeed } from '../order-item-form/order-item-form';

type OrderItem = Order['items'][number];

export interface OrderItemDraft {
  key: string;
  formId: number;
  item: CreateOrderItemRequest;
}

export interface OrderFormValue {
  customerKey: string;
  customer?: OrderCustomer;
  items: OrderItemDraft[];
}

interface ItemFormEntry {
  id: string;
  formId: number;
  seed?: OrderItemSeed;
}

const toItemFormEntry = (formId: number, seed?: OrderItemSeed): ItemFormEntry => ({
  id: String(formId),
  formId,
  seed,
});

const toItemSeed = ({ productId, passengers, pickupAddress, notes }: OrderItem): OrderItemSeed => ({
  productId,
  passengers,
  pickupAddress,
  notes,
});

const NEW_ORDER_KEY = 'new';

@Component({
  selector: 'app-order-form',
  imports: [DataTable, EmptyState, EntityTabs, OrderCustomerForm, OrderItemForm, PageTitle],
  templateUrl: './order-form.html',
  styleUrl: './order-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderForm {
  readonly order = input<Order>();
  readonly source = input<Order>();
  readonly products = input<Product[]>([]);
  readonly formStatuses = input<SaveStatuses>({});
  readonly itemsLoading = input(false);
  readonly submitted = output();

  private readonly locale = inject(LOCALE_ID);
  private readonly customerForm = viewChild.required(OrderCustomerForm);
  private readonly itemForms = viewChildren(OrderItemForm);
  private readonly isNew = computed(() => !this.order());
  private readonly orderKey = computed(
    () => this.order()?.id ?? this.source()?.id ?? NEW_ORDER_KEY,
  );
  private nextItemFormId = 0;
  private readonly formatPrice = (price: number) => formatNumber(price, this.locale, '1.2-2');

  protected readonly itemFormEntries = linkedSignal<ItemFormEntry[]>(() => {
    const sourceItems = this.source()?.items ?? [];
    if (sourceItems.length) {
      return sourceItems.map((item) => toItemFormEntry(this.nextItemFormId++, toItemSeed(item)));
    }
    return this.isNew() ? [toItemFormEntry(this.nextItemFormId++)] : [];
  });
  protected readonly activeItemTab = signal<string | undefined>(undefined);
  protected readonly itemTabLabel = (entry: ItemFormEntry) =>
    `New item ${this.itemFormEntries().indexOf(entry) + 1}`;
  protected readonly items = computed(() => this.order()?.items ?? []);
  protected readonly heading = computed(() => {
    const order = this.order();
    const source = this.source();
    if (order) {
      return `Order ${order.number}`;
    }
    return source ? `Copy of order ${source.number}` : 'New order';
  });
  protected readonly customerKey = computed(() => `${this.orderKey()}/customer`);
  protected readonly itemKey = (formId: number) => `${this.orderKey()}/item-${formId}`;
  protected readonly columns: TableColumn<OrderItem>[] = [
    { header: 'Product', value: (item) => item.productName },
    { header: 'Start', value: (item) => formatDate(item.startsAt, 'short', this.locale) },
    { header: 'Passengers', value: (item) => item.passengers, align: 'end' },
    { header: 'Pickup address', value: (item) => item.pickupAddress },
    {
      header: 'Price',
      value: (item) => this.formatPrice(item.totalPrice),
      align: 'end',
    },
  ];
  protected readonly totalPrice = computed(() => this.formatPrice(this.order()?.totalPrice ?? 0));

  readonly selectedItems = linkedSignal<Order | undefined, OrderItem[]>({
    source: this.order,
    computation: () => [],
  });

  readonly hasUnsavedChanges = computed(
    () =>
      this.customerForm().hasUnsavedChanges() ||
      this.itemForms().some((form) => form.hasUnsavedChanges()),
  );

  addItemForm(): void {
    const entry = toItemFormEntry(this.nextItemFormId++);
    this.itemFormEntries.update((entries) => [...entries, entry]);
    this.activeItemTab.set(entry.id);
  }

  removeItemForm = (formId: number) =>
    this.itemFormEntries.update((entries) =>
      entries.filter((candidate) => candidate.formId !== formId),
    );

  lockItemFormAsSaved = (formId: number) =>
    this.itemForms()
      .find((form) => form.formId() === formId)
      ?.lockAsSaved();

  resetCustomer = (customer: OrderCustomer) => this.customerForm().reset(customer);

  validValue(): OrderFormValue | undefined {
    const touchedForms = this.itemForms().filter((form) => form.hasUnsavedChanges());
    const itemForms =
      touchedForms.length || !this.isNew() ? touchedForms : this.itemForms().slice(0, 1);
    const customerChanged = this.isNew() || this.customerForm().hasUnsavedChanges();
    const customer = customerChanged ? this.customerForm().validate() : undefined;
    const items = itemForms.map((form) => ({
      key: this.itemKey(form.formId()),
      formId: form.formId(),
      item: form.validate(),
    }));
    const validItems = items.filter((draft): draft is OrderItemDraft => draft.item !== undefined);
    const firstInvalidItem = items.find((draft) => draft.item === undefined);
    if (firstInvalidItem) {
      this.activeItemTab.set(String(firstInvalidItem.formId));
    }
    if (
      (customerChanged && !customer) ||
      validItems.length < items.length ||
      (this.isNew() && !validItems.length)
    ) {
      return undefined;
    }
    return { customerKey: this.customerKey(), customer, items: validItems };
  }
}
