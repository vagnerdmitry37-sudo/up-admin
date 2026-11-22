import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from './api-base-url';
import { HttpActivity, TrackedRequest } from './http-activity.service';
import { httpActivityInterceptor } from './http-activity.interceptor';

describe('httpActivityInterceptor', () => {
  let httpClient: HttpClient;
  let httpTestingController: HttpTestingController;
  let service: HttpActivity;
  let changes: TrackedRequest[];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([httpActivityInterceptor])),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api' },
      ],
    });
    httpClient = TestBed.inject(HttpClient);
    httpTestingController = TestBed.inject(HttpTestingController);
    service = TestBed.inject(HttpActivity);
    changes = [];
    service.changes.subscribe((change) => changes.push(change));
  });

  afterEach(() => httpTestingController.verify());

  it('shows a request as running until its response arrives, then reports it succeeded', async () => {
    const response = firstValueFrom(httpClient.put('/api/products', {}, { params: { a: '1' } }));

    expect(service.isRunning('PUT')).toBe(true);
    expect(service.isRunning('GET')).toBe(false);
    expect(service.running()).toEqual([
      expect.objectContaining({ method: 'PUT', url: '/api/products?a=1', status: 'running' }),
    ]);

    httpTestingController.expectOne('/api/products?a=1').flush({});
    await response;

    expect(service.isRunning()).toBe(false);
    expect(changes.map((change) => change.status)).toEqual(['running', 'succeeded']);
  });

  it('reports a request that ends with an error as failed', async () => {
    const response = firstValueFrom(httpClient.delete('/api/products'));
    httpTestingController
      .expectOne('/api/products')
      .flush(null, { status: 500, statusText: 'Error' });
    await expect(response).rejects.toMatchObject({ status: 500 });

    expect(service.isRunning()).toBe(false);
    expect(changes.map((change) => change.status)).toEqual(['running', 'failed']);
  });

  it('reports a request unsubscribed before its response as cancelled, once', () => {
    const subscription = httpClient.get('/api/products').subscribe();
    const pending = httpTestingController.expectOne('/api/products');

    subscription.unsubscribe();

    expect(pending.cancelled).toBe(true);
    expect(service.isRunning()).toBe(false);
    expect(changes.map((change) => change.status)).toEqual(['running', 'cancelled']);
  });

  it('notifies on() subscribers only for the matching method and status', async () => {
    const succeededPuts: TrackedRequest[] = [];
    service.on('PUT', 'succeeded').subscribe((change) => succeededPuts.push(change));

    const get = firstValueFrom(httpClient.get('/api/products'));
    const put = firstValueFrom(httpClient.put('/api/products', {}));
    httpTestingController.expectOne({ method: 'GET' }).flush([]);
    httpTestingController.expectOne({ method: 'PUT' }).flush({});
    await Promise.all([get, put]);

    expect(succeededPuts).toEqual([
      expect.objectContaining({ method: 'PUT', status: 'succeeded' }),
    ]);
  });

  it('does not track background auth requests but tracks login', () => {
    httpClient.post('/api/auth/refresh', {}).subscribe();
    expect(service.isRunning()).toBe(false);

    httpClient.post('/api/auth/login', {}).subscribe();
    expect(service.running()).toEqual([expect.objectContaining({ url: '/api/auth/login' })]);

    httpTestingController.expectOne('/api/auth/refresh').flush({});
    httpTestingController.expectOne('/api/auth/login').flush({});
    expect(changes.map((change) => change.status)).toEqual(['running', 'succeeded']);
  });
});
