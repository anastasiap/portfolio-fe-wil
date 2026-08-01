import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Action } from '@ngrx/store';
import { getEffectsMetadata } from '@ngrx/effects';
import { provideMockActions } from '@ngrx/effects/testing';
import { TestScheduler } from 'rxjs/testing';
import { Observable } from 'rxjs';
import { logoutRequested } from '../auth/auth.actions';
import { FileDownloadService } from '../../services/file-download.service';
import { GdprDataService } from '../../services/gdpr/gdpr-data.service';
import { GdprExportResponse } from '../../services/gdpr/gdpr.types';
import { NotificationService } from '../../services/notification.service';
import { GdprEffects } from './gdpr.effects';
import * as GdprActions from './gdpr.actions';

describe('GdprEffects', () => {
  let actions$: Observable<Action>;
  let effects: GdprEffects;
  let testScheduler: TestScheduler;
  let gdprDataService: jasmine.SpyObj<GdprDataService>;
  let notificationService: jasmine.SpyObj<NotificationService>;
  let fileDownloadService: jasmine.SpyObj<FileDownloadService>;
  let router: jasmine.SpyObj<Router>;

  const createExportResponse = (overrides: Partial<GdprExportResponse> = {}): GdprExportResponse => ({
    exportId: 'export-1',
    status: 'ready',
    expiresAt: '2099-01-01T00:00:00.000Z',
    downloadUrl: '/gdpr/exports/export-1/download',
    ...overrides,
  });

  beforeEach(() => {
    gdprDataService = jasmine.createSpyObj<GdprDataService>('GdprDataService', [
      'createExport',
      'deleteAccount',
      'getDownloadUrl',
      'getExports',
    ]);
    notificationService = jasmine.createSpyObj<NotificationService>('NotificationService', ['showError', 'showSuccess']);
    fileDownloadService = jasmine.createSpyObj<FileDownloadService>('FileDownloadService', ['downloadUrl']);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        GdprEffects,
        provideMockActions(() => actions$),
        { provide: GdprDataService, useValue: gdprDataService },
        { provide: NotificationService, useValue: notificationService },
        { provide: FileDownloadService, useValue: fileDownloadService },
        { provide: Router, useValue: router },
      ],
    });

    effects = TestBed.inject(GdprEffects);
    testScheduler = new TestScheduler((actual, expected) => expect(actual).toEqual(expected));
  });

  it('should create an export, notify the user, and dispatch gdprExportSucceeded', () => {
    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      const response = createExportResponse();
      const outcome = GdprActions.gdprExportSucceeded({
        exportId: 'export-1',
        expiresAt: '2099-01-01T00:00:00.000Z',
        downloadUrl: '/gdpr/exports/export-1/download',
      });

      actions$ = hot('-a', { a: GdprActions.gdprExportRequested() });
      gdprDataService.createExport.and.returnValue(cold('-b|', { b: response }));

      expectObservable(effects.createExport$).toBe('--c', { c: outcome });
      flush();
      expect(notificationService.showSuccess).toHaveBeenCalledOnceWith('Data is ready to be exported.');
    });
  });

  it('should notify and dispatch gdprExportFailed when export creation fails', () => {
    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      const error = { status: 500, message: 'Server error' };

      actions$ = hot('-a', { a: GdprActions.gdprExportRequested() });
      gdprDataService.createExport.and.returnValue(cold('-#', undefined, error));

      expectObservable(effects.createExport$).toBe('--c', { c: GdprActions.gdprExportFailed({ error }) });
      flush();
      expect(notificationService.showError).toHaveBeenCalledOnceWith('Failed to prepare data for export. Please try again.');
    });
  });

  it('should dispatch getGdprExportSucceeded for the latest non-expired export', () => {
    testScheduler.run(({ hot, cold, expectObservable }) => {
      const response = createExportResponse({ exportId: 'latest-export' });
      const outcome = GdprActions.getGdprExportSucceeded({
        exportId: 'latest-export',
        expiresAt: '2099-01-01T00:00:00.000Z',
        downloadUrl: '/gdpr/exports/export-1/download',
      });

      actions$ = hot('-a', { a: GdprActions.getGdprExport() });
      gdprDataService.getExports.and.returnValue(cold('-b|', { b: [response] }));

      expectObservable(effects.getExport$).toBe('--c', { c: outcome });
    });
  });

  it('should dispatch getGdprExportFailed when there are no exports', () => {
    testScheduler.run(({ hot, cold, expectObservable }) => {
      actions$ = hot('-a', { a: GdprActions.getGdprExport() });
      gdprDataService.getExports.and.returnValue(cold('-b|', { b: [] }));

      expectObservable(effects.getExport$).toBe('--c', {
        c: GdprActions.getGdprExportFailed({ error: { message: 'No exports found' } }),
      });
    });
  });

  it('should dispatch getGdprExportFailed when the latest export is expired', () => {
    testScheduler.run(({ hot, cold, expectObservable }) => {
      const expiredExport = createExportResponse({ expiresAt: '2000-01-01T00:00:00.000Z' });

      actions$ = hot('-a', { a: GdprActions.getGdprExport() });
      gdprDataService.getExports.and.returnValue(cold('-b|', { b: [expiredExport] }));

      expectObservable(effects.getExport$).toBe('--c', {
        c: GdprActions.getGdprExportFailed({ error: { message: 'Export has expired' } }),
      });
    });
  });

  it('should notify and dispatch getGdprExportFailed when loading exports fails', () => {
    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      const error = { status: 400, message: 'Could not load exports' };

      actions$ = hot('-a', { a: GdprActions.getGdprExport() });
      gdprDataService.getExports.and.returnValue(cold('-#', undefined, error));

      expectObservable(effects.getExport$).toBe('--c', { c: GdprActions.getGdprExportFailed({ error }) });
      flush();
      expect(notificationService.showError).toHaveBeenCalledOnceWith('Failed to generate export. Please try again.');
    });
  });

  it('should get a download URL and dispatch gdprDownloadUrlSucceeded', () => {
    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      actions$ = hot('-a', {
        a: GdprActions.gdprDownloadUrlRequested({ downloadUrl: '/gdpr/exports/export-1/download' }),
      });
      gdprDataService.getDownloadUrl.and.returnValue(cold('-b|', { b: 'https://storage.example/export.zip' }));

      expectObservable(effects.getDownloadUrl$).toBe('--c', {
        c: GdprActions.gdprDownloadUrlSucceeded({ sasUrl: 'https://storage.example/export.zip' }),
      });
      flush();
      expect(gdprDataService.getDownloadUrl).toHaveBeenCalledOnceWith('/gdpr/exports/export-1/download');
    });
  });

  it('should notify and dispatch gdprDownloadUrlFailed when getting a download URL fails', () => {
    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      const error = { status: 404, message: 'Not found' };

      actions$ = hot('-a', {
        a: GdprActions.gdprDownloadUrlRequested({ downloadUrl: '/gdpr/exports/export-1/download' }),
      });
      gdprDataService.getDownloadUrl.and.returnValue(cold('-#', undefined, error));

      expectObservable(effects.getDownloadUrl$).toBe('--c', { c: GdprActions.gdprDownloadUrlFailed({ error }) });
      flush();
      expect(notificationService.showError).toHaveBeenCalledOnceWith('Failed to get download link. Please try again.');
    });
  });

  it('should download the export and notify on download URL success without dispatching', () => {
    testScheduler.run(({ hot, expectObservable, flush }) => {
      const action = GdprActions.gdprDownloadUrlSucceeded({ sasUrl: 'https://storage.example/export.zip' });

      actions$ = hot('-a-|', {
        a: action,
      });

      expect(getEffectsMetadata(effects).downloadSuccess$?.dispatch).toBeFalse();
      expectObservable(effects.downloadSuccess$).toBe('-a-|', { a: action });
      flush();
      expect(fileDownloadService.downloadUrl).toHaveBeenCalledOnceWith('https://storage.example/export.zip', 'wheeloflife-data-export.zip');
      expect(notificationService.showSuccess).toHaveBeenCalledOnceWith('Export ready. Download started.');
    });
  });

  it('should dispatch deleteAccountSucceeded when account deletion succeeds', () => {
    testScheduler.run(({ hot, cold, expectObservable }) => {
      actions$ = hot('-a', { a: GdprActions.deleteAccountRequested() });
      gdprDataService.deleteAccount.and.returnValue(cold('-b|', { b: undefined }));

      expectObservable(effects.deleteAccount$).toBe('--c', { c: GdprActions.deleteAccountSucceeded() });
    });
  });

  it('should notify and dispatch deleteAccountFailed when account deletion fails', () => {
    testScheduler.run(({ hot, cold, expectObservable, flush }) => {
      const error = { status: 403, message: 'Forbidden' };

      actions$ = hot('-a', { a: GdprActions.deleteAccountRequested() });
      gdprDataService.deleteAccount.and.returnValue(cold('-#', undefined, error));

      expectObservable(effects.deleteAccount$).toBe('--c', { c: GdprActions.deleteAccountFailed({ error }) });
      flush();
      expect(notificationService.showError).toHaveBeenCalledOnceWith('Failed to delete account. Please try again.');
    });
  });

  it('should notify, navigate home, and dispatch logoutRequested after account deletion succeeds', () => {
    testScheduler.run(({ hot, expectObservable, flush }) => {
      actions$ = hot('-a', { a: GdprActions.deleteAccountSucceeded() });

      expectObservable(effects.deleteAccountSuccess$).toBe('-b', { b: logoutRequested() });
      flush();
      expect(notificationService.showSuccess).toHaveBeenCalledOnceWith('Account deleted successfully');
      expect(router.navigate).toHaveBeenCalledOnceWith(['/']);
    });
  });
});
