import { ChangeDetectionStrategy, Component, computed, inject, input, OnInit, signal, ViewChild } from '@angular/core';
import { FormControl, FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { select, Store } from '@ngrx/store';
import { selectAuthActions, selectAuthError } from '../../../../../../state/auth/auth.selectors';
import * as AuthActions from '../../../../../../state/auth/auth.actions';
import { EmailPreferencesFormComponent } from '../email-preferences-form/email-preferences-form.component';
import { filter } from 'rxjs';
import { skip, take } from 'rxjs/operators';
import { CtaButtonComponent } from '../../../../../../ui/cta-button/cta-button.component';
import {
  getPasswordErrorMessage,
  mediumPasswordValidator,
  passwordMatchValidator,
} from '../../../../../../utils/validators/password.validators';
import { PERSONAL_HOME_ROUTE } from '../../../../../../../configs/routes.config';
import {
  normalizedMaxLengthValidator,
  normalizedMinLengthValidator,
  normalizedRequiredValidator,
  normalizeEmail,
  normalizeName,
} from '../../account-profile.util';

interface CompleteSignupFormControls {
  readonly email?: FormControl<string>;
  readonly firstName: FormControl<string>;
  readonly lastName: FormControl<string>;
  readonly password: FormControl<string>;
  readonly confirmPassword: FormControl<string>;
  readonly legalConsent: FormControl<boolean>;
}

type CompleteSignupControlName = keyof CompleteSignupFormControls;

/**
 * Complete Signup Form Component
 *
 * Standalone form component for finishing account creation after payment.
 * Collects user's first name, last name, and password.
 */
@Component({
  selector: 'wil-complete-signup-form',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatIconModule, EmailPreferencesFormComponent, CtaButtonComponent],
  templateUrl: './complete-signup-form.component.html',
  styleUrl: './complete-signup-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompleteSignupFormComponent implements OnInit {
  private readonly store = inject(Store);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly router = inject(Router);

  public readonly signupId = input<string | null>(null);
  public readonly email = input<string | null>(null);
  public readonly isRegistrationFlow = computed(() => !this.signupId() && !this.email());

  @ViewChild(EmailPreferencesFormComponent)
  private readonly emailPreferencesComponent!: EmailPreferencesFormComponent;

  public readonly form: FormGroup<CompleteSignupFormControls>;
  public readonly isSubmitting = signal<boolean>(false);
  public readonly submitError = signal<string | null>(null);
  public readonly showPassword = signal<boolean>(false);
  public readonly showConfirmPassword = signal<boolean>(false);
  public readonly isSubmitAttempted = signal<boolean>(false);

  constructor() {
    this.form = this.fb.group(
      {
        firstName: ['', [normalizedRequiredValidator, normalizedMinLengthValidator(2), normalizedMaxLengthValidator(80)]],
        lastName: ['', [normalizedRequiredValidator, normalizedMinLengthValidator(2), normalizedMaxLengthValidator(80)]],
        password: ['', [Validators.required, mediumPasswordValidator()]],
        confirmPassword: ['', [Validators.required]],
        legalConsent: [false, [Validators.requiredTrue]],
      },
      { validators: passwordMatchValidator('password', 'confirmPassword') }
    );
  }

  public ngOnInit(): void {
    if (this.isRegistrationFlow() && !this.form.get('email')) {
      this.form.addControl('email', this.fb.control('', [normalizedRequiredValidator, Validators.email]));
    }
  }

  public shouldShowError(controlName: CompleteSignupControlName): boolean {
    const control = this.form.controls[controlName];
    return !!(control && control.invalid && (control.touched || this.isSubmitAttempted()));
  }

  public getErrorMessage(controlName: CompleteSignupControlName): string {
    const control = this.form.controls[controlName];
    if (!control || !control.errors) {
      return '';
    }

    // Handle password-specific errors
    if (controlName === 'password' || controlName === 'confirmPassword') {
      return getPasswordErrorMessage(control.errors);
    }

    // Handle other field errors
    if (control.errors['required']) {
      return 'This field is required';
    }

    if (control.errors['email']) {
      return 'Please enter a valid email address';
    }

    if (control.errors['minlength']) {
      const minLength = control.errors['minlength'].requiredLength;
      return `Minimum ${minLength} characters required`;
    }

    if (control.errors['maxlength']) {
      const maxLength = control.errors['maxlength'].requiredLength;
      return `Maximum ${maxLength} characters allowed`;
    }

    return '';
  }

  public togglePasswordVisibility(): void {
    this.showPassword.update((v) => !v);
  }

  public toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword.update((v) => !v);
  }

  public onSubmit(): void {
    this.isSubmitAttempted.set(true);
    this.normalizeIdentityFields();

    if (this.form.invalid) {
      // Mark all fields as touched to show validation errors
      Object.keys(this.form.controls).forEach((key) => {
        this.form.get(key)?.markAsTouched();
      });
      return;
    }

    const formValue = this.form.getRawValue();
    this.isSubmitting.set(true);
    this.submitError.set(null);

    // Disable form while submitting
    this.form.disable();

    const successType = this.isRegistrationFlow() ? AuthActions.completeRegistrationSuccess.type : AuthActions.completeSignupSuccess.type;
    const failureType = this.isRegistrationFlow() ? AuthActions.completeRegistrationFailure.type : AuthActions.completeSignupFailure.type;

    this.store
      .pipe(
        select(selectAuthActions),
        filter((action) => action?.type === successType || action?.type === failureType),
        take(1)
      )
      .subscribe((action) => {
        if (action?.type === failureType) {
          this.isSubmitting.set(false);

          this.form.enable();
        } else if (action?.type === successType) {
          // Complete signup succeeded, now send legal consents and email preferences
          this.sendLegalConsents();
          this.updateEmailPreferences();
          this.handleSuccessfulCompletion();
        }
      });

    // Handle auth errors
    this.store
      .select(selectAuthError)
      .pipe(filter(Boolean), take(1))
      .subscribe((error) => {
        this.submitError.set(null);
        // Set user-friendly error message
        if (error?.statusCode === 400) {
          this.submitError.set('Signup not ready or invalid. Please check your link and try again.');
        } else if (error?.statusCode === 404) {
          this.submitError.set('Signup not found. Please check your link.');
        } else if (error?.statusCode === 409) {
          this.submitError.set(
            this.isRegistrationFlow()
              ? 'An account with this email already exists. Please log in.'
              : 'This signup has already been completed. Please log in.'
          );
        } else {
          this.submitError.set(error?.message || 'An unexpected error occurred. Please try again.');
        }
      });

    if (this.isRegistrationFlow()) {
      this.store.dispatch(
        AuthActions.completeRegistration({
          email: formValue.email || '',
          name: formValue.firstName,
          secondName: formValue.lastName,
          password: formValue.password,
          plan: 'free',
        })
      );
      return;
    }

    const signupId = this.signupId();
    if (!signupId) {
      this.submitError.set('Signup not found. Please check your link.');
      this.isSubmitting.set(false);
      this.form.enable();
      return;
    }

    this.store.dispatch(
      AuthActions.completeSignup({
        signupId,
        name: formValue.firstName,
        secondName: formValue.lastName,
        password: formValue.password,
        plan: 'personal',
      })
    );
  }

  public getPasswordErrorMessage(controlName: 'password' | 'confirmPassword'): string {
    const control = this.form.controls[controlName];
    if (!control || !control.errors) {
      return '';
    }

    return getPasswordErrorMessage(control.errors);
  }

  private sendLegalConsents(): void {
    this.store
      .pipe(
        select(selectAuthActions),
        skip(1),
        filter(
          (action) =>
            action?.type === AuthActions.acceptLegalConsentsSuccess.type || action?.type === AuthActions.acceptLegalConsentsFailure.type
        ),
        take(1)
      )
      .subscribe((action) => {
        if (action?.type !== AuthActions.acceptLegalConsentsFailure.type) {
          return;
        }

        this.isSubmitting.set(false);
        this.form.enable();
        this.submitError.set('Account created, but consent could not be saved. Please try again.');
      });

    this.store.dispatch(AuthActions.acceptLegalConsents());
  }

  private updateEmailPreferences(): void {
    const emailPreferences = this.emailPreferencesComponent.getFormValue();

    if (emailPreferences) {
      this.store.dispatch(AuthActions.updateAccountEmailPreferences({ patch: emailPreferences }));
    }
  }

  private handleSuccessfulCompletion(): void {
    this.store
      .pipe(
        select(selectAuthActions),
        skip(1),
        filter(
          (action) => action?.type === AuthActions.loadCurrentUserSuccess.type || action?.type === AuthActions.loadCurrentUserFailure.type
        ),
        take(1)
      )
      .subscribe((action) => {
        this.isSubmitting.set(false);

        if (action?.type === AuthActions.loadCurrentUserSuccess.type) {
          this.router.navigate([`/${PERSONAL_HOME_ROUTE}`], { replaceUrl: true });
          return;
        }

        this.form.enable();
        this.submitError.set('Account created, but your session could not be loaded. Please log in.');
      });

    this.store.dispatch(AuthActions.loadCurrentUser());
  }

  private normalizeIdentityFields(): void {
    this.form.controls.firstName.setValue(normalizeName(this.form.controls.firstName.value));
    this.form.controls.lastName.setValue(normalizeName(this.form.controls.lastName.value));

    const emailControl = this.form.controls.email;
    if (emailControl) {
      emailControl.setValue(normalizeEmail(emailControl.value));
    }
  }
}
