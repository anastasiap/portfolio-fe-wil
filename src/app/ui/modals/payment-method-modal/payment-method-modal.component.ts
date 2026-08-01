import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';

import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BillingApiService } from '../../../services/api/billing-api.service';
import { BASE } from '../../../../configs/routes.config';
import { CtaButtonComponent } from '../../cta-button/cta-button.component';
import { AnalyticsService } from '../../../services/analytics/analytics.service';

@Component({
  selector: 'wil-payment-method-modal',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, CtaButtonComponent],
  templateUrl: './payment-method-modal.component.html',
  styleUrl: './payment-method-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentMethodModalComponent {
  private readonly dialogRef = inject(MatDialogRef<PaymentMethodModalComponent>);
  private readonly billingApi = inject(BillingApiService);
  private readonly analytics = inject(AnalyticsService);
  public readonly data = inject<PaymentMethodDialogData>(MAT_DIALOG_DATA);

  public readonly loadingState = signal<LoadingState>(null);
  public readonly errorMessage = signal<string | null>(null);

  public onPayWithCard(): void {
    this.errorMessage.set(null);
    this.loadingState.set('stripe');

    this.analytics.track('checkout_started', {
      plan: this.data.planName,
      source: 'plans_page',
    });

    const successUrl = `${window.location.origin}/${BASE}/account`;
    const cancelUrl = `${window.location.origin}/plans`;

    this.billingApi
      .createStripeCheckoutSession({
        plan: this.data.planName,
        successUrl,
        cancelUrl,
      })
      .subscribe({
        next: (response) => {
          if (response.sessionUrl) {
            window.location.href = response.sessionUrl;
          } else {
            this.handleError('No checkout URL received');
          }
        },
        error: (error) => {
          console.error('Stripe checkout error:', error);
          this.handleError("We couldn't start the payment session. Please try again or contact support.");
        },
      });
  }

  public onClose(): void {
    this.analytics.track('start_personal_plan_cancelled', {
      plan: this.data.planName,
      source: 'plans_page',
    });

    this.dialogRef.close();
  }

  private handleError(message: string): void {
    this.errorMessage.set(message);
    this.loadingState.set(null);
  }

  public get isStripeLoading(): boolean {
    return this.loadingState() === 'stripe';
  }

  public get isPayPalLoading(): boolean {
    return this.loadingState() === 'paypal';
  }

  public get isLoading(): boolean {
    return this.loadingState() !== null;
  }
}
