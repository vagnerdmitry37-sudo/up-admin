import { HttpContextToken, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { RequestTracker, TrackedRequest } from '@core/request-tracker';

export const TRACKED_REQUEST = new HttpContextToken<TrackedRequest | undefined>(() => undefined);

export const requestTrackerInterceptor: HttpInterceptorFn = (request, next) =>
  next(request).pipe(inject(RequestTracker).track(request.context.get(TRACKED_REQUEST)));
