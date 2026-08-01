import { mapActiveWheel } from './active-wheel.mapper';

describe('mapActiveWheel', () => {
  const expectMappedWheel = (result: ReturnType<typeof mapActiveWheel>): Exclude<ReturnType<typeof mapActiveWheel>, void> => {
    expect(result).toBeDefined();
    return result as Exclude<ReturnType<typeof mapActiveWheel>, void>;
  };

  const createWheel = (overrides: Partial<WheelVersionOutputDto> = {}): WheelVersionOutputDto => ({
    id: 'version-1',
    wheelId: 'wheel-1',
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
      {
        categoryId: 'career',
        label: 'Career',
        description: 'Work and growth',
        color: '#00ff00',
        isArchived: false,
      },
    ],
    focusIds: ['health'],
    isDefault: true,
    isDeleted: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
    ...overrides,
  });

  const createSession = (overrides: Partial<WheelSessionOutputDto> = {}): WheelSessionOutputDto => ({
    id: 'session-1',
    userId: 'user-1',
    accountId: 'account-1',
    wheelId: 'wheel-1',
    wheelVersionId: 'version-1',
    scores: [
      { categoryId: 'health', value: 8 },
      { categoryId: 'career', value: 6 },
    ],
    focusAtSubmit: ['career'],
    locale: 'en',
    notes: null,
    submittedAt: '2026-01-03T00:00:00.000Z',
    isDeleted: false,
    ...overrides,
  });

  it('should map the default wheel when no wheel id is provided', () => {
    const nonDefaultWheel = createWheel({ id: 'version-2', wheelId: 'wheel-2', name: 'Non Default', isDefault: false });
    const defaultWheel = createWheel();

    const result = mapActiveWheel([nonDefaultWheel, defaultWheel]);

    expect(result).toEqual({
      id: 'version-1',
      name: 'Life Balance',
      descriptionKey: 0,
      wheelKey: 0,
      focus: ['health'],
      focusLoading: false,
      loading: false,
      categories: [
        {
          id: 'health',
          name: 'Health',
          description: 'Physical wellbeing',
          color: '#ff0000',
          order: 0,
          score: 0,
        },
        {
          id: 'career',
          name: 'Career',
          description: 'Work and growth',
          color: '#00ff00',
          order: 1,
          score: 0,
        },
      ],
    });
  });

  it('should map the requested wheel id instead of the default wheel', () => {
    const defaultWheel = createWheel();
    const requestedWheel = createWheel({
      id: 'version-2',
      wheelId: 'wheel-2',
      name: 'Requested Wheel',
      focusIds: ['career'],
      isDefault: false,
    });

    const result = mapActiveWheel([defaultWheel, requestedWheel], 'version-2');
    const mappedWheel = expectMappedWheel(result);

    expect(mappedWheel.id).toBe('version-2');
    expect(mappedWheel.name).toBe('Requested Wheel');
    expect(mappedWheel.focus).toEqual(['career']);
  });

  it('should map session scores and submitted focus when a session is provided', () => {
    const result = mapActiveWheel([createWheel()], 'version-1', createSession());
    const mappedWheel = expectMappedWheel(result);

    expect(mappedWheel.focus).toEqual(['career']);
    expect(mappedWheel.categories.map((category) => ({ id: category.id, score: category.score }))).toEqual([
      { id: 'health', score: 8 },
      { id: 'career', score: 6 },
    ]);
  });

  it('should default category scores to 0 when the session has no score for the category', () => {
    const session = createSession({ scores: [{ categoryId: 'health', value: 9 }] });

    const result = mapActiveWheel([createWheel()], 'version-1', session);
    const mappedWheel = expectMappedWheel(result);

    expect(mappedWheel.categories.map((category) => ({ id: category.id, score: category.score }))).toEqual([
      { id: 'health', score: 9 },
      { id: 'career', score: 0 },
    ]);
  });

  it('should default an empty category description to an empty string', () => {
    // Arrange
    const wheel = createWheel({
      categorySnapshots: [
        {
          categoryId: 'health',
          label: 'Health',
          description: '',
          color: '#ff0000',
          isArchived: false,
        },
      ],
    });

    // Act
    const result = mapActiveWheel([wheel]);
    const mappedWheel = expectMappedWheel(result);

    // Assert
    expect(mappedWheel.categories[0]?.description).toBe('');
  });

  it('should preserve category snapshot order as state order', () => {
    const result = mapActiveWheel([createWheel()]);
    const mappedWheel = expectMappedWheel(result);

    expect(mappedWheel.categories.map((category) => ({ id: category.id, order: category.order }))).toEqual([
      { id: 'health', order: 0 },
      { id: 'career', order: 1 },
    ]);
  });

  it('should return undefined when there are no wheels', () => {
    const result = mapActiveWheel([]);

    expect(result).toBeUndefined();
  });

  it('should return undefined when no default wheel exists and no wheel id is provided', () => {
    const result = mapActiveWheel([createWheel({ isDefault: false })]);

    expect(result).toBeUndefined();
  });

  it('should return undefined when the requested wheel id is not found', () => {
    const result = mapActiveWheel([createWheel()], 'missing-version');

    expect(result).toBeUndefined();
  });
});
