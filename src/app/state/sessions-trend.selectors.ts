import { createSelector } from '@ngrx/store';
import { selectActiveWheel, selectCategories, selectFocusedCategories, selectSessions } from './selectors';
import { OverallTrend, TrendBullet, TrendLabel, TrendPoint, TrendSeries } from './typings';

/**
 * Filter sessions by active wheel ID and sort by submission date
 */
export const selectActiveWheelSessionsSorted = createSelector(selectActiveWheel, selectSessions, (activeWheel, sessions) => {
  if (!activeWheel) {
    return [];
  }

  return sessions
    .filter((session) => session.wheelId === activeWheel.id)
    .sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime());
});

/**
 * Compute overall trend analysis for sessions
 */
export const selectOverallTrend = createSelector(
  selectActiveWheelSessionsSorted,
  selectCategories,
  selectActiveWheel,
  selectFocusedCategories,
  (sessions, categories, activeWheel, focusedCategories): OverallTrend => {
    // Early return if no sessions
    if (sessions.length === 0) {
      return {
        canAnalyse: false,
        sessionsCount: 0,
        visibleSeries: [],
        series: [],
        bullets: [],
        hasFocus: false,
      };
    }

    const canAnalyse = sessions.length >= 5;
    const allBullets: TrendBullet[] = [];
    const allSeries: TrendSeries[] = [];

    // Build raw value arrays and compute trends for each category
    for (const category of categories) {
      const rawValues: number[] = [];
      const points: TrendPoint[] = [];

      // Extract values for this category from each session
      for (const session of sessions) {
        const scoreDto = session.scores.find((score) => score.categoryId === category.id);
        const value = scoreDto?.value || 0;
        rawValues.push(value);
      }

      // Skip categories with no data
      if (rawValues.length === 0) continue;

      // Compute smoothed values using moving average
      // const smoothedValues = movingAverage(rawValues);
      const smoothedValues = rawValues;

      // Create trend points with smoothed values
      smoothedValues.forEach((value, index) => {
        points.push({
          date: sessions[index].submittedAt,
          value,
        });
      });

      // Calculate delta (first vs last smoothed value)
      const delta =
        smoothedValues.length >= 2 ? Math.round((smoothedValues[smoothedValues.length - 1] - smoothedValues[0]) * 100) / 100 : 0;

      // Calculate volatility
      const volatility = calculateVolatility(rawValues);
      const directionConsistency = calculateDirectionConsistency(rawValues);
      const label = classifyTrend(delta, volatility, directionConsistency, sessions.length);

      // Create bullet point
      const bullet: TrendBullet = {
        categoryId: category.id,
        categoryName: category.name,
        label,
        delta,
        volatility,
      };

      allBullets.push(bullet);

      // Create trend series
      const series: TrendSeries = {
        categoryId: category.id,
        categoryName: category.name,
        categoryColor: category.color,
        points,
      };

      allSeries.push(series);
    }

    // Determine visible categories for series
    let visibleCategoriesIds: string[];

    if (focusedCategories.length > 0) {
      // Use focused categories if available
      visibleCategoriesIds = focusedCategories.map((cat) => cat.id);
    } else {
      // Fallback logic: top categories by absolute delta + top by volatility
      const sortedByDelta = [...allBullets].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
      const sortedByVolatility = [...allBullets].sort((a, b) => b.volatility - a.volatility);

      const topDeltaIds = sortedByDelta.slice(0, 2).map((b) => b.categoryId);
      const topVolatilityIds = sortedByVolatility.slice(0, 2).map((b) => b.categoryId);

      // Combine and make unique, max 4 categories
      const combinedIds = [...topDeltaIds, ...topVolatilityIds];
      visibleCategoriesIds = Array.from(new Set(combinedIds)).slice(0, 4);
    }

    // Filter series for visible categories
    const visibleSeries = allSeries.filter((series) => visibleCategoriesIds.includes(series.categoryId));

    // Get top 3 bullets by absolute delta or volatility for summary
    const topBullets = [...allBullets].sort((a, b) => {
      const aScore = Math.abs(a.delta) + a.volatility;
      const bScore = Math.abs(b.delta) + b.volatility;
      return bScore - aScore;
    });

    return {
      canAnalyse,
      sessionsCount: sessions.length,
      visibleSeries: visibleSeries.map((s) => s.categoryName),
      series: allSeries,
      bullets: topBullets,
      hasFocus: Boolean(focusedCategories.length),
    };
  }
);

function calculateDirectionConsistency(values: number[]): number {
  if (values.length < 2) return 0;

  const delta = values[values.length - 1] - values[0];
  const direction = delta > 0 ? 1 : delta < 0 ? -1 : 0;
  if (direction === 0) return 0;

  let same = 0;
  let total = 0;

  for (let i = 1; i < values.length; i++) {
    const diff = values[i] - values[i - 1];
    if (diff === 0) continue;
    total++;
    if ((diff > 0 ? 1 : -1) === direction) same++;
  }

  return total === 0 ? 0 : same / total; // 0..1
}

function classifyTrend(delta: number, volatility: number, directionConsistency: number, sessionsCount: number): TrendLabel {
  if (sessionsCount < 6) return 'insufficient_data';

  const DELTA_THRESHOLD = 1; // your current rule
  const VOL_THRESHOLD = 1.3; // your current rule (works fine with std dev on 1..10)
  const CONSISTENCY_THRESHOLD = 0.7;

  // If the overall change is meaningful and the path is mostly one-directional: it's a real trend
  if (delta >= DELTA_THRESHOLD && directionConsistency >= CONSISTENCY_THRESHOLD) return 'increase';
  if (delta <= -DELTA_THRESHOLD && directionConsistency >= CONSISTENCY_THRESHOLD) return 'decline';

  // Otherwise volatility decides
  if (volatility >= VOL_THRESHOLD) return 'volatile';

  return 'stable';
}

/**
 * Volatility calculation using average absolute step change
 * Volatility = average(|v[i] - v[i-1]|)
 */
function calculateVolatility(values: number[]): number {
  if (values.length < 2) return 0;

  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const variance = values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / values.length;

  return Math.round(Math.sqrt(variance) * 100) / 100;
}
