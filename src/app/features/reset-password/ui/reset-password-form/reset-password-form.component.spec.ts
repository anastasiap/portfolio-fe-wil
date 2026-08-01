import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { ResetPasswordFormComponent } from './reset-password-form.component';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { resetPassword } from '../../../../state/auth/auth.actions';

describe('ResetPasswordFormComponent', () => {
  let component: ResetPasswordFormComponent;
  let fixture: ComponentFixture<ResetPasswordFormComponent>;
  let mockStore: MockStore;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResetPasswordFormComponent, NoopAnimationsModule],
      providers: [provideMockStore()],
    }).compileComponents();

    mockStore = TestBed.inject(MockStore);
    fixture = TestBed.createComponent(ResetPasswordFormComponent);
    fixture.componentRef.setInput('token', 'reset-token');
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('password validation', () => {
    it('should disable submit and show mismatch feedback when passwords do not match', () => {
      // Arrange
      const dispatchSpy = spyOn(mockStore, 'dispatch');
      const newPasswordInput = fixture.debugElement.query(By.css('[data-testid="new-password-input"]')).nativeElement as HTMLInputElement;
      const confirmPasswordInput = fixture.debugElement.query(By.css('[data-testid="confirm-password-input"]')).nativeElement as HTMLInputElement;

      // Act
      newPasswordInput.value = 'validPassword';
      newPasswordInput.dispatchEvent(new Event('input'));
      confirmPasswordInput.value = 'differentPassword';
      confirmPasswordInput.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      const mismatchFeedback = fixture.debugElement.query(By.css('.reset-password__password-match'));
      const submitButton = fixture.debugElement.query(By.css('[data-testid="reset-password-submit-button"] button')).nativeElement as HTMLButtonElement;
      submitButton.click();

      // Assert
      expect(mismatchFeedback).toBeTruthy();
      expect(mismatchFeedback.nativeElement.textContent).toContain('Passwords do not match');
      expect(submitButton.disabled).toBeTrue();
      expect(dispatchSpy).not.toHaveBeenCalled();
    });

    it('should dispatch resetPassword when matching valid passwords are submitted', () => {
      // Arrange
      const dispatchSpy = spyOn(mockStore, 'dispatch');
      const newPasswordInput = fixture.debugElement.query(By.css('[data-testid="new-password-input"]')).nativeElement as HTMLInputElement;
      const confirmPasswordInput = fixture.debugElement.query(By.css('[data-testid="confirm-password-input"]')).nativeElement as HTMLInputElement;
      const submitButton = fixture.debugElement.query(By.css('[data-testid="reset-password-submit-button"] button')).nativeElement as HTMLButtonElement;

      // Act
      newPasswordInput.value = 'validPassword';
      newPasswordInput.dispatchEvent(new Event('input'));
      confirmPasswordInput.value = 'validPassword';
      confirmPasswordInput.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      submitButton.click();
      fixture.detectChanges();

      // Assert
      expect(dispatchSpy).toHaveBeenCalledOnceWith(resetPassword({ newPassword: 'validPassword', token: 'reset-token' }));
      expect(submitButton.disabled).toBeTrue();
    });
  });

  describe('password visibility', () => {
    it('should toggle the new password input type', () => {
      // Arrange
      const newPasswordInput = fixture.debugElement.query(By.css('[data-testid="new-password-input"]')).nativeElement as HTMLInputElement;
      const newPasswordToggle = fixture.debugElement.query(By.css('[data-testid="new-password-toggle"]')).nativeElement as HTMLButtonElement;

      // Act
      newPasswordToggle.click();
      fixture.detectChanges();

      // Assert
      expect(newPasswordInput.type).toBe('text');

      // Act
      newPasswordToggle.click();
      fixture.detectChanges();

      // Assert
      expect(newPasswordInput.type).toBe('password');
    });

    it('should toggle the confirm password input type', () => {
      // Arrange
      const confirmPasswordInput = fixture.debugElement.query(By.css('[data-testid="confirm-password-input"]')).nativeElement as HTMLInputElement;
      const confirmPasswordToggle = fixture.debugElement.query(By.css('[data-testid="confirm-password-toggle"]')).nativeElement as HTMLButtonElement;

      // Act
      confirmPasswordToggle.click();
      fixture.detectChanges();

      // Assert
      expect(confirmPasswordInput.type).toBe('text');

      // Act
      confirmPasswordToggle.click();
      fixture.detectChanges();

      // Assert
      expect(confirmPasswordInput.type).toBe('password');
    });
  });
});
