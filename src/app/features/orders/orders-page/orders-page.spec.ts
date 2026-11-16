import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { API_BASE_URL } from '@core/api-base-url';
import { Order } from '@core/api/models';
import { EditActionsService } from '@core/edit-actions.service';
import { ConfirmationService } from '@openng/optimus-ui/api';
import { OrdersPage } from './orders-page';

const order: Order = {
  id: 'o1',
  number: 'ORD-2026-000042',
  status: 'Confirmed',
  customerName: 'Anna Novak',
  customerEmail: 'anna@example.com',
  customerPhone: '+420 600 000 000',
  createdAt: '2026-11-16T12:00:00Z',
  totalPrice: 220.5,
  items: [],
};

const secondOrder: Order = { ...order, id: 'o2', number: 'ORD-2026-000043' };

const settle = () => new Promise((resolve) => setTimeout(resolve));

const selectRow = async (element: HTMLElement, index: number) => {
  (element.querySelectorAll('tbody tr')[index] as HTMLElement).click();
  await TestBed.inject(ApplicationRef).whenStable();
};

const answerConfirmation = (answer: 'accept' | 'reject') => {
  const confirmationService = TestBed.inject(ConfirmationService);
  return vi.spyOn(confirmationService, 'confirm').mockImplementation((confirmation) => {
    confirmation[answer]?.();
    return confirmationService;
  });
};

describe('OrdersPage', () => {
  let httpTestingController: HttpTestingController;

  const render = async (orders: Order[]) => {
    const fixture = TestBed.createComponent(OrdersPage);
    TestBed.tick();
    httpTestingController
      .expectOne('/api/orders?first=0&rows=50')
      .flush({ items: orders, totalRecords: orders.length });
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 10));
    await fixture.whenStable();
    httpTestingController
      .match((req) => req.url === '/api/orders')
      .forEach((request) => request.flush({ items: [], totalRecords: orders.length }));
    return fixture.nativeElement as HTMLElement;
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        ConfirmationService,
        { provide: API_BASE_URL, useValue: '/api' },
      ],
    });
    httpTestingController = TestBed.inject(HttpTestingController);
    vi.spyOn(HTMLElement.prototype, 'offsetParent', 'get').mockReturnValue(document.body);
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(600);
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(400);
  });

  afterEach(() => {
    httpTestingController.verify();
    vi.restoreAllMocks();
  });

  it('lists each order with its number, date, customer, status and the total as the API sent it', async () => {
    const element = await render([order]);

    const cells = [...element.querySelectorAll('tbody td')].map((cell) => cell.textContent?.trim());
    expect(cells[0]).toBe('ORD-2026-000042');
    expect(cells[1]).toContain('11/16/26');
    expect(cells.slice(2)).toEqual(['Anna Novak', 'Confirmed', '220.5']);
  });

  it('shows an empty state instead of the table when there are no orders', async () => {
    const element = await render([]);

    expect(element.textContent).toContain('No orders yet');
    expect(element.querySelector('app-data-table')).toBeNull();
  });

  it('suggests Create while there are no orders, and Create opens the new order page', async () => {
    const editActionsService = TestBed.inject(EditActionsService);
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    await render([]);
    expect(editActionsService.suggested()).toEqual(['create']);

    editActionsService.run('create');

    expect(navigate).toHaveBeenCalledWith(['/orders/new']);
  });

  it('offers Create without suggesting it once orders exist', async () => {
    const editActionsService = TestBed.inject(EditActionsService);
    await render([order]);

    expect(editActionsService.actions().create).toBeDefined();
    expect(editActionsService.suggested()).toEqual([]);
  });

  it('offers Edit only while orders are selected, and opens every selected order together', async () => {
    const editActionsService = TestBed.inject(EditActionsService);
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const element = await render([order, secondOrder]);
    expect(editActionsService.actions().edit).toBeUndefined();

    await selectRow(element, 1);
    await selectRow(element, 0);
    editActionsService.run('edit');

    expect(navigate).toHaveBeenCalledWith(['/orders', 'o2,o1', 'edit']);
  });

  describe('Delete', () => {
    it('is offered only while orders are selected', async () => {
      const editActionsService = TestBed.inject(EditActionsService);
      const element = await render([order, secondOrder]);
      expect(editActionsService.actions().delete).toBeUndefined();

      await selectRow(element, 0);

      expect(editActionsService.actions().delete).toBeDefined();
    });

    it('asks about a single order in the singular, and sends nothing when cancelled', async () => {
      const editActionsService = TestBed.inject(EditActionsService);
      const confirm = answerConfirmation('reject');
      const element = await render([order, secondOrder]);
      await selectRow(element, 0);

      editActionsService.run('delete');

      expect(confirm).toHaveBeenCalledWith(
        expect.objectContaining({
          header: 'Delete order?',
          message: 'This cannot be undone.',
          acceptLabel: 'Delete',
        }),
      );
      httpTestingController.expectNone((req) => req.method === 'DELETE');
      expect(editActionsService.actions().delete).toBeDefined();
    });

    it('deletes every selected order after confirming, then reloads the list', async () => {
      const editActionsService = TestBed.inject(EditActionsService);
      const confirm = answerConfirmation('accept');
      const element = await render([order, secondOrder]);
      await selectRow(element, 1);
      await selectRow(element, 0);

      editActionsService.run('delete');
      expect(confirm).toHaveBeenCalledWith(expect.objectContaining({ header: 'Delete 2 orders?' }));
      const deletion = httpTestingController.expectOne(
        (req) => req.method === 'DELETE' && req.url === '/api/orders',
      );
      expect(deletion.request.params.getAll('ids')).toEqual(['o2', 'o1']);
      deletion.flush(null, { status: 204, statusText: 'No Content' });
      await settle();

      httpTestingController
        .expectOne('/api/orders?first=0&rows=50')
        .flush({ items: [], totalRecords: 0 });
      await TestBed.inject(ApplicationRef).whenStable();

      expect(element.textContent).toContain('No orders yet');
      expect(Object.keys(editActionsService.actions())).toEqual(['create']);
    });
  });
});
