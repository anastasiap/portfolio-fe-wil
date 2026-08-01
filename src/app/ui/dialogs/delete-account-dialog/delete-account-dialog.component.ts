import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { selectDeleteAccountError, selectDeleteAccountLoading } from '../../../state/gdpr/gdpr.selectors';
import { deleteAccountRequested, deleteAccountStateReset } from '../../../state/gdpr/gdpr.actions';

@Component({
  selector: 'wil-delete-account-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatCheckboxModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressBarModule,
    ReactiveFormsModule,
  ],
  templateUrl: './delete-account-dialog.component.html',
  styleUrl: './delete-account-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteAccountDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<DeleteAccountDialogComponent>);
  private readonly store = inject(Store);
  private readonly fb = inject(FormBuilder);

  public readonly step = signal<1 | 2>(1);
  public readonly isLoading$ = this.store.select(selectDeleteAccountLoading);
  public readonly error$ = this.store.select(selectDeleteAccountError);

  public readonly confirmForm: FormGroup = this.fb.group({
    confirmPermanent: [false, Validators.requiredTrue],
    typedPhrase: ['', [Validators.required, Validators.pattern(/^DELETE$/)]],
  });

  constructor() {
    // Reset state when dialog opens
    this.store.dispatch(deleteAccountStateReset());
  }

  public onCancel(): void {
    this.dialogRef.close({ confirmed: false });
  }

  public onContinue(): void {
    this.step.set(2);
  }

  public onBack(): void {
    this.step.set(1);
  }

  public onConfirmDelete(): void {
    if (this.confirmForm.valid) {
      this.store.dispatch(deleteAccountRequested());
      this.dialogRef.close({ confirmed: true });
    }
  }
}
