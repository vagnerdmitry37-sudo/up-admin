import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router, provideRouter } from '@angular/router';
import { API_BASE_URL } from '@core/api-base-url';
import { Order, OrderItem } from '@core/api/models';
import { EditActionsService } from '@core/edit-actions.service';
import { ConfirmationService, MessageService } from '@openng/optimus-ui/api';
import { EntityForm } from '@shared/entity-form/entity-form';
import { EditOrderItemsPage } from './edit-order-items-page';

const orderItem = (id: string, pickupAddress: string): OrderItem =>
  ({
    id,
    productId: 'p1',
    productType: 'GroupExcursion',
    productTypeLabel: 'Group excursion',
    productName: `Product ${id}`,
    productAttributes: {},
    unitPrice: 40,
    startsAt: '2026-12-01T09:00:00.000Z',
    passengers: 2,
    pickupAddress,
    notes: '',
    totalPrice: 80,
  }) as OrderItem;

const order = (items: OrderItem[]): Order => ({
  id: 'o1',
  number: 'N-o1',
  status: 'Pending',
  customer: null,
  createdAt: '2026-01-01T00:00:00Z',
  totalPrice: 0,
  items,
});

describe('EditOrderItemsPage', () => {
  let httpTestingController: HttpTestingController;
  let navigate: ReturnType<typeof vi.spyOn>;

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
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  });

  afterEach(() => httpTestingController.verify());

  const render = async (ids?: string, items: OrderItem[] = []) => {
    const fixture = TestBed.createComponent(EditOrderItemsPage);
    fixture.componentRef.setInput('orderId', 'o1');
    fixture.componentRef.setInput('ids', ids);
    TestBed.tick();
    if (ids) {
      httpTestingController
        .expectOne(
          (request) =>
            request.url === '/api/orders/by-ids' && request.params.getAll('ids')?.join() === 'o1',
        )
        .flush([order(items)]);
    }
    await fixture.whenStable();
    return fixture;
  };

  const itemForm = (fixture: ComponentFixture<EditOrderItemsPage>) =>
    fixture.debugElement.query(By.directive(EntityForm)).injector.get(EntityForm).form();

  const edit = async (fixture: ComponentFixture<EditOrderItemsPage>, value: object) => {
    const form = itemForm(fixture);
    form.patchValue(value);
    form.markAsDirty();
    await fixture.whenStable();
  };

  const save = async () => {
    TestBed.inject(EditActionsService).run('save');
    await new Promise((resolve) => setTimeout(resolve));
  };

  it('creates an item in its order with the product id and the start as ISO time', async () => {
    const fixture = await render();

    await edit(fixture, {
      product: { id: 'p7', name: 'Prague by night', typeLabel: 'Group excursion' },
      startsAt: new Date('2026-12-24T18:30:00.000Z'),
      passengers: 3,
      pickupAddress: 'Hotel Pupp',
      notes: 'Child seat',
    });
    await save();

    const request = httpTestingController.expectOne('/api/orders/o1/items');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      productId: 'p7',
      startsAt: '2026-12-24T18:30:00.000Z',
      passengers: 3,
      pickupAddress: 'Hotel Pupp',
      notes: 'Child seat',
    });
    request.flush(orderItem('i9', 'Hotel Pupp'));
    await fixture.whenStable();
    expect(navigate).toHaveBeenCalledWith(
      [],
      expect.objectContaining({ queryParams: { ids: 'i9' } }),
    );
  });

  it('opens only the requested item of the order and saves its changes as one bulk update', async () => {
    const fixture = await render('i2', [orderItem('i1', 'Old Town'), orderItem('i2', 'Airport')]);
    expect(itemForm(fixture).getRawValue()).toEqual(
      expect.objectContaining({
        pickupAddress: 'Airport',
        product: expect.objectContaining({ id: 'p1' }),
      }),
    );

    await edit(fixture, { passengers: 5 });
    await save();

    const request = httpTestingController.expectOne('/api/orders/o1/items');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual([
      {
        id: 'i2',
        productId: 'p1',
        startsAt: '2026-12-01T09:00:00.000Z',
        passengers: 5,
        pickupAddress: 'Airport',
        notes: '',
      },
    ]);
  });
});
