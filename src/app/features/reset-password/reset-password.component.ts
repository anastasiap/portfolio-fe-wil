import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { filter, withLatestFrom } from 'rxjs';
import { CtaButtonComponent } from '../../ui/cta-button/cta-button.component';
import { ResetPasswordFormComponent } from './ui/reset-password-form/reset-password-form.component';
import { select, Store } from '@ngrx/store';
import { selectAuthActions, selectAuthError } from '../../state/auth/auth.selectors';
import * as AuthActions from '../../state/auth/auth.actions';
import { take } from 'rxjs/operators';
import { AuthModalData } from '../auth-modal/auth-modal.types';
import { AuthModalComponent } from '../auth-modal/auth-modal.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

type ResetPasswordState = 'loading' | 'form' | 'success' | 'invalid-token' | 'error';

/**
 * Reset Password page component.
 * Handles password reset via token from email link.
 */
@Component({
  selector: 'wil-reset-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    CtaButtonComponent,
    ResetPasswordFormComponent,
  ],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetPasswordComponent implements OnInit {
  private readonly store = inject(Store);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);

  public readonly currentState = signal<ResetPasswordState>('loading');

  public token: string | null = null;

  ngOnInit(): void {
    // Read token from query params
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.token = params.get('token');

      if (!this.token) {
        this.currentState.set('invalid-token');
      } else {
        this.currentState.set('form');
      }
    });

    this.store
      .pipe(
        select(selectAuthActions),
        filter(
          (action) => action?.type === AuthActions.resetPasswordSuccess.type || action?.type === AuthActions.resetPasswordFailure.type
        ),
        withLatestFrom(this.store.select(selectAuthError)),
        take(1)
      )
      .subscribe(([action, error]) => {
        if (action?.type === AuthActions.resetPasswordFailure.type) {
          // For 401/400 errors, assume token is invalid or expired
          if (error?.statusCode === 400 || error?.statusCode === 401) {
            this.currentState.set('invalid-token');
          } else {
            this.currentState.set('error');
          }
        } else if (action?.type === AuthActions.resetPasswordSuccess.type) {
          this.currentState.set('success');
        }
      });
  }

  public goToHome(): void {
    this.router.navigate(['/']);
  }

  public handleLogin(): void {
    const config: MatDialogConfig<AuthModalData> = {
      data: { initialView: 'login' },
      autoFocus: false, // Prevent weird focus jumps
      disableClose: false, // Allow ESC and backdrop click
      panelClass: 'modal-panel',
    };

    this.dialog.open(AuthModalComponent, config);
  }

  public requestNewLink(): void {
    const config: MatDialogConfig<AuthModalData> = {
      data: { initialView: 'forgotPassword' },
      width: '480px',
      maxWidth: '90vw',
      autoFocus: false, // Prevent weird focus jumps
      disableClose: false,
      panelClass: 'modal-panel',
    };

    this.dialog.open(AuthModalComponent, config);
  }
}
