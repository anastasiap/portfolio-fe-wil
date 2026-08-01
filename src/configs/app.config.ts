import { APP_ID, ApplicationConfig, ENVIRONMENT_INITIALIZER, importProvidersFrom, inject } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { BrowserModule } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter, RouterFeatures, TitleStrategy } from '@angular/router';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { provideEffects } from '@ngrx/effects';
import { provideStore } from '@ngrx/store';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { provideMarkdown } from 'ngx-markdown';
import { httpLoaderFactory } from '../app/services/i18n/i18n.factory';
import { CustomTitleStrategy } from '../app/services/seo/title.strategy';
import { routes } from '../app/app.routes';
import { reducers } from '../app/state/store.config';
import { WheelEffects } from '../app/state';
import { AuthEffects } from '../app/state/auth/auth.effects';
import { GdprEffects } from '../app/state/gdpr';
import { AppIconRegistry } from '../app/core/services/app-icon-registry';

export function createSharedAppConfig(...routerFeatures: RouterFeatures[]): ApplicationConfig {
  return {
    providers: [
      importProvidersFrom([
        BrowserModule,
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useFactory: httpLoaderFactory,
            deps: [HttpClient],
          },
        }),
        HttpClientModule,
      ]),
      { provide: APP_ID, useValue: 'wheeloflife' },
      { provide: TitleStrategy, useClass: CustomTitleStrategy },
      provideRouter(routes, ...routerFeatures),
      provideAnimations(),
      provideStore(reducers),
      provideEffects([WheelEffects, AuthEffects, GdprEffects]),
      provideMarkdown(),
      {
        provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
        useValue: { appearance: 'outline' },
      },
      {
        provide: ENVIRONMENT_INITIALIZER,
        multi: true,
        useValue: () => inject(AppIconRegistry).register(),
      },
    ],
  };
}
