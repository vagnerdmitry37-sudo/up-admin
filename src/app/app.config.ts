import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { authInterceptor } from '@core/auth.interceptor';
import { NoirPreset } from '@core/noir-preset';
import { SessionService } from '@core/session.service';
import { ConfirmationService } from '@openng/optimus-ui/api';
import { provideOptimus } from '@openng/optimus-ui/config';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideOptimus({ theme: { preset: NoirPreset } }),
    ConfirmationService,
    provideAppInitializer(() => inject(SessionService).restore()),
  ],
};
