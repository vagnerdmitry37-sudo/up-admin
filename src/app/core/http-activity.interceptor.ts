import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { HttpActivity, REQUEST_TAG } from '@core/http-activity.service';
import { defer, tap } from 'rxjs';

export const httpActivityInterceptor: HttpInterceptorFn = (request, next) => {
  const httpActivity = inject(HttpActivity);
  const { untracked, entity, handledStatuses } = request.context.get(REQUEST_TAG);

  if (untracked) {
    return next(request);
  }

  return defer(() => {
    const trackedRequest = httpActivity.start({
      kind: 'request',
      entity,
      method: request.method,
      url: request.urlWithParams,
      handledStatuses,
    });
    return next(request).pipe(
      tap({
        next: (event) => {
          if (event instanceof HttpResponse) {
            httpActivity.finish(trackedRequest, 'succeeded');
          }
        },
        complete: () => httpActivity.finish(trackedRequest, 'succeeded'),
        error: (error: unknown) => httpActivity.finish(trackedRequest, 'failed', error),
        unsubscribe: () => httpActivity.finish(trackedRequest, 'cancelled'),
      }),
    );
  });
};
