import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  ElementRef,
  forwardRef,
  inject,
  input,
  OnDestroy,
  OnInit,
  output,
  PLATFORM_ID,
  signal,
  ViewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { isPlatformBrowser } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'wil-note-markdown-editor',
  templateUrl: './note-markdown-editor.component.html',
  styleUrl: './note-markdown-editor.component.scss',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatTooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NoteMarkdownEditorComponent),
      multi: true,
    },
  ],
})
export class NoteMarkdownEditorComponent implements OnInit, AfterViewInit, OnDestroy, ControlValueAccessor {
  @ViewChild('textareaEditor') textareaEditor!: ElementRef<HTMLTextAreaElement>;

  public readonly disabled = input(false);
  public readonly placeholder = input('Start typing your notes...');
  public readonly maxLength = input<number>();
  public readonly showToolbar = input(true);
  public readonly autoFocus = input(false);
  public readonly showPlaceholderIcon = input(false);

  public readonly valueChange = output<string>();
  public readonly blurField = output<void>();

  private readonly platformId = inject(PLATFORM_ID);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly formDisabled = signal(false);

  // Simplified implementation - will be enhanced with Milkdown later
  public currentValue = '';
  public readonly isDisabled = computed(() => this.disabled() || this.formDisabled());
  private isInitialized = false;

  // ControlValueAccessor properties
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private onChange: (value: string) => void = (value: string) => {
    /* empty */
  };
  private onTouched: () => void = () => {
    /* empty */
  };

  public readonly isBrowser = isPlatformBrowser(this.platformId);

  ngOnInit(): void {
    if (this.isBrowser) {
      this.initializeEditor();
    }
  }

  ngAfterViewInit(): void {
    if (this.autoFocus() && this.isBrowser && this.textareaEditor?.nativeElement) {
      setTimeout(() => {
        this.textareaEditor.nativeElement.focus();
      }, 100);
    }
  }

  // eslint-disable-next-line @angular-eslint/no-empty-lifecycle-method
  ngOnDestroy(): void {
    // Cleanup will be implemented when Milkdown is properly integrated
  }

  // ControlValueAccessor implementation
  writeValue(value: string): void {
    this.currentValue = value || '';
    if (this.isInitialized) {
      this.cdr.markForCheck();
    }
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.formDisabled.set(isDisabled);
    this.cdr.markForCheck();
  }

  // Content change handler for template
  public onContentChange(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    this.currentValue = target.value;
    this.valueChange.emit(this.currentValue);
    this.onChange(this.currentValue);
  }

  // Focus handler
  public onFocus(): void {
    this.onTouched();
  }

  // Blur handler
  public onBlur(): void {
    this.blurField.emit();
  }

  // Keyboard shortcut handler
  public onKeyDown(event: KeyboardEvent): void {
    if (this.isDisabled()) return;

    const isCtrl = event.ctrlKey || event.metaKey;
    if (isCtrl && event.key === 'b') {
      event.preventDefault();
      this.toggleBold();
    } else if (isCtrl && event.key === 'i') {
      event.preventDefault();
      this.toggleItalic();
    }
  }

  // Toolbar actions
  public toggleBold(): void {
    if (this.isDisabled()) return;
    this.wrapSelectedText('**', '**', 'bold text');
  }

  public toggleItalic(): void {
    if (this.isDisabled()) return;
    this.wrapSelectedText('*', '*', 'italic text');
  }

  public toggleBulletList(): void {
    if (this.isDisabled()) return;
    this.insertAtLineStart('- ');
  }

  private initializeEditor(): void {
    this.isInitialized = true;
  }

  private wrapSelectedText(prefix: string, suffix: string, defaultText: string): void {
    if (!this.textareaEditor?.nativeElement) return;

    const textarea = this.textareaEditor.nativeElement;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = this.currentValue.substring(start, end);
    const textToWrap = selectedText || defaultText;

    const beforeSelection = this.currentValue.substring(0, start);
    const afterSelection = this.currentValue.substring(end);

    const newText = beforeSelection + prefix + textToWrap + suffix + afterSelection;

    this.updateValue(newText);

    // Set cursor position after the inserted text
    setTimeout(() => {
      const newCursorPos = start + prefix.length + textToWrap.length + suffix.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
      textarea.focus();
    });
  }

  private insertAtLineStart(prefix: string): void {
    if (!this.textareaEditor?.nativeElement) return;

    const textarea = this.textareaEditor.nativeElement;
    const start = textarea.selectionStart;
    const lines = this.currentValue.split('\n');
    let currentLineIndex = 0;
    let charactersCount = 0;

    // Find which line the cursor is on
    for (let i = 0; i < lines.length; i++) {
      if (charactersCount + lines[i].length >= start) {
        currentLineIndex = i;
        break;
      }
      charactersCount += lines[i].length + 1; // +1 for newline
    }

    // Check if line already starts with bullet
    const currentLine = lines[currentLineIndex];
    const trimmedLine = currentLine.trim();

    if (trimmedLine.startsWith('- ')) {
      // Remove bullet point
      lines[currentLineIndex] = trimmedLine.substring(2);
    } else {
      // Add bullet point
      lines[currentLineIndex] = prefix + trimmedLine;
    }

    const newText = lines.join('\n');
    this.updateValue(newText);

    // Maintain cursor position relative to line
    setTimeout(() => {
      textarea.focus();
    });
  }

  private updateValue(newValue: string): void {
    this.currentValue = newValue;
    this.valueChange.emit(this.currentValue);
    this.onChange(this.currentValue);
    this.cdr.markForCheck();
  }
}
