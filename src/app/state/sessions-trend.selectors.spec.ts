import { selectActiveWheelSessionsSorted, selectOverallTrend } from './sessions-trend.selectors';
import { SingleWheelState, WheelStateCategory } from './typings';

describe('sessions trend selectors', () => {
  const createCategory = (overrides: Partial<WheelStateCategory> = {}): WheelStateCategory => ({
    id: 'health',
    name: 'Health',
    description: 'Physical wellbeing',
    color: '#ff0000',
    order: 0,
    score: 0,
    ...overrides,
  });

  const createWheel = (overrides: Partial<SingleWheelState> = {}): SingleWheelState => ({
    id: 'wheel-1',
    categories: [createCategory()],
    name: 'Life Balance',
    descriptionKey: 0,
    wheelKey: 0,
    focus: [],
    focusLoading: false,
    loading: false,
    ...overrides,
  });

  const createSession = (
    index: number,
    scores: SessionScoreDto[],
    overrides: Partial<WheelSessionOutputDto> = {}
  ): WheelSessionOutputDto => ({
    id: `session-${index}`,
    userId: 'user-1',
    accountId: 'account-1',
    wheelId: 'wheel-1',
    wheelVersionId: 'version-1',
    scores,
    focusAtSubmit: [],
    locale: 'en',
    notes: null,
    submittedAt: `2026-01-${String(index).padStart(2, '0')}T00:00:00.000Z`,
    isDeleted: false,
    ...overrides,
  });

  const createSessions = (valuesByCategoryId: Record<string, number[]>): WheelSessionOutputDto[] => {
    const sessionCount = Math.max(...Object.values(valuesByCategoryId).map((values) => values.length));

    return Array.from({ length: sessionCount }, (_, index) => {
      const scores = Object.entries(valuesByCategoryId).map(([categoryId, values]) => ({
        categoryId,
        value: values[index],
      }));

      return createSession(index + 1, scores);
    });
  };

  describe('selectActiveWheelSessionsSorted', () => {
    it('should return no sessions when there is no active wheel', () => {
      const result = selectActiveWheelSessionsSorted.projector(null, [createSession(1, [{ categoryId: 'health', value: 8 }])]);

      expect(result).toEqual([]);
    });

    it('should filter sessions by active wheel id and sort them by submitted date ascending', () => {
      const matchingLater = createSession(2, [{ categoryId: 'health', value: 8 }], {
        id: 'matching-later',
        submittedAt: '2026-02-02T00:00:00.000Z',
      });
      const matchingEarlier = createSession(1, [{ categoryId: 'health', value: 6 }], {
        id: 'matching-earlier',
        submittedAt: '2026-02-01T00:00:00.000Z',
      });
      const otherWheel = createSession(3, [{ categoryId: 'health', value: 10 }], {
        id: 'other-wheel',
        wheelId: 'wheel-2',
        submittedAt: '2026-01-01T00:00:00.000Z',
      });

      const result = selectActiveWheelSessionsSorted.projector(createWheel(), [matchingLater, otherWheel, matchingEarlier]);

      expect(result.map((session) => session.id)).toEqual(['matching-earlier', 'matching-later']);
    });
  });

  describe('selectOverallTrend', () => {
    it('should return an empty analysis when there are no sessions', () => {
      const result = selectOverallTrend.projector([], [createCategory()], createWheel(), []);

      expect(result).toEqual({
        canAnalyse: false,
        sessionsCount: 0,
        visibleSeries: [],
        series: [],
        bullets: [],
        hasFocus: false,
      });
    });

    it('should allow analysis at five sessions but label category trends as insufficient data before six sessions', () => {
      const category = createCategory();
      const sessions = createSessions({ health: [1, 2, 3, 4, 5] });

      const result = selectOverallTrend.projector(sessions, [category], createWheel(), []);

      expect(result.canAnalyse).toBeTrue();
      expect(result.sessionsCount).toBe(5);
      expect(result.bullets).toEqual([
        jasmine.objectContaining({
          categoryId: 'health',
          categoryName: 'Health',
          label: 'insufficient_data',
          delta: 4,
        }),
      ]);
      expect(result.series[0].points).toEqual([
        { date: '2026-01-01T00:00:00.000Z', value: 1 },
        { date: '2026-01-02T00:00:00.000Z', value: 2 },
        { date: '2026-01-03T00:00:00.000Z', value: 3 },
        { date: '2026-01-04T00:00:00.000Z', value: 4 },
        { date: '2026-01-05T00:00:00.000Z', value: 5 },
      ]);
    });

    it('should classify increase, decline, stable, and volatile category trends', () => {
      const categories = [
        createCategory({ id: 'increase', name: 'Increase', color: '#111111', order: 0 }),
        createCategory({ id: 'decline', name: 'Decline', color: '#222222', order: 1 }),
        createCategory({ id: 'stable', name: 'Stable', color: '#333333', order: 2 }),
        createCategory({ id: 'volatile', name: 'Volatile', color: '#444444', order: 3 }),
      ];
      const sessions = createSessions({
        increase: [1, 2, 3, 4, 5, 6],
        decline: [6, 5, 4, 3, 2, 1],
        stable: [5, 5.1, 5, 5.1, 5, 5.1],
        volatile: [1, 9, 1, 9, 1, 1],
      });

      const result = selectOverallTrend.projector(sessions, categories, createWheel(), []);
      const labelsByCategoryId = Object.fromEntries(result.bullets.map((bullet) => [bullet.categoryId, bullet.label]));

      expect(labelsByCategoryId).toEqual({
        increase: 'increase',
        decline: 'decline',
        volatile: 'volatile',
        stable: 'stable',
      });
      expect(result.visibleSeries).toEqual(['Increase', 'Decline', 'Volatile']);
    });

    it('should use focused categories as the visible series when focus exists', () => {
      const categories = [
        createCategory({ id: 'health', name: 'Health', color: '#111111', order: 0 }),
        createCategory({ id: 'career', name: 'Career', color: '#222222', order: 1 }),
        createCategory({ id: 'family', name: 'Family', color: '#333333', order: 2 }),
      ];
      const sessions = createSessions({
        health: [1, 2, 3, 4, 5, 6],
        career: [6, 5, 4, 3, 2, 1],
        family: [5, 5, 5, 5, 5, 5],
      });

      const result = selectOverallTrend.projector(sessions, categories, createWheel(), [categories[2]]);

      expect(result.hasFocus).toBeTrue();
      expect(result.visibleSeries).toEqual(['Family']);
    });

    it('should treat missing category scores as zero values', () => {
      const category = createCategory({ id: 'health', name: 'Health' });
      const sessions = [
        createSession(1, [{ categoryId: 'health', value: 5 }]),
        createSession(2, []),
        createSession(3, [{ categoryId: 'health', value: 7 }]),
        createSession(4, []),
        createSession(5, [{ categoryId: 'health', value: 9 }]),
        createSession(6, []),
      ];

      const result = selectOverallTrend.projector(sessions, [category], createWheel(), []);

      expect(result.series[0].points.map((point) => point.value)).toEqual([5, 0, 7, 0, 9, 0]);
      expect(result.bullets[0]).toEqual(
        jasmine.objectContaining({
          categoryId: 'health',
          delta: -5,
          label: 'volatile',
        })
      );
    });
  });
});
