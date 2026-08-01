import { createFeatureSelector, createSelector } from '@ngrx/store';
import { PersonalState, WheelState } from './typings';

export const selectWheelState = createFeatureSelector<WheelState>('wheel');
export const selectPersonalState = createFeatureSelector<PersonalState>('personal');
export const selectWheelActions = createSelector(selectWheelState, (state) => state.lastAction);

export const selectActiveWheel = createSelector(selectWheelState, (state: WheelState) => state.activeWheel);
export const selectLang = createSelector(selectWheelState, (state: WheelState) => state.lang);
export const selectLinkData = createSelector(selectWheelState, (state: WheelState) => state.linkData);

export const selectUserWheels = createSelector(selectPersonalState, (state) => state.wheels);
export const selectClients = createSelector(selectPersonalState, (state) => state.clients);
export const selectSessions = createSelector(selectPersonalState, (personalState) => {
  return personalState.sessions;
});

export const selectPersonalWheelsLoading = createSelector(selectPersonalState, (state) => state.loading);
export const selectPersonalError = createSelector(selectPersonalState, (state) => state.error);
export const selectHasWheels = createSelector(selectUserWheels, (wheels) => wheels.length > 0);
export const selectShouldShowEmptyState = createSelector(
  selectHasWheels,
  selectPersonalWheelsLoading,
  (hasWheels, loading) => !hasWheels && !loading
);
export const selectDefaultWheelId = createSelector(selectUserWheels, (wheels) => wheels.find((w) => w.isDefault)?.id);
export const selectCategories = createSelector(selectActiveWheel, (wheel) => wheel?.categories || []);
export const selectMode = createSelector(selectWheelState, (state) => state.mode);
export const selectHasAllScores = createSelector(
  selectCategories,
  (categories) => Boolean(categories.length) && categories.every((c) => c.score > 0)
);
export const selectFocus = createSelector(selectActiveWheel, (wheel) => wheel?.focus || []);
export const selectFocusedCategories = createSelector(selectCategories, selectFocus, (categories, focus) =>
  categories.filter((category) => focus.includes(category.id))
);
export const selectHasUnsavedCategoriesChanges = createSelector(selectActiveWheel, selectPersonalState, (wheel, personalState) => {
  if (!wheel) return false;

  const savedWheel = personalState.wheels.find((w) => w.id === wheel.id);

  const hasCategoriesChanged = wheel.categories.length !== savedWheel?.categorySnapshots.length;
  const isCategoriesEqual = wheel.categories.every((newCategory) => {
    const savedCategory = savedWheel?.categorySnapshots?.find((cat) => newCategory.id === cat.categoryId);
    return savedCategory?.label === newCategory.name && savedCategory?.color === newCategory.color;
  });
  const hasNameChanged = wheel.name !== savedWheel?.name;

  return hasCategoriesChanged || !isCategoriesEqual || hasNameChanged;
});
export const selectHasUnsavedSessionChanges = createSelector(selectActiveWheel, selectPersonalState, (wheel) => {
  if (!wheel) return false;

  return wheel.categories.some((category) => category.score > 0);
});
export const selectBrand = createSelector(selectPersonalState, (state) => state.brand);
export const selectWheelsOrSessionsLoading = createSelector(selectPersonalState, (state) => state.loading);
export const selectSessionDraft = createSelector(selectActiveWheel, (wheel) => wheel?.sessionDraft || { noteUpdatedAt: null });
export const selectSessionDraftNote = createSelector(selectSessionDraft, (draft) => draft.noteMd);
