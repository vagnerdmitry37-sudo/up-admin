import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { API_BASE_URL } from '@core/api-base-url';
import { SessionService } from '@core/session.service';
import { catchError, from, switchMap, throwError } from 'rxjs';

const withToken = (request: HttpRequest<unknown>, token: string | null) =>
  token ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : request;

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const session = inject(SessionService);
  const router = inject(Router);
  const apiUrl = `${inject(API_BASE_URL)}/`;

  if (!request.url.startsWith(apiUrl)) {
    return next(request);
  }

  const sentAccessToken = session.accessToken();
  const isAuthRequest = request.url.startsWith(`${apiUrl}auth/`);

  return next(withToken(request, sentAccessToken)).pipe(
    catchError((error: unknown) => {
      if (isAuthRequest || !(error instanceof HttpErrorResponse) || error.status !== 401) {
        return throwError(() => error);
      }

      const currentAccessToken = session.accessToken();
      const freshAccessToken =
        currentAccessToken && currentAccessToken !== sentAccessToken
          ? Promise.resolve(currentAccessToken)
          : session.refresh();

      return from(freshAccessToken).pipe(
        switchMap((token) => {
          if (!token) {
            void router.navigateByUrl('/login');
            return throwError(() => error);
          }

          return next(withToken(request, token));
        }),
      );
    }),
  );
};
