import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';
import { provideMockStore } from '@ngrx/store/testing';

import { CompleteSignupComponent } from './complete-signup.component';

describe('CompleteSignupComponent', () => {
  let component: CompleteSignupComponent;
  let fixture: ComponentFixture<CompleteSignupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CompleteSignupComponent, RouterTestingModule, HttpClientTestingModule, NoopAnimationsModule],
      providers: [provideMockStore({})],
    }).compileComponents();

    fixture = TestBed.createComponent(CompleteSignupComponent);
    fixture.componentRef.setInput('signupCompletionState', 'loading');
    fixture.componentRef.setInput('signupData', null);
    fixture.componentRef.setInput('signupError', null);
    fixture.componentRef.setInput('isPollingTimeout', false);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('signupCompletion container template', () => {
    it('should render signup completion title text in header', () => {
      // Arrange
      fixture.detectChanges();

      // Act
      const title = fixture.debugElement.query(By.css('[data-testid="signup-completion-mode-title"]'));

      // Assert
      expect(title).toBeTruthy();
      expect(title.nativeElement.textContent.trim()).toBe('Complete Your Account');
    });
  });

  describe('loadingState template', () => {
    it('should render the loading spinner when signupCompletionState is loading', () => {
      // Arrange
      fixture.componentRef.setInput('signupCompletionState', 'loading');

      // Act
      fixture.detectChanges();
      const state = fixture.debugElement.query(By.css('[data-testid="state-loading"]'));
      const spinner = fixture.debugElement.query(By.css('[data-testid="state-loading-spinner"]'));

      // Assert
      expect(state).toBeTruthy();
      expect(spinner).toBeTruthy();
    });

    it('should render the loading message when signupCompletionState is loading', () => {
      // Arrange
      fixture.componentRef.setInput('signupCompletionState', 'loading');

      // Act
      fixture.detectChanges();
      const message = fixture.debugElement.query(By.css('[data-testid="state-loading-message"]'));

      // Assert
      expect(message).toBeTruthy();
      expect(message.nativeElement.textContent.trim()).toBe('Loading your signup information...');
    });
  });

  describe('waitingPaymentState template', () => {
    it('should render waiting payment template when signupCompletionState is waiting_payment', () => {
      // Arrange
      fixture.componentRef.setInput('signupCompletionState', 'waiting_payment');

      // Act
      fixture.detectChanges();
      const state = fixture.debugElement.query(By.css('[data-testid="state-waiting-payment"]'));

      // Assert
      expect(state).toBeTruthy();
    });

    it('should show non-timeout waiting content and polling indicator when polling has not timed out', () => {
      // Arrange
      fixture.componentRef.setInput('signupCompletionState', 'waiting_payment');
      fixture.componentRef.setInput('isPollingTimeout', false);

      // Act
      fixture.detectChanges();
      const waitingState = fixture.debugElement.query(By.css('[data-testid="state-waiting-payment"]'));
      const pollingIndicator = fixture.debugElement.query(By.css('[data-testid="polling-indicator"]'));
      const checkAgainButton = fixture.debugElement.query(By.css('[data-testid="button-check-again"]'));

      // Assert
      expect(waitingState).toBeTruthy();
      expect(waitingState.nativeElement.textContent).toContain("We're waiting for payment confirmation from Stripe.");
      expect(waitingState.nativeElement.textContent).toContain('This usually takes a few moments. Please wait...');
      expect(pollingIndicator).toBeTruthy();
      expect(checkAgainButton).toBeFalsy();
    });

    it('should show timeout waiting content and retry actions when polling times out', () => {
      // Arrange
      fixture.componentRef.setInput('signupCompletionState', 'waiting_payment');
      fixture.componentRef.setInput('isPollingTimeout', true);

      // Act
      fixture.detectChanges();
      const waitingState = fixture.debugElement.query(By.css('[data-testid="state-waiting-payment"]'));
      const pollingIndicator = fixture.debugElement.query(By.css('[data-testid="polling-indicator"]'));
      const checkAgainButton = fixture.debugElement.query(By.css('[data-testid="button-check-again"]'));
      const supportButton = fixture.debugElement.query(By.css('[data-testid="button-contact-support-error"]'));

      // Assert
      expect(waitingState).toBeTruthy();
      expect(waitingState.nativeElement.textContent).toContain('Payment confirmation is taking longer than expected.');
      expect(waitingState.nativeElement.textContent).toContain(
        'Your payment may still be processing. This can take a few minutes depending on your payment method.'
      );
      expect(pollingIndicator).toBeFalsy();
      expect(checkAgainButton).toBeTruthy();
      expect(supportButton).toBeTruthy();
    });

    it('should render signup email and plan in waiting state when signupData exists', () => {
      // Arrange
      fixture.componentRef.setInput('signupCompletionState', 'waiting_payment');
      fixture.componentRef.setInput('signupData', {
        signupId: 'signup_123',
        email: 'user@example.com',
        plan: 'professional',
        status: 'initiated',
      });

      // Act
      fixture.detectChanges();
      const waitingState = fixture.debugElement.query(By.css('[data-testid="state-waiting-payment"]'));

      // Assert
      expect(waitingState).toBeTruthy();
      expect(waitingState.nativeElement.textContent).toContain('Email: user@example.com');
      expect(waitingState.nativeElement.textContent).toContain('Plan: professional');
    });
  });

  describe('readyToCompleteState template', () => {
    it('should render ready to complete template when signupCompletionState is ready_to_complete', () => {
      // Arrange
      fixture.componentRef.setInput('signupCompletionState', 'ready_to_complete');

      // Act
      fixture.detectChanges();
      const state = fixture.debugElement.query(By.css('[data-testid="state-ready-to-complete"]'));

      // Assert
      expect(state).toBeTruthy();
    });

    it('should render ready-to-complete title and messages', () => {
      // Arrange
      fixture.componentRef.setInput('signupCompletionState', 'ready_to_complete');

      // Act
      fixture.detectChanges();
      const title = fixture.debugElement.query(By.css('[data-testid="state-ready-to-complete-title"]'));
      const message = fixture.debugElement.query(By.css('[data-testid="state-ready-to-complete-message"]'));
      const detail = fixture.debugElement.query(By.css('[data-testid="state-ready-to-complete-detail"]'));

      // Assert
      expect(title).toBeTruthy();
      expect(title.nativeElement.textContent.trim()).toBe('Payment Confirmed!');
      expect(message).toBeTruthy();
      expect(message.nativeElement.textContent.trim()).toBe('Your payment has been processed successfully.');
      expect(detail).toBeTruthy();
      expect(detail.nativeElement.textContent.trim()).toBe('Complete your account setup to get started.');
    });

    it('should render complete-signup form in ready-to-complete state when signupData exists', () => {
      // Arrange
      fixture.componentRef.setInput('signupCompletionState', 'ready_to_complete');
      fixture.componentRef.setInput('signupData', {
        signupId: 'signup_123',
        email: 'user@example.com',
        plan: 'professional',
        status: 'paid',
      });

      // Act
      fixture.detectChanges();
      const form = fixture.debugElement.query(By.css('[data-testid="state-ready-to-complete-form"]'));

      // Assert
      expect(form).toBeTruthy();
    });

    it('should not render complete-signup form in ready-to-complete state when signupData is null', () => {
      // Arrange
      fixture.componentRef.setInput('signupCompletionState', 'ready_to_complete');
      fixture.componentRef.setInput('signupData', null);

      // Act
      fixture.detectChanges();
      const form = fixture.debugElement.query(By.css('[data-testid="state-ready-to-complete-form"]'));

      // Assert
      expect(form).toBeFalsy();
    });
  });

  describe('alreadyCompletedState template', () => {
    it('should render already completed template when signupCompletionState is already_completed', () => {
      // Arrange
      fixture.componentRef.setInput('signupCompletionState', 'already_completed');

      // Act
      fixture.detectChanges();
      const state = fixture.debugElement.query(By.css('[data-testid="state-already-completed"]'));

      // Assert
      expect(state).toBeTruthy();
    });
  });

  describe('canceledState template', () => {
    it('should render canceled template when signupCompletionState is canceled', () => {
      // Arrange
      fixture.componentRef.setInput('signupCompletionState', 'canceled');

      // Act
      fixture.detectChanges();
      const state = fixture.debugElement.query(By.css('[data-testid="state-canceled"]'));

      // Assert
      expect(state).toBeTruthy();
    });

    it('should render canceled title and message', () => {
      // Arrange
      fixture.componentRef.setInput('signupCompletionState', 'canceled');

      // Act
      fixture.detectChanges();
      const title = fixture.debugElement.query(By.css('[data-testid="state-canceled-title"]'));
      const message = fixture.debugElement.query(By.css('[data-testid="state-canceled-message"]'));

      // Assert
      expect(title).toBeTruthy();
      expect(title.nativeElement.textContent.trim()).toBe('Signup Canceled');
      expect(message).toBeTruthy();
      expect(message.nativeElement.textContent.trim()).toBe('This signup has been canceled.');
    });

    it('should call navigateToSupport when contact support button is clicked in canceled state', () => {
      // Arrange
      fixture.componentRef.setInput('signupCompletionState', 'canceled');
      fixture.detectChanges();
      const navigateToSupportSpy = spyOn(component, 'navigateToSupport');
      const contactSupportButton = fixture.debugElement.query(By.css('[data-testid="state-canceled-button-contact-support-error"]'));

      // Act
      contactSupportButton.nativeElement.click();

      // Assert
      expect(contactSupportButton).toBeTruthy();
      expect(navigateToSupportSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('notFoundState template', () => {
    it('should render not found template when signupCompletionState is not_found', () => {
      // Arrange
      fixture.componentRef.setInput('signupCompletionState', 'not_found');

      // Act
      fixture.detectChanges();
      const state = fixture.debugElement.query(By.css('[data-testid="state-not-found"]'));

      // Assert
      expect(state).toBeTruthy();
    });

    it('should render not found title and messages', () => {
      // Arrange
      fixture.componentRef.setInput('signupCompletionState', 'not_found');

      // Act
      fixture.detectChanges();
      const title = fixture.debugElement.query(By.css('[data-testid="state-not-found-title"]'));
      const message = fixture.debugElement.query(By.css('[data-testid="state-not-found-message"]'));
      const detail = fixture.debugElement.query(By.css('[data-testid="state-not-found-detail"]'));

      // Assert
      expect(title).toBeTruthy();
      expect(title.nativeElement.textContent.trim()).toBe('Signup Not Found');
      expect(message).toBeTruthy();
      expect(message.nativeElement.textContent.trim()).toBe("We couldn't find a signup with this ID.");
      expect(detail).toBeTruthy();
      expect(detail.nativeElement.textContent.trim()).toBe('Please check your link or contact support if you need assistance.');
    });

    it('should render signupError in not found state when signupError exists', () => {
      // Arrange
      fixture.componentRef.setInput('signupCompletionState', 'not_found');
      fixture.componentRef.setInput('signupError', 'Unable to locate signup_123');

      // Act
      fixture.detectChanges();
      const error = fixture.debugElement.query(By.css('[data-testid="state-not-found-error"]'));

      // Assert
      expect(error).toBeTruthy();
      expect(error.nativeElement.textContent.trim()).toBe('Unable to locate signup_123');
    });

    it('should call navigateToSupport when contact support button is clicked in not found state', () => {
      // Arrange
      fixture.componentRef.setInput('signupCompletionState', 'not_found');
      fixture.detectChanges();
      const navigateToSupportSpy = spyOn(component, 'navigateToSupport');
      const contactSupportButton = fixture.debugElement.query(By.css('[data-testid="state-not-found-button-contact-support-error"]'));

      // Act
      contactSupportButton.nativeElement.click();

      // Assert
      expect(contactSupportButton).toBeTruthy();
      expect(navigateToSupportSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('errorState template', () => {
    it('should render error template when signupCompletionState is error', () => {
      // Arrange
      fixture.componentRef.setInput('signupCompletionState', 'error');

      // Act
      fixture.detectChanges();
      const state = fixture.debugElement.query(By.css('[data-testid="state-error"]'));

      // Assert
      expect(state).toBeTruthy();
    });

    it('should render error title and message', () => {
      // Arrange
      fixture.componentRef.setInput('signupCompletionState', 'error');

      // Act
      fixture.detectChanges();
      const title = fixture.debugElement.query(By.css('[data-testid="state-error-title"]'));
      const message = fixture.debugElement.query(By.css('[data-testid="state-error-message"]'));

      // Assert
      expect(title).toBeTruthy();
      expect(title.nativeElement.textContent.trim()).toBe('Something Went Wrong');
      expect(message).toBeTruthy();
      expect(message.nativeElement.textContent.trim()).toBe('We encountered an error while loading your signup.');
    });

    it('should render signupError in error state when signupError exists', () => {
      // Arrange
      fixture.componentRef.setInput('signupCompletionState', 'error');
      fixture.componentRef.setInput('signupError', 'Unexpected signup lookup failure');

      // Act
      fixture.detectChanges();
      const errorDetail = fixture.debugElement.query(By.css('[data-testid="state-error-detail"]'));

      // Assert
      expect(errorDetail).toBeTruthy();
      expect(errorDetail.nativeElement.textContent.trim()).toBe('Unexpected signup lookup failure');
    });

    it('should call navigateToSupport when contact support button is clicked in error state', () => {
      // Arrange
      fixture.componentRef.setInput('signupCompletionState', 'error');
      fixture.detectChanges();
      const navigateToSupportSpy = spyOn(component, 'navigateToSupport');
      const contactSupportButton = fixture.debugElement.query(By.css('[data-testid="state-error-button-contact-support"]'));

      // Act
      contactSupportButton.nativeElement.click();

      // Assert
      expect(contactSupportButton).toBeTruthy();
      expect(navigateToSupportSpy).toHaveBeenCalledTimes(1);
    });
  });
});
