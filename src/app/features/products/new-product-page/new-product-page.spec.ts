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
  let httpTestingController: HttpTestingController;
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
    httpTestingController = TestBed.inject(HttpTestingController);
    navigateByUrl = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
  });

  afterEach(() => httpTestingController.verify());

  it('creates a new product from the filled form', async () => {
    const { element } = await render();
    const name = element.querySelector('app-text-field input') as HTMLInputElement;
    const description = element.querySelector('app-textarea-field textarea') as HTMLTextAreaElement;
    name.value = 'Old Town Walk';
    name.dispatchEvent(new Event('input'));
    description.value = 'Three hours';
    description.dispatchEvent(new Event('input'));

    await save();
    const call = httpTestingController.expectOne('/api/products');
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

  it('sends nothing while the form is invalid', async () => {
    await render();

    await save();

    httpTestingController.expectNone('/api/products');
    expect(navigateByUrl).not.toHaveBeenCalled();
  });

  it('pre-fills copies of the source products, one tab each', async () => {
    const { fixture, element } = await render('p1,p2');

    const load = httpTestingController.expectOne((req) => req.url === '/api/products/by-ids');
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
    httpTestingController.expectOne((req) => req.url === '/api/products/by-ids').flush(sources);
    await fixture.whenStable();

    await save();
    const call = httpTestingController.expectOne((req) => req.method === 'POST');
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
    httpTestingController.expectNone((req) => req.method === 'PUT');
    expect(navigateByUrl).toHaveBeenCalledWith('/products');
  });

  it('offers Delete only while images are selected and removes the selected ones', async () => {
    URL.createObjectURL = vi.fn(() => 'blob:preview');
    const { fixture, element } = await render();
    const editActionsService = TestBed.inject(EditActionsService);
    const input = element.querySelector<HTMLInputElement>('app-image-upload input[type="file"]')!;
    Object.defineProperty(input, 'files', {
      value: [
        new File(['a'], 'kept.jpg', { type: 'image/jpeg' }),
        new File(['b'], 'deleted.jpg', { type: 'image/jpeg' }),
      ],
    });
    input.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    await fixture.whenStable();
    const cards = () => element.querySelectorAll<HTMLButtonElement>('button[aria-pressed]');
    expect(editActionsService.actions().delete).toBeUndefined();

    cards()[1].click();
    await fixture.whenStable();
    expect(editActionsService.actions().delete).toBeDefined();

    editActionsService.run('delete');
    await fixture.whenStable();

    expect([...cards()].map((card) => card.querySelector('.name')?.textContent)).toEqual([
      'kept.jpg',
    ]);
    expect(editActionsService.actions().delete).toBeUndefined();
  });
});
