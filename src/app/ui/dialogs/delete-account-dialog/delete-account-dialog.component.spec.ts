import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { By } from '@angular/platform-browser';

import { DeleteAccountDialogComponent } from './delete-account-dialog.component';
import { deleteAccountRequested, deleteAccountStateReset } from '../../../state/gdpr/gdpr.actions';

describe('DeleteAccountDialogComponent', () => {
  let component: DeleteAccountDialogComponent;
  let fixture: ComponentFixture<DeleteAccountDialogComponent>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<DeleteAccountDialogComponent>>;
  let mockStore: MockStore;

  const initialState = {
    gdpr: {
      deleteAccount: {
        status: 'idle',
        error: null,
      },
    },
  };

  beforeEach(async () => {
    const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [DeleteAccountDialogComponent, MatDialogModule, NoopAnimationsModule, ReactiveFormsModule],
      providers: [provideMockStore({ initialState }), { provide: MatDialogRef, useValue: dialogRefSpy }],
    }).compileComponents();

    mockDialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<DeleteAccountDialogComponent>>;
    mockStore = TestBed.inject(MockStore);
    spyOn(mockStore, 'dispatch');

    fixture = TestBed.createComponent(DeleteAccountDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Component Creation', () => {
    it('should start on step 1', () => {
      expect(component.step()).toBe(1);
    });

    it('should dispatch deleteAccountStateReset on creation', () => {
      expect(mockStore.dispatch).toHaveBeenCalledWith(deleteAccountStateReset());
    });

    it('should render step 1 title', () => {
      const titleElement = fixture.debugElement.query(By.css('h2[mat-dialog-title]'));
      expect(titleElement.nativeElement.textContent).toBe('Delete your account?');
    });
  });

  describe('Step 1 - Warning', () => {
    it('should display warning list', () => {
      const warnings = fixture.debugElement.queryAll(By.css('.delete-account-dialog__warnings li'));
      expect(warnings.length).toBe(4);
      expect(warnings[0].nativeElement.textContent).toContain('irreversible');
    });

    it('should have Cancel and Continue buttons', () => {
      const cancelBtn = fixture.debugElement.query(By.css('[data-testid="cancel-button"]'));
      const continueBtn = fixture.debugElement.query(By.css('[data-testid="continue-button"]'));

      expect(cancelBtn).toBeTruthy();
      expect(continueBtn).toBeTruthy();
    });

    it('should close dialog with confirmed: false when Cancel is clicked', () => {
      const cancelBtn = fixture.debugElement.query(By.css('[data-testid="cancel-button"]'));
      cancelBtn.nativeElement.click();

      expect(mockDialogRef.close).toHaveBeenCalledWith({ confirmed: false });
    });

    it('should move to step 2 when Continue is clicked', () => {
      const continueBtn = fixture.debugElement.query(By.css('[data-testid="continue-button"]'));
      continueBtn.nativeElement.click();
      fixture.detectChanges();

      expect(component.step()).toBe(2);
    });
  });

  describe('Step 2 - Final Confirmation', () => {
    beforeEach(() => {
      component.onContinue();
      fixture.detectChanges();
    });

    it('should display step 2 title', () => {
      const titleElement = fixture.debugElement.query(By.css('h2[mat-dialog-title]'));
      expect(titleElement.nativeElement.textContent).toBe('Final confirmation');
    });

    it('should render checkbox and text input', () => {
      const checkbox = fixture.debugElement.query(By.css('[data-testid="confirm-permanent-checkbox"]'));
      const input = fixture.debugElement.query(By.css('[data-testid="confirm-delete-input"]'));

      expect(checkbox).toBeTruthy();
      expect(input).toBeTruthy();
    });

    it('should have Delete account button disabled initially', () => {
      const deleteBtn = fixture.debugElement.query(By.css('[data-testid="delete-account-button"]'));
      expect(deleteBtn.nativeElement.disabled).toBe(true);
    });

    it('should enable Delete button only when form is valid', fakeAsync(() => {
      const checkbox = fixture.debugElement.query(By.css('[data-testid="confirm-permanent-checkbox"] input'));
      const deleteBtn = fixture.debugElement.query(By.css('[data-testid="delete-account-button"]'));

      // Check checkbox
      checkbox.nativeElement.click();
      fixture.detectChanges();
      tick();

      // Delete button should still be disabled (text not entered)
      expect(deleteBtn.nativeElement.disabled).toBe(true);

      // Enter correct text
      component.confirmForm.patchValue({ typedPhrase: 'DELETE' });
      fixture.detectChanges();
      tick();

      expect(deleteBtn.nativeElement.disabled).toBe(false);
    }));

    it('should not enable Delete button with wrong text', fakeAsync(() => {
      const checkbox = fixture.debugElement.query(By.css('[data-testid="confirm-permanent-checkbox"] input'));
      const deleteBtn = fixture.debugElement.query(By.css('[data-testid="delete-account-button"]'));

      // Check checkbox and enter wrong text
      checkbox.nativeElement.click();
      component.confirmForm.patchValue({ typedPhrase: 'delete' });
      fixture.detectChanges();
      tick();

      expect(deleteBtn.nativeElement.disabled).toBe(true);
    }));

    it('should dispatch deleteAccountRequested and close dialog when Delete is clicked with valid form', fakeAsync(() => {
      // Set up valid form
      component.confirmForm.patchValue({
        confirmPermanent: true,
        typedPhrase: 'DELETE',
      });
      fixture.detectChanges();
      tick();

      const deleteBtn = fixture.debugElement.query(By.css('[data-testid="delete-account-button"]'));
      deleteBtn.nativeElement.click();

      expect(mockStore.dispatch).toHaveBeenCalledWith(deleteAccountRequested());
      expect(mockDialogRef.close).toHaveBeenCalledWith({ confirmed: true });
    }));

    it('should go back to step 1 when Back button is clicked', () => {
      const backBtn = fixture.debugElement.query(By.css('[data-testid="back-button"]'));
      backBtn.nativeElement.click();
      fixture.detectChanges();

      expect(component.step()).toBe(1);
    });
  });

  describe('Error State', () => {
    beforeEach(() => {
      const errorState = {
        gdpr: {
          deleteAccount: {
            status: 'error',
            error: { message: 'Test error message' },
          },
        },
      };

      mockStore.setState(errorState);
      component.onContinue();
      fixture.detectChanges();
    });

    it('should display error message', () => {
      const errorDiv = fixture.debugElement.query(By.css('[data-testid="error-message"]'));
      expect(errorDiv).toBeTruthy();
      expect(errorDiv.nativeElement.textContent).toContain('Test error message');
    });
  });
});
