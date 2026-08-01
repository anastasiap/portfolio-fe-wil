import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  EventEmitter,
  inject,
  input,
  OnInit,
  Output,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ColorChromeModule } from 'ngx-color/chrome';
import { deleteCategory, deleteFreePlanCategory, editCategory, editFreePlanCategory, selectLinkData, selectMode } from '../../../../state';
import { Store } from '@ngrx/store';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ConfirmationDialogComponent } from '../../../../ui/dialogs/confirmation-dialog/confirmation-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { combineLatest, map, Subject } from 'rxjs';
import { CategoryToolboxComponent } from '../../ui/category-toolbox/category-toolbox.component';
import { selectUser } from '../../../../state/auth/auth.selectors';
import { filter, startWith } from 'rxjs/operators';
import { MarkdownComponent, provideMarkdown } from 'ngx-markdown';
import { WheelStateCategory } from '../../../../state/typings';
import { NoteMarkdownEditorComponent } from '../../../note-markdown-editor/note-markdown-editor.component';

interface CategoryFormGroup {
  name: FormControl<string>;
  description: FormControl<string>;
}

interface ViewContext {
  isFreeView: boolean;
  isPaidView: boolean;
  isParticipantView: boolean;
  mode: 'edit' | 'view';
}

interface ColorChangeEvent {
  color: {
    hex: string;
  };
}

const viewContextInitialValue: ViewContext = {
  isFreeView: false,
  isPaidView: false,
  isParticipantView: false,
  mode: 'view',
};

@Component({
  selector: 'wil-category',
  standalone: true,
  imports: [CommonModule, ColorChromeModule, ReactiveFormsModule, CategoryToolboxComponent, NoteMarkdownEditorComponent, MarkdownComponent],
  templateUrl: './category.component.html',
  styleUrl: './category.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideMarkdown()],
})
export class CategoryComponent implements OnInit {
  public readonly hasEditingOpen = input.required<boolean>();
  @Output() public readonly editingOpened = new EventEmitter<boolean>();

  private readonly store = inject(Store);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialog = inject(MatDialog);
  private readonly platformId = inject(PLATFORM_ID);

  public readonly wheelId = input.required<string>();
  public readonly category = input.required<WheelStateCategory>();

  public categoryForm!: FormGroup<CategoryFormGroup>;
  public readonly isBrowser = isPlatformBrowser(this.platformId);

  // if NoAuth then toolbox is togglable -> mode always view, then toggle
  // if Free/Personal/Professional - for mode 'edit', isEditMode always true -> never toggles,
  //                               - for mode 'view' always false -> never toggles; NOT IMPLEMENTED YET. toggles for edit mode
  public readonly isEditMode = signal(false);
  public readonly isColorEditMode = signal(false);
  public readonly catColor = signal('#989898');
  public readonly descInputHeight = signal({ height: 'auto', minHeight: '75px' });

  public readonly onToggleTools$ = new Subject<boolean>();
  public readonly onToggleEditModeClick$ = new Subject<void>();

  public isToolboxHidden$ = this.onToggleTools$.pipe(
    filter(() => {
      const context = this.viewContext();

      return context.isFreeView || context.mode === 'edit';
    }),
    filter(() => !this.isColorEditMode() && !this.isEditMode() && !this.hasEditingOpen()),
    startWith(true)
  );

  private readonly viewContext = toSignal(
    combineLatest([this.store.select(selectUser), this.store.select(selectLinkData), this.store.select(selectMode)]).pipe(
      map(([user, linkData, mode]): ViewContext => {
        const isFreeView = user === null && linkData === null;

        return {
          isFreeView,
          isPaidView: Boolean(user),
          isParticipantView: user === null && Boolean(linkData),
          mode,
        };
      })
    ),
    {
      initialValue: viewContextInitialValue,
    }
  );

  public readonly noColumnGap = computed(() => {
    const context = this.viewContext();

    return (context.isPaidView && context.mode === 'view') || context.isParticipantView;
  });

  ngOnInit() {
    this.categoryForm = this.fb.group({
      name: new FormControl(this.category().name, { nonNullable: true }),
      description: new FormControl(this.category().description, { nonNullable: true }),
    });

    this.catColor.set(this.category().color);

    // user click on words (not available for Paid Users in view mode)
    this.onToggleEditModeClick$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      const context = this.viewContext();

      if (!this.hasEditingOpen() && !context.isParticipantView && (!context.isPaidView || context.mode === 'edit')) {
        this.toggleEditMode();
      }
    });
  }

  public toggleEditMode(): void {
    if (!this.isBrowser || this.isColorEditMode() || window.innerWidth < 768) {
      return;
    }

    this.isEditMode.update((isEditMode) => !isEditMode);

    this.editingOpened.emit(this.isEditMode());
  }

  public alert() {
    const dialogData: ConfirmationDialogData = {
      title: 'warning',
      message: 'deleteCategoryWarning',
      confirmText: 'ok',
      cancelText: 'cancel',
    };

    this.dialog
      .open(ConfirmationDialogComponent, {
        data: dialogData,
        width: '400px',
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result === true) {
          if (this.viewContext().isFreeView) {
            this.store.dispatch(deleteFreePlanCategory({ id: this.category().id }));
            return;
          }
          this.store.dispatch(deleteCategory({ id: this.category().id }));
        }
        this.editingOpened.emit(false);
      });
  }

  public toggleColorPicker(): void {
    this.isColorEditMode.update((isColorEditMode) => !isColorEditMode);
  }

  public updateColor(event: ColorChangeEvent): void {
    this.catColor.set(event.color.hex);
  }

  public closePalette(): void {
    this.isColorEditMode.set(false);

    if (!this.catColor()) {
      return;
    }

    this.updateData();
  }

  public updateData(): void {
    const categoryPrevState = this.category();
    const formValue = this.categoryForm.getRawValue();

    if (this.viewContext().isFreeView) {
      this.store.dispatch(
        editFreePlanCategory({
          category: {
            ...categoryPrevState,
            name: formValue.name,
            description: formValue.description,
            color: this.catColor(),
          },
        })
      );

      return;
    }

    this.store.dispatch(
      editCategory({
        categoryId: categoryPrevState.id,
        label: formValue.name,
        description: formValue.description,
        color: this.catColor(),
      })
    );
  }
}
