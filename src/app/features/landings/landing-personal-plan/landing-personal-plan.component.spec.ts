import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

import { LandingPersonalPlanComponent } from './landing-personal-plan.component';
import { BillingApiService } from '../../../services/api/billing-api.service';
import { AnalyticsService } from '../../../services/analytics/analytics.service';
import * as AuthActions from '../../../state/auth/auth.actions';

describe('PersonalPlanLandingComponent', () => {
  let component: LandingPersonalPlanComponent;
  let fixture: ComponentFixture<LandingPersonalPlanComponent>;
  let router: Router;
  let store: MockStore;
  let routeData: { planType?: 'free' | 'personal' };

  const mockSubscriptionResponse: GetMySubscriptionResponseDto = {
    planCode: 'free',
    planLabel: 'Free',
    status: 'free',
    billingInterval: null,
    currency: null,
    priceCents: 0,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    entitlements: [],
    source: 'local',
  };

  const mockResubscribeResponse = {
    success: true,
    message: '',
    subscriptionStatus: 'active' as const,
    renewsAt: '',
  };

  const mockBillingApi = jasmine.createSpyObj<BillingApiService>('BillingApiService', [
    'createStripeCheckoutSession',
    'getMySubscription',
    'createPortalSession',
    'resubscribe',
  ]);
  mockBillingApi.createStripeCheckoutSession.and.returnValue(of({ sessionUrl: '', sessionId: '' }));
  mockBillingApi.getMySubscription.and.returnValue(of(mockSubscriptionResponse));
  mockBillingApi.createPortalSession.and.returnValue(of({ url: '' }));
  mockBillingApi.resubscribe.and.returnValue(of(mockResubscribeResponse));

  const mockAnalytics = jasmine.createSpyObj<AnalyticsService>('AnalyticsService', ['track']);

  beforeEach(async () => {
    routeData = { planType: 'personal' };

    await TestBed.configureTestingModule({
      imports: [LandingPersonalPlanComponent, RouterTestingModule],
      providers: [
        { provide: BillingApiService, useValue: mockBillingApi },
        { provide: AnalyticsService, useValue: mockAnalytics },
        { provide: ActivatedRoute, useValue: { snapshot: { data: routeData } } },
        provideMockStore(),
      ],
    }).compileComponents();

    mockBillingApi.createStripeCheckoutSession.calls.reset();
    mockBillingApi.createStripeCheckoutSession.and.returnValue(of({ sessionUrl: '', sessionId: '' }));
    mockAnalytics.track.calls.reset();
    router = TestBed.inject(Router);
    store = TestBed.inject(MockStore);
    spyOn(router, 'navigate').and.resolveTo(true);
    spyOn(store, 'dispatch');
  });

  const createComponent = (planType: 'free' | 'personal' = 'personal'): void => {
    routeData.planType = planType;
    fixture = TestBed.createComponent(LandingPersonalPlanComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    mockAnalytics.track.calls.reset();
  };

  it('should create', () => {
    // Arrange
    createComponent();

    // Assert
    expect(component).toBeTruthy();
  });

  it('should start personal checkout when the personal CTA is selected', () => {
    // Arrange
    createComponent('personal');

    // Act
    component.onPlanSelected('bottom');

    // Assert
    expect(mockAnalytics.track).toHaveBeenCalledWith('personal_signup_cta_clicked', {
      plan: 'personal',
      cta_location: 'bottom',
      source: 'personal_plan_landing',
    });
    expect(mockAnalytics.track).toHaveBeenCalledWith('checkout_started', {
      plan: 'personal',
      source: 'personal_plan_landing',
    });
    expect(store.dispatch).toHaveBeenCalledWith(
      AuthActions.createCheckoutSession({
        request: {
          plan: 'personal',
          successUrl: `${window.location.origin}/app/account`,
          cancelUrl: `${window.location.origin}/plans`,
        },
      })
    );
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should navigate to free registration when the free CTA is selected', () => {
    // Arrange
    createComponent('free');

    // Act
    component.onPlanSelected('top');

    // Assert
    expect(mockAnalytics.track).toHaveBeenCalledWith('personal_signup_cta_clicked', {
      plan: 'free',
      cta_location: 'top',
      source: 'free_plan_landing',
    });
    expect(mockAnalytics.track).toHaveBeenCalledWith('plan_selected', {
      plan: 'free',
      cta_location: 'top',
      source: 'free_plan_landing',
    });
    expect(router.navigate).toHaveBeenCalledWith(['/register-free-account']);
    expect(store.dispatch).not.toHaveBeenCalled();
  });
});
