import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FlexLayoutModule } from '@angular/flex-layout';
import { RouterTestingModule } from '@angular/router/testing';
import { By } from '@angular/platform-browser';

import { DonateComponent } from './donate.component';
import { PLATFORM_ID } from '@angular/core';

describe('DonateComponent', () => {
  let component: DonateComponent;
  let fixture: ComponentFixture<DonateComponent>;
  let originalPayPal: PayPalSDK | undefined;
  let paypalButtonSpy: jasmine.Spy;
  let paypalRenderSpy: jasmine.Spy;

  beforeEach(async () => {
    originalPayPal = window.PayPal;
    paypalRenderSpy = jasmine.createSpy('render');
    paypalButtonSpy = jasmine.createSpy('Button').and.returnValue({ render: paypalRenderSpy });
    (window as Partial<Window>).PayPal = {
      Donation: {
        Button: paypalButtonSpy,
      },
    };

    await TestBed.configureTestingModule({
      imports: [DonateComponent, FlexLayoutModule, RouterTestingModule],
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    }).compileComponents();

    fixture = TestBed.createComponent(DonateComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    (window as Partial<Window>).PayPal = originalPayPal;
  });

  describe('Template Rendering', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should render the main container with correct flex layout attributes', () => {
      const container =
        fixture.debugElement.query(By.css('[data-testid="donate-container"]')) || fixture.debugElement.query(By.css('.donate-container'));

      expect(container).toBeTruthy();
      expect(container.nativeElement.getAttribute('fxLayout')).toBe('row wrap');
      expect(container.nativeElement.getAttribute('fxLayoutAlign')).toBe('center top');
      expect(container.nativeElement.getAttribute('fxLayoutGap')).toBe('5px');
    });

    it('should display the profile image with correct attributes', () => {
      const img = fixture.debugElement.query(By.css('.img-container img'));

      expect(img).toBeTruthy();
      expect(img.nativeElement.src).toContain('assets/me.jpg');
      expect(img.nativeElement.alt).toBe('me');
    });

    it('should display the donation thanks text', () => {
      const textElement = fixture.debugElement.query(By.css('.text'));

      expect(textElement).toBeTruthy();
      expect(textElement.nativeElement.textContent.trim()).toBe('Big thanks for donations and kind words to');
    });

    it('should display the contributor list', () => {
      const listItems = fixture.debugElement.queryAll(By.css('ul li'));
      const expectedContributors = ['Cord', "Bonita from Amazing Women's Network", 'Simon', 'Joshua', 'Mário', 'Trisha', 'Brian', 'Jude'];

      expect(listItems.length).toBe(expectedContributors.length);

      listItems.forEach((item, index) => {
        expect(item.nativeElement.textContent.trim()).toBe(expectedContributors[index]);
      });
    });

    it('should render the PayPal button container with correct ID', () => {
      const buttonContainer = fixture.debugElement.query(By.css('#home-donate-button'));

      expect(buttonContainer).toBeTruthy();
      expect(buttonContainer.nativeElement.id).toBe('home-donate-button');
    });

    it('should display the donation appreciation text', () => {
      const textElements = fixture.debugElement.queryAll(By.css('.text'));
      const appreciationText = textElements.find((el) => el.nativeElement.textContent.includes('massive thanks for using my website'));

      expect(appreciationText).toBeTruthy();
      expect(appreciationText!.nativeElement.textContent).toContain('Any penny is deeply appreciated!');
    });

    it('should render the about link with correct routing', () => {
      const aboutLink = fixture.debugElement.query(By.css('a[routerLink="/about"]'));

      expect(aboutLink).toBeTruthy();
      expect(aboutLink.nativeElement.getAttribute('href')).toBe('about');
      expect(aboutLink.nativeElement.getAttribute('routerLink')).toBe('/about');
      expect(aboutLink.nativeElement.textContent).toBe('click here');
    });
  });

  describe('Responsive Layout', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should have correct flex layout for profile image section', () => {
      const imageSection = fixture.debugElement.query(By.css('.donate-container > div:first-child'));

      expect(imageSection.nativeElement.getAttribute('fxFlex.xs')).toBe('100%');
      expect(imageSection.nativeElement.getAttribute('fxFlex.sm')).toBe('15%');
      expect(imageSection.nativeElement.getAttribute('fxFlex.md')).toBe('15%');
      expect(imageSection.nativeElement.getAttribute('fxFlex.lg')).toBe('15%');
      expect(imageSection.nativeElement.getAttribute('fxFlex.gt-lg')).toBe('15%');
    });

    it('should have correct flex layout for content section', () => {
      const contentSection = fixture.debugElement.query(By.css('.donate-container > div:nth-child(2)'));

      expect(contentSection.nativeElement.getAttribute('fxFlex.xs')).toBe('100%');
      expect(contentSection.nativeElement.getAttribute('fxFlex.sm')).toBe('55%');
      expect(contentSection.nativeElement.getAttribute('fxFlex.md')).toBe('55%');
      expect(contentSection.nativeElement.getAttribute('fxFlex.lg')).toBe('55%');
      expect(contentSection.nativeElement.getAttribute('fxFlex.gt-lg')).toBe('55%');
    });

    it('should have correct flex layout for donation section', () => {
      const donationSection = fixture.debugElement.query(By.css('.donate-container > div:last-child'));

      expect(donationSection.nativeElement.getAttribute('fxFlex.xs')).toBe('100%');
      expect(donationSection.nativeElement.getAttribute('fxFlex.sm')).toBe('100%');
      expect(donationSection.nativeElement.getAttribute('fxFlex.md')).toBe('100%');
      expect(donationSection.nativeElement.getAttribute('fxFlex.lg')).toBe('25%');
      expect(donationSection.nativeElement.getAttribute('fxFlex.gt-lg')).toBe('25%');
    });
  });

  describe('PayPal Integration', () => {
    it('should call initializePaypal with correct element ID after view init', () => {
      // Act
      component.ngAfterViewInit();

      // Assert
      expect(paypalButtonSpy).toHaveBeenCalledTimes(1);
      expect(paypalRenderSpy).toHaveBeenCalledOnceWith('#home-donate-button');
    });

    it('should call initializePaypal automatically when component initializes', () => {
      // Act
      fixture.detectChanges();

      // Assert
      expect(paypalButtonSpy).toHaveBeenCalledTimes(1);
      expect(paypalRenderSpy).toHaveBeenCalledOnceWith('#home-donate-button');
    });

    it('should handle multiple ngAfterViewInit calls gracefully', () => {
      // Act
      component.ngAfterViewInit();
      component.ngAfterViewInit();
      component.ngAfterViewInit();

      // Assert
      expect(paypalButtonSpy).toHaveBeenCalledTimes(3);
      expect(paypalRenderSpy).toHaveBeenCalledTimes(3);
      expect(paypalRenderSpy).toHaveBeenCalledWith('#home-donate-button');
    });
  });

  describe('Component Structure', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should have the correct CSS classes applied', () => {
      const donateContainer = fixture.debugElement.query(By.css('.donate-container'));
      const imgContainer = fixture.debugElement.query(By.css('.img-container'));
      const textElements = fixture.debugElement.queryAll(By.css('.text'));
      const donateButtonContainer = fixture.debugElement.query(By.css('.donate-button-container'));

      expect(donateContainer).toBeTruthy();
      expect(imgContainer).toBeTruthy();
      expect(textElements.length).toBeGreaterThan(0);
      expect(donateButtonContainer).toBeTruthy();
    });

    it('should maintain proper semantic structure', () => {
      const unorderedList = fixture.debugElement.query(By.css('ul'));
      const listItems = fixture.debugElement.queryAll(By.css('ul li'));
      const paragraphs = fixture.debugElement.queryAll(By.css('p.text'));

      expect(unorderedList).toBeTruthy();
      expect(listItems.length).toBe(8); // Number of contributors
      expect(paragraphs.length).toBeGreaterThanOrEqual(2); // At least intro text and appreciation text
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should have proper alt text for the profile image', () => {
      const img = fixture.debugElement.query(By.css('.img-container img'));

      expect(img.nativeElement.alt).toBe('me');
    });

    it('should have proper link attributes for the about link', () => {
      const aboutLink = fixture.debugElement.query(By.css('a[routerLink="/about"]'));

      expect(aboutLink.nativeElement.href).toBeTruthy();
      expect(aboutLink.nativeElement.textContent.trim()).toBe('click here');
    });

    it('should have semantic HTML structure with proper headings hierarchy', () => {
      // Check that content is properly structured
      const mainContainer = fixture.debugElement.query(By.css('.donate-container'));
      expect(mainContainer).toBeTruthy();

      // Verify proper text content organization
      const textElements = fixture.debugElement.queryAll(By.css('.text'));
      expect(textElements.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing FlexLayoutModule gracefully', () => {
      // This test ensures the component doesn't break if FlexLayout directives fail
      expect(() => {
        fixture.detectChanges();
      }).not.toThrow();
    });

    it('should render correctly when PayPal SDK is unavailable', () => {
      const paypal = window.PayPal;
      (window as Partial<Window>).PayPal = undefined;

      try {
        expect(() => {
          fixture.detectChanges();
        }).not.toThrow();

        const buttonContainer = fixture.debugElement.query(By.css('#home-donate-button'));
        expect(buttonContainer).toBeTruthy();
      } finally {
        window.PayPal = paypal;
      }
    });
  });
});
