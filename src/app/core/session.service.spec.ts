import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from './api-base-url';
import { SessionService } from './session.service';

describe('SessionService', () => {
  let service: SessionService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api' },
      ],
    });
    service = TestBed.inject(SessionService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTestingController.verify());

  it('signs in and keeps the access token', async () => {
    const login = service.login('seller@example.com', 'secret');

    const request = httpTestingController.expectOne('/api/auth/login');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ email: 'seller@example.com', password: 'secret' });
    request.flush({ accessToken: 'token-1' });

    expect(await login).toBe(true);
    expect(service.accessToken()).toBe('token-1');
    expect(service.isAuthenticated()).toBe(true);
  });

  it('reports rejected credentials without throwing', async () => {
    const login = service.login('seller@example.com', 'wrong');

    httpTestingController
      .expectOne('/api/auth/login')
      .flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(await login).toBe(false);
    expect(service.isAuthenticated()).toBe(false);
  });

  it('rethrows server failures on sign in', async () => {
    const login = service.login('seller@example.com', 'secret');

    httpTestingController
      .expectOne('/api/auth/login')
      .flush(null, { status: 500, statusText: 'Server Error' });

    await expect(login).rejects.toMatchObject({ status: 500 });
  });

  it('shares one refresh request between concurrent callers', async () => {
    const first = service.refresh();
    const second = service.refresh();

    httpTestingController.expectOne('/api/auth/refresh').flush({ accessToken: 'token-2' });

    expect(await first).toBe('token-2');
    expect(await second).toBe('token-2');
    expect(service.accessToken()).toBe('token-2');
  });

  it('signs out locally when the refresh token is rejected', async () => {
    const refresh = service.refresh();

    httpTestingController
      .expectOne('/api/auth/refresh')
      .flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(await refresh).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });

  it('restores quietly when the server cannot be reached', async () => {
    const restore = service.restore();

    httpTestingController.expectOne('/api/auth/refresh').error(new ProgressEvent('error'));

    expect(await restore).toBeNull();
  });

  it('clears the token on sign out even if the request fails', async () => {
    const login = service.login('seller@example.com', 'secret');
    httpTestingController.expectOne('/api/auth/login').flush({ accessToken: 'token-1' });
    await login;

    const logout = service.logout();
    httpTestingController
      .expectOne('/api/auth/logout')
      .flush(null, { status: 500, statusText: 'Server Error' });

    await expect(logout).rejects.toBeTruthy();
    expect(service.isAuthenticated()).toBe(false);
  });

  const signInExpiringIn = async (milliseconds: number) => {
    const login = service.login('seller@example.com', 'secret');
    httpTestingController.expectOne('/api/auth/login').flush({
      accessToken: 'token-1',
      expiresAt: new Date(Date.now() + milliseconds).toISOString(),
    });
    await login;
  };

  it('does not report an expired token while signed out', () => {
    expect(service.isExpired()).toBe(false);
  });

  it('does not report a fresh token as expired', async () => {
    await signInExpiringIn(60_000);

    expect(service.isExpired()).toBe(false);
  });

  it('reports a token as expired from one second before its expiry time', async () => {
    await signInExpiringIn(500);

    expect(service.isExpired()).toBe(true);
  });

  it('reports a token past its expiry time as expired', async () => {
    await signInExpiringIn(-5_000);

    expect(service.isExpired()).toBe(true);
  });

  it('takes the new expiry time from a refresh', async () => {
    await signInExpiringIn(-5_000);

    const refresh = service.refresh();
    httpTestingController.expectOne('/api/auth/refresh').flush({
      accessToken: 'token-2',
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
    });
    await refresh;

    expect(service.isExpired()).toBe(false);
  });

  it('forgets the expiry time when the refresh token is rejected', async () => {
    await signInExpiringIn(-5_000);

    const refresh = service.refresh();
    httpTestingController
      .expectOne('/api/auth/refresh')
      .flush(null, { status: 401, statusText: 'Unauthorized' });
    await refresh;

    expect(service.isExpired()).toBe(false);
  });
});
