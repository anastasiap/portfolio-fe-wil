import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Action } from '@ngrx/store';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Subject } from 'rxjs';
import { WhiteLabelFormComponent } from './white-label-form.component';
import { submitInquiryFailure, submitInquiryRequest, submitInquirySuccess } from '../../../../state';

describe('WhiteLabelFormComponent', () => {
  let fixture: ComponentFixture<WhiteLabelFormComponent>;
  let component: WhiteLabelFormComponent;
  let actions$: Subject<Action>;
  let store: MockStore;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<WhiteLabelFormComponent>>;

  beforeEach(async () => {
    actions$ = new Subject<Action>();
    mockDialogRef = jasmine.createSpyObj<MatDialogRef<WhiteLabelFormComponent>>('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [WhiteLabelFormComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        provideMockStore(),
        provideMockActions(() => actions$),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WhiteLabelFormComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(MockStore);
    spyOn(store, 'dispatch');
    fixture.detectChanges();
  });

  afterEach(() => {
    actions$.complete();
  });

  describe('initial form', () => {
    it('renders the email, message, and disabled send button', () => {
      // Arrange
      const emailInput = fixture.debugElement.query(By.css('[data-testid="white-label-email"]'));
      const messageInput = fixture.debugElement.query(By.css('[data-testid="white-label-message"]'));

      // Act
      const sendButton = getSendButton();

      // Assert
      expect(emailInput).toBeTruthy();
      expect(messageInput).toBeTruthy();
      expect(sendButton.disabled).toBeTrue();
      expect(fixture.debugElement.query(By.css('[data-testid="apply-success-message"]'))).toBeNull();
    });

    it('enables the send button when the email is valid', () => {
      // Arrange
      const emailInput = getEmailInput();

      // Act
      emailInput.value = 'coach@example.com';
      emailInput.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      // Assert
      expect(getSendButton().disabled).toBeFalse();
    });
  });

  describe('submission', () => {
    it('dispatches an inquiry request with form values when submitted', () => {
      // Arrange
      const emailInput = getEmailInput();
      const messageInput = getMessageInput();
      emailInput.value = 'coach@example.com';
      emailInput.dispatchEvent(new Event('input'));
      messageInput.value = 'Tell me about white label coaching.';
      messageInput.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      // Act
      getSendButton().click();

      // Assert
      expect(store.dispatch).toHaveBeenCalledTimes(1);
      const dispatchedAction = (store.dispatch as jasmine.Spy).calls.mostRecent().args[0] as ReturnType<
        typeof submitInquiryRequest
      >;
      expect(dispatchedAction.type).toBe(submitInquiryRequest.type);
      expect(dispatchedAction.request.email).toBe('coach@example.com');
      expect(dispatchedAction.request.message).toBe('Tell me about white label coaching.');
      expect(dispatchedAction.request.nickname).toBe('');
      expect(dispatchedAction.request.sentAt).toEqual(jasmine.any(String));
      expect(component.submitted()).toBeTrue();
    });

    it('does not dispatch when the form is invalid', () => {
      // Arrange
      const sendButton = getSendButton();

      // Act
      sendButton.click();

      // Assert
      expect(sendButton.disabled).toBeTrue();
      expect(store.dispatch).not.toHaveBeenCalled();
      expect(component.submitted()).toBeFalse();
    });

    it('does not dispatch again while a submission is pending', () => {
      // Arrange
      const emailInput = getEmailInput();
      emailInput.value = 'coach@example.com';
      emailInput.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      getSendButton().click();
      fixture.detectChanges();

      // Act
      getSendButton().click();

      // Assert
      expect(store.dispatch).toHaveBeenCalledTimes(1);
      expect(component.submitted()).toBeTrue();
    });

    it('does not dispatch when the honeypot input has a value', () => {
      // Arrange
      const emailInput = getEmailInput();
      const honeypotInput = getHoneypotInput();
      emailInput.value = 'coach@example.com';
      emailInput.dispatchEvent(new Event('input'));
      honeypotInput.value = 'bot';
      honeypotInput.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      // Act
      getSendButton().click();

      // Assert
      expect(store.dispatch).not.toHaveBeenCalled();
      expect(component.submitted()).toBeFalse();
    });
  });

  describe('action results', () => {
    it('shows the success state, disables the form, and emits applied on success', () => {
      // Arrange
      const appliedEmit = spyOn(component.applied, 'emit');
      component.submitted.set(true);

      // Act
      actions$.next(submitInquirySuccess());
      fixture.detectChanges();

      // Assert
      expect(component.success()).toBeTrue();
      expect(component.submitted()).toBeFalse();
      expect(component.form.disabled).toBeTrue();
      expect(appliedEmit).toHaveBeenCalledOnceWith();
      expect(fixture.debugElement.query(By.css('[data-testid="apply-success-message"]'))).toBeTruthy();
      expect(fixture.debugElement.query(By.css('[data-testid="white-label-send"]'))).toBeNull();
      expect(fixture.debugElement.query(By.css('[data-testid="close-modal-btn"]'))).toBeTruthy();
    });

    it('resets the submitted state on failure', () => {
      // Arrange
      component.submitted.set(true);

      // Act
      actions$.next(submitInquiryFailure({ error: 'Could not send' }));
      fixture.detectChanges();

      // Assert
      expect(component.submitted()).toBeFalse();
      expect(component.success()).toBeFalse();
      expect(component.form.enabled).toBeTrue();
    });
  });

  describe('closing', () => {
    it('closes the dialog from the header close control', () => {
      // Arrange
      const closeControl = fixture.debugElement.query(By.css('[data-testid="white-label-close"]'));

      // Act
      closeControl.nativeElement.click();

      // Assert
      expect(mockDialogRef.close).toHaveBeenCalledOnceWith();
    });

    it('closes the dialog from the success close button', () => {
      // Arrange
      actions$.next(submitInquirySuccess());
      fixture.detectChanges();

      // Act
      getCloseButton().click();

      // Assert
      expect(mockDialogRef.close).toHaveBeenCalledOnceWith();
    });
  });

  function getEmailInput(): HTMLInputElement {
    return fixture.debugElement.query(By.css('[data-testid="white-label-email"]')).nativeElement;
  }

  function getMessageInput(): HTMLTextAreaElement {
    return fixture.debugElement.query(By.css('[data-testid="white-label-message"]')).nativeElement;
  }

  function getHoneypotInput(): HTMLInputElement {
    return fixture.debugElement.query(By.css('input[name="nickname"]')).nativeElement;
  }

  function getSendButton(): HTMLButtonElement {
    return fixture.debugElement.query(By.css('[data-testid="white-label-send"] button')).nativeElement;
  }

  function getCloseButton(): HTMLButtonElement {
    return fixture.debugElement.query(By.css('[data-testid="close-modal-btn"] button')).nativeElement;
  }
});
