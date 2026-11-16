import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { API_BASE_URL } from '@core/api-base-url';
import { Order, Product } from '@core/api/models';
import { EditActionsService } from '@core/edit-actions.service';
import { ConfirmationService } from '@openng/optimus-ui/api';
import { FormField } from '@shared/form-fields/form-field';
import { STATUS_DISPLAY_MS } from '@shared/save-zone/save-statuses';
import { MIN_SAVING_MS } from '@shared/save-zone/save-zone';
import { EditOrderPage } from './edit-order-page';

const products: Product[] = [
  {
    id: 'p1',
    type: 'GroupExcursion',
    typeLabel: 'Group excursion',
    name: 'Old Town Walk',
    description: '',
    seoDescription: 'Walk through the old town',
    shortDescription: '',
    price: 25,
    attributes: {},
  },
];

const order: Order = {
  id: 'o1',
  number: 'ORD-2026-000001',
  status: 'Pending',
  customerName: 'Anna Novak',
  customerEmail: 'anna@example.com',
  customerPhone: '+420 600 000 000',
  createdAt: '2026-11-16T12:00:00Z',
  totalPrice: 25,
  items: [
    {
      id: 'i1',
      productId: 'p1',
      productType: 'GroupExcursion',
      productTypeLabel: 'Group excursion',
      productName: 'Old Town Walk',
      productAttributes: {},
      unitPrice: 25,
      startsAt: '2099-06-01T09:30:00Z',
      passengers: 1,
      pickupAddress: 'Hotel Central',
      notes: '',
      totalPrice: 25,
    },
  ],
};

const secondOrder: Order = {
  ...order,
  id: 'o2',
  number: 'ORD-2026-000002',
  customerName: 'Petr Svoboda',
  customerEmail: 'petr@example.com',
};

const startsAt = new Date('2099-06-01T09:30:00Z');

const expectedItem = {
  productId: 'p1',
  startsAt: '2099-06-01T09:30:00.000Z',
  passengers: 1,
  pickupAddress: 'Hotel Central',
  notes: '',
};

const settle = () => new Promise((resolve) => setTimeout(resolve));

const visiblePanel = (element: HTMLElement) =>
  element.querySelector<HTMLElement>('p-tabpanel:not([hidden])') ?? element;

const inputFor = (element: HTMLElement, label: string) => {
  const root = visiblePanel(element);
  const labelElement = [...root.querySelectorAll('label')].find(
    (candidate) => candidate.textContent?.trim() === label,
  )!;
  return root.querySelector<HTMLInputElement>(`#${labelElement.htmlFor}`)!;
};

const typeInto = (element: HTMLElement, label: string, value: string) => {
  const input = inputFor(element, label);
  input.value = value;
  input.dispatchEvent(new Event('input'));
};

const itemForms = (fixture: ComponentFixture<EditOrderPage>) =>
  fixture.debugElement.queryAll(By.css('app-order-item-form'));

const choose = (root: DebugElement, label: string, value: unknown) => {
  const control = root
    .queryAll(By.directive(FormField))
    .map((debugElement) => debugElement.injector.get(FormField))
    .find((field) => field.label() === label)!
    .control();
  control.setValue(value);
  control.markAsDirty();
};

const fillItem = async (
  fixture: ComponentFixture<EditOrderPage>,
  form: DebugElement,
  pickupAddress = 'Hotel Central',
) => {
  typeInto(form.nativeElement, 'Pickup address', pickupAddress);
  choose(form, 'Product', 'p1');
  choose(form, 'Start', startsAt);
  await fixture.whenStable();
};

const twoItemOrder: Order = {
  ...order,
  totalPrice: 75,
  items: [order.items[0], { ...order.items[0], id: 'i2', passengers: 2, totalPrice: 50 }],
};

const selectRow = async (fixture: ComponentFixture<EditOrderPage>, index: number) => {
  (fixture.nativeElement.querySelectorAll('tbody tr')[index] as HTMLElement).click();
  await fixture.whenStable();
};

const answerConfirmation = (answer: 'accept' | 'reject') => {
  const confirmationService = TestBed.inject(ConfirmationService);
  return vi.spyOn(confirmationService, 'confirm').mockImplementation((confirmation) => {
    confirmation[answer]?.();
    return confirmationService;
  });
};

const tabLabels = (element: HTMLElement) =>
  [...element.querySelectorAll('p-tab')].map((tab) => tab.textContent?.trim());

const activeTab = (element: HTMLElement) =>
  [...element.querySelectorAll('p-tab')].findIndex(
    (tab) => tab.getAttribute('aria-selected') === 'true',
  );

describe('EditOrderPage', () => {
  let httpTestingController: HttpTestingController;
  let editActionsService: EditActionsService;

  const render = async (ids: string, loaded: Order[]) => {
    const fixture = TestBed.createComponent(EditOrderPage);
    fixture.componentRef.setInput('ids', ids);
    TestBed.tick();
    httpTestingController
      .expectOne((req) => req.url === '/api/products')
      .flush({ items: products, totalRecords: products.length });
    const load = httpTestingController.expectOne((req) => req.url === '/api/orders/by-ids');
    load.flush(loaded);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const openTab = async (index: number) => {
      (element.querySelectorAll('p-tab')[index] as HTMLElement).click();
      await fixture.whenStable();
    };
    return { fixture, element, load, openTab };
  };

  const save = async () => {
    editActionsService.run('save');
    await settle();
  };

  const addItemForm = async (fixture: ComponentFixture<EditOrderPage>) => {
    editActionsService.run('create');
    await fixture.whenStable();
  };

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
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
    editActionsService = TestBed.inject(EditActionsService);
  });

  afterEach(() => {
    httpTestingController.verify();
    vi.useRealTimers();
  });

  it('loads every order in the address with one request and shows a tab per order', async () => {
    const { element, load } = await render('o1,o2', [order, secondOrder]);

    expect(load.request.params.getAll('ids')).toEqual(['o1', 'o2']);
    expect(tabLabels(element)).toEqual(['ORD-2026-000001', 'ORD-2026-000002']);
  });

  it('shows a single order without tabs, its customer editable, and offers Save only after a change', async () => {
    const { fixture, element } = await render('o1', [order]);

    expect(element.querySelector('p-tabs')).toBeNull();
    expect(element.querySelector('h1')?.textContent).toBe('Order ORD-2026-000001');
    expect(inputFor(element, 'Customer name').value).toBe('Anna Novak');
    expect(element.textContent).toContain('Old Town Walk');
    expect(editActionsService.actions().save).toBeUndefined();

    typeInto(element, 'Phone', '+420 700 000 000');
    await fixture.whenStable();

    expect(editActionsService.actions().save).toBeDefined();
  });

  it('shows each item price and the order total in the items table footer', async () => {
    const { element } = await render('o1', [twoItemOrder]);

    const priceCells = [...element.querySelectorAll('tbody tr')].map((row) =>
      row.querySelector('td:last-child')?.textContent?.trim(),
    );
    const totalCells = [...element.querySelectorAll('tfoot tr td')].map((cell) =>
      cell.textContent?.trim(),
    );

    expect(priceCells).toEqual(['25.00', '50.00']);
    expect(totalCells).toEqual(['Total', '75.00']);
  });

  it('saves only the customer when only the customer changed', async () => {
    const { fixture, element } = await render('o1', [order]);
    typeInto(element, 'Phone', '+420 700 000 000');
    await fixture.whenStable();

    await save();
    const update = httpTestingController.expectOne('/api/orders/o1/customer');
    expect(update.request.method).toBe('PUT');
    expect(update.request.body).toEqual({
      customerName: 'Anna Novak',
      customerEmail: 'anna@example.com',
      customerPhone: '+420 700 000 000',
    });
    update.flush({ ...order, customerPhone: '+420 700 000 000' });
    await settle();
    await fixture.whenStable();

    expect(inputFor(element, 'Phone').value).toBe('+420 700 000 000');
    expect(editActionsService.actions().save).toBeUndefined();
  });

  it('saves the changes of every edited order, each to its own order', async () => {
    const { fixture, element, openTab } = await render('o1,o2', [order, secondOrder]);
    typeInto(element, 'Phone', '+420 700 000 001');
    await openTab(1);
    typeInto(element, 'Phone', '+420 700 000 002');
    await fixture.whenStable();

    await save();
    const updates = httpTestingController.match((req) => req.url.endsWith('/customer'));
    expect(updates.map(({ request }) => [request.url, request.body.customerPhone]).sort()).toEqual([
      ['/api/orders/o1/customer', '+420 700 000 001'],
      ['/api/orders/o2/customer', '+420 700 000 002'],
    ]);
    updates[0].flush(order);
    updates[1].flush(secondOrder);
    await settle();
  });

  it('sends nothing and opens the tab of an invalid order', async () => {
    const { fixture, element, openTab } = await render('o1,o2', [order, secondOrder]);
    await openTab(1);
    typeInto(element, 'Customer name', '');
    await openTab(0);
    typeInto(element, 'Phone', '+420 700 000 001');
    await fixture.whenStable();

    await save();
    await fixture.whenStable();

    httpTestingController.expectNone((req) => req.method === 'PUT');
    expect(activeTab(element)).toBe(1);
  });

  it('shows no item form until Create, then adds the item and removes its form', async () => {
    const { fixture, element } = await render('o1', [order]);
    expect(itemForms(fixture)).toHaveLength(0);

    await addItemForm(fixture);
    expect(itemForms(fixture)).toHaveLength(1);
    await fillItem(fixture, itemForms(fixture)[0]);

    await save();
    const creation = httpTestingController.expectOne('/api/orders/o1/items');
    expect(creation.request.method).toBe('POST');
    expect(creation.request.body).toEqual(expectedItem);
    creation.flush({ ...order, items: [...order.items, { ...order.items[0], id: 'i2' }] });
    await settle();
    await fixture.whenStable();
    await vi.advanceTimersByTimeAsync(STATUS_DISPLAY_MS);
    await fixture.whenStable();

    expect(itemForms(fixture)).toHaveLength(0);
    expect(inputFor(element, 'Customer name').value).toBe('Anna Novak');
  });

  it('keeps a saved item form on screen, locked and showing Saved, until the result has been shown', async () => {
    const { fixture } = await render('o1', [order]);
    await addItemForm(fixture);
    await fillItem(fixture, itemForms(fixture)[0]);

    await save();
    httpTestingController
      .expectOne('/api/orders/o1/items')
      .flush({ ...order, items: [...order.items, { ...order.items[0], id: 'i2' }] });
    await settle();
    await vi.advanceTimersByTimeAsync(MIN_SAVING_MS);
    await fixture.whenStable();

    const [savedForm] = itemForms(fixture);
    expect(savedForm.nativeElement.textContent).toContain('Saved');
    expect(inputFor(savedForm.nativeElement, 'Pickup address').disabled).toBe(true);
    expect(editActionsService.actions().save).toBeUndefined();

    await vi.advanceTimersByTimeAsync(STATUS_DISPLAY_MS - MIN_SAVING_MS);
    await fixture.whenStable();

    expect(itemForms(fixture)).toHaveLength(0);
  });

  it('adds no items while one item form is invalid', async () => {
    const { fixture, element } = await render('o1', [order]);
    await addItemForm(fixture);
    await addItemForm(fixture);
    await fillItem(fixture, itemForms(fixture)[0]);
    typeInto(itemForms(fixture)[1].nativeElement, 'Pickup address', 'Airport');
    await fixture.whenStable();

    await save();

    httpTestingController.expectNone((req) => req.method === 'POST');
    await fixture.whenStable();
    expect(element.textContent).toContain('Select a product.');
  });

  it('keeps a saved item out of the forms when the next item fails to save', async () => {
    const { fixture, element } = await render('o1', [order]);
    await addItemForm(fixture);
    await addItemForm(fixture);
    await fillItem(fixture, itemForms(fixture)[0]);
    await fillItem(fixture, itemForms(fixture)[1], 'Airport');

    const saving = editActionsService.run('save') as unknown as Promise<void>;
    await settle();
    httpTestingController
      .expectOne('/api/orders/o1/items')
      .flush({ ...order, items: [...order.items, { ...order.items[0], id: 'i2' }] });
    await settle();
    const failed = httpTestingController.expectOne('/api/orders/o1/items');
    expect(failed.request.body).toEqual({ ...expectedItem, pickupAddress: 'Airport' });
    failed.flush(null, { status: 500, statusText: 'Server Error' });

    await expect(saving).rejects.toBeTruthy();
    await vi.advanceTimersByTimeAsync(MIN_SAVING_MS);
    await fixture.whenStable();
    expect(element.textContent).toContain("Couldn't save. Try again.");

    await save();
    const retry = httpTestingController.expectOne('/api/orders/o1/items');
    expect(retry.request.body).toEqual({ ...expectedItem, pickupAddress: 'Airport' });
    retry.flush(order);
    await settle();
    await vi.advanceTimersByTimeAsync(STATUS_DISPLAY_MS);
    await fixture.whenStable();
    expect(itemForms(fixture)).toHaveLength(0);
  });

  describe('deleting items', () => {
    it('offers Delete only for selected items, and sends nothing when cancelled', async () => {
      const confirm = answerConfirmation('reject');
      const { fixture } = await render('o1', [twoItemOrder]);
      expect(editActionsService.actions().delete).toBeUndefined();

      await selectRow(fixture, 1);
      editActionsService.run('delete');

      expect(confirm).toHaveBeenCalledWith(
        expect.objectContaining({ header: 'Delete item?', acceptLabel: 'Delete' }),
      );
      httpTestingController.expectNone((req) => req.method === 'DELETE');
      expect(editActionsService.actions().delete).toBeDefined();
    });

    it('deletes the selected items after confirming, then shows the rest and the new total', async () => {
      const threeItemOrder: Order = {
        ...twoItemOrder,
        totalPrice: 100,
        items: [...twoItemOrder.items, { ...order.items[0], id: 'i3' }],
      };
      const confirm = answerConfirmation('accept');
      const { fixture, element } = await render('o1', [threeItemOrder]);
      await selectRow(fixture, 2);
      await selectRow(fixture, 0);

      editActionsService.run('delete');
      expect(confirm).toHaveBeenCalledWith(expect.objectContaining({ header: 'Delete 2 items?' }));
      const deletion = httpTestingController.expectOne('/api/orders/o1/items?ids=i3&ids=i1');
      expect(deletion.request.method).toBe('DELETE');
      deletion.flush({ ...order, totalPrice: 50, items: [twoItemOrder.items[1]] });
      await settle();
      await fixture.whenStable();

      expect(element.querySelectorAll('tbody tr')).toHaveLength(1);
      expect(element.querySelector('tfoot td:last-child')?.textContent?.trim()).toBe('50.00');
      expect(editActionsService.actions().delete).toBeUndefined();
    });

    it('shows the empty state when the last item is deleted', async () => {
      answerConfirmation('accept');
      const { fixture, element } = await render('o1', [order]);
      await selectRow(fixture, 0);

      editActionsService.run('delete');
      httpTestingController
        .expectOne('/api/orders/o1/items?ids=i1')
        .flush({ ...order, totalPrice: 0, items: [] });
      await settle();
      await fixture.whenStable();

      expect(element.querySelector('app-data-table')).toBeNull();
      expect(element.textContent).toContain('No items yet');
      expect(element.textContent).toContain('tap Add, then tap Save');
    });
  });
});
