import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  inject,
  OnInit,
  PLATFORM_ID,
  signal,
} from '@angular/core';

import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { sendInterestToSheet } from '../../../services/analytics/event-tracker.service';
import { AnalyticsService } from '../../../services/analytics/analytics.service';
import { CtaButtonComponent } from '../../cta-button/cta-button.component';
import { submitFeatureRequest, submitFeatureRequestFailure, submitFeatureRequestSuccess } from '../../../state';
import { Store } from '@ngrx/store';
import { Actions, ofType } from '@ngrx/effects';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { setEmail } from '../../../utils/set-email.util';

@Component({
  selector: 'wil-waitlist-modal',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, CtaButtonComponent],
  templateUrl: './waitlist-modal.component.html',
  styleUrls: ['./waitlist-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WaitlistModalComponent implements OnInit, AfterViewChecked {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<WaitlistModalComponent>);
  private readonly dialogData = inject<AnalyticsDialogData>(MAT_DIALOG_DATA);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly store = inject(Store);
  private readonly actions$ = inject(Actions);
  private readonly destroyRef = inject(DestroyRef);
  private readonly analytics = inject(AnalyticsService);
  private readonly platformId = inject(PLATFORM_ID);

  public readonly isSubmitted = signal(false);
  public readonly isLoading = signal(false);
  public readonly hasError = signal(false);

  public readonly waitlistForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    plan: [this.dialogData.planType],
    nickname: [''], // honey pot field
  });

  public get planType(): string {
    return this.dialogData.planType;
  }

  public get isFormValid(): boolean {
    return this.waitlistForm.valid && !this.isLoading();
  }

  ngOnInit(): void {
    // Track professional interest viewed when modal opens for Professional plan
    if (this.dialogData.planType === 'Professional') {
      this.analytics.track('professional_interest_viewed', {
        source: this.dialogData.source,
      });
    }
    this.actions$.pipe(ofType(submitFeatureRequestSuccess), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.isSubmitted.set(true);
      this.waitlistForm.disable();

      // Track successful professional interest submission
      if (this.dialogData.planType === 'Professional') {
        this.analytics.track('professional_interest_submitted', {
          result: 'success',
          source: this.dialogData.source,
        });
      }

      this.isLoading.set(false);
      this.cdr.markForCheck();
    });

    this.actions$.pipe(ofType(submitFeatureRequestFailure), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.handleError();
      this.isLoading.set(false);
    });
  }

  public onClose(): void {
    this.dialogRef.close();
  }

  ngAfterViewChecked() {
    setEmail(this.platformId);
  }

  public async onSubmit(): Promise<void> {
    if (!this.isFormValid) {
      return;
    }

    const formData = this.waitlistForm.value;

    // Check honey pot field - if filled, it's likely a bot
    if (formData.nickname) {
      return;
    }

    this.isLoading.set(true);
    this.hasError.set(false);

    const payload = {
      email: formData.email!,
      plan: formData.plan!,
      nickname: formData.nickname!,
      event: 'professional_interest',
      sentAt: new Date().toISOString(),
    };

    try {
      // Keep email sending logic unchanged - no PII sent to GA
      sendInterestToSheet(payload.email!, 'professional_cta', payload.plan!, 'professional_interest');
    } catch {
      /* empty */
    }

    this.store.dispatch(submitFeatureRequest({ request: payload }));
  }

  private handleError(): void {
    this.hasError.set(true);

    // Track failed professional interest submission
    if (this.dialogData.planType === 'Professional') {
      this.analytics.track('professional_interest_submitted', {
        result: 'error',
        source: this.dialogData.source,
      });
    }

    this.cdr.markForCheck();
  }
}
