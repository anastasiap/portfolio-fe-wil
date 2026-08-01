/* eslint-disable @typescript-eslint/no-empty-function, @angular-eslint/component-selector, @angular-eslint/no-output-on-prefix */
import { Component, DebugElement, EventEmitter, forwardRef, Input, Output } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';

import { CategoryComponent } from './category.component';
import { deleteCategory, deleteFreePlanCategory, editCategory, editFreePlanCategory, selectLinkData, selectMode } from '../../../../state';
import { selectUser } from '../../../../state/auth/auth.selectors';
import { ConfirmationDialogComponent } from '../../../../ui/dialogs/confirmation-dialog/confirmation-dialog.component';
import { User } from '../../../../services/auth/auth.types';

// ---------------------------------------------------------------------------
// Stubs
// ---------------------------------------------------------------------------

@Component({ selector: 'wil-category-toolbox', standalone: true, template: '' })
class CategoryToolboxStubComponent {
  @Input() isEditMode = false;
  @Input() isColorEditMode = false;
  @Output() alert = new EventEmitter<void>();
  @Output() toggleColorPicker = new EventEmitter<void>();
  @Output() toggleEditMode = new EventEmitter<void>();
  @Output() updateData = new EventEmitter<void>();
}

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
  @Input() disabled?: boolean;
  writeValue(): void {}
  registerOnChange(): void {}
  registerOnTouched(): void {}
}

@Component({ selector: 'markdown', standalone: true, template: '' })
class MarkdownStubComponent {
  @Input() data?: string;
}

@Component({ selector: 'color-chrome', standalone: true, template: '' })
class ColorChromeStubComponent {
  @Input() color?: string;
  @Output() onChangeComplete = new EventEmitter<unknown>();
}

// ---------------------------------------------------------------------------
// Default mock category
// ---------------------------------------------------------------------------

const mockCategory = {
  id: 'cat-1',
  name: 'Health',
  color: '#ff0000',
  description: 'My description',
  order: 0,
  score: 5,
};

const mockUser: User = {
  id: 'u1',
  email: 'user@example.com',
  emailVerified: true,
  systemRole: 'user',
  status: 'active',
  auth: {
    mfaEnabled: false,
    lastLoginAt: '2026-01-01T00:00:00.000Z',
  },
  audit: {
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
};

const mockLinkData = { token: 'abc' } as ParticipantsWheelViewDto;

// ---------------------------------------------------------------------------
// Setup helper
// ---------------------------------------------------------------------------

interface SetupOptions {
  user?: object | null;
  linkData?: object | null;
  mode?: string;
  hasEditingOpen?: boolean;
  dialogResult?: boolean;
}

async function setup(
  options: SetupOptions = {}
): Promise<{ fixture: ComponentFixture<CategoryComponent>; mockStore: MockStore; mockDialog: jasmine.SpyObj<MatDialog> }> {
  const { user = null, linkData = null, mode = 'view', hasEditingOpen = false, dialogResult = false } = options;

  const mockDialogRef = { afterClosed: () => of(dialogResult) };
  const mockDialog = jasmine.createSpyObj('MatDialog', ['open']);
  mockDialog.open.and.returnValue(mockDialogRef as never);

  await TestBed.configureTestingModule({
    imports: [CategoryComponent, NoopAnimationsModule],
    providers: [
      provideMockStore({
        selectors: [
          { selector: selectMode, value: mode },
          { selector: selectUser, value: user },
          { selector: selectLinkData, value: linkData },
        ],
      }),
      { provide: MatDialog, useValue: mockDialog },
    ],
  })
    .overrideComponent(CategoryComponent, {
      set: {
        imports: [
          CommonModule,
          ReactiveFormsModule,
          CategoryToolboxStubComponent,
          NoteMarkdownEditorStubComponent,
          MarkdownStubComponent,
          ColorChromeStubComponent,
        ],
      },
    })
    .compileComponents();

  const mockStore = TestBed.inject(MockStore);
  const fixture = TestBed.createComponent(CategoryComponent);
  fixture.componentRef.setInput('wheelId', 'wheel-1');
  fixture.componentRef.setInput('category', mockCategory);
  fixture.componentRef.setInput('hasEditingOpen', hasEditingOpen);
  fixture.detectChanges();

  return { fixture, mockStore, mockDialog };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CategoryComponent – wil-category-toolbox', () => {
  describe('1. Always present', () => {
    it('should always render wil-category-toolbox', async () => {
      // Arrange & Act
      const { fixture } = await setup();

      // Assert
      const el = fixture.debugElement.query(By.css('[data-testid="category-toolbox"]'));
      expect(el).toBeTruthy();
    });
  });

  // -------------------------------------------------------------------------
  // 2. hide-visually class (isToolboxHidden$)
  // -------------------------------------------------------------------------

  describe('2. hide-visually class (isToolboxHidden$)', () => {
    it('should apply hide-visually on initial render (startWith value)', async () => {
      // Arrange & Act – detectChanges already called in setup
      const { fixture } = await setup({ user: null, linkData: null, mode: 'view' });

      // Assert
      const el = fixture.debugElement.query(By.css('[data-testid="category-toolbox"]'));
      expect(el.nativeElement.classList).toContain('hide-visually');
    });

    it('should remove hide-visually after mouseenter when isFreeView (user=null, linkData=null)', async () => {
      // Arrange
      const { fixture } = await setup({ user: null, linkData: null, mode: 'view' });
      const host = fixture.debugElement.query(By.css('.c-category'));

      // Act
      host.nativeElement.dispatchEvent(new MouseEvent('mouseenter'));
      fixture.detectChanges();

      // Assert
      const el = fixture.debugElement.query(By.css('[data-testid="category-toolbox"]'));
      expect(el.nativeElement.classList).not.toContain('hide-visually');
    });

    it('should re-apply hide-visually after mouseleave following mouseenter (freeView)', async () => {
      // Arrange
      const { fixture } = await setup({ user: null, linkData: null, mode: 'view' });
      const host = fixture.debugElement.query(By.css('.c-category'));
      host.nativeElement.dispatchEvent(new MouseEvent('mouseenter'));
      fixture.detectChanges();

      // Act
      host.nativeElement.dispatchEvent(new MouseEvent('mouseleave'));
      fixture.detectChanges();

      // Assert
      const el = fixture.debugElement.query(By.css('[data-testid="category-toolbox"]'));
      expect(el.nativeElement.classList).toContain('hide-visually');
    });

    it('should remove hide-visually after mouseenter when mode is edit (isPaidView user)', async () => {
      // Arrange
      const { fixture } = await setup({ user: { id: 'u1', plan: 'personal' }, linkData: null, mode: 'edit' });
      const host = fixture.debugElement.query(By.css('.c-category'));

      // Act
      host.nativeElement.dispatchEvent(new MouseEvent('mouseenter'));
      fixture.detectChanges();

      // Assert
      const el = fixture.debugElement.query(By.css('[data-testid="category-toolbox"]'));
      expect(el.nativeElement.classList).not.toContain('hide-visually');
    });

    it('should keep hide-visually when hasEditingOpen is true on mouseenter (freeView)', async () => {
      // Arrange
      const { fixture } = await setup({ user: null, linkData: null, mode: 'view', hasEditingOpen: true });
      const host = fixture.debugElement.query(By.css('.c-category'));

      // Act
      host.nativeElement.dispatchEvent(new MouseEvent('mouseenter'));
      fixture.detectChanges();

      // Assert
      const el = fixture.debugElement.query(By.css('[data-testid="category-toolbox"]'));
      expect(el.nativeElement.classList).toContain('hide-visually');
    });

    it('should keep hide-visually after mouseenter when isColorEditMode is true (freeView)', async () => {
      // Arrange – trigger isColorEditMode via the toolbox output, not direct assignment
      const { fixture } = await setup({ user: null, linkData: null, mode: 'view' });
      const stub = fixture.debugElement.query(By.css('[data-testid="category-toolbox"]')).componentInstance as CategoryToolboxStubComponent;
      stub.toggleColorPicker.emit();
      fixture.detectChanges();
      const host = fixture.debugElement.query(By.css('.c-category'));

      // Act
      host.nativeElement.dispatchEvent(new MouseEvent('mouseenter'));
      fixture.detectChanges();

      // Assert
      const el = fixture.debugElement.query(By.css('[data-testid="category-toolbox"]'));
      expect(el.nativeElement.classList).toContain('hide-visually');
    });

    it('should keep hide-visually on mouseenter when mode is view and user is logged in (first filter blocks)', async () => {
      // Arrange – isPaidView=true, mode=view → first filter(isFreeView || mode=edit) rejects
      const { fixture } = await setup({ user: { id: 'u1', plan: 'personal' }, linkData: null, mode: 'view' });
      const host = fixture.debugElement.query(By.css('.c-category'));

      // Act
      host.nativeElement.dispatchEvent(new MouseEvent('mouseenter'));
      fixture.detectChanges();

      // Assert
      const el = fixture.debugElement.query(By.css('[data-testid="category-toolbox"]'));
      expect(el.nativeElement.classList).toContain('hide-visually');
    });
  });

  // -------------------------------------------------------------------------
  // 3. hide class (noColumnGap$)
  // -------------------------------------------------------------------------

  describe('3. hide class (noColumnGap$)', () => {
    it('should apply hide class when user is logged in and mode is view', async () => {
      // Arrange & Act
      const { fixture } = await setup({ user: { id: 'u1', plan: 'personal' }, linkData: null, mode: 'view' });

      // Assert
      const el = fixture.debugElement.query(By.css('[data-testid="category-toolbox"]'));
      expect(el.nativeElement.classList).toContain('hide');
    });

    it('should NOT apply hide class when user is logged in and mode is edit', async () => {
      // Arrange & Act
      const { fixture } = await setup({ user: { id: 'u1', plan: 'personal' }, linkData: null, mode: 'edit' });

      // Assert
      const el = fixture.debugElement.query(By.css('[data-testid="category-toolbox"]'));
      expect(el.nativeElement.classList).not.toContain('hide');
    });

    it('should NOT apply hide class in freeView (user=null, linkData=null, mode=view)', async () => {
      // Arrange & Act
      const { fixture } = await setup({ user: null, linkData: null, mode: 'view' });

      // Assert
      const el = fixture.debugElement.query(By.css('[data-testid="category-toolbox"]'));
      expect(el.nativeElement.classList).not.toContain('hide');
    });

    it('should apply hide class when isParticipantView (user=null, linkData present)', async () => {
      // Arrange & Act
      const { fixture } = await setup({ user: null, linkData: { token: 'abc' }, mode: 'view' });

      // Assert
      const el = fixture.debugElement.query(By.css('[data-testid="category-toolbox"]'));
      expect(el.nativeElement.classList).toContain('hide');
    });
  });

  // -------------------------------------------------------------------------
  // 4. Attribute bindings on toolbox stub
  // -------------------------------------------------------------------------

  describe('4. [isEditMode] and [isColorEditMode] bindings', () => {
    it('should bind [isEditMode]=false on initial render', async () => {
      // Arrange & Act
      const { fixture } = await setup();
      const stub = fixture.debugElement.query(By.css('[data-testid="category-toolbox"]')).componentInstance as CategoryToolboxStubComponent;

      // Assert
      expect(stub.isEditMode).toBeFalse();
    });

    it('should bind [isColorEditMode]=false on initial render', async () => {
      // Arrange & Act
      const { fixture } = await setup();
      const stub = fixture.debugElement.query(By.css('[data-testid="category-toolbox"]')).componentInstance as CategoryToolboxStubComponent;

      // Assert
      expect(stub.isColorEditMode).toBeFalse();
    });

    it('should update [isEditMode]=true after stub emits (toggleEditMode) in freeView', async () => {
      // Arrange – freeView allows toggling
      const { fixture } = await setup({ user: null, linkData: null, mode: 'view' });
      const stub = fixture.debugElement.query(By.css('[data-testid="category-toolbox"]')).componentInstance as CategoryToolboxStubComponent;

      // Act
      stub.toggleEditMode.emit();
      fixture.detectChanges();

      // Assert
      expect(stub.isEditMode).toBeTrue();
    });

    it('should update [isColorEditMode]=true after stub emits (toggleColorPicker)', async () => {
      // Arrange
      const { fixture } = await setup();
      const stub = fixture.debugElement.query(By.css('[data-testid="category-toolbox"]')).componentInstance as CategoryToolboxStubComponent;

      // Act
      stub.toggleColorPicker.emit();
      fixture.detectChanges();

      // Assert
      expect(stub.isColorEditMode).toBeTrue();
    });
  });

  // -------------------------------------------------------------------------
  // 5. Output event handlers
  // -------------------------------------------------------------------------

  describe('5. Output event handlers', () => {
    it('should call dialog.open when stub emits (alert)', async () => {
      // Arrange
      const { fixture, mockDialog } = await setup();
      const stub = fixture.debugElement.query(By.css('[data-testid="category-toolbox"]')).componentInstance as CategoryToolboxStubComponent;

      // Act
      stub.alert.emit();
      fixture.detectChanges();

      // Assert
      expect(mockDialog.open).toHaveBeenCalledWith(ConfirmationDialogComponent, jasmine.anything());
    });

    it('should dispatch when stub emits (updateData) in freeView', async () => {
      // Arrange
      const { fixture, mockStore } = await setup({ user: null, linkData: null, mode: 'view' });
      spyOn(mockStore, 'dispatch').and.callThrough();
      const stub = fixture.debugElement.query(By.css('[data-testid="category-toolbox"]')).componentInstance as CategoryToolboxStubComponent;

      // Act
      stub.updateData.emit();
      fixture.detectChanges();

      // Assert
      expect(mockStore.dispatch).toHaveBeenCalledWith(jasmine.objectContaining({ type: editFreePlanCategory.type }));
    });
  });

  // -------------------------------------------------------------------------
  // 6. c-category--display-mode
  // -------------------------------------------------------------------------

  describe('6. c-category--display-mode', () => {
    // -----------------------------------------------------------------------
    // Group A – *ngIf display condition
    // -----------------------------------------------------------------------

    it('should render display-mode div when isEditMode is false (initial state)', async () => {
      // Arrange & Act
      const { fixture } = await setup();

      // Assert
      const el = fixture.debugElement.query(By.css('[data-testid="category-display-mode"]'));
      expect(el).toBeTruthy();
    });

    it('should hide display-mode div after stub emits (toggleEditMode) in freeView', async () => {
      // Arrange
      const { fixture } = await setup({ user: null, linkData: null, mode: 'view' });
      const stub = fixture.debugElement.query(By.css('[data-testid="category-toolbox"]')).componentInstance as CategoryToolboxStubComponent;

      // Act
      stub.toggleEditMode.emit();
      fixture.detectChanges();

      // Assert
      const el = fixture.debugElement.query(By.css('[data-testid="category-display-mode"]'));
      expect(el).toBeNull();
    });

    // -----------------------------------------------------------------------
    // Group B – styling / data bindings from category() input
    // -----------------------------------------------------------------------

    it('should apply category color to title [style.color]', async () => {
      // Arrange & Act
      const { fixture } = await setup();

      // Assert
      const title = fixture.debugElement.query(By.css('[data-testid="category-title"]'));
      expect(title.nativeElement.style.color).toBe('rgb(255, 0, 0)');
    });

    it('should apply category color to mark-wrapper [style.backgroundColor]', async () => {
      // Arrange & Act
      const { fixture } = await setup();

      // Assert
      const wrapper = fixture.debugElement.query(By.css('[data-testid="category-mark-wrapper"]'));
      expect(wrapper.nativeElement.style.backgroundColor).toBe('rgb(255, 0, 0)');
    });

    it('should render category score in mark element', async () => {
      // Arrange & Act
      const { fixture } = await setup();

      // Assert
      const score = fixture.debugElement.query(By.css('[data-testid="category-score"]'));
      expect(score.nativeElement.textContent.trim()).toBe('5');
    });

    it('should pass category description to markdown [data] binding', async () => {
      // Arrange & Act
      const { fixture } = await setup();

      // Assert
      const md = fixture.debugElement.query(By.css('[data-testid="category-description"]'));
      expect(md.componentInstance.data).toBe('My description');
    });

    // -----------------------------------------------------------------------
    // Group C – click → onToggleEditModeClick$ guard
    // -----------------------------------------------------------------------

    it('should toggle isEditMode to true when display-mode div is clicked in freeView', async () => {
      // Arrange
      const { fixture } = await setup({ user: null, linkData: null, mode: 'view' });
      const el = fixture.debugElement.query(By.css('[data-testid="category-display-mode"]'));

      // Act
      el.nativeElement.click();
      fixture.detectChanges();

      // Assert – display-mode div removed means isEditMode flipped
      expect(fixture.debugElement.query(By.css('[data-testid="category-display-mode"]'))).toBeNull();
    });

    it('should NOT toggle isEditMode when hasEditingOpen is true on click', async () => {
      // Arrange
      const { fixture } = await setup({ user: null, linkData: null, mode: 'view', hasEditingOpen: true });
      const el = fixture.debugElement.query(By.css('[data-testid="category-display-mode"]'));

      // Act
      el.nativeElement.click();
      fixture.detectChanges();

      // Assert – display-mode still present
      expect(fixture.debugElement.query(By.css('[data-testid="category-display-mode"]'))).not.toBeNull();
    });

    it('should NOT toggle isEditMode when isParticipantView on click (user=null, linkData present)', async () => {
      // Arrange
      const { fixture } = await setup({ user: null, linkData: { token: 'abc' }, mode: 'view' });
      const el = fixture.debugElement.query(By.css('[data-testid="category-display-mode"]'));

      // Act
      el.nativeElement.click();
      fixture.detectChanges();

      // Assert – display-mode still present
      expect(fixture.debugElement.query(By.css('[data-testid="category-display-mode"]'))).not.toBeNull();
    });

    it('should NOT toggle isEditMode when isPaidView + mode=view on click', async () => {
      // Arrange
      const { fixture } = await setup({ user: { id: 'u1', plan: 'personal' }, linkData: null, mode: 'view' });
      const el = fixture.debugElement.query(By.css('[data-testid="category-display-mode"]'));

      // Act
      el.nativeElement.click();
      fixture.detectChanges();

      // Assert – display-mode still present
      expect(fixture.debugElement.query(By.css('[data-testid="category-display-mode"]'))).not.toBeNull();
    });

    it('should render edit-mode div when isEditMode is true', async () => {
      // Arrange
      const { fixture } = await setup({ user: null, linkData: null, mode: 'view' });
      const stub = fixture.debugElement.query(By.css('[data-testid="category-toolbox"]')).componentInstance as CategoryToolboxStubComponent;

      // Act
      stub.toggleEditMode.emit();
      fixture.detectChanges();

      // Assert – edit-mode div rendered, display-mode div removed
      expect(fixture.debugElement.query(By.css('[data-testid="category-edit-mode"]'))).not.toBeNull();
      expect(fixture.debugElement.query(By.css('[data-testid="category-display-mode"]'))).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // 7. c-category--edit-mode
  // -------------------------------------------------------------------------

  describe('7. c-category--edit-mode', () => {
    // Helper: enter edit mode via toolbox stub emit (freeView only)
    async function setupAsFreeViewInEditMode(options = {}) {
      const result = await setup({ user: null, linkData: null, mode: 'view', ...options });
      const stub = result.fixture.debugElement.query(By.css('[data-testid="category-toolbox"]'))
        .componentInstance as CategoryToolboxStubComponent;
      stub.toggleEditMode.emit();
      result.fixture.detectChanges();
      return result;
    }

    // -----------------------------------------------------------------------
    // Group A – display condition
    // -----------------------------------------------------------------------

    it('should not render edit-mode div on initial render (isEditMode is false)', async () => {
      // Arrange & Act
      const { fixture } = await setup({ user: null, linkData: null, mode: 'view' });

      // Assert
      expect(fixture.debugElement.query(By.css('[data-testid="category-edit-mode"]'))).toBeNull();
    });

    // -----------------------------------------------------------------------
    // Group B – wil-note-markdown-editor bindings / attributes
    // -----------------------------------------------------------------------

    describe('editor bindings', () => {
      let fixture: ComponentFixture<CategoryComponent>;
      let editor: DebugElement;

      beforeEach(async () => {
        ({ fixture } = await setupAsFreeViewInEditMode());
        editor = fixture.debugElement.query(By.css('[data-testid="category-description-editor"]'));
      });

      it('should pass [maxLength]=1000 to wil-note-markdown-editor', () => {
        // Arrange & Act – done in beforeEach
        // Assert
        expect(editor.componentInstance.maxLength).toBe(1000);
      });

      it('should pass [showToolbar]=false to wil-note-markdown-editor', () => {
        expect(editor.componentInstance.showToolbar).toBe(false);
      });

      it('should pass [autoFocus]=true to wil-note-markdown-editor', () => {
        expect(editor.componentInstance.autoFocus).toBe(true);
      });

      it('should pass [showPlaceholderIcon]=false to wil-note-markdown-editor', () => {
        expect(editor.componentInstance.showPlaceholderIcon).toBe(false);
      });

      it('should pass placeholder to wil-note-markdown-editor', () => {
        expect(editor.componentInstance.placeholder).toBe('What do the 1-10 grades mean?');
      });
    });

    // -----------------------------------------------------------------------
    // Group C – name input field
    // -----------------------------------------------------------------------

    it('should pre-populate name input with category name', async () => {
      // Arrange & Act
      const { fixture } = await setupAsFreeViewInEditMode();

      // Assert
      const input = fixture.debugElement.query(By.css('[data-testid="category-name-input"]'));
      expect(input.nativeElement.value).toBe('Health');
    });

    it('should set maxlength="42" on name input', async () => {
      // Arrange & Act
      const { fixture } = await setupAsFreeViewInEditMode();

      // Assert
      const input = fixture.debugElement.query(By.css('[data-testid="category-name-input"]'));
      expect(input.nativeElement.getAttribute('maxlength')).toBe('42');
    });

    it('should apply category color to name input [style.color]', async () => {
      // Arrange & Act
      const { fixture } = await setupAsFreeViewInEditMode();

      // Assert
      const input = fixture.debugElement.query(By.css('[data-testid="category-name-input"]'));
      expect(input.nativeElement.style.color).toBe('rgb(255, 0, 0)');
    });
  });

  // -------------------------------------------------------------------------
  // 8. c-color-picker
  // -------------------------------------------------------------------------

  describe('8. c-color-picker', () => {
    // Helper: enter color picker mode via toolbox stub emit
    async function setupInColorPickerMode(options = {}) {
      const result = await setup({ user: null, linkData: null, mode: 'view', ...options });
      const stub = result.fixture.debugElement.query(By.css('[data-testid="category-toolbox"]'))
        .componentInstance as CategoryToolboxStubComponent;
      stub.toggleColorPicker.emit();
      result.fixture.detectChanges();
      return result;
    }

    // -----------------------------------------------------------------------
    // Group A – display condition
    // -----------------------------------------------------------------------

    it('should NOT render color picker on initial render (isColorEditMode is false)', async () => {
      // Arrange & Act
      const { fixture } = await setup({ user: null, linkData: null, mode: 'view' });

      // Assert
      expect(fixture.debugElement.query(By.css('[data-testid="category-color-picker"]'))).toBeNull();
    });

    it('should render color picker after toggleColorPicker emit', async () => {
      // Arrange & Act
      const { fixture } = await setupInColorPickerMode();

      // Assert
      expect(fixture.debugElement.query(By.css('[data-testid="category-color-picker"]'))).not.toBeNull();
    });

    // -----------------------------------------------------------------------
    // Group B – color-chrome binding
    // -----------------------------------------------------------------------

    it('should render color-chrome and pass [color] from category input', async () => {
      // Arrange & Act
      const { fixture } = await setupInColorPickerMode();

      // Assert
      const chrome = fixture.debugElement.query(By.css('[data-testid="category-color-chrome"]'));
      expect(chrome).not.toBeNull();
      expect(chrome.componentInstance.color).toBe('#ff0000');
    });

    // -----------------------------------------------------------------------
    // Group C – close button
    // -----------------------------------------------------------------------

    it('should hide color picker when close button is clicked', async () => {
      // Arrange
      const { fixture } = await setupInColorPickerMode();
      const closeBtn = fixture.debugElement.query(By.css('[data-testid="category-color-picker-close"]'));

      // Act
      closeBtn.nativeElement.click();
      fixture.detectChanges();

      // Assert
      expect(fixture.debugElement.query(By.css('[data-testid="category-color-picker"]'))).toBeNull();
    });

    it('should dispatch editFreePlanCategory with initial color when close button is clicked (freeView)', async () => {
      // Arrange
      const { fixture, mockStore } = await setupInColorPickerMode();
      spyOn(mockStore, 'dispatch').and.callThrough();
      const closeBtn = fixture.debugElement.query(By.css('[data-testid="category-color-picker-close"]'));

      // Act
      closeBtn.nativeElement.click();
      fixture.detectChanges();

      // Assert – initial catColor comes from category().color set in ngOnInit
      expect(mockStore.dispatch).toHaveBeenCalledWith(
        jasmine.objectContaining({
          type: editFreePlanCategory.type,
          category: jasmine.objectContaining({ color: '#ff0000' }),
        })
      );
    });

    // -----------------------------------------------------------------------
    // Group D – color update via onChangeComplete
    // -----------------------------------------------------------------------

    it('should dispatch with updated color after onChangeComplete then close', async () => {
      // Arrange
      const { fixture, mockStore } = await setupInColorPickerMode();
      spyOn(mockStore, 'dispatch').and.callThrough();
      const chrome = fixture.debugElement.query(By.css('[data-testid="category-color-chrome"]'));

      // Act – simulate color selection then close
      chrome.componentInstance.onChangeComplete.emit({ color: { hex: '#00ff00' } });
      fixture.detectChanges();
      fixture.debugElement.query(By.css('[data-testid="category-color-picker-close"]')).nativeElement.click();
      fixture.detectChanges();

      // Assert – dispatched action contains the newly selected color
      expect(mockStore.dispatch).toHaveBeenCalledWith(
        jasmine.objectContaining({
          type: editFreePlanCategory.type,
          category: jasmine.objectContaining({ color: '#00ff00' }),
        })
      );
    });

    // -----------------------------------------------------------------------
    // Group E – toggle off
    // -----------------------------------------------------------------------

    it('should hide color picker when toggleColorPicker is emitted a second time', async () => {
      // Arrange – first emit already done inside setupInColorPickerMode
      const { fixture } = await setupInColorPickerMode();
      const stub = fixture.debugElement.query(By.css('[data-testid="category-toolbox"]')).componentInstance as CategoryToolboxStubComponent;

      // Act – second emit toggles isColorEditMode back to false
      stub.toggleColorPicker.emit();
      fixture.detectChanges();

      // Assert
      expect(fixture.debugElement.query(By.css('[data-testid="category-color-picker"]'))).toBeNull();
    });
  });

  describe('9. Fragile regression coverage', () => {
    it('should keep editing closed and not emit editingOpened on mobile width', async () => {
      // Arrange
      const { fixture } = await setup({ user: null, linkData: null, mode: 'view' });
      spyOnProperty(window, 'innerWidth', 'get').and.returnValue(767);
      spyOn(fixture.componentInstance.editingOpened, 'emit');
      const stub = fixture.debugElement.query(By.css('[data-testid="category-toolbox"]')).componentInstance as CategoryToolboxStubComponent;

      // Act
      stub.toggleEditMode.emit();
      fixture.detectChanges();

      // Assert
      expect(fixture.debugElement.query(By.css('[data-testid="category-display-mode"]'))).not.toBeNull();
      expect(fixture.debugElement.query(By.css('[data-testid="category-edit-mode"]'))).toBeNull();
      expect(fixture.componentInstance.editingOpened.emit).not.toHaveBeenCalled();
    });

    it('should react when derived view context changes from paid view to paid edit mode', async () => {
      // Arrange
      const { fixture, mockStore } = await setup({ user: mockUser, linkData: null, mode: 'view' });
      const modeSelector = mockStore.overrideSelector(selectMode, 'view');
      const toolbox = fixture.debugElement.query(By.css('[data-testid="category-toolbox"]'));

      expect(toolbox.nativeElement.classList).toContain('hide');

      // Act
      modeSelector.setResult('edit');
      mockStore.refreshState();
      fixture.detectChanges();

      // Assert
      expect(toolbox.nativeElement.classList).not.toContain('hide');
    });

    it('should react when derived view context changes from free view to participant view', async () => {
      // Arrange
      const { fixture, mockStore } = await setup({ user: null, linkData: null, mode: 'view' });
      const userSelector = mockStore.overrideSelector(selectUser, null);
      const linkDataSelector = mockStore.overrideSelector(selectLinkData, null);
      const toolbox = fixture.debugElement.query(By.css('[data-testid="category-toolbox"]'));

      expect(toolbox.nativeElement.classList).not.toContain('hide');
      expect(fixture.componentInstance.noColumnGap()).toBeFalse();

      // Act
      userSelector.setResult(null);
      linkDataSelector.setResult(mockLinkData);
      mockStore.refreshState();
      fixture.detectChanges();

      // Assert
      expect(toolbox.nativeElement.classList).toContain('hide');
      expect(fixture.componentInstance.noColumnGap()).toBeTrue();
    });

    it('should dispatch editCategory with form values and signal color in paid edit mode', async () => {
      // Arrange
      const { fixture, mockStore } = await setup({ user: mockUser, linkData: null, mode: 'edit' });
      spyOn(mockStore, 'dispatch').and.callThrough();
      fixture.componentInstance.categoryForm.controls.name.setValue('Career');
      fixture.componentInstance.categoryForm.controls.description.setValue('Updated description');
      fixture.componentInstance.updateColor({ color: { hex: '#123456' } });

      // Act
      fixture.componentInstance.updateData();

      // Assert
      expect(mockStore.dispatch).toHaveBeenCalledWith(
        editCategory({
          categoryId: 'cat-1',
          label: 'Career',
          description: 'Updated description',
          color: '#123456',
        })
      );
    });

    it('should dispatch deleteFreePlanCategory after confirmed delete in free view', async () => {
      // Arrange
      const { fixture, mockStore } = await setup({ user: null, linkData: null, mode: 'view', dialogResult: true });
      spyOn(mockStore, 'dispatch').and.callThrough();

      // Act
      fixture.componentInstance.alert();
      fixture.detectChanges();

      // Assert
      expect(mockStore.dispatch).toHaveBeenCalledWith(deleteFreePlanCategory({ id: 'cat-1' }));
    });

    it('should dispatch deleteCategory after confirmed delete outside free view', async () => {
      // Arrange
      const { fixture, mockStore } = await setup({ user: mockUser, linkData: null, mode: 'edit', dialogResult: true });
      spyOn(mockStore, 'dispatch').and.callThrough();

      // Act
      fixture.componentInstance.alert();
      fixture.detectChanges();

      // Assert
      expect(mockStore.dispatch).toHaveBeenCalledWith(deleteCategory({ id: 'cat-1' }));
    });

    it('should keep signal-backed color picker state in sync with toolbox and dispatch', async () => {
      // Arrange
      const { fixture, mockStore } = await setup({ user: null, linkData: null, mode: 'view' });
      spyOn(mockStore, 'dispatch').and.callThrough();
      const stub = fixture.debugElement.query(By.css('[data-testid="category-toolbox"]')).componentInstance as CategoryToolboxStubComponent;

      // Act
      stub.toggleColorPicker.emit();
      fixture.detectChanges();
      fixture.debugElement.query(By.css('[data-testid="category-color-chrome"]')).componentInstance.onChangeComplete.emit({
        color: { hex: '#abcdef' },
      });
      fixture.debugElement.query(By.css('[data-testid="category-color-picker-close"]')).nativeElement.click();
      fixture.detectChanges();

      // Assert
      expect(fixture.debugElement.query(By.css('[data-testid="category-color-picker"]'))).toBeNull();
      expect(mockStore.dispatch).toHaveBeenCalledWith(
        jasmine.objectContaining({
          type: editFreePlanCategory.type,
          category: jasmine.objectContaining({ color: '#abcdef' }),
        })
      );
    });
  });
});
