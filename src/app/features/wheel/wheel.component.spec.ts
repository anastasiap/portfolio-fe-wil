import { Component, Directive, EventEmitter, Input, input, Output } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TranslateModule } from '@ngx-translate/core';

import { WheelComponent } from './wheel.component';
import {
  initializeWheel,
  loadDefaultTemplate,
  selectCategories,
  selectHasAllScores,
  selectHasUnsavedCategoriesChanges,
  selectLang,
  selectMode,
  selectUserWheels,
  setActiveWheel,
} from '../../state';

// ---------------------------------------------------------------------------
// Stubs
// ---------------------------------------------------------------------------

// Stubs FlexLayout directives so input values can be read directly in tests
@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: '[fxLayout],[fxLayoutAlign],[fxLayoutGap],[fxFlex],[fxFlex.xs],[fxFlex.sm],[fxFlex.md],[fxFlex.lg],[fxFlex.gt-lg],[fxFlex.xl]',
  standalone: true,
})
class FlexLayoutStubDirective {
  @Input('fxLayout') layout?: string;
  @Input('fxLayoutAlign') layoutAlign?: string;
  @Input('fxLayoutGap') layoutGap?: string;
  @Input('fxFlex') flex?: string;
  @Input('fxFlex.xs') flexXs?: string;
  @Input('fxFlex.sm') flexSm?: string;
  @Input('fxFlex.md') flexMd?: string;
  @Input('fxFlex.lg') flexLg?: string;
  @Input('fxFlex.gt-lg') flexGtLg?: string;
  @Input('fxFlex.xl') flexXl?: string;
}

@Component({ selector: 'wil-canvas', standalone: true, template: '' })
class CanvasStubComponent {
  public readonly allowClick = input<boolean>(true);
}

@Component({ selector: 'wil-category', standalone: true, template: '' })
class CategoryStubComponent {
  @Input() wheelId?: string;
  @Input() category?: unknown;
  @Input() hasEditingOpen?: boolean;
  @Output() editingOpened = new EventEmitter<boolean>();
}

@Component({ selector: 'wil-action-buttons', standalone: true, template: '' })
class ActionButtonsStubComponent {
  @Input() wheelId?: string;
  @Input() type?: string;
  @Input() showAddCategoryButton?: boolean;
  @Input() showResetMarksButton?: boolean;
  @Input() showDropChangesButton?: boolean;
  @Input() showDownloadButton?: boolean;
  @Input() showSaveCategoriesButton?: boolean;
  @Input() showSaveResultsButton?: boolean;
  @Input() showFocusButton?: boolean;
  @Input() showSendButton?: boolean;
  @Input() showEditWheelButton?: boolean;
  @Input() showAddWheelButton?: boolean;
  @Input() showAddDefaultWheelButton?: boolean;
  @Input() showDeleteWheelButton?: boolean;
  @Input() showSaveWheelButton?: boolean;
  @Input() showCancelEditsWheelButton?: boolean;
  @Input() disableSaveWheelButton?: boolean;
  @Output() saveWheel = new EventEmitter<void>();
}

@Component({ selector: 'wil-focus', standalone: true, template: '' })
class FocusStubComponent {}

@Component({ selector: 'wil-wheel-name-form', standalone: true, template: '' })
class WheelNameFormStubComponent {
  @Input() wheelName?: string;
  @Output() nameChanged = new EventEmitter<{ name: string; hasError: boolean }>();
}

@Component({ selector: 'wil-reflection-prompt', standalone: true, template: '' })
class ReflectionPromptStubComponent {
  @Input() isVisible?: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface SetupOptions {
  mode?: string;
  showCategories?: boolean;
  allowClick?: boolean;
  type?: 'noAuth' | 'free' | 'personal' | 'professional';
  wheelId?: string;
  session?: WheelSessionOutputDto | null;
  lang?: string;
  userWheels?: WheelVersionOutputDto[];
  spyOnDispatch?: boolean;
}

async function setup(
  options: SetupOptions = {}
): Promise<{ fixture: ComponentFixture<WheelComponent>; mockStore: MockStore; dispatchSpy?: jasmine.Spy }> {
  const {
    mode = 'view',
    showCategories = true,
    allowClick = true,
    type = 'noAuth',
    wheelId,
    session = null,
    lang = 'en',
    userWheels = [],
    spyOnDispatch = false,
  } = options;

  await TestBed.configureTestingModule({
    imports: [WheelComponent, NoopAnimationsModule, RouterTestingModule, HttpClientTestingModule, TranslateModule.forRoot()],
    providers: [
      provideMockStore({
        selectors: [
          { selector: selectMode, value: mode },
          { selector: selectCategories, value: [] },
          { selector: selectHasAllScores, value: false },
          { selector: selectHasUnsavedCategoriesChanges, value: false },
          { selector: selectLang, value: lang },
          { selector: selectUserWheels, value: userWheels },
        ],
      }),
    ],
  })
    .overrideComponent(WheelComponent, {
      set: {
        imports: [
          CommonModule,
          ReactiveFormsModule,
          FlexLayoutStubDirective,
          CanvasStubComponent,
          CategoryStubComponent,
          ActionButtonsStubComponent,
          FocusStubComponent,
          WheelNameFormStubComponent,
          ReflectionPromptStubComponent,
        ],
      },
    })
    .compileComponents();

  const mockStore = TestBed.inject(MockStore);
  const fixture = TestBed.createComponent(WheelComponent);
  const dispatchSpy = spyOnDispatch ? spyOn(mockStore, 'dispatch').and.callThrough() : undefined;

  if (wheelId) {
    fixture.componentRef.setInput('wheelId', wheelId);
  }

  fixture.componentRef.setInput('type', type);
  fixture.componentRef.setInput('session', session);
  fixture.componentRef.setInput('showCategories', showCategories);
  fixture.componentRef.setInput('allowClick', allowClick);
  fixture.detectChanges();

  return { fixture, mockStore, dispatchSpy };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('WheelComponent – active wheel initialization', () => {
  const selectedWheel = {
    id: 'wheel-2',
    name: 'Selected wheel',
    isDefault: false,
    focusIds: ['cat-2'],
    categorySnapshots: [
      {
        categoryId: 'cat-1',
        label: 'Health',
        description: 'Health description',
        color: '#f00',
      },
      {
        categoryId: 'cat-2',
        label: 'Career',
        description: 'Career description',
        color: '#0f0',
      },
    ],
  } as WheelVersionOutputDto;

  const otherWheel = {
    wheelId: 'wheel-1',
    accountId: 'account-1',
    id: 'wheel-1',
    name: 'Other wheel',
    isDefault: true,
    focusIds: [],
    categorySnapshots: [],
    version: 2,
    isDeleted: false,
    createdAt: '01-01-2023',
    updatedAt: '02-01-2023',
  } as WheelVersionOutputDto;

  it('should initialize the localized default wheel and load its template when type is "noAuth"', async () => {
    // Arrange
    const defaultWheelId = '000000000000000000002000';

    // Act
    const { dispatchSpy } = await setup({ type: 'noAuth', lang: 'ru', spyOnDispatch: true });

    // Assert
    expect(dispatchSpy!).toHaveBeenCalledWith(initializeWheel({ wheelId: defaultWheelId }));
    expect(dispatchSpy!).toHaveBeenCalledWith(loadDefaultTemplate({ wheelId: defaultWheelId }));
    expect(dispatchSpy!).not.toHaveBeenCalledWith(jasmine.objectContaining({ type: setActiveWheel.type }));
  });

  it('should set the active wheel from user wheels when type is "personal"', async () => {
    // Arrange & Act
    const { fixture, dispatchSpy } = await setup({
      type: 'personal',
      mode: 'edit',
      wheelId: selectedWheel.id,
      userWheels: [otherWheel, selectedWheel],
      spyOnDispatch: true,
    });

    // Assert
    expect(dispatchSpy!).toHaveBeenCalledWith(
      jasmine.objectContaining({
        type: setActiveWheel.type,
        wheel: jasmine.objectContaining({
          id: selectedWheel.id,
          name: selectedWheel.name,
          focus: ['cat-2'],
          categories: jasmine.arrayContaining([
            jasmine.objectContaining({
              id: 'cat-1',
              name: 'Health',
              score: 0,
            }),
            jasmine.objectContaining({
              id: 'cat-2',
              name: 'Career',
              score: 0,
            }),
          ]),
        }),
      })
    );
    expect(dispatchSpy!).not.toHaveBeenCalledWith(jasmine.objectContaining({ type: initializeWheel.type }));
    expect(dispatchSpy!).not.toHaveBeenCalledWith(jasmine.objectContaining({ type: loadDefaultTemplate.type }));

    const nameForm = fixture.debugElement.query(By.css('[data-testid="wheel-component-name-form"]'));
    expect((nameForm.componentInstance as WheelNameFormStubComponent).wheelName).toBe('Selected wheel');
  });

  it('should set the active wheel from user wheels when type is "free"', async () => {
    // Arrange & Act
    const { dispatchSpy } = await setup({
      type: 'free',
      wheelId: selectedWheel.id,
      userWheels: [selectedWheel],
      spyOnDispatch: true,
    });

    // Assert
    expect(dispatchSpy!).toHaveBeenCalledWith(
      jasmine.objectContaining({
        type: setActiveWheel.type,
        wheel: jasmine.objectContaining({
          id: selectedWheel.id,
          name: selectedWheel.name,
        }),
      })
    );
  });

  it('should use submitted session scores and focus when setting the active wheel', async () => {
    // Arrange
    const session = {
      scores: [{ categoryId: 'cat-1', value: 8 }],
      focusAtSubmit: ['cat-1'],
    } as WheelSessionOutputDto;

    // Act
    const { dispatchSpy } = await setup({
      type: 'professional',
      wheelId: selectedWheel.id,
      session,
      userWheels: [selectedWheel],
      spyOnDispatch: true,
    });

    // Assert
    expect(dispatchSpy!).toHaveBeenCalledWith(
      jasmine.objectContaining({
        type: setActiveWheel.type,
        wheel: jasmine.objectContaining({
          focus: ['cat-1'],
          categories: jasmine.arrayContaining([
            jasmine.objectContaining({
              id: 'cat-1',
              score: 8,
            }),
            jasmine.objectContaining({
              id: 'cat-2',
              score: 0,
            }),
          ]),
        }),
      })
    );
  });

  it('should not dispatch an active wheel when type is authenticated but no matching wheel exists', async () => {
    // Arrange & Act
    const { dispatchSpy } = await setup({
      type: 'personal',
      wheelId: 'missing-wheel',
      userWheels: [selectedWheel],
      spyOnDispatch: true,
    });

    // Assert
    expect(dispatchSpy!).not.toHaveBeenCalled();
  });
});

describe('WheelComponent – wheel-section and canvas', () => {
  describe('wheel-section element', () => {
    let fixture: ComponentFixture<WheelComponent>;

    beforeEach(async () => {
      ({ fixture } = await setup());
    });

    it('should render the wheel-section element', () => {
      // Arrange & Act — detectChanges already called in setup
      const el = fixture.debugElement.query(By.css('[data-testid="wheel-component-wheel-section"]'));

      // Assert
      expect(el).toBeTruthy();
    });
  });

  describe('showCategories = true', () => {
    let fixture: ComponentFixture<WheelComponent>;

    beforeEach(async () => {
      ({ fixture } = await setup({ showCategories: true }));
    });

    it('should render the categories-section when showCategories is true', () => {
      // Arrange & Act — detectChanges already called in setup
      const el = fixture.debugElement.query(By.css('[data-testid="wheel-component-categories-section"]'));

      // Assert
      expect(el).toBeTruthy();
    });

    it('should bind fxFlex.lg to "48%" on wheel-section when showCategories is true', () => {
      // Arrange & Act — detectChanges already called in setup
      const wheelSection = fixture.debugElement.query(By.css('[data-testid="wheel-component-wheel-section"]'));
      const flexStub = wheelSection.injector.get(FlexLayoutStubDirective);

      // Assert
      expect(flexStub.flexLg).toBe('48%');
    });

    it('should bind fxFlex.gt-lg to "48%" on wheel-section when showCategories is true', () => {
      // Arrange & Act — detectChanges already called in setup
      const wheelSection = fixture.debugElement.query(By.css('[data-testid="wheel-component-wheel-section"]'));
      const flexStub = wheelSection.injector.get(FlexLayoutStubDirective);

      // Assert
      expect(flexStub.flexGtLg).toBe('48%');
    });
  });

  describe('showCategories = false', () => {
    let fixture: ComponentFixture<WheelComponent>;

    beforeEach(async () => {
      ({ fixture } = await setup({ showCategories: false }));
    });

    it('should not render the categories-section when showCategories is false', () => {
      // Arrange & Act — detectChanges already called in setup
      const el = fixture.debugElement.query(By.css('[data-testid="wheel-component-categories-section"]'));

      // Assert
      expect(el).toBeNull();
    });

    it('should bind fxFlex.lg to "100%" on wheel-section when showCategories is false', () => {
      // Arrange & Act — detectChanges already called in setup
      const wheelSection = fixture.debugElement.query(By.css('[data-testid="wheel-component-wheel-section"]'));
      const flexStub = wheelSection.injector.get(FlexLayoutStubDirective);

      // Assert
      expect(flexStub.flexLg).toBe('100%');
    });

    it('should bind fxFlex.gt-lg to "100%" on wheel-section when showCategories is false', () => {
      // Arrange & Act — detectChanges already called in setup
      const wheelSection = fixture.debugElement.query(By.css('[data-testid="wheel-component-wheel-section"]'));
      const flexStub = wheelSection.injector.get(FlexLayoutStubDirective);

      // Assert
      expect(flexStub.flexGtLg).toBe('100%');
    });
  });

  describe('wil-canvas [allowClick] binding', () => {
    describe('mode=view and allowClick input=true', () => {
      let fixture: ComponentFixture<WheelComponent>;

      beforeEach(async () => {
        ({ fixture } = await setup({ mode: 'view', allowClick: true }));
      });

      it('should pass allowClick=true to wil-canvas', () => {
        // Arrange & Act — detectChanges already called in setup
        const canvasEl = fixture.debugElement.query(By.css('[data-testid="wheel-component-canvas"]'));

        // Assert
        expect(canvasEl.componentInstance.allowClick()).toBeTrue();
      });
    });

    describe('mode=edit and allowClick input=true', () => {
      let fixture: ComponentFixture<WheelComponent>;

      beforeEach(async () => {
        ({ fixture } = await setup({ mode: 'edit', allowClick: true }));
      });

      it('should pass allowClick=false to wil-canvas when mode is edit', () => {
        // Arrange & Act — detectChanges already called in setup
        const canvasEl = fixture.debugElement.query(By.css('[data-testid="wheel-component-canvas"]'));

        // Assert
        expect(canvasEl.componentInstance.allowClick()).toBeFalse();
      });
    });

    describe('mode=view and allowClick input=false', () => {
      let fixture: ComponentFixture<WheelComponent>;

      beforeEach(async () => {
        ({ fixture } = await setup({ mode: 'view', allowClick: false }));
      });

      it('should pass allowClick=false to wil-canvas when allowClick input is false', () => {
        // Arrange & Act — detectChanges already called in setup
        const canvasEl = fixture.debugElement.query(By.css('[data-testid="wheel-component-canvas"]'));

        // Assert
        expect(canvasEl.componentInstance.allowClick()).toBeFalse();
      });
    });
  });
});

// ---------------------------------------------------------------------------
// wil-wheel-name-form tests
// ---------------------------------------------------------------------------

describe('WheelComponent', () => {
  async function setupNameForm(options: {
    type: 'noAuth' | 'free' | 'personal' | 'professional';
    mode?: string;
  }): Promise<{ fixture: ComponentFixture<WheelComponent>; mockStore: MockStore }> {
    const { type, mode = 'edit' } = options;

    await TestBed.configureTestingModule({
      imports: [WheelComponent, NoopAnimationsModule, RouterTestingModule, HttpClientTestingModule, TranslateModule.forRoot()],
      providers: [
        provideMockStore({
          selectors: [
            { selector: selectMode, value: mode },
            { selector: selectCategories, value: [] },
            { selector: selectHasAllScores, value: false },
            { selector: selectHasUnsavedCategoriesChanges, value: false },
            { selector: selectLang, value: 'en' },
            { selector: selectUserWheels, value: [] },
          ],
        }),
      ],
    })
      .overrideComponent(WheelComponent, {
        set: {
          imports: [
            CommonModule,
            ReactiveFormsModule,
            FlexLayoutStubDirective,
            CanvasStubComponent,
            CategoryStubComponent,
            ActionButtonsStubComponent,
            FocusStubComponent,
            WheelNameFormStubComponent,
            ReflectionPromptStubComponent,
          ],
        },
      })
      .compileComponents();

    const mockStore = TestBed.inject(MockStore);
    const fixture = TestBed.createComponent(WheelComponent);
    fixture.componentRef.setInput('type', type);
    fixture.componentRef.setInput('showCategories', true);
    fixture.detectChanges();

    return { fixture, mockStore };
  }

  describe('wil-wheel-name-form', () => {
    describe('conditional rendering', () => {
      it('should NOT render when type is "noAuth" and mode is "edit"', async () => {
        // Arrange
        const { fixture } = await setupNameForm({ type: 'noAuth', mode: 'edit' });

        // Act
        const el = fixture.debugElement.query(By.css('[data-testid="wheel-component-name-form"]'));

        // Assert
        expect(el).toBeNull();
      });

      it('should NOT render when type is "personal" and mode is "view"', async () => {
        // Arrange
        const { fixture } = await setupNameForm({ type: 'personal', mode: 'view' });

        // Act
        const el = fixture.debugElement.query(By.css('[data-testid="wheel-component-name-form"]'));

        // Assert
        expect(el).toBeNull();
      });

      it('should render when type is "free" and mode is "edit"', async () => {
        // Arrange
        const { fixture } = await setupNameForm({ type: 'free', mode: 'edit' });

        // Act
        const el = fixture.debugElement.query(By.css('[data-testid="wheel-component-name-form"]'));

        // Assert
        expect(el).toBeTruthy();
      });

      it('should render when type is "personal" and mode is "edit"', async () => {
        // Arrange
        const { fixture } = await setupNameForm({ type: 'personal', mode: 'edit' });

        // Act
        const el = fixture.debugElement.query(By.css('[data-testid="wheel-component-name-form"]'));

        // Assert
        expect(el).toBeTruthy();
      });

      it('should render when type is "professional" and mode is "edit"', async () => {
        // Arrange
        const { fixture } = await setupNameForm({ type: 'professional', mode: 'edit' });

        // Act
        const el = fixture.debugElement.query(By.css('[data-testid="wheel-component-name-form"]'));

        // Assert
        expect(el).toBeTruthy();
      });
    });

    describe('[wheelName] input binding', () => {
      it('should bind the current name() signal value to [wheelName]', async () => {
        // Arrange
        const { fixture } = await setupNameForm({ type: 'personal', mode: 'edit' });
        const component = fixture.componentInstance;
        component.name.set('My Wheel');
        fixture.detectChanges();

        // Act
        const stubEl = fixture.debugElement.query(By.css('[data-testid="wheel-component-name-form"]'));
        const stub = stubEl.componentInstance as WheelNameFormStubComponent;

        // Assert
        expect(stub.wheelName).toBe('My Wheel');
      });
    });

    describe('(nameChanged) output', () => {
      it('should update name() when the stub emits nameChanged with hasError=false', async () => {
        // Arrange
        const { fixture } = await setupNameForm({ type: 'personal', mode: 'edit' });
        const component = fixture.componentInstance;
        const stubEl = fixture.debugElement.query(By.css('[data-testid="wheel-component-name-form"]'));
        const stub = stubEl.componentInstance as WheelNameFormStubComponent;

        // Act
        stub.nameChanged.emit({ name: 'New Name', hasError: false });
        fixture.detectChanges();

        // Assert
        expect(component.name()).toBe('New Name');
        expect(component.disableSaveWheelButton()).toBeFalse();
      });

      it('should set disableSaveWheelButton to true when the stub emits nameChanged with hasError=true', async () => {
        // Arrange
        const { fixture } = await setupNameForm({ type: 'personal', mode: 'edit' });
        const component = fixture.componentInstance;
        const stubEl = fixture.debugElement.query(By.css('[data-testid="wheel-component-name-form"]'));
        const stub = stubEl.componentInstance as WheelNameFormStubComponent;

        // Act
        stub.nameChanged.emit({ name: 'X', hasError: true });
        fixture.detectChanges();

        // Assert
        expect(component.disableSaveWheelButton()).toBeTrue();
      });
    });
  });

  describe('wil-focus', () => {
    describe('conditional rendering', () => {
      it('should NOT render when type is "noAuth" and mode is "view"', async () => {
        // Arrange
        const { fixture } = await setupNameForm({ type: 'noAuth', mode: 'view' });

        // Act
        const el = fixture.debugElement.query(By.css('wil-focus'));

        // Assert
        expect(el).toBeNull();
      });

      it('should NOT render when type is "personal" and mode is "edit"', async () => {
        // Arrange
        const { fixture } = await setupNameForm({ type: 'personal', mode: 'edit' });

        // Act
        const el = fixture.debugElement.query(By.css('wil-focus'));

        // Assert
        expect(el).toBeNull();
      });

      it('should render when type is "free" and mode is "view"', async () => {
        // Arrange
        const { fixture } = await setupNameForm({ type: 'free', mode: 'view' });

        // Act
        const el = fixture.debugElement.query(By.css('wil-focus'));

        // Assert
        expect(el).toBeTruthy();
      });

      it('should render when type is "personal" and mode is "view"', async () => {
        // Arrange
        const { fixture } = await setupNameForm({ type: 'personal', mode: 'view' });

        // Act
        const el = fixture.debugElement.query(By.css('wil-focus'));

        // Assert
        expect(el).toBeTruthy();
      });

      it('should render when type is "professional" and mode is "view"', async () => {
        // Arrange
        const { fixture } = await setupNameForm({ type: 'professional', mode: 'view' });

        // Act
        const el = fixture.debugElement.query(By.css('wil-focus'));

        // Assert
        expect(el).toBeTruthy();
      });
    });
  });
});

// ---------------------------------------------------------------------------
// wil-category rendering tests
// ---------------------------------------------------------------------------

describe('WheelComponent – wil-category rendering', () => {
  const mockCategories = [
    { id: 'cat-1', name: 'Health', color: '#f00', description: '', order: 0, score: 5 },
    { id: 'cat-2', name: 'Career', color: '#0f0', description: '', order: 1, score: 3 },
    { id: 'cat-3', name: 'Family', color: '#00f', description: '', order: 2, score: 7 },
    { id: 'cat-4', name: 'Finance', color: '#ff0', description: '', order: 3, score: 6 },
  ];

  it('renders one wil-category element per category when categories list is non-empty', async () => {
    // Arrange
    const { fixture, mockStore } = await setup({ showCategories: true });
    mockStore.overrideSelector(selectCategories, mockCategories as never);
    mockStore.refreshState();

    // Act
    fixture.detectChanges();
    const stubs = fixture.debugElement.queryAll(By.directive(CategoryStubComponent));

    // Assert
    expect(stubs.length).toBe(mockCategories.length);
  });

  it('renders no wil-category elements when categories list is empty', async () => {
    // Arrange
    const { fixture } = await setup({ showCategories: true });
    // selectCategories defaults to [] in setup

    // Act
    const stubs = fixture.debugElement.queryAll(By.directive(CategoryStubComponent));

    // Assert
    expect(stubs.length).toBe(0);
  });

  it('passes [wheelId] down to every wil-category', async () => {
    // Arrange
    const { fixture, mockStore } = await setup({ showCategories: true });
    mockStore.overrideSelector(selectCategories, mockCategories as never);
    mockStore.refreshState();
    fixture.detectChanges();

    // Act
    const stubs = fixture.debugElement.queryAll(By.directive(CategoryStubComponent));

    // Assert
    stubs.forEach((el) => {
      expect((el.componentInstance as CategoryStubComponent).wheelId).toBe(fixture.componentInstance.wheelId());
    });
  });

  it('passes each [category] object to the corresponding wil-category', async () => {
    // Arrange
    const { fixture, mockStore } = await setup({ showCategories: true });
    mockStore.overrideSelector(selectCategories, mockCategories as never);
    mockStore.refreshState();
    fixture.detectChanges();

    // Act
    const stubs = fixture.debugElement.queryAll(By.directive(CategoryStubComponent));
    const passedIds = stubs.map((el) => ((el.componentInstance as CategoryStubComponent).category as { id: string }).id);

    // Assert
    mockCategories.forEach((cat) => expect(passedIds).toContain(cat.id));
  });

  it('passes [hasEditingOpen]=false by default to every wil-category', async () => {
    // Arrange
    const { fixture, mockStore } = await setup({ showCategories: true });
    mockStore.overrideSelector(selectCategories, mockCategories as never);
    mockStore.refreshState();
    fixture.detectChanges();

    // Act
    const stubs = fixture.debugElement.queryAll(By.directive(CategoryStubComponent));

    // Assert
    stubs.forEach((el) => {
      expect((el.componentInstance as CategoryStubComponent).hasEditingOpen).toBeFalse();
    });
  });

  it('passes [hasEditingOpen]=true to every wil-category after signal is set to true', async () => {
    // Arrange
    const { fixture, mockStore } = await setup({ showCategories: true });
    mockStore.overrideSelector(selectCategories, mockCategories as never);
    mockStore.refreshState();
    fixture.detectChanges();
    fixture.componentInstance.hasEditingOpen.set(true);

    // Act
    fixture.detectChanges();
    const stubs = fixture.debugElement.queryAll(By.directive(CategoryStubComponent));

    // Assert
    stubs.forEach((el) => {
      expect((el.componentInstance as CategoryStubComponent).hasEditingOpen).toBeTrue();
    });
  });

  it('updates hasEditingOpen signal to true when a wil-category emits editingOpened=true', async () => {
    // Arrange
    const { fixture, mockStore } = await setup({ showCategories: true });
    mockStore.overrideSelector(selectCategories, mockCategories as never);
    mockStore.refreshState();
    fixture.detectChanges();
    const stubs = fixture.debugElement.queryAll(By.directive(CategoryStubComponent));

    // Act
    (stubs[0].componentInstance as CategoryStubComponent).editingOpened.emit(true);
    fixture.detectChanges();

    // Assert
    expect(fixture.componentInstance.hasEditingOpen()).toBeTrue();
  });

  it('updates hasEditingOpen signal to false when a wil-category emits editingOpened=false', async () => {
    // Arrange
    const { fixture, mockStore } = await setup({ showCategories: true });
    mockStore.overrideSelector(selectCategories, mockCategories as never);
    mockStore.refreshState();
    fixture.detectChanges();
    fixture.componentInstance.hasEditingOpen.set(true);
    fixture.detectChanges();
    const stubs = fixture.debugElement.queryAll(By.directive(CategoryStubComponent));

    // Act
    (stubs[0].componentInstance as CategoryStubComponent).editingOpened.emit(false);
    fixture.detectChanges();

    // Assert
    expect(fixture.componentInstance.hasEditingOpen()).toBeFalse();
  });
});

// ---------------------------------------------------------------------------
// wil-reflection-prompt tests
// ---------------------------------------------------------------------------

describe('WheelComponent – wil-reflection-prompt', () => {
  describe('conditional rendering – outer guard (allowClick)', () => {
    it('should NOT render when allowClick is false, even for type "personal"', async () => {
      // Arrange
      const { fixture } = await setup({ allowClick: false });
      fixture.componentRef.setInput('type', 'personal');

      // Act
      fixture.detectChanges();
      const el = fixture.debugElement.query(By.css('[data-testid="wheel-reflection-prompt"]'));

      // Assert
      expect(el).toBeNull();
    });
  });

  describe('conditional rendering – inner guard (type)', () => {
    it('should NOT render for type "noAuth"', async () => {
      // Arrange
      const { fixture } = await setup();
      // type is already 'noAuth' from setup default

      // Act
      fixture.detectChanges();
      const el = fixture.debugElement.query(By.css('[data-testid="wheel-reflection-prompt"]'));

      // Assert
      expect(el).toBeNull();
    });

    it('should NOT render for type "professional"', async () => {
      // Arrange
      const { fixture } = await setup();
      fixture.componentRef.setInput('type', 'professional');

      // Act
      fixture.detectChanges();
      const el = fixture.debugElement.query(By.css('[data-testid="wheel-reflection-prompt"]'));

      // Assert
      expect(el).toBeNull();
    });

    it('should render for type "personal"', async () => {
      // Arrange
      const { fixture } = await setup();
      fixture.componentRef.setInput('type', 'personal');

      // Act
      fixture.detectChanges();
      const el = fixture.debugElement.query(By.css('[data-testid="wheel-reflection-prompt"]'));

      // Assert
      expect(el).toBeTruthy();
    });

    it('should render for type "free"', async () => {
      // Arrange
      const { fixture } = await setup();
      fixture.componentRef.setInput('type', 'free');

      // Act
      fixture.detectChanges();
      const el = fixture.debugElement.query(By.css('[data-testid="wheel-reflection-prompt"]'));

      // Assert
      expect(el).toBeTruthy();
    });
  });

  describe('[isVisible] input binding', () => {
    it('should bind [isVisible]=false when selectHasAllScores is false', async () => {
      // Arrange
      const { fixture } = await setup();
      fixture.componentRef.setInput('type', 'personal');

      // selectHasAllScores defaults to false in setup

      // Act
      fixture.detectChanges();
      const stub = fixture.debugElement.query(By.css('[data-testid="wheel-reflection-prompt"]'));

      // Assert
      expect((stub.componentInstance as ReflectionPromptStubComponent).isVisible).toBeFalse();
    });

    it('should bind [isVisible]=true when selectHasAllScores is true and type free', async () => {
      // Arrange
      const { fixture, mockStore } = await setup();
      fixture.componentRef.setInput('type', 'free');
      mockStore.overrideSelector(selectHasAllScores, true);
      mockStore.refreshState();

      // selectHasAllScores defaults to false in setup

      // Act
      fixture.detectChanges();
      const stub = fixture.debugElement.query(By.css('[data-testid="wheel-reflection-prompt"]'));

      // Assert
      expect((stub.componentInstance as ReflectionPromptStubComponent).isVisible).toBeTrue();
    });

    it('should bind [isVisible]=true when selectHasAllScores is true', async () => {
      // Arrange
      const { fixture, mockStore } = await setup();
      fixture.componentRef.setInput('type', 'personal');
      mockStore.overrideSelector(selectHasAllScores, true);
      mockStore.refreshState();

      // Act
      fixture.detectChanges();
      const stub = fixture.debugElement.query(By.css('[data-testid="wheel-reflection-prompt"]'));

      // Assert
      expect((stub.componentInstance as ReflectionPromptStubComponent).isVisible).toBeTrue();
    });
  });
});

// ---------------------------------------------------------------------------
// copyright notice tests
// ---------------------------------------------------------------------------

describe('WheelComponent – copyright notice', () => {
  it('should always render the copyright notice container', async () => {
    // Arrange
    const { fixture } = await setup();

    // Act
    const el = fixture.debugElement.query(By.css('[data-testid="wheel-copyright-notice-container"]'));

    // Assert
    expect(el).toBeTruthy();
  });

  it('should always render the copyright notice inner element', async () => {
    // Arrange
    const { fixture } = await setup();

    // Act
    const el = fixture.debugElement.query(By.css('[data-testid="wheel-copyright-notice"]'));

    // Assert
    expect(el).toBeTruthy();
  });

  it('should have id="print-only" on the copyright notice element', async () => {
    // Arrange
    const { fixture } = await setup();

    // Act
    const el = fixture.debugElement.query(By.css('[data-testid="wheel-copyright-notice"]'));

    // Assert
    expect(el.nativeElement.id).toBe('print-only');
  });

  it('should display the text "Created by resourcesof.life"', async () => {
    // Arrange
    const { fixture } = await setup();

    // Act
    const el = fixture.debugElement.query(By.css('[data-testid="wheel-copyright-notice"]'));

    // Assert
    expect(el.nativeElement.textContent.trim()).toBe('Created by resourcesof.life');
  });
});

// ---------------------------------------------------------------------------
// initial-hints tests
// ---------------------------------------------------------------------------

describe('WheelComponent – initial-hints', () => {
  const singleCategory = [{ id: 'cat-1', name: 'Health', color: '#f00', description: '', order: 0, score: 5 }];
  const multipleCategories = [
    { id: 'cat-1', name: 'Health', color: '#f00', description: '', order: 0, score: 5 },
    { id: 'cat-2', name: 'Career', color: '#0f0', description: '', order: 1, score: 3 },
  ];

  describe('container visibility', () => {
    it('should render the hints container when mode is "edit"', async () => {
      // Arrange
      const { fixture } = await setup({ mode: 'edit' });

      // Act
      const el = fixture.debugElement.query(By.css('[data-testid="wheel-initial-hints-container"]'));

      // Assert
      expect(el).toBeTruthy();
    });

    it('should NOT render the hints container when mode is "view"', async () => {
      // Arrange
      const { fixture } = await setup({ mode: 'view' });

      // Act
      const el = fixture.debugElement.query(By.css('[data-testid="wheel-initial-hints-container"]'));

      // Assert
      expect(el).toBeNull();
    });
  });

  describe('"Hints" heading', () => {
    it('should show the heading when categories list is empty (length < 2)', async () => {
      // Arrange – selectCategories defaults to [] in setup
      const { fixture } = await setup({ mode: 'edit' });

      // Act
      const h5 = fixture.debugElement.query(By.css('.initial-hints__title'));

      // Assert
      expect(h5).toBeTruthy();
    });

    it('should show the heading when categories.length === 1', async () => {
      // Arrange
      const { fixture, mockStore } = await setup({ mode: 'edit' });
      mockStore.overrideSelector(selectCategories, singleCategory as never);
      mockStore.refreshState();
      fixture.detectChanges();

      // Act
      const h5 = fixture.debugElement.query(By.css('.initial-hints__title'));

      // Assert
      expect(h5).toBeTruthy();
    });

    it('should show the heading when hasUnsavedWheelChanges is true even with 2+ categories', async () => {
      // Arrange
      const { fixture, mockStore } = await setup({ mode: 'edit' });
      mockStore.overrideSelector(selectCategories, multipleCategories as never);
      mockStore.overrideSelector(selectHasUnsavedCategoriesChanges, true);
      mockStore.refreshState();
      fixture.detectChanges();

      // Act
      const h5 = fixture.debugElement.query(By.css('.initial-hints__title'));

      // Assert
      expect(h5).toBeTruthy();
    });

    it('should NOT show the heading when categories.length >= 2 and no unsaved changes', async () => {
      // Arrange
      const { fixture, mockStore } = await setup({ mode: 'edit' });
      mockStore.overrideSelector(selectCategories, multipleCategories as never);
      mockStore.overrideSelector(selectHasUnsavedCategoriesChanges, false);
      mockStore.refreshState();
      fixture.detectChanges();

      // Act
      const h5 = fixture.debugElement.query(By.css('.initial-hints__title'));

      // Assert
      expect(h5).toBeNull();
    });
  });

  describe('"Update Wheel title" hint', () => {
    it('should show the hint when name() equals NEW_WHEEL_NAME (default)', async () => {
      // Arrange – name() is initialised to NEW_WHEEL_NAME in the component
      const { fixture } = await setup({ mode: 'edit' });

      // Act
      const el = fixture.debugElement.query(By.css('[data-testid="hint-update-wheel-title"]'));

      // Assert
      expect(el).toBeTruthy();
    });

    it('should NOT show the hint when name() differs from NEW_WHEEL_NAME', async () => {
      // Arrange
      const { fixture } = await setup({ mode: 'edit' });
      fixture.componentInstance.name.set('Custom Name');
      fixture.detectChanges();

      // Act
      const el = fixture.debugElement.query(By.css('[data-testid="hint-update-wheel-title"]'));

      // Assert
      expect(el).toBeNull();
    });
  });

  describe('"Add categories" hint', () => {
    it('should show the hint when categories list is empty', async () => {
      // Arrange – selectCategories defaults to [] in setup
      const { fixture } = await setup({ mode: 'edit' });

      // Act
      const el = fixture.debugElement.query(By.css('[data-testid="hint-add-categories"]'));

      // Assert
      expect(el).toBeTruthy();
    });

    it('should NOT show the hint when categories list is not empty', async () => {
      // Arrange
      const { fixture, mockStore } = await setup({ mode: 'edit' });
      mockStore.overrideSelector(selectCategories, singleCategory as never);
      mockStore.refreshState();
      fixture.detectChanges();

      // Act
      const el = fixture.debugElement.query(By.css('[data-testid="hint-add-categories"]'));

      // Assert
      expect(el).toBeNull();
    });
  });

  describe('"Hover" hint', () => {
    it('should show the hint when categories.length === 1 and hasEditingOpen is false', async () => {
      // Arrange
      const { fixture, mockStore } = await setup({ mode: 'edit' });
      mockStore.overrideSelector(selectCategories, singleCategory as never);
      mockStore.refreshState();
      fixture.detectChanges();
      fixture.componentInstance.hasEditingOpen.set(false);
      fixture.detectChanges();

      // Act
      const el = fixture.debugElement.query(By.css('[data-testid="hint-hover"]'));

      // Assert
      expect(el).toBeTruthy();
    });

    it('should NOT show the hint when hasEditingOpen is true', async () => {
      // Arrange
      const { fixture, mockStore } = await setup({ mode: 'edit' });
      mockStore.overrideSelector(selectCategories, singleCategory as never);
      mockStore.refreshState();
      fixture.detectChanges();
      fixture.componentInstance.hasEditingOpen.set(true);
      fixture.detectChanges();

      // Act
      const el = fixture.debugElement.query(By.css('[data-testid="hint-hover"]'));

      // Assert
      expect(el).toBeNull();
    });

    it('should NOT show the hint when categories.length is not 1', async () => {
      // Arrange – selectCategories defaults to [] in setup
      const { fixture } = await setup({ mode: 'edit' });

      // Act
      const el = fixture.debugElement.query(By.css('[data-testid="hint-hover"]'));

      // Assert
      expect(el).toBeNull();
    });
  });

  describe('"Confirm" hint', () => {
    it('should show the hint when hasEditingOpen is true', async () => {
      // Arrange
      const { fixture } = await setup({ mode: 'edit' });
      fixture.componentInstance.hasEditingOpen.set(true);
      fixture.detectChanges();

      // Act
      const el = fixture.debugElement.query(By.css('[data-testid="hint-confirm"]'));

      // Assert
      expect(el).toBeTruthy();
    });

    it('should NOT show the hint when hasEditingOpen is false', async () => {
      // Arrange – hasEditingOpen() defaults to false in the component
      const { fixture } = await setup({ mode: 'edit' });

      // Act
      const el = fixture.debugElement.query(By.css('[data-testid="hint-confirm"]'));

      // Assert
      expect(el).toBeNull();
    });
  });

  describe('"Save" hint', () => {
    it('should show the hint when categories.length < 2', async () => {
      // Arrange – selectCategories defaults to [] in setup
      const { fixture } = await setup({ mode: 'edit' });

      // Act
      const el = fixture.debugElement.query(By.css('[data-testid="hint-save"]'));

      // Assert
      expect(el).toBeTruthy();
    });

    it('should show the hint when hasUnsavedWheelChanges is true and categories >= 2', async () => {
      // Arrange
      const { fixture, mockStore } = await setup({ mode: 'edit' });
      mockStore.overrideSelector(selectCategories, multipleCategories as never);
      mockStore.overrideSelector(selectHasUnsavedCategoriesChanges, true);
      mockStore.refreshState();
      fixture.detectChanges();

      // Act
      const el = fixture.debugElement.query(By.css('[data-testid="hint-save"]'));

      // Assert
      expect(el).toBeTruthy();
    });

    it('should NOT show the hint when categories.length >= 2 and no unsaved changes', async () => {
      // Arrange
      const { fixture, mockStore } = await setup({ mode: 'edit' });
      mockStore.overrideSelector(selectCategories, multipleCategories as never);
      mockStore.overrideSelector(selectHasUnsavedCategoriesChanges, false);
      mockStore.refreshState();
      fixture.detectChanges();

      // Act
      const el = fixture.debugElement.query(By.css('[data-testid="hint-save"]'));

      // Assert
      expect(el).toBeNull();
    });
  });
});

// ---------------------------------------------------------------------------
// wil-action-buttons tests
// ---------------------------------------------------------------------------

describe('WheelComponent – action buttons', () => {
  async function setupActionButtons(options: {
    type: 'noAuth' | 'free' | 'personal' | 'professional';
    mode?: string;
    showActionButtons?: boolean;
  }): Promise<{ fixture: ComponentFixture<WheelComponent>; mockStore: MockStore }> {
    const { type, mode = 'view', showActionButtons = true } = options;

    await TestBed.configureTestingModule({
      imports: [WheelComponent, NoopAnimationsModule, RouterTestingModule, HttpClientTestingModule, TranslateModule.forRoot()],
      providers: [
        provideMockStore({
          selectors: [
            { selector: selectMode, value: mode },
            { selector: selectCategories, value: [] },
            { selector: selectHasAllScores, value: false },
            { selector: selectHasUnsavedCategoriesChanges, value: false },
            { selector: selectLang, value: 'en' },
            { selector: selectUserWheels, value: [] },
          ],
        }),
      ],
    })
      .overrideComponent(WheelComponent, {
        set: {
          imports: [
            CommonModule,
            ReactiveFormsModule,
            FlexLayoutStubDirective,
            CanvasStubComponent,
            CategoryStubComponent,
            ActionButtonsStubComponent,
            FocusStubComponent,
            WheelNameFormStubComponent,
            ReflectionPromptStubComponent,
          ],
        },
      })
      .compileComponents();

    const mockStore = TestBed.inject(MockStore);
    const fixture = TestBed.createComponent(WheelComponent);
    fixture.componentRef.setInput('type', type);
    fixture.componentRef.setInput('showActionButtons', showActionButtons);
    fixture.detectChanges();

    return { fixture, mockStore };
  }

  describe('outer guard – showActionButtons=false', () => {
    it('should NOT render any wil-action-buttons when showActionButtons is false', async () => {
      // Arrange
      const { fixture } = await setupActionButtons({ type: 'personal', mode: 'view', showActionButtons: false });

      // Act
      const stubs = fixture.debugElement.queryAll(By.css('[data-testid^="action-buttons-"]'));

      // Assert
      expect(stubs.length).toBe(0);
    });
  });

  describe('type="noAuth"', () => {
    it('should render exactly one wil-action-buttons with [type]="noAuth" in view mode', async () => {
      // Arrange
      const { fixture } = await setupActionButtons({ type: 'noAuth', mode: 'view' });

      // Act
      const stubs = fixture.debugElement.queryAll(By.css('[data-testid="action-buttons-noauth"]'));

      // Assert
      expect(stubs.length).toBe(1);
      expect((stubs[0].componentInstance as ActionButtonsStubComponent).type).toBe('noAuth');
    });

    it('should render exactly one wil-action-buttons with [type]="noAuth" in edit mode', async () => {
      // Arrange
      const { fixture } = await setupActionButtons({ type: 'noAuth', mode: 'edit' });

      // Act
      const stubs = fixture.debugElement.queryAll(By.css('[data-testid="action-buttons-noauth"]'));

      // Assert
      expect(stubs.length).toBe(1);
      expect((stubs[0].componentInstance as ActionButtonsStubComponent).type).toBe('noAuth');
    });

    it('should bind [wheelId] to the component wheelId property', async () => {
      // Arrange
      const { fixture } = await setupActionButtons({ type: 'noAuth', mode: 'view' });
      fixture.componentRef.setInput('wheelId', 'wheel-abc');
      fixture.detectChanges();

      // Act
      const stub = fixture.debugElement.query(By.css('[data-testid="action-buttons-noauth"]'));

      // Assert
      expect((stub.componentInstance as ActionButtonsStubComponent).wheelId).toBe('wheel-abc');
    });
  });

  describe('type="free" or type="personal"', () => {
    it('should render [type]="personal" in view mode for type="free"', async () => {
      // Arrange
      const { fixture } = await setupActionButtons({ type: 'free', mode: 'view' });

      // Act
      const stubs = fixture.debugElement.queryAll(By.css('[data-testid="action-buttons-personal-view"]'));

      // Assert
      expect(stubs.length).toBe(1);
      expect((stubs[0].componentInstance as ActionButtonsStubComponent).type).toBe('personal');
    });

    it('should render [type]="personal" in view mode for type="personal"', async () => {
      // Arrange
      const { fixture } = await setupActionButtons({ type: 'personal', mode: 'view' });

      // Act
      const stubs = fixture.debugElement.queryAll(By.css('[data-testid="action-buttons-personal-view"]'));

      // Assert
      expect(stubs.length).toBe(1);
      expect((stubs[0].componentInstance as ActionButtonsStubComponent).type).toBe('personal');
    });

    it('should render [type]="personal" in edit mode for type="free"', async () => {
      // Arrange
      const { fixture } = await setupActionButtons({ type: 'free', mode: 'edit' });

      // Act
      const stubs = fixture.debugElement.queryAll(By.css('[data-testid="action-buttons-personal-edit"]'));

      // Assert
      expect(stubs.length).toBe(1);
      expect((stubs[0].componentInstance as ActionButtonsStubComponent).type).toBe('personal');
    });

    it('should render [type]="personal" in edit mode for type="personal"', async () => {
      // Arrange
      const { fixture } = await setupActionButtons({ type: 'personal', mode: 'edit' });

      // Act
      const stubs = fixture.debugElement.queryAll(By.css('[data-testid="action-buttons-personal-edit"]'));

      // Assert
      expect(stubs.length).toBe(1);
      expect((stubs[0].componentInstance as ActionButtonsStubComponent).type).toBe('personal');
    });

    it('should bind [disableSaveWheelButton]=false when both signals are false (edit mode)', async () => {
      // Arrange – disableSaveWheelButton and hasEditingOpen default to false
      const { fixture } = await setupActionButtons({ type: 'personal', mode: 'edit' });

      // Act
      const stub = fixture.debugElement.query(By.css('[data-testid="action-buttons-personal-edit"]'));

      // Assert
      expect((stub.componentInstance as ActionButtonsStubComponent).disableSaveWheelButton).toBeFalse();
    });

    it('should bind [disableSaveWheelButton]=true when disableSaveWheelButton signal is true (edit mode)', async () => {
      // Arrange
      const { fixture } = await setupActionButtons({ type: 'personal', mode: 'edit' });
      fixture.componentInstance.disableSaveWheelButton.set(true);
      fixture.detectChanges();

      // Act
      const stub = fixture.debugElement.query(By.css('[data-testid="action-buttons-personal-edit"]'));

      // Assert
      expect((stub.componentInstance as ActionButtonsStubComponent).disableSaveWheelButton).toBeTrue();
    });

    it('should bind [disableSaveWheelButton]=true when hasEditingOpen signal is true (edit mode)', async () => {
      // Arrange
      const { fixture } = await setupActionButtons({ type: 'personal', mode: 'edit' });
      fixture.componentInstance.hasEditingOpen.set(true);
      fixture.detectChanges();

      // Act
      const stub = fixture.debugElement.query(By.css('[data-testid="action-buttons-personal-edit"]'));

      // Assert
      expect((stub.componentInstance as ActionButtonsStubComponent).disableSaveWheelButton).toBeTrue();
    });

    it('should dispatch updatePersonalWheel when (saveWheel) fires in edit mode', async () => {
      // Arrange
      const mockCat = { id: 'cat-1', name: 'Health', color: '#f00', description: '', order: 0, score: 5 };
      const { fixture, mockStore } = await setupActionButtons({ type: 'personal', mode: 'edit' });
      mockStore.overrideSelector(selectCategories, [mockCat] as never);
      mockStore.refreshState();
      fixture.detectChanges();
      spyOn(mockStore, 'dispatch').and.callThrough();
      const stub = fixture.debugElement.query(By.css('[data-testid="action-buttons-personal-edit"]'));

      // Act
      (stub.componentInstance as ActionButtonsStubComponent).saveWheel.emit();
      fixture.detectChanges();

      // Assert
      expect(mockStore.dispatch).toHaveBeenCalledWith(jasmine.objectContaining({ type: '[Personal] Update Personal Wheel' }));
    });
  });

  describe('type="professional"', () => {
    it('should render exactly one wil-action-buttons with [type]="professional" in view mode', async () => {
      // Arrange
      const { fixture } = await setupActionButtons({ type: 'professional', mode: 'view' });

      // Act
      const stubs = fixture.debugElement.queryAll(By.css('[data-testid="action-buttons-professional-view"]'));

      // Assert
      expect(stubs.length).toBe(1);
      expect((stubs[0].componentInstance as ActionButtonsStubComponent).type).toBe('professional');
    });

    it('should render exactly one wil-action-buttons with [type]="professional" in edit mode', async () => {
      // Arrange
      const { fixture } = await setupActionButtons({ type: 'professional', mode: 'edit' });

      // Act
      const stubs = fixture.debugElement.queryAll(By.css('[data-testid="action-buttons-professional-edit"]'));

      // Assert
      expect(stubs.length).toBe(1);
      expect((stubs[0].componentInstance as ActionButtonsStubComponent).type).toBe('professional');
    });

    it('should dispatch updatePersonalWheel when (saveWheel) fires in edit mode', async () => {
      // Arrange
      const mockCat = { id: 'cat-1', name: 'Health', color: '#f00', description: '', order: 0, score: 5 };
      const { fixture, mockStore } = await setupActionButtons({ type: 'professional', mode: 'edit' });
      mockStore.overrideSelector(selectCategories, [mockCat] as never);
      mockStore.refreshState();
      fixture.detectChanges();
      spyOn(mockStore, 'dispatch').and.callThrough();
      const stub = fixture.debugElement.query(By.css('[data-testid="action-buttons-professional-edit"]'));

      // Act
      (stub.componentInstance as ActionButtonsStubComponent).saveWheel.emit();
      fixture.detectChanges();

      // Assert
      expect(mockStore.dispatch).toHaveBeenCalledWith(jasmine.objectContaining({ type: '[Personal] Update Personal Wheel' }));
    });
  });
});
