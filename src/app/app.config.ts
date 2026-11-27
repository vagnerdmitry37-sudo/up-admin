import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  ErrorHandler,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { TitleStrategy, provideRouter, withComponentInputBinding } from '@angular/router';
import { AppTitleStrategy } from '@core/app-title-strategy';
import { AppErrorHandler } from '@core/app-error-handler';
import { authInterceptor } from '@core/auth.interceptor';
import { requestTrackerInterceptor } from '@core/request-tracker.interceptor';
import { provideBackAction } from '@core/back-action';
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
    { provide: TitleStrategy, useClass: AppTitleStrategy },
    provideHttpClient(withInterceptors([requestTrackerInterceptor, authInterceptor])),
    provideOptimus({ theme: { preset: NoirPreset } }),
    MessageService,
    provideBackAction(),
    provideAppInitializer(() => inject(SessionService).restore()),
  ],
};
