import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { MockStore, provideMockStore } from '@ngrx/store/testing';

import { SubscriptionBillingComponent } from './subscription-billing.component';
import { MySubscriptionState } from '../../../../services/auth/auth.types';
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

describe('SubscriptionBillingComponent', () => {
  let fixture: ComponentFixture<SubscriptionBillingComponent>;
  let store: MockStore;

  const mockRouter = jasmine.createSpyObj<Router>('Router', ['navigate']);

  const baseSubscription: MySubscriptionState = {
    planCode: 'personal',
    planLabel: 'Personal Plan',
    status: 'active',
    billingInterval: 'month',
    currency: 'gbp',
    priceCents: 1200,
    currentPeriodEnd: '2026-07-15T00:00:00.000Z',
    cancelAtPeriodEnd: false,
    entitlements: [],
    entitlementsLabels: ['Unlimited Wheels', 'Unlimited Sessions'],
    source: 'stripe',
  };

  const setSubscription = (subscription: MySubscriptionState | null): void => {
    store.overrideSelector(selectSubscription, subscription);
    store.refreshState();
    fixture.detectChanges();
  };

  const queryByTestId = (testId: string) => fixture.debugElement.query(By.css(`[data-testid="${testId}"]`));
  const queryAllByTestId = (testId: string) => fixture.debugElement.queryAll(By.css(`[data-testid="${testId}"]`));
  const getButtonInside = (testId: string): HTMLButtonElement => queryByTestId(testId).query(By.css('button')).nativeElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubscriptionBillingComponent, NoopAnimationsModule],
      providers: [
        provideMockStore({
          selectors: [
            { selector: selectSubscription, value: null },
            { selector: selectSubscriptionLoading, value: false },
            { selector: selectSubscriptionError, value: null },
            { selector: selectPortalLoading, value: false },
            { selector: selectResubscribeLoading, value: false },
            { selector: selectResubscribeError, value: null },
            { selector: selectUpgradeLoading, value: false },
            { selector: selectUpgradeError, value: null },
          ],
        }),
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    fixture = TestBed.createComponent(SubscriptionBillingComponent);
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('page states', () => {
    it('should render the loading state when subscription data is loading', () => {
      // Arrange
      store.overrideSelector(selectSubscriptionLoading, true);
      store.refreshState();

      // Act
      fixture.detectChanges();

      // Assert
      expect(queryByTestId('loading-state')).toBeTruthy();
      expect(queryByTestId('subscription-content')).toBeNull();
    });

    it('should render the error state and message when subscription loading fails', () => {
      // Arrange
      store.overrideSelector(selectSubscriptionError, { message: 'Unable to load billing details' });
      store.refreshState();

      // Act
      fixture.detectChanges();

      // Assert
      const errorState = queryByTestId('error-state');
      expect(errorState).toBeTruthy();
      expect(errorState.nativeElement.textContent).toContain('Unable to load billing details');
    });

    it('should render current plan data when a subscription is available', () => {
      // Arrange
      const subscription: MySubscriptionState = {
        ...baseSubscription,
        planLabel: 'Personal Monthly',
        status: 'active',
        priceCents: 1299,
        currentPeriodEnd: '2026-07-20T00:00:00.000Z',
      };

      // Act
      setSubscription(subscription);

      // Assert
      expect(queryByTestId('subscription-content')).toBeTruthy();
      expect(queryByTestId('plan-name').nativeElement.textContent).toContain('Personal Monthly');
      expect(queryByTestId('plan-status').nativeElement.textContent).toContain('Active');
      expect(fixture.debugElement.query(By.css('.plan-pricing__price')).nativeElement.textContent).toContain('12.99 / month');
      expect(queryByTestId('renewal-text').nativeElement.textContent).toContain('Next renewal: 20 Jul 2026');
    });

    it('should render active-until text for a cancelling subscription', () => {
      // Arrange
      const subscription: MySubscriptionState = {
        ...baseSubscription,
        status: 'cancelling',
        currentPeriodEnd: '2026-08-25T00:00:00.000Z',
      };

      // Act
      setSubscription(subscription);

      // Assert
      expect(queryByTestId('plan-status').nativeElement.textContent).toContain('Cancelling');
      expect(queryByTestId('renewal-text').nativeElement.textContent).toContain('Active until 25 Aug 2026');
    });

    it('should not render renewal text when the subscription has no current period end', () => {
      // Arrange
      const subscription: MySubscriptionState = {
        ...baseSubscription,
        currentPeriodEnd: null,
      };

      // Act
      setSubscription(subscription);

      // Assert
      expect(queryByTestId('renewal-text')).toBeNull();
    });

    it('should render supported status labels from the subscription view model', () => {
      // Arrange
      const subscription: MySubscriptionState = {
        ...baseSubscription,
        status: 'trialing',
      };

      // Act
      setSubscription(subscription);

      // Assert
      expect(queryByTestId('plan-status').nativeElement.textContent).toContain('Trial');
    });
  });

  describe('features card', () => {
    it('should render entitlement labels when features are included', () => {
      // Arrange
      const subscription: MySubscriptionState = {
        ...baseSubscription,
        entitlementsLabels: ['Custom Wheels', 'Session History'],
      };

      // Act
      setSubscription(subscription);

      // Assert
      const featureItems = queryAllByTestId('feature-item');
      expect(featureItems.length).toBe(2);
      expect(featureItems[0].nativeElement.textContent).toContain('Custom Wheels');
      expect(featureItems[1].nativeElement.textContent).toContain('Session History');
      expect(queryByTestId('no-features')).toBeNull();
    });

    it('should render the empty features message when no entitlement labels are included', () => {
      // Arrange
      const subscription: MySubscriptionState = {
        ...baseSubscription,
        entitlementsLabels: [],
      };

      // Act
      setSubscription(subscription);

      // Assert
      expect(queryByTestId('features-list')).toBeNull();
      expect(queryByTestId('no-features').nativeElement.textContent).toContain('No additional features enabled.');
    });
  });

  describe('subscription management branches', () => {
    it('should render the upgrade card for a free subscription', () => {
      // Arrange
      const subscription: MySubscriptionState = {
        ...baseSubscription,
        planCode: 'free',
        planLabel: 'Free Plan',
        status: 'free',
        billingInterval: null,
        currency: null,
        priceCents: 0,
        currentPeriodEnd: null,
        source: 'local',
      };

      // Act
      setSubscription(subscription);

      // Assert
      expect(queryByTestId('upgrade-plan-card')).toBeTruthy();
      expect(queryByTestId('upgrade-perks-list')).toBeTruthy();
      expect(queryByTestId('upgrade-perk-wheels').nativeElement.textContent).toContain('Unlimited Wheels');
      expect(queryByTestId('upgrade-perk-sessions').nativeElement.textContent).toContain('Unlimited Sessions');
      expect(queryByTestId('upgrade-btn').nativeElement.textContent).toContain('Upgrade to Personal Plan');
      expect(queryByTestId('manage-subscription-card')).toBeNull();
    });

    it('should render the manage subscription card for an active subscription', () => {
      // Arrange
      const subscription: MySubscriptionState = {
        ...baseSubscription,
        status: 'active',
      };

      // Act
      setSubscription(subscription);

      // Assert
      expect(queryByTestId('manage-subscription-card')).toBeTruthy();
      expect(queryByTestId('subscription-management-list').nativeElement.textContent).toContain('Update Payment Methods');
      expect(queryByTestId('manage-subscription-btn').nativeElement.textContent).toContain('Manage Subscription');
      expect(queryByTestId('resubscribe-btn')).toBeNull();
      expect(queryByTestId('upgrade-plan-card')).toBeNull();
    });

    it('should render the resubscribe action instead of manage subscription for a cancelled subscription', () => {
      // Arrange
      const subscription: MySubscriptionState = {
        ...baseSubscription,
        status: 'cancelled',
        currentPeriodEnd: null,
      };

      // Act
      setSubscription(subscription);

      // Assert
      expect(queryByTestId('manage-subscription-card')).toBeTruthy();
      expect(queryByTestId('resubscribe-btn').nativeElement.textContent).toContain('Resubscribe');
      expect(queryByTestId('manage-subscription-btn')).toBeNull();
      expect(queryByTestId('upgrade-plan-card')).toBeNull();
    });

    it('should render resubscribe error text for a cancelled subscription with an error', () => {
      // Arrange
      const subscription: MySubscriptionState = {
        ...baseSubscription,
        status: 'cancelled',
        currentPeriodEnd: null,
      };
      store.overrideSelector(selectResubscribeError, { message: 'Failed to reactivate subscription' });

      // Act
      setSubscription(subscription);

      // Assert
      const error = queryByTestId('resubscribe-error');
      expect(error).toBeTruthy();
      expect(error.nativeElement.textContent).toContain('Failed to reactivate subscription');
      expect(queryByTestId('contact-support-resubscribe-error')).toBeTruthy();
    });

    it('should render upgrade error text for a free subscription with an upgrade error', () => {
      // Arrange
      const subscription: MySubscriptionState = {
        ...baseSubscription,
        planCode: 'free',
        planLabel: 'Free Plan',
        status: 'free',
        billingInterval: null,
        currency: null,
        priceCents: 0,
        currentPeriodEnd: null,
        source: 'local',
      };
      store.overrideSelector(selectUpgradeError, 'Failed to start upgrade');

      // Act
      setSubscription(subscription);

      // Assert
      const error = queryByTestId('upgrade-error');
      expect(error).toBeTruthy();
      expect(error.nativeElement.textContent).toContain('Failed to start upgrade');
    });

    it('should render disabled loading state for the upgrade action', () => {
      // Arrange
      const subscription: MySubscriptionState = {
        ...baseSubscription,
        planCode: 'free',
        planLabel: 'Free Plan',
        status: 'free',
        billingInterval: null,
        currency: null,
        priceCents: 0,
        currentPeriodEnd: null,
        source: 'local',
      };
      store.overrideSelector(selectUpgradeLoading, true);

      // Act
      setSubscription(subscription);

      // Assert
      expect(getButtonInside('upgrade-btn').disabled).toBeTrue();
      expect(queryByTestId('upgrade-btn').query(By.css('[data-testid="button-loading-spinner"]'))).toBeTruthy();
    });

    it('should render disabled state for the manage subscription action while the portal is loading', () => {
      // Arrange
      const subscription: MySubscriptionState = {
        ...baseSubscription,
        status: 'active',
      };
      store.overrideSelector(selectPortalLoading, true);

      // Act
      setSubscription(subscription);

      // Assert
      expect(getButtonInside('manage-subscription-btn').disabled).toBeTrue();
    });

    it('should render disabled loading state for the resubscribe action', () => {
      // Arrange
      const subscription: MySubscriptionState = {
        ...baseSubscription,
        status: 'cancelled',
        currentPeriodEnd: null,
      };
      store.overrideSelector(selectResubscribeLoading, true);

      // Act
      setSubscription(subscription);

      // Assert
      expect(getButtonInside('resubscribe-btn').disabled).toBeTrue();
      expect(queryByTestId('resubscribe-btn').query(By.css('[data-testid="button-loading-spinner"]'))).toBeTruthy();
    });
  });

  describe('payment issue warning', () => {
    it('should render the payment issue warning for payment issue status', () => {
      // Arrange
      const subscription: MySubscriptionState = {
        ...baseSubscription,
        status: 'payment_issue',
      };

      // Act
      setSubscription(subscription);

      // Assert
      expect(queryByTestId('payment-issue-warning').nativeElement.textContent).toContain('issue with your payment method');
    });

    it('should not render the payment issue warning for active status', () => {
      // Arrange
      const subscription: MySubscriptionState = {
        ...baseSubscription,
        status: 'active',
      };

      // Act
      setSubscription(subscription);

      // Assert
      expect(queryByTestId('payment-issue-warning')).toBeNull();
    });
  });
});
