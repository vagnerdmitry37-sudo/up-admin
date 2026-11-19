import { HttpErrorResponse } from '@angular/common/http';
import { ErrorHandler, Injectable, inject } from '@angular/core';
import { MessageService } from '@openng/optimus-ui/api';

@Injectable()
export class AppErrorHandler implements ErrorHandler {
  private readonly messageService = inject(MessageService);

  handleError(error: unknown): void {
    console.error(error);
    if (error instanceof HttpErrorResponse) {
      return;
    }
    this.messageService.add({
      severity: 'error',
      summary: 'Something went wrong',
      detail: 'An unexpected error occurred. Please try again.',
    });
  }
}
