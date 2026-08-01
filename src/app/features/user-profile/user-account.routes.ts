import { Routes } from '@angular/router';
import { UserAccountComponent } from './user-account.component';
import { AccountProfileComponent } from './features/account-profile/account-profile.component';
import { SubscriptionBillingComponent } from './features/subscription-billing/subscription-billing.component';
import { GdprPrivacyComponent } from './features/gdpr-privacy/gdpr-privacy.component';
import { SecurityComponent } from './features/security/security.component';
import { ContactSupportComponent } from './features/contact-support/contact-support.component';
import { routesDataMapping } from '../../../configs/routes.config';

export const userAccountRoutes: Routes = [
  {
    path: '',
    component: UserAccountComponent,
    data: routesDataMapping['UserAccountComponent'],
    children: [
      { path: '', redirectTo: 'profile', pathMatch: 'full' },
      {
        path: 'profile',
        component: AccountProfileComponent,
        data: routesDataMapping['AccountProfileComponent'],
      },
      {
        path: 'subscription',
        component: SubscriptionBillingComponent,
        data: routesDataMapping['SubscriptionBillingComponent'],
      },
      {
        path: 'privacy',
        component: GdprPrivacyComponent,
        data: routesDataMapping['GdprPrivacyComponent'],
      },
      {
        path: 'security',
        component: SecurityComponent,
        data: routesDataMapping['SecurityComponent'],
      },
      {
        path: 'support',
        component: ContactSupportComponent,
        data: routesDataMapping['ContactSupportComponent'],
      },
    ],
  },
];
