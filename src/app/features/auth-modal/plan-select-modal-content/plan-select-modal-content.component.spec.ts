import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router } from '@angular/router';

import { PlanSelectModalContentComponent } from './plan-select-modal-content.component';
import { CtaButtonComponent } from '../../../ui/cta-button/cta-button.component';

describe('PlanSelectModalContentComponent', () => {
  let component: PlanSelectModalContentComponent;
  let fixture: ComponentFixture<PlanSelectModalContentComponent>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlanSelectModalContentComponent, NoopAnimationsModule, RouterTestingModule],
      providers: [{ provide: MAT_DIALOG_DATA, useValue: { source: 'auth_modal' } }],
    }).compileComponents();

    fixture = TestBed.createComponent(PlanSelectModalContentComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    fixture.detectChanges();
  });

  describe('Component Creation', () => {
    it('should create', () => {
      // Arrange & Act - handled in beforeEach

      // Assert
      expect(component).toBeTruthy();
    });

    it('should render container with correct test id', () => {
      // Arrange & Act - handled in beforeEach
      const container = fixture.debugElement.query(By.css('[data-testid="plan-select-content"]'));

      // Assert
      expect(container).toBeTruthy();
    });

    it('should navigate to plan landing with free plan state', () => {
      // Arrange
      const event = jasmine.createSpyObj<Event>('Event', ['preventDefault']);
      spyOn(component.navigateToLanding, 'emit');

      // Act
      component.navigate(event);

      // Assert
      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.navigateToLanding.emit).toHaveBeenCalledWith();
      expect(router.navigate).toHaveBeenCalledWith(['/how-personal-plan-works'], { state: { planType: 'free' } });
    });
  });

  describe('Plan Cards Rendering', () => {
    it('should render plan card', () => {
      // Arrange & Act - handled in beforeEach
      const planCards = fixture.debugElement.queryAll(By.css('[data-testid="plan-card-container"]'));

      // Assert
      expect(planCards.length).toBe(1);
    });

    it('should render free plan card header', () => {
      // Arrange & Act - handled in beforeEach
      const headerText = fixture.debugElement.query(By.css('[data-testid="plan-card-header-text"]'));

      // Assert
      expect(headerText.nativeElement.textContent.trim()).toBe('Free');
    });

    it('should render plan CTA button', () => {
      // Arrange & Act - handled in beforeEach
      const ctaButton = fixture.debugElement.query(By.directive(CtaButtonComponent));

      // Assert
      expect(ctaButton).toBeTruthy();
    });

    it('should pass correct plan data to CTA button', () => {
      // Arrange & Act - handled in beforeEach
      const ctaButton = fixture.debugElement.query(By.directive(CtaButtonComponent));
      const ctaButtonComponent = ctaButton.componentInstance as CtaButtonComponent;

      // Assert
      expect(ctaButtonComponent.ctaText()).toBe('Try for Free');
    });
  });

  describe('Navigation Events', () => {
    it('should emit navigateBack on back button click', () => {
      // Arrange
      spyOn(component.navigateBack, 'emit');

      // Act
      component.onBackClick();

      // Assert
      expect(component.navigateBack.emit).toHaveBeenCalledWith();
    });

    it('should emit selectPlan with free on plan CTA click', () => {
      // Arrange
      spyOn(component.selectPlan, 'emit');
      const ctaButton = fixture.debugElement.query(By.directive(CtaButtonComponent));
      const ctaButtonComponent = ctaButton.componentInstance as CtaButtonComponent;

      // Act
      ctaButtonComponent.ctaClick.emit();
      fixture.detectChanges();

      // Assert
      expect(component.selectPlan.emit).toHaveBeenCalledWith('free');
    });
  });

  describe('Content Display', () => {
    it('should display how it works link', () => {
      // Arrange & Act - handled in beforeEach
      const link = fixture.debugElement.query(By.css('[data-testid="plan-card-header-benefits"] a'));

      // Assert
      expect(link.nativeElement.textContent.trim()).toBe('See how it works');
    });

    it('should display free plan features', () => {
      // Arrange & Act - handled in beforeEach
      const features = fixture.debugElement.queryAll(By.css('[data-testid="plan-card-feature"]'));

      // Assert
      expect(features.length).toBe(component.planData[0].features.length);
    });
  });

  describe('Plan Data Properties', () => {
    it('should have correct plan count', () => {
      // Arrange & Act - handled in beforeEach

      // Assert
      expect(component.planData.length).toBe(3);
    });

    it('should have free plan data', () => {
      // Arrange & Act - handled in beforeEach
      const freePlan = component.planData.find((plan) => plan.planType === 'Free');

      // Assert
      expect(freePlan).toBeDefined();
      expect(freePlan?.features.length).toBeGreaterThan(0);
    });

    it('should have personal plan data', () => {
      // Arrange & Act - handled in beforeEach
      const personalPlan = component.planData.find((plan) => plan.planType === 'Personal');

      // Assert
      expect(personalPlan).toBeDefined();
      expect(personalPlan?.features.length).toBeGreaterThan(0);
    });

    it('should have professional plan data', () => {
      // Arrange & Act - handled in beforeEach
      const professionalPlan = component.planData.find((plan) => plan.planType === 'Professional');

      // Assert
      expect(professionalPlan).toBeDefined();
      expect(professionalPlan?.features.length).toBeGreaterThan(0);
      expect(professionalPlan?.isHighlighted).toBe(false);
    });
  });

  describe('Component Methods', () => {
    it('should call onBackClick when back button method is invoked', () => {
      // Arrange
      spyOn(component.navigateBack, 'emit');

      // Act
      component.onBackClick();

      // Assert
      expect(component.navigateBack.emit).toHaveBeenCalledWith();
    });

    it('should emit personal plan selection for Personal plan type', () => {
      // Arrange
      spyOn(component.selectPlan, 'emit');
      const personalPlan = component.planData[1];

      // Act
      component.onPlanCtaClick(personalPlan);

      // Assert
      expect(component.selectPlan.emit).toHaveBeenCalledWith('personal');
    });

    it('should emit professional plan selection for Professional plan type', () => {
      // Arrange
      spyOn(component.selectPlan, 'emit');
      const professionalPlan = component.planData[2];

      // Act
      component.onPlanCtaClick(professionalPlan);

      // Assert
      expect(component.selectPlan.emit).toHaveBeenCalledWith('professional');
    });
  });
});
