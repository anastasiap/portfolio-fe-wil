import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, Signal, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { select, Store } from '@ngrx/store';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs/operators';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

import { selectAuthActions, selectAuthError, selectIsAuthenticated } from '../../../../state/auth/auth.selectors';
import * as AuthActions from '../../../../state/auth/auth.actions';
import { CtaButtonComponent } from '../../../../ui/cta-button/cta-button.component';
import { withLatestFrom } from 'rxjs';
import { BASE, PERSONAL_HOME_ROUTE } from '../../../../../configs/routes.config';

type VerificationState = 'verifying' | 'success' | 'error' | 'warning';

interface VerificationViewModel {
  readonly state: VerificationState;
  readonly message: string;
}

const verificationErrorCodes: Record<string, VerificationState> = {
  EMAIL_VERIFICATION_TOKEN: 'error',
  EMAIL_VERIFICATION_TOKEN_USED: 'warning',
  EMAIL_VERIFICATION_TOKEN_EXPIRED: 'error',
  EMAIL_VERIFICATION_INVALID_EMAIL: 'error',
  EMAIL_VERIFICATION_INVALID_USER: 'error',
};

/**
 * Verify Email Component
 *
 * Handles email verification flow when user clicks verification link:
 * 1. Extracts token from URL query parameters
 * 2. Automatically sends verification request to backend
 * 3. Shows success/error states based on response
 * 4. Updates user data on success
 * 5. Provides re-send option on error
 */
@Component({
  selector: 'wil-verify-email',
  standalone: true,
  imports: [MatIcon, MatProgressSpinner, CtaButtonComponent],
  templateUrl: './verify-email.component.html',
  styleUrl: './verify-email.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerifyEmailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly store = inject(Store);
  private readonly destroyRef = inject(DestroyRef);

  // Route signals
  public readonly token: Signal<string | null> = toSignal(this.route.queryParamMap.pipe(map((params) => params.get('token'))), {
    initialValue: null,
  });
  public readonly isAuthenticated = toSignal(this.store.select(selectIsAuthenticated), { initialValue: false });

  public readonly verificationViewModel = signal<VerificationViewModel>({
    state: 'verifying',
    message: '',
  });

  ngOnInit(): void {
    const verificationToken = this.token()?.trim();

    if (!verificationToken) {
      this.handleMissingToken();
      return;
    }

    // Start email verification process
    this.verifyEmail(verificationToken);
    this.setupVerificationListeners();
  }

  /**
   * Start email verification with the provided token
   */
  private verifyEmail(token: string): void {
    this.store.dispatch(AuthActions.verifyEmail({ token }));
  }

  /**
   * Listen for verification results from the store
   */
  private setupVerificationListeners(): void {
    this.store
      .pipe(
        select(selectAuthActions),
        filter((action) => action !== null),
        withLatestFrom(this.store.select(selectAuthError)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: ([action, error]) => {
          if (action?.type === AuthActions.verifyEmailSuccess.type) {
            this.verificationViewModel.set({
              state: 'success',
              message: '',
            });
          } else if (action?.type === AuthActions.verifyEmailFailure.type) {
            const state = error?.code ? verificationErrorCodes[error.code] ?? 'error' : 'error';
            this.verificationViewModel.set({
              state,
              message: error?.message || 'Failed to verify email',
            });
          }
        },
      });
  }

  /**
   * Handle missing token scenario
   */
  private handleMissingToken(): void {
    this.verificationViewModel.set({
      state: 'error',
      message: 'Invalid verification link - missing token',
    });
  }

  /**
   * Handle resend verification email button click
   */
  public onResendVerification(): void {
    this.store.dispatch(AuthActions.resendVerificationEmail());
  }

  /**
   * Navigate to account profile page
   */
  public navigateToProfile(): void {
    this.router.navigate([`/${BASE}/account/profile`]);
  }

  /**
   * Navigate back to home
   */
  public navigateToHome(): void {
    this.router.navigate([`/${PERSONAL_HOME_ROUTE}`]);
  }
}
