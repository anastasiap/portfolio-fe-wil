import {
  addCategorySuccess,
  addFreePlanCategory,
  clearSessionDraftNote,
  deleteCategorySuccess,
  destroyWheel,
  editCategorySuccess,
  initializeWheel,
  loadClientFocus,
  loadClientFocusFailure,
  loadClientFocusSuccess,
  resetMarks,
  resetSession,
  saveClientFocus,
  saveClientFocusFailure,
  saveClientFocusForParticipantSuccess,
  saveClientFocusSuccess,
  saveSessionFailure,
  saveSessionSuccess,
  setActiveWheel,
  setLanguage,
  setMode,
  setScore,
  setSessionDraftNote,
  setWheelNewName,
} from './actions';
import { initialState, wheelReducer } from './reducer';
import { SingleWheelState, WheelState, WheelStateCategory } from './typings';

describe('wheelReducer', () => {
  const createCategory = (overrides: Partial<WheelStateCategory> = {}): WheelStateCategory => ({
    id: 'category-000000000000000001',
    name: 'Health',
    description: 'Physical wellbeing',
    color: '#ff0000',
    order: 0,
    score: 5,
    ...overrides,
  });

  const createActiveWheel = (overrides: Partial<SingleWheelState> = {}): SingleWheelState => ({
    id: 'wheel-1',
    categories: [
      createCategory(),
      createCategory({
        id: 'category-000000000000000002',
        name: 'Career',
        description: 'Professional growth',
        color: '#00ff00',
        order: 1,
        score: 7,
      }),
    ],
    name: 'Life Balance',
    descriptionKey: 0,
    wheelKey: 0,
    focus: [],
    focusLoading: false,
    loading: false,
    sessionDraft: {
      noteMd: 'Existing note',
      noteUpdatedAt: '2026-01-01T00:00:00.000Z',
    },
    ...overrides,
  });

  const createState = (overrides: Partial<WheelState> = {}): WheelState => ({
    ...initialState,
    activeWheel: createActiveWheel(),
    ...overrides,
  });

  it('should return the initial state for an unknown action', () => {
    const result = wheelReducer(undefined, { type: '[Test] Unknown' });

    expect(result).toEqual(initialState);
  });

  it('should create an initial active wheel when initializing without a wheel id', () => {
    const result = wheelReducer(initialState, initializeWheel({ wheelId: '' }));

    expect(result.activeWheel).toEqual({
      id: '',
      categories: [],
      name: 'Wheel of Life',
      descriptionKey: 0,
      wheelKey: 0,
      focus: [],
      focusLoading: false,
      loading: false,
    });
  });

  it('should preserve the existing active wheel when initializing with a wheel id', () => {
    const activeWheel = createActiveWheel();
    const state = createState({ activeWheel });

    const result = wheelReducer(state, initializeWheel({ wheelId: 'wheel-1' }));

    expect(result.activeWheel).toBe(activeWheel);
  });

  it('should set, rename, change mode, change language, and destroy the active wheel', () => {
    const wheel = createActiveWheel({ id: 'replacement-wheel', name: 'Replacement' });

    const withWheel = wheelReducer(initialState, setActiveWheel({ wheel }));
    const renamed = wheelReducer(withWheel, setWheelNewName({ name: 'Updated name' }));
    const editMode = wheelReducer(renamed, setMode({ mode: 'edit' }));
    const localized = wheelReducer(editMode, setLanguage({ lang: 'ru' }));
    const destroyed = wheelReducer(localized, destroyWheel());

    expect(withWheel.activeWheel).toEqual(wheel);
    expect(withWheel.activeWheel).not.toBe(wheel);
    expect(renamed.activeWheel?.name).toBe('Updated name');
    expect(editMode.mode).toBe('edit');
    expect(localized.lang).toBe('ru');
    expect(destroyed.activeWheel).toBeNull();
    expect(destroyed.mode).toBe('view');
  });

  it('should add, edit, and delete categories without mutating existing category state', () => {
    const state = createState();
    const newCategory = createCategory({
      id: 'category-000000000000000003',
      name: 'Family',
      color: '#0000ff',
      score: 0,
    });
    const editedCategory = createCategory({
      id: 'category-000000000000000002',
      name: 'Career Growth',
      color: '#00aa00',
      score: 9,
    });

    const afterAdd = wheelReducer(state, addCategorySuccess({ category: newCategory }));
    const afterEdit = wheelReducer(afterAdd, editCategorySuccess({ category: editedCategory }));
    const afterDelete = wheelReducer(afterEdit, deleteCategorySuccess({ id: 'category-000000000000000001' }));

    expect(afterAdd.activeWheel?.categories.at(-1)).toEqual({ ...newCategory, order: 3 });
    expect(state.activeWheel?.categories.length).toBe(2);
    expect(afterEdit.activeWheel?.categories.find((category) => category.id === editedCategory.id)).toEqual(editedCategory);
    expect(afterDelete.activeWheel?.categories.map((category) => category.id)).toEqual([
      'category-000000000000000002',
      'category-000000000000000003',
    ]);
  });

  it('should add a free plan category with derived id and next order', () => {
    const state = createState({
      activeWheel: createActiveWheel({
        categories: [createCategory({ id: 'abcdefghijklmnopqrstuvw1', order: 1 })],
      }),
    });

    const result = wheelReducer(state, addFreePlanCategory({ color: '#123456' }));

    expect(result.activeWheel?.categories[1]).toEqual({
      id: 'abcdefghijklmnopqrstuvw2',
      name: 'New Category',
      description: '',
      color: '#123456',
      order: 2,
      score: 0,
    });
  });

  it('should update a category score and reset scores for reset actions', () => {
    const scored = wheelReducer(createState(), setScore({ categoryId: 'category-000000000000000002', score: 10 }));
    const resetMarksState = wheelReducer(scored, resetMarks());
    const resetSessionState = wheelReducer(scored, resetSession());

    expect(scored.activeWheel?.categories.map((category) => category.score)).toEqual([5, 10]);
    expect(resetMarksState.activeWheel?.categories.map((category) => category.score)).toEqual([0, 0]);
    expect(resetMarksState.activeWheel?.sessionDraft).toEqual(createState().activeWheel?.sessionDraft);
    expect(resetSessionState.activeWheel?.categories.map((category) => category.score)).toEqual([0, 0]);
    expect(resetSessionState.activeWheel?.sessionDraft).toBeUndefined();
  });

  it('should set and clear the session draft note', () => {
    const state = createState({
      activeWheel: createActiveWheel({ sessionDraft: undefined }),
    });

    const withDraft = wheelReducer(state, setSessionDraftNote({ noteMd: 'New note' }));
    const clearedDraft = wheelReducer(withDraft, clearSessionDraftNote());

    expect(withDraft.activeWheel?.sessionDraft?.noteMd).toBe('New note');
    expect(withDraft.activeWheel?.sessionDraft?.noteUpdatedAt).toEqual(jasmine.any(String));
    expect(Number.isNaN(Date.parse(withDraft.activeWheel?.sessionDraft?.noteUpdatedAt ?? ''))).toBeFalse();
    expect(clearedDraft.activeWheel?.sessionDraft).toBeUndefined();
  });

  it('should clear draft note and record last action when session save finishes', () => {
    const successResult = wheelReducer(createState(), saveSessionSuccess({ sessions: [] }));
    const failureResult = wheelReducer(createState(), saveSessionFailure({ error: 'Could not save' }));
    const successLastAction = successResult.lastAction as { type: string; timestamp?: unknown };
    const failureLastAction = failureResult.lastAction as { type: string; timestamp?: unknown };

    expect(successResult.activeWheel?.sessionDraft).toBeUndefined();
    expect(successLastAction.type).toBe(saveSessionSuccess.type);
    expect(successLastAction.timestamp).toEqual(jasmine.any(Number));
    expect(failureResult.activeWheel?.loading).toBeFalse();
    expect(failureLastAction.type).toBe(saveSessionFailure.type);
    expect(failureLastAction.timestamp).toEqual(jasmine.any(Number));
  });

  it('should update focus loading and focus values for focus actions', () => {
    const state = createState();

    const loadingFocus = wheelReducer(state, loadClientFocus({ wheelId: 'wheel-1', clientId: 'client-1' }));
    const loadedFocus = wheelReducer(loadingFocus, loadClientFocusSuccess({ focus: ['category-000000000000000002'] }));
    const savingFocus = wheelReducer(loadedFocus, saveClientFocus({ wheelId: 'wheel-1', newFocus: [] }));
    const savedFocus = wheelReducer(
      savingFocus,
      saveClientFocusSuccess({ focus: ['category-000000000000000001'], wheelId: 'wheel-1' })
    );
    const participantFocus = wheelReducer(savedFocus, saveClientFocusForParticipantSuccess({ focus: ['category-000000000000000002'] }));
    const failedLoad = wheelReducer(participantFocus, loadClientFocusFailure({ error: 'Could not load focus' }));
    const failedSave = wheelReducer(
      { ...failedLoad, activeWheel: { ...failedLoad.activeWheel!, focusLoading: true } },
      saveClientFocusFailure({ error: 'Could not save focus' })
    );

    expect(loadingFocus.activeWheel?.focusLoading).toBeTrue();
    expect(loadedFocus.activeWheel?.focus).toEqual(['category-000000000000000002']);
    expect(loadedFocus.activeWheel?.focusLoading).toBeFalse();
    expect(savingFocus.activeWheel?.focusLoading).toBeTrue();
    expect(savedFocus.activeWheel?.focus).toEqual(['category-000000000000000001']);
    expect(savedFocus.activeWheel?.focusLoading).toBeFalse();
    expect(participantFocus.activeWheel?.focus).toEqual(['category-000000000000000002']);
    expect(failedLoad.activeWheel?.focusLoading).toBeFalse();
    expect(failedSave.activeWheel?.focusLoading).toBeFalse();
  });
});
