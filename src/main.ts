import * as Sentry from '@sentry/angular';
import { bootstrapApplication, provideClientHydration } from '@angular/platform-browser';

import { Router } from '@angular/router';
import { AppComponent } from './app/app.component';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { APP_INITIALIZER, ApplicationConfig, ErrorHandler, isDevMode, mergeApplicationConfig } from '@angular/core';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { AuthInitializationService } from './app/services/auth/auth-initialization.service';
import { AuthInterceptor } from './app/services/auth/auth.interceptor';
import { provideCharts } from 'ng2-charts';
import { CategoryScale, Legend, LinearScale, LineController, LineElement, PointElement, Tooltip } from 'chart.js';
import { GlobalHttpInterceptor } from './app/core/interceptors/global-http.interceptor';
import { createSharedAppConfig } from './configs/app.config';

/**
 * Factory function for silent auth initialization on app bootstrap
 * Attempts to restore user session using httpOnly refresh token cookie
 */
export function initAuth(authInit: AuthInitializationService) {
  return () => authInit.initializeAuth();
}

const browserConfig: ApplicationConfig = {
  providers: [
    {
      provide: ErrorHandler,
      useFactory: () => Sentry.createErrorHandler(),
    },
    {
      provide: Sentry.TraceService,
      deps: [Router],
    },
    {
      provide: APP_INITIALIZER,
      useFactory: () => () => {
        /* empty */
      },
      deps: [Sentry.TraceService],
      multi: true,
    },
    // APP_INITIALIZER for silent auth restore on app bootstrap
    {
      provide: APP_INITIALIZER,
      useFactory: initAuth,
      deps: [AuthInitializationService],
      multi: true,
    },
    // HTTP Interceptor for automatic token refresh and authentication
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    },
    // Global HTTP Interceptor for error handling and normalization
    {
      provide: HTTP_INTERCEPTORS,
      useClass: GlobalHttpInterceptor,
      multi: true,
    },
    provideClientHydration(),
    provideCharts({
      registerables: [LineController, LineElement, PointElement, CategoryScale, LinearScale, Legend, Tooltip],
    }),
    provideStoreDevtools({
      maxAge: 25,
      logOnly: !isDevMode(),
      trace: true, // flip to true if you want stack traces
    }),
  ],
};

export const appConfig = mergeApplicationConfig(createSharedAppConfig(), browserConfig);

bootstrapApplication(AppComponent, appConfig).catch((err) => {
  Sentry.captureException(err);
  console.error('bootstrapApplication', err);
});
