import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router, provideRouter } from '@angular/router';
import { API_BASE_URL } from '@core/api-base-url';
import { Order, Product } from '@core/api/models';
import { EditActionsService } from '@core/edit-actions.service';
import { FormField } from '@shared/form-fields/form-field';
import { NewOrderPage } from './new-order-page';

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

const created: Order = {
  id: 'o1',
  number: 'ORD-2026-000001',
  status: 'Pending',
  customerName: 'Anna Novak',
  customerEmail: 'anna@example.com',
  customerPhone: '+420 600 000 000',
  createdAt: '2026-11-16T12:00:00Z',
  totalPrice: 25,
  items: [],
};

const startsAt = new Date('2099-06-01T09:30:00Z');

const resultDisplayMs = 2000;

const settle = () => new Promise((resolve) => setTimeout(resolve));

const typeInto = (element: HTMLElement, label: string, value: string) => {
  const labelElement = [...element.querySelectorAll('label')].find(
    (candidate) => candidate.textContent?.trim() === label,
  )!;
  const input = element.querySelector<HTMLInputElement>(`#${labelElement.htmlFor}`)!;
  input.value = value;
  input.dispatchEvent(new Event('input'));
};

const choose = (fixture: ComponentFixture<NewOrderPage>, label: string, value: unknown) => {
  const control = fixture.debugElement
    .queryAll(By.directive(FormField))
    .map((debugElement) => debugElement.injector.get(FormField))
    .find((field) => field.label() === label)!
    .control();
  control.setValue(value);
  control.markAsDirty();
};

const fillForm = async (fixture: ComponentFixture<NewOrderPage>, element: HTMLElement) => {
  typeInto(element, 'Customer name', 'Anna Novak');
  typeInto(element, 'Email', 'anna@example.com');
  typeInto(element, 'Phone', '+420 600 000 000');
  typeInto(element, 'Pickup address', 'Hotel Central');
  choose(fixture, 'Product', 'p1');
  choose(fixture, 'Start', startsAt);
  await fixture.whenStable();
};

const zoneState = (element: HTMLElement) =>
  element.querySelector('app-save-zone [role="status"]')?.textContent?.trim() ?? '';

describe('NewOrderPage', () => {
  let httpTestingController: HttpTestingController;
  let editActionsService: EditActionsService;
  let navigateByUrl: ReturnType<typeof vi.spyOn>;

  const render = async () => {
    const fixture = TestBed.createComponent(NewOrderPage);
    TestBed.tick();
    const load = httpTestingController.expectOne((req) => req.url === '/api/products');
    load.flush({ items: products, totalRecords: products.length });
    await fixture.whenStable();
    return { fixture, element: fixture.nativeElement as HTMLElement, load };
  };

  const save = async () => {
    editActionsService.run('save');
    await settle();
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
    navigateByUrl = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
  });

  afterEach(() => {
    httpTestingController.verify();
    vi.useRealTimers();
  });

  it('loads up to 200 products sorted by name for the product choice', async () => {
    const { element, load } = await render();

    expect(load.request.params.get('rows')).toBe('200');
    expect(load.request.params.get('sortField')).toBe('Name');
    expect(element.querySelector('h1')?.textContent).toBe('New order');
  });

  it('offers Save only after the form is touched', async () => {
    const { fixture, element } = await render();
    expect(editActionsService.actions().save).toBeUndefined();

    typeInto(element, 'Customer name', 'Anna Novak');
    await fixture.whenStable();

    expect(editActionsService.actions().save).toBeDefined();
  });

  it('sends nothing while the form is invalid', async () => {
    const { fixture, element } = await render();
    typeInto(element, 'Customer name', 'Anna Novak');
    await fixture.whenStable();

    await save();

    httpTestingController.expectNone((req) => req.method === 'POST');
    expect(navigateByUrl).not.toHaveBeenCalled();
  });

  it('creates the order with one item, then returns to the orders list once the result was shown', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const { fixture, element } = await render();
    await fillForm(fixture, element);

    await save();
    const creation = httpTestingController.expectOne('/api/orders');
    expect(creation.request.method).toBe('POST');
    expect(creation.request.body).toEqual({
      customerName: 'Anna Novak',
      customerEmail: 'anna@example.com',
      customerPhone: '+420 600 000 000',
      items: [
        {
          productId: 'p1',
          startsAt: '2099-06-01T09:30:00.000Z',
          passengers: 1,
          pickupAddress: 'Hotel Central',
          notes: '',
        },
      ],
    });
    creation.flush(created);
    await settle();
    await TestBed.inject(ApplicationRef).whenStable();
    expect(zoneState(element)).toBe('Saved');
    expect(navigateByUrl).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(resultDisplayMs);

    expect(navigateByUrl).toHaveBeenCalledWith('/orders', { replaceUrl: true });
  });
});
