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
import { Router } from '@angular/router';
import { CreateOrderRequest, Order } from '@core/api/models';
import { EditActionsService } from '@core/edit-actions.service';
import { EntityTabs } from '@shared/entity-tabs/entity-tabs';
import { joinRouteIds, parseRouteIds } from '@shared/route-ids/route-ids';
import { SaveStatuses, afterResultsShown, saveWithStatus } from '@shared/save-zone/save-statuses';
import { OrderForm, OrderFormValue } from '../order-form/order-form';
import { OrdersService } from '../orders.service';

interface OrderCopy {
  sourceId: string;
  value: OrderFormValue;
}

const toCreateRequest = (value: OrderFormValue): CreateOrderRequest => ({
  items: value.items.map(({ item }) => item),
});

const statusKeys = (value: OrderFormValue) => value.items.map(({ key }) => key);

@Component({
  selector: 'app-order-page',
  imports: [EntityTabs, OrderForm],
  templateUrl: './order-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderPage {
  readonly from = input<string>();

  private readonly router = inject(Router);
  private readonly ordersService = inject(OrdersService);
  private readonly forms = viewChildren(OrderForm);
  private readonly saving = signal(false);
  private readonly createdBySource = signal<Record<string, string>>({});
  private readonly firstSourceId = computed(() =>
    this.sources.hasValue() ? this.sources.value()[0]?.id : undefined,
  );
  private readonly activeForm = computed(() =>
    this.from()
      ? this.forms().find((form) => form.source()?.id === this.active())
      : this.forms()[0],
  );

  protected readonly formStatuses = signal<SaveStatuses>({});
  protected readonly products = rxResource({ stream: () => this.ordersService.getProducts() });
  protected readonly productList = computed(() =>
    this.products.hasValue() ? this.products.value() : [],
  );
  protected readonly sources = rxResource({
    params: () => {
      const from = this.from();
      return from ? parseRouteIds(from) : undefined;
    },
    stream: ({ params }) => this.ordersService.get(params),
  });
  protected readonly active = linkedSignal(() => this.firstSourceId());
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
      }),
    });
  }

  protected save(): Promise<void> | undefined {
    if (this.saving()) {
      return undefined;
    }
    return this.from() ? this.createCopies() : this.createOrder();
  }

  private async createOrder(): Promise<void> {
    const value = this.forms()[0]?.validValue();
    if (!value) {
      return;
    }
    this.saving.set(true);
    try {
      const created = await saveWithStatus(this.formStatuses, statusKeys(value), () =>
        this.ordersService.create(toCreateRequest(value)),
      );
      await this.router.navigate(['/orders', created.id, 'edit'], { replaceUrl: true });
    } finally {
      this.saving.set(false);
    }
  }

  private async createCopies(): Promise<void> {
    const copies = this.pendingCopies();
    if (!copies) {
      return;
    }
    this.saving.set(true);
    try {
      const results = await Promise.allSettled(copies.map((copy) => this.createCopy(copy)));
      const failure = results.find((result) => result.status === 'rejected');
      if (failure) {
        throw failure.reason;
      }
      this.openCreatedCopies();
    } finally {
      this.saving.set(false);
    }
  }

  private pendingCopies(): OrderCopy[] | undefined {
    const copies: OrderCopy[] = [];
    const sources = this.sources.hasValue() ? this.sources.value() : [];
    for (const { id: sourceId } of sources) {
      if (this.createdBySource()[sourceId]) {
        continue;
      }
      const value = this.forms()
        .find((form) => form.source()?.id === sourceId)
        ?.validValue();
      if (!value) {
        this.active.set(sourceId);
        return undefined;
      }
      copies.push({ sourceId, value });
    }
    return copies;
  }

  private async createCopy({ sourceId, value }: OrderCopy): Promise<void> {
    const created = await saveWithStatus(this.formStatuses, statusKeys(value), () =>
      this.ordersService.create(toCreateRequest(value)),
    );
    this.createdBySource.update((createdBySource) => ({
      ...createdBySource,
      [sourceId]: created.id,
    }));
  }

  private openCreatedCopies(): void {
    const sources = this.sources.hasValue() ? this.sources.value() : [];
    const createdIds = sources.map(({ id }) => this.createdBySource()[id]);
    if (createdIds.some((id) => !id)) {
      return;
    }
    afterResultsShown(
      () =>
        void this.router.navigateByUrl(`/orders/${joinRouteIds(createdIds)}/edit`, {
          replaceUrl: true,
        }),
    );
  }
}
