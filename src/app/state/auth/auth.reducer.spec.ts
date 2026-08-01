import {
  Account,
  AccountEmailPreferences,
  AccountLegalConsentsDto,
  AuthError,
  Entitlements,
  MySubscriptionState,
  PendingSignupData,
  User,
} from '../../services/auth/auth.types';
import * as AuthActions from './auth.actions';
import { AuthState, authReducer, initialAuthState } from './auth.reducer';

describe('authReducer', () => {
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

  const createSubscription = (overrides: Partial<MySubscriptionState> = {}): MySubscriptionState => ({
    planCode: 'personal',
    planLabel: 'Personal',
    status: 'active',
    billingInterval: 'month',
    currency: 'EUR',
    priceCents: 900,
    currentPeriodEnd: '2026-02-01T00:00:00.000Z',
    cancelAtPeriodEnd: false,
    entitlements: [],
    entitlementsLabels: [],
    source: 'stripe',
    ...overrides,
  });

  const createError = (overrides: Partial<AuthError> = {}): AuthError => ({
    message: 'Something went wrong',
    ...overrides,
  });

  const createPendingSignup = (overrides: Partial<PendingSignupData> = {}): PendingSignupData => ({
    status: 'paid' as const,
    step: 'create_password' as const,
    plan: 'personal' as const,
    email: 'signup@example.com',
    signupId: 'signup-1',
    ...overrides,
  });

  const createAuthenticatedState = (overrides: Partial<AuthState> = {}): AuthState => ({
    ...initialAuthState,
    user: createUser(),
    account: createAccount(),
    entitlements: createEntitlements(),
    subscription: createSubscription(),
    isAuthenticated: true,
    ...overrides,
  });

  it('should return the initial state for an unknown action', () => {
    const result = authReducer(undefined, { type: '[Test] Unknown' });

    expect(result).toEqual(initialAuthState);
  });

  it('should set loading and clear errors on login and reset password requests', () => {
    const state = createAuthenticatedState({ loading: false, error: createError() });

    const loginResult = authReducer(state, AuthActions.login({ credentials: { email: 'test@example.com', password: 'password' } }));
    const resetPasswordResult = authReducer(
      state,
      AuthActions.resetPassword({ newPassword: 'new-password', token: 'reset-token' })
    );

    expect(loginResult.loading).toBeTrue();
    expect(loginResult.error).toBeNull();
    expect(resetPasswordResult.loading).toBeTrue();
    expect(resetPasswordResult.error).toBeNull();
  });

  it('should store authenticated user data on login success and clear it on login failure', () => {
    const user = createUser();
    const account = createAccount();
    const entitlements = createEntitlements();
    const error = createError({ message: 'Invalid credentials' });

    const successResult = authReducer(initialAuthState, AuthActions.loginSuccess({ user, account, entitlements }));
    const failureResult = authReducer(successResult, AuthActions.loginFailure({ error }));

    expect(successResult).toEqual({
      ...initialAuthState,
      user,
      account,
      entitlements,
      isAuthenticated: true,
      loading: false,
      error: null,
    });
    expect(failureResult.loading).toBeFalse();
    expect(failureResult.error).toBe(error);
    expect(failureResult.isAuthenticated).toBeFalse();
  });

  it('should reset auth state after logout completes or a session expires', () => {
    const state = createAuthenticatedState({ loading: true, error: createError() });

    const logoutRequestedResult = authReducer(state, AuthActions.logoutRequested());
    const logoutCompletedResult = authReducer(state, AuthActions.logoutCompleted());
    const sessionExpiredResult = authReducer(state, AuthActions.authSessionExpired());

    expect(logoutRequestedResult.loading).toBeTrue();
    expect(logoutRequestedResult.error).toBeNull();
    expect(logoutCompletedResult).toEqual(initialAuthState);
    expect(sessionExpiredResult).toEqual(initialAuthState);
  });

  it('should update current user state and record last action on load current user success', () => {
    const user = createUser({ id: 'loaded-user' });
    const account = createAccount({ id: 'loaded-account' });
    const entitlements = createEntitlements({ features: ['branding'] });
    const subscription = createSubscription({ planCode: 'professional' });

    const result = authReducer(
      initialAuthState,
      AuthActions.loadCurrentUserSuccess({ user, account, entitlements, subscription })
    );
    const lastAction = result.lastAction as { type: string; timestamp?: unknown };

    expect(result.user).toBe(user);
    expect(result.account).toBe(account);
    expect(result.entitlements).toBe(entitlements);
    expect(result.subscription).toBe(subscription);
    expect(result.isAuthenticated).toBeTrue();
    expect(result.loading).toBeFalse();
    expect(lastAction.type).toBe(AuthActions.loadCurrentUserSuccess.type);
    expect(lastAction.timestamp).toEqual(jasmine.any(Number));
  });

  it('should clear current user state and record last action on load current user failure', () => {
    const error = createError({ message: 'Unauthorized' });

    const result = authReducer(createAuthenticatedState({ loading: true }), AuthActions.loadCurrentUserFailure({ error }));
    const lastAction = result.lastAction as { type: string; error?: AuthError; timestamp?: unknown };

    expect(result.loading).toBeFalse();
    expect(result.error).toBe(error);
    expect(result.isAuthenticated).toBeFalse();
    expect(result.user).toBeNull();
    expect(result.account).toBeNull();
    expect(result.entitlements).toBeNull();
    expect(lastAction.type).toBe(AuthActions.loadCurrentUserFailure.type);
    expect(lastAction.error).toBe(error);
    expect(lastAction.timestamp).toEqual(jasmine.any(Number));
  });

  it('should update subscription loading, success, and failure states', () => {
    const subscription = createSubscription({ planCode: 'professional' });
    const error = createError({ message: 'Subscription failed' });

    const loadingResult = authReducer(initialAuthState, AuthActions.loadMySubscription());
    const successResult = authReducer(loadingResult, AuthActions.loadMySubscriptionSuccess({ subscription }));
    const failureResult = authReducer(loadingResult, AuthActions.loadMySubscriptionFailure({ error }));

    expect(loadingResult.subscriptionLoading).toBeTrue();
    expect(loadingResult.subscriptionError).toBeNull();
    expect(successResult.subscription).toBe(subscription);
    expect(successResult.subscriptionLoading).toBeFalse();
    expect(successResult.subscriptionError).toBeNull();
    expect(failureResult.subscriptionLoading).toBeFalse();
    expect(failureResult.subscriptionError).toBe(error);
  });

  it('should update portal and upgrade checkout loading and error states', () => {
    const portalError = createError({ message: 'Portal failed' });

    const portalLoading = authReducer(initialAuthState, AuthActions.createPortalSession({ request: { returnUrl: '/' } }));
    const portalFailure = authReducer(portalLoading, AuthActions.createPortalSessionFailure({ error: portalError }));
    const upgradeLoading = authReducer(
      initialAuthState,
      AuthActions.createUpgradeCheckoutSession({
        request: {
          targetPlan: 'personal',
          successUrl: '/success',
          cancelUrl: '/cancel',
        },
      })
    );
    const upgradeFailure = authReducer(upgradeLoading, AuthActions.createUpgradeCheckoutSessionFailure({ error: 'Upgrade failed' }));

    expect(portalLoading.portalLoading).toBeTrue();
    expect(portalLoading.portalError).toBeNull();
    expect(portalFailure.portalLoading).toBeFalse();
    expect(portalFailure.portalError).toBe(portalError);
    expect(upgradeLoading.upgradeLoading).toBeTrue();
    expect(upgradeLoading.upgradeError).toBeNull();
    expect(upgradeFailure.upgradeLoading).toBeFalse();
    expect(upgradeFailure.upgradeError).toBe('Upgrade failed');
  });

  it('should update account email preferences and record last action on success', () => {
    const email: AccountEmailPreferences = {
      productUpdates: true,
      educationalContent: false,
      marketingContent: true,
      updatedAt: '2026-01-10T00:00:00.000Z',
    };

    const savingResult = authReducer(
      createAuthenticatedState(),
      AuthActions.updateAccountEmailPreferences({ patch: { marketingContent: true } })
    );
    const successResult = authReducer(savingResult, AuthActions.updateAccountEmailPreferencesSuccess({ email }));
    const lastAction = successResult.lastAction as {
      type: string;
      timestamp?: unknown;
      payload?: { email: AccountEmailPreferences };
    };

    expect(savingResult.emailPreferencesSaving).toBeTrue();
    expect(savingResult.emailPreferencesError).toBeNull();
    expect(successResult.account?.preferences?.email).toBe(email);
    expect(successResult.emailPreferencesSaving).toBeFalse();
    expect(successResult.emailPreferencesError).toBeNull();
    expect(lastAction.type).toBe(AuthActions.updateAccountEmailPreferencesSuccess.type);
    expect(lastAction.timestamp).toEqual(jasmine.any(Number));
    expect(lastAction.payload).toEqual({ email });
  });

  it('should store email preferences errors and keep account null when success has no account', () => {
    const error = createError({ message: 'Preferences failed' });
    const email: AccountEmailPreferences = {
      productUpdates: false,
      educationalContent: false,
      marketingContent: false,
    };

    const failureResult = authReducer(
      initialAuthState,
      AuthActions.updateAccountEmailPreferencesFailure({ error })
    );
    const successWithoutAccount = authReducer(
      initialAuthState,
      AuthActions.updateAccountEmailPreferencesSuccess({ email })
    );

    expect(failureResult.emailPreferencesSaving).toBeFalse();
    expect(failureResult.emailPreferencesError).toBe(error);
    expect(successWithoutAccount.account).toBeNull();
    expect(successWithoutAccount.emailPreferencesSaving).toBeFalse();
  });

  it('should update legal consent state and account data on success', () => {
    const legalConsents: AccountLegalConsentsDto = {
      termsAccepted: true,
      privacyAccepted: true,
      termsVersion: 'terms-v1',
      privacyVersion: 'privacy-v1',
      acceptedAt: new Date('2026-01-10T00:00:00.000Z'),
    };

    const savingResult = authReducer(createAuthenticatedState(), AuthActions.acceptLegalConsents());
    const successResult = authReducer(savingResult, AuthActions.acceptLegalConsentsSuccess({ legalConsents }));
    const lastAction = successResult.lastAction as {
      type: string;
      timestamp?: unknown;
      payload?: { legalConsents: AccountLegalConsentsDto };
    };

    expect(savingResult.legalConsentsSaving).toBeTrue();
    expect(savingResult.legalConsentsError).toBeNull();
    expect(successResult.account?.legalConsents).toBe(legalConsents);
    expect(successResult.legalConsentsSaving).toBeFalse();
    expect(successResult.legalConsentsError).toBeNull();
    expect(lastAction.type).toBe(AuthActions.acceptLegalConsentsSuccess.type);
    expect(lastAction.timestamp).toEqual(jasmine.any(Number));
    expect(lastAction.payload).toEqual({ legalConsents });
  });

  it('should store legal consent errors and keep account null when success has no account', () => {
    const error = createError({ message: 'Consent failed' });
    const legalConsents: AccountLegalConsentsDto = {
      termsAccepted: true,
      privacyAccepted: true,
      termsVersion: 'terms-v1',
      privacyVersion: 'privacy-v1',
      acceptedAt: new Date('2026-01-10T00:00:00.000Z'),
    };

    const failureResult = authReducer(initialAuthState, AuthActions.acceptLegalConsentsFailure({ error }));
    const successWithoutAccount = authReducer(initialAuthState, AuthActions.acceptLegalConsentsSuccess({ legalConsents }));

    expect(failureResult.legalConsentsSaving).toBeFalse();
    expect(failureResult.legalConsentsError).toBe(error);
    expect(successWithoutAccount.account).toBeNull();
    expect(successWithoutAccount.legalConsentsSaving).toBeFalse();
  });

  it('should update pending signup state for load success, failures, polling, and timeout', () => {
    const signup = createPendingSignup();
    const notFoundError = createError({ statusCode: 404 });
    const serverError = createError({ message: 'Backend unavailable', statusCode: 500 });

    const loadingResult = authReducer(
      createAuthenticatedState({
        pendingSignupData: createPendingSignup({ signupId: 'old-signup' }),
        pendingSignupState: 'waiting_payment',
        pendingSignupError: 'Old error',
        pendingSignupPollingTimeout: true,
      }),
      AuthActions.loadPendingSignup({ signupId: signup.signupId })
    );
    const successResult = authReducer(loadingResult, AuthActions.loadPendingSignupSuccess({ signup }));
    const waitingResult = authReducer(
      successResult,
      AuthActions.pollPendingSignupSuccess({ signup: createPendingSignup({ step: 'waiting_payment', status: 'initiated' }) })
    );
    const timeoutResult = authReducer(waitingResult, AuthActions.pendingSignupPollingTimedOut());
    const notFoundResult = authReducer(initialAuthState, AuthActions.loadPendingSignupFailure({ error: notFoundError }));
    const pollingFailureResult = authReducer(initialAuthState, AuthActions.pollPendingSignupFailure({ error: serverError }));

    expect(loadingResult.pendingSignupData).toBeNull();
    expect(loadingResult.pendingSignupState).toBe('loading');
    expect(loadingResult.pendingSignupError).toBeNull();
    expect(loadingResult.pendingSignupPollingTimeout).toBeFalse();
    expect(successResult.pendingSignupData).toBe(signup);
    expect(successResult.pendingSignupState).toBe('ready_to_complete');
    expect(waitingResult.pendingSignupState).toBe('waiting_payment');
    expect(timeoutResult.pendingSignupPollingTimeout).toBeTrue();
    expect(notFoundResult.pendingSignupState).toBe('not_found');
    expect(notFoundResult.pendingSignupError).toBe('Signup not found');
    expect(pollingFailureResult.pendingSignupState).toBe('error');
    expect(pollingFailureResult.pendingSignupError).toBe('Backend unavailable');
  });

  it('should record completion action metadata for signup, registration, reset password, and email verification', () => {
    const error = createError({ message: 'Failed action' });

    const signupSuccess = authReducer(initialAuthState, AuthActions.completeSignupSuccess());
    const registrationFailure = authReducer(initialAuthState, AuthActions.completeRegistrationFailure({ error }));
    const resetPasswordFailure = authReducer(initialAuthState, AuthActions.resetPasswordFailure({ error }));
    const verifyEmailSuccess = authReducer(initialAuthState, AuthActions.verifyEmailSuccess({ message: 'Verified' }));

    expect((signupSuccess.lastAction as { type: string }).type).toBe(AuthActions.completeSignupSuccess.type);
    expect((registrationFailure.lastAction as { type: string; error?: AuthError }).error).toBe(error);
    expect((resetPasswordFailure.lastAction as { type: string; timestamp?: unknown }).type).toBe(
      AuthActions.resetPasswordFailure.type
    );
    expect((verifyEmailSuccess.lastAction as { type: string; timestamp?: unknown }).timestamp).toEqual(jasmine.any(Number));
    expect(registrationFailure.loading).toBeFalse();
    expect(resetPasswordFailure.error).toBe(error);
    expect(verifyEmailSuccess.error).toBeNull();
  });

  it('should update password reset request state', () => {
    const error = createError({ message: 'Reset failed' });

    const loadingResult = authReducer(initialAuthState, AuthActions.requestPasswordReset({ email: 'test@example.com' }));
    const successResult = authReducer(loadingResult, AuthActions.requestPasswordResetSuccess());
    const failureResult = authReducer(loadingResult, AuthActions.requestPasswordResetFailure({ error }));
    const clearedResult = authReducer(failureResult, AuthActions.clearPasswordResetState());

    expect(loadingResult.passwordResetLoading).toBeTrue();
    expect(loadingResult.passwordResetSent).toBeFalse();
    expect(loadingResult.passwordResetError).toBeNull();
    expect(successResult.passwordResetLoading).toBeFalse();
    expect(successResult.passwordResetSent).toBeTrue();
    expect(successResult.passwordResetError).toBeNull();
    expect(failureResult.passwordResetLoading).toBeFalse();
    expect(failureResult.passwordResetSent).toBeTrue();
    expect(failureResult.passwordResetError).toBe(error);
    expect(clearedResult.passwordResetLoading).toBeFalse();
    expect(clearedResult.passwordResetSent).toBeFalse();
    expect(clearedResult.passwordResetError).toBeNull();
  });

  it('should update subscription after successful resubscribe and store failure errors', () => {
    const subscription = createSubscription({ status: 'canceled', currentPeriodEnd: null });
    const error = createError({ message: 'Resubscribe failed' });

    const loadingResult = authReducer(createAuthenticatedState({ subscription }), AuthActions.resubscribe());
    const successResult = authReducer(
      loadingResult,
      AuthActions.resubscribeSuccess({
        response: {
          success: true,
          message: 'Resubscribed',
          subscriptionStatus: 'active',
          renewsAt: '2026-03-01T00:00:00.000Z',
        },
      })
    );
    const failureResult = authReducer(loadingResult, AuthActions.resubscribeFailure({ error }));

    expect(loadingResult.resubscribeLoading).toBeTrue();
    expect(loadingResult.resubscribeError).toBeNull();
    expect(successResult.resubscribeLoading).toBeFalse();
    expect(successResult.resubscribeError).toBeNull();
    expect(successResult.subscription?.status).toBe('active');
    expect(successResult.subscription?.currentPeriodEnd).toBe('2026-03-01T00:00:00.000Z');
    expect(failureResult.resubscribeLoading).toBeFalse();
    expect(failureResult.resubscribeError).toBe(error);
  });

  it('should clear auth errors without changing other auth data', () => {
    const state = createAuthenticatedState({ error: createError() });

    const result = authReducer(state, AuthActions.clearAuthError());

    expect(result.error).toBeNull();
    expect(result.user).toBe(state.user);
    expect(result.account).toBe(state.account);
    expect(result.isAuthenticated).toBeTrue();
  });
});
