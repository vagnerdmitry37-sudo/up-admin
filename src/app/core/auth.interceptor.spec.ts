import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from './api-base-url';
import { authInterceptor } from './auth.interceptor';
import { SessionService } from './session.service';

describe('authInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let accessToken: ReturnType<typeof signal<string | null>>;
  let refresh: ReturnType<typeof vi.fn>;
  let navigateByUrl: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    accessToken = signal<string | null>('old-token');
    refresh = vi.fn();
    navigateByUrl = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api' },
        { provide: SessionService, useValue: { accessToken, refresh } },
        { provide: Router, useValue: { navigateByUrl } },
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('sends the access token to the API', () => {
    void firstValueFrom(http.get('/api/products'));

    const request = backend.expectOne('/api/products');
    expect(request.request.headers.get('Authorization')).toBe('Bearer old-token');
    request.flush([]);
  });

  it('does not send the token to other origins', () => {
    void firstValueFrom(http.get('https://example.com/data'));

    const request = backend.expectOne('https://example.com/data');
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({});
  });

  it('refreshes the token once and retries after a 401', async () => {
    refresh.mockResolvedValue('new-token');
    const response = firstValueFrom(http.get('/api/products'));

    backend.expectOne('/api/products').flush(null, { status: 401, statusText: 'Unauthorized' });
    await Promise.resolve();
    const retry = backend.expectOne('/api/products');
    expect(retry.request.headers.get('Authorization')).toBe('Bearer new-token');
    retry.flush(['product']);

    expect(await response).toEqual(['product']);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('reuses a token another request already refreshed', async () => {
    const response = firstValueFrom(http.get('/api/products'));
    accessToken.set('fresh-token');

    backend.expectOne('/api/products').flush(null, { status: 401, statusText: 'Unauthorized' });
    await Promise.resolve();
    const retry = backend.expectOne('/api/products');
    expect(retry.request.headers.get('Authorization')).toBe('Bearer fresh-token');
    retry.flush([]);

    await response;
    expect(refresh).not.toHaveBeenCalled();
  });

  it('goes to the login page when the session cannot be refreshed', async () => {
    refresh.mockResolvedValue(null);
    const response = firstValueFrom(http.get('/api/products'));

    backend.expectOne('/api/products').flush(null, { status: 401, statusText: 'Unauthorized' });

    await expect(response).rejects.toMatchObject({ status: 401 });
    expect(navigateByUrl).toHaveBeenCalledWith('/login');
  });

  it('does not refresh when an auth request itself returns 401', async () => {
    const response = firstValueFrom(http.post('/api/auth/login', {}));

    backend.expectOne('/api/auth/login').flush(null, { status: 401, statusText: 'Unauthorized' });

    await expect(response).rejects.toMatchObject({ status: 401 });
    expect(refresh).not.toHaveBeenCalled();
  });

  it('passes other errors through unchanged', async () => {
    const response = firstValueFrom(http.get('/api/products'));

    backend.expectOne('/api/products').flush(null, { status: 500, statusText: 'Server Error' });

    await expect(response).rejects.toMatchObject({ status: 500 });
    expect(refresh).not.toHaveBeenCalled();
  });
});
