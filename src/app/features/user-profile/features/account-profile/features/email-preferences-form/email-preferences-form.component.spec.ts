import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MockStore, provideMockStore } from '@ngrx/store/testing';

import { EmailPreferencesFormComponent } from './email-preferences-form.component';
import { updateAccountEmailPreferences } from '../../../../../../state/auth/auth.actions';
import {
  selectAccountEmailPreferences,
  selectEmailPreferencesError,
  selectEmailPreferencesSaving,
} from '../../../../../../state/auth/auth.selectors';
import { AuthError } from '../../../../../../services/auth/auth.types';

describe('EmailPreferencesFormComponent', () => {
  let component: EmailPreferencesFormComponent;
  let fixture: ComponentFixture<EmailPreferencesFormComponent>;
  let store: MockStore;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmailPreferencesFormComponent],
      providers: [
        provideMockStore({
          selectors: [
            { selector: selectAccountEmailPreferences, value: { marketingContent: false } },
            { selector: selectEmailPreferencesSaving, value: false },
            { selector: selectEmailPreferencesError, value: null },
          ],
        }),
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    fixture = TestBed.createComponent(EmailPreferencesFormComponent);
    component = fixture.componentInstance;
    spyOn(store, 'dispatch').and.callThrough();
  });

  afterEach(() => {
    fixture.destroy();
  });

  const queryByTestId = (testId: string) => fixture.debugElement.query(By.css(`[data-testid="${testId}"]`));

  const getMarketingContentCheckbox = (): HTMLInputElement => {
    return queryByTestId('toggle-marketing-content').nativeElement as HTMLInputElement;
  };

  const getSaveButton = (): HTMLButtonElement => {
    return queryByTestId('button-save-email-preferences').nativeElement as HTMLButtonElement;
  };

  const setEmailPreferencesState = ({
    marketingContent = false,
    isSaving = false,
    error = null,
  }: {
    readonly marketingContent?: boolean;
    readonly isSaving?: boolean;
    readonly error: AuthError | null;
  }): void => {
    store.overrideSelector(selectAccountEmailPreferences, { marketingContent });
    store.overrideSelector(selectEmailPreferencesSaving, isSaving);
    store.overrideSelector(selectEmailPreferencesError, error);
    store.refreshState();
  };

  describe('template rendering', () => {
    it('should render the email preferences form and marketing content toggle', () => {
      // Arrange

      // Act
      fixture.detectChanges();

      // Assert
      expect(queryByTestId('email-preferences-form')).toBeTruthy();
      expect(queryByTestId('email-preferences-marketing-content-field')).toBeTruthy();
      expect(queryByTestId('email-preferences-marketing-content-label')).toBeTruthy();
      expect(queryByTestId('email-preferences-marketing-content-text').nativeElement.textContent).toContain('Get a rare email');
      expect(getMarketingContentCheckbox().checked).toBeFalse();
    });

    it('should patch the marketing content value from the store', () => {
      // Arrange
      setEmailPreferencesState({ marketingContent: true, isSaving: false, error: null });

      // Act
      fixture.detectChanges();

      // Assert
      expect(getMarketingContentCheckbox().checked).toBeTrue();
      expect(component.emailPreferencesForm.controls.marketingContent.value).toBeTrue();
    });

    it('should render the save section by default', () => {
      // Arrange

      // Act
      fixture.detectChanges();

      // Assert
      expect(queryByTestId('email-preferences-save-section')).toBeTruthy();
      expect(getSaveButton()).toBeTruthy();
    });

    it('should hide the save section when rendered as a compound form', () => {
      // Arrange
      fixture.componentRef.setInput('isCompoundForm', true);

      // Act
      fixture.detectChanges();

      // Assert
      expect(queryByTestId('email-preferences-save-section')).toBeNull();
      expect(queryByTestId('button-save-email-preferences')).toBeNull();
    });

    it('should show saving indicator and disable save button while saving', () => {
      // Arrange
      setEmailPreferencesState({ marketingContent: true, isSaving: true, error: null });

      // Act
      fixture.detectChanges();

      // Assert
      expect(queryByTestId('email-saving-indicator')).toBeTruthy();
      expect(getSaveButton().disabled).toBeTrue();
    });
  });

  describe('form interaction', () => {
    it('should disable save button while the form is pristine', () => {
      // Arrange

      // Act
      fixture.detectChanges();

      // Assert
      expect(component.emailPreferencesForm.pristine).toBeTrue();
      expect(getSaveButton().disabled).toBeTrue();
    });

    it('should enable save button when marketing content value changes', () => {
      // Arrange
      fixture.detectChanges();
      const checkbox = getMarketingContentCheckbox();

      // Act
      checkbox.click();
      fixture.detectChanges();

      // Assert
      expect(component.emailPreferencesForm.dirty).toBeTrue();
      expect(component.emailPreferencesForm.controls.marketingContent.value).toBeTrue();
      expect(getSaveButton().disabled).toBeFalse();
    });

    it('should dispatch updateAccountEmailPreferences with the changed value when save is clicked', () => {
      // Arrange
      fixture.detectChanges();
      const checkbox = getMarketingContentCheckbox();

      // Act
      checkbox.click();
      fixture.detectChanges();
      getSaveButton().click();
      fixture.detectChanges();

      // Assert
      expect(store.dispatch).toHaveBeenCalledWith(updateAccountEmailPreferences({ patch: { marketingContent: true } }));
    });
  });

  describe('getFormValue', () => {
    it('should return null while the form is pristine', () => {
      // Arrange
      fixture.detectChanges();

      // Act
      const formValue = component.getFormValue();

      // Assert
      expect(formValue).toBeNull();
    });

    it('should return marketing content value after user changes the form', () => {
      // Arrange
      fixture.detectChanges();
      const checkbox = getMarketingContentCheckbox();

      // Act
      checkbox.click();
      fixture.detectChanges();
      const formValue = component.getFormValue();

      // Assert
      expect(formValue).toEqual({ marketingContent: true });
    });
  });
});
