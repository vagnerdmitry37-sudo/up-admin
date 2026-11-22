import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { API_BASE_URL } from '@core/api-base-url';
import { HttpActivity, RequestMethod } from '@core/http-activity.service';
import { defer, tap } from 'rxjs';

export const httpActivityInterceptor: HttpInterceptorFn = (request, next) => {
  const httpActivity = inject(HttpActivity);
  const authUrl = `${inject(API_BASE_URL)}/auth/`;
  const isBackgroundAuthRequest =
    request.url.startsWith(authUrl) && request.url !== `${authUrl}login`;

  if (isBackgroundAuthRequest) {
    return next(request);
  }

  return defer(() => {
    const trackedRequest = httpActivity.start(
      request.method as RequestMethod,
      request.urlWithParams,
    );
    return next(request).pipe(
      tap({
        next: (event) => {
          if (event instanceof HttpResponse) {
            httpActivity.finish(trackedRequest, 'succeeded');
          }
        },
        complete: () => httpActivity.finish(trackedRequest, 'succeeded'),
        error: () => httpActivity.finish(trackedRequest, 'failed'),
        unsubscribe: () => httpActivity.finish(trackedRequest, 'cancelled'),
      }),
    );
  });
};
