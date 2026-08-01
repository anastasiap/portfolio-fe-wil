import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AuthState } from './auth.reducer';

const restrictedSubscriptionNavigationStatuses = ['cancelled', 'canceled', 'payment_issue'];

/**
 * Auth Selectors
 */

// Feature selector
export const selectAuthState = createFeatureSelector<AuthState>('auth');

// User selectors
export const selectUser = createSelector(selectAuthState, (state) => state.user);

export const selectUserId = createSelector(selectAuthState, (state) => state.user?.id);

// Account selectors
export const selectAccount = createSelector(selectAuthState, (state) => state.account);

export const selectAccountId = createSelector(selectAuthState, (state) => state.account?.id);

// Entitlements selectors
export const selectEntitlements = createSelector(selectAuthState, (state) => state.entitlements);

export const selectUserFeatures = createSelector(selectEntitlements, (entitlements) => entitlements?.features || []);

// Auth status selectors
export const selectIsAuthenticated = createSelector(selectAuthState, (state) => state.isAuthenticated);

export const selectAuthLoading = createSelector(selectAuthState, (state) => state.loading);

export const selectAuthError = createSelector(selectAuthState, (state) => state.error);

// Pending signup selectors
export const selectPendingSignupData = createSelector(selectAuthState, (state) => state.pendingSignupData);

export const selectPendingSignupState = createSelector(selectAuthState, (state) => state.pendingSignupState);

export const selectPendingSignupError = createSelector(selectAuthState, (state) => state.pendingSignupError);

export const selectPendingSignupPollingTimeout = createSelector(selectAuthState, (state) => state.pendingSignupPollingTimeout);

// Composite selectors
export const selectIsAuthenticatedAndVerified = createSelector(
  selectIsAuthenticated,
  selectUser,
  (isAuthenticated, user) => isAuthenticated && !!user?.emailVerified
);

// Subscription selectors
export const selectSubscription = createSelector(selectAuthState, (state) => state.subscription);

export const selectSubscriptionLoading = createSelector(selectAuthState, (state) => state.subscriptionLoading);

export const selectSubscriptionError = createSelector(selectAuthState, (state) => state.subscriptionError);

export const selectSubscriptionStatus = createSelector(selectSubscription, (subscription) => subscription?.status);

export const selectPlan = createSelector(selectSubscription, (subscription) => subscription?.planCode);

export const selectIsSubscriptionNavigationRestricted = createSelector(
  selectAuthLoading,
  selectIsAuthenticated,
  selectSubscriptionStatus,
  (loading, isAuthenticated, subscriptionStatus) =>
    !loading && isAuthenticated && !!subscriptionStatus && restrictedSubscriptionNavigationStatuses.includes(subscriptionStatus)
);

// Email preferences selectors
export const selectAccountEmailPreferences = createSelector(selectAccount, (account) => {
  // Normalize values: if undefined, return default false values
  const preferences = account?.preferences?.email;
  if (!preferences) {
    return {
      marketingContent: false,
    };
  }
  return preferences;
});

export const selectEmailPreferencesSaving = createSelector(selectAuthState, (state) => state.emailPreferencesSaving);

export const selectEmailPreferencesError = createSelector(selectAuthState, (state) => state.emailPreferencesError);

export const selectLegalConsentsSaving = createSelector(selectAuthState, (state) => state.legalConsentsSaving);

export const selectLegalConsentsError = createSelector(selectAuthState, (state) => state.legalConsentsError);

export const selectAuthActions = createSelector(selectAuthState, (state) => state.lastAction);

// Portal selectors
export const selectPortalLoading = createSelector(selectAuthState, (state) => state.portalLoading);

// Upgrade selectors
export const selectUpgradeLoading = createSelector(selectAuthState, (state) => state.upgradeLoading);

export const selectUpgradeError = createSelector(selectAuthState, (state) => state.upgradeError);

// Password reset selectors
export const selectPasswordResetLoading = createSelector(selectAuthState, (state) => state.passwordResetLoading);

export const selectPasswordResetSent = createSelector(selectAuthState, (state) => state.passwordResetSent);

// Resubscribe selectors
export const selectResubscribeLoading = createSelector(selectAuthState, (state) => state.resubscribeLoading);

export const selectResubscribeError = createSelector(selectAuthState, (state) => state.resubscribeError);
