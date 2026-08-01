import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { TranslateModule } from '@ngx-translate/core';
import { CtaButtonComponent } from '../../cta-button/cta-button.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'wil-save-results-confirmation-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatCheckboxModule, TranslateModule, CtaButtonComponent, FormsModule],
  template: `
    <h2 mat-dialog-title>{{ data.title | translate }}</h2>
    <mat-dialog-content>
      <p class="save-results-confirmation-dialog__message">{{ data.message | translate }}</p>

      @if (data.showDontWarnCheckbox) {
        <div class="save-results-confirmation-dialog__checkbox-container">
          <mat-checkbox
            [(ngModel)]="dontWarnAgain"
            data-testid="save-results-confirmation-dont-warn-checkbox"
            class="save-results-confirmation-dialog__checkbox"
            >
            {{ 'dontWarnMeAnymore' | translate }}
          </mat-checkbox>
        </div>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <wil-cta-button
        [disabled]="false"
        [loading]="false"
        data-testid="save-results-confirmation-cancel-button"
        (ctaClick)="cancel()"
        [style]="'secondary'"
        [size]="'small'"
        [ctaText]="data.cancelText || 'cancel' | translate"
      ></wil-cta-button>
      <wil-cta-button
        [disabled]="false"
        [loading]="false"
        (ctaClick)="confirm()"
        [style]="'primary'"
        [size]="'small'"
        [ctaText]="data.confirmText || 'ok' | translate"
        data-testid="save-results-confirmation-confirm-button"
      ></wil-cta-button>
    </mat-dialog-actions>
    `,
  styleUrl: './save-results-confirmation-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SaveResultsConfirmationDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<SaveResultsConfirmationDialogComponent>);
  public readonly data: SaveResultsConfirmationData = inject(MAT_DIALOG_DATA);

  public dontWarnAgain = false;

  public confirm(): void {
    const result: SaveResultsConfirmationResult = {
      confirmed: true,
      dontWarnAgain: this.dontWarnAgain,
    };
    this.dialogRef.close(result);
  }

  public cancel(): void {
    const result: SaveResultsConfirmationResult = {
      confirmed: false,
      dontWarnAgain: false,
    };
    this.dialogRef.close(result);
  }
}
