import { selectActiveWheelSessions, selectHistorySummaryVm, selectSessionsByWheelId } from './sessions-history.selectors';

describe('sessions history selectors', () => {
  const createSession = (index: number, overrides: Partial<WheelSessionOutputDto> = {}): WheelSessionOutputDto => ({
    id: `session-${index}`,
    userId: 'user-1',
    accountId: 'account-1',
    wheelId: 'wheel-1',
    wheelVersionId: 'version-1',
    scores: [],
    focusAtSubmit: [],
    locale: 'en',
    notes: null,
    submittedAt: `2026-01-${String(index).padStart(2, '0')}T00:00:00.000Z`,
    isDeleted: false,
    ...overrides,
  });

  describe('selectSessionsByWheelId', () => {
    it('should return no sessions when sessions are missing or wheel id is empty', () => {
      const emptyWheelIdSelector = selectSessionsByWheelId('');
      const wheelSelector = selectSessionsByWheelId('wheel-1');

      expect(emptyWheelIdSelector.projector([createSession(1)])).toEqual([]);
      expect(wheelSelector.projector(null as unknown as WheelSessionOutputDto[])).toEqual([]);
    });

    it('should filter sessions by wheel id and sort them by submitted date descending', () => {
      const matchingEarlier = createSession(1, {
        id: 'matching-earlier',
        submittedAt: '2026-02-01T00:00:00.000Z',
      });
      const matchingLater = createSession(2, {
        id: 'matching-later',
        submittedAt: '2026-02-03T00:00:00.000Z',
      });
      const otherWheel = createSession(3, {
        id: 'other-wheel',
        wheelId: 'wheel-2',
        submittedAt: '2026-02-05T00:00:00.000Z',
      });

      const result = selectSessionsByWheelId('wheel-1').projector([matchingEarlier, otherWheel, matchingLater]);

      expect(result.map((session) => session.id)).toEqual(['matching-later', 'matching-earlier']);
    });
  });

  describe('selectActiveWheelSessions', () => {
    it('should return no sessions when sessions are missing or there is no active wheel id', () => {
      expect(selectActiveWheelSessions.projector(null, [createSession(1)])).toEqual([]);
      expect(selectActiveWheelSessions.projector('wheel-1', null as unknown as WheelSessionOutputDto[])).toEqual([]);
    });

    it('should filter sessions by active wheel id and sort them by submitted date descending', () => {
      const matchingEarlier = createSession(1, {
        id: 'matching-earlier',
        submittedAt: '2026-03-01T00:00:00.000Z',
      });
      const matchingLater = createSession(2, {
        id: 'matching-later',
        submittedAt: '2026-03-15T00:00:00.000Z',
      });
      const otherWheel = createSession(3, {
        id: 'other-wheel',
        wheelId: 'wheel-2',
        submittedAt: '2026-03-20T00:00:00.000Z',
      });

      const result = selectActiveWheelSessions.projector('wheel-1', [matchingEarlier, otherWheel, matchingLater]);

      expect(result.map((session) => session.id)).toEqual(['matching-later', 'matching-earlier']);
    });
  });

  describe('selectHistorySummaryVm', () => {
    it('should return an empty summary when there are no sessions', () => {
      const result = selectHistorySummaryVm.projector([]);

      expect(result).toEqual({
        sessionsCount: 0,
        notesCount: 0,
        lastSessionDate: null,
        firstSessionDate: null,
        durationMonths: null,
      });
    });

    it('should summarize one session with matching first and last dates and zero duration months', () => {
      const session = createSession(1, {
        notes: 'A useful note',
        submittedAt: '2026-04-10T00:00:00.000Z',
      });

      const result = selectHistorySummaryVm.projector([session]);

      expect(result).toEqual({
        sessionsCount: 1,
        notesCount: 1,
        lastSessionDate: new Date('2026-04-10T00:00:00.000Z'),
        firstSessionDate: new Date('2026-04-10T00:00:00.000Z'),
        durationMonths: 0,
      });
    });

    it('should count only non-empty notes and calculate inclusive duration months across years', () => {
      const sessions = [
        createSession(3, {
          id: 'latest',
          notes: 'Latest note',
          submittedAt: '2026-02-20T00:00:00.000Z',
        }),
        createSession(2, {
          id: 'middle',
          notes: '   ',
          submittedAt: '2026-01-10T00:00:00.000Z',
        }),
        createSession(1, {
          id: 'earliest',
          notes: 'Earliest note',
          submittedAt: '2025-12-05T00:00:00.000Z',
        }),
      ];

      const result = selectHistorySummaryVm.projector(sessions);

      expect(result).toEqual({
        sessionsCount: 3,
        notesCount: 2,
        lastSessionDate: new Date('2026-02-20T00:00:00.000Z'),
        firstSessionDate: new Date('2025-12-05T00:00:00.000Z'),
        durationMonths: 3,
      });
    });

    it('should return one duration month when multiple sessions are in the same month', () => {
      const sessions = [
        createSession(2, { submittedAt: '2026-05-25T00:00:00.000Z' }),
        createSession(1, { submittedAt: '2026-05-01T00:00:00.000Z' }),
      ];

      const result = selectHistorySummaryVm.projector(sessions);

      expect(result.durationMonths).toBe(1);
    });
  });
});
