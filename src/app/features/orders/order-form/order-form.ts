import { formatDate } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  LOCALE_ID,
  computed,
  inject,
  input,
  linkedSignal,
  output,
  viewChild,
  viewChildren,
} from '@angular/core';
import { CreateOrderItemRequest, Order, Product } from '@core/api/models';
import { DataTable, TableColumn } from '@shared/data-table/data-table';
import { EmptyState } from '@shared/empty-state/empty-state';
import { PageTitle } from '@shared/page-title/page-title';
import { SaveStatuses } from '@shared/save-zone/save-statuses';
import { OrderCustomer, OrderCustomerForm } from '../order-customer-form/order-customer-form';
import { OrderItemForm } from '../order-item-form/order-item-form';

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

const NEW_ORDER_KEY = 'new';

@Component({
  selector: 'app-order-form',
  imports: [DataTable, EmptyState, OrderCustomerForm, OrderItemForm, PageTitle],
  templateUrl: './order-form.html',
  styleUrl: './order-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderForm {
  readonly order = input<Order>();
  readonly products = input<Product[]>([]);
  readonly formStatuses = input<SaveStatuses>({});
  readonly submitted = output();

  private readonly locale = inject(LOCALE_ID);
  private readonly customerForm = viewChild.required(OrderCustomerForm);
  private readonly itemForms = viewChildren(OrderItemForm);
  private readonly isNew = computed(() => !this.order());
  private readonly orderKey = computed(() => this.order()?.id ?? NEW_ORDER_KEY);
  private nextItemFormId = 0;

  protected readonly itemFormIds = linkedSignal<number[]>(() =>
    this.isNew() ? [this.nextItemFormId++] : [],
  );
  protected readonly items = computed(() => this.order()?.items ?? []);
  protected readonly heading = computed(() => {
    const order = this.order();
    return order ? `Order ${order.number}` : 'New order';
  });
  protected readonly customerKey = computed(() => `${this.orderKey()}/customer`);
  protected readonly itemKey = (formId: number) => `${this.orderKey()}/item-${formId}`;
  protected readonly columns: TableColumn<OrderItem>[] = [
    { header: 'Product', value: (item) => item.productName },
    { header: 'Start', value: (item) => formatDate(item.startsAt, 'short', this.locale) },
    { header: 'Passengers', value: (item) => item.passengers, align: 'end' },
    { header: 'Pickup address', value: (item) => item.pickupAddress },
    { header: 'Total', value: (item) => item.totalPrice, align: 'end' },
  ];

  readonly hasUnsavedChanges = computed(
    () =>
      this.customerForm().hasUnsavedChanges() ||
      this.itemForms().some((form) => form.hasUnsavedChanges()),
  );

  addItemForm = () => this.itemFormIds.update((formIds) => [...formIds, this.nextItemFormId++]);

  removeItemForm = (formId: number) =>
    this.itemFormIds.update((formIds) => formIds.filter((candidate) => candidate !== formId));

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
