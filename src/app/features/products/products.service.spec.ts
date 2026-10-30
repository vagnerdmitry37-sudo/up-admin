import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '@core/api-base-url';
import { firstValueFrom } from 'rxjs';
import { ProductsService } from './products.service';

const request = {
  type: 'Excursion' as const,
  name: 'Old Town Walk',
  description: 'Three hours',
  price: 25.5,
  attributes: {},
};

describe('ProductsService', () => {
  let service: ProductsService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api' },
      ],
    });
    service = TestBed.inject(ProductsService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTestingController.verify());

  it('loads one page of products', () => {
    void firstValueFrom(service.list(50, 25));

    const call = httpTestingController.expectOne('/api/products?first=50&rows=25');
    expect(call.request.method).toBe('GET');
    call.flush({ items: [], totalRecords: 0 });
  });

  it('loads several products with one request', () => {
    void firstValueFrom(service.get(['a', 'b']));

    const call = httpTestingController.expectOne((req) => req.url === '/api/products/by-ids');
    expect(call.request.method).toBe('GET');
    expect(call.request.params.getAll('ids')).toEqual(['a', 'b']);
    call.flush([]);
  });

  it('creates products with one POST of an array', async () => {
    const created = service.create([request, request]);

    const call = httpTestingController.expectOne('/api/products');
    expect(call.request.method).toBe('POST');
    expect(call.request.body).toEqual([request, request]);
    call.flush([{ ...request, id: 'new' }]);

    expect(await created).toEqual([{ ...request, id: 'new' }]);
  });

  it('updates products with one PUT of an array', async () => {
    const updated = service.update([{ ...request, id: 'a' }]);

    const call = httpTestingController.expectOne('/api/products');
    expect(call.request.method).toBe('PUT');
    expect(call.request.body).toEqual([{ ...request, id: 'a' }]);
    call.flush([]);

    await updated;
  });

  it('loads the images of several products with one request', () => {
    void firstValueFrom(service.getImages(['p1', 'p2']));

    const call = httpTestingController.expectOne(
      '/api/images?entityType=Product&entityIds=p1&entityIds=p2',
    );
    expect(call.request.method).toBe('GET');
    call.flush([]);
  });

  it('saves the new image order of a product', async () => {
    const updated = service.updateImageOrder('p1', ['i2', 'i1']);

    const call = httpTestingController.expectOne('/api/images/order');
    expect(call.request.method).toBe('PUT');
    expect(call.request.body).toEqual({
      entityType: 'Product',
      entityId: 'p1',
      imageIds: ['i2', 'i1'],
    });
    call.flush([]);

    await updated;
  });

  it('uploads images for a product as multipart form data', async () => {
    const photo = new File(['a'], 'photo.jpg', { type: 'image/jpeg' });
    const uploaded = service.uploadImages('p1', [photo]);

    const call = httpTestingController.expectOne('/api/images');
    expect(call.request.method).toBe('POST');
    const form = call.request.body as FormData;
    expect(form.get('entityType')).toBe('Product');
    expect(form.get('entityId')).toBe('p1');
    expect((form.getAll('files') as File[]).map((file) => file.name)).toEqual(['photo.jpg']);
    call.flush([]);

    await uploaded;
  });
});
