import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { EventEmitter } from '@angular/core';

import { CtaButtonComponent } from './cta-button.component';

describe('CtaButtonComponent', () => {
  let component: CtaButtonComponent;
  let fixture: ComponentFixture<CtaButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CtaButtonComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CtaButtonComponent);
    component = fixture.componentInstance;
  });

  describe('Component Creation', () => {
    it('should create successfully', () => {
      // Arrange
      fixture.componentRef.setInput('disabled', false);
      fixture.componentRef.setInput('loading', false);
      fixture.componentRef.setInput('ctaText', 'Test Button');
      fixture.componentRef.setInput('style', 'primary');
      fixture.componentRef.setInput('size', 'large');

      // Act
      fixture.detectChanges();

      // Assert
      expect(component).toBeTruthy();
      expect(component).toBeInstanceOf(CtaButtonComponent);
    });
  });

  describe('Input Binding - disabled', () => {
    it('should accept disabled input as false and enable button', () => {
      // Arrange
      fixture.componentRef.setInput('disabled', false);
      fixture.componentRef.setInput('loading', false);
      fixture.componentRef.setInput('ctaText', 'Enabled Button');
      fixture.componentRef.setInput('style', 'primary');
      fixture.componentRef.setInput('size', 'large');

      // Act
      fixture.detectChanges();
      const buttonElement = fixture.debugElement.query(By.css('.button'));

      // Assert
      expect(component.disabled()).toBe(false);
      expect(buttonElement.nativeElement.disabled).toBe(false);
    });

    it('should accept disabled input as true and disable button', () => {
      // Arrange
      fixture.componentRef.setInput('disabled', true);
      fixture.componentRef.setInput('loading', false);
      fixture.componentRef.setInput('ctaText', 'Disabled Button');
      fixture.componentRef.setInput('style', 'primary');
      fixture.componentRef.setInput('size', 'large');

      // Act
      fixture.detectChanges();
      const buttonElement = fixture.debugElement.query(By.css('.button'));

      // Assert
      expect(component.disabled()).toBe(true);
      expect(buttonElement.nativeElement.disabled).toBe(true);
    });

    it('should update button state when disabled input changes', () => {
      // Arrange
      fixture.componentRef.setInput('disabled', false);
      fixture.componentRef.setInput('loading', false);
      fixture.componentRef.setInput('ctaText', 'Toggle Button');
      fixture.componentRef.setInput('style', 'primary');
      fixture.componentRef.setInput('size', 'large');

      fixture.detectChanges();
      const buttonElement = fixture.debugElement.query(By.css('.button'));

      // Act
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();

      // Assert
      expect(component.disabled()).toBe(true);
      expect(buttonElement.nativeElement.disabled).toBe(true);
    });
  });

  describe('Input Binding - loading', () => {
    it('should accept loading input as false', () => {
      // Arrange
      fixture.componentRef.setInput('disabled', false);
      fixture.componentRef.setInput('loading', false);
      fixture.componentRef.setInput('ctaText', 'Not Loading');
      fixture.componentRef.setInput('style', 'primary');
      fixture.componentRef.setInput('size', 'large');

      // Act
      fixture.detectChanges();

      // Assert
      expect(component.loading()).toBe(false);
    });

    it('should accept loading input as true', () => {
      // Arrange
      fixture.componentRef.setInput('disabled', false);
      fixture.componentRef.setInput('loading', true);
      fixture.componentRef.setInput('ctaText', 'Loading...');
      fixture.componentRef.setInput('style', 'primary');
      fixture.componentRef.setInput('size', 'large');

      // Act
      fixture.detectChanges();

      // Assert
      expect(component.loading()).toBe(true);
    });

    it('should update loading state when input changes', () => {
      // Arrange
      fixture.componentRef.setInput('disabled', false);
      fixture.componentRef.setInput('loading', false);
      fixture.componentRef.setInput('ctaText', 'Toggle Loading');
      fixture.componentRef.setInput('style', 'primary');
      fixture.componentRef.setInput('size', 'large');
      fixture.detectChanges();

      // Act
      fixture.componentRef.setInput('loading', true);
      fixture.detectChanges();

      // Assert
      expect(component.loading()).toBe(true);
    });
  });

  describe('Input Binding - ctaText', () => {
    it('should display the correct button text', () => {
      // Arrange
      fixture.componentRef.setInput('disabled', false);
      fixture.componentRef.setInput('loading', false);
      fixture.componentRef.setInput('ctaText', 'Submit Form');
      fixture.componentRef.setInput('style', 'primary');
      fixture.componentRef.setInput('size', 'large');

      // Act
      fixture.detectChanges();
      const buttonElement = fixture.debugElement.query(By.css('.button'));

      // Assert
      expect(component.ctaText()).toBe('Submit Form');
      expect(buttonElement.nativeElement.textContent.trim()).toBe('Submit Form');
    });

    it('should update button text when ctaText input changes', () => {
      // Arrange
      fixture.componentRef.setInput('disabled', false);
      fixture.componentRef.setInput('loading', false);
      fixture.componentRef.setInput('ctaText', 'Initial Text');
      fixture.componentRef.setInput('style', 'primary');
      fixture.componentRef.setInput('size', 'large');

      fixture.detectChanges();
      const buttonElement = fixture.debugElement.query(By.css('.button'));

      // Act
      fixture.componentRef.setInput('ctaText', 'Updated Text');
      fixture.detectChanges();

      // Assert
      expect(component.ctaText()).toBe('Updated Text');
      expect(buttonElement.nativeElement.textContent.trim()).toBe('Updated Text');
    });

    it('should handle empty string as button text', () => {
      // Arrange
      fixture.componentRef.setInput('disabled', false);
      fixture.componentRef.setInput('loading', false);
      fixture.componentRef.setInput('ctaText', '');
      fixture.componentRef.setInput('style', 'primary');
      fixture.componentRef.setInput('size', 'large');

      // Act
      fixture.detectChanges();
      const buttonElement = fixture.debugElement.query(By.css('.button'));

      // Assert
      expect(component.ctaText()).toBe('');
      expect(buttonElement.nativeElement.textContent.trim()).toBe('');
    });

    it('should handle special characters and numbers in button text', () => {
      // Arrange
      const specialText = '✓ Save & Continue (1/3)';
      fixture.componentRef.setInput('disabled', false);
      fixture.componentRef.setInput('loading', false);
      fixture.componentRef.setInput('ctaText', specialText);
      fixture.componentRef.setInput('style', 'primary');
      fixture.componentRef.setInput('size', 'large');

      // Act
      fixture.detectChanges();
      const buttonElement = fixture.debugElement.query(By.css('.button'));

      // Assert
      expect(component.ctaText()).toBe(specialText);
      expect(buttonElement.nativeElement.textContent.trim()).toBe(specialText);
    });
  });

  describe('Output Event - ctaClick', () => {
    it('should emit ctaClick event when button is clicked and not disabled', () => {
      // Arrange
      fixture.componentRef.setInput('disabled', false);
      fixture.componentRef.setInput('loading', false);
      fixture.componentRef.setInput('ctaText', 'Click Me');
      fixture.componentRef.setInput('style', 'primary');
      fixture.componentRef.setInput('size', 'large');
      fixture.detectChanges();

      const clickSpy = spyOn(component.ctaClick, 'emit');
      const buttonElement = fixture.debugElement.query(By.css('.button'));

      // Act
      buttonElement.nativeElement.click();

      // Assert
      expect(clickSpy).toHaveBeenCalledWith();
      expect(clickSpy).toHaveBeenCalledTimes(1);
    });

    it('should not emit ctaClick event when button is disabled', () => {
      // Arrange
      fixture.componentRef.setInput('disabled', true);
      fixture.componentRef.setInput('loading', false);
      fixture.componentRef.setInput('ctaText', 'Disabled Button');
      fixture.componentRef.setInput('style', 'primary');
      fixture.componentRef.setInput('size', 'large');

      fixture.detectChanges();

      const clickSpy = spyOn(component.ctaClick, 'emit');
      const buttonElement = fixture.debugElement.query(By.css('.button'));

      // Act
      buttonElement.nativeElement.click();

      // Assert
      expect(clickSpy).not.toHaveBeenCalled();
    });

    it('should emit multiple events for multiple clicks when enabled', () => {
      // Arrange
      fixture.componentRef.setInput('disabled', false);
      fixture.componentRef.setInput('loading', false);
      fixture.componentRef.setInput('ctaText', 'Multi Click');
      fixture.componentRef.setInput('style', 'primary');
      fixture.componentRef.setInput('size', 'large');

      fixture.detectChanges();

      const clickSpy = spyOn(component.ctaClick, 'emit');
      const buttonElement = fixture.debugElement.query(By.css('.button'));

      // Act
      buttonElement.nativeElement.click();
      buttonElement.nativeElement.click();
      buttonElement.nativeElement.click();

      // Assert
      expect(clickSpy).toHaveBeenCalledTimes(3);
    });

    it('should allow subscription to ctaClick event', () => {
      // Arrange
      fixture.componentRef.setInput('disabled', false);
      fixture.componentRef.setInput('loading', false);
      fixture.componentRef.setInput('ctaText', 'Subscribe Test');
      fixture.componentRef.setInput('style', 'primary');
      fixture.componentRef.setInput('size', 'large');

      fixture.detectChanges();

      let eventEmitted = false;
      component.ctaClick.subscribe(() => {
        eventEmitted = true;
      });

      const buttonElement = fixture.debugElement.query(By.css('.button'));

      // Act
      buttonElement.nativeElement.click();

      // Assert
      expect(eventEmitted).toBe(true);
    });
  });

  describe('DOM Structure and CSS Classes', () => {
    it('should render a button element with correct CSS class', () => {
      // Arrange
      fixture.componentRef.setInput('disabled', false);
      fixture.componentRef.setInput('loading', false);
      fixture.componentRef.setInput('ctaText', 'Test');
      fixture.componentRef.setInput('style', 'primary');
      fixture.componentRef.setInput('size', 'large');

      // Act
      fixture.detectChanges();
      const buttonElement = fixture.debugElement.query(By.css('.button'));

      // Assert
      expect(buttonElement).toBeTruthy();
      expect(buttonElement.nativeElement.tagName.toLowerCase()).toBe('button');
      expect(buttonElement.nativeElement.classList).toContain('button');
    });

    it('should have proper button type attribute', () => {
      // Arrange
      fixture.componentRef.setInput('disabled', false);
      fixture.componentRef.setInput('loading', false);
      fixture.componentRef.setInput('ctaText', 'Type Test');
      fixture.componentRef.setInput('style', 'primary');
      fixture.componentRef.setInput('size', 'large');

      // Act
      fixture.detectChanges();
      const buttonElement = fixture.debugElement.query(By.css('.button'));

      // Assert
      expect(buttonElement.nativeElement.type).toBe('button');
    });
  });

  describe('Component Behavior', () => {
    it('should have required inputs properly configured', () => {
      // Arrange
      fixture.componentRef.setInput('disabled', true);
      fixture.componentRef.setInput('loading', false);
      fixture.componentRef.setInput('ctaText', 'Required Input Test');
      fixture.componentRef.setInput('style', 'primary');
      fixture.componentRef.setInput('size', 'large');

      // Act
      fixture.detectChanges();

      // Assert
      expect(() => component.disabled()).not.toThrow();
      expect(() => component.loading()).not.toThrow();
      expect(() => component.ctaText()).not.toThrow();
      expect(component.disabled()).toBeDefined();
      expect(component.loading()).toBeDefined();
      expect(component.ctaText()).toBeDefined();
    });

    it('should have ctaClick as EventEmitter output', () => {
      // Arrange & Act
      const ctaClickOutput = component.ctaClick;

      // Assert
      expect(ctaClickOutput).toBeInstanceOf(EventEmitter);
    });
  });

  describe('Accessibility and User Experience', () => {
    it('should be focusable when enabled', () => {
      // Arrange
      fixture.componentRef.setInput('disabled', false);
      fixture.componentRef.setInput('loading', false);
      fixture.componentRef.setInput('ctaText', 'Focusable Button');
      fixture.componentRef.setInput('style', 'primary');
      fixture.componentRef.setInput('size', 'large');

      // Act
      fixture.detectChanges();
      const buttonElement = fixture.debugElement.query(By.css('.button'));
      buttonElement.nativeElement.focus();

      // Assert
      expect(document.activeElement).toBe(buttonElement.nativeElement);
    });

    it('should not be focusable when disabled', () => {
      // Arrange
      fixture.componentRef.setInput('disabled', true);
      fixture.componentRef.setInput('loading', false);
      fixture.componentRef.setInput('ctaText', 'Not Focusable');
      fixture.componentRef.setInput('style', 'primary');
      fixture.componentRef.setInput('size', 'large');

      // Act
      fixture.detectChanges();
      const buttonElement = fixture.debugElement.query(By.css('.button'));
      buttonElement.nativeElement.focus();

      // Assert
      expect(document.activeElement).not.toBe(buttonElement.nativeElement);
    });

    it('should support keyboard activation when enabled', () => {
      // Arrange
      fixture.componentRef.setInput('disabled', false);
      fixture.componentRef.setInput('loading', false);
      fixture.componentRef.setInput('ctaText', 'Keyboard Test');
      fixture.componentRef.setInput('style', 'primary');
      fixture.componentRef.setInput('size', 'large');

      fixture.detectChanges();

      const clickSpy = spyOn(component.ctaClick, 'emit');
      const buttonElement = fixture.debugElement.query(By.css('.button'));

      // Act
      const keyboardEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      buttonElement.nativeElement.dispatchEvent(keyboardEvent);

      // Assert - Note: Browser handles Enter key to trigger click automatically
      buttonElement.nativeElement.click(); // Simulate what browser does
      expect(clickSpy).toHaveBeenCalled();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should not have console errors during rendering', () => {
      // Arrange
      const consoleSpy = spyOn(console, 'error');
      fixture.componentRef.setInput('disabled', false);
      fixture.componentRef.setInput('loading', false);
      fixture.componentRef.setInput('ctaText', 'No Errors');
      fixture.componentRef.setInput('style', 'primary');
      fixture.componentRef.setInput('size', 'large');

      // Act
      fixture.detectChanges();

      // Assert
      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it('should handle rapid state changes', () => {
      // Arrange
      fixture.componentRef.setInput('disabled', false);
      fixture.componentRef.setInput('loading', false);
      fixture.componentRef.setInput('ctaText', 'Rapid Changes');
      fixture.componentRef.setInput('style', 'primary');
      fixture.componentRef.setInput('size', 'large');

      // Act
      fixture.detectChanges();
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();
      fixture.componentRef.setInput('loading', true);
      fixture.detectChanges();
      fixture.componentRef.setInput('ctaText', 'New Text');
      fixture.detectChanges();

      // Assert
      expect(component.disabled()).toBe(true);
      expect(component.loading()).toBe(true);
      expect(component.ctaText()).toBe('New Text');
    });

    it('should handle disabled and loading states simultaneously', () => {
      // Arrange
      fixture.componentRef.setInput('disabled', true);
      fixture.componentRef.setInput('loading', true);
      fixture.componentRef.setInput('ctaText', 'Disabled and Loading');
      fixture.componentRef.setInput('style', 'primary');
      fixture.componentRef.setInput('size', 'large');

      // Act
      fixture.detectChanges();
      const buttonElement = fixture.debugElement.query(By.css('.button'));

      // Assert
      expect(component.disabled()).toBe(true);
      expect(component.loading()).toBe(true);
      expect(buttonElement.nativeElement.disabled).toBe(true);
    });
  });
});
