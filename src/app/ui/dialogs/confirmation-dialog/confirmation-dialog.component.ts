import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { CtaButtonComponent } from '../../cta-button/cta-button.component';

@Component({
  selector: 'wil-confirmation-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, TranslateModule, CtaButtonComponent],
  template: `
    <h2 mat-dialog-title>{{ data.title | translate }}</h2>
    <mat-dialog-content>
      <p>{{ data.message | translate }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <wil-cta-button
        [disabled]="false"
        [loading]="false"
        data-testid="wil-confirmation-dialog-cancel-button"
        (ctaClick)="dialog.closeAll()"
        [style]="'secondary'"
        [size]="'small'"
        [ctaText]="data.cancelText || 'cancel' | translate"
      ></wil-cta-button>
      <wil-cta-button
        [disabled]="false"
        [loading]="false"
        (ctaClick)="dialog.closeAll()"
        [style]="'primary'"
        [size]="'small'"
        [ctaText]="data.confirmText || 'ok' | translate"
        [mat-dialog-close]="true"
        data-testid="wil-confirmation-dialog-confirm-button"
      ></wil-cta-button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      mat-dialog-content {
        min-width: 300px;
        padding: 50px;
      }

      mat-dialog-actions {
        wil-cta-button {
          max-width: 130px;

          &:last-child {
            margin-left: 10px;
          }
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmationDialogComponent {
  public dialog = inject(MatDialog);
  public data: ConfirmationDialogData = inject(MAT_DIALOG_DATA);
}
