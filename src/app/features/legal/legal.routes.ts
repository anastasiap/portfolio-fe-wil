import { Routes } from '@angular/router';
import { TermsPageComponent } from './terms-page/terms-page.component';
import { PrivacyPageComponent } from './privacy-page/privacy-page.component';
import { CookiesPageComponent } from './cookies-page/cookies-page.component';
import { provideMarkdown } from 'ngx-markdown';

export const termsRoutes: Routes = [
  {
    path: '',
    component: TermsPageComponent,
    providers: [provideMarkdown()],
    data: { title: 'Terms of Service' },
  },
];

export const privacyRoutes: Routes = [
  {
    path: '',
    component: PrivacyPageComponent,
    providers: [provideMarkdown()],
    data: { title: 'Privacy Policy' },
  },
];

export const cookiesRoutes: Routes = [
  {
    path: '',
    component: CookiesPageComponent,
    providers: [provideMarkdown()],
    data: { title: 'Cookies policy' },
  },
];
