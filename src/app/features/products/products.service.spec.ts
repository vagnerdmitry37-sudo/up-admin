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
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api' },
      ],
    });
    service = TestBed.inject(ProductsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads several products with one request', () => {
    void firstValueFrom(service.get(['a', 'b']));

    const call = http.expectOne((req) => req.url === '/api/products');
    expect(call.request.method).toBe('GET');
    expect(call.request.params.getAll('ids')).toEqual(['a', 'b']);
    call.flush([]);
  });

  it('creates products with one POST of an array', async () => {
    const created = service.create([request, request]);

    const call = http.expectOne('/api/products');
    expect(call.request.method).toBe('POST');
    expect(call.request.body).toEqual([request, request]);
    call.flush([{ ...request, id: 'new' }]);

    expect(await created).toEqual([{ ...request, id: 'new' }]);
  });

  it('updates products with one PUT of an array', async () => {
    const updated = service.update([{ ...request, id: 'a' }]);

    const call = http.expectOne('/api/products');
    expect(call.request.method).toBe('PUT');
    expect(call.request.body).toEqual([{ ...request, id: 'a' }]);
    call.flush([]);

    await updated;
  });
});
