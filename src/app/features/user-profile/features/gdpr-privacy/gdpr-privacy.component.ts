import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { Subject } from 'rxjs';
import * as GdprActions from '../../../../state/gdpr/gdpr.actions';
import { getGdprExport, selectGdprExport, selectGdprExportLoading } from '../../../../state/gdpr';
import { DeleteAccountDialogComponent } from '../../../../ui/dialogs/delete-account-dialog/delete-account-dialog.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'wil-gdpr-privacy',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatProgressBarModule],
  templateUrl: './gdpr-privacy.component.html',
  styleUrl: './gdpr-privacy.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GdprPrivacyComponent implements OnInit {
  private readonly store = inject(Store);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);

  public readonly isLoading$ = this.store.select(selectGdprExportLoading);
  public readonly exportMeta$ = this.store.select(selectGdprExport);
  public readonly onDownload$ = new Subject<string>();

  public ngOnInit(): void {
    this.onDownload$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((downloadUrl) => {
      this.store.dispatch(GdprActions.gdprDownloadUrlRequested({ downloadUrl }));
    });

    this.store.dispatch(getGdprExport());
  }

  /**
   * Handle data export request
   */
  public onRequestExport(): void {
    this.store.dispatch(GdprActions.gdprExportRequested());
  }

  /**
   * Handle delete account request
   */
  public onDeleteAccount(): void {
    this.dialog.open(DeleteAccountDialogComponent, {
      width: '500px',
      disableClose: true,
      data: {},
    });
  }
}
