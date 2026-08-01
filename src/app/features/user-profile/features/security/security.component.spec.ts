import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideMockStore } from '@ngrx/store/testing';

import { SecurityComponent } from './security.component';

describe('SecurityComponent', () => {
  let fixture: ComponentFixture<SecurityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SecurityComponent, NoopAnimationsModule],
      providers: [provideMockStore()],
    }).compileComponents();

    fixture = TestBed.createComponent(SecurityComponent);
  });

  afterEach(() => {
    fixture.destroy();
  });

  const queryByTestId = (testId: string) => fixture.debugElement.query(By.css(`[data-testid="${testId}"]`));

  it('should create', () => {
    // Arrange

    // Act
    fixture.detectChanges();

    // Assert
    expect(fixture.componentInstance).toBeTruthy();
  });

  describe('page content', () => {
    it('should render the security page heading and description', () => {
      // Arrange

      // Act
      fixture.detectChanges();
      const section = queryByTestId('security-section');

      // Assert
      expect(section).toBeTruthy();
      expect(section.nativeElement.textContent).toContain('Security');
      expect(section.nativeElement.textContent).toContain('Manage your account security settings');
    });

    it('should render the change password card with the reset password form', () => {
      // Arrange

      // Act
      fixture.detectChanges();
      const formContainer = queryByTestId('security-page-form-container');
      const resetPasswordForm = queryByTestId('reset-password-form');

      // Assert
      expect(formContainer).toBeTruthy();
      expect(formContainer.nativeElement.textContent).toContain('Change password');
      expect(resetPasswordForm).toBeTruthy();
    });
  });
});
