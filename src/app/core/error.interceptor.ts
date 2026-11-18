import { HttpErrorResponse, HttpInterceptorFn, HttpStatusCode } from '@angular/common/http';
import { inject } from '@angular/core';
import { API_BASE_URL } from '@core/api-base-url';
import { MessageService } from '@openng/optimus-ui/api';
import { catchError, throwError } from 'rxjs';

interface ProblemDetails {
  detail?: string;
  errors?: Record<string, string[]>;
}

interface ErrorMessage {
  summary: string;
  detail: string;
}

const ERROR_MESSAGE_LIFE_MS = 8000;

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
  const messageService = inject(MessageService);
  const authUrl = `${inject(API_BASE_URL)}/auth/`;

  return next(request).pipe(
    catchError((error: unknown) => {
      const handledElsewhere =
        !(error instanceof HttpErrorResponse) ||
        error.status === HttpStatusCode.Unauthorized ||
        request.url.startsWith(authUrl);
      if (!handledElsewhere) {
        messageService.add({
          severity: 'error',
          life: ERROR_MESSAGE_LIFE_MS,
          ...errorMessageFor(error),
        });
      }
      return throwError(() => error);
    }),
  );
};
