import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { API_BASE_URL } from '@core/api-base-url';
import { SessionService } from '@core/session.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const token = inject(SessionService).accessToken();
  const isApiRequest = request.url.startsWith(`${inject(API_BASE_URL)}/`);

  return token && isApiRequest
    ? next(request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }))
    : next(request);
};
