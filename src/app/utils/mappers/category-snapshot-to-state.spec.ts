import mapCategorySnapshotToState from './category-snapshot-to-state';

describe('mapCategorySnapshotToState', () => {
  const createCategorySnapshot = (overrides: Partial<CategorySnapshotDto> = {}): CategorySnapshotDto => ({
    categoryId: 'health',
    label: 'Health',
    description: 'Physical wellbeing',
    color: '#ff0000',
    isArchived: false,
    ...overrides,
  });

  it('should map category snapshot fields to wheel state categories', () => {
    const categories = [createCategorySnapshot()];

    const result = mapCategorySnapshotToState(categories);

    expect(result).toEqual([
      {
        id: 'health',
        name: 'Health',
        description: 'Physical wellbeing',
        color: '#ff0000',
        order: 1,
        score: 0,
      },
    ]);
  });

  it('should default missing descriptions to an empty string', () => {
    const categories = [createCategorySnapshot({ description: undefined })];

    const result = mapCategorySnapshotToState(categories);

    expect(result[0].description).toBe('');
  });

  it('should assign one-based order from the snapshot position', () => {
    const categories = [
      createCategorySnapshot({ categoryId: 'health', label: 'Health' }),
      createCategorySnapshot({ categoryId: 'career', label: 'Career' }),
      createCategorySnapshot({ categoryId: 'family', label: 'Family' }),
    ];

    const result = mapCategorySnapshotToState(categories);

    expect(result.map((category) => ({ id: category.id, order: category.order }))).toEqual([
      { id: 'health', order: 1 },
      { id: 'career', order: 2 },
      { id: 'family', order: 3 },
    ]);
  });

  it('should return an empty array when there are no category snapshots', () => {
    const result = mapCategorySnapshotToState([]);

    expect(result).toEqual([]);
  });
});
