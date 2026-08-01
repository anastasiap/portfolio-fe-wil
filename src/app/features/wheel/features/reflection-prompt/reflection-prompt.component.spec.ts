/* eslint-disable @typescript-eslint/no-empty-function */
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, forwardRef, Input, Output } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { MemoizedSelector } from '@ngrx/store';

import { clearSessionDraftNote, selectSessionDraftNote, setSessionDraftNote } from '../../../../state';
import { ReflectionPromptComponent } from './reflection-prompt.component';

@Component({
  selector: 'wil-note-markdown-editor',
  standalone: true,
  template: '',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => NoteMarkdownEditorStubComponent), multi: true }],
})
class NoteMarkdownEditorStubComponent implements ControlValueAccessor {
  @Input() maxLength?: number;
  @Input() showToolbar?: boolean;
  @Input() autoFocus?: boolean;
  @Input() showPlaceholderIcon?: boolean;
  @Input() placeholder?: string;
  public disabled = false;
  @Output() blurField = new EventEmitter<void>();

  writeValue(): void {}
  registerOnChange(): void {}
  registerOnTouched(): void {}
  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}

const PROMPTS = [
  'What stood out during this check-in?',
  'What changed since your last session?',
  'Which part felt hardest to score today?',
  'What do you want to remember next time?',
  'What surprised you while doing this?',
] as const;

interface SetupResult {
  component: ReflectionPromptComponent;
  dispatchSpy: jasmine.Spy;
  fixture: ComponentFixture<ReflectionPromptComponent>;
}

describe('ReflectionPromptComponent', () => {
  let mockStore: MockStore;
  let draftSelector: MemoizedSelector<object, string | undefined>;

  const setup = (draftNote: string | undefined = ''): SetupResult => {
    draftSelector = mockStore.overrideSelector(selectSessionDraftNote, draftNote);

    const fixture = TestBed.createComponent(ReflectionPromptComponent);
    const component = fixture.componentInstance;
    const dispatchSpy = spyOn(mockStore, 'dispatch').and.callThrough();

    fixture.detectChanges();

    return { component, dispatchSpy, fixture };
  };

  const getPromptText = (fixture: ComponentFixture<ReflectionPromptComponent>): string => {
    const label = fixture.debugElement.query(By.css('[data-testid="prompt-label"]'));

    return (label.nativeElement as HTMLElement).textContent?.trim() || '';
  };

  const getEditor = (fixture: ComponentFixture<ReflectionPromptComponent>): NoteMarkdownEditorStubComponent => {
    return fixture.debugElement.query(By.directive(NoteMarkdownEditorStubComponent)).componentInstance as NoteMarkdownEditorStubComponent;
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReflectionPromptComponent, NoopAnimationsModule],
      providers: [provideMockStore()],
    })
      .overrideComponent(ReflectionPromptComponent, {
        set: {
          imports: [CommonModule, ReactiveFormsModule, NoteMarkdownEditorStubComponent],
        },
      })
      .compileComponents();

    mockStore = TestBed.inject(MockStore);
  });

  afterEach(() => {
    mockStore.resetSelectors();
  });

  describe('visibility transitions', () => {
    it('should generate a new prompt and request autofocus only when becoming visible', fakeAsync(() => {
      // Arrange
      spyOn(Math, 'random').and.returnValues(0, 0.1, 0.4);
      const { fixture } = setup();

      expect(getPromptText(fixture)).toContain(PROMPTS[0]);

      // Act
      fixture.componentRef.setInput('isVisible', true);
      fixture.detectChanges();

      // Assert
      expect(getPromptText(fixture)).toContain(PROMPTS[2]);
      expect(getEditor(fixture).autoFocus).toBeTrue();

      tick(500);
      fixture.detectChanges();

      expect(getEditor(fixture).autoFocus).toBeFalse();
    }));

    it('should not regenerate the prompt when change detection runs while still visible', fakeAsync(() => {
      // Arrange
      const randomSpy = spyOn(Math, 'random').and.returnValues(0, 0.1, 0.2, 0.8);
      const { fixture } = setup();

      fixture.componentRef.setInput('isVisible', true);
      fixture.detectChanges();
      const visiblePrompt = getPromptText(fixture);

      // Act
      fixture.detectChanges();
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();

      // Assert
      expect(getPromptText(fixture)).toBe(visiblePrompt);
      expect(randomSpy).toHaveBeenCalledTimes(3);

      tick(500);
    }));

    it('should reset the completion event when hidden and generate a new prompt on the next visible transition', fakeAsync(() => {
      // Arrange
      spyOn(Math, 'random').and.returnValues(0, 0.1, 0.2, 0.3, 0.8);
      const { fixture } = setup();

      fixture.componentRef.setInput('isVisible', true);
      fixture.detectChanges();
      expect(getPromptText(fixture)).toContain(PROMPTS[1]);

      // Act
      fixture.componentRef.setInput('isVisible', null);
      fixture.detectChanges();

      fixture.componentRef.setInput('isVisible', true);
      fixture.detectChanges();

      // Assert
      expect(getPromptText(fixture)).toContain(PROMPTS[4]);
      expect(getEditor(fixture).autoFocus).toBeTrue();

      tick(500);
    }));
  });

  describe('draft note persistence', () => {
    it('should hydrate the draft note from store when it differs from the editor value', () => {
      // Arrange & Act
      const { component } = setup('Stored reflection');

      // Assert
      expect(component.noteValue()).toBe('Stored reflection');
      expect(component.notesControl.value).toBe('Stored reflection');
    });

    it('should not write the store draft back into the editor when it matches the last debounced local note', fakeAsync(() => {
      // Arrange
      const { component, fixture } = setup();

      component.notesControl.setValue('Local reflection');
      tick(500);
      component.notesControl.setValue('Unsaved follow-up');

      const setValueSpy = spyOn(component.notesControl, 'setValue').and.callThrough();

      // Act
      draftSelector.setResult('Local reflection');
      mockStore.refreshState();
      fixture.detectChanges();

      // Assert
      expect(setValueSpy).not.toHaveBeenCalled();
      expect(component.noteValue()).toBe('Unsaved follow-up');

      tick(500);
    }));

    it('should flush the current note immediately when the editor blurs', fakeAsync(() => {
      // Arrange
      const { component, dispatchSpy, fixture } = setup();
      component.notesControl.setValue('Blurred reflection');
      dispatchSpy.calls.reset();

      // Act
      getEditor(fixture).blurField.emit();
      fixture.detectChanges();

      // Assert
      expect(dispatchSpy).toHaveBeenCalledOnceWith(setSessionDraftNote({ noteMd: 'Blurred reflection' }));

      tick(500);
    }));

    it('should dispatch a clear draft action when clearing the draft note', () => {
      // Arrange
      const { component, dispatchSpy } = setup('Stored reflection');

      // Act
      component.clearDraftNote();

      // Assert
      expect(dispatchSpy).toHaveBeenCalledOnceWith(clearSessionDraftNote());
    });
  });

  describe('disabled state', () => {
    it('should disable the editor when either the input or ControlValueAccessor state is disabled', () => {
      // Arrange
      const { component, fixture } = setup();

      expect(getEditor(fixture).disabled).toBeFalse();

      // Act & Assert
      component.setDisabledState(true);
      fixture.detectChanges();
      expect(getEditor(fixture).disabled).toBeTrue();

      component.setDisabledState(false);
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();
      expect(getEditor(fixture).disabled).toBeTrue();

      fixture.componentRef.setInput('disabled', false);
      fixture.detectChanges();
      expect(getEditor(fixture).disabled).toBeFalse();
    });
  });
});
