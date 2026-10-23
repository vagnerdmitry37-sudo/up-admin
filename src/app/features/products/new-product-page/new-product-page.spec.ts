import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { API_BASE_URL } from '@core/api-base-url';
import { Product } from '@core/api/models';
import { EditActionsService } from '@core/edit-actions.service';
import { NewProductPage } from './new-product-page';

const sources: Product[] = [
  {
    id: 'p1',
    type: 'Excursion',
    name: 'Old Town Walk',
    description: 'Three hours',
    price: 25,
    attributes: { durationMinutes: 180 },
  },
  {
    id: 'p2',
    type: 'Transfer',
    name: 'Airport to hotel',
    description: 'Door',
    price: 40,
    attributes: {},
  },
];

const settle = () => new Promise((resolve) => setTimeout(resolve));

describe('NewProductPage', () => {
  let http: HttpTestingController;
  let navigateByUrl: ReturnType<typeof vi.spyOn>;

  const render = async (from?: string) => {
    const fixture = TestBed.createComponent(NewProductPage);
    if (from) {
      fixture.componentRef.setInput('from', from);
    }
    TestBed.tick();
    return { fixture, element: fixture.nativeElement as HTMLElement };
  };

  const save = async () => {
    TestBed.inject(EditActionsService).run('save');
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
    http = TestBed.inject(HttpTestingController);
    navigateByUrl = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
  });

  afterEach(() => http.verify());

  it('creates a new product from the filled form', async () => {
    const { element } = await render();
    const name = element.querySelector('app-text-field input') as HTMLInputElement;
    const description = element.querySelector('app-textarea-field textarea') as HTMLTextAreaElement;
    name.value = 'Old Town Walk';
    name.dispatchEvent(new Event('input'));
    description.value = 'Three hours';
    description.dispatchEvent(new Event('input'));

    await save();
    const call = http.expectOne('/api/products');
    call.flush([]);
    await settle();

    expect(call.request.method).toBe('POST');
    expect(call.request.body).toEqual([
      {
        type: 'Excursion',
        name: 'Old Town Walk',
        description: 'Three hours',
        price: 0,
        attributes: {},
      },
    ]);
    expect(navigateByUrl).toHaveBeenCalledWith('/products');
  });

  it('cancels back to the products list', async () => {
    await render();

    TestBed.inject(EditActionsService).run('create');

    expect(navigateByUrl).toHaveBeenCalledWith('/products');
    http.expectNone('/api/products');
  });

  it('sends nothing while the form is invalid', async () => {
    await render();

    await save();

    http.expectNone('/api/products');
    expect(navigateByUrl).not.toHaveBeenCalled();
  });

  it('pre-fills copies of the source products, one tab each', async () => {
    const { fixture, element } = await render('p1,p2');

    const load = http.expectOne((req) => req.url === '/api/products');
    expect(load.request.params.getAll('ids')).toEqual(['p1', 'p2']);
    load.flush(sources);
    await fixture.whenStable();

    expect(element.querySelector('h1')?.textContent).toBe('Duplicate product');
    expect([...element.querySelectorAll('p-tab')].map((tab) => tab.textContent?.trim())).toEqual([
      'Old Town Walk (copy)',
      'Airport to hotel (copy)',
    ]);
  });

  it('saves the copies as new products without ids, keeping their attributes', async () => {
    const { fixture } = await render('p1,p2');
    http.expectOne((req) => req.url === '/api/products').flush(sources);
    await fixture.whenStable();

    await save();
    const call = http.expectOne((req) => req.method === 'POST');
    call.flush([]);
    await settle();

    expect(call.request.body).toEqual([
      {
        type: 'Excursion',
        name: 'Old Town Walk (copy)',
        description: 'Three hours',
        price: 25,
        attributes: { durationMinutes: 180 },
      },
      {
        type: 'Transfer',
        name: 'Airport to hotel (copy)',
        description: 'Door',
        price: 40,
        attributes: {},
      },
    ]);
    http.expectNone((req) => req.method === 'PUT');
    expect(navigateByUrl).toHaveBeenCalledWith('/products');
  });
});
