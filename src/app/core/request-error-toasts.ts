import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import { inject, provideAppInitializer } from '@angular/core';
import { AppMessageService } from '@core/app-message.service';
import { Activity, HttpActivity } from '@core/http-activity.service';

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

const toastableErrorOf = ({ error, handledStatuses = [] }: Activity) =>
  error instanceof HttpErrorResponse &&
  error.status !== HttpStatusCode.Unauthorized &&
  !handledStatuses.includes(error.status)
    ? error
    : undefined;

export const provideRequestErrorToasts = () =>
  provideAppInitializer(() => {
    const messageService = inject(AppMessageService);
    inject(HttpActivity)
      .on({ kind: 'request', status: 'failed' })
      .subscribe((failedRequest) => {
        const error = toastableErrorOf(failedRequest);
        if (error) {
          const { summary, detail } = errorMessageFor(error);
          messageService.error(summary, detail);
        }
      });
  });
