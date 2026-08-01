import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';
import { Store } from '@ngrx/store';
import { BehaviorSubject, of } from 'rxjs';

import { LoginModalContentComponent } from './login-modal-content.component';
import { AuthModalComponent } from '../auth-modal.component';
import { clearAuthError, login } from '../../../state/auth/auth.actions';
import { AuthError } from '../../../services/auth/auth.types';
import { CtaButtonComponent } from '../../../ui/cta-button/cta-button.component';
import { selectAuthError, selectAuthLoading, selectIsAuthenticated } from '../../../state/auth/auth.selectors';

interface AngularComponentMetadata {
  standalone: boolean;
  onPush: boolean;
}

interface ComponentWithAngularMetadata {
  ɵcmp: AngularComponentMetadata;
}

describe('LoginModalContentComponent', () => {
  let component: LoginModalContentComponent;
  let fixture: ComponentFixture<LoginModalContentComponent>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<AuthModalComponent>>;
  let mockStore: jasmine.SpyObj<Store>;
  let authLoadingSubject: BehaviorSubject<boolean>;
  let authErrorSubject: BehaviorSubject<AuthError | null>;
  let isAuthenticatedSubject: BehaviorSubject<boolean>;

  const getCtaButton = (testId: string): DebugElement => fixture.debugElement.query(By.css(`[data-testid="${testId}"]`));
  const getCtaButtonComponent = (testId: string): CtaButtonComponent => getCtaButton(testId).componentInstance as CtaButtonComponent;
  const getCtaNativeButton = (testId: string): HTMLButtonElement => getCtaButton(testId).query(By.css('button')).nativeElement as HTMLButtonElement;

  beforeEach(async () => {
    // Arrange: Create mock observables for auth state
    authLoadingSubject = new BehaviorSubject<boolean>(false);
    authErrorSubject = new BehaviorSubject<AuthError | null>(null);
    isAuthenticatedSubject = new BehaviorSubject<boolean>(false);

    // Arrange: Create mock dialog ref and store
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    mockStore = jasmine.createSpyObj('Store', ['select', 'dispatch']);

    mockStore.select.and.callFake((selector: unknown) => {
      if (selector === selectAuthLoading) {
        return authLoadingSubject.asObservable();
      } else if (selector === selectAuthError) {
        return authErrorSubject.asObservable();
      } else if (selector === selectIsAuthenticated) {
        return isAuthenticatedSubject.asObservable();
      }
      return of(null);
    });

    await TestBed.configureTestingModule({
      imports: [LoginModalContentComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: Store, useValue: mockStore },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginModalContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    // Assert
    expect(component).toBeTruthy();
  });

  describe('Component Structure', () => {
    it('should be a standalone component', () => {
      // Assert
      const metadata = (LoginModalContentComponent as unknown as ComponentWithAngularMetadata).ɵcmp;
      expect(metadata.standalone).toBe(true);
    });

    it('should use OnPush change detection', () => {
      // Assert
      const metadata = (LoginModalContentComponent as unknown as ComponentWithAngularMetadata).ɵcmp;
      expect(metadata.onPush).toBe(true);
    });

    it('should render the login modal content container', () => {
      // Act
      const container: DebugElement = fixture.debugElement.query(By.css('[data-testid="login-modal-content"]'));

      // Assert
      expect(container).toBeTruthy();
      expect(container.nativeElement.classList.contains('login-modal-content')).toBe(true);
    });

    it('should render the login form', () => {
      // Act
      const form: DebugElement = fixture.debugElement.query(By.css('[data-testid="login-form"]'));

      // Assert
      expect(form).toBeTruthy();
    });
  });

  describe('Form Fields', () => {
    it('should render email input field', () => {
      // Act
      const emailInput: DebugElement = fixture.debugElement.query(By.css('[data-testid="login-email-input"]'));

      // Assert
      expect(emailInput).toBeTruthy();
      expect(emailInput.nativeElement.type).toBe('email');
    });

    it('should render password input field', () => {
      // Act
      const passwordInput: DebugElement = fixture.debugElement.query(By.css('[data-testid="login-password-input"]'));

      // Assert
      expect(passwordInput).toBeTruthy();
      expect(passwordInput.nativeElement.type).toBe('password');
    });

    it('should render password toggle button', () => {
      // Act
      const toggleButton: DebugElement = fixture.debugElement.query(By.css('[data-testid="login-password-toggle"]'));

      // Assert
      expect(toggleButton).toBeTruthy();
    });

    it('should have autocomplete attributes on inputs', () => {
      // Act
      const emailInput: DebugElement = fixture.debugElement.query(By.css('[data-testid="login-email-input"]'));
      const passwordInput: DebugElement = fixture.debugElement.query(By.css('[data-testid="login-password-input"]'));

      // Assert
      expect(emailInput.nativeElement.getAttribute('autocomplete')).toBe('email');
      expect(passwordInput.nativeElement.getAttribute('autocomplete')).toBe('current-password');
    });
  });

  describe('Form Validation', () => {
    it('should initialize with empty and invalid form', () => {
      // Assert
      expect(component.loginForm.valid).toBe(false);
      expect(component.loginForm.get('email')?.value).toBe('');
      expect(component.loginForm.get('password')?.value).toBe('');
    });

    it('should mark email as invalid when empty', () => {
      // Arrange
      const emailControl = component.loginForm.get('email');

      // Act
      emailControl?.markAsTouched();
      fixture.detectChanges();

      // Assert
      expect(emailControl?.hasError('required')).toBe(true);
    });

    it('should mark email as invalid when format is incorrect', () => {
      // Arrange
      const emailControl = component.loginForm.get('email');

      // Act
      emailControl?.setValue('invalid-email');
      emailControl?.markAsTouched();
      fixture.detectChanges();

      // Assert
      expect(emailControl?.hasError('email')).toBe(true);
    });

    it('should mark email as valid with correct format', () => {
      // Arrange
      const emailControl = component.loginForm.get('email');

      // Act
      emailControl?.setValue('user@example.com');
      fixture.detectChanges();

      // Assert
      expect(emailControl?.valid).toBe(true);
    });

    it('should mark password as invalid when empty', () => {
      // Arrange
      const passwordControl = component.loginForm.get('password');

      // Act
      passwordControl?.markAsTouched();
      fixture.detectChanges();

      // Assert
      expect(passwordControl?.hasError('required')).toBe(true);
    });

    it('should mark password as valid when not empty', () => {
      // Arrange
      const passwordControl = component.loginForm.get('password');

      // Act
      passwordControl?.setValue('password123');
      fixture.detectChanges();

      // Assert
      expect(passwordControl?.valid).toBe(true);
    });

    it('should mark form as valid when both fields are valid', () => {
      // Act
      component.loginForm.patchValue({
        email: 'user@example.com',
        password: 'password123',
      });
      fixture.detectChanges();

      // Assert
      expect(component.loginForm.valid).toBe(true);
    });
  });

  describe('Validation Error Display', () => {
    it('should not show email error initially', () => {
      // Act
      const emailError: DebugElement = fixture.debugElement.query(By.css('[data-testid="login-email-error"]'));

      // Assert
      expect(emailError).toBeFalsy();
      expect(component.showEmailError).toBe(false);
    });

    it('should show email error after field is touched and invalid', () => {
      // Arrange
      const emailControl = component.loginForm.get('email');
      const emailInput: DebugElement = fixture.debugElement.query(By.css('[data-testid="login-email-input"]'));

      // Act
      emailInput.nativeElement.dispatchEvent(new Event('blur'));
      fixture.detectChanges();

      // Assert
      expect(emailControl?.touched).toBe(true);
      expect(component.showEmailError).toBe(true);
      const emailError: DebugElement = fixture.debugElement.query(By.css('[data-testid="login-email-error"]'));
      expect(emailError).toBeTruthy();
    });

    it('should show email error after form submission', () => {
      // Act
      component.isSubmitted.set(true);
      fixture.detectChanges();

      // Assert
      expect(component.showEmailError).toBe(true);
    });

    it('should not show password error initially', () => {
      // Act
      const passwordError: DebugElement = fixture.debugElement.query(By.css('[data-testid="login-password-error"]'));

      // Assert
      expect(passwordError).toBeFalsy();
      expect(component.showPasswordError).toBe(false);
    });

    it('should show password error after field is touched and invalid', () => {
      // Arrange
      const passwordControl = component.loginForm.get('password');
      const passwordInput: DebugElement = fixture.debugElement.query(By.css('[data-testid="login-password-input"]'));

      // Act
      passwordInput.nativeElement.dispatchEvent(new Event('blur'));
      fixture.detectChanges();

      // Assert
      expect(passwordControl?.touched).toBe(true);
      expect(component.showPasswordError).toBe(true);
      const passwordError: DebugElement = fixture.debugElement.query(By.css('[data-testid="login-password-error"]'));
      expect(passwordError).toBeTruthy();
    });
  });

  describe('Password Visibility Toggle', () => {
    it('should initialize with password hidden', () => {
      // Assert
      expect(component.hidePassword()).toBe(true);
      const passwordInput: DebugElement = fixture.debugElement.query(By.css('[data-testid="login-password-input"]'));
      expect(passwordInput.nativeElement.type).toBe('password');
    });

    it('should toggle password visibility when toggle button is clicked', () => {
      // Arrange
      const toggleButton: DebugElement = fixture.debugElement.query(By.css('[data-testid="login-password-toggle"]'));
      const initialState = component.hidePassword();

      // Act
      toggleButton.nativeElement.click();
      fixture.detectChanges();

      // Assert
      expect(component.hidePassword()).toBe(!initialState);
    });

    it('should change input type to text when password is visible', () => {
      // Arrange
      const toggleButton: DebugElement = fixture.debugElement.query(By.css('[data-testid="login-password-toggle"]'));
      const passwordInput: DebugElement = fixture.debugElement.query(By.css('[data-testid="login-password-input"]'));

      // Act
      toggleButton.nativeElement.click();
      fixture.detectChanges();

      // Assert
      expect(passwordInput.nativeElement.type).toBe('text');
    });
  });

  describe('Action Buttons', () => {
    it('should render cancel button', () => {
      // Act
      const cancelButton: DebugElement = fixture.debugElement.query(By.css('[data-testid="login-cancel-button"]'));

      // Assert
      expect(cancelButton).toBeTruthy();
      expect(cancelButton.nativeElement.textContent.trim()).toContain('Cancel');
    });

    it('should render login button', () => {
      // Act
      const loginButton: DebugElement = fixture.debugElement.query(By.css('[data-testid="login-submit-button"]'));

      // Assert
      expect(loginButton).toBeTruthy();
      expect(loginButton.nativeElement.textContent.trim()).toContain('Login');
    });

    it('should disable login button when form is invalid', () => {
      // Act
      fixture.detectChanges();
      const loginButton = getCtaButtonComponent('login-submit-button');
      const loginNativeButton = getCtaNativeButton('login-submit-button');

      // Assert
      expect(loginButton.disabled()).toBe(true);
      expect(loginNativeButton.disabled).toBe(true);
      expect(component.canSubmit).toBe(false);
    });

    it('should enable login button when form is valid', () => {
      // Arrange
      component.loginForm.patchValue({
        email: 'user@example.com',
        password: 'password123',
      });

      // Act
      fixture.detectChanges();
      const loginButton = getCtaButtonComponent('login-submit-button');
      const loginNativeButton = getCtaNativeButton('login-submit-button');

      // Assert
      expect(loginButton.disabled()).toBe(false);
      expect(loginNativeButton.disabled).toBe(false);
      expect(component.canSubmit).toBe(true);
    });

    it('should disable login button when loading', () => {
      // Arrange
      component.loginForm.patchValue({
        email: 'user@example.com',
        password: 'password123',
      });
      authLoadingSubject.next(true);

      // Act
      fixture.detectChanges();
      const loginButton = getCtaButtonComponent('login-submit-button');
      const loginNativeButton = getCtaNativeButton('login-submit-button');

      // Assert
      expect(loginButton.disabled()).toBe(true);
      expect(loginNativeButton.disabled).toBe(true);
      expect(component.canSubmit).toBe(false);
    });

    it('should show loading spinner when loading', () => {
      // Arrange
      authLoadingSubject.next(true);

      // Act
      fixture.detectChanges();
      const spinner: DebugElement = getCtaButton('login-submit-button').query(By.css('[data-testid="button-loading-spinner"]'));
      const loginButton = getCtaButtonComponent('login-submit-button');

      // Assert
      expect(spinner).toBeTruthy();
      expect(loginButton.loading()).toBe(true);
      expect(loginButton.ctaText()).toBe('Logging in...');
    });

    it('should close dialog when cancel button is clicked', () => {
      // Arrange
      const cancelButton = getCtaButtonComponent('login-cancel-button');

      // Act
      cancelButton.ctaClick.emit();

      // Assert
      expect(mockDialogRef.close).toHaveBeenCalledTimes(1);
    });

    it('should keep cancel button enabled when loading', () => {
      // Arrange
      authLoadingSubject.next(true);

      // Act
      fixture.detectChanges();
      const cancelButton = getCtaButtonComponent('login-cancel-button');
      const cancelNativeButton = getCtaNativeButton('login-cancel-button');

      // Assert
      expect(cancelButton.disabled()).toBe(false);
      expect(cancelNativeButton.disabled).toBe(false);
    });
  });

  describe('Navigation Links', () => {
    it('should render forgot password link', () => {
      // Act
      const forgotLink: DebugElement = fixture.debugElement.query(By.css('[data-testid="login-forgot-password-link"]'));

      // Assert
      expect(forgotLink).toBeTruthy();
      expect(forgotLink.nativeElement.textContent.trim()).toBe('Forgot password?');
    });

    it('should render not registered link', () => {
      // Act
      const registerLink: DebugElement = fixture.debugElement.query(By.css('[data-testid="login-not-registered-link"]'));

      // Assert
      expect(registerLink).toBeTruthy();
      expect(registerLink.nativeElement.textContent.trim()).toContain('Create an account');
    });

    it('should emit navigate event with forgotPassword when forgot password is clicked', () => {
      // Arrange
      spyOn(component.navigate, 'emit');
      const forgotLink: DebugElement = fixture.debugElement.query(By.css('[data-testid="login-forgot-password-link"]'));

      // Act
      forgotLink.nativeElement.click();

      // Assert
      expect(component.navigate.emit).toHaveBeenCalledWith('forgotPassword');
    });

    it('should emit navigate event with register when not registered is clicked', () => {
      // Arrange
      spyOn(component.navigate, 'emit');
      const registerLink: DebugElement = fixture.debugElement.query(By.css('[data-testid="login-not-registered-link"]'));

      // Act
      registerLink.nativeElement.click();

      // Assert
      expect(component.navigate.emit).toHaveBeenCalledWith('register');
    });
  });

  describe('Form Submission', () => {
    it('should not dispatch login action when form is invalid', () => {
      // Arrange
      spyOn(component, 'onSubmit').and.callThrough();

      // Act
      component.onSubmit();

      // Assert
      expect(component.isSubmitted()).toBe(true);
      expect(mockStore.dispatch).not.toHaveBeenCalled();
    });

    it('should mark all fields as touched when submitting invalid form', () => {
      // Act
      component.onSubmit();
      fixture.detectChanges();

      // Assert
      expect(component.loginForm.get('email')?.touched).toBe(true);
      expect(component.loginForm.get('password')?.touched).toBe(true);
    });

    it('should trigger form submission on submit button click', () => {
      // Arrange
      component.loginForm.patchValue({
        email: 'user@example.com',
        password: 'password123',
      });
      fixture.detectChanges();
      spyOn(component, 'onSubmit');
      const loginButton: DebugElement = fixture.debugElement.query(By.css('[data-testid="login-submit-button"]'));
      const loginButtonComponent = loginButton.injector.get(CtaButtonComponent);

      // Act
      loginButtonComponent.ctaClick.emit();

      // Assert
      expect(component.onSubmit).toHaveBeenCalled();
    });

    it('should dispatch login action when form is valid and submitted', () => {
      // Arrange
      const email = 'user@example.com';
      const password = 'password123';
      component.loginForm.patchValue({ email, password });

      // Act
      component.onSubmit();

      // Assert
      expect(mockStore.dispatch).toHaveBeenCalledWith(login({ credentials: { email, password } }));
    });

    it('should not submit when form submit event is dispatched directly', () => {
      // Arrange
      component.loginForm.patchValue({
        email: 'user@example.com',
        password: 'password123',
      });
      fixture.detectChanges();
      spyOn(component, 'onSubmit');
      const form: DebugElement = fixture.debugElement.query(By.css('[data-testid="login-form"]'));

      // Act
      form.nativeElement.dispatchEvent(new Event('submit'));

      // Assert
      expect(component.onSubmit).not.toHaveBeenCalled();
    });
  });

  describe('User Interactions', () => {
    it('should update form value when user types in email field', () => {
      // Arrange
      const emailInput: DebugElement = fixture.debugElement.query(By.css('[data-testid="login-email-input"]'));
      const testEmail = 'test@example.com';

      // Act
      emailInput.nativeElement.value = testEmail;
      emailInput.nativeElement.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      // Assert
      expect(component.loginForm.get('email')?.value).toBe(testEmail);
    });

    it('should update form value when user types in password field', () => {
      // Arrange
      const passwordInput: DebugElement = fixture.debugElement.query(By.css('[data-testid="login-password-input"]'));
      const testPassword = 'secure123';

      // Act
      passwordInput.nativeElement.value = testPassword;
      passwordInput.nativeElement.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      // Assert
      expect(component.loginForm.get('password')?.value).toBe(testPassword);
    });
  });

  describe('NgRx Integration', () => {
    it('should subscribe to auth loading state on init', () => {
      // Assert
      expect(mockStore.select).toHaveBeenCalled();
    });

    it('should display error message when auth error occurs', fakeAsync(() => {
      // Arrange
      const errorMessage = 'Invalid email or password';
      const authError: AuthError = {
        code: 'INVALID_CREDENTIALS',
        message: errorMessage,
      };

      // Act
      authErrorSubject.next(authError);
      tick();
      fixture.detectChanges();
      const errorBanner = fixture.debugElement.query(By.css('[data-testid="login-error-banner"]'));

      // Assert
      expect(component.errorMessage()).toBe(errorMessage);
      expect(errorBanner).toBeTruthy();
      expect(errorBanner.nativeElement.textContent.trim()).toContain(errorMessage);
    }));

    it('should hide error banner when no auth error', () => {
      // Arrange
      authErrorSubject.next(null);

      // Act
      fixture.detectChanges();
      const errorBanner = fixture.debugElement.query(By.css('[data-testid="login-error-banner"]'));

      // Assert
      expect(errorBanner).toBeFalsy();
    });

    it('should close dialog when authentication succeeds', fakeAsync(() => {
      // Arrange
      component.loginForm.patchValue({
        email: 'user@example.com',
        password: 'password123',
      });
      fixture.detectChanges();

      // Act
      isAuthenticatedSubject.next(true);
      tick();

      // Assert
      expect(mockDialogRef.close).toHaveBeenCalledWith({ success: true });
    }));

    it('should not close dialog when not authenticated', fakeAsync(() => {
      // Arrange
      isAuthenticatedSubject.next(false);

      // Act
      tick();

      // Assert
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    }));

    it('should dispatch clearAuthError on component destroy', () => {
      // Act
      component.ngOnDestroy();

      // Assert
      expect(mockStore.dispatch).toHaveBeenCalledWith(clearAuthError());
    });

    it('should reflect loading state from store in UI', fakeAsync(() => {
      // Arrange
      component.loginForm.patchValue({
        email: 'user@example.com',
        password: 'password123',
      });

      // Act: Set loading to true
      authLoadingSubject.next(true);
      tick();
      fixture.detectChanges();

      // Assert: Button disabled and spinner shown
      const loginButton = getCtaButtonComponent('login-submit-button');
      const loginNativeButton = getCtaNativeButton('login-submit-button');
      const spinner = getCtaButton('login-submit-button').query(By.css('[data-testid="button-loading-spinner"]'));
      expect(loginButton.disabled()).toBe(true);
      expect(loginNativeButton.disabled).toBe(true);
      expect(spinner).toBeTruthy();

      // Act: Set loading to false
      authLoadingSubject.next(false);
      tick();
      fixture.detectChanges();

      // Assert: Button enabled and spinner hidden
      const updatedButton = getCtaButtonComponent('login-submit-button');
      const updatedNativeButton = getCtaNativeButton('login-submit-button');
      const updatedSpinner = getCtaButton('login-submit-button').query(By.css('[data-testid="button-loading-spinner"]'));
      expect(updatedButton.disabled()).toBe(false);
      expect(updatedNativeButton.disabled).toBe(false);
      expect(updatedSpinner).toBeFalsy();
    }));
  });

  describe('Accessibility', () => {
    it('should have proper aria-label on password toggle button', () => {
      // Act
      const toggleButton: DebugElement = fixture.debugElement.query(By.css('[data-testid="login-password-toggle"]'));

      // Assert
      expect(toggleButton.nativeElement.getAttribute('aria-label')).toBe('Toggle password visibility');
    });

    it('should have proper button types to prevent accidental form submission', () => {
      // Act
      const forgotLink: DebugElement = fixture.debugElement.query(By.css('[data-testid="login-forgot-password-link"]'));
      const registerLink: DebugElement = fixture.debugElement.query(By.css('[data-testid="login-not-registered-link"]'));
      const toggleButton: DebugElement = fixture.debugElement.query(By.css('[data-testid="login-password-toggle"]'));
      const cancelButton = getCtaNativeButton('login-cancel-button');

      // Assert
      expect(forgotLink.nativeElement.type).toBe('button');
      expect(registerLink.nativeElement.type).toBe('button');
      expect(toggleButton.nativeElement.type).toBe('button');
      expect(cancelButton.type).toBe('button');
    });

    it('should use ctaClick instead of native submit on login button', () => {
      // Act
      const loginButton = getCtaNativeButton('login-submit-button');

      // Assert
      expect(loginButton.type).toBe('button');
    });
  });
});
