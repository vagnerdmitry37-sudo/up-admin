import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { API_BASE_URL } from '@core/api-base-url';
import { Customer, Order } from '@core/api/models';
import { ConfirmationService, MessageService } from '@openng/optimus-ui/api';
import { AutoComplete } from '@openng/optimus-ui/autocomplete';
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

  const openTab = async (fixture: ComponentFixture<EditOrdersPage>, label: string) => {
    [...(fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('[role="tab"]')]
      .find((tab) => tab.textContent?.trim() === label)!
      .click();
    await fixture.whenStable();
  };

  it('builds the items table of a second order only when its tab is opened', async () => {
    const fixture = await render('o1,o2', [
      order('o1', customer('c1', 'Ada')),
      order('o2', customer('c2', 'Grace')),
    ]);
    expect(fixture.nativeElement.querySelectorAll('app-order-items-table')).toHaveLength(1);

    await openTab(fixture, 'N-o2');

    expect(fixture.nativeElement.querySelectorAll('app-order-items-table')).toHaveLength(2);
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
