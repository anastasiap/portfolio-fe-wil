import { inject, Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Store } from '@ngrx/store';
import { setLanguage } from '../../state';
import { CookieService } from '../cookie.service';
import { DEFAULT_WHEEL_LOCALE } from '../../../configs/i18n.config';

export const supportedLocales: Locale[] = ['en', 'ru'];

@Injectable({
  providedIn: 'root',
})
export class LocaleService {
  private translate = inject(TranslateService);
  private store = inject(Store);
  private cookieService = inject(CookieService);

  constructor() {
    this.translate.addLangs(supportedLocales);
    this.translate.setDefaultLang(DEFAULT_WHEEL_LOCALE);

    const savedLang = this.cookieService.getCookie('wilLanguage');
    const langToUse = savedLang && supportedLocales.includes(savedLang as Locale) ? (savedLang as Locale) : DEFAULT_WHEEL_LOCALE;

    this.translate.use(langToUse);
    this.store.dispatch(setLanguage({ lang: langToUse }));

    if (!savedLang) {
      this.cookieService.setCookie('wilLanguage', DEFAULT_WHEEL_LOCALE);
    }
  }

  public setLocale(locale: Locale): void {
    this.translate.use(locale);
    this.store.dispatch(setLanguage({ lang: locale }));
    this.cookieService.setCookie('wilLanguage', locale);
  }
}
