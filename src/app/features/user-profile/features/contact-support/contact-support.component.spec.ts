import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { Action, Store } from '@ngrx/store';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable, Subject } from 'rxjs';

import { ContactSupportComponent } from './contact-support.component';
import { CtaButtonComponent } from '../../../../ui/cta-button/cta-button.component';
import { SupportService } from '../../../../services/api/support.service';
import { selectAccountId } from '../../../../state/auth/auth.selectors';
import { selectActiveWheel } from '../../../../state/selectors';
import { submitSupportRequest, submitSupportRequestFailure, submitSupportRequestSuccess } from '../../../../state/actions';
import { MetadataCollectorService } from '../../../../services/metadata-collector.service';
import { environment } from '../../../../../environments/environment';

describe('ContactSupportComponent', () => {
  let component: ContactSupportComponent;
  let fixture: ComponentFixture<ContactSupportComponent>;
  let mockStore: MockStore;
  let actionsSubject: Subject<Action>;
  let mockSupportService: jasmine.SpyObj<SupportService>;
  let mockMetadataCollector: jasmine.SpyObj<MetadataCollectorService>;

  const mockAccountId = 'acc_123';
  const mockActiveWheel = { id: 'wheel_456', name: 'Test Wheel', categories: [] };
  const expectedEnvironment = environment.production ? 'production' : 'development';
  const mockMetadata: SupportRequestMetadata = {
    accountId: mockAccountId,
    environment: expectedEnvironment,
    browser: 'Chrome 120',
    os: 'Windows 10',
    currentUrl: '/account/support',
    timestamp: '2026-03-09T14:00:00.000Z',
    timezone: 'Europe/London',
    activeWheelId: mockActiveWheel.id,
  };

  const createMockFile = (name: string, type: string, size: number): File => {
    const file = new File([''], name, { type });
    Object.defineProperty(file, 'size', { value: size, writable: false });
    return file;
  };

  const queryByTestId = (testId: string) => fixture.debugElement.query(By.css(`[data-testid="${testId}"]`));

  const getSubmitButton = (): HTMLButtonElement => {
    const ctaButton = fixture.debugElement.query(By.directive(CtaButtonComponent));
    return ctaButton.query(By.css('button')).nativeElement as HTMLButtonElement;
  };

  const fillValidForm = (): void => {
    component.supportForm.patchValue({
      name: 'Test User',
      description: 'This is a test support request with sufficient detail',
    });
    fixture.detectChanges();
  };

  beforeEach(async () => {
    actionsSubject = new Subject<Action>();

    const supportServiceSpy = jasmine.createSpyObj<SupportService>('SupportService', ['validateAttachment']);
    const metadataCollectorSpy = jasmine.createSpyObj<MetadataCollectorService>('MetadataCollectorService', ['collectMetadata']);
    const routerSpy = jasmine.createSpyObj<Router>('Router', [], { url: '/account/support' });

    await TestBed.configureTestingModule({
      imports: [ContactSupportComponent, NoopAnimationsModule],
      providers: [
        provideMockStore({
          selectors: [
            { selector: selectAccountId, value: mockAccountId },
            { selector: selectActiveWheel, value: mockActiveWheel },
          ],
        }),
        provideMockActions((): Observable<Action> => actionsSubject.asObservable()),
        { provide: SupportService, useValue: supportServiceSpy },
        { provide: MetadataCollectorService, useValue: metadataCollectorSpy },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ContactSupportComponent);
    component = fixture.componentInstance;
    mockStore = TestBed.inject(Store) as MockStore;
    mockSupportService = TestBed.inject(SupportService) as jasmine.SpyObj<SupportService>;
    mockMetadataCollector = TestBed.inject(MetadataCollectorService) as jasmine.SpyObj<MetadataCollectorService>;

    mockSupportService.validateAttachment.and.returnValue({ valid: true });
    mockMetadataCollector.collectMetadata.and.returnValue(mockMetadata);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initial Rendering', () => {
    it('should render support paragraph and email', () => {
      const description = queryByTestId('contact-support-description');
      expect(description).toBeTruthy();
      expect(description.nativeElement.textContent).toContain('via email or use the form below');

      const emailLink = queryByTestId('contact-support-email-link');
      expect(emailLink).toBeTruthy();
      expect(emailLink.nativeElement.href).toBe('mailto:test@example.com');
    });

    it('should render form with all required fields', () => {
      expect(queryByTestId('contact-support-name-input')).toBeTruthy();
      expect(queryByTestId('contact-support-description-textarea')).toBeTruthy();
      expect(queryByTestId('contact-support-file-drop-zone')).toBeTruthy();
      expect(getSubmitButton()).toBeTruthy();
    });

    it('should display consent notice', () => {
      const consentText = queryByTestId('contact-support-consent-text');
      expect(consentText).toBeTruthy();
      expect(consentText.nativeElement.textContent).toContain('do not include passwords');
    });
  });

  describe('Form Validation', () => {
    it('should disable submit button when form is invalid', () => {
      expect(getSubmitButton().disabled).toBeTrue();
    });

    it('should enable submit button when form is valid', () => {
      fillValidForm();

      expect(getSubmitButton().disabled).toBeFalse();
    });

    it('should show validation errors for required fields', () => {
      const nameInput = queryByTestId('contact-support-name-input').nativeElement as HTMLInputElement;
      const descriptionTextarea = queryByTestId('contact-support-description-textarea').nativeElement as HTMLTextAreaElement;

      nameInput.dispatchEvent(new Event('blur'));
      descriptionTextarea.dispatchEvent(new Event('blur'));
      fixture.detectChanges();

      expect(queryByTestId('contact-support-name-error-required')).toBeTruthy();
      expect(queryByTestId('contact-support-description-error-required')).toBeTruthy();
    });

    it('should show minlength validation errors', () => {
      component.supportForm.patchValue({
        name: 'A',
        description: 'Too short',
      });
      component.supportForm.controls.name.markAsTouched();
      component.supportForm.controls.description.markAsTouched();
      fixture.detectChanges();

      expect(queryByTestId('contact-support-name-error-minlength')).toBeTruthy();
      expect(queryByTestId('contact-support-description-error-minlength')).toBeTruthy();
    });
  });

  describe('File Attachment', () => {
    it('should handle valid file selection', () => {
      const mockFile = createMockFile('test.png', 'image/png', 1024);

      component.onFileSelected({ target: { files: [mockFile] } } as unknown as Event);
      fixture.detectChanges();

      expect(component.selectedFile()).toBe(mockFile);
      expect(component.selectedFileName()).toBe('test.png');
      expect(component.supportForm.controls.attachment.value).toBe(mockFile);
      expect(component.fileError()).toBeNull();
      expect(queryByTestId('contact-support-file-selected')).toBeTruthy();
    });

    it('should handle invalid file selection', () => {
      const mockFile = createMockFile('test.exe', 'application/exe', 1024);
      mockSupportService.validateAttachment.and.returnValue({ valid: false, error: 'Invalid file type' });

      component.onFileSelected({ target: { files: [mockFile] } } as unknown as Event);
      fixture.detectChanges();

      expect(component.selectedFile()).toBeNull();
      expect(component.supportForm.controls.attachment.value).toBeNull();
      expect(component.fileError()).toBe('Invalid file type');
      expect(queryByTestId('contact-support-file-error').nativeElement.textContent).toContain('Invalid file type');
    });

    it('should allow file removal', () => {
      const mockFile = createMockFile('test.png', 'image/png', 1024);
      component.onFileSelected({ target: { files: [mockFile] } } as unknown as Event);
      fixture.detectChanges();

      queryByTestId('contact-support-file-remove-button').nativeElement.click();
      fixture.detectChanges();

      expect(component.selectedFile()).toBeNull();
      expect(component.selectedFileName()).toBeNull();
      expect(component.supportForm.controls.attachment.value).toBeNull();
      expect(component.fileError()).toBeNull();
    });

    it('should handle drag and drop', () => {
      const mockFile = createMockFile('test.jpg', 'image/jpeg', 2048);
      const dragEvent = new DragEvent('drop');
      Object.defineProperty(dragEvent, 'dataTransfer', {
        value: { files: [mockFile] },
      });

      component.onDrop(dragEvent);
      fixture.detectChanges();

      expect(component.selectedFile()).toBe(mockFile);
      expect(component.selectedFileName()).toBe('test.jpg');
    });

    it('should ignore file selection, removal, and drop while submitting', () => {
      const initialFile = createMockFile('initial.png', 'image/png', 1024);
      const nextFile = createMockFile('next.png', 'image/png', 1024);
      component.onFileSelected({ target: { files: [initialFile] } } as unknown as Event);
      component.isSubmitting.set(true);
      fixture.detectChanges();

      component.onFileSelected({ target: { files: [nextFile] } } as unknown as Event);
      component.onFileRemove();

      const dragEvent = new DragEvent('drop');
      Object.defineProperty(dragEvent, 'dataTransfer', {
        value: { files: [nextFile] },
      });
      component.onDrop(dragEvent);

      expect(component.selectedFile()).toBe(initialFile);
      expect(mockSupportService.validateAttachment).toHaveBeenCalledTimes(1);
    });
  });

  describe('Form Submission', () => {
    it('should dispatch action with valid data and no attachment', fakeAsync(() => {
      spyOn(mockStore, 'dispatch');
      fillValidForm();

      component.onSubmit();
      tick();

      expect(mockMetadataCollector.collectMetadata).toHaveBeenCalledWith(
        mockAccountId,
        expectedEnvironment,
        '/account/support',
        mockActiveWheel.id
      );
      expect(mockStore.dispatch).toHaveBeenCalledWith(
        submitSupportRequest({
          request: {
            name: 'Test User',
            description: 'This is a test support request with sufficient detail',
            attachment: undefined,
            metadata: mockMetadata,
          },
        })
      );
    }));

    it('should dispatch action with attachment', fakeAsync(() => {
      spyOn(mockStore, 'dispatch');
      const mockFile = createMockFile('screenshot.png', 'image/png', 512000);
      fillValidForm();
      component.onFileSelected({ target: { files: [mockFile] } } as unknown as Event);
      fixture.detectChanges();

      component.onSubmit();
      tick();

      expect(mockStore.dispatch).toHaveBeenCalledWith(
        submitSupportRequest({
          request: {
            name: 'Test User',
            description: 'This is a test support request with sufficient detail',
            attachment: mockFile,
            metadata: mockMetadata,
          },
        })
      );
    }));

    it('should show loading state during submission', () => {
      fillValidForm();

      component.onSubmit();
      fixture.detectChanges();

      expect(component.isSubmitting()).toBeTrue();
      expect(queryByTestId('contact-support-progress')).toBeTruthy();
      expect(getSubmitButton().disabled).toBeTrue();
      expect(queryByTestId('button-loading-spinner')).toBeTruthy();
    });

    it('should handle success action and reset form', () => {
      const mockFile = createMockFile('test.pdf', 'application/pdf', 1024);
      fillValidForm();
      component.onFileSelected({ target: { files: [mockFile] } } as unknown as Event);
      component.isSubmitting.set(true);
      fixture.detectChanges();

      actionsSubject.next(submitSupportRequestSuccess({ ticketId: 'test-123' }));
      fixture.detectChanges();

      expect(component.supportForm.controls.name.value).toBe('');
      expect(component.supportForm.controls.description.value).toBe('');
      expect(component.selectedFile()).toBeNull();
      expect(component.selectedFileName()).toBeNull();
      expect(component.isSubmitting()).toBeFalse();
      expect(component.showSuccess()).toBeTrue();
      expect(queryByTestId('contact-support-success')).toBeTruthy();
    });

    it('should handle failure action and preserve form values', fakeAsync(() => {
      fillValidForm();
      component.isSubmitting.set(true);
      fixture.detectChanges();

      actionsSubject.next(submitSupportRequestFailure({ error: 'API Error' }));
      tick();
      fixture.detectChanges();

      expect(component.supportForm.controls.name.value).toBe('Test User');
      expect(component.supportForm.controls.description.value).toBe('This is a test support request with sufficient detail');
      expect(component.isSubmitting()).toBeFalse();
      expect(component.showError()).toBeTrue();
      expect(queryByTestId('contact-support-error')).toBeTruthy();
    }));

    it('should prevent double submission', fakeAsync(() => {
      spyOn(mockStore, 'dispatch');
      fillValidForm();

      component.onSubmit();
      component.onSubmit();
      tick();

      expect(mockStore.dispatch).toHaveBeenCalledTimes(1);
    }));
  });

  describe('Metadata Collection', () => {
    it('should include metadata in dispatched request payload', fakeAsync(() => {
      spyOn(mockStore, 'dispatch');
      fillValidForm();

      component.onSubmit();
      tick();

      expect(mockStore.dispatch).toHaveBeenCalledWith(
        jasmine.objectContaining({
          request: jasmine.objectContaining({
            metadata: mockMetadata,
          }),
          type: submitSupportRequest.type,
        })
      );
    }));

    it('should handle missing active wheel id', fakeAsync(() => {
      mockStore.overrideSelector(selectActiveWheel, null);
      mockStore.refreshState();
      fixture.detectChanges();
      fillValidForm();

      component.onSubmit();
      tick();

      expect(mockMetadataCollector.collectMetadata).toHaveBeenCalledWith(mockAccountId, expectedEnvironment, '/account/support', null);
    }));
  });
});
