import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { Store } from '@ngrx/store';
import { map } from 'rxjs';
import * as AuthActions from '../../../../state/auth/auth.actions';
import {
  selectPortalLoading,
  selectResubscribeError,
  selectResubscribeLoading,
  selectSubscription,
  selectSubscriptionError,
  selectSubscriptionLoading,
  selectUpgradeError,
  selectUpgradeLoading,
} from '../../../../state/auth/auth.selectors';
import { CtaButtonComponent } from '../../../../ui/cta-button/cta-button.component';
import { BASE } from '../../../../../configs/routes.config';
import { Router } from '@angular/router';
import { MySubscriptionState } from '../../../../services/auth/auth.types';

const SUBSCRIPTION_STATUS_LABELS: Record<GetMySubscriptionResponseDto['status'], string> = {
  free: 'Free',
  active: 'Active',
  trial: 'Trial',
  trialing: 'Trial',
  cancelling: 'Cancelling',
  cancelled: 'Cancelled',
  canceled: 'Cancelled',
  payment_issue: 'Payment issue',
  unknown: 'Unknown',
};

interface SubscriptionBillingViewModel {
  readonly subscription: MySubscriptionState;
  readonly statusText: string;
  readonly priceWithInterval: string;
  readonly renewalText: string;
  readonly hasPaymentIssue: boolean;
  readonly isCancelledSubscription: boolean;
  readonly isFreePlan: boolean;
}

@Component({
  selector: 'wil-subscription-billing',
  standalone: true,
  imports: [AsyncPipe, MatButtonModule, CtaButtonComponent],
  templateUrl: './subscription-billing.component.html',
  styleUrl: './subscription-billing.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubscriptionBillingComponent {
  private readonly store = inject(Store);
  private readonly router = inject(Router);

  public readonly subscriptionViewModel$ = this.store
    .select(selectSubscription)
    .pipe(map((subscription) => this.toViewModel(subscription)));
  public readonly loading$ = this.store.select(selectSubscriptionLoading);
  public readonly error$ = this.store.select(selectSubscriptionError);
  public readonly portalLoading$ = this.store.select(selectPortalLoading);
  public readonly resubscribeLoading$ = this.store.select(selectResubscribeLoading);
  public readonly resubscribeError$ = this.store.select(selectResubscribeError);
  public readonly upgradeLoading$ = this.store.select(selectUpgradeLoading);
  public readonly upgradeError$ = this.store.select(selectUpgradeError);

  public onRetry(): void {
    this.store.dispatch(AuthActions.loadMySubscription());
  }

  public onManageSubscription(): void {
    const returnUrl = `${window.location.origin}/${BASE}/account/subscription`;
    this.store.dispatch(
      AuthActions.createPortalSession({
        request: { returnUrl },
      })
    );
  }

  public onResubscribe(): void {
    this.store.dispatch(AuthActions.resubscribe());
  }

  public onUpgradeToPersonal(): void {
    const origin = window.location.origin;
    this.store.dispatch(
      AuthActions.createUpgradeCheckoutSession({
        request: {
          targetPlan: 'personal',
          successUrl: `${origin}/${BASE}/account/subscription`,
          cancelUrl: `${origin}/${BASE}/account/subscription`,
        },
      })
    );
  }

  private toViewModel(subscription: MySubscriptionState | null): SubscriptionBillingViewModel | null {
    if (!subscription) {
      return null;
    }

    return {
      subscription,
      statusText: SUBSCRIPTION_STATUS_LABELS[subscription.status] || 'Unknown',
      priceWithInterval: this.getPriceWithInterval(subscription),
      renewalText: this.getRenewalText(subscription),
      hasPaymentIssue: subscription.status === 'payment_issue',
      isCancelledSubscription: subscription.status === 'cancelled',
      isFreePlan: subscription.status === 'free',
    };
  }

  private formatPrice(priceCents: number, currency: string | null): string {
    if (!priceCents) {
      return '';
    }

    if (!currency || priceCents === 0) {
      return 'Free';
    }

    const price = priceCents / 100;
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(price);
  }

  private formatDate(dateString: string | null): string {
    if (!dateString) {
      return '';
    }

    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'Europe/London',
    }).format(date);
  }

  private getPriceWithInterval(subscription: GetMySubscriptionResponseDto): string {
    const price = this.formatPrice(subscription.priceCents, subscription.currency);
    const interval = subscription.billingInterval;

    if (!price) {
      return '';
    }

    if (!interval) {
      return price;
    }

    return `${price} / ${interval}`;
  }

  private getRenewalText(subscription: GetMySubscriptionResponseDto): string {
    if (subscription.status === 'cancelling' && subscription.currentPeriodEnd) {
      return `Active until ${this.formatDate(subscription.currentPeriodEnd)}`;
    }

    if (subscription.currentPeriodEnd && subscription.status === 'active') {
      return `Next renewal: ${this.formatDate(subscription.currentPeriodEnd)}`;
    }

    return '';
  }

  public navigateToSupport(): void {
    this.router.navigate([`/${BASE}/account/support`]);
  }
}
