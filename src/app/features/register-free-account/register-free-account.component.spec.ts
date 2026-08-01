import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { provideMockStore } from '@ngrx/store/testing';

import { RegisterFreeAccountComponent } from './register-free-account.component';
import { initialAuthState } from '../../state/auth/auth.reducer';

describe('RegisterFreeAccountComponent', () => {
  let fixture: ComponentFixture<RegisterFreeAccountComponent>;
  let component: RegisterFreeAccountComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterFreeAccountComponent, HttpClientTestingModule, NoopAnimationsModule, RouterTestingModule],
      providers: [
        provideMockStore({
          initialState: {
            auth: initialAuthState,
          },
        }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterFreeAccountComponent);
    component = fixture.componentInstance;
  });

  const queryByTestId = (testId: string) => fixture.debugElement.query(By.css(`[data-testid="${testId}"]`));

  describe('template rendering', () => {
    it('should render the free account registration intro copy', () => {
      // Arrange

      // Act
      fixture.detectChanges();
      const root = queryByTestId('register-free-account');
      const intro = queryByTestId('register-free-account-intro');
      const eyebrow = queryByTestId('register-free-account-eyebrow');
      const title = queryByTestId('register-free-account-title');
      const description = queryByTestId('register-free-account-description');

      // Assert
      expect(component).toBeTruthy();
      expect(root).toBeTruthy();
      expect(intro).toBeTruthy();
      expect(eyebrow.nativeElement.textContent.trim()).toBe('Free plan');
      expect(title.nativeElement.textContent.trim()).toBe('Create your Free Wheel of Life account');
      expect(description.nativeElement.textContent.trim()).toBe('No credit card required. Upgrade to the Personal plan any time.');
    });

    it('should render the free plan benefits inside the content section', () => {
      // Arrange

      // Act
      fixture.detectChanges();
      const content = queryByTestId('register-free-account-content');
      const benefits = fixture.debugElement.query(By.css('wil-free-plan-benefits'));
      const benefitsTitle = queryByTestId('free-plan-benefits-title');

      // Assert
      expect(content).toBeTruthy();
      expect(benefits).toBeTruthy();
      expect(content.nativeElement.contains(benefits.nativeElement)).toBeTrue();
      expect(benefitsTitle.nativeElement.textContent.trim()).toBe('What is included');
    });

    it('should render the complete signup form inside the form wrapper', () => {
      // Arrange

      // Act
      fixture.detectChanges();
      const formWrapper = queryByTestId('register-free-account-form');
      const signupForm = fixture.debugElement.query(By.css('wil-complete-signup-form'));
      const emailInput = fixture.debugElement.query(By.css('[data-testid="complete-signup-form__input-email"]'));

      // Assert
      expect(formWrapper).toBeTruthy();
      expect(signupForm).toBeTruthy();
      expect(formWrapper.nativeElement.contains(signupForm.nativeElement)).toBeTrue();
      expect(emailInput).toBeTruthy();
    });
  });
});
