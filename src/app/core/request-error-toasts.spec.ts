import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MessageService } from '@openng/optimus-ui/api';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from './api-base-url';
import { httpActivityInterceptor } from './http-activity.interceptor';
import { ApiClient, ApiRequestOptions } from './api-client';
import { provideRequestErrorToasts } from './request-error-toasts';

describe('requestErrorToasts', () => {
  let httpClient: HttpClient;
  let httpTestingController: HttpTestingController;
  let add: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([httpActivityInterceptor])),
        provideRequestErrorToasts(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api' },
        MessageService,
      ],
    });
    httpClient = TestBed.inject(HttpClient);
    httpTestingController = TestBed.inject(HttpTestingController);
    add = vi.spyOn(TestBed.inject(MessageService), 'add');
  });

  afterEach(() => httpTestingController.verify());

  const loginOptions: ApiRequestOptions = { handledStatuses: [400] };

  const fail = async (
    url: string,
    status: number,
    body: object | null = null,
    options: ApiRequestOptions = {},
  ) => {
    const response = firstValueFrom(
      TestBed.inject(ApiClient).forEntity('product').post(url, {}, options),
    );
    httpTestingController.expectOne(url).flush(body, { status, statusText: 'Error' });
    await expect(response).rejects.toMatchObject({ status });
  };

  it.each([
    [
      400,
      { errors: { Name: ['Name is required.'], Price: ['Price must be 0 or more.'] } },
      'Please check the entered data',
      'Name is required. Price must be 0 or more.',
    ],
    [
      400,
      { detail: 'The order is closed.' },
      'Please check the entered data',
      'The order is closed.',
    ],
    [403, null, 'Not allowed', 'You do not have permission to do this.'],
    [
      404,
      null,
      'Not found',
      'The record may have been deleted in the meantime. Refresh the page and try again.',
    ],
    [
      409,
      { detail: 'The customer still has orders.' },
      'Could not be completed',
      'The customer still has orders.',
    ],
    [409, null, 'Could not be completed', 'This conflicts with existing data.'],
    [
      503,
      null,
      'Something went wrong',
      'The server could not complete the request. Please try again later.',
    ],
  ])(
    'shows one toast for a %i response and still fails the request',
    async (status, body, summary, detail) => {
      await fail('/api/products', status, body);

      expect(add).toHaveBeenCalledTimes(1);
      expect(add).toHaveBeenCalledWith({ severity: 'error', summary, detail });
    },
  );

  it('tells the user when the server cannot be reached', async () => {
    const response = firstValueFrom(httpClient.get('/api/products'));
    httpTestingController.expectOne('/api/products').error(new ProgressEvent('error'));
    await expect(response).rejects.toMatchObject({ status: 0 });

    expect(add).toHaveBeenCalledWith(expect.objectContaining({ summary: 'No connection' }));
  });

  it('leaves a 401 to the session handling', async () => {
    await fail('/api/products', 401);

    expect(add).not.toHaveBeenCalled();
  });

  it('stays silent for untracked requests such as token refresh and logout', async () => {
    await fail('/api/auth/refresh', 500, null, { untracked: true });
    await fail('/api/auth/logout', 500, null, { untracked: true });

    expect(add).not.toHaveBeenCalled();
  });

  it('leaves rejected login credentials to the login form', async () => {
    await fail('/api/auth/login', 400, null, loginOptions);

    expect(add).not.toHaveBeenCalled();
  });

  it('reports a login that fails on the server', async () => {
    await fail('/api/auth/login', 500, null, loginOptions);

    expect(add).toHaveBeenCalledWith(expect.objectContaining({ summary: 'Something went wrong' }));
  });
});
