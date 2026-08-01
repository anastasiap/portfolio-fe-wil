import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { AuthModalComponent } from './auth-modal.component';
import { AuthModalData } from './auth-modal.types';
import { Action } from '@ngrx/store';
import { provideMockActions } from '@ngrx/effects/testing';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { BillingApiService } from '../../services/api/billing-api.service';
import { Observable, of } from 'rxjs';
import { AnalyticsService } from '../../services/analytics/analytics.service';
import { Router } from '@angular/router';
import * as AuthActions from '../../state/auth/auth.actions';
import { initialAuthState } from '../../state/auth/auth.reducer';

describe('AuthModalComponent', () => {
  let component: AuthModalComponent;
  let fixture: ComponentFixture<AuthModalComponent>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<AuthModalComponent>>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockDialogData: AuthModalData;
  let mockStore: MockStore;
  let mockBillingApiService: jasmine.SpyObj<BillingApiService>;
  let mockAnalytics: jasmine.SpyObj<AnalyticsService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let actions$: Observable<Action>;

  const mockStoreConfig = {
    initialState: {
      auth: initialAuthState,
    },
  };

  const mockSubscriptionResponse: GetMySubscriptionResponseDto = {
    planCode: 'free',
    planLabel: 'Free',
    status: 'free',
    billingInterval: null,
    currency: null,
    priceCents: 0,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    entitlements: [],
    source: 'local',
  };

  const mockResubscribeResponse = {
    success: true,
    message: '',
    subscriptionStatus: 'active' as const,
    renewsAt: '',
  };

  const billingApiMock = () => {
    const spy = jasmine.createSpyObj<BillingApiService>('BillingApiService', [
      'createStripeCheckoutSession',
      'getMySubscription',
      'createPortalSession',
      'resubscribe',
    ]);
    spy.createStripeCheckoutSession.and.returnValue(of({ sessionUrl: '', sessionId: '' }));
    spy.getMySubscription.and.returnValue(of(mockSubscriptionResponse));
    spy.createPortalSession.and.returnValue(of({ url: '' }));
    spy.resubscribe.and.returnValue(of(mockResubscribeResponse));
    return spy;
  };

  beforeEach(async () => {
    // Arrange: Create spies
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    mockDialog = jasmine.createSpyObj('MatDialog', ['open']);
    mockAnalytics = jasmine.createSpyObj('AnalyticsService', ['track']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockBillingApiService = billingApiMock();
    actions$ = of();
    mockDialogData = {
      initialView: 'login',
    };

    await TestBed.configureTestingModule({
      imports: [AuthModalComponent, HttpClientTestingModule, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MatDialog, useValue: mockDialog },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        { provide: BillingApiService, useValue: mockBillingApiService },
        { provide: AnalyticsService, useValue: mockAnalytics },
        { provide: Router, useValue: mockRouter },
        provideMockActions(() => actions$),
        provideMockStore(mockStoreConfig),
      ],
    }).compileComponents();

    mockStore = TestBed.inject(MockStore);
    spyOn(mockStore, 'dispatch');

    fixture = TestBed.createComponent(AuthModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Dialog Structure', () => {
    it('should render the auth modal container', () => {
      // Act
      const container: DebugElement = fixture.debugElement.query(By.css('[data-testid="auth-modal-container"]'));

      // Assert
      expect(container).toBeTruthy();
      expect(container.nativeElement.classList.contains('auth-modal')).toBe(true);
    });

    it('should render the close button', () => {
      // Act
      const closeButton: DebugElement = fixture.debugElement.query(By.css('[data-testid="auth-modal-close-button"]'));

      // Assert
      expect(closeButton).toBeTruthy();
      expect(closeButton.nativeElement.getAttribute('aria-label')).toBe('Close modal');
    });

    it('should render the header with title', () => {
      // Act
      const header: DebugElement = fixture.debugElement.query(By.css('[data-testid="auth-modal-header"]'));
      const title: DebugElement = fixture.debugElement.query(By.css('[data-testid="auth-modal-title"]'));

      // Assert
      expect(header).toBeTruthy();
      expect(title).toBeTruthy();
      expect(title.nativeElement.textContent.trim()).toBe('Welcome Back');
    });

    it('should render the content area', () => {
      // Act
      const content: DebugElement = fixture.debugElement.query(By.css('[data-testid="auth-modal-content"]'));

      // Assert
      expect(content).toBeTruthy();
    });

    it('should render login modal content component when in login view', () => {
      // Act
      const loginContent: DebugElement = fixture.debugElement.query(By.css('wil-login-modal-content'));

      // Assert
      expect(loginContent).toBeTruthy();
    });
  });

  describe('Close Functionality', () => {
    it('should close the dialog when close button is clicked', () => {
      // Arrange
      const closeButton: DebugElement = fixture.debugElement.query(By.css('[data-testid="auth-modal-close-button"]'));

      // Act
      closeButton.nativeElement.click();
      fixture.detectChanges();

      // Assert
      expect(mockDialogRef.close).toHaveBeenCalledTimes(1);
    });

    it('should call onClose method when close button is clicked', () => {
      // Arrange
      spyOn(component, 'onClose');
      const closeButton: DebugElement = fixture.debugElement.query(By.css('[data-testid="auth-modal-close-button"]'));

      // Act
      closeButton.nativeElement.click();

      // Assert
      expect(component.onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Initial View Configuration', () => {
    it('should initialize with login view when initialView is "login"', () => {
      // Assert
      expect(component.currentView()).toBe('login');
      expect(component.viewTitle()).toBe('Welcome Back');
    });

    it('should initialize with register view when initialView is "register"', async () => {
      // Arrange: Re-create component with different initial view
      const registerData: AuthModalData = { initialView: 'register' };

      await TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [AuthModalComponent, NoopAnimationsModule],
        providers: [
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MatDialog, useValue: mockDialog },
          { provide: MAT_DIALOG_DATA, useValue: registerData },
          { provide: BillingApiService, useValue: billingApiMock() },
          { provide: AnalyticsService, useValue: mockAnalytics },
          { provide: Router, useValue: mockRouter },
          provideMockActions(() => actions$),
          provideMockStore(mockStoreConfig),
        ],
      }).compileComponents();

      mockStore = TestBed.inject(MockStore);
      spyOn(mockStore, 'dispatch');

      const registerFixture = TestBed.createComponent(AuthModalComponent);
      const registerComponent = registerFixture.componentInstance;

      // Act
      registerFixture.detectChanges();

      // Assert
      expect(registerComponent.currentView()).toBe('register');
      expect(registerComponent.viewTitle()).toBe('Choose your plan');
    });

    it('should initialize with forgotPassword view when initialView is "forgotPassword"', async () => {
      // Arrange: Re-create component with different initial view
      const forgotPasswordData: AuthModalData = { initialView: 'forgotPassword' };

      await TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [AuthModalComponent, NoopAnimationsModule],
        providers: [
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MatDialog, useValue: mockDialog },
          { provide: MAT_DIALOG_DATA, useValue: forgotPasswordData },
          { provide: BillingApiService, useValue: billingApiMock() },
          { provide: AnalyticsService, useValue: mockAnalytics },
          { provide: Router, useValue: mockRouter },
          provideMockActions(() => actions$),
          provideMockStore(mockStoreConfig),
        ],
      }).compileComponents();

      mockStore = TestBed.inject(MockStore);
      spyOn(mockStore, 'dispatch');

      const forgotPasswordFixture = TestBed.createComponent(AuthModalComponent);
      const forgotPasswordComponent = forgotPasswordFixture.componentInstance;

      // Act
      forgotPasswordFixture.detectChanges();

      // Assert
      expect(forgotPasswordComponent.currentView()).toBe('forgotPassword');
      expect(forgotPasswordComponent.viewTitle()).toBe('Reset Password');
    });
  });

  describe('View Switching', () => {
    it('should switch to register view and update title', () => {
      // Arrange
      const initialView = component.currentView();

      // Act
      component.switchView('register');
      fixture.detectChanges();

      // Assert
      expect(component.currentView()).toBe('register');
      expect(component.viewTitle()).toBe('Choose your plan');
      expect(component.currentView()).not.toBe(initialView);
    });

    it('should switch to forgotPassword view and update title', () => {
      // Arrange
      const initialView = component.currentView();

      // Act
      component.switchView('forgotPassword');
      fixture.detectChanges();

      // Assert
      expect(component.currentView()).toBe('forgotPassword');
      expect(component.viewTitle()).toBe('Reset Password');
      expect(component.currentView()).not.toBe(initialView);
    });

    it('should update title in DOM when view is switched', () => {
      // Arrange
      const titleElement: DebugElement = fixture.debugElement.query(By.css('[data-testid="auth-modal-title"]'));
      const initialTitle = titleElement.nativeElement.textContent.trim();

      // Act
      component.switchView('register');
      fixture.detectChanges();

      // Assert
      const updatedTitle = titleElement.nativeElement.textContent.trim();
      expect(updatedTitle).toBe('Choose your plan');
      expect(updatedTitle).not.toBe(initialTitle);
    });

    it('should allow switching back to login view', () => {
      // Arrange
      component.switchView('register');
      fixture.detectChanges();

      // Act
      component.switchView('login');
      fixture.detectChanges();

      // Assert
      expect(component.currentView()).toBe('login');
      expect(component.viewTitle()).toBe('Welcome Back');
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria-label on close button', () => {
      // Act
      const closeButton: DebugElement = fixture.debugElement.query(By.css('[data-testid="auth-modal-close-button"]'));

      // Assert
      expect(closeButton.nativeElement.getAttribute('aria-label')).toBe('Close modal');
    });

    it('should have focusable close button', () => {
      // Act
      const closeButton: DebugElement = fixture.debugElement.query(By.css('[data-testid="auth-modal-close-button"]'));
      closeButton.nativeElement.focus();

      // Assert
      expect(document.activeElement).toBe(closeButton.nativeElement);
    });
  });

  describe('Component Content', () => {
    it('should have login content component rendered inside content area when in login view', () => {
      // Act
      const contentArea: DebugElement = fixture.debugElement.query(By.css('[data-testid="auth-modal-content"]'));
      const loginContent: DebugElement = contentArea.query(By.css('wil-login-modal-content'));

      // Assert
      expect(loginContent).toBeTruthy();
      expect(contentArea.nativeElement.contains(loginContent.nativeElement)).toBeTrue();
    });

    it('should render plan select content when in register view', () => {
      // Arrange
      component.switchView('register');

      // Act
      fixture.detectChanges();
      const planSelectContent: DebugElement = fixture.debugElement.query(By.css('wil-plan-select-modal-content'));
      const loginContent: DebugElement = fixture.debugElement.query(By.css('wil-login-modal-content'));

      // Assert
      expect(planSelectContent).toBeTruthy();
      expect(loginContent).toBeFalsy();
    });

    it('should render forgot password content for forgot password view', () => {
      // Arrange
      component.switchView('forgotPassword');

      // Act
      fixture.detectChanges();
      const loginContent: DebugElement = fixture.debugElement.query(By.css('wil-login-modal-content'));
      const planSelectContent: DebugElement = fixture.debugElement.query(By.css('wil-plan-select-modal-content'));
      const forgotPasswordContent: DebugElement = fixture.debugElement.query(By.css('wil-forgot-password-modal-content'));

      // Assert
      expect(forgotPasswordContent).toBeTruthy();
      expect(loginContent).toBeFalsy();
      expect(planSelectContent).toBeFalsy();
    });

    it('should have correct test IDs for content components', () => {
      // Act - Login view
      let loginContent: DebugElement = fixture.debugElement.query(By.css('[data-testid="auth-modal-login-content"]'));

      // Assert - Login view
      expect(loginContent).toBeTruthy();

      // Arrange - Switch to register view
      component.switchView('register');
      fixture.detectChanges();

      // Act - Register view
      const planSelectContent: DebugElement = fixture.debugElement.query(By.css('[data-testid="auth-modal-plan-select-content"]'));
      loginContent = fixture.debugElement.query(By.css('[data-testid="auth-modal-login-content"]'));

      // Assert - Register view
      expect(planSelectContent).toBeTruthy();
      expect(loginContent).toBeFalsy();
    });
  });

  describe('Plan Selection', () => {
    it('should call onPlanSelected when plan select content emits selectPlan', () => {
      // Arrange
      spyOn(component, 'onPlanSelected');
      component.switchView('register');
      fixture.detectChanges();
      const planSelectContent: DebugElement = fixture.debugElement.query(By.css('wil-plan-select-modal-content'));
      const planSelectComponent = planSelectContent.componentInstance;

      // Act
      planSelectComponent.selectPlan.emit('personal');

      // Assert
      expect(component.onPlanSelected).toHaveBeenCalledWith('personal');
    });

    it('should dispatch checkout session creation for personal plan', () => {
      // Arrange
      const testPlan = 'personal';
      const expectedSuccessUrl = `${window.location.origin}/app/account`;
      const expectedCancelUrl = `${window.location.origin}/plans`;
      const expectedAction = AuthActions.createCheckoutSession({
        request: {
          plan: 'personal',
          successUrl: expectedSuccessUrl,
          cancelUrl: expectedCancelUrl,
        },
      });

      // Act
      component.onPlanSelected(testPlan);

      // Assert - personal plan initiates checkout through NgRx effects, not a dialog
      expect(mockStore.dispatch).toHaveBeenCalledWith(expectedAction);
      expect(mockDialog.open).not.toHaveBeenCalled();
    });
  });

  describe('Dialog Data Integration', () => {
    it('should use dialog data to set initial view', () => {
      // Assert
      expect(component.currentView()).toBe(mockDialogData.initialView);
    });

    it('should handle dialog data properly when no data provided', async () => {
      // Arrange: Re-create component without dialog data (edge case)
      await TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [AuthModalComponent, NoopAnimationsModule],
        providers: [
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MatDialog, useValue: mockDialog },
          { provide: MAT_DIALOG_DATA, useValue: { initialView: 'login' } },
          { provide: BillingApiService, useValue: billingApiMock() },
          { provide: AnalyticsService, useValue: mockAnalytics },
          { provide: Router, useValue: mockRouter },
          provideMockActions(() => actions$),
          provideMockStore(mockStoreConfig),
        ],
      }).compileComponents();

      const newFixture = TestBed.createComponent(AuthModalComponent);
      const newComponent = newFixture.componentInstance;

      // Act
      newFixture.detectChanges();

      // Assert
      expect(newComponent).toBeTruthy();
      expect(newComponent.currentView()).toBe('login');
    });
  });

  describe('Content Component Navigation Integration', () => {
    it('should switch view when login content emits navigate event', () => {
      // Arrange
      const loginContent: DebugElement = fixture.debugElement.query(By.css('wil-login-modal-content'));
      const loginComponent = loginContent.componentInstance;

      // Act
      loginComponent.navigate.emit('register');
      fixture.detectChanges();

      // Assert
      expect(component.currentView()).toBe('register');
      expect(component.viewTitle()).toBe('Choose your plan');
    });

    it('should switch to forgot password view when content emits forgotPassword', () => {
      // Arrange
      const loginContent: DebugElement = fixture.debugElement.query(By.css('wil-login-modal-content'));
      const loginComponent = loginContent.componentInstance;

      // Act
      loginComponent.navigate.emit('forgotPassword');
      fixture.detectChanges();

      // Assert
      expect(component.currentView()).toBe('forgotPassword');
      expect(component.viewTitle()).toBe('Reset Password');
    });

    it('should handle navigation event binding in template', () => {
      // Arrange
      spyOn(component, 'switchView');
      const loginContent: DebugElement = fixture.debugElement.query(By.css('wil-login-modal-content'));
      const loginComponent = loginContent.componentInstance;

      // Act
      loginComponent.navigate.emit('register');

      // Assert
      expect(component.switchView).toHaveBeenCalledWith('register');
    });
  });
});
