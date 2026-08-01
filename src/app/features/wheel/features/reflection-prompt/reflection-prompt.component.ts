import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  EventEmitter,
  forwardRef,
  inject,
  input,
  OnInit,
  Output,
  signal,
} from '@angular/core';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';

import { debounceTime, distinctUntilChanged, filter, Subject } from 'rxjs';
import { Store } from '@ngrx/store';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { clearSessionDraftNote, selectSessionDraftNote, setSessionDraftNote } from '../../../../state';
import { AppState } from '../../../../state/typings';
import { NoteMarkdownEditorComponent } from '../../../note-markdown-editor/note-markdown-editor.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// Reflection prompt constants
const REFLECTION_PROMPTS = [
  'What stood out during this check-in?',
  'What changed since your last session?',
  'Which part felt hardest to score today?',
  'What do you want to remember next time?',
  'What surprised you while doing this?',
] as const;

@Component({
  selector: 'wil-reflection-prompt',
  templateUrl: './reflection-prompt.component.html',
  styleUrl: './reflection-prompt.component.scss',
  standalone: true,
  imports: [NoteMarkdownEditorComponent, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ReflectionPromptComponent),
      multi: true,
    },
  ],
  animations: [
    trigger('slideIn', [
      state(
        'hidden',
        style({
          height: '0px',
          opacity: 0,
          overflow: 'hidden',
          marginTop: '0px',
          marginBottom: '0px',
        })
      ),
      state(
        'visible',
        style({
          height: '*',
          opacity: 1,
          overflow: 'hidden',
          marginTop: '20px',
          marginBottom: '16px',
        })
      ),
      transition('hidden => visible', [animate('300ms ease-out')]),
      transition('visible => hidden', [animate('250ms ease-in')]),
    ]),
  ],
})
export class ReflectionPromptComponent implements OnInit, ControlValueAccessor {
  private readonly store = inject(Store<AppState>);
  private readonly destroyRef = inject(DestroyRef);

  public readonly isVisible = input<boolean | null>(false);
  public readonly disabled = input(false);

  @Output() valueChange = new EventEmitter<string>();

  private readonly noteChange$ = new Subject<string>();

  private lastEmittedValue = '';

  private readonly controlDisabled = signal(false);
  public readonly currentPrompt = signal<string>('');
  public readonly noteValue = signal<string>('');
  public readonly shouldAutoFocus = signal<boolean>(false);
  public readonly isEditorDisabled = computed(() => this.disabled() || this.controlDisabled());

  public readonly notesControl = new FormControl('');
  private readonly editorDisabledStateEffect = effect(() => {
    if (this.isEditorDisabled()) {
      this.notesControl.disable({ emitEvent: false });
      return;
    }

    this.notesControl.enable({ emitEvent: false });
  });

  // Track when scoring was completed to avoid changing prompt on re-renders
  private completionEventId: string | null = null;
  private previousVisible = false;

  private readonly visibilityChangeEffect = effect(
    () => {
      const currentVisible = this.isVisible() === true;
      const previousVisible = this.previousVisible;

      if (currentVisible !== previousVisible) {
        this.onVisibilityChange(currentVisible);
      }

      this.previousVisible = currentVisible;
    },
    { allowSignalWrites: true }
  );

  // ControlValueAccessor properties
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private onChange: (value: string) => void = (value: string) => {
    /* empty */
  };
  private onTouched: () => void = () => {
    /* empty */
  };

  ngOnInit(): void {
    // Generate initial prompt when component is created
    this.generateNewPrompt();

    // Initialize form control with draft note from store
    this.store
      .select(selectSessionDraftNote)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((draftNote) => {
        const currentValue = this.notesControl.value || '';
        // Only update if the store value is different and not from typing loop
        if (draftNote !== currentValue && draftNote !== this.lastEmittedValue) {
          this.notesControl.setValue(draftNote || '', { emitEvent: false });
          this.noteValue.set(draftNote || '');
        }
      });

    // Set up debounced updates to store (500ms debounce)
    this.noteChange$
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        filter((value) => value !== this.lastEmittedValue),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((noteMd) => {
        this.lastEmittedValue = noteMd;
        this.store.dispatch(setSessionDraftNote({ noteMd }));
      });

    // Listen to form control changes
    this.notesControl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => {
      const noteValue = value || '';
      this.noteValue.set(noteValue);
      this.valueChange.emit(noteValue);
      this.onChange(noteValue);
      this.noteChange$.next(noteValue);
    });
  }

  // Called when visibility changes (wheel becomes fully scored)
  public onVisibilityChange(isVisible: boolean): void {
    if (isVisible && !this.completionEventId) {
      // New completion event - generate new prompt
      const eventId = `completion-${Date.now()}-${Math.random()}`;
      this.completionEventId = eventId;
      this.generateNewPrompt();

      // Set autofocus when becoming visible
      this.shouldAutoFocus.set(true);
      // Reset autofocus flag after a short delay
      setTimeout(() => {
        this.shouldAutoFocus.set(false);
      }, 500);
    } else if (!isVisible) {
      // Reset completion event when wheel becomes not fully scored
      this.completionEventId = null;
      this.shouldAutoFocus.set(false);
    }
  }

  public onInputChange(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    const value = target.value;
    this.noteValue.set(value);
    this.valueChange.emit(value);
    this.onChange(value);
  }

  public onInputFocus(): void {
    this.onTouched();
  }

  // Handle editor blur - flush any pending changes immediately
  public onEditorBlur(): void {
    this.onTouched();
    const currentValue = this.notesControl.value || '';
    if (currentValue !== this.lastEmittedValue) {
      this.lastEmittedValue = currentValue;
      this.store.dispatch(setSessionDraftNote({ noteMd: currentValue }));
    }
  }

  // ControlValueAccessor implementation
  writeValue(value: string): void {
    const noteValue = value || '';
    this.noteValue.set(noteValue);
    this.notesControl.setValue(noteValue, { emitEvent: false });
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.controlDisabled.set(isDisabled);
  }

  private generateNewPrompt(): void {
    const randomIndex = Math.floor(Math.random() * REFLECTION_PROMPTS.length);
    const selectedPrompt = REFLECTION_PROMPTS[randomIndex];
    this.currentPrompt.set(selectedPrompt);
  }

  // Expose animation state for template
  public getAnimationState(): 'visible' | 'hidden' {
    return this.isVisible() === true ? 'visible' : 'hidden';
  }

  // Clear draft note (called externally when session is reset)
  public clearDraftNote(): void {
    this.store.dispatch(clearSessionDraftNote());
  }
}
