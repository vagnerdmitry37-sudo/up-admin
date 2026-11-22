import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from './api-base-url';
import { ApiClient } from './api-client';
import { Activity, HttpActivity } from './http-activity.service';
import { httpActivityInterceptor } from './http-activity.interceptor';

describe('httpActivityInterceptor', () => {
  let httpClient: HttpClient;
  let apiClient: ApiClient;
  let httpTestingController: HttpTestingController;
  let service: HttpActivity;
  let changes: Activity[];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([httpActivityInterceptor])),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api' },
      ],
    });
    httpClient = TestBed.inject(HttpClient);
    apiClient = TestBed.inject(ApiClient);
    httpTestingController = TestBed.inject(HttpTestingController);
    service = TestBed.inject(HttpActivity);
    changes = [];
    service.changes.subscribe((change) => changes.push(change));
  });

  afterEach(() => httpTestingController.verify());

  it('shows a tagged request as running for its entity until the response arrives', async () => {
    const response = firstValueFrom(
      apiClient.forEntity('product').put('/api/products', {}, { params: { a: '1' } }),
    );

    expect(service.isRunning({ entity: 'product', method: 'PUT' })).toBe(true);
    expect(service.isRunning({ entity: 'order' })).toBe(false);
    expect(service.running()).toEqual([
      expect.objectContaining({
        kind: 'request',
        entity: 'product',
        method: 'PUT',
        url: '/api/products?a=1',
        status: 'running',
      }),
    ]);

    httpTestingController.expectOne('/api/products?a=1').flush({});
    await response;

    expect(service.isRunning()).toBe(false);
    expect(changes.map((change) => change.status)).toEqual(['running', 'succeeded']);
  });

  it('reports a request that ends with an error as failed and carries the error', async () => {
    const response = firstValueFrom(httpClient.delete('/api/products'));
    httpTestingController
      .expectOne('/api/products')
      .flush(null, { status: 500, statusText: 'Error' });
    await expect(response).rejects.toMatchObject({ status: 500 });

    expect(service.isRunning()).toBe(false);
    expect(changes.map((change) => change.status)).toEqual(['running', 'failed']);
    expect(changes[1].error).toMatchObject({ status: 500 });
  });

  it('reports a request unsubscribed before its response as cancelled, once', () => {
    const subscription = httpClient.get('/api/products').subscribe();
    const pending = httpTestingController.expectOne('/api/products');

    subscription.unsubscribe();

    expect(pending.cancelled).toBe(true);
    expect(service.isRunning()).toBe(false);
    expect(changes.map((change) => change.status)).toEqual(['running', 'cancelled']);
  });

  it('notifies on() subscribers only for the matching entity and status', async () => {
    const savedProducts: Activity[] = [];
    service
      .on({ entity: 'product', status: 'succeeded' })
      .subscribe((change) => savedProducts.push(change));

    const order = firstValueFrom(apiClient.forEntity('order').put('/api/orders', {}));
    const product = firstValueFrom(apiClient.forEntity('product').put('/api/products', {}));
    httpTestingController.expectOne('/api/orders').flush({});
    httpTestingController.expectOne('/api/products').flush({});
    await Promise.all([order, product]);

    expect(savedProducts).toEqual([
      expect.objectContaining({ entity: 'product', method: 'PUT', status: 'succeeded' }),
    ]);
  });

  it('does not track untracked requests', () => {
    apiClient.forEntity('session').post('/api/auth/refresh', {}, { untracked: true }).subscribe();

    expect(service.isRunning()).toBe(false);
    httpTestingController.expectOne('/api/auth/refresh').flush({});
    expect(changes).toEqual([]);
  });
});
