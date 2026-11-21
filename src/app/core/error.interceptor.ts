import { HttpErrorResponse, HttpInterceptorFn, HttpStatusCode } from '@angular/common/http';
import { inject } from '@angular/core';
import { API_BASE_URL } from '@core/api-base-url';
import { AppMessageService } from '@core/app-message.service';
import { catchError, throwError } from 'rxjs';

interface ProblemDetails {
  detail?: string;
  errors?: Record<string, string[]>;
}

interface ErrorMessage {
  summary: string;
  detail: string;
}

const problemOf = (error: HttpErrorResponse): ProblemDetails =>
  typeof error.error === 'object' && error.error !== null ? (error.error as ProblemDetails) : {};

const validationMessages = (problem: ProblemDetails) =>
  Object.values(problem.errors ?? {})
    .flat()
    .join(' ');

const errorMessageFor = (error: HttpErrorResponse): ErrorMessage => {
  const problem = problemOf(error);
  if (error.status === 0) {
    return {
      summary: 'No connection',
      detail: 'The server could not be reached. Check your connection and try again.',
    };
  }
  if (error.status === HttpStatusCode.BadRequest) {
    return {
      summary: 'Please check the entered data',
      detail: validationMessages(problem) || problem.detail || 'Some of the data is not valid.',
    };
  }
  if (error.status === HttpStatusCode.Forbidden) {
    return { summary: 'Not allowed', detail: 'You do not have permission to do this.' };
  }
  if (error.status === HttpStatusCode.NotFound) {
    return {
      summary: 'Not found',
      detail: 'The record may have been deleted in the meantime. Refresh the page and try again.',
    };
  }
  if (error.status === HttpStatusCode.Conflict) {
    return {
      summary: 'Could not be completed',
      detail: problem.detail ?? 'This conflicts with existing data.',
    };
  }
  if (error.status >= HttpStatusCode.InternalServerError) {
    return {
      summary: 'Something went wrong',
      detail: 'The server could not complete the request. Please try again later.',
    };
  }
  return { summary: 'Request failed', detail: problem.detail ?? 'Please try again.' };
};

export const errorInterceptor: HttpInterceptorFn = (request, next) => {
  const messageService = inject(AppMessageService);
  const authUrl = `${inject(API_BASE_URL)}/auth/`;
  const isLoginRequest = request.url === `${authUrl}login`;
  const isOtherAuthRequest = request.url.startsWith(authUrl) && !isLoginRequest;

  return next(request).pipe(
    catchError((error: unknown) => {
      const handledElsewhere =
        !(error instanceof HttpErrorResponse) ||
        error.status === HttpStatusCode.Unauthorized ||
        isOtherAuthRequest ||
        (isLoginRequest && error.status === HttpStatusCode.BadRequest);
      if (!handledElsewhere) {
        const { summary, detail } = errorMessageFor(error);
        messageService.error(summary, detail);
      }
      return throwError(() => error);
    }),
  );
};
