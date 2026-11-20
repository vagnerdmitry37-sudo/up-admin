import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { API_BASE_URL } from '@core/api-base-url';
import { OrderItem } from '@core/api/models';
import { EditActionsService } from '@core/edit-actions.service';
import { ConfirmationService, MessageService } from '@openng/optimus-ui/api';
import { EntityTable } from '@shared/entity-table/entity-table';
import { OrderItems } from './order-items';

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

describe('OrderItems', () => {
  let httpTestingController: HttpTestingController;
  let editActionsService: EditActionsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: API_BASE_URL, useValue: '/api' },
        ConfirmationService,
        MessageService,
      ],
    });
    httpTestingController = TestBed.inject(HttpTestingController);
    editActionsService = TestBed.inject(EditActionsService);
  });

  afterEach(() => httpTestingController.verify());

  const expectFirstPage = () =>
    httpTestingController.expectOne(
      (request) =>
        request.method === 'GET' &&
        request.url === '/api/orders/o1/items' &&
        request.params.get('first') === '0' &&
        request.params.get('rows') === '50',
    );

  const render = async (items: OrderItem[]) => {
    const fixture = TestBed.createComponent(OrderItems);
    fixture.componentRef.setInput('orderId', 'o1');
    fixture.detectChanges();
    expectFirstPage().flush({ items, totalRecords: items.length });
    await fixture.whenStable();
    return fixture;
  };

  const select = async (fixture: ComponentFixture<OrderItems>, items: OrderItem[]) => {
    const table = fixture.debugElement.query(By.directive(EntityTable))
      .componentInstance as EntityTable<OrderItem>;
    table.selection.set(items);
    await fixture.whenStable();
  };

  it('deletes the selected items of its order in one request and reloads them', async () => {
    const confirmationService = TestBed.inject(ConfirmationService);
    vi.spyOn(confirmationService, 'confirm').mockImplementation((confirmation) => {
      confirmation.accept?.();
      return confirmationService;
    });
    const fixture = await render([orderItem('i1'), orderItem('i2'), orderItem('i3')]);

    await select(fixture, [orderItem('i1'), orderItem('i3')]);
    editActionsService.run('delete');

    const request = httpTestingController.expectOne(
      (candidate) => candidate.method === 'DELETE' && candidate.url === '/api/orders/o1/items',
    );
    expect(request.request.params.getAll('ids')).toEqual(['i1', 'i3']);
    request.flush(null);
    await new Promise((resolve) => setTimeout(resolve));
    expectFirstPage().flush({ items: [orderItem('i2')], totalRecords: 1 });
    await fixture.whenStable();

    expect(editActionsService.actions().delete).toBeUndefined();
  });
});
