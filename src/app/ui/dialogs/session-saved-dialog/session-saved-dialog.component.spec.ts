import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { CtaButtonComponent } from '../../cta-button/cta-button.component';

import { SessionSavedDialogComponent } from './session-saved-dialog.component';
import { MockStore, provideMockStore } from '@ngrx/store/testing';

describe('SessionSavedDialogComponent', () => {
  let component: SessionSavedDialogComponent;
  let fixture: ComponentFixture<SessionSavedDialogComponent>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<SessionSavedDialogComponent>>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockStore: MockStore;
  let mockData: SessionSavedDialogData;

  beforeEach(async () => {
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockData = { autoCloseTimeSeconds: 5 };

    await TestBed.configureTestingModule({
      imports: [SessionSavedDialogComponent, MatDialogModule, TranslateModule.forRoot(), NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: Router, useValue: mockRouter },
        { provide: MAT_DIALOG_DATA, useValue: mockData },
        TranslateService,
        provideMockStore({}),
      ],
    }).compileComponents();

    mockStore = TestBed.inject(MockStore);
    spyOn(mockStore, 'dispatch');
    spyOn(mockStore, 'select');

    fixture = TestBed.createComponent(SessionSavedDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Component creation and setup', () => {
    it('should create with mocked providers', () => {
      // Arrange & Act
      fixture.detectChanges();

      // Assert
      expect(component).toBeTruthy();
      expect(component.data).toEqual(mockData);
    });

    it('should provide mock store setup without selecting any selector in this component', () => {
      // Arrange & Act
      fixture.detectChanges();

      // Assert
      expect(mockStore.select).not.toHaveBeenCalled();
      expect(mockStore.dispatch).not.toHaveBeenCalled();
    });
  });

  describe('Public methods', () => {
    it('should close dialog when closeDialog is called', () => {
      // Arrange
      expect(mockDialogRef.close).not.toHaveBeenCalled();

      // Act
      component.closeDialog();

      // Assert
      expect(mockDialogRef.close).toHaveBeenCalledTimes(1);
    });

    it('should navigate to dashboard and close dialog when navigateToDashboard is called', () => {
      // Arrange
      expect(mockRouter.navigate).not.toHaveBeenCalled();
      expect(mockDialogRef.close).not.toHaveBeenCalled();

      // Act
      component.navigateToDashboard();

      // Assert
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/dashboard']);
      expect(mockDialogRef.close).toHaveBeenCalledTimes(1);
    });
  });

  describe('User interactions', () => {
    it('should call navigateToDashboard when dashboard link is clicked', () => {
      // Arrange
      spyOn(component, 'navigateToDashboard').and.callThrough();
      const dashboardLink = fixture.debugElement.query(By.css('[data-testid="session-saved-dialog-dashboard-link"]'));

      // Act
      dashboardLink.nativeElement.click();
      fixture.detectChanges();

      // Assert
      expect(component.navigateToDashboard).toHaveBeenCalledTimes(1);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/app/dashboard']);
      expect(mockDialogRef.close).toHaveBeenCalledTimes(1);
    });

    it('should call closeDialog when CTA emits ctaClick', () => {
      // Arrange
      spyOn(component, 'closeDialog').and.callThrough();
      const ctaDebugElement = fixture.debugElement.query(By.directive(CtaButtonComponent));

      // Act
      ctaDebugElement.componentInstance.ctaClick.emit();
      fixture.detectChanges();

      // Assert
      expect(component.closeDialog).toHaveBeenCalledTimes(1);
      expect(mockDialogRef.close).toHaveBeenCalledTimes(1);
    });
  });

  describe('Template rendering', () => {
    it('should render message, dashboard link, and close button test id attributes', () => {
      // Arrange & Act
      const messageElement = fixture.debugElement.query(By.css('.session-saved-dialog__message'));
      const dashboardLink = fixture.debugElement.query(By.css('[data-testid="session-saved-dialog-dashboard-link"]'));
      const closeButton = fixture.debugElement.query(By.css('[data-testid="session-saved-dialog-close-button"]'));

      // Assert
      expect(messageElement).toBeTruthy();
      expect(dashboardLink).toBeTruthy();
      expect(closeButton).toBeTruthy();
    });
  });

  describe('Snapshot', () => {
    it('should match expected DOM snapshot', () => {
      // Arrange
      fixture.detectChanges();

      // Act
      const renderedHtml = (fixture.nativeElement as HTMLElement).innerHTML.replace(/\s+/g, ' ').trim();

      // Assert
      expect(renderedHtml).toContain('session-saved-dialog__message');
      expect(renderedHtml).toContain('data-testid="session-saved-dialog-dashboard-link"');
      expect(renderedHtml).toContain('data-testid="session-saved-dialog-close-button"');
    });
  });
});
