import { AfterViewChecked, ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { FormControl, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatIcon } from '@angular/material/icon';
import { MatRadioButton, MatRadioGroup } from '@angular/material/radio';
import { sendInterestToSheet } from '../../../../services/analytics/event-tracker.service';
import { AnalyticsService, GaEventsSource } from '../../../../services/analytics/analytics.service';
import { CtaButtonComponent } from '../../../../ui/cta-button/cta-button.component';
import { submitFeatureRequest, submitFeatureRequestFailure, submitFeatureRequestSuccess } from '../../../../state';
import { Store } from '@ngrx/store';
import { Actions, ofType } from '@ngrx/effects';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LockedFeatureDialogData } from '../../../auth-modal/plan-select-modal-content/typings';
import { setEmail } from '../../../../utils/set-email.util';

type LockedFeatureFormState = 'idle' | 'submitting' | 'success' | 'error';

@Component({
  selector: 'wil-locked-feature-form',
  standalone: true,
  templateUrl: './locked-feature-form.component.html',
  styleUrl: './locked-feature-form.component.scss',
  imports: [ReactiveFormsModule, MatFormField, MatInput, MatLabel, MatIcon, MatError, MatRadioButton, MatRadioGroup, CtaButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LockedFeatureFormComponent implements OnInit, AfterViewChecked {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly dialogRef = inject(MatDialogRef<LockedFeatureFormComponent>);
  private readonly store = inject(Store);
  private readonly actions$ = inject(Actions);
  private readonly destroyRef = inject(DestroyRef);
  private readonly analytics = inject(AnalyticsService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly data: LockedFeatureDialogData = inject(MAT_DIALOG_DATA);
  private readonly source: GaEventsSource = this.data.source;

  public readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    plan: ['personal', Validators.required],
    nickname: [''],
  });

  public readonly uiState = signal<LockedFeatureFormState>('idle');

  ngOnInit(): void {
    this.actions$.pipe(ofType(submitFeatureRequestSuccess), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.uiState.set('success');
      this.form.disable();

      // Auto-close after 3 seconds
      setTimeout(() => {
        this.onClose();
      }, 3000);
    });

    this.actions$.pipe(ofType(submitFeatureRequestFailure), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.handleError();
    });
  }

  ngAfterViewChecked(): void {
    setEmail(this.platformId);
  }

  get email(): FormControl<string> {
    return this.form.controls.email;
  }

  public onSubmit(): void {
    if (this.form.invalid || this.uiState() === 'submitting' || this.form.getRawValue().nickname) return;

    this.uiState.set('submitting');
    const eventName = this.source === 'save_categories' ? 'save_categories_interest' : 'save_results_interest';

    this.analytics.trackLegacyEvent('modal_send_interest_attempt', this.source);

    const formData = this.form.getRawValue();
    const payload = {
      email: formData.email,
      plan: formData.plan,
      nickname: formData.nickname,
      event: eventName,
      sentAt: new Date().toISOString(),
    };

    try {
      this.analytics.trackLegacyEvent('modal_send_interest_success', this.source);
      sendInterestToSheet(payload.email, this.source, payload.plan, 'modal_send_interest_success');
    } catch {
      /* empty */
    }

    this.store.dispatch(submitFeatureRequest({ request: payload }));
  }

  private handleError(): void {
    this.uiState.set('error');
    this.analytics.trackLegacyEvent('modal_send_interest_error', this.source);
  }

  public onClose(): void {
    this.dialogRef.close();
  }
}
