import { Component, Input, input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';

import { HomeComponent } from './home.component';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TranslateModule } from '@ngx-translate/core';
import { SeoService } from '../../services/seo/seo.service';
import { loadWheelsTemplates } from '../../state';

@Component({ selector: 'wil-wheel', standalone: true, template: '' })
class WheelComponentStub {
  @Input() wheelId?: string;
  public readonly type = input<string>();
}

@Component({ selector: 'wil-donate', standalone: true, template: '' })
class DonateStubComponent {}

@Component({ selector: 'wil-cta-button', standalone: true, template: '' })
class CtaButtonStubComponent {}

@Component({ selector: 'wil-personal-plan-feature-promotion', standalone: true, template: '' })
class PersonalPlanFeaturePromotionStubComponent {}

describe('HomeComponent', () => {
  let fixture: ComponentFixture<HomeComponent>;
  let mockStore: MockStore;
  let mockSeoService: { updateSeoTags: jasmine.Spy };

  async function setup(routeData: Record<string, unknown> = {}): Promise<void> {
    mockSeoService = { updateSeoTags: jasmine.createSpy('updateSeoTags') };

    await TestBed.configureTestingModule({
      imports: [HomeComponent, NoopAnimationsModule, RouterTestingModule, HttpClientTestingModule, TranslateModule.forRoot()],
      providers: [
        provideMockStore(),
        { provide: SeoService, useValue: mockSeoService },
        { provide: ActivatedRoute, useValue: { snapshot: { data: routeData } } },
      ],
    })
      .overrideComponent(HomeComponent, {
        set: {
          imports: [WheelComponentStub, DonateStubComponent, CtaButtonStubComponent, PersonalPlanFeaturePromotionStubComponent],
        },
      })
      .compileComponents();

    mockStore = TestBed.inject(MockStore);
    spyOn(mockStore, 'dispatch').and.callThrough();
    fixture = TestBed.createComponent(HomeComponent);

    fixture.detectChanges();
  }

  describe('on init', () => {
    beforeEach(async () => setup({ title: 'Test Title', description: 'Test Desc' }));

    it('should dispatch loadWheelsTemplates', () => {
      // Arrange & Act — ngOnInit already called via fixture.detectChanges() in beforeEach
      // Assert
      expect(mockStore.dispatch).toHaveBeenCalledOnceWith(loadWheelsTemplates());
    });

    it('should call seoService.updateSeoTags with title and description from route snapshot data', () => {
      // Arrange & Act — ngOnInit already called via fixture.detectChanges() in beforeEach
      // Assert
      expect(mockSeoService.updateSeoTags).toHaveBeenCalledOnceWith({
        title: 'Test Title',
        description: 'Test Desc',
      });
    });
  });

  describe('on init with empty route data', () => {
    beforeEach(async () => setup({}));

    it('should call seoService.updateSeoTags with undefined title and description when route data is empty', () => {
      // Arrange & Act — ngOnInit already called via fixture.detectChanges() in beforeEach
      // Assert
      expect(mockSeoService.updateSeoTags).toHaveBeenCalledOnceWith({
        title: undefined,
        description: undefined,
      });
    });
  });

  describe('template rendering', () => {
    beforeEach(async () => setup({ title: 'Page Title', description: 'Page Desc' }));

    it('should render wil-wheel', () => {
      // Arrange & Act — fixture.detectChanges() already called in beforeEach
      const wheelEl = fixture.debugElement.query(By.css('wil-wheel'));

      // Assert
      expect(wheelEl).toBeTruthy();
    });

    it('should pass wheelId "home" to wil-wheel', () => {
      // Arrange & Act
      const wheelDebug = fixture.debugElement.query(By.css('wil-wheel'));

      // Assert
      expect(wheelDebug.componentInstance.wheelId).toBe('home');
    });

    it('should pass type attribute "noAuth" to wil-wheel', () => {
      // Arrange & Act
      const wheelEl = fixture.debugElement.query(By.css('wil-wheel'));

      // Assert
      expect(wheelEl.nativeElement.getAttribute('type')).toBe('noAuth');
    });

    it('should render wil-personal-plan-feature-promotion', () => {
      // Arrange & Act
      const promotionEl = fixture.debugElement.query(By.css('wil-personal-plan-feature-promotion'));

      // Assert
      expect(promotionEl).toBeTruthy();
    });

    it('should render wil-donate', () => {
      // Arrange & Act
      const donateEl = fixture.debugElement.query(By.css('wil-donate'));

      // Assert
      expect(donateEl).toBeTruthy();
    });
  });
});
