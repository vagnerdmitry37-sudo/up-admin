import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  ErrorHandler,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { AppErrorHandler } from '@core/app-error-handler';
import { authInterceptor } from '@core/auth.interceptor';
import { httpActivityInterceptor } from '@core/http-activity.interceptor';
import { provideRequestErrorToasts } from '@core/request-error-toasts';
import { NoirPreset } from '@core/noir-preset';
import { SessionService } from '@core/session.service';
import { MessageService } from '@openng/optimus-ui/api';
import { provideOptimus } from '@openng/optimus-ui/config';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    { provide: ErrorHandler, useClass: AppErrorHandler },
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([httpActivityInterceptor, authInterceptor])),
    provideOptimus({ theme: { preset: NoirPreset } }),
    MessageService,
    provideRequestErrorToasts(),
    provideAppInitializer(() => inject(SessionService).restore()),
  ],
};
