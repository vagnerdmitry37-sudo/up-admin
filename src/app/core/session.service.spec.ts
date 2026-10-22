import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from './api-base-url';
import { SessionService } from './session.service';

describe('SessionService', () => {
  let session: SessionService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api' },
      ],
    });
    session = TestBed.inject(SessionService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('signs in and keeps the access token', async () => {
    const login = session.login('seller@example.com', 'secret');

    const request = http.expectOne('/api/auth/login');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ email: 'seller@example.com', password: 'secret' });
    request.flush({ accessToken: 'token-1' });

    expect(await login).toBe(true);
    expect(session.accessToken()).toBe('token-1');
    expect(session.isAuthenticated()).toBe(true);
  });

  it('reports rejected credentials without throwing', async () => {
    const login = session.login('seller@example.com', 'wrong');

    http.expectOne('/api/auth/login').flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(await login).toBe(false);
    expect(session.isAuthenticated()).toBe(false);
  });

  it('rethrows server failures on sign in', async () => {
    const login = session.login('seller@example.com', 'secret');

    http.expectOne('/api/auth/login').flush(null, { status: 500, statusText: 'Server Error' });

    await expect(login).rejects.toMatchObject({ status: 500 });
  });

  it('shares one refresh request between concurrent callers', async () => {
    const first = session.refresh();
    const second = session.refresh();

    http.expectOne('/api/auth/refresh').flush({ accessToken: 'token-2' });

    expect(await first).toBe('token-2');
    expect(await second).toBe('token-2');
    expect(session.accessToken()).toBe('token-2');
  });

  it('signs out locally when the refresh token is rejected', async () => {
    const refresh = session.refresh();

    http.expectOne('/api/auth/refresh').flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(await refresh).toBeNull();
    expect(session.isAuthenticated()).toBe(false);
  });

  it('restores quietly when the server cannot be reached', async () => {
    const restore = session.restore();

    http.expectOne('/api/auth/refresh').error(new ProgressEvent('error'));

    expect(await restore).toBeNull();
  });

  it('clears the token on sign out even if the request fails', async () => {
    const login = session.login('seller@example.com', 'secret');
    http.expectOne('/api/auth/login').flush({ accessToken: 'token-1' });
    await login;

    const logout = session.logout();
    http.expectOne('/api/auth/logout').flush(null, { status: 500, statusText: 'Server Error' });

    await expect(logout).rejects.toBeTruthy();
    expect(session.isAuthenticated()).toBe(false);
  });
});
