import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, input, Output } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { MatDialog } from '@angular/material/dialog';

import { LandingPaidPlansComponent } from './landing-paid-plans.component';
import { PlanCardComponent } from 'src/app/ui/plan-card/plan-card.component';
import { AnalyticsService } from '../../../services/analytics/analytics.service';
import { SeoService } from '../../../services/seo/seo.service';
import { PaymentMethodModalComponent } from '../../../ui/modals/payment-method-modal/payment-method-modal.component';
import { WaitlistModalComponent } from '../../../ui/modals/waitlist-modal/waitlist-modal.component';

// Mock PlanCardComponent for isolated testing
@Component({
  selector: 'wil-plan-card',
  template: '<div class="mock-plan-card" [attr.data-plan-header]="planData().headerText">Mock Plan Card</div>',
  standalone: true,
})
class MockPlanCardComponent {
  public readonly planData = input.required<PlanCardData>();

  @Output() public readonly ctaClick = new EventEmitter<PlanCardData>();
}

describe('LandingPaidPlansComponent', () => {
  let component: LandingPaidPlansComponent;
  let fixture: ComponentFixture<LandingPaidPlansComponent>;
  let router: Router;

  const mockDialog = jasmine.createSpyObj<MatDialog>('MatDialog', ['open']);
  const mockAnalytics = jasmine.createSpyObj<AnalyticsService>('AnalyticsService', ['track']);
  const mockSeoService = jasmine.createSpyObj<SeoService>('SeoService', ['updateSeoTags']);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonModule, LandingPaidPlansComponent, RouterTestingModule],
      providers: [
        { provide: MatDialog, useValue: mockDialog },
        { provide: AnalyticsService, useValue: mockAnalytics },
        { provide: SeoService, useValue: mockSeoService },
        { provide: ActivatedRoute, useValue: { snapshot: { data: {} } } },
      ],
    })
      .overrideComponent(LandingPaidPlansComponent, {
        remove: { imports: [PlanCardComponent] },
        add: { imports: [CommonModule, MockPlanCardComponent] },
      })
      .compileComponents();
  });

  beforeEach(() => {
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    mockDialog.open.calls.reset();
    mockAnalytics.track.calls.reset();

    fixture = TestBed.createComponent(LandingPaidPlansComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  const getPlanCard = (planType: PlanCardData['planType']): MockPlanCardComponent =>
    fixture.debugElement
      .queryAll(By.directive(MockPlanCardComponent))
      .map((debugElement) => debugElement.componentInstance as MockPlanCardComponent)
      .find((planCard) => planCard.planData().planType === planType)!;

  describe('Content Structure', () => {
    it('should display "Pricing & Plans" title', () => {
      // Arrange & Act
      const titleElement = fixture.debugElement.query(By.css('[data-testid="landing-paid-plans-title"]'));

      // Assert
      expect(titleElement).toBeTruthy();
      expect(titleElement.nativeElement.textContent.trim()).toBe('Pricing & Plans');
      expect(titleElement.nativeElement.tagName.toLowerCase()).toBe('h1');
    });

    it('should display the correct page description', () => {
      // Arrange & Act
      const descriptionElement = fixture.debugElement.query(By.css('[data-testid="landing-paid-plans-description"]'));

      // Assert
      expect(descriptionElement).toBeTruthy();
      expect(descriptionElement.nativeElement.textContent.trim()).toBe(
        'Get a real picture of life balance — and track your and your clients progress over time'
      );
    });

    it('should have proper page structure with container, header, and content', () => {
      // Arrange & Act
      const container = fixture.debugElement.query(By.css('[data-testid="landing-paid-plans-container"]'));
      const header = fixture.debugElement.query(By.css('[data-testid="landing-paid-plans-header"]'));
      const content = fixture.debugElement.query(By.css('[data-testid="landing-paid-plans-content"]'));

      // Assert
      expect(container).toBeTruthy();
      expect(header).toBeTruthy();
      expect(content).toBeTruthy();
      expect(container.nativeElement.contains(header.nativeElement)).toBe(true);
      expect(container.nativeElement.contains(content.nativeElement)).toBe(true);
    });

    it('should have a plans grid container', () => {
      // Arrange & Act
      const plansGrid = fixture.debugElement.query(By.css('[data-testid="landing-paid-plans-grid"]'));

      // Assert
      expect(plansGrid).toBeTruthy();
      expect(plansGrid.nativeElement.classList).toContain('landing-paid-plans__plans-grid');
    });
  });

  describe('plan cards', () => {
    it('should render one plan card for each configured plan', () => {
      // Arrange
      const expectedPlanCount = component.plans.length;

      // Act
      const planCards = fixture.debugElement.queryAll(By.css('[data-testid="landing-paid-plan-card"]'));

      // Assert
      expect(planCards.length).toBe(expectedPlanCount);
    });

    it('should bind each configured plan to its corresponding plan card', () => {
      // Arrange
      const expectedPlans = component.plans;

      // Act
      const renderedPlans = fixture.debugElement
        .queryAll(By.directive(MockPlanCardComponent))
        .map((debugElement) => (debugElement.componentInstance as MockPlanCardComponent).planData());

      // Assert
      expect(renderedPlans).toEqual(expectedPlans);
    });

    it('should not render plan cards when no plans are configured', () => {
      // Arrange
      fixture.destroy();
      fixture = TestBed.createComponent(LandingPaidPlansComponent);
      component = fixture.componentInstance;
      component.plans = [];

      // Act
      fixture.detectChanges();
      const planCards = fixture.debugElement.queryAll(By.css('[data-testid="landing-paid-plan-card"]'));

      // Assert
      expect(planCards).toEqual([]);
    });
  });

  describe('plan CTA actions', () => {
    it('should track the selection and navigate to registration for the Free plan', () => {
      // Arrange
      const freePlanCard = getPlanCard('Free');

      // Act
      freePlanCard.ctaClick.emit(freePlanCard.planData());

      // Assert
      expect(mockAnalytics.track).toHaveBeenCalledOnceWith('plan_selected', {
        plan: 'free',
        source: 'plans_page',
        cta_location: 'plan_card',
      });
      expect(router.navigate).toHaveBeenCalledOnceWith(['/register-free-account']);
      expect(mockDialog.open).not.toHaveBeenCalled();
    });

    it('should track the Personal plan and open the payment method modal', () => {
      // Arrange
      const personalPlanCard = getPlanCard('Personal');

      // Act
      personalPlanCard.ctaClick.emit(personalPlanCard.planData());

      // Assert
      expect(mockAnalytics.track).toHaveBeenCalledWith('plan_selected', {
        plan: 'personal',
        source: 'plans_page',
        cta_location: 'plan_card',
      });
      expect(mockAnalytics.track).toHaveBeenCalledWith('start_personal_plan_viewed', {
        plan: 'personal',
        source: 'plans_page',
      });
      expect(mockDialog.open).toHaveBeenCalledOnceWith(PaymentMethodModalComponent, {
        data: {
          planName: 'personal',
          planDisplayName: 'Personal',
          price: '$5',
          subtext: 'per month',
        },
        maxWidth: '95vw',
        disableClose: true,
        autoFocus: true,
        panelClass: 'modal-panel',
      });
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should track Professional interest and open the waitlist modal', () => {
      // Arrange
      const professionalPlanCard = getPlanCard('Professional');

      // Act
      professionalPlanCard.ctaClick.emit(professionalPlanCard.planData());

      // Assert
      expect(mockAnalytics.track).toHaveBeenCalledOnceWith('professional_interest_viewed', {
        source: 'plans_page',
      });
      expect(mockDialog.open).toHaveBeenCalledOnceWith(WaitlistModalComponent, {
        data: {
          planType: 'Professional',
          source: 'plans_page',
        },
        maxWidth: '95vw',
        disableClose: false,
        autoFocus: true,
        panelClass: 'modal-panel',
      });
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should navigate home when the plan type is unsupported', () => {
      // Arrange
      const freePlanCard = getPlanCard('Free');
      const unsupportedPlan = {
        ...freePlanCard.planData(),
        planType: 'Unsupported',
      } as unknown as PlanCardData;

      // Act
      freePlanCard.ctaClick.emit(unsupportedPlan);

      // Assert
      expect(router.navigate).toHaveBeenCalledOnceWith(['/']);
      expect(mockAnalytics.track).not.toHaveBeenCalled();
      expect(mockDialog.open).not.toHaveBeenCalled();
    });
  });
});
