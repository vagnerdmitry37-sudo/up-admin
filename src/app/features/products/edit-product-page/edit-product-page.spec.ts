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
  let httpTestingController: HttpTestingController;
  let navigateByUrl: ReturnType<typeof vi.spyOn>;

  const render = async (ids: string, loaded: Product[]) => {
    const fixture = TestBed.createComponent(EditProductPage);
    fixture.componentRef.setInput('ids', ids);
    TestBed.tick();
    const load = httpTestingController.expectOne((req) => req.url === '/api/products/by-ids');
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
    httpTestingController = TestBed.inject(HttpTestingController);
    navigateByUrl = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
  });

  afterEach(() => httpTestingController.verify());

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
    const call = httpTestingController.expectOne((req) => req.method === 'PUT');
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

  it('sends nothing while a product is invalid', async () => {
    const { element } = await render('p1', [products[0]]);
    const name = element.querySelector('app-text-field input') as HTMLInputElement;
    name.value = '';
    name.dispatchEvent(new Event('input'));

    await save();

    httpTestingController.expectNone((req) => req.method === 'PUT');
    expect(navigateByUrl).not.toHaveBeenCalled();
  });

  it('deletes the selected images of the open tab', async () => {
    URL.createObjectURL = vi.fn(() => 'blob:preview');
    const { fixture, element } = await render('p1,p2', products);
    const editActionsService = TestBed.inject(EditActionsService);
    const input = element.querySelector<HTMLInputElement>('app-image-upload input[type="file"]')!;
    Object.defineProperty(input, 'files', {
      value: [new File(['a'], 'photo.jpg', { type: 'image/jpeg' })],
    });
    input.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(editActionsService.actions().delete).toBeUndefined();

    element.querySelector<HTMLButtonElement>('button[aria-pressed]')!.click();
    await fixture.whenStable();
    editActionsService.run('delete');
    await fixture.whenStable();

    expect(element.querySelector('button[aria-pressed]')).toBeNull();
    expect(editActionsService.actions().delete).toBeUndefined();
  });
});
