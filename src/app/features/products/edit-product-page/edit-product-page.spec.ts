import { CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router, provideRouter } from '@angular/router';
import { API_BASE_URL } from '@core/api-base-url';
import { Image, Product } from '@core/api/models';
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

const zoneStates = (element: HTMLElement) =>
  [...element.querySelectorAll('app-save-zone')].map(
    (zone) => zone.querySelector('[role="status"]')?.textContent?.trim() ?? '',
  );

const chooseImage = async (fixture: ComponentFixture<EditProductPage>, element: HTMLElement) => {
  const input = element.querySelector<HTMLInputElement>('app-image-upload input[type="file"]')!;
  Object.defineProperty(input, 'files', {
    value: [new File(['a'], 'photo.jpg', { type: 'image/jpeg' })],
  });
  input.dispatchEvent(new Event('change'));
  fixture.detectChanges();
  await fixture.whenStable();
};

const savedImage = (id: string, sortOrder: number): Image => ({
  id,
  entityType: 'Product',
  entityId: 'p1',
  sortOrder,
  url: `https://img/${id}.webp`,
});

const twoSavedImages = () => [savedImage('i1', 0), savedImage('i2', 1)];

const moveSavedImage = async (
  fixture: ComponentFixture<EditProductPage>,
  previousIndex: number,
  currentIndex: number,
) => {
  fixture.debugElement
    .query(By.directive(CdkDropList))
    .injector.get(CdkDropList)
    .dropped.emit({ previousIndex, currentIndex } as CdkDragDrop<unknown>);
  await fixture.whenStable();
};

describe('EditProductPage', () => {
  let httpTestingController: HttpTestingController;
  let navigateByUrl: ReturnType<typeof vi.spyOn>;

  const render = async (ids: string, loaded: Product[], saved: Image[] = []) => {
    const fixture = TestBed.createComponent(EditProductPage);
    fixture.componentRef.setInput('ids', ids);
    TestBed.tick();
    const load = httpTestingController.expectOne((req) => req.url === '/api/products/by-ids');
    load.flush(loaded);
    httpTestingController.expectOne((req) => req.url === '/api/images').flush(saved);
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

  it('shows the saved images of each product as Saved cards', async () => {
    const saved: Image[] = [
      { id: 'i1', entityType: 'Product', entityId: 'p1', sortOrder: 0, url: 'https://img/1.webp' },
      { id: 'i2', entityType: 'Product', entityId: 'p1', sortOrder: 1, url: 'https://img/2.webp' },
    ];

    const { element } = await render('p1', [products[0]], saved);

    const cards = [...element.querySelectorAll('app-image-upload button[aria-pressed]')];
    expect(cards.map((card) => card.querySelector('img')?.getAttribute('src'))).toEqual([
      'https://img/1.webp',
      'https://img/2.webp',
    ]);
    expect(cards.every((card) => card.textContent?.includes('Saved'))).toBe(true);
  });

  it('shows a single product without tabs', async () => {
    const { element } = await render('p1', [products[0]]);

    expect(element.querySelector('p-tabs')).toBeNull();
    expect(element.querySelector('h1')?.textContent).toBe('Edit product');
  });

  it('sends only the edited products in one PUT and stays on the page', async () => {
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
    ]);
    expect(navigateByUrl).not.toHaveBeenCalled();
  });

  it('offers Save only after a change, and hides it again once saved', async () => {
    const { fixture, element } = await render('p1', [products[0]]);
    const editActionsService = TestBed.inject(EditActionsService);
    expect(editActionsService.actions().save).toBeUndefined();

    const name = element.querySelector('app-text-field input') as HTMLInputElement;
    name.value = 'Night Walk';
    name.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    expect(editActionsService.actions().save).toBeDefined();

    await save();
    httpTestingController.expectOne((req) => req.method === 'PUT').flush([]);
    await settle();
    await fixture.whenStable();
    expect(editActionsService.actions().save).toBeUndefined();
  });

  it('offers Save once an image is added', async () => {
    URL.createObjectURL = vi.fn(() => 'blob:preview');
    const { fixture, element } = await render('p1', [products[0]]);
    const editActionsService = TestBed.inject(EditActionsService);

    await chooseImage(fixture, element);

    expect(editActionsService.actions().save).toBeDefined();
  });

  it('sends nothing when nothing changed', async () => {
    await render('p1', [products[0]]);

    await save();

    httpTestingController.expectNone((req) => req.method === 'PUT');
    httpTestingController.expectNone((req) => req.method === 'POST');
  });

  it('shows the form spinner, then its own Saved state, independently of the images', async () => {
    URL.createObjectURL = vi.fn(() => 'blob:preview');
    const { fixture, element } = await render('p1', [products[0]]);
    const name = element.querySelector('app-text-field input') as HTMLInputElement;
    name.value = 'Night Walk';
    name.dispatchEvent(new Event('input'));
    await chooseImage(fixture, element);

    await save();
    await TestBed.inject(ApplicationRef).whenStable();
    expect(zoneStates(element)).toEqual(['Saving…', 'Saving…']);

    httpTestingController.expectOne((req) => req.method === 'PUT').flush([]);
    await settle();
    await TestBed.inject(ApplicationRef).whenStable();
    expect(zoneStates(element)).toEqual(['Saved', 'Saving…']);

    httpTestingController.expectOne((req) => req.method === 'POST').flush([]);
    await settle();
    TestBed.tick();
    httpTestingController.expectOne((req) => req.url === '/api/images').flush([]);
    await settle();
    await TestBed.inject(ApplicationRef).whenStable();
    expect(zoneStates(element)).toEqual(['Saved', 'Saved']);
  });

  it('shows a failure only in the zone whose request failed', async () => {
    const { element } = await render('p1', [products[0]]);
    const name = element.querySelector('app-text-field input') as HTMLInputElement;
    name.value = 'Night Walk';
    name.dispatchEvent(new Event('input'));

    const saving = TestBed.inject(EditActionsService).run('save') as unknown as Promise<void>;
    await settle();
    httpTestingController
      .expectOne((req) => req.method === 'PUT')
      .flush(null, { status: 500, statusText: 'Server Error' });

    await expect(saving).rejects.toBeTruthy();
    await settle();
    await TestBed.inject(ApplicationRef).whenStable();
    expect(zoneStates(element)).toEqual(["Couldn't save. Try again.", '']);
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

  it('uploads chosen images without sending unchanged product details', async () => {
    URL.createObjectURL = vi.fn(() => 'blob:preview');
    const { fixture, element } = await render('p1,p2', products);
    await chooseImage(fixture, element);

    await save();
    httpTestingController.expectNone((req) => req.method === 'PUT');
    expect(zoneStates(element)).toEqual(['', 'Saving…']);
    const upload = httpTestingController.expectOne((req) => req.method === 'POST');
    const form = upload.request.body as FormData;
    expect(form.get('entityId')).toBe('p1');
    expect((form.getAll('files') as File[]).map((file) => file.name)).toEqual(['photo.jpg']);
    upload.flush([]);
    await settle();

    TestBed.tick();

    httpTestingController.expectOne((req) => req.url === '/api/images').flush([]);
    await settle();
    await TestBed.inject(ApplicationRef).whenStable();
    expect(zoneStates(element)).toEqual(['', 'Saved']);
    expect(element.querySelector('app-image-upload button[aria-pressed]')).toBeNull();
    expect(navigateByUrl).not.toHaveBeenCalled();
  });

  it('offers Save once the saved images are reordered', async () => {
    const { fixture } = await render('p1', [products[0]], twoSavedImages());
    const editActionsService = TestBed.inject(EditActionsService);
    expect(editActionsService.actions().save).toBeUndefined();

    await moveSavedImage(fixture, 1, 0);

    expect(editActionsService.actions().save).toBeDefined();
  });

  it('saves the new image order, then shows the reloaded images as Saved', async () => {
    const { fixture, element } = await render('p1', [products[0]], twoSavedImages());
    await moveSavedImage(fixture, 1, 0);

    await save();
    httpTestingController.expectNone((req) => req.method === 'POST');
    expect(zoneStates(element)).toEqual(['', 'Saving…']);
    const order = httpTestingController.expectOne('/api/images/order');
    expect(order.request.method).toBe('PUT');
    expect(order.request.body).toEqual({
      entityType: 'Product',
      entityId: 'p1',
      imageIds: ['i2', 'i1'],
    });
    order.flush([]);
    await settle();

    TestBed.tick();
    httpTestingController
      .expectOne((req) => req.url === '/api/images')
      .flush([savedImage('i2', 0), savedImage('i1', 1)]);
    await settle();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(zoneStates(element)).toEqual(['', 'Saved']);
    expect(
      [...element.querySelectorAll('.draggable img')].map((img) => img.getAttribute('src')),
    ).toEqual(['https://img/i2.webp', 'https://img/i1.webp']);
    expect(TestBed.inject(EditActionsService).actions().save).toBeUndefined();
  });

  it('saves the new image order before uploading new images', async () => {
    URL.createObjectURL = vi.fn(() => 'blob:preview');
    const { fixture, element } = await render('p1', [products[0]], twoSavedImages());
    await moveSavedImage(fixture, 1, 0);
    await chooseImage(fixture, element);

    await save();
    httpTestingController.expectNone((req) => req.method === 'POST');
    httpTestingController.expectOne('/api/images/order').flush([]);
    await settle();

    httpTestingController.expectOne((req) => req.method === 'POST').flush([]);
    await settle();
    TestBed.tick();
    httpTestingController.expectOne((req) => req.url === '/api/images').flush([]);
    await settle();
  });

  it('shows a failure in the images zone when the new order cannot be saved', async () => {
    const { fixture, element } = await render('p1', [products[0]], twoSavedImages());
    await moveSavedImage(fixture, 1, 0);

    const saving = TestBed.inject(EditActionsService).run('save') as unknown as Promise<void>;
    await settle();
    httpTestingController
      .expectOne('/api/images/order')
      .flush(null, { status: 500, statusText: 'Server Error' });
    await expect(saving).rejects.toBeTruthy();
    TestBed.tick();
    httpTestingController.expectOne((req) => req.url === '/api/images').flush([]);
    await settle();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(zoneStates(element)[1]).toContain("Couldn't save images. Try again.");
  });

  it('hides Delete while saving', async () => {
    URL.createObjectURL = vi.fn(() => 'blob:preview');
    const { fixture, element } = await render('p1', [products[0]]);
    const editActionsService = TestBed.inject(EditActionsService);
    await chooseImage(fixture, element);
    element.querySelector<HTMLButtonElement>('button[aria-pressed]')!.click();
    await fixture.whenStable();
    expect(editActionsService.actions().delete).toBeDefined();

    await save();
    expect(editActionsService.actions().delete).toBeUndefined();

    httpTestingController.expectOne((req) => req.method === 'POST').flush([]);
    await settle();
    TestBed.tick();
    httpTestingController.expectOne((req) => req.url === '/api/images').flush([]);
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
