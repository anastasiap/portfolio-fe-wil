import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap, ParamMap, Router } from '@angular/router';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { BehaviorSubject } from 'rxjs';

import * as AuthActions from '../../state/auth/auth.actions';
import { initialAuthState } from '../../state/auth/auth.reducer';
import { ResetPasswordComponent } from './reset-password.component';

@Component({ selector: 'wil-reset-password-form', standalone: true, template: '' })
class ResetPasswordFormStubComponent {
  @Input() public token: string | null = null;

  @Output() public readonly goHome = new EventEmitter<void>();
}

@Component({ selector: 'wil-cta-button', standalone: true, template: '<button type="button" (click)="ctaClick.emit()">{{ ctaText }}</button>' })
class CtaButtonStubComponent {
  @Input() public ctaText = '';
  @Input() public style: 'primary' | 'secondary' | 'warn' = 'primary';
  @Input() public size: 'small' | 'large' | 'full' = 'large';

  @Output() public readonly ctaClick = new EventEmitter<void>();
}

describe('ResetPasswordComponent', () => {
  let fixture: ComponentFixture<ResetPasswordComponent>;
  let mockStore: MockStore;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockRouter: jasmine.SpyObj<Router>;
  let queryParamMapSubject: BehaviorSubject<ParamMap>;

  async function setup(token: string | null = 'reset-token'): Promise<void> {
    queryParamMapSubject = new BehaviorSubject(convertToParamMap(token ? { token } : {}));
    mockDialog = jasmine.createSpyObj<MatDialog>('MatDialog', ['open']);
    mockRouter = jasmine.createSpyObj<Router>('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [ResetPasswordComponent, NoopAnimationsModule],
      providers: [
        provideMockStore({
          initialState: {
            auth: initialAuthState,
          },
        }),
        { provide: ActivatedRoute, useValue: { queryParamMap: queryParamMapSubject.asObservable() } },
        { provide: Router, useValue: mockRouter },
        { provide: MatDialog, useValue: mockDialog },
      ],
    })
      .overrideComponent(ResetPasswordComponent, {
        set: {
          imports: [CommonModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, ResetPasswordFormStubComponent, CtaButtonStubComponent],
        },
      })
      .compileComponents();

    mockStore = TestBed.inject(MockStore);
    fixture = TestBed.createComponent(ResetPasswordComponent);
    fixture.detectChanges();
  }

  function setAuthActionState(lastAction: object, error: object | null = null): void {
    mockStore.setState({
      auth: {
        ...initialAuthState,
        lastAction,
        error,
      },
    });
    mockStore.refreshState();
    fixture.detectChanges();
  }

  describe('template states', () => {
    it('should render the reset form when the route has a token', async () => {
      // Arrange & Act
      await setup('valid-token');
      const formState = fixture.debugElement.query(By.css('[data-testid="form-state"]'));
      const formComponent = fixture.debugElement.query(By.css('wil-reset-password-form'));

      // Assert
      expect(formState).toBeTruthy();
      expect(formComponent).toBeTruthy();
      expect(formComponent.componentInstance.token).toBe('valid-token');
    });

    it('should render the invalid token state when the route has no token', async () => {
      // Arrange & Act
      await setup(null);
      const invalidTokenState = fixture.debugElement.query(By.css('[data-testid="invalid-token-state"]'));
      const formState = fixture.debugElement.query(By.css('[data-testid="form-state"]'));

      // Assert
      expect(invalidTokenState).toBeTruthy();
      expect(invalidTokenState.nativeElement.textContent).toContain('Invalid or Expired Link');
      expect(formState).toBeFalsy();
    });

    it('should render the success state after reset password succeeds', async () => {
      // Arrange
      await setup('valid-token');

      // Act
      setAuthActionState({ type: AuthActions.resetPasswordSuccess.type, timestamp: Date.now() });
      const successState = fixture.debugElement.query(By.css('[data-testid="success-state"]'));
      const formState = fixture.debugElement.query(By.css('[data-testid="form-state"]'));
      const loginButton = fixture.debugElement.query(By.css('[data-testid="reset-password-page-go-to-login-button"]'));

      // Assert
      expect(successState).toBeTruthy();
      expect(successState.nativeElement.textContent).toContain('Password Reset Successfully');
      expect(formState).toBeFalsy();
      expect(loginButton.componentInstance.ctaText).toBe('Go to Login');
    });

    it('should render the generic error state after reset password fails for a non-token error', async () => {
      // Arrange
      await setup('valid-token');

      // Act
      setAuthActionState({ type: AuthActions.resetPasswordFailure.type, timestamp: Date.now() }, { message: 'Server error', statusCode: 500 });
      const errorState = fixture.debugElement.query(By.css('[data-testid="error-state"]'));
      const retryButton = fixture.debugElement.query(By.css('[data-testid="reset-password-page-retry-button"]'));

      // Assert
      expect(errorState).toBeTruthy();
      expect(errorState.nativeElement.textContent).toContain('Something Went Wrong');
      expect(errorState.nativeElement.textContent).toContain('Please try again or request a new reset link');
      expect(retryButton.componentInstance.ctaText).toBe('Try Again');
    });

    it('should render the invalid token state after reset password fails with a token error', async () => {
      // Arrange
      await setup('valid-token');

      // Act
      setAuthActionState({ type: AuthActions.resetPasswordFailure.type, timestamp: Date.now() }, { message: 'Invalid token', statusCode: 400 });
      const invalidTokenState = fixture.debugElement.query(By.css('[data-testid="invalid-token-state"]'));
      const errorState = fixture.debugElement.query(By.css('[data-testid="error-state"]'));

      // Assert
      expect(invalidTokenState).toBeTruthy();
      expect(invalidTokenState.nativeElement.textContent).toContain('Invalid or Expired Link');
      expect(errorState).toBeFalsy();
    });
  });

  describe('template actions', () => {
    it('should open the login dialog when the success login button is clicked', async () => {
      // Arrange
      await setup('valid-token');
      setAuthActionState({ type: AuthActions.resetPasswordSuccess.type, timestamp: Date.now() });
      const loginButton = fixture.debugElement.query(By.css('[data-testid="reset-password-page-go-to-login-button"]'));

      // Act
      loginButton.triggerEventHandler('ctaClick');

      // Assert
      expect(mockDialog.open).toHaveBeenCalledWith(jasmine.any(Function), {
        data: { initialView: 'login' },
        autoFocus: false,
        disableClose: false,
        panelClass: 'modal-panel',
      });
    });

    it('should open the forgot password dialog when the invalid token request link button is clicked', async () => {
      // Arrange
      await setup(null);
      const requestNewLinkButton = fixture.debugElement.query(By.css('[data-testid="reset-password-page-request-new-link-button"]'));

      // Act
      requestNewLinkButton.triggerEventHandler('ctaClick');

      // Assert
      expect(mockDialog.open).toHaveBeenCalledWith(jasmine.any(Function), {
        data: { initialView: 'forgotPassword' },
        width: '480px',
        maxWidth: '90vw',
        autoFocus: false,
        disableClose: false,
        panelClass: 'modal-panel',
      });
    });

    it('should navigate home when the invalid token back home button is clicked', async () => {
      // Arrange
      await setup(null);
      const backHomeButton = fixture.debugElement.query(By.css('[data-testid="invalid-back-to-home-button"]'));

      // Act
      backHomeButton.nativeElement.click();
      fixture.detectChanges();

      // Assert
      expect(mockRouter.navigate).toHaveBeenCalledOnceWith(['/']);
    });

    it('should return from the error state to the form when the retry button is clicked', async () => {
      // Arrange
      await setup('valid-token');
      setAuthActionState({ type: AuthActions.resetPasswordFailure.type, timestamp: Date.now() }, { message: 'Server error', statusCode: 500 });
      const retryButton = fixture.debugElement.query(By.css('[data-testid="reset-password-page-retry-button"]'));

      // Act
      retryButton.triggerEventHandler('ctaClick');
      fixture.detectChanges();
      const formState = fixture.debugElement.query(By.css('[data-testid="form-state"]'));
      const errorState = fixture.debugElement.query(By.css('[data-testid="error-state"]'));

      // Assert
      expect(formState).toBeTruthy();
      expect(errorState).toBeFalsy();
    });
  });
});
