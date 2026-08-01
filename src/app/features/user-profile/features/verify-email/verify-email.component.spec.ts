import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { Action, Store } from '@ngrx/store';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { BehaviorSubject, Observable, UnaryFunction } from 'rxjs';
import { map } from 'rxjs/operators';
import { By } from '@angular/platform-browser';

import { VerifyEmailComponent } from './verify-email.component';
import * as AuthActions from '../../../../state/auth/auth.actions';
import { AuthError } from '../../../../services/auth/auth.types';
import { PERSONAL_HOME_ROUTE } from '../../../../../configs/routes.config';

interface MockAuthState {
  readonly lastAction: (Action & { readonly error?: AuthError }) | null;
  readonly error?: AuthError | null;
  readonly isAuthenticated: boolean;
}

interface MockRootState {
  readonly auth: MockAuthState;
}

class MockStore {
  private readonly stateSubject = new BehaviorSubject<MockRootState>({
    auth: {
      lastAction: null,
      error: null,
      isAuthenticated: true,
    },
  });

  dispatch = jasmine.createSpy('dispatch');

  select = jasmine
    .createSpy('select')
    .and.callFake((selector: (state: MockRootState) => unknown) => this.stateSubject.asObservable().pipe(map((state) => selector(state))));

  pipe = jasmine.createSpy('pipe').and.callFake((...operators: UnaryFunction<Observable<unknown>, Observable<unknown>>[]) => {
    const source$: Observable<unknown> = this.stateSubject.asObservable();
    return operators.reduce((current$, operator) => operator(current$), source$);
  });

  mockAction(action: Action & { readonly error?: AuthError }): void {
    this.stateSubject.next({
      auth: {
        lastAction: action,
        error: action.type === AuthActions.verifyEmailFailure.type ? action.error : null,
        isAuthenticated: true,
      },
    });
  }
}

class MockRouter {
  navigate = jasmine.createSpy('navigate').and.returnValue(Promise.resolve(true));
}

class MockActivatedRoute {
  private readonly queryParamMapSubject = new BehaviorSubject(new Map([['token', 'test-token-123']]));
  queryParamMap = this.queryParamMapSubject.asObservable();

  setToken(token: string | null): void {
    const paramMap = new Map();
    if (token !== null) {
      paramMap.set('token', token);
    }
    this.queryParamMapSubject.next(paramMap);
  }
}

describe('VerifyEmailComponent', () => {
  let component: VerifyEmailComponent;
  let fixture: ComponentFixture<VerifyEmailComponent>;
  let mockStore: MockStore;
  let mockRouter: MockRouter;
  let mockRoute: MockActivatedRoute;

  beforeEach(async () => {
    mockStore = new MockStore();
    mockRouter = new MockRouter();
    mockRoute = new MockActivatedRoute();

    await TestBed.configureTestingModule({
      imports: [VerifyEmailComponent, NoopAnimationsModule],
      providers: [
        { provide: Store, useValue: mockStore },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockRoute },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(VerifyEmailComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Component initialization', () => {
    it('should show verifying state initially with valid token', () => {
      // Arrange
      mockRoute.setToken('valid-token');

      // Act
      fixture.detectChanges();

      // Assert
      expect(component.verificationViewModel().state).toBe('verifying');
      expect(component.token()).toBe('valid-token');

      const loadingElement = fixture.debugElement.query(By.css('[data-testid="verification-loading"]'));
      expect(loadingElement).toBeTruthy();
    });

    it('should show error state when token is missing', () => {
      // Arrange
      mockRoute.setToken(null);

      // Act
      fixture.detectChanges();

      // Assert
      expect(component.verificationViewModel().state).toBe('error');
      expect(component.verificationViewModel().message).toBe('Invalid verification link - missing token');

      const errorElement = fixture.debugElement.query(By.css('[data-testid="verification-error"]'));
      expect(errorElement).toBeTruthy();
    });

    it('should dispatch verifyEmail action with token on initialization', () => {
      // Arrange
      mockRoute.setToken('test-token-123');

      // Act
      fixture.detectChanges();

      // Assert
      expect(mockStore.dispatch).toHaveBeenCalledWith(AuthActions.verifyEmail({ token: 'test-token-123' }));
    });
  });

  describe('Verification success flow', () => {
    beforeEach(() => {
      mockRoute.setToken('valid-token');
      fixture.detectChanges();
    });

    it('should show success state when verification succeeds', fakeAsync(() => {
      // Arrange - component is in verifying state
      expect(component.verificationViewModel().state).toBe('verifying');

      // Act
      mockStore.mockAction({ type: AuthActions.verifyEmailSuccess.type });
      tick();
      fixture.detectChanges();

      // Assert
      expect(component.verificationViewModel().state).toBe('success');

      const successElement = fixture.debugElement.query(By.css('[data-testid="verification-success"]'));
      expect(successElement).toBeTruthy();

      const titleElement = successElement.query(By.css('.verify-email__title'));
      expect(titleElement.nativeElement.textContent.trim()).toBe('Email Verified Successfully!');
    }));

    it('should show success actions buttons', fakeAsync(() => {
      // Arrange
      mockStore.mockAction({ type: AuthActions.verifyEmailSuccess.type });
      tick();
      fixture.detectChanges();

      // Act & Assert
      const profileButton = fixture.debugElement.query(By.css('[data-testid="button-go-to-profile"]'));
      const homeButton = fixture.debugElement.query(By.css('[data-testid="button-go-to-home"]'));

      expect(profileButton).toBeTruthy();
      expect(homeButton).toBeTruthy();
    }));

    it('should navigate to profile when profile button is clicked', fakeAsync(() => {
      // Arrange
      mockStore.mockAction({ type: AuthActions.verifyEmailSuccess.type });
      tick();
      fixture.detectChanges();

      // Act
      const profileButton = fixture.debugElement.query(By.css('[data-testid="button-go-to-profile"]'));
      profileButton.triggerEventHandler('ctaClick', null);

      // Assert
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/account/profile']);
    }));

    it('should navigate to home when home button is clicked', fakeAsync(() => {
      // Arrange
      mockStore.mockAction({ type: AuthActions.verifyEmailSuccess.type });
      tick();
      fixture.detectChanges();

      // Act
      const homeButton = fixture.debugElement.query(By.css('[data-testid="button-go-to-home"]'));
      homeButton.triggerEventHandler('ctaClick', null);

      // Assert
      expect(mockRouter.navigate).toHaveBeenCalledWith([`/${PERSONAL_HOME_ROUTE}`]);
    }));
  });

  describe('Verification failure flow', () => {
    beforeEach(() => {
      mockRoute.setToken('invalid-token');
      fixture.detectChanges();
    });

    it('should show error state when verification fails', fakeAsync(() => {
      // Arrange
      const errorAction = {
        type: AuthActions.verifyEmailFailure.type,
        error: { message: 'Invalid or expired verification link.' },
      };

      // Act
      mockStore.mockAction(errorAction);
      tick();
      fixture.detectChanges();

      // Assert
      expect(component.verificationViewModel().state).toBe('error');
      expect(component.verificationViewModel().message).toBe('Invalid or expired verification link.');

      const errorElement = fixture.debugElement.query(By.css('[data-testid="verification-error"]'));
      expect(errorElement).toBeTruthy();
    }));

    it('should show error message in the UI', fakeAsync(() => {
      // Arrange
      const errorMessage = 'Custom error message';
      const errorAction = {
        type: AuthActions.verifyEmailFailure.type,
        error: { message: errorMessage },
      };

      // Act
      mockStore.mockAction(errorAction);
      tick();
      fixture.detectChanges();

      // Assert
      const messageElement = fixture.debugElement.query(By.css('.verify-email__message'));
      expect(messageElement.nativeElement.textContent.trim()).toBe(errorMessage);
    }));

    it('should show resend verification button on error', fakeAsync(() => {
      // Arrange
      const errorAction = {
        type: AuthActions.verifyEmailFailure.type,
        error: { message: 'Error message' },
      };

      // Act
      mockStore.mockAction(errorAction);
      tick();
      fixture.detectChanges();

      // Assert
      const resendButton = fixture.debugElement.query(By.css('[data-testid="button-resend-verification"]'));
      expect(resendButton).toBeTruthy();
    }));

    it('should dispatch resendVerificationEmail action when resend button is clicked', fakeAsync(() => {
      // Arrange
      const errorAction = {
        type: AuthActions.verifyEmailFailure.type,
        error: { message: 'Error message' },
      };
      mockStore.mockAction(errorAction);
      tick();
      fixture.detectChanges();

      // Act
      const resendButton = fixture.debugElement.query(By.css('[data-testid="button-resend-verification"]'));
      resendButton.triggerEventHandler('ctaClick', null);

      // Assert
      expect(mockStore.dispatch).toHaveBeenCalledWith(AuthActions.resendVerificationEmail());
    }));

    it('should navigate to home when home button is clicked in error state', fakeAsync(() => {
      // Arrange
      const errorAction = {
        type: AuthActions.verifyEmailFailure.type,
        error: { message: 'Error message' },
      };
      mockStore.mockAction(errorAction);
      tick();
      fixture.detectChanges();

      // Act
      const homeButton = fixture.debugElement.query(By.css('[data-testid="button-go-to-home-error"]'));
      homeButton.triggerEventHandler('ctaClick', null);

      // Assert
      expect(mockRouter.navigate).toHaveBeenCalledWith([`/${PERSONAL_HOME_ROUTE}`]);
    }));
  });

  describe('Token handling', () => {
    it('should handle empty token parameter', () => {
      // Arrange
      mockRoute.setToken('');

      // Act
      fixture.detectChanges();

      // Assert
      expect(component.verificationViewModel().state).toBe('error');
      expect(component.verificationViewModel().message).toBe('Invalid verification link - missing token');
    });

    it('should handle null token parameter', () => {
      // Arrange
      mockRoute.setToken(null);

      // Act
      fixture.detectChanges();

      // Assert
      expect(component.verificationViewModel().state).toBe('error');
      expect(component.verificationViewModel().message).toBe('Invalid verification link - missing token');
    });
  });

  describe('Public methods', () => {
    it('should navigate to profile when navigateToProfile is called', () => {
      // Act
      component.navigateToProfile();

      // Assert
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/account/profile']);
    });

    it('should navigate to home when navigateToHome is called', () => {
      // Act
      component.navigateToHome();

      // Assert
      expect(mockRouter.navigate).toHaveBeenCalledWith([`/${PERSONAL_HOME_ROUTE}`]);
    });

    it('should dispatch resend action when onResendVerification is called', () => {
      // Act
      component.onResendVerification();

      // Assert
      expect(mockStore.dispatch).toHaveBeenCalledWith(AuthActions.resendVerificationEmail());
    });
  });

  describe('UI state rendering', () => {
    it('should display loading spinner in verifying state', () => {
      // Arrange
      component.verificationViewModel.set({ state: 'verifying', message: '' });

      // Act
      fixture.detectChanges();

      // Assert
      const spinner = fixture.debugElement.query(By.css('mat-progress-spinner'));
      expect(spinner).toBeTruthy();
    });

    it('should display success icon in success state', () => {
      // Arrange
      component.verificationViewModel.set({ state: 'success', message: '' });

      // Act
      fixture.detectChanges();

      // Assert
      const successIcon = fixture.debugElement.query(By.css('.verify-email__icon--success'));
      expect(successIcon).toBeTruthy();
      expect(successIcon.nativeElement.textContent.trim()).toBe('check_circle');
    });

    it('should display error icon in error state', () => {
      // Arrange
      component.verificationViewModel.set({ state: 'error', message: 'Test error' });

      // Act
      fixture.detectChanges();

      // Assert
      const errorIcon = fixture.debugElement.query(By.css('.verify-email__icon--error'));
      expect(errorIcon).toBeTruthy();
      expect(errorIcon.nativeElement.textContent.trim()).toBe('error');
    });
  });
});
