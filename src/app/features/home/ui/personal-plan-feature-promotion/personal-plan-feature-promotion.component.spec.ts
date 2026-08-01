import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MockStore, provideMockStore } from '@ngrx/store/testing';

import { PersonalPlanFeaturePromotionComponent } from './personal-plan-feature-promotion.component';
import { AnalyticsService } from '../../../../services/analytics/analytics.service';
import * as AuthActions from '../../../../state/auth/auth.actions';

describe('PersonalPlanFeaturePromotionComponent', () => {
  let component: PersonalPlanFeaturePromotionComponent;
  let fixture: ComponentFixture<PersonalPlanFeaturePromotionComponent>;
  let store: MockStore;

  const mockAnalytics = jasmine.createSpyObj<AnalyticsService>('AnalyticsService', ['track']);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PersonalPlanFeaturePromotionComponent],
      providers: [provideMockStore(), { provide: AnalyticsService, useValue: mockAnalytics }],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    spyOn(store, 'dispatch');
    mockAnalytics.track.calls.reset();

    fixture = TestBed.createComponent(PersonalPlanFeaturePromotionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('onPlanSelected', () => {
    it('should track the top CTA and start personal checkout when no location is provided', () => {
      // Arrange
      const expectedAction = AuthActions.createCheckoutSession({
        request: {
          plan: 'personal',
          successUrl: `${window.location.origin}/app/account`,
          cancelUrl: `${window.location.origin}/plans`,
        },
      });

      // Act
      component.onPlanSelected();

      // Assert
      expect(mockAnalytics.track).toHaveBeenCalledWith('personal_signup_cta_clicked', {
        cta_location: 'top',
        source: 'home_page',
      });
      expect(mockAnalytics.track).toHaveBeenCalledWith('checkout_started', {
        plan: 'personal',
        source: 'home_page',
      });
      expect(store.dispatch).toHaveBeenCalledOnceWith(expectedAction);
    });

    it('should track the bottom CTA and start personal checkout when the CTA is clicked', () => {
      // Arrange
      const ctaButton = fixture.debugElement.query(By.css('[data-testid="personal-landing-cta"] button'));
      const expectedAction = AuthActions.createCheckoutSession({
        request: {
          plan: 'personal',
          successUrl: `${window.location.origin}/app/account`,
          cancelUrl: `${window.location.origin}/plans`,
        },
      });

      // Act
      ctaButton.triggerEventHandler('click');

      // Assert
      expect(mockAnalytics.track).toHaveBeenCalledWith('personal_signup_cta_clicked', {
        cta_location: 'bottom',
        source: 'home_page',
      });
      expect(mockAnalytics.track).toHaveBeenCalledWith('checkout_started', {
        plan: 'personal',
        source: 'home_page',
      });
      expect(store.dispatch).toHaveBeenCalledOnceWith(expectedAction);
    });
  });
});
