import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnDestroy, OnInit, output, signal } from '@angular/core';

import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Store } from '@ngrx/store';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs/operators';

import { AuthModalView } from '../auth-modal.types';
import { AuthModalComponent } from '../auth-modal.component';
import { selectAuthError, selectAuthLoading, selectIsAuthenticated } from '../../../state/auth/auth.selectors';
import { clearAuthError, login } from '../../../state/auth/auth.actions';
import { AnalyticsService } from '../../../services/analytics/analytics.service';
import { CtaButtonComponent } from '../../../ui/cta-button/cta-button.component';

/**
 * Login content component for the auth modal.
 * Provides email/password form with validation and navigation to other auth views.
 */
@Component({
  selector: 'wil-login-modal-content',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    CtaButtonComponent
],
  templateUrl: './login-modal-content.component.html',
  styleUrl: './login-modal-content.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginModalContentComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<AuthModalComponent>);
  private readonly store = inject(Store);
  private readonly analytics = inject(AnalyticsService);
  private readonly destroyRef = inject(DestroyRef);

  public readonly navigate = output<AuthModalView>();

  public readonly hidePassword = signal(true);
  public readonly isSubmitted = signal(false);
  public readonly errorMessage = toSignal(this.store.select(selectAuthError).pipe(map((error) => error?.message || null)), {
    initialValue: null,
  });
  public readonly isLoading = toSignal(this.store.select(selectAuthLoading), { initialValue: false });

  public readonly loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  public get canSubmit(): boolean {
    return this.loginForm.valid && !this.isLoading();
  }

  public get showEmailError(): boolean {
    const emailControl = this.loginForm.get('email');
    return !!emailControl && emailControl.invalid && (emailControl.touched || this.isSubmitted());
  }

  public get showPasswordError(): boolean {
    const passwordControl = this.loginForm.get('password');
    return !!passwordControl && passwordControl.invalid && (passwordControl.touched || this.isSubmitted());
  }

  ngOnInit(): void {
    this.store
      .select(selectIsAuthenticated)
      .pipe(
        filter((isAuthenticated) => isAuthenticated),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.dialogRef.close({ success: true });
      });
  }

  ngOnDestroy(): void {
    this.store.dispatch(clearAuthError());
  }

  public togglePasswordVisibility(): void {
    this.hidePassword.set(!this.hidePassword());
  }

  public onForgotPassword(): void {
    this.navigate.emit('forgotPassword');
  }

  public onNotRegistered(): void {
    this.analytics.track('signup_entry_clicked', {
      source: 'login_modal',
    });

    this.navigate.emit('register');
  }

  public onCancel(): void {
    this.dialogRef.close();
  }

  public onSubmit(): void {
    this.isSubmitted.set(true);

    if (!this.loginForm.valid) {
      // Mark all fields as touched to show validation errors
      Object.values(this.loginForm.controls).forEach((control) => {
        control.markAsTouched();
      });
      return;
    }

    // Clear any previous errors
    this.store.dispatch(clearAuthError());

    // Dispatch login action
    const credentials = {
      email: this.loginForm.value.email!,
      password: this.loginForm.value.password!,
    };

    this.store.dispatch(login({ credentials }));
  }
}
