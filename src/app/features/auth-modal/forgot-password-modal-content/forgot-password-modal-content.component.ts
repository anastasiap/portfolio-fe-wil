import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';

import { AuthModalView } from '../auth-modal.types';
import { selectPasswordResetLoading, selectPasswordResetSent } from '../../../state/auth/auth.selectors';
import { clearPasswordResetState, requestPasswordReset } from '../../../state/auth/auth.actions';
import { CtaButtonComponent } from '../../../ui/cta-button/cta-button.component';

/**
 * Forgot password content component for the auth modal.
 * Provides email form for password reset requests.
 */
@Component({
  selector: 'wil-forgot-password-modal-content',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    CtaButtonComponent,
  ],
  templateUrl: './forgot-password-modal-content.component.html',
  styleUrl: './forgot-password-modal-content.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForgotPasswordModalContentComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(Store);

  public readonly navigate = output<AuthModalView>();

  public readonly isSubmitting = toSignal(this.store.select(selectPasswordResetLoading), { initialValue: false });
  public readonly isSent = toSignal(this.store.select(selectPasswordResetSent), { initialValue: false });

  public readonly forgotPasswordForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  public get canSubmit(): boolean {
    return this.forgotPasswordForm.valid && !this.isSubmitting();
  }

  public get emailControl() {
    return this.forgotPasswordForm.controls.email;
  }

  public ngOnInit(): void {
    this.store.dispatch(clearPasswordResetState());
  }

  public ngOnDestroy(): void {
    this.store.dispatch(clearPasswordResetState());
  }

  public onSubmit(): void {
    if (this.forgotPasswordForm.invalid) {
      this.forgotPasswordForm.markAllAsTouched();
      return;
    }

    if (this.isSubmitting()) {
      return;
    }

    const { email } = this.forgotPasswordForm.getRawValue();

    this.store.dispatch(requestPasswordReset({ email }));
  }

  public onBackToLogin(): void {
    this.navigate.emit('login');
  }
}
