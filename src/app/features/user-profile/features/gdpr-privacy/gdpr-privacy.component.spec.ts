import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialog } from '@angular/material/dialog';
import { MockStore, provideMockStore } from '@ngrx/store/testing';

import { GdprPrivacyComponent } from './gdpr-privacy.component';
import * as GdprActions from '../../../../state/gdpr/gdpr.actions';
import { selectGdprExport, selectGdprExportLoading } from '../../../../state/gdpr/gdpr.selectors';
import { GdprExportState } from '../../../../state/gdpr/gdpr.types';
import { DeleteAccountDialogComponent } from '../../../../ui/dialogs/delete-account-dialog/delete-account-dialog.component';

describe('GdprPrivacyComponent', () => {
  let fixture: ComponentFixture<GdprPrivacyComponent>;
  let store: MockStore;
  let dialog: jasmine.SpyObj<MatDialog>;

  const idleExportState: GdprExportState = {
    status: 'idle',
    exportId: undefined,
    expiresAt: undefined,
    downloadUrl: undefined,
    error: undefined,
    sasUrl: undefined,
  };

  beforeEach(async () => {
    dialog = jasmine.createSpyObj<MatDialog>('MatDialog', ['open']);

    await TestBed.configureTestingModule({
      imports: [GdprPrivacyComponent, NoopAnimationsModule],
      providers: [
        provideMockStore({
          selectors: [
            { selector: selectGdprExportLoading, value: false },
            { selector: selectGdprExport, value: idleExportState },
          ],
        }),
        { provide: MatDialog, useValue: dialog },
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    fixture = TestBed.createComponent(GdprPrivacyComponent);
    spyOn(store, 'dispatch').and.callThrough();
  });

  afterEach(() => {
    fixture.destroy();
  });

  const setExportState = (exportState: GdprExportState): void => {
    store.overrideSelector(selectGdprExport, exportState);
    store.overrideSelector(selectGdprExportLoading, exportState.status === 'loading');
    store.refreshState();
  };

  const getPrepareButton = (): HTMLButtonElement => {
    return fixture.debugElement.queryAll(By.css('[data-testid="download-data-button"]'))[0].nativeElement as HTMLButtonElement;
  };

  const getDownloadButton = (): HTMLButtonElement | null => {
    const buttons = fixture.debugElement.queryAll(By.css('[data-testid="download-data-button"]'));

    return buttons.length > 1 ? (buttons[1].nativeElement as HTMLButtonElement) : null;
  };

  it('should dispatch getGdprExport on init', () => {
    // Arrange

    // Act
    fixture.detectChanges();

    // Assert
    expect(store.dispatch).toHaveBeenCalledWith(GdprActions.getGdprExport());
  });

  describe('data export', () => {
    it('should dispatch gdprExportRequested when prepare data button is clicked', () => {
      // Arrange
      fixture.detectChanges();
      const prepareButton = getPrepareButton();

      // Act
      prepareButton.click();
      fixture.detectChanges();

      // Assert
      expect(store.dispatch).toHaveBeenCalledWith(GdprActions.gdprExportRequested());
    });

    it('should disable export buttons and show progress while export is loading', () => {
      // Arrange
      setExportState({
        ...idleExportState,
        status: 'loading',
        exportId: 'export-123',
        expiresAt: '2026-07-10T12:00:00.000Z',
        downloadUrl: 'https://example.com/export.zip',
      });

      // Act
      fixture.detectChanges();
      const prepareButton = getPrepareButton();
      const downloadButton = getDownloadButton();
      const progressBar = fixture.debugElement.query(By.css('[data-testid="export-progress-bar"]'));

      // Assert
      expect(prepareButton.disabled).toBeTrue();
      expect(downloadButton?.disabled).toBeTrue();
      expect(progressBar).toBeTruthy();
    });

    it('should enable download button and dispatch gdprDownloadUrlRequested when a download URL exists', () => {
      // Arrange
      const downloadUrl = 'https://example.com/export.zip';
      setExportState({
        ...idleExportState,
        status: 'success',
        exportId: 'export-123',
        expiresAt: '2026-07-10T12:00:00.000Z',
        downloadUrl,
      });
      fixture.detectChanges();
      const downloadButton = getDownloadButton();

      // Act
      downloadButton?.click();
      fixture.detectChanges();

      // Assert
      expect(downloadButton).toBeTruthy();
      expect(downloadButton?.disabled).toBeFalse();
      expect(store.dispatch).toHaveBeenCalledWith(GdprActions.gdprDownloadUrlRequested({ downloadUrl }));
    });

    it('should render download expiration information when export metadata has expiresAt', () => {
      // Arrange
      setExportState({
        ...idleExportState,
        status: 'success',
        exportId: 'export-123',
        expiresAt: '2026-07-10T12:00:00.000Z',
        downloadUrl: 'https://example.com/export.zip',
      });

      // Act
      fixture.detectChanges();
      const expiresInfo = fixture.debugElement.query(By.css('[data-testid="expires-info"]'));

      // Assert
      expect(expiresInfo).toBeTruthy();
      expect(expiresInfo.nativeElement.textContent).toContain('Download link expires:');
    });
  });

  describe('delete account', () => {
    it('should open delete account dialog when delete account button is clicked', () => {
      // Arrange
      fixture.detectChanges();
      const deleteButton = fixture.debugElement.query(By.css('[data-testid="delete-account-button"]')).nativeElement as HTMLButtonElement;

      // Act
      deleteButton.click();
      fixture.detectChanges();

      // Assert
      expect(dialog.open).toHaveBeenCalledWith(DeleteAccountDialogComponent, {
        width: '500px',
        disableClose: true,
        data: {},
      });
    });
  });
});
