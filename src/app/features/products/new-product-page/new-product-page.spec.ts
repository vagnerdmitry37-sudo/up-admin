import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationRef } from '@angular/core';
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

  afterEach(() => {
    httpTestingController.verify();
    vi.useRealTimers();
  });

  it('creates a new product, then opens its edit page once the result was shown', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const { element } = await render();
    const name = element.querySelector('app-text-field input') as HTMLInputElement;
    const description = element.querySelector('app-textarea-field textarea') as HTMLTextAreaElement;
    name.value = 'Old Town Walk';
    name.dispatchEvent(new Event('input'));
    description.value = 'Three hours';
    description.dispatchEvent(new Event('input'));

    await save();
    const call = httpTestingController.expectOne('/api/products');
    call.flush([{ ...sources[0], id: 'new-id' }]);
    await settle();
    expect(navigateByUrl).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(2000);

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
    expect(navigateByUrl).toHaveBeenCalledWith('/products/new-id/edit', { replaceUrl: true });
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
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const { fixture } = await render('p1,p2');
    httpTestingController.expectOne((req) => req.url === '/api/products/by-ids').flush(sources);
    await fixture.whenStable();

    await save();
    const call = httpTestingController.expectOne((req) => req.method === 'POST');
    call.flush([
      { ...sources[0], id: 'c1' },
      { ...sources[1], id: 'c2' },
    ]);
    await settle();
    await vi.advanceTimersByTimeAsync(2000);

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
    expect(navigateByUrl).toHaveBeenCalledWith('/products/c1,c2/edit', { replaceUrl: true });
  });

  it('uploads the chosen images for the newly created product', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    URL.createObjectURL = vi.fn(() => 'blob:preview');
    const { fixture, element } = await render();
    const name = element.querySelector('app-text-field input') as HTMLInputElement;
    const description = element.querySelector('app-textarea-field textarea') as HTMLTextAreaElement;
    name.value = 'Old Town Walk';
    name.dispatchEvent(new Event('input'));
    description.value = 'Three hours';
    description.dispatchEvent(new Event('input'));
    const input = element.querySelector<HTMLInputElement>('app-image-upload input[type="file"]')!;
    Object.defineProperty(input, 'files', {
      value: [new File(['a'], 'photo.jpg', { type: 'image/jpeg' })],
    });
    input.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    await fixture.whenStable();

    await save();
    httpTestingController.expectOne('/api/products').flush([{ ...sources[0], id: 'new-id' }]);
    await settle();
    const upload = httpTestingController.expectOne('/api/images');
    const form = upload.request.body as FormData;
    expect(form.get('entityId')).toBe('new-id');
    expect((form.getAll('files') as File[]).map((file) => file.name)).toEqual(['photo.jpg']);
    upload.flush([]);
    await settle();
    await vi.advanceTimersByTimeAsync(2000);

    expect(navigateByUrl).toHaveBeenCalledWith('/products/new-id/edit', { replaceUrl: true });
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

  it('shows Saving, then Saved only in the form zone when no image was chosen', async () => {
    const { element } = await render();
    fillRequiredFields(element);

    await save();
    await TestBed.inject(ApplicationRef).whenStable();
    expect(zoneStates(element)).toEqual(['Saving…', '']);

    httpTestingController.expectOne('/api/products').flush([{ ...sources[0], id: 'new-id' }]);
    await settle();
    await TestBed.inject(ApplicationRef).whenStable();
    expect(zoneStates(element)).toEqual(['Saved', '']);
  });

  it('stays on the create page and shows the error when creating fails', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const { fixture, element } = await render('p1,p2');
    httpTestingController.expectOne((req) => req.url === '/api/products/by-ids').flush(sources);
    await fixture.whenStable();

    const saving = TestBed.inject(EditActionsService).run('save') as unknown as Promise<void>;
    await settle();
    httpTestingController
      .expectOne('/api/products')
      .flush(null, { status: 500, statusText: 'Server Error' });

    await expect(saving).rejects.toBeTruthy();
    await TestBed.inject(ApplicationRef).whenStable();
    expect(zoneStates(element)).toEqual(["Couldn't save. Try again.", '']);

    await vi.advanceTimersByTimeAsync(2000);
    await TestBed.inject(ApplicationRef).whenStable();
    expect(zoneStates(element)).toEqual(['', '']);
    expect(navigateByUrl).not.toHaveBeenCalled();
    expect(
      (element.querySelector('p-tabpanel:not([hidden]) app-text-field input') as HTMLInputElement)
        .value,
    ).toBe('Old Town Walk (copy)');
  });
});

const zoneStates = (element: HTMLElement) =>
  [...element.querySelectorAll('app-save-zone')].map(
    (zone) => zone.querySelector('[role="status"]')?.textContent?.trim() ?? '',
  );

const fillRequiredFields = (element: HTMLElement) => {
  const name = element.querySelector('app-text-field input') as HTMLInputElement;
  const description = element.querySelector('app-textarea-field textarea') as HTMLTextAreaElement;
  name.value = 'Old Town Walk';
  name.dispatchEvent(new Event('input'));
  description.value = 'Three hours';
  description.dispatchEvent(new Event('input'));
};
