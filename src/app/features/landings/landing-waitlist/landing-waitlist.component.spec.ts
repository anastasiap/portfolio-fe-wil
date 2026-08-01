import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LandingWaitlistComponent } from './landing-waitlist.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { By } from '@angular/platform-browser';
import { CtaButtonComponent } from '../../../ui/cta-button/cta-button.component';
import { AnalyticsService } from '../../../services/analytics/analytics.service';
import * as AuthActions from '../../../state/auth/auth.actions';

describe('LandingWaitlistComponent', () => {
  let component: LandingWaitlistComponent;
  let fixture: ComponentFixture<LandingWaitlistComponent>;
  let store: MockStore;

  const mockAnalytics = jasmine.createSpyObj<AnalyticsService>('AnalyticsService', ['track']);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LandingWaitlistComponent, HttpClientTestingModule, NoopAnimationsModule],
      providers: [provideMockStore(), { provide: AnalyticsService, useValue: mockAnalytics }],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    spyOn(store, 'dispatch');
    mockAnalytics.track.calls.reset();

    fixture = TestBed.createComponent(LandingWaitlistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should render the landing page container', () => {
    // Arrange & Act
    const landingElement = fixture.debugElement.query(By.css('[data-testid="landing-personal-plan"]'));

    // Assert
    expect(landingElement).toBeTruthy();
  });

  it('should render the waitlist hero content', () => {
    // Arrange & Act
    const eyebrowElement = fixture.debugElement.query(By.css('.hero .eyebrow'));
    const headingElement = fixture.debugElement.query(By.css('.hero h1'));

    // Assert
    expect(eyebrowElement.nativeElement.textContent).toContain('Personal Plan');
    expect(headingElement.nativeElement.textContent).toContain('Claim Your Early Adopter Access');
  });

  it('should render core landing sections', () => {
    // Arrange & Act
    const howSection = fixture.debugElement.query(By.css('#how'));
    const outcomesSection = fixture.debugElement.query(By.css('#outcomes'));
    const startSection = fixture.debugElement.query(By.css('#start'));

    // Assert
    expect(howSection).toBeTruthy();
    expect(outcomesSection).toBeTruthy();
    expect(startSection).toBeTruthy();
  });

  it('should render five how-it-works steps', () => {
    // Arrange & Act
    const steps = fixture.debugElement.queryAll(By.css('.step'));

    // Assert
    expect(steps.length).toBe(5);
  });

  it('should render landing images with accessible alt text', () => {
    // Arrange & Act
    const images = fixture.debugElement.queryAll(By.css('img'));

    // Assert
    expect(images.length).toBeGreaterThan(0);
    expect(images.every((image) => Boolean(image.attributes['alt']))).toBeTrue();
  });

  it('should render top and bottom CTA buttons with waitlist offer text', () => {
    // Arrange & Act
    const ctaButtons = fixture.debugElement.queryAll(By.directive(CtaButtonComponent));

    // Assert
    expect(ctaButtons.length).toBe(2);
    ctaButtons.forEach((ctaButton) => {
      const ctaButtonComponent = ctaButton.componentInstance as CtaButtonComponent;
      expect(ctaButtonComponent.ctaText()).toBe('Get your first month for just $3');
      expect(ctaButtonComponent.style()).toBe('primary');
      expect(ctaButtonComponent.size()).toBe('large');
    });
  });

  it('should call plan selection from top and bottom CTA buttons', () => {
    // Arrange
    spyOn(component, 'onPlanSelected');
    const ctaButtons = fixture.debugElement.queryAll(By.directive(CtaButtonComponent));
    const topCtaButton = ctaButtons[0];
    const bottomCtaButton = ctaButtons[1];

    if (!topCtaButton || !bottomCtaButton) {
      fail('Expected top and bottom CTA buttons to render.');
      return;
    }

    // Act
    topCtaButton.triggerEventHandler('ctaClick');
    bottomCtaButton.triggerEventHandler('ctaClick');

    // Assert
    expect(component.onPlanSelected).toHaveBeenCalledWith('top');
    expect(component.onPlanSelected).toHaveBeenCalledWith('bottom');
  });

  describe('onPlanSelected', () => {
    it('should use the top CTA location and start discounted checkout when no location is provided', () => {
      // Arrange
      const expectedAction = AuthActions.createCheckoutSession({
        request: {
          plan: 'personal',
          coupon: 'EARLY_ACCESS',
          successUrl: `${window.location.origin}/app/account`,
          cancelUrl: `${window.location.origin}/plans`,
        },
      });

      // Act
      component.onPlanSelected();

      // Assert
      expect(mockAnalytics.track).toHaveBeenCalledWith('personal_signup_cta_clicked', {
        cta_location: 'top',
        source: 'early_adopters_landing',
      });
      expect(mockAnalytics.track).toHaveBeenCalledWith('checkout_started', {
        plan: 'personal',
        source: 'early_adopters_landing',
      });
      expect(store.dispatch).toHaveBeenCalledOnceWith(expectedAction);
    });

    it('should use the bottom CTA location and start discounted checkout when the bottom CTA is selected', () => {
      // Arrange
      const ctaButtons = fixture.debugElement.queryAll(By.directive(CtaButtonComponent));
      const bottomCtaButton = ctaButtons[1];
      const expectedAction = AuthActions.createCheckoutSession({
        request: {
          plan: 'personal',
          coupon: 'EARLY_ACCESS',
          successUrl: `${window.location.origin}/app/account`,
          cancelUrl: `${window.location.origin}/plans`,
        },
      });

      if (!bottomCtaButton) {
        fail('Expected the bottom CTA button to render.');
        return;
      }

      // Act
      bottomCtaButton.triggerEventHandler('ctaClick');

      // Assert
      expect(mockAnalytics.track).toHaveBeenCalledWith('personal_signup_cta_clicked', {
        cta_location: 'bottom',
        source: 'early_adopters_landing',
      });
      expect(mockAnalytics.track).toHaveBeenCalledWith('checkout_started', {
        plan: 'personal',
        source: 'early_adopters_landing',
      });
      expect(store.dispatch).toHaveBeenCalledOnceWith(expectedAction);
    });
  });
});
