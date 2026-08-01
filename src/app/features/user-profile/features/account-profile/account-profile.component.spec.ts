import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, ParamMap } from '@angular/router';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { BehaviorSubject } from 'rxjs';
import { AccountProfileComponent } from './account-profile.component';
import {
  selectAuthLoading,
  selectPendingSignupData,
  selectPendingSignupError,
  selectPendingSignupPollingTimeout,
  selectPendingSignupState,
  selectUser,
} from '../../../../state/auth/auth.selectors';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { PendingSignupData, SignupCompletionState, User } from '../../../../services/auth/auth.types';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { loadPendingSignup, resendVerificationEmail } from '../../../../state/auth/auth.actions';

describe('AccountProfileComponent Tests', () => {
  let component: AccountProfileComponent;
  let fixture: ComponentFixture<AccountProfileComponent>;
  let store: MockStore;
  let queryParamMapSubject: BehaviorSubject<ParamMap>;

  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    emailVerified: true,
    systemRole: 'user',
    status: 'active',
    auth: {
      mfaEnabled: false,
      lastLoginAt: new Date().toISOString(),
    },
    audit: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  };

  beforeEach(async () => {
    // Create a subject to control query params
    queryParamMapSubject = new BehaviorSubject(convertToParamMap({}));

    await TestBed.configureTestingModule({
      imports: [AccountProfileComponent, NoopAnimationsModule, HttpClientTestingModule],
      providers: [
        provideMockStore({
          selectors: [
            { selector: selectUser, value: null },
            { selector: selectAuthLoading, value: false },
            { selector: selectPendingSignupState, value: 'loading' },
            { selector: selectPendingSignupData, value: null },
            { selector: selectPendingSignupError, value: null },
            { selector: selectPendingSignupPollingTimeout, value: false },
          ],
        }),
        {
          provide: ActivatedRoute,
          useValue: {
            queryParamMap: queryParamMapSubject.asObservable(),
          },
        },
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    fixture = TestBed.createComponent(AccountProfileComponent);
    component = fixture.componentInstance;
  });

  const setPendingSignupViewState = ({
    state = 'loading',
    data = null,
    error = null,
    isPollingTimeout = false,
  }: {
    readonly state?: SignupCompletionState;
    readonly data?: PendingSignupData | null;
    readonly error?: string | null;
    readonly isPollingTimeout?: boolean;
  }): void => {
    store.overrideSelector(selectPendingSignupState, state);
    store.overrideSelector(selectPendingSignupData, data);
    store.overrideSelector(selectPendingSignupError, error);
    store.overrideSelector(selectPendingSignupPollingTimeout, isPollingTimeout);
    store.refreshState();
  };

  afterEach(() => {
    fixture.destroy();
  });

  describe('Mode A - Normal Profile (no signupId)', () => {
    beforeEach(() => {
      // Set query params without signupId
      queryParamMapSubject.next(convertToParamMap({}));
    });

    it('should detect Mode A when no signupId is present', () => {
      fixture.detectChanges();
      expect(component.isSignupCompletionMode()).toBe(false);
      expect(component.signupId()).toBeNull();
    });

    it('should not dispatch loadPendingSignup action on init in Mode A', () => {
      const dispatchSpy = spyOn(store, 'dispatch');
      fixture.detectChanges();
      expect(dispatchSpy).not.toHaveBeenCalled();
    });

    it('should display normal profile mode container', () => {
      fixture.detectChanges();
      const profileMode = fixture.debugElement.query(By.css('[data-testid="normal-profile-mode"]'));
      const signupMode = fixture.debugElement.query(By.css('[data-testid="signup-completion-mode"]'));

      expect(profileMode).toBeTruthy();
      expect(signupMode).toBeNull();
    });

    it('should display loading indicator when loading is true', () => {
      store.overrideSelector(selectAuthLoading, true);
      store.refreshState();
      fixture.detectChanges();

      const loadingIndicator = fixture.debugElement.query(By.css('[data-testid="loading-indicator"]'));
      expect(loadingIndicator).toBeTruthy();
      expect(loadingIndicator.nativeElement.textContent).toContain('Loading your profile');
    });

    it('should display user info when user is loaded', () => {
      store.overrideSelector(selectUser, mockUser);
      store.overrideSelector(selectAuthLoading, false);
      store.refreshState();
      fixture.detectChanges();

      const userInfo = fixture.debugElement.query(By.css('[data-testid="user-info"]'));
      expect(userInfo).toBeTruthy();
      const emailInput = fixture.debugElement.query(By.css('[data-testid="field-email"]'));
      expect(emailInput).toBeTruthy();
      expect(emailInput.nativeElement.value).toBe(mockUser.email);
    });

    it('should render fallback values for missing profile names', () => {
      store.overrideSelector(selectUser, {
        ...mockUser,
        name: undefined,
        secondName: undefined,
      });
      store.overrideSelector(selectAuthLoading, false);
      store.refreshState();
      fixture.detectChanges();

      const firstNameInput = fixture.debugElement.query(By.css('[data-testid="field-firstName"]'));
      const surnameInput = fixture.debugElement.query(By.css('[data-testid="field-surname"]'));

      expect(firstNameInput.nativeElement.value).toBe('Not provided');
      expect(surnameInput.nativeElement.value).toBe('Not provided');
      expect(firstNameInput.nativeElement.readOnly).toBeTrue();
      expect(surnameInput.nativeElement.readOnly).toBeTrue();
    });

    it('should show verification warning and dispatch resendVerificationEmail for unverified users', () => {
      store.overrideSelector(selectUser, { ...mockUser, emailVerified: false });
      store.overrideSelector(selectAuthLoading, false);
      store.refreshState();
      const dispatchSpy = spyOn(store, 'dispatch');
      fixture.detectChanges();

      const verifyButton = fixture.debugElement.query(By.css('[data-testid="button-verify-email"]'));
      expect(fixture.nativeElement.textContent).toContain('Please, verify your email.');

      verifyButton.triggerEventHandler('ctaClick');

      expect(dispatchSpy).toHaveBeenCalledWith(resendVerificationEmail());
    });

    it('should display no user message when user is null and not loading', () => {
      store.overrideSelector(selectUser, null);
      store.overrideSelector(selectAuthLoading, false);
      store.refreshState();
      fixture.detectChanges();

      const noUser = fixture.debugElement.query(By.css('[data-testid="no-user"]'));
      expect(noUser).toBeTruthy();
      expect(noUser.nativeElement.textContent).toContain('No user data available');
    });
  });

  describe('wil-complete-signup rendering and bindings', () => {
    const testSignupId = 'test-signup-id';

    const mockSignupData: PendingSignupData = {
      status: 'paid',
      step: 'create_password',
      plan: 'personal',
      email: 'user@example.com',
      signupId: testSignupId,
    };

    beforeEach(() => {
      queryParamMapSubject.next(convertToParamMap({ signupId: testSignupId }));
    });

    it('should render wil-complete-signup when signupId query param is present', () => {
      // Arrange (done in beforeEach)
      // Act
      fixture.detectChanges();
      // Assert
      const completeSignup = fixture.debugElement.query(By.css('wil-complete-signup'));
      const normalProfile = fixture.debugElement.query(By.css('[data-testid="normal-profile-mode"]'));
      expect(completeSignup).toBeTruthy();
      expect(normalProfile).toBeNull();
    });

    it('should not render wil-complete-signup when signupId query param is absent', () => {
      // Arrange
      queryParamMapSubject.next(convertToParamMap({}));
      // Act
      fixture.detectChanges();
      // Assert
      const completeSignup = fixture.debugElement.query(By.css('wil-complete-signup'));
      expect(completeSignup).toBeNull();
    });

    it('should render waiting payment state when signupCompletionState is waiting_payment', () => {
      // Arrange
      fixture.detectChanges();
      setPendingSignupViewState({ state: 'waiting_payment' });
      // Act
      fixture.detectChanges();
      // Assert
      const waitingState = fixture.debugElement.query(By.css('[data-testid="state-waiting-payment"]'));
      expect(waitingState).toBeTruthy();
      expect(waitingState.nativeElement.textContent).toContain('waiting for payment confirmation from Stripe');
    });

    it('should render signup data in waiting payment state', () => {
      // Arrange
      fixture.detectChanges();
      setPendingSignupViewState({ state: 'waiting_payment', data: mockSignupData });
      // Act
      fixture.detectChanges();
      // Assert
      const waitingState = fixture.debugElement.query(By.css('[data-testid="state-waiting-payment"]'));
      expect(waitingState).toBeTruthy();
      expect(waitingState.nativeElement.textContent).toContain(mockSignupData.email);
      expect(waitingState.nativeElement.textContent).toContain(mockSignupData.plan);
    });

    it('should render signup error text in error state', () => {
      // Arrange
      fixture.detectChanges();
      setPendingSignupViewState({ state: 'error', error: 'Something went wrong' });
      // Act
      fixture.detectChanges();
      // Assert
      const errorState = fixture.debugElement.query(By.css('[data-testid="state-error"]'));
      expect(errorState).toBeTruthy();
      expect(errorState.nativeElement.textContent).toContain('Something went wrong');
    });

    it('should show timeout branch when isPollingTimeout is true', () => {
      // Arrange
      fixture.detectChanges();
      setPendingSignupViewState({ state: 'waiting_payment', data: mockSignupData, isPollingTimeout: true });
      // Act
      fixture.detectChanges();
      // Assert
      const checkAgainButton = fixture.debugElement.query(By.css('[data-testid="button-check-again"]'));
      const pollingIndicator = fixture.debugElement.query(By.css('[data-testid="polling-indicator"]'));
      expect(checkAgainButton).toBeTruthy();
      expect(pollingIndicator).toBeNull();
    });

    it('should show polling indicator branch when isPollingTimeout is false', () => {
      // Arrange
      fixture.detectChanges();
      setPendingSignupViewState({ state: 'waiting_payment', data: mockSignupData, isPollingTimeout: false });
      // Act
      fixture.detectChanges();
      // Assert
      const checkAgainButton = fixture.debugElement.query(By.css('[data-testid="button-check-again"]'));
      const pollingIndicator = fixture.debugElement.query(By.css('[data-testid="polling-indicator"]'));
      expect(pollingIndicator).toBeTruthy();
      expect(checkAgainButton).toBeNull();
    });

    it('should call onRetryCheck when user clicks Check Again', () => {
      // Arrange
      fixture.detectChanges();
      setPendingSignupViewState({ state: 'waiting_payment', data: mockSignupData, isPollingTimeout: true });
      fixture.detectChanges();
      const onRetryCheckSpy = spyOn(component, 'onRetryCheck');
      const checkAgainButton = fixture.debugElement.query(By.css('[data-testid="button-check-again"]'));
      // Act
      checkAgainButton.nativeElement.click();
      // Assert
      expect(onRetryCheckSpy).toHaveBeenCalledTimes(1);
    });

    it('should dispatch loadPendingSignup when retrying signup status check', () => {
      // Arrange
      const dispatchSpy = spyOn(store, 'dispatch');
      fixture.detectChanges();

      // Act
      component.onRetryCheck();

      // Assert
      expect(dispatchSpy).toHaveBeenCalledWith(loadPendingSignup({ signupId: testSignupId }));
    });

    it('should not dispatch loadPendingSignup when retrying without a valid signupId', () => {
      queryParamMapSubject.next(convertToParamMap({ signupId: '   ' }));
      const dispatchSpy = spyOn(store, 'dispatch');
      fixture.detectChanges();

      component.onRetryCheck();

      expect(dispatchSpy).not.toHaveBeenCalled();
    });
  });

  describe('Mode B - Signup Completion (with signupId)', () => {
    const testSignupId = 'signup-abc-123';

    beforeEach(() => {
      // Set query params with signupId
      queryParamMapSubject.next(convertToParamMap({ signupId: testSignupId }));
    });

    it('should detect Mode B when signupId is present', () => {
      fixture.detectChanges();
      expect(component.isSignupCompletionMode()).toBe(true);
      expect(component.signupId()).toBe(testSignupId);
    });

    it('should dispatch loadPendingSignup action on init in Mode B', () => {
      const dispatchSpy = spyOn(store, 'dispatch');
      fixture.detectChanges();
      expect(dispatchSpy).toHaveBeenCalledWith(loadPendingSignup({ signupId: testSignupId }));
    });

    it('should dispatch loadPendingSignup with a trimmed signupId on init', () => {
      queryParamMapSubject.next(convertToParamMap({ signupId: `  ${testSignupId}  ` }));
      const dispatchSpy = spyOn(store, 'dispatch');
      fixture.detectChanges();

      expect(component.signupId()).toBe(testSignupId);
      expect(dispatchSpy).toHaveBeenCalledWith(loadPendingSignup({ signupId: testSignupId }));
    });

    it('should display signup completion mode container', () => {
      fixture.detectChanges();
      const profileMode = fixture.debugElement.query(By.css('[data-testid="normal-profile-mode"]'));
      const signupMode = fixture.debugElement.query(By.css('[data-testid="signup-completion-mode"]'));

      expect(signupMode).toBeTruthy();
      expect(profileMode).toBeNull();
    });

    it('should display signup completion heading in the UI', () => {
      fixture.detectChanges();
      const signupMode = fixture.debugElement.query(By.css('[data-testid="signup-completion-mode"]'));
      expect(signupMode.nativeElement.textContent).toContain('Complete Your Account');
    });

    it('should display loading state for signup completion flow', () => {
      fixture.detectChanges();
      const loadingState = fixture.debugElement.query(By.css('[data-testid="state-loading"]'));
      expect(loadingState).toBeTruthy();
      expect(loadingState.nativeElement.textContent).toContain('Loading your signup information...');
    });
  });

  describe('Mode Switching', () => {
    it('should render signup shell when signupId is added after init without dispatching a pending signup load', () => {
      // Start with Mode A
      queryParamMapSubject.next(convertToParamMap({}));
      const dispatchSpy = spyOn(store, 'dispatch');
      fixture.detectChanges();

      expect(component.isSignupCompletionMode()).toBe(false);
      let profileMode = fixture.debugElement.query(By.css('[data-testid="normal-profile-mode"]'));
      expect(profileMode).toBeTruthy();

      // Switch to Mode B
      queryParamMapSubject.next(convertToParamMap({ signupId: 'new-signup-id' }));
      fixture.detectChanges();

      expect(component.isSignupCompletionMode()).toBe(true);
      const signupMode = fixture.debugElement.query(By.css('[data-testid="signup-completion-mode"]'));
      expect(signupMode).toBeTruthy();
      profileMode = fixture.debugElement.query(By.css('[data-testid="normal-profile-mode"]'));
      expect(profileMode).toBeNull();
      expect(dispatchSpy).not.toHaveBeenCalled();
    });

    it('should render normal profile mode when signupId is removed from query params', () => {
      // Start with Mode B
      queryParamMapSubject.next(convertToParamMap({ signupId: 'test-signup-id' }));
      fixture.detectChanges();

      expect(component.isSignupCompletionMode()).toBe(true);
      let signupMode = fixture.debugElement.query(By.css('[data-testid="signup-completion-mode"]'));
      expect(signupMode).toBeTruthy();

      // Switch to Mode A
      queryParamMapSubject.next(convertToParamMap({}));
      fixture.detectChanges();

      expect(component.isSignupCompletionMode()).toBe(false);
      const profileMode = fixture.debugElement.query(By.css('[data-testid="normal-profile-mode"]'));
      expect(profileMode).toBeTruthy();
      signupMode = fixture.debugElement.query(By.css('[data-testid="signup-completion-mode"]'));
      expect(signupMode).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty signupId as invalid signup completion mode', () => {
      const dispatchSpy = spyOn(store, 'dispatch');
      queryParamMapSubject.next(convertToParamMap({ signupId: '' }));
      fixture.detectChanges();

      expect(component.isSignupCompletionMode()).toBe(false);
      expect(component.signupId()).toBeNull();
      expect(dispatchSpy).not.toHaveBeenCalled();
    });

    it('should handle whitespace-only signupId as invalid signup completion mode', () => {
      const dispatchSpy = spyOn(store, 'dispatch');
      queryParamMapSubject.next(convertToParamMap({ signupId: '   ' }));
      fixture.detectChanges();

      expect(component.isSignupCompletionMode()).toBe(false);
      expect(component.signupId()).toBeNull();
      expect(dispatchSpy).not.toHaveBeenCalled();
    });

    it('should handle multiple query params correctly', () => {
      queryParamMapSubject.next(convertToParamMap({ signupId: 'test-id', other: 'value' }));
      fixture.detectChanges();

      expect(component.isSignupCompletionMode()).toBe(true);
      expect(component.signupId()).toBe('test-id');
    });
  });
});
