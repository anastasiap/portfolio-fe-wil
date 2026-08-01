import { createSelector } from '@ngrx/store';
import { selectActiveWheel, selectSessions } from './selectors';

export interface HistorySummary {
  sessionsCount: number;
  notesCount: number;
  lastSessionDate: Date | null;
  firstSessionDate: Date | null;
  durationMonths: number | null; // null when <2 sessions
}

/**
 * Selector factory that returns sessions for a specific wheel ID, sorted by submittedAt desc
 */
export const selectSessionsByWheelId = (wheelId: string) =>
  createSelector(selectSessions, (sessions) => {
    if (!sessions || !wheelId) return [];

    return sessions
      .filter((session) => session.wheelId === wheelId)
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  });

/**
 * Selector that returns the active wheel ID or null
 */
export const selectActiveWheelId = createSelector(selectActiveWheel, (wheel) => wheel?.id ?? null);

/**
 * Selector that returns sessions for the currently active wheel, sorted by submittedAt desc
 */
export const selectActiveWheelSessions = createSelector(selectActiveWheelId, selectSessions, (activeWheelId, sessions) => {
  if (!sessions || !activeWheelId) return [];
  return sessions
    .filter((session) => session.wheelId === activeWheelId)
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
});

/**
 * Selector that returns a history summary view model for the active wheel
 */
export const selectHistorySummaryVm = createSelector(selectActiveWheelSessions, (sessions): HistorySummary => {
  const sessionsCount = sessions.length;

  if (sessionsCount === 0) {
    return {
      sessionsCount: 0,
      notesCount: 0,
      lastSessionDate: null,
      firstSessionDate: null,
      durationMonths: null,
    };
  }

  // Count sessions with notes that have content
  const notesCount = sessions.filter((session) => session.notes?.trim && session.notes.trim().length > 0).length;

  // Get first and last session dates (sessions are already sorted desc)
  const lastSessionDate = new Date(sessions[0].submittedAt);
  const firstSessionDate = sessionsCount > 1 ? new Date(sessions[sessionsCount - 1].submittedAt) : lastSessionDate;

  // Calculate duration in months
  let durationMonths = 0;
  if (sessionsCount >= 2) {
    const yearsDiff = lastSessionDate.getFullYear() - firstSessionDate.getFullYear();
    const monthsDiff = lastSessionDate.getMonth() - firstSessionDate.getMonth();
    // If both sessions are in the same month/year, durationMonths = 0 (this month)
    // If sessions span multiple months, calculate the actual difference
    durationMonths = Math.max(0, yearsDiff * 12 + monthsDiff) + 1;
  }

  return {
    sessionsCount,
    notesCount,
    lastSessionDate,
    firstSessionDate,
    durationMonths,
  };
});
