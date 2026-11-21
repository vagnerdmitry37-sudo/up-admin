import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { API_BASE_URL } from '@core/api-base-url';
import { Order, OrderItem } from '@core/api/models';
import { EditActionsService } from '@core/edit-actions.service';
import { MessageService } from '@openng/optimus-ui/api';
import { EntityTable } from '@shared/entity-table/entity-table';
import { OrderItemsTable } from './order-items-table';

const orderItem = (id: string): OrderItem =>
  ({
    id,
    productId: 'p1',
    productType: 'GroupExcursion',
    productTypeLabel: 'Group excursion',
    productName: `Product ${id}`,
    productAttributes: {},
    unitPrice: 40,
    startsAt: '2026-12-01T09:00:00Z',
    passengers: 2,
    pickupAddress: 'Hotel Pupp',
    notes: '',
    totalPrice: 80,
  }) as OrderItem;

describe('OrderItemsTable', () => {
  let httpTestingController: HttpTestingController;
  let editActionsService: EditActionsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: API_BASE_URL, useValue: '/api' },
        MessageService,
      ],
    });
    httpTestingController = TestBed.inject(HttpTestingController);
    editActionsService = TestBed.inject(EditActionsService);
  });

  afterEach(() => httpTestingController.verify());

  const order = (items: OrderItem[]): Order => ({
    id: 'o1',
    number: 'N-o1',
    status: 'Pending',
    customer: null,
    createdAt: '2026-01-01T00:00:00Z',
    totalPrice: 0,
    items,
  });

  const render = async (items: OrderItem[]) => {
    const fixture = TestBed.createComponent(OrderItemsTable);
    fixture.componentRef.setInput('order', order(items));
    await fixture.whenStable();
    return fixture;
  };

  const entityTable = (fixture: ComponentFixture<OrderItemsTable>) =>
    fixture.debugElement.query(By.directive(EntityTable))
      .componentInstance as EntityTable<OrderItem>;

  const select = async (fixture: ComponentFixture<OrderItemsTable>, items: OrderItem[]) => {
    entityTable(fixture).selection.set(items);
    await fixture.whenStable();
  };

  it('shows the items of its order without requesting them', async () => {
    const fixture = await render([orderItem('i1'), orderItem('i2')]);

    httpTestingController.expectNone(() => true);
    expect(entityTable(fixture).rows()).toEqual([orderItem('i1'), orderItem('i2')]);
  });

  it('deletes the selected items of its order in one request and shows the items left', async () => {
    const fixture = await render([orderItem('i1'), orderItem('i2'), orderItem('i3')]);

    await select(fixture, [orderItem('i1'), orderItem('i3')]);
    editActionsService.run('delete');

    const request = httpTestingController.expectOne(
      (candidate) => candidate.method === 'DELETE' && candidate.url === '/api/orders/o1/items',
    );
    expect(request.request.params.getAll('ids')).toEqual(['i1', 'i3']);
    request.flush(order([orderItem('i2')]));
    await new Promise((resolve) => setTimeout(resolve));
    await fixture.whenStable();

    expect(entityTable(fixture).rows()).toEqual([orderItem('i2')]);
    expect(editActionsService.actions().delete).toBeUndefined();
  });
});
