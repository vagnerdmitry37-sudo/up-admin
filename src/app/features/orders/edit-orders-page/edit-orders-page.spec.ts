import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router, provideRouter } from '@angular/router';
import { API_BASE_URL } from '@core/api-base-url';
import { Customer, Order } from '@core/api/models';
import { EditActionsService } from '@core/edit-actions.service';
import { AutoComplete } from '@openng/optimus-ui/autocomplete';
import { EntityForm } from '@shared/entity-form/entity-form';
import { EditOrdersPage } from './edit-orders-page';

const customer = (id: string, name: string): Customer => ({
  id,
  name,
  email: `${id}@example.com`,
  phone: '+100',
  createdAt: '2026-01-01T00:00:00Z',
});

const order = (id: string, orderCustomer: Customer): Order => ({
  id,
  number: `N-${id}`,
  status: 'Pending',
  customer: orderCustomer,
  createdAt: '2026-01-01T00:00:00Z',
  totalPrice: 0,
  items: [],
});

describe('EditOrdersPage', () => {
  let httpTestingController: HttpTestingController;
  let navigate: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: API_BASE_URL, useValue: '/api' },
      ],
    });
    httpTestingController = TestBed.inject(HttpTestingController);
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  });

  afterEach(() => httpTestingController.verify());

  const render = async (ids?: string, orders: Order[] = []) => {
    const fixture = TestBed.createComponent(EditOrdersPage);
    fixture.componentRef.setInput('ids', ids);
    TestBed.tick();
    if (ids) {
      httpTestingController
        .expectOne((request) => request.url === '/api/orders/by-ids')
        .flush(orders);
    }
    await fixture.whenStable();
    return fixture;
  };

  const chooseCustomer = async (fixture: ComponentFixture<EditOrdersPage>, chosen: Customer) => {
    const form = fixture.debugElement
      .query(By.directive(EntityForm))
      .injector.get(EntityForm)
      .form();
    form.controls['customer'].setValue(chosen);
    form.markAsDirty();
    await fixture.whenStable();
  };

  const save = async () => {
    TestBed.inject(EditActionsService).run('save');
    await new Promise((resolve) => setTimeout(resolve));
  };

  it('creates an empty order for the chosen customer', async () => {
    const fixture = await render();

    await chooseCustomer(fixture, customer('c1', 'Ada'));
    await save();

    const request = httpTestingController.expectOne('/api/orders');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ customerId: 'c1', items: [] });
    request.flush(order('o9', customer('c1', 'Ada')));
    await fixture.whenStable();
    expect(navigate).toHaveBeenCalledWith(
      [],
      expect.objectContaining({ queryParams: { ids: 'o9' } }),
    );
  });

  it('saves a changed customer as the order id and the customer id', async () => {
    const fixture = await render('o1', [order('o1', customer('c1', 'Ada'))]);

    await chooseCustomer(fixture, customer('c2', 'Grace'));
    await save();

    const request = httpTestingController.expectOne('/api/orders');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual([{ id: 'o1', customerId: 'c2' }]);
  });

  it('searches customers by the typed text and keeps searching after a failed search', async () => {
    const fixture = await render();
    const autoComplete = fixture.debugElement.query(By.directive(AutoComplete));
    const search = async (query: string) => {
      autoComplete.triggerEventHandler('completeMethod', { query });
      return httpTestingController.expectOne(
        (request) =>
          request.url === '/api/customers' &&
          request.params.get('globalFilter') === query &&
          request.params.get('rows') === '20',
      );
    };

    (await search('ad')).flush(null, { status: 500, statusText: 'Server Error' });
    (await search('gr')).flush({ items: [customer('c2', 'Grace')], totalRecords: 1 });
    await fixture.whenStable();

    expect((autoComplete.componentInstance as AutoComplete<Customer>).suggestions).toEqual([
      customer('c2', 'Grace'),
    ]);
  });
});
