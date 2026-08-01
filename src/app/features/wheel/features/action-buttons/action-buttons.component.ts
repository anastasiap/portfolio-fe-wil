import { ChangeDetectionStrategy, Component, computed, inject, input, output, PLATFORM_ID } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { Store } from '@ngrx/store';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import {
  addCategory,
  addFreePlanCategory,
  createDefaultPersonalWheel,
  createWheelForUser,
  deletePersonalWheel,
  loadDefaultTemplate,
  resetMarks,
  saveSession,
  selectActiveWheel,
  selectCategories,
  selectHasAllScores,
  selectHasUnsavedCategoriesChanges,
  selectHasUnsavedSessionChanges,
  selectLinkData,
  selectMode,
  selectUserWheels,
  setActiveWheel,
  setMode,
} from '../../../../state';
import { ConfirmationDialogComponent } from '../../../../ui/dialogs/confirmation-dialog/confirmation-dialog.component';
import { SaveResultsConfirmationDialogComponent } from '../../../../ui/dialogs/save-results-confirmation-dialog/save-results-confirmation-dialog.component';
import { CookieService } from '../../../../services/cookie.service';
import { combineLatest, EMPTY, map, of, take } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import domToImage from 'dom-to-image';
import { CommonModule, DOCUMENT, isPlatformBrowser } from '@angular/common';
import { AnalyticsService } from '../../../../services/analytics/analytics.service';
import { MatIcon } from '@angular/material/icon';
import { FocusModalComponent } from '../focus-modal/focus-modal.component';
import { toSignal } from '@angular/core/rxjs-interop';
import { selectAccountId } from '../../../../state/auth/auth.selectors';
import { NEW_WHEEL_NAME } from '../wheel-name-form/wheel-name-form.component';
import { mapActiveWheel } from '../../../../utils/mappers/active-wheel.mapper';

import { DownloadImageModalComponent } from './ui/download-image-modal/download-image-modal.component';
import { DownloadImageModalData, FocusModalData } from './typings';
import { AuthModalComponent } from '../../../auth-modal/auth-modal.component';
import { AuthModalData } from '../../../auth-modal/auth-modal.types';
import { resolveButtonConfig } from '../../../../../configs/button-config';
import { COLORS, DONT_WARN_COOKIE } from '../../wheel.constants';

export const WHEEL_OF_LIFE = 'WheelOfLife';

@Component({
  selector: 'wil-action-buttons',
  standalone: true,
  imports: [CommonModule, TranslatePipe, MatIcon],
  templateUrl: './action-buttons.component.html',
  styleUrl: './action-buttons.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActionButtonsComponent {
  private readonly store = inject(Store);
  private readonly dialog = inject(MatDialog);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);
  private readonly cookieService = inject(CookieService);
  private readonly analytics = inject(AnalyticsService);

  public readonly wheelId = input.required<string>();
  public readonly disableSaveWheelButton = input<boolean>(false);
  public readonly type = input.required<'noAuth' | 'free' | 'personal' | 'professional'>();

  public readonly saveWheel = output<void>();

  private readonly mode = toSignal(this.store.select(selectMode), { initialValue: 'view' });
  private readonly accountId = toSignal(this.store.select(selectAccountId));
  private readonly linkData = toSignal(this.store.select(selectLinkData));

  public readonly config = computed(() => resolveButtonConfig(this.type(), this.mode()));
  public readonly saveResultBtnLabel = computed(() => (this.type() === 'noAuth' ? 'saveResult' : 'saveSession'));
  public readonly downloadBtnLabel = computed(() => (this.type() === 'noAuth' ? 'download' : 'downloadSession'));
  private readonly showFakeDoorModal = computed(() => !this.accountId() && !this.linkData());

  public readonly hasUnsavedWheelChanges$ = this.store.select(selectHasUnsavedCategoriesChanges);
  public readonly hasUnsavedScoreChanges$ = this.store.select(selectHasUnsavedSessionChanges);
  public readonly hasAllScores$ = this.store.select(selectHasAllScores);
  public readonly categories$ = this.store.select(selectCategories);

  private DEFAULT_COLORS = COLORS;

  public onDownloadClick(): void {
    this.categories$.pipe(take(1)).subscribe((categories) => {
      const dialogData: DownloadImageModalData = {
        categories,
      };

      this.dialog.open(DownloadImageModalComponent, {
        data: dialogData,
        width: '520px',
        maxWidth: 'calc(100vw - 2rem)',
        autoFocus: false,
        role: 'dialog',
      });

      void this.executeImageDownload();
    });
  }

  public createNewWheel(): void {
    this.store.dispatch(
      createWheelForUser({
        name: NEW_WHEEL_NAME,
        categoryIds: [],
        isDefault: true,
      })
    );
  }

  public createDefaultWheel(): void {
    this.store.dispatch(createDefaultPersonalWheel());
  }

  public deleteWheel(): void {
    const dialogData: ConfirmationDialogData = {
      title: 'warning',
      message: this.type() === 'noAuth' ? 'deleteWheelWarning' : 'deleteWheelAndSessionsWarning',
      confirmText: 'ok',
      cancelText: 'cancel',
    };

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: dialogData,
      width: '400px',
    });

    dialogRef
      .afterClosed()
      .pipe(take(1))
      .subscribe((result) => {
        if (!result) return;

        this.store.dispatch(deletePersonalWheel({ wheelId: this.wheelId() }));
      });
  }

  public editWheel() {
    this.hasUnsavedScoreChanges$.pipe(take(1)).subscribe((hasScore) => {
      if (hasScore) {
        this.alertResetMarks().add(() => {
          this.store.dispatch(setMode({ mode: 'edit' }));
        });
      } else {
        this.store.dispatch(setMode({ mode: 'edit' }));
      }
    });
  }

  public cancelEditWheel() {
    this.hasUnsavedWheelChanges$.pipe(take(1)).subscribe((hasChanges) => {
      if (hasChanges) {
        this.alertResetWheel();
      } else {
        this.store.dispatch(setMode({ mode: 'view' }));
      }
    });
  }

  public addCategory() {
    this.categories$
      .pipe(
        take(1),
        map((cat) => cat.length)
      )
      .subscribe((i) => {
        if (this.type() === 'noAuth') {
          this.store.dispatch(addFreePlanCategory({ color: this.DEFAULT_COLORS[i + 1] || '#989898' }));
          return;
        }
        this.store.dispatch(addCategory({ color: this.DEFAULT_COLORS[i] || '#989898' }));
      });
  }

  public async executeImageDownload(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const printOnly = this.document.getElementById('print-only');
    const wrapperToImage = this.document.getElementById('main-container');

    if (!wrapperToImage) {
      return;
    }

    const link = this.document.createElement('a');
    link.download = this.createDownloadFileName();

    const previousPrintOnlyVisibility = printOnly?.style.visibility;

    try {
      if (printOnly) {
        printOnly.style.visibility = 'visible';
      }

      link.href = await domToImage.toJpeg(wrapperToImage, { bgcolor: 'white', quality: 0.95 });
      link.click();
    } finally {
      if (printOnly) {
        printOnly.style.visibility = previousPrintOnlyVisibility ?? '';
      }
    }
  }

  public alertResetMarks() {
    const dialogData: ConfirmationDialogData = {
      title: 'warning',
      message: 'resetMarksWarning',
      confirmText: 'ok',
      cancelText: 'cancel',
    };

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: dialogData,
      width: '400px',
    });

    return dialogRef
      .afterClosed()
      .pipe(take(1))
      .subscribe((result) => {
        if (result === true) {
          this.store.dispatch(resetMarks());
        }
      });
  }

  public alertResetWheel() {
    const dialogData: ConfirmationDialogData = {
      title: 'warning',
      message: 'resetWheelWarning',
      confirmText: 'ok',
      cancelText: 'cancel',
    };

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: dialogData,
      width: '400px',
    });

    dialogRef
      .afterClosed()
      .pipe(
        switchMap((result) => {
          if (!result) return EMPTY;

          if (this.type() === 'noAuth') {
            this.store.dispatch(loadDefaultTemplate({ wheelId: this.wheelId() }));
            return EMPTY;
          }

          return this.store.select(selectUserWheels).pipe(take(1));
        }),
        map((wheels) => mapActiveWheel(wheels)),
        take(1)
      )
      .subscribe((wheel) => {
        if (!wheel) return;
        this.store.dispatch(setActiveWheel({ wheel }));
        this.store.dispatch(setMode({ mode: 'view' }));
      });
  }

  public saveCategories() {
    this.analytics.track('fake_door_clicked', {
      fake_door_type: 'save_categories',
      source: 'save_categories',
    });
    this.openLockedFeatureModal();
  }

  public send() {
    console.log('Sending...');
  }

  private openLockedFeatureModal() {
    const config: MatDialogConfig<AuthModalData> = {
      data: { initialView: 'register', feature: 'lock' },
      autoFocus: false, // Prevent weird focus jumps
      disableClose: false, // Allow ESC and backdrop click
      panelClass: 'modal-panel',
    };

    this.dialog.open(AuthModalComponent, config);
  }

  public setFocus(): void {
    const dialogData: FocusModalData = {
      source: 'client_view',
      wheelId: this.wheelId(),
    };

    this.dialog.open(FocusModalComponent, {
      data: dialogData,
      maxWidth: '500px',
      autoFocus: true,
      role: 'dialog',
      panelClass: 'modal-panel',
    });
  }

  public saveResults() {
    if (this.showFakeDoorModal()) {
      this.analytics.track('fake_door_clicked', {
        fake_door_type: 'save_results',
        source: 'save_results',
      });
      this.openLockedFeatureModal();
      return;
    }

    // Check if user has disabled confirmation warnings
    if (this.cookieService.hasCookie(DONT_WARN_COOKIE)) {
      this.performSaveResults();
      return;
    }

    // Show confirmation dialog with checkbox
    const confirmDialogData: SaveResultsConfirmationData = {
      title: 'saveSessionConfirmTitle',
      message: 'saveSessionConfirmMessage',
      confirmText: 'continueWithSession',
      cancelText: 'cancelSaving',
      showDontWarnCheckbox: true,
    };

    const confirmDialogRef = this.dialog.open(SaveResultsConfirmationDialogComponent, {
      data: confirmDialogData,
      width: '450px',
      disableClose: true,
    });

    confirmDialogRef
      .afterClosed()
      .pipe(take(1))
      .subscribe((result: SaveResultsConfirmationResult) => {
        if (!result || !result.confirmed) {
          return; // User cancelled
        }

        // If user checked "don't warn me", set permanent cookie
        if (result.dontWarnAgain) {
          this.cookieService.setCookie(DONT_WARN_COOKIE, 'true'); // No expiry = persistent
        }

        // User confirmed, proceed with save
        this.performSaveResults();
      });
  }

  private performSaveResults() {
    combineLatest([
      this.store.select(selectActiveWheel),
      this.store.select(selectAccountId),
      this.store.select(selectUserWheels),
      this.store.select(selectLinkData),
    ])
      .pipe(
        take(1),
        switchMap(([activeWheel, accountId, wheels, linkData]) => {
          const userWheel = wheels.find((w) => w.id === activeWheel?.id);

          if (!userWheel || !activeWheel) return EMPTY;

          const session = {
            accountId,
            wheelId: userWheel.id,
            wheelVersionId: userWheel.wheelVersionId,
            scaleMax: 10,
            scaleMin: 1,
            scores: activeWheel.categories.map((cat) => ({
              categoryId: cat.id,
              value: cat.score,
            })),
            focusAtSubmit: activeWheel.focus,
            locale: 'en',
            isDeleted: false,
          };

          return of({ activeWheel, session, linkData });
        })
      )
      .subscribe(({ activeWheel, session, linkData }) => {
        this.store.dispatch(saveSession({ activeWheel, session, token: linkData?.token }));
      });
  }

  private createDownloadFileName(): string {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear()).slice(-2);

    return `${WHEEL_OF_LIFE}-${day}-${month}-${year}.jpg`;
  }
}
