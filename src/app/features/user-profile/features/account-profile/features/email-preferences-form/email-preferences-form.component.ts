import { ChangeDetectionStrategy, Component, DestroyRef, inject, input, OnInit } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import {
  selectAccountEmailPreferences,
  selectEmailPreferencesError,
  selectEmailPreferencesSaving,
} from '../../../../../../state/auth/auth.selectors';
import { updateAccountEmailPreferences } from '../../../../../../state/auth/auth.actions';
import { take, withLatestFrom } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'wil-email-preferences-form',
  standalone: true,
  imports: [AsyncPipe, ReactiveFormsModule],
  templateUrl: './email-preferences-form.component.html',
  styleUrl: './email-preferences-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmailPreferencesFormComponent implements OnInit {
  private readonly store = inject(Store);
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(NonNullableFormBuilder);

  public readonly isCompoundForm = input<boolean>();

  public readonly emailPreferencesForm = this.formBuilder.group({
    marketingContent: false,
  });

  public readonly emailPreferencesSaving$ = this.store.select(selectEmailPreferencesSaving);
  private readonly emailPreferencesError$ = this.store.select(selectEmailPreferencesError);
  private readonly emailPreferences$ = this.store.select(selectAccountEmailPreferences);

  private marketingContentFc = this.emailPreferencesForm.controls.marketingContent;

  ngOnInit(): void {
    this.emailPreferences$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((preferences) => {
      this.emailPreferencesForm.patchValue(preferences, { emitEvent: false });
    });
  }

  /**
   * Save email preferences
   * Dispatches action with only changed values
   */
  public onSaveEmailPreferences(): void {
    if (this.emailPreferencesForm.invalid || this.emailPreferencesForm.pristine) {
      return;
    }

    // Dispatch action with patch
    this.store.dispatch(updateAccountEmailPreferences({ patch: { marketingContent: this.marketingContentFc.value } }));

    // Handle success by resetting form to pristine state
    this.emailPreferencesSaving$.pipe(withLatestFrom(this.emailPreferencesError$), take(1)).subscribe(([saving, error]) => {
      if (!saving && !error && this.emailPreferencesForm.dirty) {
        // Success - reset form to pristine and show success message
        this.emailPreferencesForm.markAsPristine();
      }
    });
  }

  /**
   * Get current form values for external access (e.g., compound forms)
   * Returns null if form is pristine (no user interaction)
   */
  public getFormValue(): { marketingContent: boolean } | null {
    if (this.emailPreferencesForm.pristine) {
      return null; // No user changes, don't send anything
    }

    return { marketingContent: this.marketingContentFc.value };
  }
}
