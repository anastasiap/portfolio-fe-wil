import mapWheelTemplateToState from './wheel-template-to-state';

describe('mapWheelTemplateToState', () => {
  const createCategorySnapshot = (overrides: Partial<CategorySnapshotDto> = {}): CategorySnapshotDto => ({
    categoryId: 'health',
    label: 'Health',
    description: 'Physical wellbeing',
    color: '#ff0000',
    isArchived: false,
    ...overrides,
  });

  const createWheelTemplate = (overrides: Partial<WheelTemplateDetailDto> = {}): WheelTemplateDetailDto => ({
    id: 'template-1',
    name: 'Life Balance',
    latestVersionId: 'version-1',
    version: 1,
    categories: [
      createCategorySnapshot(),
      createCategorySnapshot({
        categoryId: 'career',
        label: 'Career',
        description: 'Work and growth',
        color: '#00ff00',
      }),
    ],
    description: 'Template description',
    ...overrides,
  });

  it('should map a wheel template to single wheel state', () => {
    const wheelTemplate = createWheelTemplate();

    const result = mapWheelTemplateToState(wheelTemplate);

    expect(result).toEqual({
      id: 'template-1',
      name: 'Life Balance',
      descriptionKey: 0,
      wheelKey: 0,
      focus: [],
      focusLoading: false,
      loading: false,
      categories: [
        {
          id: 'health',
          name: 'Health',
          description: 'Physical wellbeing',
          color: '#ff0000',
          order: 1,
          score: 0,
        },
        {
          id: 'career',
          name: 'Career',
          description: 'Work and growth',
          color: '#00ff00',
          order: 2,
          score: 0,
        },
      ],
    });
  });

  it('should map templates without categories to state with an empty category list', () => {
    const wheelTemplate = createWheelTemplate({ categories: [] });

    const result = mapWheelTemplateToState(wheelTemplate);

    expect(result.categories).toEqual([]);
  });

  it('should default mapped category descriptions when template category descriptions are missing', () => {
    const wheelTemplate = createWheelTemplate({
      categories: [createCategorySnapshot({ description: undefined })],
    });

    const result = mapWheelTemplateToState(wheelTemplate);

    expect(result.categories[0].description).toBe('');
  });
});
