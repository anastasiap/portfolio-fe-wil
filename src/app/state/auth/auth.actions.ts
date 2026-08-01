import { createAction, props } from '@ngrx/store';
import {
  Account,
  AccountEmailPreferences,
  AccountLegalConsentsDto,
  AuthError,
  CompleteRegistrationProps,
  CompleteSignupProps,
  Entitlements,
  LoginRequest,
  MySubscriptionState,
  PendingSignupData,
  User,
} from '../../services/auth/auth.types';
import {
  CreateCheckoutSessionDto,
  CreatePortalSessionRequestDto,
  CreateUpgradeCheckoutSessionRequest,
  ResubscribeResponseDto,
} from '../../services/api/dto/billing';

/**
 * Auth Actions
 */

// Login actions
export const login = createAction('[Auth] Login', props<{ credentials: LoginRequest }>());
export const loginSuccess = createAction('[Auth] Login Success', props<{ user: User; account?: Account; entitlements?: Entitlements }>());
export const loginFailure = createAction('[Auth] Login Failure', props<{ error: AuthError }>());

// Logout actions
export const logoutRequested = createAction('[Auth] Logout Requested');
export const logoutCompleted = createAction('[Auth] Logout Completed');

// Deprecated: Use logoutRequested instead
export const logout = createAction('[Auth] Logout');
export const logoutSuccess = createAction('[Auth] Logout Success');

// Clear error action
export const clearAuthError = createAction('[Auth] Clear Error');

// Initialize auth state (e.g., on app load, check if user is authenticated)
export const initializeAuth = createAction('[Auth] Initialize');

// Silent refresh actions (for restoring session on app bootstrap)
export const attemptSilentRefresh = createAction('[Auth] Attempt Silent Refresh');
export const silentRefreshSuccess = createAction('[Auth] Silent Refresh Success', props<{ accessToken: string }>());
export const silentRefreshFailure = createAction('[Auth] Silent Refresh Failure');
export const silentRefreshSkipped = createAction('[Auth] Silent Refresh Skipped');

// Load current user actions (for silent refresh or initialization)
export const loadCurrentUser = createAction('[Auth] Load Current User');
export const loadCurrentUserSuccess = createAction(
  '[Auth] Load Current User Success',
  props<{ user: User; account?: Account; entitlements?: Entitlements; subscription: MySubscriptionState }>()
);
export const loadCurrentUserFailure = createAction('[Auth] Load Current User Failure', props<{ error: AuthError }>());

// Subscription actions
export const loadMySubscription = createAction('[Auth] Load My Subscription');
export const loadMySubscriptionSuccess = createAction(
  '[Auth] Load My Subscription Success',
  props<{ subscription: MySubscriptionState }>()
);
export const loadMySubscriptionFailure = createAction('[Auth] Load My Subscription Failure', props<{ error: AuthError }>());

// Portal session actions
export const createPortalSession = createAction('[Auth] Create Portal Session', props<{ request: CreatePortalSessionRequestDto }>());
export const createPortalSessionSuccess = createAction('[Auth] Create Portal Session Success', props<{ url: string }>());
export const createPortalSessionFailure = createAction('[Auth] Create Portal Session Failure', props<{ error: AuthError }>());

// Upgrade checkout session actions
export const createUpgradeCheckoutSession = createAction(
  '[Auth] Create Upgrade Checkout Session',
  props<{ request: CreateUpgradeCheckoutSessionRequest }>()
);
export const createUpgradeCheckoutSessionSuccess = createAction(
  '[Auth] Create Upgrade Checkout Session Success',
  props<{ sessionUrl: string }>()
);
export const createUpgradeCheckoutSessionFailure = createAction(
  '[Auth] Create Upgrade Checkout Session Failure',
  props<{ error: string }>()
);

// Checkout session actions
export const createCheckoutSession = createAction('[Auth] Create Checkout Session', props<{ request: CreateCheckoutSessionDto }>());
export const createCheckoutSessionSuccess = createAction('[Auth] Create Checkout Session Success', props<{ sessionUrl: string }>());
export const createCheckoutSessionFailure = createAction('[Auth] Create Checkout Session Failure', props<{ error: AuthError }>());

// Authentication Actions
export const authSessionExpired = createAction('[Auth] Session Expired');

// Email preferences actions
export const updateAccountEmailPreferences = createAction(
  '[Auth] Update Account Email Preferences',
  props<{ patch: { marketingContent: boolean } }>()
);
export const updateAccountEmailPreferencesSuccess = createAction(
  '[Auth] Update Account Email Preferences Success',
  props<{ email: AccountEmailPreferences }>()
);
export const updateAccountEmailPreferencesFailure = createAction(
  '[Auth] Update Account Email Preferences Failure',
  props<{ error: AuthError }>()
);

// Legal consent actions
export const acceptLegalConsents = createAction('[Auth] Accept Legal Consents');
export const acceptLegalConsentsSuccess = createAction(
  '[Auth] Accept Legal Consents Success',
  props<{ legalConsents: AccountLegalConsentsDto }>()
);
export const acceptLegalConsentsFailure = createAction(
  '[Auth] Accept Legal Consents Failure',
  props<{ error: AuthError }>()
);

// Complete signup
export const loadPendingSignup = createAction('[Auth] Load Pending Signup', props<{ signupId: string }>());
export const loadPendingSignupSuccess = createAction(
  '[Auth] Load Pending Signup Success',
  props<{ signup: PendingSignupData }>()
);
export const loadPendingSignupFailure = createAction('[Auth] Load Pending Signup Failure', props<{ error: AuthError }>());
export const startPendingSignupPolling = createAction('[Auth] Start Pending Signup Polling', props<{ signupId: string }>());
export const pollPendingSignupSuccess = createAction(
  '[Auth] Poll Pending Signup Success',
  props<{ signup: PendingSignupData }>()
);
export const pollPendingSignupFailure = createAction('[Auth] Poll Pending Signup Failure', props<{ error: AuthError }>());
export const pendingSignupPollingTimedOut = createAction('[Auth] Pending Signup Polling Timed Out');
export const completeSignup = createAction('[Auth] Complete Signup', props<CompleteSignupProps>());
export const completeSignupSuccess = createAction('[Auth] Complete Signup Success');
export const completeSignupFailure = createAction('[Auth] Complete Signup Failure', props<{ error: AuthError }>());

// Complete free registration
export const completeRegistration = createAction('[Auth] Complete Registration', props<CompleteRegistrationProps>());
export const completeRegistrationSuccess = createAction('[Auth] Complete Registration Success');
export const completeRegistrationFailure = createAction('[Auth] Complete Registration Failure', props<{ error: AuthError }>());

// Password reset actions
export const requestPasswordReset = createAction('[Auth] Request Password Reset', props<{ email: string }>());
export const requestPasswordResetSuccess = createAction('[Auth] Request Password Reset Success');
export const requestPasswordResetFailure = createAction('[Auth] Request Password Reset Failure', props<{ error: AuthError }>());

// Resubscribe actions
export const resubscribe = createAction('[Auth] Resubscribe');
export const resubscribeSuccess = createAction('[Auth] Resubscribe Success', props<{ response: ResubscribeResponseDto }>());
export const resubscribeFailure = createAction('[Auth] Resubscribe Failure', props<{ error: AuthError }>());
export const clearPasswordResetState = createAction('[Auth] Clear Password Reset State');

export const resetPassword = createAction('[Auth]  Reset Password', props<{ newPassword: string; token: string | null }>());
export const resetPasswordSuccess = createAction('[Auth]  Reset Password Success');
export const resetPasswordFailure = createAction('[Auth]  Reset Password Failure', props<{ error: AuthError }>());

export const resendVerificationEmail = createAction('[Auth] Reset Verification Email');
export const resendVerificationEmailSuccess = createAction('[Auth] Reset Verification Email Success');
export const resendVerificationEmailFailure = createAction('[Auth] Reset Verification Email Failure', props<{ error: AuthError }>());

export const verifyEmail = createAction('[Auth] Verify Email', props<{ token: string }>());
export const verifyEmailSuccess = createAction('[Auth] Verify Email Success', props<{ message: string }>());
export const verifyEmailFailure = createAction('[Auth] Verify Email Failure', props<{ error: AuthError }>());
