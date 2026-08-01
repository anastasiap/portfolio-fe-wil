import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { CtaButtonComponent } from '../../cta-button/cta-button.component';
import { Router } from '@angular/router';

@Component({
  selector: 'wil-session-saved-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, TranslateModule, CtaButtonComponent],
  template: `
    <mat-dialog-content>
      <p class="session-saved-dialog__message">
        {{ 'sessionSavingSuccessMessage' | translate }}
        <a
          class="session-saved-dialog__dashboard-link"
          (click)="navigateToDashboard()"
          (keydown.enter)="navigateToDashboard()"
          (keydown.space)="$event.preventDefault(); navigateToDashboard()"
          role="button"
          tabindex="0"
          data-testid="session-saved-dialog-dashboard-link"
        >
          {{ 'dashboard' | translate }}
        </a>
      </p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <wil-cta-button
        [disabled]="false"
        [loading]="false"
        (ctaClick)="closeDialog()"
        [style]="'primary'"
        [size]="'large'"
        [ctaText]="'close' | translate"
        data-testid="session-saved-dialog-close-button"
      ></wil-cta-button>
    </mat-dialog-actions>
  `,
  styleUrl: './session-saved-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SessionSavedDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<SessionSavedDialogComponent>);
  private readonly router = inject(Router);
  public readonly data: SessionSavedDialogData = inject(MAT_DIALOG_DATA);

  public navigateToDashboard(): void {
    this.router.navigate(['/app/dashboard']);
    this.closeDialog();
  }

  public closeDialog(): void {
    this.dialogRef.close();
  }
}
