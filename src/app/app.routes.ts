import { Routes } from '@angular/router';
import { AboutMeComponent } from './features/about-me/about-me.component';
import { NotFoundComponent } from './ui/not-found/not-found.component';
import { HomeComponent } from './features/home/home.component';
import { PersonalComponent } from './features/personal/personal.component';
import { ResetPasswordComponent } from './features/reset-password/reset-password.component';

import { VerifyEmailComponent } from './features/user-profile/features/verify-email/verify-email.component';
import { authGuard } from './guards/auth.guard';
import { accountDataGuard } from './guards/account-data.guard';
import { BASE, personalHomeGuards, professionalGuards, routesDataMapping } from '../configs/routes.config';
import { ProfessionalComponent } from './features/professional/professional.component';
import { LandingPaidPlansComponent } from './features/landings/landing-paid-plans/landing-paid-plans.component';
import { LandingWaitlistComponent } from './features/landings/landing-waitlist/landing-waitlist.component';
import { LandingCoachesComponent } from './features/landings/landing-coaches/landing-coaches.component';
import { LandingPersonalPlanComponent } from './features/landings/landing-personal-plan/landing-personal-plan.component';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    // canMatch: [rootRedirectGuard],
    data: routesDataMapping['HomeComponent'],
  },
  {
    path: 'home',
    component: HomeComponent,
    // canMatch: [rootRedirectGuard],
    data: routesDataMapping['HomeComponent'],
  },
  {
    path: 'about',
    component: AboutMeComponent,
    data: routesDataMapping['AboutMeComponent'],
  },
  {
    path: 'for-coaches',
    component: LandingCoachesComponent,
    data: routesDataMapping['LandingCoachesComponent'],
  },
  {
    path: 'how-personal-plan-works',
    component: LandingPersonalPlanComponent,
    data: { ...routesDataMapping['LandingCoachesComponent'], planType: 'personal' },
  },
  {
    path: 'personal-plan-premium-offer',
    component: LandingWaitlistComponent,
    data: routesDataMapping['LandingWaitlistComponent'],
  },
  {
    path: 'plans',
    component: LandingPaidPlansComponent,
    data: routesDataMapping['LandingPaidPlansComponent'],
  },
  {
    path: 'blog',
    loadChildren: () => import('./features/blog/blog.routes').then((m) => m.blogRoutes),
  },
  {
    path: `${BASE}/wheel`,
    component: PersonalComponent,
    canActivate: personalHomeGuards,
    data: routesDataMapping['PersonalComponent'],
  },
  {
    path: `${BASE}/workplace`,
    canActivate: professionalGuards,
    component: ProfessionalComponent,
  },
  {
    path: `${BASE}/account`,
    loadChildren: () => import('./features/user-profile/user-account.routes').then((m) => m.userAccountRoutes),
    canActivate: [authGuard, accountDataGuard],
  },
  {
    path: 'terms',
    loadChildren: () => import('./features/legal/legal.routes').then((m) => m.termsRoutes),
  },
  {
    path: 'privacy',
    loadChildren: () => import('./features/legal/legal.routes').then((m) => m.privacyRoutes),
  },
  {
    path: 'cookies',
    loadChildren: () => import('./features/legal/legal.routes').then((m) => m.cookiesRoutes),
  },
  {
    path: 'reset-password',
    component: ResetPasswordComponent,
    data: { title: 'Reset Password' },
  },
  {
    path: 'verify-email',
    component: VerifyEmailComponent,
    data: routesDataMapping['VerifyEmailComponent'],
  },
  {
    path: 'register-free-account',
    loadChildren: () => import('./features/register-free-account/register-free-account.routes').then((m) => m.registerFreeAccountRoutes),
    data: routesDataMapping['RegisterFreeAccountComponent'],
  },
  {
    path: '**',
    component: NotFoundComponent,
    data: routesDataMapping['NotFoundComponent'],
  },
];
