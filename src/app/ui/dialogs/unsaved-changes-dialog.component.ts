import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { CtaButtonComponent } from '../cta-button/cta-button.component';

@Component({
  selector: 'wil-unsaved-changes-dialog',
  standalone: true,
  imports: [MatButtonModule, MatDialogModule, CtaButtonComponent],
  template: `
    <div class="unsaved-changes-dialog">
      <h2 mat-dialog-title>Unsaved Scores</h2>
      <mat-dialog-content>
        <p>You have unsaved scores. Do you want to save before switching to another wheel?</p>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <wil-cta-button
          [disabled]="false"
          [loading]="false"
          (ctaClick)="onSaveAndSwitch()"
          [style]="'primary'"
          [size]="'small'"
          [ctaText]="'Save and Switch'"
          data-testid="save-and-switch-button"
        ></wil-cta-button>
        <wil-cta-button
          [disabled]="false"
          [loading]="false"
          (ctaClick)="onDiscardChanges()"
          [style]="'secondary'"
          [size]="'small'"
          [ctaText]="'Discard Changes'"
          data-testid="discard-changes-button"
        ></wil-cta-button>
        <wil-cta-button
          [disabled]="false"
          [loading]="false"
          (ctaClick)="onCancel()"
          [style]="'secondary'"
          [size]="'small'"
          [ctaText]="'Cancel'"
          data-testid="cancel-switch-button"
        ></wil-cta-button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [
    `
      .unsaved-changes-dialog {
        padding: 8px;
      }

      mat-dialog-content p {
        margin: 0;
        color: rgba(0, 0, 0, 0.6);
        line-height: 1.5;
      }

      mat-dialog-actions {
        display: flex;
        flex-direction: row;
        gap: 0.5rem;
      }

      mat-dialog-actions wil-cta-button {
        display: block;
        max-width: 30%;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnsavedChangesDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<UnsavedChangesDialogComponent>);

  public onSaveAndSwitch(): void {
    this.dialogRef.close({ action: 'save' });
  }

  public onDiscardChanges(): void {
    this.dialogRef.close({ action: 'discard' });
  }

  public onCancel(): void {
    this.dialogRef.close({ action: 'cancel' });
  }
}
