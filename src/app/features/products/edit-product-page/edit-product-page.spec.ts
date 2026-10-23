import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { API_BASE_URL } from '@core/api-base-url';
import { Product } from '@core/api/models';
import { EditActionsService } from '@core/edit-actions.service';
import { EditProductPage } from './edit-product-page';

const products: Product[] = [
  {
    id: 'p1',
    type: 'Excursion',
    name: 'Old Town Walk',
    description: 'x',
    price: 25,
    attributes: {},
  },
  {
    id: 'p2',
    type: 'Transfer',
    name: 'Airport to hotel',
    description: 'y',
    price: 40,
    attributes: {},
  },
];

const settle = () => new Promise((resolve) => setTimeout(resolve));

describe('EditProductPage', () => {
  let http: HttpTestingController;
  let navigateByUrl: ReturnType<typeof vi.spyOn>;

  const render = async (ids: string, loaded: Product[]) => {
    const fixture = TestBed.createComponent(EditProductPage);
    fixture.componentRef.setInput('ids', ids);
    TestBed.tick();
    const load = http.expectOne((req) => req.url === '/api/products');
    load.flush(loaded);
    await fixture.whenStable();
    return { fixture, element: fixture.nativeElement as HTMLElement, load };
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

  it('loads every product in the address with one request', async () => {
    const { load, element } = await render('p1,p2', products);

    expect(load.request.params.getAll('ids')).toEqual(['p1', 'p2']);
    expect(element.querySelectorAll('p-tab')).toHaveLength(2);
  });

  it('shows a single product without tabs', async () => {
    const { element } = await render('p1', [products[0]]);

    expect(element.querySelector('p-tabs')).toBeNull();
    expect(element.querySelector('h1')?.textContent).toBe('Edit product');
  });

  it('saves every product with one PUT that keeps their ids', async () => {
    const { element } = await render('p1,p2', products);
    const name = element.querySelector(
      'p-tabpanel:not([hidden]) app-text-field input',
    ) as HTMLInputElement;
    name.value = 'Night Walk';
    name.dispatchEvent(new Event('input'));

    await save();
    const call = http.expectOne((req) => req.method === 'PUT');
    call.flush([]);
    await settle();

    expect(call.request.body).toEqual([
      {
        id: 'p1',
        type: 'Excursion',
        name: 'Night Walk',
        description: 'x',
        price: 25,
        attributes: {},
      },
      {
        id: 'p2',
        type: 'Transfer',
        name: 'Airport to hotel',
        description: 'y',
        price: 40,
        attributes: {},
      },
    ]);
    expect(navigateByUrl).toHaveBeenCalledWith('/products');
  });

  describe('cancel', () => {
    const tabNames = (element: HTMLElement) =>
      [...element.querySelectorAll('p-tab')].map((tab) => tab.textContent?.trim());

    it('stops editing only the product in the active tab on press', async () => {
      const { fixture, element } = await render('p1,p2', products);

      TestBed.inject(EditActionsService).run('edit');
      await fixture.whenStable();

      expect(tabNames(element)).toEqual(['Airport to hotel']);
      expect(navigateByUrl).not.toHaveBeenCalled();
    });

    it('saves only the products still being edited', async () => {
      const { fixture } = await render('p1,p2', products);
      TestBed.inject(EditActionsService).run('edit');
      await fixture.whenStable();

      await save();
      const call = http.expectOne((req) => req.method === 'PUT');
      call.flush([]);
      await settle();

      expect(call.request.body.map((product: Product) => product.id)).toEqual(['p2']);
    });

    it('goes back to the products list when the last product is cancelled', async () => {
      const { fixture } = await render('p1,p2', products);
      const actions = TestBed.inject(EditActionsService);

      actions.run('edit');
      await fixture.whenStable();
      actions.run('edit');

      expect(navigateByUrl).toHaveBeenCalledWith('/products');
      http.expectNone((req) => req.method === 'PUT');
    });

    it('cancels every product on long press', async () => {
      await render('p1,p2', products);

      TestBed.inject(EditActionsService).run('edit', 'longPress');

      expect(navigateByUrl).toHaveBeenCalledWith('/products');
      http.expectNone((req) => req.method === 'PUT');
    });

    it('treats press and long press the same for a single product', async () => {
      await render('p1', [products[0]]);
      const actions = TestBed.inject(EditActionsService);

      actions.run('edit');
      actions.run('edit', 'longPress');

      expect(navigateByUrl).toHaveBeenNthCalledWith(1, '/products');
      expect(navigateByUrl).toHaveBeenNthCalledWith(2, '/products');
      http.expectNone((req) => req.method === 'PUT');
    });
  });

  it('sends nothing while a product is invalid', async () => {
    const { element } = await render('p1', [products[0]]);
    const name = element.querySelector('app-text-field input') as HTMLInputElement;
    name.value = '';
    name.dispatchEvent(new Event('input'));

    await save();

    http.expectNone((req) => req.method === 'PUT');
    expect(navigateByUrl).not.toHaveBeenCalled();
  });
});
