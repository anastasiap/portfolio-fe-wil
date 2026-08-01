import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
// Test host component for testing reactive forms integration
import { Component, PLATFORM_ID } from '@angular/core';
import { By } from '@angular/platform-browser';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { NoteMarkdownEditorComponent } from './note-markdown-editor.component';

describe('NoteMarkdownEditorComponent', () => {
  let component: NoteMarkdownEditorComponent;
  let fixture: ComponentFixture<NoteMarkdownEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NoteMarkdownEditorComponent, ReactiveFormsModule, NoopAnimationsModule],
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    }).compileComponents();

    fixture = TestBed.createComponent(NoteMarkdownEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Component initialization', () => {
    it('should render editor container in browser environment', () => {
      const editorContainer = fixture.debugElement.query(By.css('[data-testid="editor-instance"]'));
      const ssrPlaceholder = fixture.debugElement.query(By.css('[data-testid="ssr-placeholder"]'));

      expect(editorContainer).toBeTruthy();
      expect(ssrPlaceholder).toBeFalsy();
    });

    it('should render textarea in browser environment', () => {
      const textarea = fixture.debugElement.query(By.css('[data-testid="textarea-editor"]'));
      expect(textarea).toBeTruthy();
    });

    it('should display toolbar by default', () => {
      const toolbar = fixture.debugElement.query(By.css('[data-testid="bold-button"]'));
      expect(toolbar).toBeTruthy();
    });

    it('should hide toolbar when showToolbar is false', () => {
      fixture.componentRef.setInput('showToolbar', false);
      fixture.detectChanges();

      const toolbar = fixture.debugElement.query(By.css('.wil-note-editor__toolbar'));
      expect(toolbar).toBeFalsy();
    });
  });

  describe('Input properties', () => {
    it('should use default placeholder text', () => {
      expect(component.placeholder()).toBe('Start typing your notes...');
    });

    it('should update placeholder when input changes', () => {
      const newPlaceholder = 'Custom placeholder text';
      fixture.componentRef.setInput('placeholder', newPlaceholder);
      fixture.detectChanges();

      expect(component.placeholder()).toBe(newPlaceholder);
    });

    it('should handle disabled state', () => {
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();

      const container = fixture.debugElement.query(By.css('.wil-note-editor__container'));
      expect(container.nativeElement).toHaveClass('wil-note-editor__container--disabled');
    });

    it('should show character count when maxLength is provided', () => {
      fixture.componentRef.setInput('maxLength', 100);
      fixture.detectChanges();

      const charCount = fixture.debugElement.query(By.css('[data-testid="char-count"]'));
      expect(charCount).toBeTruthy();
      expect(charCount.nativeElement.textContent).toContain('0 / 100');
    });

    it('should not show character count when maxLength is not provided', () => {
      const charCount = fixture.debugElement.query(By.css('[data-testid="char-count"]'));
      expect(charCount).toBeFalsy();
    });
  });

  describe('ControlValueAccessor implementation', () => {
    it('should implement ControlValueAccessor', () => {
      expect(component.writeValue).toBeDefined();
      expect(component.registerOnChange).toBeDefined();
      expect(component.registerOnTouched).toBeDefined();
      expect(component.setDisabledState).toBeDefined();
    });

    it('should update currentValue when writeValue is called', () => {
      const testValue = 'Test markdown content';

      component.writeValue(testValue);

      expect(component.currentValue).toBe(testValue);
    });

    it('should handle null/undefined values in writeValue', () => {
      component.writeValue(null as never);
      expect(component.currentValue).toBe('');

      component.writeValue(undefined as never);
      expect(component.currentValue).toBe('');
    });

    it('should register onChange callback', () => {
      const mockOnChange = jasmine.createSpy('onChange');

      component.registerOnChange(mockOnChange);

      // Verify callback is stored (implementation detail, but important for CVA)
      expect(component['onChange']).toBe(mockOnChange);
    });

    it('should register onTouched callback', () => {
      const mockOnTouched = jasmine.createSpy('onTouched');

      component.registerOnTouched(mockOnTouched);

      // Verify callback is stored
      expect(component['onTouched']).toBe(mockOnTouched);
    });

    it('should update disabled state when setDisabledState is called', () => {
      component.setDisabledState(true);
      expect(component.isDisabled()).toBe(true);

      component.setDisabledState(false);
      expect(component.isDisabled()).toBe(false);
    });
  });

  describe('Reactive Forms integration', () => {
    let formControl: FormControl;

    beforeEach(() => {
      formControl = new FormControl('');
    });

    it('should work with reactive forms', fakeAsync(() => {
      const testComponent = TestBed.createComponent(TestHostComponent);
      testComponent.componentInstance.formControl = formControl;
      testComponent.detectChanges();
      tick();

      formControl.setValue('Test content');
      testComponent.detectChanges();
      tick();

      const editorComponent = testComponent.debugElement.query(By.directive(NoteMarkdownEditorComponent)).componentInstance;

      expect(editorComponent.currentValue).toBe('Test content');
    }));

    it('should emit value changes to form control', fakeAsync(() => {
      const testComponent = TestBed.createComponent(TestHostComponent);
      testComponent.componentInstance.formControl = formControl;
      testComponent.detectChanges();
      tick();

      const editorComponent = testComponent.debugElement.query(By.directive(NoteMarkdownEditorComponent)).componentInstance;

      // Simulate value change from editor
      editorComponent.currentValue = 'New content';
      editorComponent['onChange']('New content');
      tick();

      expect(formControl.value).toBe('New content');
    }));
  });

  describe('Toolbar interactions', () => {
    it('should call toggleBold when bold button is clicked', () => {
      spyOn(component, 'toggleBold');

      const boldButton = fixture.debugElement.query(By.css('[data-testid="bold-button"]'));
      boldButton.nativeElement.click();

      expect(component.toggleBold).toHaveBeenCalled();
    });

    it('should call toggleItalic when italic button is clicked', () => {
      spyOn(component, 'toggleItalic');

      const italicButton = fixture.debugElement.query(By.css('[data-testid="italic-button"]'));
      italicButton.nativeElement.click();

      expect(component.toggleItalic).toHaveBeenCalled();
    });

    it('should call toggleBulletList when bullet list button is clicked', () => {
      spyOn(component, 'toggleBulletList');

      const bulletButton = fixture.debugElement.query(By.css('[data-testid="bullet-list-button"]'));
      bulletButton.nativeElement.click();

      expect(component.toggleBulletList).toHaveBeenCalled();
    });

    it('should disable toolbar buttons when component is disabled', () => {
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();

      const boldButton = fixture.debugElement.query(By.css('[data-testid="bold-button"]'));
      const italicButton = fixture.debugElement.query(By.css('[data-testid="italic-button"]'));
      const bulletButton = fixture.debugElement.query(By.css('[data-testid="bullet-list-button"]'));

      expect(boldButton.nativeElement.disabled).toBe(true);
      expect(italicButton.nativeElement.disabled).toBe(true);
      expect(bulletButton.nativeElement.disabled).toBe(true);
    });
  });

  describe('Content interaction', () => {
    it('should update currentValue when textarea content changes', () => {
      const textarea = fixture.debugElement.query(By.css('[data-testid="textarea-editor"]'));
      const testValue = 'Test markdown content';

      textarea.nativeElement.value = testValue;
      textarea.nativeElement.dispatchEvent(new Event('input'));

      expect(component.currentValue).toBe(testValue);
    });

    it('should emit valueChange when content changes', () => {
      spyOn(component.valueChange, 'emit');
      const textarea = fixture.debugElement.query(By.css('[data-testid="textarea-editor"]'));
      const testValue = 'Test content change';

      textarea.nativeElement.value = testValue;
      textarea.nativeElement.dispatchEvent(new Event('input'));

      expect(component.valueChange.emit).toHaveBeenCalledWith(testValue);
    });

    it('should call onTouched when textarea is focused', () => {
      const mockOnTouched = jasmine.createSpy('onTouched');
      component.registerOnTouched(mockOnTouched);

      const textarea = fixture.debugElement.query(By.css('[data-testid="textarea-editor"]'));
      textarea.nativeElement.dispatchEvent(new Event('focus'));

      expect(mockOnTouched).toHaveBeenCalled();
    });
  });

  describe('SSR compatibility', () => {
    beforeEach(async () => {
      TestBed.resetTestingModule();

      await TestBed.configureTestingModule({
        imports: [NoteMarkdownEditorComponent],
        providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
      }).compileComponents();

      fixture = TestBed.createComponent(NoteMarkdownEditorComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should render SSR placeholder in server environment', () => {
      const ssrPlaceholder = fixture.debugElement.query(By.css('[data-testid="ssr-placeholder"]'));
      const editorContainer = fixture.debugElement.query(By.css('[data-testid="editor-instance"]'));

      expect(ssrPlaceholder).toBeTruthy();
      expect(editorContainer).toBeFalsy();
    });

    it('should not show toolbar in server environment', () => {
      const toolbar = fixture.debugElement.query(By.css('.wil-note-editor__toolbar'));
      expect(toolbar).toBeFalsy();
    });

    it('should display placeholder text in SSR mode', () => {
      const placeholderText = fixture.debugElement.query(By.css('.wil-note-editor__placeholder-text'));
      expect(placeholderText.nativeElement.textContent).toBe('Start typing your notes...');
    });
  });

  describe('Error handling', () => {
    it('should not throw when toolbar methods are called when disabled', () => {
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();

      expect(() => component.toggleBold()).not.toThrow();
      expect(() => component.toggleItalic()).not.toThrow();
      expect(() => component.toggleBulletList()).not.toThrow();
    });
  });

  describe('Component lifecycle', () => {
    it('should initialize editor on ngOnInit in browser environment', () => {
      spyOn(component as never, 'initializeEditor');

      component.ngOnInit();

      expect(component['initializeEditor']).toHaveBeenCalled();
    });

    it('should not throw on ngOnDestroy', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('Keyboard Shortcuts', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should apply bold formatting when Ctrl+B is pressed', () => {
      // Arrange
      const textarea = fixture.debugElement.query(By.css('[data-testid="textarea-editor"]'));
      spyOn(component, 'toggleBold');

      // Act
      const event = new KeyboardEvent('keydown', { ctrlKey: true, key: 'b' });
      Object.defineProperty(event, 'preventDefault', { value: jasmine.createSpy('preventDefault') });
      textarea.nativeElement.dispatchEvent(event);

      // Assert
      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.toggleBold).toHaveBeenCalled();
    });

    it('should apply italic formatting when Ctrl+I is pressed', () => {
      // Arrange
      const textarea = fixture.debugElement.query(By.css('[data-testid="textarea-editor"]'));
      spyOn(component, 'toggleItalic');

      // Act
      const event = new KeyboardEvent('keydown', { ctrlKey: true, key: 'i' });
      Object.defineProperty(event, 'preventDefault', { value: jasmine.createSpy('preventDefault') });
      textarea.nativeElement.dispatchEvent(event);

      // Assert
      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.toggleItalic).toHaveBeenCalled();
    });

    it('should work with metaKey (Mac) for keyboard shortcuts', () => {
      // Arrange
      const textarea = fixture.debugElement.query(By.css('[data-testid="textarea-editor"]'));
      spyOn(component, 'toggleBold');

      // Act
      const event = new KeyboardEvent('keydown', { metaKey: true, key: 'b' });
      Object.defineProperty(event, 'preventDefault', { value: jasmine.createSpy('preventDefault') });
      textarea.nativeElement.dispatchEvent(event);

      // Assert
      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.toggleBold).toHaveBeenCalled();
    });

    it('should not trigger shortcuts when editor is disabled', () => {
      // Arrange
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();
      const textarea = fixture.debugElement.query(By.css('[data-testid="textarea-editor"]'));
      spyOn(component, 'toggleBold');

      // Act
      const event = new KeyboardEvent('keydown', { ctrlKey: true, key: 'b' });
      Object.defineProperty(event, 'preventDefault', { value: jasmine.createSpy('preventDefault') });
      textarea.nativeElement.dispatchEvent(event);

      // Assert
      expect(component.toggleBold).not.toHaveBeenCalled();
    });

    it('should not prevent default for non-shortcut keys', () => {
      // Arrange
      const textarea = fixture.debugElement.query(By.css('[data-testid="textarea-editor"]'));

      // Act
      const event = new KeyboardEvent('keydown', { ctrlKey: true, key: 'a' });
      Object.defineProperty(event, 'preventDefault', { value: jasmine.createSpy('preventDefault') });
      textarea.nativeElement.dispatchEvent(event);

      // Assert
      expect(event.preventDefault).not.toHaveBeenCalled();
    });
  });
});

@Component({
  template: `
    <form>
      <wil-note-markdown-editor [formControl]="formControl"></wil-note-markdown-editor>
    </form>
  `,
  standalone: true,
  imports: [ReactiveFormsModule, NoteMarkdownEditorComponent],
})
class TestHostComponent {
  formControl = new FormControl('');
}
