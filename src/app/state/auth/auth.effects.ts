import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { concatMap, concatWith, defer, delay, EMPTY, interval, of, withLatestFrom } from 'rxjs';
import { catchError, map, switchMap, take, takeWhile, tap } from 'rxjs/operators';

import { AuthDataService } from '../../services/auth/auth-data.service';
import { AccountsDataService } from '../../services/accounts/accounts-data.service';
import { BillingApiService } from '../../services/api/billing-api.service';
import { NotificationService } from '../../services/notification.service';
import { TokenMemoryService } from '../../services/auth/token-memory.service';
import { ExternalRedirectService } from '../../services/external-redirect.service';
import * as AuthActions from './auth.actions';
import { Action, Store } from '@ngrx/store';
import { selectPlan } from './auth.selectors';
import { PERSONAL_HOME_ROUTE, PROFESSIONAL_HOME_ROUTE } from '../../../configs/routes.config';
import { mapEntitlements } from '../mappers/entitlements';
import { AuthError } from '../../services/auth/auth.types';
import { signupCompletionPollingConfig } from '../../features/user-profile/user-account.config';
import { environment } from '../../../environments/environment';

/**
 * Auth Effects
 * Handles side effects for authentication actions
 */
@Injectable()
export class AuthEffects {
  private readonly actions$ = inject(Actions);
  private readonly authDataService = inject(AuthDataService);
  private readonly accountsDataService = inject(AccountsDataService);
  private readonly billingApiService = inject(BillingApiService);
  private readonly notificationService = inject(NotificationService);
  private readonly tokenMemoryService = inject(TokenMemoryService);
  private readonly externalRedirectService = inject(ExternalRedirectService);
  private readonly router = inject(Router);
  private readonly store = inject(Store);

  /**
   * Initialize Auth Effect
   * Triggered on app bootstrap to attempt silent authentication restore
   */
  initializeAuth$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.initializeAuth),
      map(() => AuthActions.attemptSilentRefresh())
    )
  );

  /**
   * Silent Refresh Effect
   * Attempts to refresh access token using httpOnly refresh cookie
   * Used on app startup to restore user session without requiring
   *
   * IMPORTANT: Skips refresh if signupId query param exists (signup completion mode)
   */
  attemptSilentRefresh$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.attemptSilentRefresh),
      switchMap(() => {
        return this.authDataService.refresh().pipe(
          map((response) => {
            // Store new access token in memory
            this.tokenMemoryService.setAccessToken(response.accessToken);
            return AuthActions.silentRefreshSuccess({ accessToken: response.accessToken });
          }),
          catchError(() => {
            // Refresh failed - user remains logged out quietly
            // No error dispatched to avoid showing error messages on startup
            return of(AuthActions.silentRefreshFailure());
          })
        );
      })
    )
  );

  /**
   * After silent refresh succeeds, load current user data
   */
  silentRefreshSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.silentRefreshSuccess),
      delay(100),
      map(() => AuthActions.loadCurrentUser())
    )
  );

  // --- LOGIN: call backend, store token, dispatch loginSuccess/loginFailure
  login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.login),
      concatMap(({ credentials }) =>
        this.authDataService.login(credentials).pipe(
          map((response) => {
            this.tokenMemoryService.setAccessToken(response.tokens.accessToken);

            return AuthActions.loginSuccess({
              user: response.user,
              account: response.account,
              entitlements: response.entitlements,
            });
          }),
          catchError((error) => of(AuthActions.loginFailure({ error })))
        )
      )
    )
  );

  // normalise user state via /me after login
  afterLoginSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.loginSuccess),
      map(() => AuthActions.loadCurrentUser())
    )
  );

  // --- REROUTE after user is definitely known (login or silent refresh)
  rerouteAfterUserLoaded$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.loginSuccess),
        withLatestFrom(this.store.select(selectPlan)),
        tap(([, plan]) => {
          //if (plan !== 'personal' && plan !== 'professional') return;

          const target = plan === 'free' || plan === 'personal' ? PERSONAL_HOME_ROUTE : PROFESSIONAL_HOME_ROUTE;

          this.router.navigateByUrl(target, { replaceUrl: true });
        })
      ),
    { dispatch: false }
  );

  // --- LOGOUT reroute (your existing one is fine; I'd make it replaceUrl)
  logoutCompleted$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.logoutCompleted, AuthActions.logoutSuccess),
        tap(() => this.router.navigateByUrl('/', { replaceUrl: true }))
      ),
    { dispatch: false }
  );

  /**
   * Logout Effect
   * Clears token from memory, calls backend logout, and dispatches completion
   * Handles both new (logoutRequested) and legacy (logout) actions
   */
  logout$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.logoutRequested, AuthActions.logout),
      switchMap(() => {
        // Clear access token from memory immediately
        this.tokenMemoryService.clear();

        // Call backend to invalidate refresh cookie
        return this.authDataService.logout().pipe(
          map(() => AuthActions.logoutCompleted()),
          catchError(() => {
            // Backend logout failed, but we still complete local logout
            return of(AuthActions.logoutCompleted());
          })
        );
      })
    )
  );

  /**
   * Load Current User Effect
   * Fetches current authenticated user data from /auth/me
   * Used after token refresh or on app initialization
   */
  loadCurrentUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.loadCurrentUser),
      switchMap(() =>
        this.authDataService.me().pipe(
          map((response) => {
            const mappedEntitlements = mapEntitlements(response.subscription?.entitlements);
            return AuthActions.loadCurrentUserSuccess({
              user: response.user,
              account: response.account,
              entitlements: response.entitlements,
              subscription: { ...response.subscription, entitlementsLabels: mappedEntitlements },
            });
          }),
          catchError((error) => {
            // If 401, session expired - clear token and dispatch session expired
            if (error.statusCode === 401) {
              this.tokenMemoryService.clear();
              return of(AuthActions.authSessionExpired());
            }
            return of(AuthActions.loadCurrentUserFailure({ error }));
          })
        )
      )
    )
  );

  /**
   * Load My Subscription Effect
   * Loads the user's subscription data from the billing API
   */
  loadMySubscription$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.loadMySubscription),
      switchMap(() =>
        this.billingApiService.getMySubscription().pipe(
          map((subscription) => {
            const mappedEntitlements = mapEntitlements(subscription.entitlements);
            return AuthActions.loadMySubscriptionSuccess({ subscription: { ...subscription, entitlementsLabels: mappedEntitlements } });
          }),
          catchError((error) =>
            of(
              AuthActions.loadMySubscriptionFailure({
                error: {
                  message: error.message || 'Failed to load subscription data',
                  code: error.code,
                  statusCode: error.status,
                },
              })
            )
          )
        )
      )
    )
  );

  /**
   * Create Portal Session Effect
   * Creates Stripe portal session and redirects on success
   */
  createPortalSession$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.createPortalSession),
      switchMap(({ request }) =>
        this.billingApiService.createPortalSession(request).pipe(
          map((response) => AuthActions.createPortalSessionSuccess({ url: response.url })),
          catchError((error) => {
            // Show error toast
            const errorMessage =
              error.status === 409 || error.status === 400
                ? 'Unable to access billing portal. No active subscription found.'
                : 'Failed to access billing portal. Please try again.';

            this.notificationService.showError(errorMessage);

            return of(
              AuthActions.createPortalSessionFailure({
                error: {
                  message: errorMessage,
                  code: error.code,
                  statusCode: error.status,
                },
              })
            );
          })
        )
      )
    )
  );

  redirectToPortalSession$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.createPortalSessionSuccess),
        tap(({ url }) => this.externalRedirectService.redirect(url))
      ),
    { dispatch: false }
  );

  /**
   * Create Upgrade Checkout Session Effect
   * Creates Stripe checkout session for free-to-personal upgrades and redirects on success
   */
  createUpgradeCheckoutSession$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.createUpgradeCheckoutSession),
      switchMap(({ request }) =>
        this.billingApiService.createUpgradeCheckoutSession(request).pipe(
          take(1),
          map(({ sessionUrl }) => AuthActions.createUpgradeCheckoutSessionSuccess({ sessionUrl })),
          catchError((error) =>
            of(
              AuthActions.createUpgradeCheckoutSessionFailure({
                error: error?.message ?? 'Failed to start upgrade. Please try again.',
              })
            )
          )
        )
      )
    )
  );

  redirectToUpgradeCheckoutSession$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.createUpgradeCheckoutSessionSuccess),
        tap(({ sessionUrl }) => this.externalRedirectService.redirect(sessionUrl))
      ),
    { dispatch: false }
  );

  /**
   * Create Checkout Session Effect
   * Creates Stripe checkout session and redirects on success
   */
  createCheckoutSession$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.createCheckoutSession),
      switchMap(({ request }) =>
        this.billingApiService.createStripeCheckoutSession(request).pipe(
          map((response) => AuthActions.createCheckoutSessionSuccess({ sessionUrl: response.sessionUrl })),
          catchError((error) => {
            const errorMessage = 'Failed to start checkout. Please try again.';
            this.notificationService.showError(errorMessage);
            return of(
              AuthActions.createCheckoutSessionFailure({
                error: {
                  message: errorMessage,
                  code: error.code,
                  statusCode: error.status,
                },
              })
            );
          })
        )
      )
    )
  );

  redirectToCheckoutSession$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.createCheckoutSessionSuccess),
        tap(({ sessionUrl }) => this.externalRedirectService.redirect(sessionUrl))
      ),
    { dispatch: false }
  );

  /**
   * Update Email Preferences Effect
   * Handles updating user's email preferences via API
   */
  updateEmailPreferences$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.updateAccountEmailPreferences),
      switchMap(({ patch }) =>
        this.accountsDataService.updateMyEmailPreferences(patch).pipe(
          map((email) => {
            this.notificationService.showSuccess(`Email preferences saved.`);
            return AuthActions.updateAccountEmailPreferencesSuccess({ email });
          }),
          catchError((error) => {
            this.notificationService.showError(`Error saving email preferences. Please, try again`);
            return of(AuthActions.updateAccountEmailPreferencesFailure({ error }));
          })
        )
      )
    )
  );

  acceptLegalConsents$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.acceptLegalConsents),
      switchMap(() =>
        this.accountsDataService
          .acceptLegalConsents({
            termsAccepted: true,
            privacyAccepted: true,
            termsVersion: environment.legal.termsVersion,
            privacyVersion: environment.legal.privacyVersion,
          })
          .pipe(
            map((legalConsents) => AuthActions.acceptLegalConsentsSuccess({ legalConsents })),
            catchError((error: AuthError) => of(AuthActions.acceptLegalConsentsFailure({ error })))
          )
      )
    )
  );

  loadPendingSignup$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.loadPendingSignup),
      switchMap(({ signupId }) =>
        this.authDataService.getPendingSignup(signupId).pipe(
          concatMap((response) => {
            const signup = { ...response, signupId };
            const actions: Action[] = [AuthActions.loadPendingSignupSuccess({ signup })];

            if (response.status === 'initiated' || response.step === 'waiting_payment') {
              actions.push(AuthActions.startPendingSignupPolling({ signupId }));
            }

            return actions;
          }),
          catchError((error: AuthError) => of(AuthActions.loadPendingSignupFailure({ error })))
        )
      )
    )
  );

  pollPendingSignup$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.startPendingSignupPolling),
      switchMap(({ signupId }) => {
        let attempts = 0;
        let isPending = true;

        return interval(signupCompletionPollingConfig.intervalMs).pipe(
          take(signupCompletionPollingConfig.maxAttempts),
          switchMap(() => {
            attempts++;

            return this.authDataService.getPendingSignup(signupId).pipe(
              map((response) => {
                isPending = response.status === 'initiated' || response.step === 'waiting_payment';
                return AuthActions.pollPendingSignupSuccess({ signup: { ...response, signupId } });
              }),
              catchError((error: AuthError) => {
                isPending = false;
                return of(AuthActions.pollPendingSignupFailure({ error }));
              })
            );
          }),
          takeWhile(() => isPending, true),
          concatWith(
            defer(() =>
              isPending && attempts >= signupCompletionPollingConfig.maxAttempts ? of(AuthActions.pendingSignupPollingTimedOut()) : EMPTY
            )
          )
        );
      })
    )
  );

  completeSignup$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.completeSignup),
      switchMap((data) =>
        this.authDataService.completeSignup(data).pipe(
          map((response) => {
            this.tokenMemoryService.setAccessToken(response.accessToken);
            return AuthActions.completeSignupSuccess();
          }),
          catchError((error) => of(AuthActions.completeSignupFailure({ error })))
        )
      )
    )
  );

  completeRegistration$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.completeRegistration),
      switchMap(({ email, name, secondName, password, plan }) =>
        this.authDataService.register({ email, name, secondName, password, plan }).pipe(
          take(1),
          map((response) => {
            this.tokenMemoryService.setAccessToken(response.accessToken);
            return AuthActions.completeRegistrationSuccess();
          }),
          catchError((error: AuthError) => of(AuthActions.completeRegistrationFailure({ error })))
        )
      )
    )
  );

  completeSignupSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.updateAccountEmailPreferencesSuccess),
      map(() => AuthActions.loadCurrentUser())
    )
  );

  /**
   * Session Expired Effect
   * Redirects to login page when session expires
   */
  authSessionExpired$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.authSessionExpired),
        tap(() => {
          // Navigate to login page
          this.router.navigate(['/']);
        })
      ),
    { dispatch: false }
  );

  /**
   * Request Password Reset Effect
   * Handles password reset email requests
   */
  requestPasswordReset$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.requestPasswordReset),
      switchMap(({ email }) =>
        this.authDataService.requestPasswordReset(email).pipe(
          map(() => {
            this.notificationService.showSuccess("If an account exists, we'll send a reset link.");
            return AuthActions.requestPasswordResetSuccess();
          }),
          catchError((error) => {
            // Always show the same safe message for security (no user enumeration)
            if (error?.status === 0 || error?.status >= 500) {
              this.notificationService.showError('Network error. Please check your connection and try again.');
            } else {
              this.notificationService.showSuccess("If an account exists, we'll send a reset link.");
            }
            return of(AuthActions.requestPasswordResetFailure({ error }));
          })
        )
      )
    )
  );

  resetPassword$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.resetPassword),
      switchMap(({ newPassword, token }) => {
        if (token) {
          return this.authDataService.resetPasswordWithToken({ token, newPassword });
        }

        return this.authDataService.resetPassword(newPassword);
      }),
      map(() => {
        this.notificationService.showSuccess('Password reset success.');
        return AuthActions.resetPasswordSuccess();
      }),
      catchError((error) => {
        this.notificationService.showError('Failed to reset password.');
        return of(
          AuthActions.resetPasswordFailure({
            error: {
              statusCode: error.status,
              code: error.code,
              message: error.message,
            },
          })
        );
      })
    )
  );

  /**
   * Resubscribe Effect
   * Handles reactivating cancelled subscriptions
   */
  resubscribe$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.resubscribe),
      switchMap(() =>
        this.billingApiService.resubscribe().pipe(
          map((response) => {
            this.notificationService.showSuccess(response.message);
            return AuthActions.resubscribeSuccess({ response });
          }),
          catchError((error) => {
            const errorMessage = 'Failed to reactivate subscription. Please try again.';

            return of(
              AuthActions.resubscribeFailure({
                error: {
                  message: errorMessage,
                  code: error.code,
                  statusCode: error.status,
                },
              })
            );
          })
        )
      )
    )
  );

  /**
   * Resubscribe Success Effect
   * Updates subscription data and reloads current user after successful resubscription
   */
  resubscribeSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.resubscribeSuccess),
      map(() => AuthActions.loadCurrentUser())
    )
  );

  /**
   * Resend Verification Email Effect
   * Handles resending verification email for logged-in users
   */
  resendVerificationEmail$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.resendVerificationEmail),
      switchMap(() =>
        this.authDataService.sendVerificationEmail().pipe(
          map(() => {
            this.notificationService.showSuccess('Verification email sent successfully.');
            return AuthActions.resendVerificationEmailSuccess();
          }),
          catchError((error) => {
            this.notificationService.showError('Failed to send verification email.');
            return of(AuthActions.resendVerificationEmailFailure({ error }));
          })
        )
      )
    )
  );

  /**
   * Verify Email Effect
   * Handles email verification with token from verification link
   */
  verifyEmail$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.verifyEmail),
      switchMap(({ token }) =>
        this.authDataService.verifyEmail(token).pipe(
          map((response) => {
            this.notificationService.showSuccess('Email verified successfully!');
            return AuthActions.verifyEmailSuccess({ message: response.message });
          }),
          catchError((error) => {
            this.notificationService.showError('Failed to verify email');
            return of(
              AuthActions.verifyEmailFailure({
                error: {
                  statusCode: error.status,
                  code: error.code || 'VERIFICATION_ERROR',
                  message: error.message,
                },
              })
            );
          })
        )
      )
    )
  );

  /**
   * After successful email verification, refresh user data
   */
  verifyEmailSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.verifyEmailSuccess),
      map(() => AuthActions.loadCurrentUser())
    )
  );
}
