import { Action, createReducer, on } from '@ngrx/store';
import {
  Account,
  AuthError,
  Entitlements,
  MySubscriptionState,
  PendingSignupData,
  SignupCompletionState,
  SubscriptionStatus,
  User,
} from '../../services/auth/auth.types';
import * as AuthActions from './auth.actions';

/**
 * Auth State Interface
 * Note: Access tokens are NOT stored in NgRx state for security reasons.
 * They are stored in TokenMemoryService instead.
 */
export interface AuthState {
  readonly user: User | null;
  readonly account: Account | null;
  readonly entitlements: Entitlements | null;
  readonly subscription: MySubscriptionState | null;
  readonly isAuthenticated: boolean;
  readonly loading: boolean;
  readonly subscriptionLoading: boolean;
  readonly portalLoading: boolean;
  readonly upgradeLoading: boolean;
  readonly passwordResetLoading: boolean;
  readonly passwordResetSent: boolean;
  readonly resubscribeLoading: boolean;
  readonly error: AuthError | null;
  readonly subscriptionError: AuthError | null;
  readonly portalError: AuthError | null;
  readonly upgradeError: string | null;
  readonly passwordResetError: AuthError | null;
  readonly resubscribeError: AuthError | null;
  readonly emailPreferencesSaving: boolean;
  readonly emailPreferencesError: AuthError | null;
  readonly legalConsentsSaving: boolean;
  readonly legalConsentsError: AuthError | null;
  readonly pendingSignupData: PendingSignupData | null;
  readonly pendingSignupState: SignupCompletionState;
  readonly pendingSignupError: string | null;
  readonly pendingSignupPollingTimeout: boolean;
  readonly lastAction?: Action;
}

/**
 * Initial auth state
 */
export const initialAuthState: AuthState = {
  user: null,
  account: null,
  entitlements: null,
  subscription: null,
  isAuthenticated: false,
  loading: false,
  subscriptionLoading: false,
  portalLoading: false,
  upgradeLoading: false,
  passwordResetLoading: false,
  passwordResetSent: false,
  resubscribeLoading: false,
  error: null,
  subscriptionError: null,
  portalError: null,
  upgradeError: null,
  passwordResetError: null,
  resubscribeError: null,
  emailPreferencesSaving: false,
  emailPreferencesError: null,
  legalConsentsSaving: false,
  legalConsentsError: null,
  pendingSignupData: null,
  pendingSignupState: 'loading',
  pendingSignupError: null,
  pendingSignupPollingTimeout: false,
};

const getPendingSignupStateFromStep = (step: PendingSignupData['step']): SignupCompletionState => {
  switch (step) {
    case 'create_password':
      return 'ready_to_complete';
    case 'waiting_payment':
      return 'waiting_payment';
    case 'already_completed':
      return 'already_completed';
    case 'canceled':
      return 'canceled';
  }
};

const getSubscriptionStateStatus = (status: SubscriptionStatus): MySubscriptionState['status'] => {
  if (status === 'past_due' || status === 'unpaid') return 'payment_issue';
  return status;
};

/**
 * Auth Reducer
 */
export const authReducer = createReducer(
  initialAuthState,

  // Login
  on(AuthActions.login, AuthActions.resetPassword, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(AuthActions.loginSuccess, (state, { user, account, entitlements }) => ({
    ...state,
    user,
    account: account || null,
    entitlements: entitlements || null,
    isAuthenticated: true,
    loading: false,
    error: null,
  })),

  on(AuthActions.loginFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
    isAuthenticated: false,
  })),

  // Logout
  on(AuthActions.logoutRequested, AuthActions.logout, (state) => ({
    ...state,
    loading: true,
    error: null, // Clear any errors on logout
  })),

  on(AuthActions.logoutCompleted, AuthActions.logoutSuccess, () => ({
    ...initialAuthState,
    loading: false,
  })),

  // Clear error
  on(AuthActions.clearAuthError, (state) => ({
    ...state,
    error: null,
  })),

  // Initialize
  on(AuthActions.initializeAuth, (state) => ({
    ...state,
    loading: true,
  })),

  // Silent refresh (on app bootstrap)
  on(AuthActions.attemptSilentRefresh, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(AuthActions.silentRefreshSuccess, (state) => ({
    ...state,
    loading: true, // Still loading until user data is fetched
  })),

  on(AuthActions.silentRefreshFailure, (state) => ({
    ...state,
    loading: false,
    // Remain logged out, no error shown
  })),

  // Silent Refresh Skipped (signup completion mode)
  on(AuthActions.silentRefreshSkipped, (state) => ({
    ...state,
    loading: false,
    // Keep user loggedout during signup completion
  })),

  // Load current user (after refresh or on app init)
  on(AuthActions.loadCurrentUser, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(AuthActions.loadCurrentUserSuccess, (state, { user, account, entitlements, subscription }) => ({
    ...state,
    user,
    account: account || null,
    entitlements: entitlements || null,
    subscription: subscription || null,
    isAuthenticated: true,
    loading: false,
    error: null,
    lastAction: { type: AuthActions.loadCurrentUserSuccess.type, timestamp: Date.now() },
  })),

  on(AuthActions.loadCurrentUserFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
    isAuthenticated: false,
    user: null,
    account: null,
    entitlements: null,
    lastAction: { type: AuthActions.loadCurrentUserFailure.type, error, timestamp: Date.now() },
  })),

  on(AuthActions.completeSignupFailure, AuthActions.completeRegistrationFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
    isAuthenticated: false,
    user: null,
    account: null,
    entitlements: null,
  })),

  on(AuthActions.loadPendingSignup, (state) => ({
    ...state,
    pendingSignupData: null,
    pendingSignupState: 'loading' as SignupCompletionState,
    pendingSignupError: null,
    pendingSignupPollingTimeout: false,
  })),

  on(AuthActions.loadPendingSignupSuccess, AuthActions.pollPendingSignupSuccess, (state, { signup }) => ({
    ...state,
    pendingSignupData: signup,
    pendingSignupState: signup.status === 'completed' ? 'already_completed' : getPendingSignupStateFromStep(signup.step),
    pendingSignupError: null,
    pendingSignupPollingTimeout: false,
  })),

  on(AuthActions.loadPendingSignupFailure, (state, { error }) => ({
    ...state,
    pendingSignupData: null,
    pendingSignupState: error.statusCode === 404 ? ('not_found' as SignupCompletionState) : ('error' as SignupCompletionState),
    pendingSignupError: error.statusCode === 404 ? 'Signup not found' : error.message || 'An error occurred while loading signup status',
    pendingSignupPollingTimeout: false,
  })),

  on(AuthActions.pollPendingSignupFailure, (state, { error }) => ({
    ...state,
    pendingSignupState: 'error' as SignupCompletionState,
    pendingSignupError: error.message || 'An error occurred while checking signup status',
    pendingSignupPollingTimeout: false,
  })),

  on(AuthActions.pendingSignupPollingTimedOut, (state) => ({
    ...state,
    pendingSignupPollingTimeout: true,
  })),

  // Subscription actions
  on(AuthActions.loadMySubscription, (state) => ({
    ...state,
    subscriptionLoading: true,
    subscriptionError: null,
  })),

  on(AuthActions.loadMySubscriptionSuccess, (state, { subscription }) => ({
    ...state,
    subscription,
    subscriptionLoading: false,
    subscriptionError: null,
  })),

  on(AuthActions.loadMySubscriptionFailure, (state, { error }) => ({
    ...state,
    subscriptionLoading: false,
    subscriptionError: error,
  })),

  // Portal session
  on(AuthActions.createPortalSession, (state) => ({
    ...state,
    portalLoading: true,
    portalError: null,
  })),

  on(AuthActions.createPortalSessionSuccess, (state) => ({
    ...state,
    portalLoading: false,
    portalError: null,
  })),

  on(AuthActions.createPortalSessionFailure, (state, { error }) => ({
    ...state,
    portalLoading: false,
    portalError: error,
  })),

  // Upgrade checkout session
  on(AuthActions.createUpgradeCheckoutSession, (state) => ({
    ...state,
    upgradeLoading: true,
    upgradeError: null,
  })),

  on(AuthActions.createUpgradeCheckoutSessionSuccess, (state) => ({
    ...state,
    upgradeLoading: false,
  })),

  on(AuthActions.createUpgradeCheckoutSessionFailure, (state, { error }) => ({
    ...state,
    upgradeLoading: false,
    upgradeError: error,
  })),

  // Session expired - reset to initial state
  on(AuthActions.authSessionExpired, () => ({
    ...initialAuthState,
  })),

  // Email preferences actions
  on(AuthActions.updateAccountEmailPreferences, (state) => ({
    ...state,
    emailPreferencesSaving: true,
    emailPreferencesError: null,
  })),

  on(AuthActions.updateAccountEmailPreferencesSuccess, (state, { email }) => ({
    ...state,
    account: state.account
      ? {
          ...state.account,
          preferences: {
            ...state.account.preferences,
            email,
          },
        }
      : null,
    emailPreferencesSaving: false,
    emailPreferencesError: null,
    lastAction: {
      type: AuthActions.updateAccountEmailPreferencesSuccess.type,
      timestamp: Date.now(),
      payload: { email },
    },
  })),

  on(AuthActions.updateAccountEmailPreferencesFailure, (state, { error }) => ({
    ...state,
    emailPreferencesSaving: false,
    emailPreferencesError: error,
  })),

  // Legal consent actions
  on(AuthActions.acceptLegalConsents, (state) => ({
    ...state,
    legalConsentsSaving: true,
    legalConsentsError: null,
  })),

  on(AuthActions.acceptLegalConsentsSuccess, (state, { legalConsents }) => ({
    ...state,
    account: state.account
      ? {
          ...state.account,
          legalConsents,
        }
      : null,
    legalConsentsSaving: false,
    legalConsentsError: null,
    lastAction: {
      type: AuthActions.acceptLegalConsentsSuccess.type,
      timestamp: Date.now(),
      payload: { legalConsents },
    },
  })),

  on(AuthActions.acceptLegalConsentsFailure, (state, { error }) => ({
    ...state,
    legalConsentsSaving: false,
    legalConsentsError: error,
    lastAction: { type: AuthActions.acceptLegalConsentsFailure.type, error, timestamp: Date.now() },
  })),

  // Add to reducer for both success and failure actions
  on(AuthActions.completeSignupSuccess, (state) => ({
    ...state,
    loading: false,
    lastAction: { type: AuthActions.completeSignupSuccess.type, timestamp: Date.now() },
  })),

  on(AuthActions.completeSignupFailure, (state, { error }) => ({
    ...state,
    loading: false,
    lastAction: { type: AuthActions.completeSignupFailure.type, error, timestamp: Date.now() },
  })),

  on(AuthActions.completeRegistrationSuccess, (state) => ({
    ...state,
    loading: false,
    lastAction: { type: AuthActions.completeRegistrationSuccess.type, timestamp: Date.now() },
  })),

  on(AuthActions.completeRegistrationFailure, (state, { error }) => ({
    ...state,
    loading: false,
    lastAction: { type: AuthActions.completeRegistrationFailure.type, error, timestamp: Date.now() },
  })),

  on(AuthActions.resetPasswordSuccess, (state) => ({
    ...state,
    loading: false,
    error: null,
    lastAction: { type: AuthActions.resetPasswordSuccess.type, timestamp: Date.now() },
  })),

  on(AuthActions.resetPasswordFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
    lastAction: { type: AuthActions.resetPasswordFailure.type, timestamp: Date.now() },
  })),

  // Password reset actions
  on(AuthActions.requestPasswordReset, (state) => ({
    ...state,
    passwordResetLoading: true,
    passwordResetError: null,
    passwordResetSent: false,
  })),

  on(AuthActions.requestPasswordResetSuccess, (state) => ({
    ...state,
    passwordResetLoading: false,
    passwordResetSent: true,
    passwordResetError: null,
  })),

  on(AuthActions.requestPasswordResetFailure, (state, { error }) => ({
    ...state,
    passwordResetLoading: false,
    passwordResetSent: true, // Still show sent state for security (no user enumeration)
    passwordResetError: error,
  })),

  on(AuthActions.clearPasswordResetState, (state) => ({
    ...state,
    passwordResetLoading: false,
    passwordResetSent: false,
    passwordResetError: null,
  })),

  // Resubscribe actions
  on(AuthActions.resubscribe, (state) => ({
    ...state,
    resubscribeLoading: true,
    resubscribeError: null,
  })),

  on(AuthActions.resubscribeSuccess, (state, { response }) => ({
    ...state,
    resubscribeLoading: false,
    resubscribeError: null,
    // Update subscription status from response
    subscription: state.subscription
      ? {
          ...state.subscription,
          status: getSubscriptionStateStatus(response.subscriptionStatus),
          currentPeriodEnd: response.renewsAt,
        }
      : null,
  })),

  on(AuthActions.resubscribeFailure, (state, { error }) => ({
    ...state,
    resubscribeLoading: false,
    resubscribeError: error,
  })),

  on(AuthActions.verifyEmailSuccess, (state) => ({
    ...state,
    loading: false,
    error: null,
    lastAction: { type: AuthActions.verifyEmailSuccess.type, timestamp: Date.now() },
  })),

  on(AuthActions.verifyEmailFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
    lastAction: { type: AuthActions.verifyEmailFailure.type, timestamp: Date.now() },
  }))
);
