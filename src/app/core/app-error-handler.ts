import { ErrorHandler, Injectable, inject } from '@angular/core';
import { AppMessageService } from '@core/app-message.service';

@Injectable()
export class AppErrorHandler implements ErrorHandler {
  private readonly messageService = inject(AppMessageService);

  handleError(error: unknown): void {
    console.error(error);
    this.messageService.error(
      'Something went wrong',
      'An unexpected error occurred. Please try again.',
    );
  }
}
