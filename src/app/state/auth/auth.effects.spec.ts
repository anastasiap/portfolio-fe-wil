import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { getEffectsMetadata } from '@ngrx/effects';
import { provideMockActions } from '@ngrx/effects/testing';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { Action } from '@ngrx/store';
import { Observable } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { BillingApiService } from '../../services/api/billing-api.service';
import { AccountsDataService } from '../../services/accounts/accounts-data.service';
import { AuthDataService } from '../../services/auth/auth-data.service';
import {
  Account,
  AccountEmailPreferences,
  AccountLegalConsentsDto,
  AuthError,
  CompleteSignupResponse,
  Entitlements,
  LoginResponse,
  MeResponse,
  MySubscriptionState,
  PendingSignupResponse,
  User,
} from '../../services/auth/auth.types';
import { TokenMemoryService } from '../../services/auth/token-memory.service';
import { ExternalRedirectService } from '../../services/external-redirect.service';
import { NotificationService } from '../../services/notification.service';
import { PERSONAL_HOME_ROUTE, PROFESSIONAL_HOME_ROUTE } from '../../../configs/routes.config';
import { AuthEffects } from './auth.effects';
import { selectPlan } from './auth.selectors';
import * as AuthActions from './auth.actions';
import { environment } from '../../../environments/environment';

describe('AuthEffects', () => {
  let actions$: Observable<Action>;
  let effects: AuthEffects;
  let testScheduler: TestScheduler;
  let mockStore: MockStore;
  let authDataService: jasmine.SpyObj<AuthDataService>;
  let accountsDataService: jasmine.SpyObj<AccountsDataService>;
  let billingApiService: jasmine.SpyObj<BillingApiService>;
  let notificationService: jasmine.SpyObj<NotificationService>;
  let tokenMemoryService: jasmine.SpyObj<TokenMemoryService>;
  let externalRedirectService: jasmine.SpyObj<ExternalRedirectService>;
  let router: jasmine.SpyObj<Router>;

  const createUser = (overrides: Partial<User> = {}): User => ({
    id: 'user-1',
    email: 'test@example.com',
    emailVerified: true,
    name: 'Test',
    secondName: 'User',
    systemRole: 'user',
    status: 'active',
    auth: {
      mfaEnabled: false,
      lastLoginAt: '2026-01-01T00:00:00.000Z',
    },
    audit: {
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    ...overrides,
  });

  const createAccount = (overrides: Partial<Account> = {}): Account => ({
    id: 'account-1',
    name: 'Test Account',
    type: 'personal',
    ...overrides,
  });

  const createEntitlements = (overrides: Partial<Entitlements> = {}): Entitlements => ({
    features: ['save_sessions'],
    limits: {
      sessions: 10,
    },
    ...overrides,
  });

  const createSubscriptionResponse = (
    overrides: Partial<GetMySubscriptionResponseDto> = {}
  ): GetMySubscriptionResponseDto => ({
    planCode: 'personal',
    planLabel: 'Personal',
    status: 'active',
    billingInterval: 'month',
    currency: 'EUR',
    priceCents: 900,
    currentPeriodEnd: '2026-02-01T00:00:00.000Z',
    cancelAtPeriodEnd: false,
    entitlements: [
      {
        label: 'save_sessions',
        value: 10,
      },
      {
        label: 'branding',
        value: null,
      },
    ],
    source: 'stripe',
    ...overrides,
  });

  const createSubscriptionState = (overrides: Partial<MySubscriptionState> = {}): MySubscriptionState => ({
    ...createSubscriptionResponse(),
    entitlementsLabels: ['Sessions: 10', 'Branding: Unlimited'],
    ...overrides,
  });

  const createLoginResponse = (overrides: Partial<LoginResponse> = {}): LoginResponse => ({
    user: createUser(),
    tokens: {
      accessToken: 'access-token',
    },
    account: createAccount(),
    entitlements: createEntitlements(),
    ...overrides,
  });

  const createMeResponse = (overrides: Partial<MeResponse> = {}): MeResponse => ({
    user: createUser(),
    account: createAccount() as MeResponse['account'],
    entitlements: createEntitlements(),
    subscription: createSubscriptionState(),
    ...overrides,
  });

  const createSignupResponse = (overrides: Partial<CompleteSignupResponse> = {}): CompleteSignupResponse => ({
    user: createUser(),
    subscription: {
      accountId: 'account-1',
      provider: 'stripe',
      plan: 'personal',
      status: 'active',
      cancelAtPeriodEnd: false,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      id: 'subscription-1',
    },
    account: createAccount(),
    entitlements: createEntitlements(),
    accessToken: 'signup-token',
    ...overrides,
  });

  const createPendingSignupResponse = (overrides: Partial<PendingSignupResponse> = {}): PendingSignupResponse => ({
    status: 'paid',
    step: 'create_password',
    plan: 'personal',
    email: 'signup@example.com',
    ...overrides,
  });

  const createError = (overrides: Partial<AuthError> = {}): AuthError => ({
    message: 'Something went wrong',
    code: 'ERROR',
    statusCode: 400,
    ...overrides,
  });

  beforeEach(() => {
    authDataService = jasmine.createSpyObj<AuthDataService>('AuthDataService', [
      'completeSignup',
      'getPendingSignup',
      'login',
      'logout',
      'me',
      'refresh',
      'register',
      'requestPasswordReset',
      'resetPassword',
      'resetPasswordWithToken',
      'sendVerificationEmail',
      'verifyEmail',
    ]);
    accountsDataService = jasmine.createSpyObj<AccountsDataService>('AccountsDataService', [
      'acceptLegalConsents',
      'updateMyEmailPreferences',
    ]);
    billingApiService = jasmine.createSpyObj<BillingApiService>('BillingApiService', [
      'createPortalSession',
      'createStripeCheckoutSession',
      'createUpgradeCheckoutSession',
      'getMySubscription',
      'resubscribe',
    ]);
    notificationService = jasmine.createSpyObj<NotificationService>('NotificationService', ['showError', 'showSuccess']);
    tokenMemoryService = jasmine.createSpyObj<TokenMemoryService>('TokenMemoryService', ['clear', 'setAccessToken']);
    externalRedirectService = jasmine.createSpyObj<ExternalRedirectService>('ExternalRedirectService', ['redirect']);
    router = jasmine.createSpyObj<Router>('Router', ['navigate', 'navigateByUrl']);

    TestBed.configureTestingModule({
      providers: [
        AuthEffects,
        provideMockActions(() => actions$),
        provideMockStore({ initialState: {} }),
        { provide: AuthDataService, useValue: authDataService },
        { provide: AccountsDataService, useValue: accountsDataService },
        { provide: BillingApiService, useValue: billingApiService },
        { provide: NotificationService, useValue: notificationService },
        { provide: TokenMemoryService, useValue: tokenMemoryService },
        { provide: ExternalRedirectService, useValue: externalRedirectService },
        { provide: Router, useValue: router },
      ],
    });

    mockStore = TestBed.inject(MockStore);
    mockStore.overrideSelector(selectPlan, 'personal');
    effects = TestBed.inject(AuthEffects);
    testScheduler = new TestScheduler((actual, expected) => expect(actual).toEqual(expected));
  });

  afterEach(() => {
    mockStore?.resetSelectors();
  });

  it('should dispatch attemptSilentRefresh when auth is initialized', () => {
    testScheduler.run(({ hot, expectObservable }) => {
      actions$ = hot('-a', { a: AuthActions.initializeAuth() });

      expectObservable(effects.initializeAuth$).toBe('-b', { b: AuthActions.attemptSilentRefresh() });
    });
  });

  it('should refresh silently, store the token, and dispatch silentRefreshSuccess', () => {
    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      actions$ = hot('-a', { a: AuthActions.attemptSilentRefresh() });
      authDataService.refresh.and.returnValue(cold('-b|', { b: { accessToken: 'fresh-token' } }));

      expectObservable(effects.attemptSilentRefresh$).toBe('--c', {
        c: AuthActions.silentRefreshSuccess({ accessToken: 'fresh-token' }),
      });
      flush();
      expect(tokenMemoryService.setAccessToken).toHaveBeenCalledOnceWith('fresh-token');
    });
  });

  it('should dispatch silentRefreshFailure when refresh fails', () => {
    testScheduler.run(({ hot, cold, expectObservable }) => {
      actions$ = hot('-a', { a: AuthActions.attemptSilentRefresh() });
      authDataService.refresh.and.returnValue(cold('-#', undefined, createError()));

      expectObservable(effects.attemptSilentRefresh$).toBe('--c', { c: AuthActions.silentRefreshFailure() });
    });
  });

  it('should load pending signup and start polling when payment is still pending', () => {
    testScheduler.run(({ hot, cold, expectObservable }) => {
      const signupId = 'signup-1';
      const response = createPendingSignupResponse({ status: 'initiated', step: 'waiting_payment' });
      actions$ = hot('-a', { a: AuthActions.loadPendingSignup({ signupId }) });
      authDataService.getPendingSignup.and.returnValue(cold('-b|', { b: response }));

      expectObservable(effects.loadPendingSignup$).toBe('--(cd)', {
        c: AuthActions.loadPendingSignupSuccess({ signup: { ...response, signupId } }),
        d: AuthActions.startPendingSignupPolling({ signupId }),
      });
    });
  });

  it('should load pending signup without polling when signup is ready to complete', () => {
    testScheduler.run(({ hot, cold, expectObservable }) => {
      const signupId = 'signup-1';
      const response = createPendingSignupResponse();
      actions$ = hot('-a', { a: AuthActions.loadPendingSignup({ signupId }) });
      authDataService.getPendingSignup.and.returnValue(cold('-b|', { b: response }));

      expectObservable(effects.loadPendingSignup$).toBe('--c', {
        c: AuthActions.loadPendingSignupSuccess({ signup: { ...response, signupId } }),
      });
    });
  });

  it('should load current user after silent refresh success', () => {
    testScheduler.run(({ hot, expectObservable }) => {
      actions$ = hot('-a', { a: AuthActions.silentRefreshSuccess({ accessToken: 'fresh-token' }) });

      expectObservable(effects.silentRefreshSuccess$).toBe('101ms b', { b: AuthActions.loadCurrentUser() });
    });
  });

  it('should login, store the token, and dispatch loginSuccess', () => {
    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      const credentials = { email: 'test@example.com', password: 'password' };
      const response = createLoginResponse();

      actions$ = hot('-a', { a: AuthActions.login({ credentials }) });
      authDataService.login.and.returnValue(cold('-b|', { b: response }));

      expectObservable(effects.login$).toBe('--c', {
        c: AuthActions.loginSuccess({
          user: response.user,
          account: response.account,
          entitlements: response.entitlements,
        }),
      });
      flush();
      expect(authDataService.login).toHaveBeenCalledOnceWith(credentials);
      expect(tokenMemoryService.setAccessToken).toHaveBeenCalledOnceWith('access-token');
    });
  });

  it('should dispatch loginFailure when login fails', () => {
    testScheduler.run(({ hot, cold, expectObservable }) => {
      const error = createError({ message: 'Invalid credentials' });

      actions$ = hot('-a', {
        a: AuthActions.login({ credentials: { email: 'test@example.com', password: 'password' } }),
      });
      authDataService.login.and.returnValue(cold('-#', undefined, error));

      expectObservable(effects.login$).toBe('--c', { c: AuthActions.loginFailure({ error }) });
    });
  });

  it('should load current user after login success', () => {
    testScheduler.run(({ hot, expectObservable }) => {
      actions$ = hot('-a', {
        a: AuthActions.loginSuccess({
          user: createUser(),
          account: createAccount(),
          entitlements: createEntitlements(),
        }),
      });

      expectObservable(effects.afterLoginSuccess$).toBe('-b', { b: AuthActions.loadCurrentUser() });
    });
  });

  it('should reroute personal users after login success without dispatching', () => {
    mockStore.overrideSelector(selectPlan, 'personal');
    mockStore.refreshState();

    testScheduler.run(({ hot, expectObservable, flush }) => {
      const action = AuthActions.loginSuccess({
        user: createUser(),
        account: createAccount(),
        entitlements: createEntitlements(),
      });

      actions$ = hot('-a-|', { a: action });

      expect(getEffectsMetadata(effects).rerouteAfterUserLoaded$?.dispatch).toBeFalse();
      expectObservable(effects.rerouteAfterUserLoaded$).toBe('-a-|', { a: [action, 'personal'] });
      flush();
      expect(router.navigateByUrl).toHaveBeenCalledOnceWith(PERSONAL_HOME_ROUTE, { replaceUrl: true });
    });
  });

  it('should reroute professional users after login success', () => {
    mockStore.overrideSelector(selectPlan, 'professional');
    mockStore.refreshState();

    testScheduler.run(({ hot, flush }) => {
      actions$ = hot('-a', {
        a: AuthActions.loginSuccess({
          user: createUser(),
          account: createAccount(),
          entitlements: createEntitlements(),
        }),
      });

      effects.rerouteAfterUserLoaded$.subscribe();
      flush();
      expect(router.navigateByUrl).toHaveBeenCalledOnceWith(PROFESSIONAL_HOME_ROUTE, { replaceUrl: true });
    });
  });

  it('should clear token and complete logout even when backend logout fails', () => {
    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      actions$ = hot('-a', { a: AuthActions.logoutRequested() });
      authDataService.logout.and.returnValue(cold('-#', undefined, createError()));

      expectObservable(effects.logout$).toBe('--c', { c: AuthActions.logoutCompleted() });
      flush();
      expect(tokenMemoryService.clear).toHaveBeenCalled();
    });
  });

  it('should navigate home after logout completes without dispatching', () => {
    testScheduler.run(({ hot, expectObservable, flush }) => {
      const action = AuthActions.logoutCompleted();
      actions$ = hot('-a-|', { a: action });

      expect(getEffectsMetadata(effects).logoutCompleted$?.dispatch).toBeFalse();
      expectObservable(effects.logoutCompleted$).toBe('-a-|', { a: action });
      flush();
      expect(router.navigateByUrl).toHaveBeenCalledOnceWith('/', { replaceUrl: true });
    });
  });

  it('should load current user with mapped subscription entitlement labels', () => {
    testScheduler.run(({ hot, cold, expectObservable }) => {
      const response = createMeResponse();

      actions$ = hot('-a', { a: AuthActions.loadCurrentUser() });
      authDataService.me.and.returnValue(cold('-b|', { b: response }));

      expectObservable(effects.loadCurrentUser$).toBe('--c', {
        c: AuthActions.loadCurrentUserSuccess({
          user: response.user,
          account: response.account,
          entitlements: response.entitlements,
          subscription: {
            ...response.subscription,
            entitlementsLabels: ['Sessions: 10', 'Branding: Unlimited'],
          },
        }),
      });
    });
  });

  it('should clear token and dispatch authSessionExpired when loading current user fails with 401', () => {
    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      const error = createError({ statusCode: 401 });

      actions$ = hot('-a', { a: AuthActions.loadCurrentUser() });
      authDataService.me.and.returnValue(cold('-#', undefined, error));

      expectObservable(effects.loadCurrentUser$).toBe('--c', { c: AuthActions.authSessionExpired() });
      flush();
      expect(tokenMemoryService.clear).toHaveBeenCalled();
    });
  });

  it('should dispatch loadCurrentUserFailure for non-401 current user errors', () => {
    testScheduler.run(({ hot, cold, expectObservable }) => {
      const error = createError({ statusCode: 500 });

      actions$ = hot('-a', { a: AuthActions.loadCurrentUser() });
      authDataService.me.and.returnValue(cold('-#', undefined, error));

      expectObservable(effects.loadCurrentUser$).toBe('--c', { c: AuthActions.loadCurrentUserFailure({ error }) });
    });
  });

  it('should load subscription data with mapped entitlement labels', () => {
    testScheduler.run(({ hot, cold, expectObservable }) => {
      const subscription = createSubscriptionResponse();

      actions$ = hot('-a', { a: AuthActions.loadMySubscription() });
      billingApiService.getMySubscription.and.returnValue(cold('-b|', { b: subscription }));

      expectObservable(effects.loadMySubscription$).toBe('--c', {
        c: AuthActions.loadMySubscriptionSuccess({
          subscription: {
            ...subscription,
            entitlementsLabels: ['Sessions: 10', 'Branding: Unlimited'],
          },
        }),
      });
    });
  });

  it('should dispatch loadMySubscriptionFailure with normalized errors', () => {
    testScheduler.run(({ hot, cold, expectObservable }) => {
      const error = { status: 500, code: 'SERVER_ERROR', message: 'Server failed' };

      actions$ = hot('-a', { a: AuthActions.loadMySubscription() });
      billingApiService.getMySubscription.and.returnValue(cold('-#', undefined, error));

      expectObservable(effects.loadMySubscription$).toBe('--c', {
        c: AuthActions.loadMySubscriptionFailure({
          error: {
            message: 'Server failed',
            code: 'SERVER_ERROR',
            statusCode: 500,
          },
        }),
      });
    });
  });

  it('should create a portal session on success', () => {
    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      const request = { returnUrl: '/account' };

      actions$ = hot('-a', { a: AuthActions.createPortalSession({ request }) });
      billingApiService.createPortalSession.and.returnValue(cold('-b|', { b: { url: 'https://billing.example/portal' } }));

      expectObservable(effects.createPortalSession$).toBe('--c', {
        c: AuthActions.createPortalSessionSuccess({ url: 'https://billing.example/portal' }),
      });
      flush();
      expect(billingApiService.createPortalSession).toHaveBeenCalledOnceWith(request);
    });
  });

  it('should redirect to the portal session URL without dispatching', () => {
    testScheduler.run(({ hot, expectObservable, flush }) => {
      const action = AuthActions.createPortalSessionSuccess({ url: 'https://billing.example/portal' });
      actions$ = hot('-a-|', { a: action });

      expect(getEffectsMetadata(effects).redirectToPortalSession$?.dispatch).toBeFalse();
      expectObservable(effects.redirectToPortalSession$).toBe('-a-|', { a: action });
      flush();
      expect(externalRedirectService.redirect).toHaveBeenCalledWith('https://billing.example/portal');
    });
  });

  it('should show a billing portal message and dispatch failure when portal creation fails', () => {
    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      const error = { status: 409, code: 'NO_SUBSCRIPTION' };

      actions$ = hot('-a', { a: AuthActions.createPortalSession({ request: { returnUrl: '/account' } }) });
      billingApiService.createPortalSession.and.returnValue(cold('-#', undefined, error));

      expectObservable(effects.createPortalSession$).toBe('--c', {
        c: AuthActions.createPortalSessionFailure({
          error: {
            message: 'Unable to access billing portal. No active subscription found.',
            code: 'NO_SUBSCRIPTION',
            statusCode: 409,
          },
        }),
      });
      flush();
      expect(notificationService.showError).toHaveBeenCalledOnceWith(
        'Unable to access billing portal. No active subscription found.'
      );
    });
  });

  it('should create an upgrade checkout session on success', () => {
    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      const request = { targetPlan: 'personal' as const, successUrl: '/success', cancelUrl: '/cancel' };

      actions$ = hot('-a', { a: AuthActions.createUpgradeCheckoutSession({ request }) });
      billingApiService.createUpgradeCheckoutSession.and.returnValue(
        cold('-b|', { b: { sessionId: 'session-1', sessionUrl: 'https://checkout.example/upgrade' } })
      );

      expectObservable(effects.createUpgradeCheckoutSession$).toBe('--c', {
        c: AuthActions.createUpgradeCheckoutSessionSuccess({ sessionUrl: 'https://checkout.example/upgrade' }),
      });
      flush();
      expect(billingApiService.createUpgradeCheckoutSession).toHaveBeenCalledOnceWith(request);
    });
  });

  it('should redirect to the upgrade checkout URL without dispatching', () => {
    testScheduler.run(({ hot, expectObservable, flush }) => {
      const action = AuthActions.createUpgradeCheckoutSessionSuccess({ sessionUrl: 'https://checkout.example/upgrade' });
      actions$ = hot('-a-|', { a: action });

      expect(getEffectsMetadata(effects).redirectToUpgradeCheckoutSession$?.dispatch).toBeFalse();
      expectObservable(effects.redirectToUpgradeCheckoutSession$).toBe('-a-|', { a: action });
      flush();
      expect(externalRedirectService.redirect).toHaveBeenCalledWith('https://checkout.example/upgrade');
    });
  });

  it('should update email preferences and notify on success', () => {
    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      const email: AccountEmailPreferences = {
        productUpdates: false,
        educationalContent: false,
        marketingContent: true,
      };

      actions$ = hot('-a', {
        a: AuthActions.updateAccountEmailPreferences({ patch: { marketingContent: true } }),
      });
      accountsDataService.updateMyEmailPreferences.and.returnValue(cold('-b|', { b: email }));

      expectObservable(effects.updateEmailPreferences$).toBe('--c', {
        c: AuthActions.updateAccountEmailPreferencesSuccess({ email }),
      });
      flush();
      expect(notificationService.showSuccess).toHaveBeenCalledOnceWith('Email preferences saved.');
    });
  });

  it('should notify and dispatch failure when updating email preferences fails', () => {
    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      const error = createError();

      actions$ = hot('-a', {
        a: AuthActions.updateAccountEmailPreferences({ patch: { marketingContent: false } }),
      });
      accountsDataService.updateMyEmailPreferences.and.returnValue(cold('-#', undefined, error));

      expectObservable(effects.updateEmailPreferences$).toBe('--c', {
        c: AuthActions.updateAccountEmailPreferencesFailure({ error }),
      });
      flush();
      expect(notificationService.showError).toHaveBeenCalledWith('Error saving email preferences. Please, try again');
    });
  });

  it('should accept legal consents with current legal versions', () => {
    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      const legalConsents: AccountLegalConsentsDto = {
        termsAccepted: true,
        privacyAccepted: true,
        termsVersion: environment.legal.termsVersion,
        privacyVersion: environment.legal.privacyVersion,
        acceptedAt: new Date('2026-01-01T00:00:00.000Z'),
      };

      actions$ = hot('-a', { a: AuthActions.acceptLegalConsents() });
      accountsDataService.acceptLegalConsents.and.returnValue(cold('-b|', { b: legalConsents }));

      expectObservable(effects.acceptLegalConsents$).toBe('--c', {
        c: AuthActions.acceptLegalConsentsSuccess({ legalConsents }),
      });
      flush();
      expect(accountsDataService.acceptLegalConsents).toHaveBeenCalledOnceWith({
        termsAccepted: true,
        privacyAccepted: true,
        termsVersion: environment.legal.termsVersion,
        privacyVersion: environment.legal.privacyVersion,
      });
    });
  });

  it('should dispatch failure when accepting legal consents fails', () => {
    testScheduler.run(({ hot, cold, expectObservable }) => {
      const error = createError({ message: 'Consent save failed', statusCode: 500 });

      actions$ = hot('-a', { a: AuthActions.acceptLegalConsents() });
      accountsDataService.acceptLegalConsents.and.returnValue(cold('-#', undefined, error));

      expectObservable(effects.acceptLegalConsents$).toBe('--c', {
        c: AuthActions.acceptLegalConsentsFailure({ error }),
      });
    });
  });

  it('should complete signup and registration by storing returned access tokens', () => {
    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      actions$ = hot('-a-b', {
        a: AuthActions.completeSignup({
          signupId: 'signup-1',
          name: 'Test',
          secondName: 'User',
          password: 'password',
          plan: 'personal',
        }),
        b: AuthActions.completeRegistration({
          email: 'test@example.com',
          name: 'Test',
          secondName: 'User',
          password: 'password',
          plan: 'free',
        }),
      });
      authDataService.completeSignup.and.returnValue(cold('-c|', { c: createSignupResponse({ accessToken: 'signup-token' }) }));
      authDataService.register.and.returnValue(cold('-d|', { d: createSignupResponse({ accessToken: 'register-token' }) }));

      expectObservable(effects.completeSignup$).toBe('--c-', { c: AuthActions.completeSignupSuccess() });
      expectObservable(effects.completeRegistration$).toBe('----d', { d: AuthActions.completeRegistrationSuccess() });
      flush();
      expect(tokenMemoryService.setAccessToken).toHaveBeenCalledWith('signup-token');
      expect(tokenMemoryService.setAccessToken).toHaveBeenCalledWith('register-token');
    });
  });

  it('should request password reset with a safe success notification', () => {
    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      actions$ = hot('-a', { a: AuthActions.requestPasswordReset({ email: 'test@example.com' }) });
      authDataService.requestPasswordReset.and.returnValue(cold('-b|', { b: { message: 'Sent' } }));

      expectObservable(effects.requestPasswordReset$).toBe('--c', { c: AuthActions.requestPasswordResetSuccess() });
      flush();
      expect(notificationService.showSuccess).toHaveBeenCalledOnceWith("If an account exists, we'll send a reset link.");
    });
  });

  it('should show a network error when password reset request fails with a server error', () => {
    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      const error = { status: 500, message: 'Server unavailable' };

      actions$ = hot('-a', { a: AuthActions.requestPasswordReset({ email: 'test@example.com' }) });
      authDataService.requestPasswordReset.and.returnValue(cold('-#', undefined, error));

      expectObservable(effects.requestPasswordReset$).toBe('--c', {
        c: AuthActions.requestPasswordResetFailure({ error }),
      });
      flush();
      expect(notificationService.showError).toHaveBeenCalledWith('Network error. Please check your connection and try again.');
    });
  });

  it('should reset password with token or current password session and dispatch success', () => {
    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      actions$ = hot('-a-b', {
        a: AuthActions.resetPassword({ newPassword: 'new-password', token: 'reset-token' }),
        b: AuthActions.resetPassword({ newPassword: 'session-password', token: null }),
      });
      authDataService.resetPasswordWithToken.and.returnValue(cold('-c|', { c: { message: 'Reset' } }));
      authDataService.resetPassword.and.returnValue(cold('-d|', { d: { message: 'Reset' } }));

      expectObservable(effects.resetPassword$).toBe('--c-d', {
        c: AuthActions.resetPasswordSuccess(),
        d: AuthActions.resetPasswordSuccess(),
      });
      flush();
      expect(authDataService.resetPasswordWithToken).toHaveBeenCalledOnceWith({
        token: 'reset-token',
        newPassword: 'new-password',
      });
      expect(authDataService.resetPassword).toHaveBeenCalledOnceWith('session-password');
      expect(notificationService.showSuccess).toHaveBeenCalledWith('Password reset success.');
    });
  });

  it('should dispatch resetPasswordFailure with normalized error when reset fails', () => {
    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      const error = { status: 400, code: 'INVALID_TOKEN', message: 'Invalid token' };

      actions$ = hot('-a', { a: AuthActions.resetPassword({ newPassword: 'new-password', token: 'reset-token' }) });
      authDataService.resetPasswordWithToken.and.returnValue(cold('-#', undefined, error));

      // BUG SUSPECTED: catchError is outside switchMap, so an API error completes the effect stream after this failure action.
      expectObservable(effects.resetPassword$).toBe('--(c|)', {
        c: AuthActions.resetPasswordFailure({
          error: {
            statusCode: 400,
            code: 'INVALID_TOKEN',
            message: 'Invalid token',
          },
        }),
      });
      flush();
      expect(notificationService.showError).toHaveBeenCalledOnceWith('Failed to reset password.');
    });
  });

  it('should resubscribe and notify the user on success', () => {
    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      const response = {
        success: true,
        message: 'Subscription reactivated',
        subscriptionStatus: 'active' as const,
        renewsAt: '2026-03-01T00:00:00.000Z',
      };

      actions$ = hot('-a', { a: AuthActions.resubscribe() });
      billingApiService.resubscribe.and.returnValue(cold('-b|', { b: response }));

      expectObservable(effects.resubscribe$).toBe('--c', { c: AuthActions.resubscribeSuccess({ response }) });
      flush();
      expect(notificationService.showSuccess).toHaveBeenCalledOnceWith('Subscription reactivated');
    });
  });

  it('should reload current user after resubscribe succeeds', () => {
    testScheduler.run(({ hot, expectObservable }) => {
      actions$ = hot('-a', {
        a: AuthActions.resubscribeSuccess({
          response: {
            success: true,
            message: 'Subscription reactivated',
            subscriptionStatus: 'active',
            renewsAt: '2026-03-01T00:00:00.000Z',
          },
        }),
      });

      expectObservable(effects.resubscribeSuccess$).toBe('-b', { b: AuthActions.loadCurrentUser() });
    });
  });

  it('should resend verification email with a user-facing success notification', () => {
    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      actions$ = hot('-a', { a: AuthActions.resendVerificationEmail() });
      authDataService.sendVerificationEmail.and.returnValue(cold('-b|', { b: { message: 'Sent' } }));

      expectObservable(effects.resendVerificationEmail$).toBe('--c', {
        c: AuthActions.resendVerificationEmailSuccess(),
      });
      flush();
      expect(notificationService.showSuccess).toHaveBeenCalledOnceWith('Verification email sent successfully.');
    });
  });

  it('should verify email with a user-facing success notification', () => {
    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      actions$ = hot('-a', { a: AuthActions.verifyEmail({ token: 'verify-token' }) });
      authDataService.verifyEmail.and.returnValue(cold('-b|', { b: { message: 'Email verified' } }));

      expectObservable(effects.verifyEmail$).toBe('--c', {
        c: AuthActions.verifyEmailSuccess({ message: 'Email verified' }),
      });
      flush();
      expect(notificationService.showSuccess).toHaveBeenCalledWith('Email verified successfully!');
    });
  });

  it('should reload current user after email verification succeeds', () => {
    testScheduler.run(({ hot, expectObservable }) => {
      actions$ = hot('-a', { a: AuthActions.verifyEmailSuccess({ message: 'Email verified' }) });

      expectObservable(effects.verifyEmailSuccess$).toBe('-b', { b: AuthActions.loadCurrentUser() });
    });
  });

  it('should navigate home when the auth session expires without dispatching', () => {
    testScheduler.run(({ hot, expectObservable, flush }) => {
      const action = AuthActions.authSessionExpired();
      actions$ = hot('-a-|', { a: action });

      expect(getEffectsMetadata(effects).authSessionExpired$?.dispatch).toBeFalse();
      expectObservable(effects.authSessionExpired$).toBe('-a-|', { a: action });
      flush();
      expect(router.navigate).toHaveBeenCalledOnceWith(['/']);
    });
  });
});
