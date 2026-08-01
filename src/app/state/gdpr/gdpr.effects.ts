import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Router } from '@angular/router';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { of } from 'rxjs';

import { GdprDataService } from '../../services/gdpr/gdpr-data.service';
import { NotificationService } from '../../services/notification.service';
import { FileDownloadService } from '../../services/file-download.service';
import * as GdprActions from './gdpr.actions';
import * as AuthActions from '../auth/auth.actions';

/**
 * GDPR Effects
 * Handles side effects for GDPR actions
 */
@Injectable()
export class GdprEffects {
  private readonly actions$ = inject(Actions);
  private readonly gdprDataService = inject(GdprDataService);
  private readonly notificationService = inject(NotificationService);
  private readonly fileDownloadService = inject(FileDownloadService);
  private readonly router = inject(Router);

  /**
   * Create Export Effect
   * Handles the GDPR export request
   */
  createExport$ = createEffect(() =>
    this.actions$.pipe(
      ofType(GdprActions.gdprExportRequested),
      switchMap(() =>
        this.gdprDataService.createExport().pipe(
          map((response) => {
            this.notificationService.showSuccess(`Data is ready to be exported.`);
            return GdprActions.gdprExportSucceeded({
              exportId: response.exportId,
              expiresAt: response.expiresAt,
              downloadUrl: response.downloadUrl,
            });
          }),
          catchError((error) => {
            this.notificationService.showError('Failed to prepare data for export. Please try again.');
            return of(GdprActions.gdprExportFailed({ error }));
          })
        )
      )
    )
  );

  getExport$ = createEffect(() =>
    this.actions$.pipe(
      ofType(GdprActions.getGdprExport),
      switchMap(() =>
        this.gdprDataService.getExports().pipe(
          map((response) => {
            if (response.length === 0) {
              return GdprActions.getGdprExportFailed({ error: { message: 'No exports found' } });
            }

            const latestExport = response[0];
            const currentTime = new Date();
            const expiresAt = new Date(latestExport.expiresAt);

            if (expiresAt > currentTime) {
              return GdprActions.getGdprExportSucceeded({
                exportId: latestExport.exportId,
                expiresAt: latestExport.expiresAt,
                downloadUrl: latestExport.downloadUrl,
              });
            } else {
              return GdprActions.getGdprExportFailed({ error: { message: 'Export has expired' } });
            }
          }),
          catchError((error) => {
            this.notificationService.showError('Failed to generate export. Please try again.');
            return of(GdprActions.getGdprExportFailed({ error }));
          })
        )
      )
    )
  );

  /**
   * Get Download URL Effect
   * Fetches the SAS URL from backend redirect endpoint
   */
  getDownloadUrl$ = createEffect(() =>
    this.actions$.pipe(
      ofType(GdprActions.gdprDownloadUrlRequested),
      switchMap(({ downloadUrl }) =>
        this.gdprDataService.getDownloadUrl(downloadUrl).pipe(
          map((sasUrl) => GdprActions.gdprDownloadUrlSucceeded({ sasUrl })),
          catchError((error) => {
            this.notificationService.showError('Failed to get download link. Please try again.');
            return of(GdprActions.gdprDownloadUrlFailed({ error }));
          })
        )
      )
    )
  );

  /**
   * Download Success Effect
   * Triggers actual file download when SAS URL is obtained
   */
  downloadSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(GdprActions.gdprDownloadUrlSucceeded),
        tap(({ sasUrl }) => {
          this.fileDownloadService.downloadUrl(sasUrl, 'wheeloflife-data-export.zip');
          this.notificationService.showSuccess('Export ready. Download started.');
        })
      ),
    { dispatch: false }
  );

  /**
   * Delete Account Effect
   * Handles account deletion request
   */
  deleteAccount$ = createEffect(() =>
    this.actions$.pipe(
      ofType(GdprActions.deleteAccountRequested),
      switchMap(() =>
        this.gdprDataService.deleteAccount().pipe(
          map(() => GdprActions.deleteAccountSucceeded()),
          catchError((error) => {
            this.notificationService.showError('Failed to delete account. Please try again.');
            return of(GdprActions.deleteAccountFailed({ error }));
          })
        )
      )
    )
  );

  /**
   * Delete Account Success Effect
   * Handles post-deletion cleanup: logout user and redirect
   */
  deleteAccountSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(GdprActions.deleteAccountSucceeded),
      map(() => {
        this.notificationService.showSuccess('Account deleted successfully');
        this.router.navigate(['/']);
        return AuthActions.logoutRequested();
      })
    )
  );
}
