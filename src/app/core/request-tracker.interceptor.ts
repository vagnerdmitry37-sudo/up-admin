import { HttpContextToken, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { RequestName, RequestTracker } from '@core/request-tracker';

export const REQUEST_NAME = new HttpContextToken<RequestName | undefined>(() => undefined);

export const requestTrackerInterceptor: HttpInterceptorFn = (request, next) =>
  next(request).pipe(inject(RequestTracker).track(request.context.get(REQUEST_NAME)));
