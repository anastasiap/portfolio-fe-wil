import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { FreePlanBenefitsComponent } from './free-plan-benefits.component';

describe('FreePlanBenefitsComponent', () => {
  let fixture: ComponentFixture<FreePlanBenefitsComponent>;
  let component: FreePlanBenefitsComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FreePlanBenefitsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FreePlanBenefitsComponent);
    component = fixture.componentInstance;
  });

  const queryByTestId = (testId: string) => fixture.debugElement.query(By.css(`[data-testid="${testId}"]`));

  describe('template rendering', () => {
    it('should render the free plan benefits heading and upgrade note', () => {
      // Arrange

      // Act
      fixture.detectChanges();
      const root = queryByTestId('free-plan-benefits');
      const title = queryByTestId('free-plan-benefits-title');
      const upgradeNote = queryByTestId('free-plan-benefits-upgrade');

      // Assert
      expect(component).toBeTruthy();
      expect(root).toBeTruthy();
      expect(title.nativeElement.textContent.trim()).toBe('What is included');
      expect(upgradeNote.nativeElement.textContent.trim()).toBe(
        'Start with a Personal Wheel, save your sessions data, and upgrade when you need more history.'
      );
    });

    it('should render the included free plan benefit items', () => {
      // Arrange

      // Act
      fixture.detectChanges();
      const includedList = queryByTestId('free-plan-benefits-included');
      const benefitItems = fixture.debugElement.queryAll(By.css('.free-plan-benefits__item'));

      // Assert
      expect(includedList).toBeTruthy();
      expect(benefitItems.length).toBe(3);
      expect(queryByTestId('free-plan-benefits-item-wheel').nativeElement.textContent.trim()).toBe(
        '5 personal Wheel of Life assessment'
      );
      expect(queryByTestId('free-plan-benefits-item-card').nativeElement.textContent.trim()).toBe(
        'Set focus, add reflection notes, check history'
      );
      expect(queryByTestId('free-plan-benefits-item-sessions').nativeElement.textContent.trim()).toBe('Full session analytics');
    });
  });
});
