import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { MemoizedSelector } from '@ngrx/store';

import { FocusModalComponent } from './focus-modal.component';
import {
  saveClientFocus,
  saveClientFocusForParticipant,
  selectActiveWheel,
  selectCategories,
  selectFocus,
  selectLinkData,
} from '../../../../state';
import { SingleWheelState, WheelStateCategory } from '../../../../state/typings';
import { FocusModalData } from '../action-buttons/typings';

describe('FocusModalComponent', () => {
  let fixture: ComponentFixture<FocusModalComponent>;
  let store: MockStore;
  let dispatchSpy: jasmine.Spy;
  let dialogRef: jasmine.SpyObj<MatDialogRef<FocusModalComponent, string[]>>;
  let activeWheelSelector: MemoizedSelector<object, SingleWheelState | null>;
  let categoriesSelector: MemoizedSelector<object, WheelStateCategory[]>;
  let focusSelector: MemoizedSelector<object, string[]>;
  let linkDataSelector: MemoizedSelector<object, ReturnType<typeof selectLinkData.projector>>;

  const focusModalData: FocusModalData = {
    source: 'client_view',
    wheelId: 'wheel-1',
  };

  const createCategory = (overrides: Partial<WheelStateCategory> = {}): WheelStateCategory => ({
    id: 'health',
    name: 'Health',
    description: 'Physical wellbeing',
    color: '#ff0000',
    order: 0,
    score: 0,
    ...overrides,
  });

  const categories: WheelStateCategory[] = [
    createCategory(),
    createCategory({
      id: 'career',
      name: 'Career',
      description: 'Professional growth',
      color: '#00ff00',
      order: 1,
    }),
  ];

  const createActiveWheel = (overrides: Partial<SingleWheelState> = {}): SingleWheelState => ({
    id: 'wheel-version-1',
    categories,
    name: 'Life Balance',
    descriptionKey: 0,
    wheelKey: 0,
    focus: ['health'],
    focusLoading: false,
    loading: false,
    ...overrides,
  });

  const setup = ({
    activeWheel = createActiveWheel(),
    categoryValues = categories,
    focus = ['health'],
    linkData = null,
  }: {
    activeWheel?: SingleWheelState | null;
    categoryValues?: WheelStateCategory[];
    focus?: string[];
    linkData?: ReturnType<typeof selectLinkData.projector>;
  } = {}): void => {
    activeWheelSelector.setResult(activeWheel);
    categoriesSelector.setResult(categoryValues);
    focusSelector.setResult(focus);
    linkDataSelector.setResult(linkData);
    store.refreshState();

    fixture = TestBed.createComponent(FocusModalComponent);
    dispatchSpy = spyOn(store, 'dispatch').and.callThrough();
    dialogRef.close.calls.reset();
    fixture.detectChanges();
  };

  const queryByTestId = (testId: string) => fixture.debugElement.query(By.css(`[data-testid="${testId}"]`));

  const getCheckbox = (categoryId: string): HTMLInputElement => {
    return queryByTestId(`focus-checkbox-${categoryId}`).nativeElement as HTMLInputElement;
  };

  const getSaveButton = (): HTMLButtonElement => {
    return fixture.debugElement.query(By.css('[data-testid="focus-modal-save-focus-button"] button')).nativeElement as HTMLButtonElement;
  };

  beforeEach(async () => {
    dialogRef = jasmine.createSpyObj<MatDialogRef<FocusModalComponent, string[]>>('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [FocusModalComponent],
      providers: [
        provideMockStore(),
        {
          provide: MAT_DIALOG_DATA,
          useValue: focusModalData,
        },
        {
          provide: MatDialogRef,
          useValue: dialogRef,
        },
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    activeWheelSelector = store.overrideSelector(selectActiveWheel, createActiveWheel());
    categoriesSelector = store.overrideSelector(selectCategories, categories);
    focusSelector = store.overrideSelector(selectFocus, ['health']);
    linkDataSelector = store.overrideSelector(selectLinkData, null);
  });

  describe('rendering', () => {
    it('should show the loading state when categories are loading', () => {
      setup({
        activeWheel: createActiveWheel({ loading: true }),
      });

      const loading = queryByTestId('focus-loading');
      const categoryItem = queryByTestId('focus-category-item');

      expect(loading.nativeElement.textContent).toContain('Loading categories...');
      expect(categoryItem).toBeNull();
    });

    it('should show the empty state when there are no categories and loading is finished', () => {
      setup({
        activeWheel: createActiveWheel({ categories: [] }),
        categoryValues: [],
        focus: [],
      });

      const emptyState = queryByTestId('focus-empty-state');
      const loading = queryByTestId('focus-loading');

      expect(emptyState.nativeElement.textContent).toContain('No categories available.');
      expect(loading).toBeNull();
    });

    it('should render categories and check the initially focused category', () => {
      setup();

      const healthCheckbox = getCheckbox('health');
      const careerCheckbox = getCheckbox('career');
      const selectedCategory = queryByTestId('focus-checkbox-health').parent;

      expect(queryByTestId('focus-name-health').nativeElement.textContent).toContain('Health');
      expect(queryByTestId('focus-name-career').nativeElement.textContent).toContain('Career');
      expect(healthCheckbox.checked).toBeTrue();
      expect(careerCheckbox.checked).toBeFalse();
      expect(selectedCategory?.nativeElement.classList).toContain('focus-modal__category--selected');
    });
  });

  describe('selection state', () => {
    it('should update the checked state when a category checkbox changes', () => {
      setup();
      const careerCheckbox = getCheckbox('career');

      careerCheckbox.click();
      fixture.detectChanges();

      expect(getCheckbox('career').checked).toBeTrue();
      expect(queryByTestId('focus-checkbox-career').parent?.nativeElement.classList).toContain('focus-modal__category--selected');
    });

    it('should show resent user selections when the store focus changes after initialization', () => {
      setup();
      const careerCheckbox = getCheckbox('career');

      careerCheckbox.click();
      focusSelector.setResult(['career']);
      store.refreshState();
      fixture.detectChanges();

      expect(getCheckbox('health').checked).toBeFalse();
      expect(getCheckbox('career').checked).toBeTrue();
    });
  });

  describe('save actions', () => {
    it('should dispatch owner focus save and close the dialog with selected category ids', () => {
      setup();
      getCheckbox('career').click();
      fixture.detectChanges();

      getSaveButton().click();

      expect(dispatchSpy).toHaveBeenCalledWith(
        saveClientFocus({
          wheelId: 'wheel-1',
          newFocus: ['health', 'career'],
          token: undefined,
        })
      );
      expect(dialogRef.close).toHaveBeenCalledWith(['health', 'career']);
    });

    it('should dispatch participant focus save when link data has a token', () => {
      setup({
        linkData: {
          token: 'participant-token',
        } as NonNullable<ReturnType<typeof selectLinkData.projector>>,
      });

      getSaveButton().click();

      expect(dispatchSpy).toHaveBeenCalledWith(
        saveClientFocusForParticipant({
          newFocus: ['health'],
          token: 'participant-token',
        })
      );
      expect(dialogRef.close).toHaveBeenCalledWith(['health']);
    });
  });
});
