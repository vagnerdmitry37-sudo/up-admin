import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { API_BASE_URL } from '@core/api-base-url';
import { Product, ProductTypeDefinition } from '@core/api/models';
import { EditActionsService } from '@core/edit-actions.service';
import { NewProductPage } from './new-product-page';

const productTypes: ProductTypeDefinition[] = [
  {
    type: 'GroupExcursion',
    label: 'Group excursion',
    priceLabel: 'Price per person',
    attributes: [
      {
        key: 'durationMinutes',
        label: 'Duration, minutes',
        kind: 'WholeNumber',
        required: false,
        maxLength: null,
        min: 1,
      },
    ],
  },
  {
    type: 'IndividualTransfer',
    label: 'Individual transfer',
    priceLabel: 'Price per vehicle',
    attributes: [],
  },
];

const sources: Product[] = [
  {
    id: 'p1',
    type: 'GroupExcursion',
    typeLabel: 'Group excursion',
    name: 'Old Town Walk',
    description: 'Three hours',
    seoDescription: 'Walk through the old town',
    shortDescription: 'Short walk',
    price: 25,
    attributes: { durationMinutes: 180 },
  },
  {
    id: 'p2',
    type: 'IndividualTransfer',
    typeLabel: 'Individual transfer',
    name: 'Airport to hotel',
    description: 'Door to door',
    seoDescription: 'Private transfer from the airport',
    shortDescription: '',
    price: 40,
    attributes: {},
  },
];

const resultDisplayMs = 2000;

const settle = () => new Promise((resolve) => setTimeout(resolve));

const zoneStates = (element: HTMLElement) =>
  [...element.querySelectorAll('app-save-zone')].map(
    (zone) => zone.querySelector('[role="status"]')?.textContent?.trim() ?? '',
  );

const showStatuses = async () => {
  await settle();
  await TestBed.inject(ApplicationRef).whenStable();
};

const fillRequiredFields = (element: HTMLElement) => {
  const name = element.querySelector<HTMLInputElement>('app-text-field input')!;
  const seoDescription = element.querySelectorAll<HTMLTextAreaElement>(
    'app-textarea-field textarea',
  )[1];
  name.value = 'Old Town Walk';
  name.dispatchEvent(new Event('input'));
  seoDescription.value = 'Walk through the old town';
  seoDescription.dispatchEvent(new Event('input'));
};

const chooseImages = async (
  fixture: ComponentFixture<NewProductPage>,
  element: HTMLElement,
  names: string[],
) => {
  const input = element.querySelector<HTMLInputElement>('app-image-upload input[type="file"]')!;
  Object.defineProperty(input, 'files', {
    value: names.map((name) => new File(['a'], name, { type: 'image/jpeg' })),
  });
  input.dispatchEvent(new Event('change'));
  fixture.detectChanges();
  await fixture.whenStable();
};

const pendingImageNames = (element: HTMLElement) =>
  [...element.querySelectorAll('app-image-upload button[aria-pressed] .name')].map(
    (name) => name.textContent,
  );

describe('NewProductPage', () => {
  let httpTestingController: HttpTestingController;
  let editActionsService: EditActionsService;
  let navigateByUrl: ReturnType<typeof vi.spyOn>;

  const render = async (from?: string) => {
    const fixture = TestBed.createComponent(NewProductPage);
    if (from) {
      fixture.componentRef.setInput('from', from);
    }
    TestBed.tick();
    httpTestingController.expectOne('/api/product-types').flush(productTypes);
    const element: HTMLElement = fixture.nativeElement;
    if (!from) {
      await fixture.whenStable();
    }
    return { fixture, element };
  };

  const renderCopies = async () => {
    const { fixture, element } = await render('p1,p2');
    const load = httpTestingController.expectOne((req) => req.url === '/api/products/by-ids');
    load.flush(sources);
    await fixture.whenStable();
    return { fixture, element, load };
  };

  const save = async () => {
    editActionsService.run('save');
    await settle();
  };

  const startSaving = async () => {
    const saving = editActionsService.run('save') as unknown as Promise<void>;
    await settle();
    return { saving };
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
    URL.createObjectURL = vi.fn(() => 'blob:preview');
  });

  afterEach(() => {
    httpTestingController.verify();
    vi.useRealTimers();
  });

  describe('new product', () => {
    it('shows the empty form, preselecting the first product type', async () => {
      const { element } = await render();

      expect(element.querySelector('h1')?.textContent).toBe('New product');
      expect(element.querySelector('p-tabs')).toBeNull();
      expect(element.textContent).toContain('Price per person');
    });

    it('offers Save only after the form is touched', async () => {
      const { fixture, element } = await render();
      expect(editActionsService.actions().save).toBeUndefined();

      fillRequiredFields(element);
      await fixture.whenStable();

      expect(editActionsService.actions().save).toBeDefined();
    });

    it('sends nothing while the form is invalid', async () => {
      await render();

      await save();

      httpTestingController.expectNone((req) => req.method === 'POST');
      expect(navigateByUrl).not.toHaveBeenCalled();
    });

    it('creates the product, then opens its edit page once the result was shown', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      const { element } = await render();
      fillRequiredFields(element);

      await save();
      const creation = httpTestingController.expectOne('/api/products');
      expect(creation.request.method).toBe('POST');
      expect(creation.request.body).toEqual([
        {
          type: 'GroupExcursion',
          name: 'Old Town Walk',
          shortDescription: '',
          description: '',
          seoDescription: 'Walk through the old town',
          price: 0,
          attributes: {},
        },
      ]);
      creation.flush([{ ...sources[0], id: 'new-id' }]);
      await settle();
      expect(navigateByUrl).not.toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(resultDisplayMs);

      expect(navigateByUrl).toHaveBeenCalledWith('/products/new-id/edit', { replaceUrl: true });
    });

    it('shows Saving, then Saved only in the form zone when no image was chosen', async () => {
      const { element } = await render();
      fillRequiredFields(element);

      await save();
      await showStatuses();
      expect(zoneStates(element)).toEqual(['Saving…', '']);

      httpTestingController.expectOne('/api/products').flush([{ ...sources[0], id: 'new-id' }]);
      await showStatuses();
      expect(zoneStates(element)).toEqual(['Saved', '']);
      httpTestingController.expectNone((req) => req.url === '/api/images');
    });

    it('uploads the chosen images for the created product', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      const { fixture, element } = await render();
      fillRequiredFields(element);
      await chooseImages(fixture, element, ['photo.jpg']);

      await save();
      await showStatuses();
      expect(zoneStates(element)).toEqual(['Saving…', 'Saving…']);
      httpTestingController.expectOne('/api/products').flush([{ ...sources[0], id: 'new-id' }]);
      await settle();
      const upload = httpTestingController.expectOne('/api/images');
      const form = upload.request.body as FormData;
      expect(form.get('entityType')).toBe('Product');
      expect(form.get('entityId')).toBe('new-id');
      expect((form.getAll('files') as File[]).map((file) => file.name)).toEqual(['photo.jpg']);
      upload.flush([]);
      await showStatuses();
      expect(zoneStates(element)).toEqual(['Saved', 'Saved']);

      await vi.advanceTimersByTimeAsync(resultDisplayMs);

      expect(navigateByUrl).toHaveBeenCalledWith('/products/new-id/edit', { replaceUrl: true });
    });

    it('offers Delete only while images are selected, and removes only the selected ones', async () => {
      const { fixture, element } = await render();
      await chooseImages(fixture, element, ['kept.jpg', 'deleted.jpg']);
      expect(editActionsService.actions().delete).toBeUndefined();

      element
        .querySelectorAll<HTMLButtonElement>('app-image-upload button[aria-pressed]')[1]
        .click();
      await fixture.whenStable();
      expect(editActionsService.actions().delete).toBeDefined();

      editActionsService.run('delete');
      await fixture.whenStable();

      expect(pendingImageNames(element)).toEqual(['kept.jpg']);
      expect(editActionsService.actions().delete).toBeUndefined();
    });
  });

  describe('copies', () => {
    it('loads the source products and shows one copy per tab', async () => {
      const { element, load } = await renderCopies();

      expect(load.request.params.getAll('ids')).toEqual(['p1', 'p2']);
      expect(element.querySelector('h1')?.textContent).toBe('Duplicate product');
      expect([...element.querySelectorAll('p-tab')].map((tab) => tab.textContent?.trim())).toEqual([
        'Old Town Walk (copy)',
        'Airport to hotel (copy)',
      ]);
    });

    it('shows nothing until the source products are loaded', async () => {
      const { element } = await render('p1,p2');

      expect(element.querySelector('app-product-form')).toBeNull();
      expect(element.querySelector('app-product-tabs')).toBeNull();

      httpTestingController.expectOne((req) => req.url === '/api/products/by-ids').flush(sources);
    });

    it('offers Save right away', async () => {
      await renderCopies();

      expect(editActionsService.actions().save).toBeDefined();
    });

    it('saves the copies as new products without ids, keeping their attributes', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      await renderCopies();

      await save();
      const creation = httpTestingController.expectOne((req) => req.method === 'POST');
      expect(creation.request.body).toEqual([
        {
          type: 'GroupExcursion',
          name: 'Old Town Walk (copy)',
          shortDescription: 'Short walk',
          description: 'Three hours',
          seoDescription: 'Walk through the old town',
          price: 25,
          attributes: { durationMinutes: 180 },
        },
        {
          type: 'IndividualTransfer',
          name: 'Airport to hotel (copy)',
          shortDescription: '',
          description: 'Door to door',
          seoDescription: 'Private transfer from the airport',
          price: 40,
          attributes: {},
        },
      ]);
      creation.flush([
        { ...sources[0], id: 'c1' },
        { ...sources[1], id: 'c2' },
      ]);
      await settle();
      await vi.advanceTimersByTimeAsync(resultDisplayMs);

      httpTestingController.expectNone((req) => req.method === 'PUT');
      expect(navigateByUrl).toHaveBeenCalledWith('/products/c1,c2/edit', { replaceUrl: true });
    });

    it('ignores Save while the copies are already being saved', async () => {
      await renderCopies();

      await save();
      await save();

      httpTestingController
        .expectOne((req) => req.method === 'POST')
        .flush([
          { ...sources[0], id: 'c1' },
          { ...sources[1], id: 'c2' },
        ]);
      await settle();
    });

    it('stays on the page and shows the error in both zones when creating fails', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      const { fixture, element } = await renderCopies();
      await chooseImages(fixture, element, ['photo.jpg']);

      const { saving } = await startSaving();
      httpTestingController
        .expectOne('/api/products')
        .flush(null, { status: 500, statusText: 'Server Error' });

      await expect(saving).rejects.toBeTruthy();
      await showStatuses();
      expect(zoneStates(element)).toEqual([
        "Couldn't save. Try again.",
        "Couldn't save images. Try again.",
      ]);
      httpTestingController.expectNone((req) => req.url === '/api/images');

      await vi.advanceTimersByTimeAsync(resultDisplayMs);
      await showStatuses();
      expect(zoneStates(element)).toEqual(['', '']);
      expect(navigateByUrl).not.toHaveBeenCalled();
      expect(
        element.querySelector<HTMLInputElement>('p-tabpanel:not([hidden]) app-text-field input')!
          .value,
      ).toBe('Old Town Walk (copy)');
    });

    it('shows the image failure but still opens the created products when an upload fails', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      const { fixture, element } = await renderCopies();
      await chooseImages(fixture, element, ['photo.jpg']);

      const { saving } = await startSaving();
      httpTestingController.expectOne('/api/products').flush([
        { ...sources[0], id: 'c1' },
        { ...sources[1], id: 'c2' },
      ]);
      await settle();
      const upload = httpTestingController.expectOne('/api/images');
      expect((upload.request.body as FormData).get('entityId')).toBe('c1');
      upload.flush(null, { status: 500, statusText: 'Server Error' });

      await expect(saving).rejects.toBeTruthy();
      await showStatuses();
      expect(zoneStates(element)).toEqual(['Saved', "Couldn't save images. Try again."]);

      await vi.advanceTimersByTimeAsync(resultDisplayMs);

      expect(navigateByUrl).toHaveBeenCalledWith('/products/c1,c2/edit', { replaceUrl: true });
    });
  });
});
