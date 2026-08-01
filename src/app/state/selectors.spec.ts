import { selectHasUnsavedCategoriesChanges } from './selectors';
import { PersonalState, SingleWheelState, WheelStateCategory } from './typings';

describe('selectors', () => {
  describe('selectHasUnsavedCategoriesChanges', () => {
    const createCategory = (overrides: Partial<WheelStateCategory> = {}): WheelStateCategory => ({
      id: 'health',
      name: 'Health',
      description: 'Physical wellbeing',
      color: '#ff0000',
      order: 0,
      score: 0,
      ...overrides,
    });

    const createActiveWheel = (overrides: Partial<SingleWheelState> = {}): SingleWheelState => ({
      id: 'wheel-version-1',
      categories: [createCategory()],
      name: 'Life Balance',
      descriptionKey: 0,
      wheelKey: 0,
      focus: [],
      focusLoading: false,
      loading: false,
      ...overrides,
    });

    const createSavedWheel = (overrides: Partial<WheelVersion> = {}): WheelVersion => ({
      id: 'wheel-version-1',
      wheelId: 'wheel-1',
      wheelVersionId: 'wheel-version-1',
      accountId: 'account-1',
      version: 1,
      name: 'Life Balance',
      categorySnapshots: [
        {
          categoryId: 'health',
          label: 'Health',
          description: 'Physical wellbeing',
          color: '#ff0000',
          isArchived: false,
        },
      ],
      focusIds: [],
      isDefault: true,
      isDeleted: false,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      ...overrides,
    });

    const createPersonalState = (overrides: Partial<PersonalState> = {}): PersonalState => ({
      wheels: [createSavedWheel()],
      clients: [],
      sessions: [],
      brand: null,
      loading: false,
      error: null,
      ...overrides,
    });

    it('should return false when there is no active wheel', () => {
      const result = selectHasUnsavedCategoriesChanges.projector(null, createPersonalState());

      expect(result).toBeFalse();
    });

    it('should return false when active categories and name match the saved wheel', () => {
      const result = selectHasUnsavedCategoriesChanges.projector(createActiveWheel(), createPersonalState());

      expect(result).toBeFalse();
    });

    it('should return true when a category was added or removed', () => {
      const activeWheel = createActiveWheel({
        categories: [
          createCategory(),
          createCategory({
            id: 'career',
            name: 'Career',
            description: 'Professional growth',
            color: '#00ff00',
            order: 1,
          }),
        ],
      });

      const result = selectHasUnsavedCategoriesChanges.projector(activeWheel, createPersonalState());

      expect(result).toBeTrue();
    });

    it('should return true when a category label or color changed', () => {
      const changedLabelWheel = createActiveWheel({
        categories: [createCategory({ name: 'Wellbeing' })],
      });
      const changedColorWheel = createActiveWheel({
        categories: [createCategory({ color: '#0000ff' })],
      });
      const personalState = createPersonalState();

      expect(selectHasUnsavedCategoriesChanges.projector(changedLabelWheel, personalState)).toBeTrue();
      expect(selectHasUnsavedCategoriesChanges.projector(changedColorWheel, personalState)).toBeTrue();
    });

    it('should return true when the wheel name changed', () => {
      const activeWheel = createActiveWheel({ name: 'Updated Life Balance' });

      const result = selectHasUnsavedCategoriesChanges.projector(activeWheel, createPersonalState());

      expect(result).toBeTrue();
    });

    it('should return true when the active wheel has no matching saved wheel', () => {
      const activeWheel = createActiveWheel({ id: 'missing-wheel-version' });

      const result = selectHasUnsavedCategoriesChanges.projector(activeWheel, createPersonalState());

      expect(result).toBeTrue();
    });
  });
});
