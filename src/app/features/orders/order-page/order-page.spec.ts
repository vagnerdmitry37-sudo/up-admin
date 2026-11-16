import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router, provideRouter } from '@angular/router';
import { API_BASE_URL } from '@core/api-base-url';
import { Order, Product } from '@core/api/models';
import { EditActionsService } from '@core/edit-actions.service';
import { FormField } from '@shared/form-fields/form-field';
import { OrderPage } from './order-page';

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

const startsAt = new Date('2099-06-01T09:30:00Z');

const expectedItem = {
  productId: 'p1',
  startsAt: '2099-06-01T09:30:00.000Z',
  passengers: 1,
  pickupAddress: 'Hotel Central',
  notes: '',
};

const settle = () => new Promise((resolve) => setTimeout(resolve));

const inputFor = (element: HTMLElement, label: string) => {
  const labelElement = [...element.querySelectorAll('label')].find(
    (candidate) => candidate.textContent?.trim() === label,
  )!;
  return element.querySelector<HTMLInputElement>(`#${labelElement.htmlFor}`)!;
};

const typeInto = (element: HTMLElement, label: string, value: string) => {
  const input = inputFor(element, label);
  input.value = value;
  input.dispatchEvent(new Event('input'));
};

const itemForms = (fixture: ComponentFixture<OrderPage>) =>
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

const fillCustomer = (element: HTMLElement) => {
  typeInto(element, 'Customer name', 'Anna Novak');
  typeInto(element, 'Email', 'anna@example.com');
  typeInto(element, 'Phone', '+420 600 000 000');
};

const fillItem = async (
  fixture: ComponentFixture<OrderPage>,
  form: DebugElement,
  pickupAddress = 'Hotel Central',
) => {
  typeInto(form.nativeElement, 'Pickup address', pickupAddress);
  choose(form, 'Product', 'p1');
  choose(form, 'Start', startsAt);
  await fixture.whenStable();
};

describe('OrderPage', () => {
  let httpTestingController: HttpTestingController;
  let editActionsService: EditActionsService;
  let navigate: ReturnType<typeof vi.spyOn>;

  const render = async () => {
    const fixture = TestBed.createComponent(OrderPage);
    TestBed.tick();
    httpTestingController
      .expectOne((req) => req.url === '/api/products')
      .flush({ items: products, totalRecords: products.length });
    await fixture.whenStable();
    return { fixture, element: fixture.nativeElement as HTMLElement };
  };

  const save = async () => {
    editActionsService.run('save');
    await settle();
  };

  const addItemForm = async (fixture: ComponentFixture<OrderPage>) => {
    editActionsService.run('create');
    await fixture.whenStable();
  };

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
    editActionsService = TestBed.inject(EditActionsService);
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('sends nothing for a new order while the customer is incomplete', async () => {
    const { fixture, element } = await render();
    typeInto(element, 'Customer name', 'Anna Novak');
    await fillItem(fixture, itemForms(fixture)[0]);

    await save();

    httpTestingController.expectNone((req) => req.method === 'POST');
    await fixture.whenStable();
    expect(element.textContent).toContain('Enter an email.');
  });

  it('creates a new order with the customer and one item, then opens it', async () => {
    const { fixture, element } = await render();
    expect(element.querySelector('h1')?.textContent).toBe('New order');
    fillCustomer(element);
    await fillItem(fixture, itemForms(fixture)[0]);

    await save();
    const creation = httpTestingController.expectOne('/api/orders');
    expect(creation.request.method).toBe('POST');
    expect(creation.request.body).toEqual({
      customerName: 'Anna Novak',
      customerEmail: 'anna@example.com',
      customerPhone: '+420 600 000 000',
      items: [expectedItem],
    });
    creation.flush(order);
    await settle();

    expect(navigate).toHaveBeenCalledWith(['/orders', 'o1', 'edit'], { replaceUrl: true });
  });

  it('creates a new order with every filled item form and skips a blank one', async () => {
    const { fixture, element } = await render();
    fillCustomer(element);
    await fillItem(fixture, itemForms(fixture)[0]);
    await addItemForm(fixture);
    await addItemForm(fixture);
    await fillItem(fixture, itemForms(fixture)[1], 'Airport');

    await save();
    const creation = httpTestingController.expectOne('/api/orders');
    expect(creation.request.body.items).toEqual([
      expectedItem,
      { ...expectedItem, pickupAddress: 'Airport' },
    ]);
    creation.flush(order);
    await settle();
  });
});
