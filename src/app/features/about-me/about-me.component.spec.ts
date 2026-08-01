import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { AboutMeComponent } from './about-me.component';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('AboutMeComponent', () => {
  let component: AboutMeComponent;
  let fixture: ComponentFixture<AboutMeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AboutMeComponent, NoopAnimationsModule, RouterTestingModule, HttpClientTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(AboutMeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // Main structure tests
  describe('Main Structure', () => {
    it('should render main element', () => {
      const mainElement = fixture.debugElement.query(By.css('[data-testid="about-me-main"]'));
      expect(mainElement).toBeTruthy();
      expect(mainElement.nativeElement.tagName.toLowerCase()).toBe('main');
    });

    it('should render article element', () => {
      const articleElement = fixture.debugElement.query(By.css('[data-testid="about-me-article"]'));
      expect(articleElement).toBeTruthy();
      expect(articleElement.nativeElement.tagName.toLowerCase()).toBe('article');
    });
  });

  // Image section tests
  describe('Image Section', () => {
    it('should render image container', () => {
      const imgContainer = fixture.debugElement.query(By.css('[data-testid="about-me-img-container"]'));
      expect(imgContainer).toBeTruthy();
      expect(imgContainer.nativeElement).toHaveClass('img-container');
    });

    it('should render profile photo with correct source', () => {
      const profileImg = fixture.debugElement.query(By.css('[data-testid="about-me-img-photo"]'));
      expect(profileImg).toBeTruthy();
      expect(profileImg.nativeElement.tagName.toLowerCase()).toBe('img');
      expect(profileImg.nativeElement.src).toContain('assets/me.jpg');
    });

    it('should render donate button', () => {
      const donateButton = fixture.debugElement.query(By.css('[data-testid="about-me-button-donate"]'));
      expect(donateButton).toBeTruthy();
      expect(donateButton.nativeElement.tagName.toLowerCase()).toBe('button');
      expect(donateButton.nativeElement).toHaveClass('donate-button-container');
    });

    it('should have PayPal button container with correct ID', () => {
      const paypalContainer = fixture.debugElement.query(By.css('#about-me-donate-button'));
      expect(paypalContainer).toBeTruthy();
    });
  });

  // Content headings tests
  describe('Content Headings', () => {
    it('should render contact heading with correct text', () => {
      const contactHeading = fixture.debugElement.query(By.css('[data-testid="about-me-heading-contact"]'));
      expect(contactHeading).toBeTruthy();
      expect(contactHeading.nativeElement.tagName.toLowerCase()).toBe('h1');
      expect(contactHeading.nativeElement.textContent.trim()).toBe('Please, feel free to contact me');
    });

    it('should render "about myself" heading with correct text', () => {
      const myselfHeading = fixture.debugElement.query(By.css('[data-testid="about-me-heading-myself"]'));
      expect(myselfHeading).toBeTruthy();
      expect(myselfHeading.nativeElement.tagName.toLowerCase()).toBe('h3');
      expect(myselfHeading.nativeElement.textContent.trim()).toBe('Shortly about myself');
    });

    it('should render "wheel of life" heading with correct text', () => {
      const wheelHeading = fixture.debugElement.query(By.css('[data-testid="about-me-heading-wheel"]'));
      expect(wheelHeading).toBeTruthy();
      expect(wheelHeading.nativeElement.tagName.toLowerCase()).toBe('h3');
      expect(wheelHeading.nativeElement.textContent.trim()).toBe('About Wheel of Life');
    });

    it('should render "reasons" heading with correct text', () => {
      const reasonsHeading = fixture.debugElement.query(By.css('[data-testid="about-me-heading-reasons"]'));
      expect(reasonsHeading).toBeTruthy();
      expect(reasonsHeading.nativeElement.tagName.toLowerCase()).toBe('h3');
      expect(reasonsHeading.nativeElement.textContent.trim()).toBe('Reasons');
    });
  });

  // Contact section tests
  describe('Contact Section', () => {
    it('should render contact list with correct number of items', () => {
      const contactList = fixture.debugElement.query(By.css('[data-testid="about-me-list-contact"]'));
      expect(contactList).toBeTruthy();
      expect(contactList.nativeElement.tagName.toLowerCase()).toBe('ul');

      const listItems = contactList.queryAll(By.css('li'));
      expect(listItems.length).toBe(3);
    });

    it('should have correct contact list content', () => {
      const contactList = fixture.debugElement.query(By.css('[data-testid="about-me-list-contact"]'));
      const listItems = contactList.queryAll(By.css('li'));

      expect(listItems[0].nativeElement.textContent).toContain('missing some functionality');
      expect(listItems[1].nativeElement.textContent).toContain('features for your courses or business');
      expect(listItems[2].nativeElement.textContent).toContain('Just say hi!');
    });

    it('should render email link element', () => {
      const emailLink = fixture.debugElement.query(By.css('[data-testid="about-me-link-email"]'));
      expect(emailLink).toBeTruthy();
      expect(emailLink.nativeElement.tagName.toLowerCase()).toBe('a');
      expect(emailLink.nativeElement.id).toBe('linkContainer');
      expect(emailLink.nativeElement.target).toBe('_blank');
    });

    it('should have email link with mouseover event', () => {
      const emailLink = fixture.debugElement.query(By.css('[data-testid="about-me-link-email"]'));
      expect(emailLink.nativeElement.onmouseover).toBeTruthy();
    });
  });

  // Reasons section tests
  describe('Reasons Section', () => {
    it('should render reasons list with correct number of items', () => {
      const reasonsList = fixture.debugElement.query(By.css('[data-testid="about-me-list-reasons"]'));
      expect(reasonsList).toBeTruthy();
      expect(reasonsList.nativeElement.tagName.toLowerCase()).toBe('ul');

      const listItems = reasonsList.queryAll(By.css('li'));
      expect(listItems.length).toBe(3);
    });

    it('should have correct reasons list content', () => {
      const reasonsList = fixture.debugElement.query(By.css('[data-testid="about-me-list-reasons"]'));
      const listItems = reasonsList.queryAll(By.css('li'));

      expect(listItems[0].nativeElement.textContent).toContain('real confirmation from real people');
      expect(listItems[1].nativeElement.textContent).toContain('heavy traffic from time to time');
      expect(listItems[2].nativeElement.textContent).toContain('main source of inspiration');
    });
  });

  // Donate component tests
  describe('Donate Component', () => {
    it('should render donate component', () => {
      const donateComponent = fixture.debugElement.query(By.css('[data-testid="about-me-component-donate"]'));
      expect(donateComponent).toBeTruthy();
      expect(donateComponent.nativeElement.tagName.toLowerCase()).toBe('wil-donate');
    });
  });

  // Accessibility tests
  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      const h1 = fixture.debugElement.query(By.css('h1'));
      const h3Elements = fixture.debugElement.queryAll(By.css('h3'));

      expect(h1).toBeTruthy();
      expect(h3Elements.length).toBe(3);

      // Should have one main heading (h1) and three section headings (h3)
      expect(h1.nativeElement.textContent).toContain('Please, feel free to contact me');
    });

    it('should have lists with proper structure', () => {
      const lists = fixture.debugElement.queryAll(By.css('ul'));
      expect(lists.length).toBe(3);

      lists.forEach((list) => {
        const items = list.queryAll(By.css('li'));
        expect(items.length).toBeGreaterThan(0);
      });
    });

    it('should have external link with target="_blank"', () => {
      const emailLink = fixture.debugElement.query(By.css('[data-testid="about-me-link-email"]'));
      expect(emailLink.nativeElement.target).toBe('_blank');
    });
  });

  // Content validation tests
  describe('Content Validation', () => {
    it('should contain key information about the developer', () => {
      const content = fixture.nativeElement.textContent;
      expect(content).toContain('John');
      expect(content).toContain('Angular Front-End Developer');
      expect(content).toContain('make websites');
    });

    it('should contain information about Wheel of Life project', () => {
      const content = fixture.nativeElement.textContent;
      expect(content).toContain('Wheel of Life');
      expect(content).toContain('big community of people');
      expect(content).toContain('reflect on their life');
    });

    it('should contain donation-related content', () => {
      const content = fixture.nativeElement.textContent;
      expect(content).toContain('DONATE button');
      expect(content).toContain('please, do donate');
      expect(content).toContain('every penny will be spent');
    });

    it('should contain contact encouragement', () => {
      const content = fixture.nativeElement.textContent;
      expect(content).toContain('feel free to contact me');
      expect(content).toContain('let me know');
    });
  });
});
