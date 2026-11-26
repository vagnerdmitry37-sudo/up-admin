import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { API_BASE_URL } from '@core/api-base-url';
import { Order, OrderItem } from '@core/api/models';
import { MessageService } from '@openng/optimus-ui/api';
import { EntityTable } from '@shared/entity/entity-table/entity-table';
import { OrderItemsTable } from './order-items-table';

const orderItem = (id: string): OrderItem =>
  ({
    id,
    productId: 'p1',
    productType: 'GroupExcursion',
    productName: `Product ${id}`,
    unitPrice: 40,
    startsAt: '2026-12-01T09:00:00Z',
    passengers: 2,
    pickupAddress: 'Hotel Pupp',
    notes: '',
    totalPrice: 80,
  }) as OrderItem;

describe('OrderItemsTable', () => {
  let httpTestingController: HttpTestingController;

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

  it('shows the items of its order without requesting them', async () => {
    const fixture = await render([orderItem('i1'), orderItem('i2')]);

    httpTestingController.expectNone(() => true);
    expect(entityTable(fixture).rows()).toEqual([orderItem('i1'), orderItem('i2')]);
  });
});
