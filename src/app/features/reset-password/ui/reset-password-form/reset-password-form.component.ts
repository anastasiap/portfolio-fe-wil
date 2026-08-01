import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { CtaButtonComponent } from '../../../../ui/cta-button/cta-button.component';
import { getPasswordErrorMessage, mediumPasswordValidator, passwordMatchValidator } from '../../../../utils/validators/password.validators';
import { MatInput } from '@angular/material/input';
import { MatButton, MatIconButton } from '@angular/material/button';
import { Store } from '@ngrx/store';
import { resetPassword } from '../../../../state/auth/auth.actions';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'wil-reset-password-form',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatIcon, CtaButtonComponent, MatInput, MatIconButton, MatButton],
  templateUrl: './reset-password-form.component.html',
  styleUrl: './reset-password-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetPasswordFormComponent {
  private readonly store = inject(Store);
  private readonly fb = inject(FormBuilder);

  public token = input<string | null>(null);

  public readonly goHome = output<void>();

  public readonly resetPasswordForm = this.fb.nonNullable.group(
    {
      newPassword: ['', [Validators.required, mediumPasswordValidator()]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordMatchValidator('newPassword', 'confirmPassword') }
  );

  public readonly isSubmitting = signal(false);
  public readonly showPassword = signal(false);
  public readonly showConfirmPassword = signal(false);
  private readonly formValue = toSignal(this.resetPasswordForm.valueChanges, { initialValue: this.resetPasswordForm.getRawValue() });
  private readonly formStatus = toSignal(this.resetPasswordForm.statusChanges, { initialValue: this.resetPasswordForm.status });

  public readonly passwordsMatch = computed(() => {
    const { newPassword, confirmPassword } = this.formValue();
    return newPassword === confirmPassword;
  });

  public readonly canSubmit = computed(() => {
    this.formStatus();
    return this.resetPasswordForm.valid && !this.isSubmitting();
  });

  public onSubmit(): void {
    if (this.resetPasswordForm.invalid) {
      this.resetPasswordForm.markAllAsTouched();
      return;
    }

    const newPassword = this.newPasswordControl.value;
    this.isSubmitting.set(true);

    this.store.dispatch(resetPassword({ newPassword, token: this.token() }));
  }

  public togglePasswordVisibility(): void {
    this.showPassword.set(!this.showPassword());
  }

  public toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword.set(!this.showConfirmPassword());
  }

  public get newPasswordControl() {
    return this.resetPasswordForm.controls.newPassword;
  }

  public get confirmPasswordControl() {
    return this.resetPasswordForm.controls.confirmPassword;
  }

  public getPasswordErrorMessage(controlName: string): string {
    const control = this.resetPasswordForm.get(controlName);
    if (!control || !control.errors) {
      return '';
    }

    return getPasswordErrorMessage(control.errors);
  }
}
