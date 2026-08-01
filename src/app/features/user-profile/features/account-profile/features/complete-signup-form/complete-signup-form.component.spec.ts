import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { Action } from '@ngrx/store';

import { CompleteSignupFormComponent } from './complete-signup-form.component';
import * as AuthActions from '../../../../../../state/auth/auth.actions';
import { completeSignup } from '../../../../../../state/auth/auth.actions';
import { AuthState, initialAuthState } from '../../../../../../state/auth/auth.reducer';
import { MySubscriptionState, User } from '../../../../../../services/auth/auth.types';
import { EmailPreferencesFormComponent } from '../email-preferences-form/email-preferences-form.component';
import { CtaButtonComponent } from '../../../../../../ui/cta-button/cta-button.component';
import { PERSONAL_HOME_ROUTE } from '../../../../../../../configs/routes.config';

describe('CompleteSignupFormComponent', () => {
  let component: CompleteSignupFormComponent;
  let fixture: ComponentFixture<CompleteSignupFormComponent>;
  let mockStore: MockStore;
  let router: Router;
  let authState: AuthState;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CompleteSignupFormComponent, HttpClientTestingModule, NoopAnimationsModule, RouterTestingModule],
      providers: [
        provideMockStore({
          initialState: {
            auth: initialAuthState,
          },
        }),
      ],
    }).compileComponents();

    mockStore = TestBed.inject(MockStore);
    authState = initialAuthState;

    fixture = TestBed.createComponent(CompleteSignupFormComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(mockStore, 'dispatch').and.callThrough();
    spyOn(router, 'navigate').and.resolveTo(true);
    fixture.componentRef.setInput('signupId', 'signup_123');
    fixture.componentRef.setInput('email', 'user@example.com');
    fixture.detectChanges();
  });

  const fillValidForm = (): void => {
    component.form.patchValue({
      firstName: 'Luke',
      lastName: 'Skywalker',
      password: 'ValidPass1!',
      confirmPassword: 'ValidPass1!',
      legalConsent: true,
    });
    component.form.updateValueAndValidity();
  };

  const createRegistrationComponent = (): {
    registrationFixture: ComponentFixture<CompleteSignupFormComponent>;
    registrationComponent: CompleteSignupFormComponent;
  } => {
    const registrationFixture = TestBed.createComponent(CompleteSignupFormComponent);
    const registrationComponent = registrationFixture.componentInstance;
    registrationFixture.detectChanges();

    return { registrationFixture, registrationComponent };
  };

  const fillValidRegistrationForm = (registrationComponent: CompleteSignupFormComponent): void => {
    registrationComponent.form.patchValue({
      email: 'luke@example.com',
      firstName: 'Luke',
      lastName: 'Skywalker',
      password: 'ValidPass1!',
      confirmPassword: 'ValidPass1!',
      legalConsent: true,
    });
    registrationComponent.form.updateValueAndValidity();
  };

  const patchAuthState = (patch: Partial<AuthState>): void => {
    authState = { ...authState, ...patch };
    mockStore.setState({ auth: authState });
    mockStore.refreshState();
  };

  const emitAuthAction = (action: Action): void => {
    patchAuthState({ lastAction: action });
  };

  const emitAuthError = (error: unknown): void => {
    patchAuthState({ error: error as AuthState['error'] });
  };

  const emitLoadCurrentUserSuccess = (): void => {
    const user: User = {
      id: 'user_123',
      email: 'user@example.com',
      emailVerified: true,
      systemRole: 'user',
      status: 'active',
      auth: {
        mfaEnabled: false,
        lastLoginAt: '2026-06-16T00:00:00.000Z',
      },
      audit: {
        createdAt: '2026-06-16T00:00:00.000Z',
        updatedAt: '2026-06-16T00:00:00.000Z',
      },
    };

    emitAuthAction(AuthActions.loadCurrentUserSuccess({ user, subscription: {} as MySubscriptionState }));
  };

  const emitLoadCurrentUserFailure = (): void => {
    emitAuthAction(
      AuthActions.loadCurrentUserFailure({
        error: {
          message: 'Failed to load current user',
          statusCode: 401,
        },
      })
    );
  };

  const getEmailPreferencesChild = (): EmailPreferencesFormComponent => {
    return fixture.debugElement.query(By.directive(EmailPreferencesFormComponent)).componentInstance as EmailPreferencesFormComponent;
  };

  describe('shouldShowError', () => {
    it('should create and keep validation errors hidden before interaction', () => {
      // Arrange
      fixture.detectChanges();

      // Act
      const firstNameError = fixture.debugElement.query(By.css('[data-testid="complete-signup-form__error-firstName"]'));
      const legalConsentError = fixture.debugElement.query(By.css('[data-testid="complete-signup-form__error-legalConsent"]'));

      // Assert
      expect(component).toBeTruthy();
      expect(firstNameError).toBeNull();
      expect(legalConsentError).toBeNull();
    });

    describe('firstName', () => {
      it('should show firstName error when submit was attempted and firstName is still invalid but untouched', () => {
        // Arrange
        component.form.get('firstName')?.setValue('');
        component.form.get('firstName')?.markAsUntouched();

        // Act
        component.isSubmitAttempted.set(true);
        component.form.get('firstName')?.updateValueAndValidity();
        fixture.detectChanges();
        const shouldShowError = component.shouldShowError('firstName');

        // Assert
        expect(component.form.get('firstName')?.touched).toBeFalse();
        expect(component.form.get('firstName')?.invalid).toBeTrue();
        expect(shouldShowError).toBeTrue();
      });

      it('should show required firstName error after firstName is touched and left empty', () => {
        // Arrange
        const firstNameInput = fixture.debugElement.query(By.css('[data-testid="complete-signup-form__input-firstName"]'))
          .nativeElement as HTMLInputElement;

        // Act
        firstNameInput.dispatchEvent(new Event('blur'));
        fixture.detectChanges();
        const firstNameError = fixture.debugElement.query(By.css('[data-testid="complete-signup-form__error-firstName"]'));

        // Assert
        expect(firstNameError).toBeTruthy();
        expect(firstNameError.nativeElement.textContent.trim()).toBe('This field is required');
      });

      it('should hide firstName error when firstName becomes valid', () => {
        // Arrange
        const firstNameInput = fixture.debugElement.query(By.css('[data-testid="complete-signup-form__input-firstName"]'))
          .nativeElement as HTMLInputElement;

        // Act
        firstNameInput.dispatchEvent(new Event('blur'));
        fixture.detectChanges();
        firstNameInput.value = 'Luke';
        firstNameInput.dispatchEvent(new Event('input'));
        firstNameInput.dispatchEvent(new Event('blur'));
        fixture.detectChanges();
        const firstNameError = fixture.debugElement.query(By.css('[data-testid="complete-signup-form__error-firstName"]'));

        // Assert
        expect(firstNameError).toBeNull();
      });

      it('should show maxlength firstName error when value exceeds 80 characters', () => {
        // Arrange
        const firstNameInput = fixture.debugElement.query(By.css('[data-testid="complete-signup-form__input-firstName"]'))
          .nativeElement as HTMLInputElement;

        // Act
        firstNameInput.value = 'A'.repeat(81);
        firstNameInput.dispatchEvent(new Event('input'));
        firstNameInput.dispatchEvent(new Event('blur'));
        fixture.detectChanges();
        const firstNameError = fixture.debugElement.query(By.css('[data-testid="complete-signup-form__error-firstName"]'));

        // Assert
        expect(firstNameError).toBeTruthy();
        expect(firstNameError.nativeElement.textContent.trim()).toBe('Maximum 80 characters allowed');
      });
    });

    describe('legalConsent', () => {
      it('should show legal consent error after checkbox is touched and remains unchecked', () => {
        // Arrange
        const legalConsentCheckbox = fixture.debugElement.query(By.css('[data-testid="complete-signup-form__checkbox-legalConsent"]'))
          .nativeElement as HTMLInputElement;

        // Act
        legalConsentCheckbox.dispatchEvent(new Event('blur'));
        fixture.detectChanges();
        const legalConsentError = fixture.debugElement.query(By.css('[data-testid="complete-signup-form__error-legalConsent"]'));

        // Assert
        expect(legalConsentCheckbox.checked).toBeFalse();
        expect(legalConsentError).toBeTruthy();
        expect(legalConsentError.nativeElement.textContent).toContain(
          'You must accept the Terms of Service and Privacy Policy to continue'
        );
      });
    });
  });

  describe('getErrorMessage', () => {
    it('should render required message for firstName when empty and touched', () => {
      // Arrange
      const firstNameInput = fixture.debugElement.query(By.css('[data-testid="complete-signup-form__input-firstName"]'))
        .nativeElement as HTMLInputElement;

      // Act
      firstNameInput.value = '';
      firstNameInput.dispatchEvent(new Event('input'));
      firstNameInput.dispatchEvent(new Event('blur'));
      fixture.detectChanges();
      const firstNameError = fixture.debugElement.query(By.css('[data-testid="complete-signup-form__error-firstName"]'));

      // Assert
      expect(firstNameError).toBeTruthy();
      expect(firstNameError.nativeElement.textContent.trim()).toBe('This field is required');
    });

    it('should render minlength message for firstName with 1 character', () => {
      // Arrange
      const firstNameInput = fixture.debugElement.query(By.css('[data-testid="complete-signup-form__input-firstName"]'))
        .nativeElement as HTMLInputElement;

      // Act
      firstNameInput.value = 'A';
      firstNameInput.dispatchEvent(new Event('input'));
      firstNameInput.dispatchEvent(new Event('blur'));
      fixture.detectChanges();
      const firstNameError = fixture.debugElement.query(By.css('[data-testid="complete-signup-form__error-firstName"]'));

      // Assert
      expect(firstNameError).toBeTruthy();
      expect(firstNameError.nativeElement.textContent.trim()).toBe('Minimum 2 characters required');
    });

    it('should render maxlength message for firstName when value exceeds 80 characters', () => {
      // Arrange
      const firstNameInput = fixture.debugElement.query(By.css('[data-testid="complete-signup-form__input-firstName"]'))
        .nativeElement as HTMLInputElement;

      // Act
      firstNameInput.value = 'A'.repeat(81);
      firstNameInput.dispatchEvent(new Event('input'));
      firstNameInput.dispatchEvent(new Event('blur'));
      fixture.detectChanges();
      const firstNameError = fixture.debugElement.query(By.css('[data-testid="complete-signup-form__error-firstName"]'));

      // Assert
      expect(firstNameError).toBeTruthy();
      expect(firstNameError.nativeElement.textContent.trim()).toBe('Maximum 80 characters allowed');
    });

    it('should render password helper error for confirmPassword required state', () => {
      // Arrange
      const confirmPasswordInput = fixture.debugElement.query(By.css('[data-testid="complete-signup-form__input-confirmPassword"]'))
        .nativeElement as HTMLInputElement;

      // Act
      confirmPasswordInput.value = '';
      confirmPasswordInput.dispatchEvent(new Event('input'));
      confirmPasswordInput.dispatchEvent(new Event('blur'));
      fixture.detectChanges();
      const confirmPasswordError = fixture.debugElement.query(By.css('[data-testid="complete-signup-form__error-confirmPassword"]'));

      // Assert
      expect(confirmPasswordError).toBeTruthy();
      expect(confirmPasswordError.nativeElement.textContent.trim().length).toBeGreaterThan(0);
      expect(confirmPasswordError.nativeElement.textContent.trim()).not.toBe('This field is required');
    });

    describe('edge cases', () => {
      it('should return empty string when control does not exist', () => {
        // Arrange

        // Act
        const errorMessage = component.getErrorMessage('missingControl' as never);

        // Assert
        expect(errorMessage).toBe('');
      });

      it('should render empty error text for unsupported validation error key', () => {
        // Arrange
        const firstNameControl = component.form.get('firstName');

        // Act
        firstNameControl?.setValue('');
        firstNameControl?.setErrors({ customError: true });
        firstNameControl?.markAsTouched();
        fixture.detectChanges();
        const firstNameError = fixture.debugElement.query(By.css('[data-testid="complete-signup-form__error-firstName"]'));

        // Assert
        expect(firstNameError).toBeTruthy();
        expect(firstNameError.nativeElement.textContent.trim()).toBe('');
      });
    });
  });

  describe('template rendering and bindings', () => {
    it('should render email info when email input exists', () => {
      // Arrange
      fixture.componentRef.setInput('email', 'user@example.com');

      // Act
      fixture.detectChanges();
      const emailInfo = fixture.debugElement.query(By.css('[data-testid="email-info"]'));

      // Assert
      expect(emailInfo).toBeTruthy();
      expect(emailInfo.nativeElement.textContent).toContain('user@example.com');
    });

    it('should hide email info when email input is null', () => {
      // Arrange
      fixture.componentRef.setInput('email', null);

      // Act
      fixture.detectChanges();
      const emailInfo = fixture.debugElement.query(By.css('[data-testid="email-info"]'));

      // Assert
      expect(emailInfo).toBeNull();
    });

    it('should render submit error block with mapped message', () => {
      // Arrange
      fillValidForm();

      // Act
      component.onSubmit();
      emitAuthError({ statusCode: 404 });
      fixture.detectChanges();
      const submitError = fixture.debugElement.query(By.css('[data-testid="submit-error"]'));

      // Assert
      expect(submitError).toBeTruthy();
      expect(submitError.nativeElement.textContent).toContain('Signup not found. Please check your link.');
    });

    it('should toggle password input type via toggle-password button clicks', () => {
      // Arrange
      const passwordInput = fixture.debugElement.query(By.css('[data-testid="complete-signup-form__input-password"]'))
        .nativeElement as HTMLInputElement;
      const toggle = fixture.debugElement.query(By.css('[data-testid="toggle-password"]')).nativeElement as HTMLButtonElement;

      // Act
      toggle.click();
      fixture.detectChanges();
      const afterFirstClickType = passwordInput.type;
      toggle.click();
      fixture.detectChanges();
      const afterSecondClickType = passwordInput.type;

      // Assert
      expect(afterFirstClickType).toBe('text');
      expect(afterSecondClickType).toBe('password');
    });

    it('should toggle confirm password input type via toggle-confirmPassword button clicks', () => {
      // Arrange
      const confirmInput = fixture.debugElement.query(By.css('[data-testid="complete-signup-form__input-confirmPassword"]'))
        .nativeElement as HTMLInputElement;
      const toggle = fixture.debugElement.query(By.css('[data-testid="toggle-confirmPassword"]')).nativeElement as HTMLButtonElement;

      // Act
      toggle.click();
      fixture.detectChanges();
      const afterFirstClickType = confirmInput.type;
      toggle.click();
      fixture.detectChanges();
      const afterSecondClickType = confirmInput.type;

      // Assert
      expect(afterFirstClickType).toBe('text');
      expect(afterSecondClickType).toBe('password');
    });

    it('should keep submit CTA disabled when form is invalid and show default CTA text', () => {
      // Arrange

      // Act
      fixture.detectChanges();
      const ctaComponent = fixture.debugElement.query(By.directive(CtaButtonComponent)).componentInstance as CtaButtonComponent;
      const ctaButton = fixture.debugElement.query(By.css('[data-testid="complete-signup-form-button-submit"] button'))
        .nativeElement as HTMLButtonElement;

      // Assert
      expect(ctaButton.disabled).toBeTrue();
      expect(ctaComponent.ctaText()).toBe('Finish Setup');
    });

    it('should enable submit CTA when form becomes valid', () => {
      // Arrange
      fillValidForm();

      // Act
      fixture.detectChanges();
      const ctaButton = fixture.debugElement.query(By.css('[data-testid="complete-signup-form-button-submit"] button'))
        .nativeElement as HTMLButtonElement;

      // Assert
      expect(ctaButton.disabled).toBeFalse();
    });

    it('should disable submit CTA and update CTA text while submitting', () => {
      // Arrange
      fillValidForm();

      // Act
      component.onSubmit();
      fixture.detectChanges();
      const ctaComponent = fixture.debugElement.query(By.directive(CtaButtonComponent)).componentInstance as CtaButtonComponent;
      const ctaButton = fixture.debugElement.query(By.css('[data-testid="complete-signup-form-button-submit"] button'))
        .nativeElement as HTMLButtonElement;

      // Assert
      expect(component.isSubmitting()).toBeTrue();
      expect(ctaButton.disabled).toBeTrue();
      expect(ctaComponent.ctaText()).toBe('Creating Account...');
    });

    it('should submit through CTA click and disable form for valid input', () => {
      // Arrange
      fillValidForm();
      fixture.detectChanges();
      const ctaButton = fixture.debugElement.query(By.css('[data-testid="complete-signup-form-button-submit"] button'))
        .nativeElement as HTMLButtonElement;

      // Act
      ctaButton.click();
      fixture.detectChanges();

      // Assert
      expect(component.form.disabled).toBeTrue();
      expect(mockStore.dispatch).toHaveBeenCalledWith(
        completeSignup({
          signupId: 'signup_123',
          name: 'Luke',
          secondName: 'Skywalker',
          password: 'ValidPass1!',
          plan: 'personal',
        })
      );
    });
  });

  describe('registration flow', () => {
    it('should add and render email control when signupId and email inputs are absent', () => {
      // Arrange
      const { registrationFixture, registrationComponent } = createRegistrationComponent();

      // Act
      const emailInput = registrationFixture.debugElement.query(By.css('[data-testid="complete-signup-form__input-email"]'));

      // Assert
      expect(registrationComponent.isRegistrationFlow()).toBeTrue();
      expect(registrationComponent.form.get('email')).toBeTruthy();
      expect(emailInput).toBeTruthy();
    });

    it('should show email validation error for invalid registration email', () => {
      // Arrange
      const { registrationFixture, registrationComponent } = createRegistrationComponent();
      const emailInput = registrationFixture.debugElement.query(By.css('[data-testid="complete-signup-form__input-email"]'))
        .nativeElement as HTMLInputElement;

      // Act
      emailInput.value = 'not-an-email';
      emailInput.dispatchEvent(new Event('input'));
      emailInput.dispatchEvent(new Event('blur'));
      registrationComponent.form.get('email')?.markAsTouched();
      registrationFixture.detectChanges();
      const emailError = registrationFixture.debugElement.query(By.css('[data-testid="complete-signup-form__error-email"]'));

      // Assert
      expect(emailError).toBeTruthy();
      expect(emailError.nativeElement.textContent.trim()).toBe('Please enter a valid email address');
    });

    it('should dispatch completeRegistration with mapped payload when registration form is valid', () => {
      // Arrange
      const { registrationComponent } = createRegistrationComponent();
      fillValidRegistrationForm(registrationComponent);

      // Act
      registrationComponent.onSubmit();

      // Assert
      expect(registrationComponent.isSubmitting()).toBeTrue();
      expect(registrationComponent.form.disabled).toBeTrue();
      expect(mockStore.dispatch).toHaveBeenCalledWith(
        AuthActions.completeRegistration({
          email: 'luke@example.com',
          name: 'Luke',
          secondName: 'Skywalker',
          password: 'ValidPass1!',
          plan: 'free',
        })
      );
    });

    it('should normalize registration email and names before dispatching completeRegistration', () => {
      // Arrange
      const { registrationComponent } = createRegistrationComponent();
      fillValidRegistrationForm(registrationComponent);
      registrationComponent.form.patchValue({
        email: '  LUKE@EXAMPLE.COM  ',
        firstName: '  Luke   Jedi  ',
        lastName: '  Skywalker  ',
      });
      registrationComponent.form.updateValueAndValidity();

      // Act
      registrationComponent.onSubmit();

      // Assert
      expect(mockStore.dispatch).toHaveBeenCalledWith(
        AuthActions.completeRegistration({
          email: 'luke@example.com',
          name: 'Luke Jedi',
          secondName: 'Skywalker',
          password: 'ValidPass1!',
          plan: 'free',
        })
      );
    });

    it('should set registration-specific message for auth error 409', () => {
      // Arrange
      const { registrationComponent } = createRegistrationComponent();
      fillValidRegistrationForm(registrationComponent);

      // Act
      registrationComponent.onSubmit();
      emitAuthError({ statusCode: 409, message: 'conflict' });

      // Assert
      expect(registrationComponent.submitError()).toBe('An account with this email already exists. Please log in.');
    });

    it('should handle completeRegistrationFailure action by stopping submit and re-enabling form', () => {
      // Arrange
      const { registrationComponent } = createRegistrationComponent();
      fillValidRegistrationForm(registrationComponent);

      // Act
      registrationComponent.onSubmit();
      emitAuthAction({ type: AuthActions.completeRegistrationFailure.type });

      // Assert
      expect(registrationComponent.isSubmitting()).toBeFalse();
      expect(registrationComponent.form.enabled).toBeTrue();
    });
  });

  describe('onSubmit', () => {
    it('should mark all controls as touched and skip dispatch when form is invalid', () => {
      // Arrange
      expect(component.form.invalid).toBeTrue();

      // Act
      component.onSubmit();

      // Assert
      expect(component.isSubmitAttempted()).toBeTrue();
      Object.keys(component.form.controls).forEach((key) => {
        expect(component.form.get(key)?.touched).toBeTrue();
      });
      expect(mockStore.dispatch).not.toHaveBeenCalled();
      expect(component.form.enabled).toBeTrue();
      expect(component.isSubmitting()).toBeFalse();
    });

    it('should dispatch completeSignup with mapped payload and disable form when form is valid', () => {
      // Arrange
      fillValidForm();

      // Act
      component.onSubmit();

      // Assert
      expect(component.isSubmitting()).toBeTrue();
      expect(component.submitError()).toBeNull();
      expect(component.form.disabled).toBeTrue();
      expect(mockStore.dispatch).toHaveBeenCalledWith(
        completeSignup({
          signupId: 'signup_123',
          name: 'Luke',
          secondName: 'Skywalker',
          password: 'ValidPass1!',
          plan: 'personal',
        })
      );
    });

    it('should normalize name whitespace before dispatching completeSignup', () => {
      // Arrange
      fillValidForm();
      component.form.patchValue({
        firstName: '  Luke   Jedi  ',
        lastName: '  Skywalker  ',
      });
      component.form.updateValueAndValidity();

      // Act
      component.onSubmit();

      // Assert
      expect(mockStore.dispatch).toHaveBeenCalledWith(
        completeSignup({
          signupId: 'signup_123',
          name: 'Luke Jedi',
          secondName: 'Skywalker',
          password: 'ValidPass1!',
          plan: 'personal',
        })
      );
    });

    it('should block submission when names contain only whitespace', () => {
      // Arrange
      fillValidForm();
      component.form.patchValue({
        firstName: '   ',
        lastName: ' Skywalker ',
      });
      component.form.updateValueAndValidity();

      // Act
      component.onSubmit();

      // Assert
      expect(component.form.controls.firstName.value).toBe('');
      expect(component.form.controls.firstName.hasError('required')).toBeTrue();
      expect(mockStore.dispatch).not.toHaveBeenCalled();
    });

    it('should handle completeSignupFailure action by stopping submit and re-enabling form', () => {
      // Arrange
      fillValidForm();

      // Act
      component.onSubmit();
      emitAuthAction({ type: AuthActions.completeSignupFailure.type });

      // Assert
      expect(component.isSubmitting()).toBeFalse();
      expect(component.submitError()).toBeNull();
      expect(component.form.enabled).toBeTrue();
    });

    it('should handle completeSignupSuccess without email preference changes', () => {
      // Arrange
      fillValidForm();
      const childComponent = getEmailPreferencesChild();
      spyOn(childComponent, 'getFormValue').and.returnValue(null);

      // Act
      component.onSubmit();
      emitAuthAction({ type: AuthActions.completeSignupSuccess.type });

      // Assert
      expect(mockStore.dispatch).toHaveBeenCalledWith(AuthActions.acceptLegalConsents());
      expect(mockStore.dispatch).toHaveBeenCalledTimes(3);
      expect(router.navigate).not.toHaveBeenCalled();

      // Act
      emitLoadCurrentUserSuccess();

      // Assert
      expect(component.isSubmitting()).toBeFalse();
      expect(mockStore.dispatch).toHaveBeenCalledWith(AuthActions.loadCurrentUser());
      expect(router.navigate).toHaveBeenCalledWith([`/${PERSONAL_HOME_ROUTE}`], { replaceUrl: true });
    });

    it('should dispatch updateAccountEmailPreferences when child form has changes on success', () => {
      // Arrange
      fillValidForm();
      const childComponent = getEmailPreferencesChild();
      spyOn(childComponent, 'getFormValue').and.returnValue({ marketingContent: true });

      // Act
      component.onSubmit();
      emitAuthAction({ type: AuthActions.completeSignupSuccess.type });

      // Assert
      expect(mockStore.dispatch).toHaveBeenCalledWith(AuthActions.acceptLegalConsents());
      expect(mockStore.dispatch).toHaveBeenCalledWith(AuthActions.updateAccountEmailPreferences({ patch: { marketingContent: true } }));
      expect(mockStore.dispatch).toHaveBeenCalledWith(AuthActions.loadCurrentUser());
      expect(mockStore.dispatch).toHaveBeenCalledTimes(4);
      expect(router.navigate).not.toHaveBeenCalled();

      // Act
      emitLoadCurrentUserSuccess();

      // Assert
      expect(component.isSubmitting()).toBeFalse();
      expect(router.navigate).toHaveBeenCalledWith([`/${PERSONAL_HOME_ROUTE}`], { replaceUrl: true });
    });

    it('should re-enable form and show an error when current user load fails after signup success', () => {
      // Arrange
      fillValidForm();
      const childComponent = getEmailPreferencesChild();
      spyOn(childComponent, 'getFormValue').and.returnValue(null);

      // Act
      component.onSubmit();
      emitAuthAction({ type: AuthActions.completeSignupSuccess.type });
      emitLoadCurrentUserFailure();

      // Assert
      expect(component.isSubmitting()).toBeFalse();
      expect(component.form.enabled).toBeTrue();
      expect(component.submitError()).toBe('Account created, but your session could not be loaded. Please log in.');
      expect(router.navigate).not.toHaveBeenCalled();
    });

    describe('auth error', () => {
      it('should set user-friendly message for auth error 400', () => {
        // Arrange
        fillValidForm();

        // Act
        component.onSubmit();
        emitAuthError({ statusCode: 400, message: 'bad request' });

        // Assert
        expect(component.submitError()).toBe('Signup not ready or invalid. Please check your link and try again.');
      });

      it('should set user-friendly message for auth error 404', () => {
        // Arrange
        fillValidForm();

        // Act
        component.onSubmit();
        emitAuthError({ statusCode: 404, message: 'not found' });

        // Assert
        expect(component.submitError()).toBe('Signup not found. Please check your link.');
      });

      it('should set user-friendly message for auth error 409', () => {
        // Arrange
        fillValidForm();

        // Act
        component.onSubmit();
        emitAuthError({ statusCode: 409, message: 'conflict' });

        // Assert
        expect(component.submitError()).toBe('This signup has already been completed. Please log in.');
      });

      it('should use backend message for unknown auth error status', () => {
        // Arrange
        fillValidForm();

        // Act
        component.onSubmit();
        emitAuthError({ statusCode: 500, message: 'Server exploded' });

        // Assert
        expect(component.submitError()).toBe('Server exploded');
      });

      it('should use generic message for unknown auth error without message', () => {
        // Arrange
        fillValidForm();

        // Act
        component.onSubmit();
        emitAuthError({ statusCode: 500 });

        // Assert
        expect(component.submitError()).toBe('An unexpected error occurred. Please try again.');
      });

      it('should keep auth-error message when auth error arrives after failure action', () => {
        // Arrange
        fillValidForm();

        // Act
        component.onSubmit();
        emitAuthAction({ type: AuthActions.completeSignupFailure.type });
        emitAuthError({ statusCode: 404 });

        // Assert
        expect(component.submitError()).toBe('Signup not found. Please check your link.');
        expect(component.form.enabled).toBeTrue();
        expect(component.isSubmitting()).toBeFalse();
      });

      it('should keep auth-error message when auth error arrives before failure action', () => {
        // Arrange
        fillValidForm();

        // Act
        component.onSubmit();
        emitAuthError({ statusCode: 400 });
        emitAuthAction({ type: AuthActions.completeSignupFailure.type });

        // Assert
        expect(component.submitError()).toBe('Signup not ready or invalid. Please check your link and try again.');
        expect(component.form.enabled).toBeTrue();
        expect(component.isSubmitting()).toBeFalse();
      });
    });

    describe('sendLegalConsents', () => {
      it('should set consent fallback error and re-enable form when legal consent API fails', () => {
        // Arrange
        fillValidForm();
        const childComponent = getEmailPreferencesChild();
        spyOn(childComponent, 'getFormValue').and.returnValue(null);

        // Act
        component.onSubmit();
        emitAuthAction({ type: AuthActions.completeSignupSuccess.type });
        emitAuthAction(
          AuthActions.acceptLegalConsentsFailure({
            error: {
              message: 'consent failed',
              statusCode: 500,
            },
          })
        );

        // Assert
        expect(component.submitError()).toBe('Account created, but consent could not be saved. Please try again.');
        expect(component.form.enabled).toBeTrue();
        expect(component.isSubmitting()).toBeFalse();
      });
    });

    it('should consume pre-existing success action emission and run success side effects', () => {
      // Arrange
      fillValidForm();
      const childComponent = getEmailPreferencesChild();
      spyOn(childComponent, 'getFormValue').and.returnValue({ marketingContent: false });
      emitAuthAction({ type: AuthActions.completeSignupSuccess.type });

      // Act
      component.onSubmit();

      // Assert
      expect(mockStore.dispatch).toHaveBeenCalledWith(AuthActions.acceptLegalConsents());
      expect(mockStore.dispatch).toHaveBeenCalledWith(AuthActions.updateAccountEmailPreferences({ patch: { marketingContent: false } }));
      expect(mockStore.dispatch).toHaveBeenCalledWith(AuthActions.loadCurrentUser());
      expect(mockStore.dispatch).toHaveBeenCalledWith(
        completeSignup({
          signupId: 'signup_123',
          name: 'Luke',
          secondName: 'Skywalker',
          password: 'ValidPass1!',
          plan: 'personal',
        })
      );
    });

    it('should dispatch completeSignup on each direct onSubmit call while form is valid', () => {
      // Arrange
      fillValidForm();

      // Act
      component.onSubmit();
      component.onSubmit();

      // Assert
      const completeSignupCalls = (mockStore.dispatch as jasmine.Spy).calls
        .allArgs()
        .filter(([action]) => action?.type === AuthActions.completeSignup.type);

      expect(completeSignupCalls.length).toBe(2);
    });
  });
});
