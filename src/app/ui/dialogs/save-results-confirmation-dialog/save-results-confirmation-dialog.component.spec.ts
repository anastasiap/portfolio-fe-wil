import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { SaveResultsConfirmationDialogComponent } from './save-results-confirmation-dialog.component';
import { By } from '@angular/platform-browser';

describe('SaveResultsConfirmationDialogComponent', () => {
  let component: SaveResultsConfirmationDialogComponent;
  let fixture: ComponentFixture<SaveResultsConfirmationDialogComponent>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<SaveResultsConfirmationDialogComponent>>;
  let mockData: SaveResultsConfirmationData;

  beforeEach(async () => {
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    mockData = {
      title: 'saveSessionConfirmTitle',
      message: 'saveSessionConfirmMessage',
      confirmText: 'continueWithSession',
      cancelText: 'cancelSaving',
      showDontWarnCheckbox: true,
    };

    await TestBed.configureTestingModule({
      imports: [
        SaveResultsConfirmationDialogComponent,
        MatDialogModule,
        MatCheckboxModule,
        FormsModule,
        TranslateModule.forRoot(),
        NoopAnimationsModule,
      ],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockData },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SaveResultsConfirmationDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render title and message', () => {
    // Arrange & Act
    const titleElement = fixture.debugElement.query(By.css('h2[mat-dialog-title]'));
    const messageElement = fixture.debugElement.query(By.css('.save-results-confirmation-dialog__message'));

    // Assert
    expect(titleElement).toBeTruthy();
    expect(messageElement).toBeTruthy();
  });

  it('should render checkbox when showDontWarnCheckbox is true', () => {
    // Arrange & Act
    const checkboxElement = fixture.debugElement.query(By.css('[data-testid="save-results-confirmation-dont-warn-checkbox"]'));
    const checkboxContainer = fixture.debugElement.query(By.css('.save-results-confirmation-dialog__checkbox-container'));

    // Assert
    expect(checkboxElement).toBeTruthy();
    expect(checkboxContainer).toBeTruthy();
  });

  it('should not render checkbox when showDontWarnCheckbox is false', async () => {
    // Arrange
    component.data.showDontWarnCheckbox = false;
    fixture.detectChanges();

    // Act
    const checkboxElement = fixture.debugElement.query(By.css('[data-testid="save-results-confirmation-dont-warn-checkbox"]'));
    const checkboxContainer = fixture.debugElement.query(By.css('.save-results-confirmation-dialog__checkbox-container'));

    // Assert
    expect(checkboxElement).toBeFalsy();
    expect(checkboxContainer).toBeFalsy();
  });

  it('should render confirm and cancel buttons', () => {
    // Arrange & Act
    const confirmButton = fixture.debugElement.query(By.css('[data-testid="save-results-confirmation-confirm-button"]'));
    const cancelButton = fixture.debugElement.query(By.css('[data-testid="save-results-confirmation-cancel-button"]'));

    // Assert
    expect(confirmButton).toBeTruthy();
    expect(cancelButton).toBeTruthy();
  });

  it('should close dialog with confirmed=true and dontWarnAgain=false when confirm clicked without checkbox', () => {
    // Arrange
    const confirmButton = fixture.debugElement.query(By.css('[data-testid="save-results-confirmation-confirm-button"]'));
    const expectedResult: SaveResultsConfirmationResult = {
      confirmed: true,
      dontWarnAgain: false,
    };

    // Act
    confirmButton.triggerEventHandler('ctaClick');
    fixture.detectChanges();

    // Assert
    expect(mockDialogRef.close).toHaveBeenCalledWith(expectedResult);
  });

  it('should close dialog with confirmed=true and dontWarnAgain=true when confirm clicked with checkbox checked', () => {
    // Arrange
    component.dontWarnAgain = true;
    const confirmButton = fixture.debugElement.query(By.css('[data-testid="save-results-confirmation-confirm-button"]'));
    const expectedResult: SaveResultsConfirmationResult = {
      confirmed: true,
      dontWarnAgain: true,
    };

    // Act
    confirmButton.triggerEventHandler('ctaClick');
    fixture.detectChanges();

    // Assert
    expect(mockDialogRef.close).toHaveBeenCalledWith(expectedResult);
  });

  it('should close dialog with confirmed=false when cancel clicked', () => {
    // Arrange
    const cancelButton = fixture.debugElement.query(By.css('[data-testid="save-results-confirmation-cancel-button"]'));
    const expectedResult: SaveResultsConfirmationResult = {
      confirmed: false,
      dontWarnAgain: false,
    };

    // Act
    cancelButton.triggerEventHandler('ctaClick');
    fixture.detectChanges();

    // Assert
    expect(mockDialogRef.close).toHaveBeenCalledWith(expectedResult);
  });

  it('should update dontWarnAgain when checkbox is clicked', async () => {
    // Arrange
    const checkboxElement = fixture.debugElement.query(By.css('[data-testid="save-results-confirmation-dont-warn-checkbox"] input'));
    expect(component.dontWarnAgain).toBe(false);

    // Act
    checkboxElement.nativeElement.click();
    fixture.detectChanges();
    await fixture.whenStable();

    // Assert
    expect(component.dontWarnAgain).toBe(true);
  });
});
