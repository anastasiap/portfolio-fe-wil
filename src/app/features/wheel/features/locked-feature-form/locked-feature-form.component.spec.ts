import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Actions } from '@ngrx/effects';
import { Action } from '@ngrx/store';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { ReplaySubject } from 'rxjs';

import { AnalyticsService } from '../../../../services/analytics/analytics.service';
import { submitFeatureRequest, submitFeatureRequestFailure, submitFeatureRequestSuccess } from '../../../../state';
import { LockedFeatureFormComponent } from './locked-feature-form.component';

describe('LockedFeatureFormComponent', () => {
  let actions$: ReplaySubject<Action>;
  let component: LockedFeatureFormComponent;
  let dialogRef: jasmine.SpyObj<MatDialogRef<LockedFeatureFormComponent>>;
  let dispatchSpy: jasmine.Spy;
  let fixture: ComponentFixture<LockedFeatureFormComponent>;
  let store: MockStore;

  const analyticsService = jasmine.createSpyObj<AnalyticsService>('AnalyticsService', ['trackLegacyEvent']);

  const setup = (): void => {
    fixture = TestBed.createComponent(LockedFeatureFormComponent);
    component = fixture.componentInstance;
    dispatchSpy = spyOn(store, 'dispatch').and.callThrough();
    fixture.detectChanges();
  };

  const getEmailInput = (): HTMLInputElement => {
    return fixture.debugElement.query(By.css('[data-testid="locked-feature-form-email"]')).nativeElement as HTMLInputElement;
  };

  const getSubmitButton = (): HTMLButtonElement => {
    return fixture.debugElement.query(By.css('[data-testid="locked-feature-form-send"] button')).nativeElement as HTMLButtonElement;
  };

  const setEmailValue = (value: string): void => {
    const input = getEmailInput();
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    actions$ = new ReplaySubject<Action>(1);
    dialogRef = jasmine.createSpyObj<MatDialogRef<LockedFeatureFormComponent>>('MatDialogRef', ['close']);
    analyticsService.trackLegacyEvent.calls.reset();
    localStorage.setItem('wil_client_id', 'test-client-id');

    await TestBed.configureTestingModule({
      imports: [LockedFeatureFormComponent, NoopAnimationsModule],
      providers: [
        provideMockStore(),
        { provide: Actions, useValue: new Actions(actions$) },
        { provide: AnalyticsService, useValue: analyticsService },
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { source: 'save_categories' } },
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore);
  });

  afterEach(() => {
    actions$.complete();
    localStorage.removeItem('wil_client_id');
  });

  describe('initial state', () => {
    it('should render the form with the default plan and disabled submit button', () => {
      // Arrange & Act
      setup();

      // Assert
      expect(fixture.debugElement.query(By.css('[data-testid="locked-feature-form"]'))).toBeTruthy();
      expect(fixture.debugElement.query(By.css('[data-testid="locked-feature-form-success"]'))).toBeNull();
      expect(fixture.debugElement.query(By.css('[data-testid="locked-feature-form-error"]'))).toBeNull();
      expect(component.form.controls.plan.value).toBe('personal');
      expect(getEmailInput().value).toBe('');
      expect(getSubmitButton().disabled).toBeTrue();
    });
  });

  describe('submission', () => {
    it('should dispatch the feature request and show loading when a valid form is submitted', () => {
      // Arrange
      const fetchSpy = spyOn(window, 'fetch').and.returnValue(
        Promise.resolve({
          json: () => Promise.resolve({ ok: true }),
        } as Response),
      );
      setup();

      setEmailValue('person@example.com');
      expect(getSubmitButton().disabled).toBeFalse();

      // Act
      getSubmitButton().click();
      fixture.detectChanges();

      // Assert
      expect(component.uiState()).toBe('submitting');
      expect(fixture.debugElement.query(By.css('[data-testid="button-loading-spinner"]'))).toBeTruthy();
      expect(analyticsService.trackLegacyEvent).toHaveBeenCalledWith('modal_send_interest_attempt', 'save_categories');
      expect(analyticsService.trackLegacyEvent).toHaveBeenCalledWith('modal_send_interest_success', 'save_categories');
      expect(fetchSpy).toHaveBeenCalled();
      expect(dispatchSpy).toHaveBeenCalledTimes(1);

      const dispatchedAction = dispatchSpy.calls.mostRecent().args[0] as ReturnType<typeof submitFeatureRequest>;

      expect(dispatchedAction.type).toBe(submitFeatureRequest.type);
      expect(dispatchedAction.request).toEqual(
        jasmine.objectContaining({
          email: 'person@example.com',
          plan: 'personal',
          nickname: '',
          event: 'save_categories_interest',
        }),
      );
      expect(typeof dispatchedAction.request.sentAt).toBe('string');
    });
  });

  describe('success state', () => {
    it('should show the success message, disable the form, and close the dialog after 3 seconds', fakeAsync(() => {
      // Arrange
      setup();

      // Act
      actions$.next(submitFeatureRequestSuccess());
      fixture.detectChanges();

      // Assert
      expect(component.uiState()).toBe('success');
      expect(component.form.disabled).toBeTrue();
      expect(fixture.debugElement.query(By.css('[data-testid="locked-feature-form"]'))).toBeNull();
      expect(fixture.debugElement.query(By.css('[data-testid="locked-feature-form-success"]')).nativeElement.textContent).toContain(
        "Thanks! We'll keep you posted.",
      );
      expect(dialogRef.close).not.toHaveBeenCalled();

      tick(3000);

      expect(dialogRef.close).toHaveBeenCalled();
    }));
  });

  describe('error state', () => {
    it('should show the error message and close action', () => {
      // Arrange
      setup();

      // Act
      actions$.next(submitFeatureRequestFailure({ error: 'Request failed' }));
      fixture.detectChanges();

      // Assert
      expect(component.uiState()).toBe('error');
      expect(fixture.debugElement.query(By.css('[data-testid="locked-feature-form"]'))).toBeNull();
      expect(fixture.debugElement.query(By.css('[data-testid="locked-feature-form-error"]')).nativeElement.textContent).toContain(
        'Something went wrong.',
      );
      expect(fixture.debugElement.query(By.css('[data-testid="locked-feature-form-close-button"]'))).toBeTruthy();
      expect(analyticsService.trackLegacyEvent).toHaveBeenCalledWith('modal_send_interest_error', 'save_categories');
    });
  });
});
