// ============================================================================
// Napar (Steepwise) — useJournalAnalytics Hook / Helper
// Aggregation of brew analytics, sensory averages, taste balance & flavor tags
// ============================================================================

import { useMemo } from 'react';
import { BrewSession } from './database-schema';
import { SensoryProfile } from './radar-chart';

export interface JournalAnalyticsResult {
  totalBrews: number;
  totalDoseGrams: number;
  totalWaterLiters: string;
  totalCaffeineMg: number;
  avgRating: string;
  methodsList: { method: string; count: number; percent: number }[];
  avgSensory: SensoryProfile | null;
  sensoryCount: number;
  balanceCounts: Record<string, number>;
  topTags: { tag: string; count: number }[];
  topFlavorTags: { tag: string; count: number }[];
}

export function computeJournalAnalytics(relevantSessions?: BrewSession[] | null): JournalAnalyticsResult {
  const safeSessions = Array.isArray(relevantSessions)
    ? relevantSessions.filter((s): s is BrewSession => !!s && typeof s === 'object')
    : [];

  const totalBrews = safeSessions.length;
  const totalDoseGrams = safeSessions.reduce((acc, s) => {
    const d = typeof s.doseGrams === 'number' && Number.isFinite(s.doseGrams) && s.doseGrams > 0 ? s.doseGrams : 0;
    return acc + d;
  }, 0);
  const totalWaterGrams = safeSessions.reduce((acc, s) => {
    const w = typeof s.waterGrams === 'number' && Number.isFinite(s.waterGrams) && s.waterGrams > 0 ? s.waterGrams : 0;
    return acc + w;
  }, 0);
  const totalWaterLiters = (totalWaterGrams / 1000).toFixed(1);
  const totalCaffeineMg = Math.round(
    safeSessions.reduce((acc, s) => {
      const c =
        typeof s.caffeineContentMg === 'number' && Number.isFinite(s.caffeineContentMg) && s.caffeineContentMg > 0
          ? s.caffeineContentMg
          : 0;
      return acc + c;
    }, 0)
  );

  const ratedSessions = safeSessions.filter(
    (s) => typeof s.rating === 'number' && Number.isFinite(s.rating) && s.rating > 0
  );
  const avgRating =
    ratedSessions.length > 0
      ? (ratedSessions.reduce((acc, s) => acc + s.rating!, 0) / ratedSessions.length).toFixed(1)
      : '—';

  // Rozkład metod
  const methodCounts: Record<string, number> = {};
  for (const s of safeSessions) {
    const m = typeof s.method === 'string' && s.method.trim() ? s.method.trim() : 'Inna';
    methodCounts[m] = (methodCounts[m] || 0) + 1;
  }
  const methodsList = Object.entries(methodCounts)
    .map(([method, count]) => ({
      method,
      count,
      percent: totalBrews > 0 ? Math.round((count / totalBrews) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  // Średni radar sensoryczny
  const sensorySessions = safeSessions.filter((s) => s.sensory && typeof s.sensory === 'object');
  let avgSensory: SensoryProfile | null = null;
  if (sensorySessions.length > 0) {
    const sumSensory = sensorySessions.reduce(
      (acc, s) => {
        const sc = s.sensory!;
        const num = (val: unknown) =>
          typeof val === 'number' && Number.isFinite(val) && val >= 0 ? val : 0;
        return {
          acidity: acc.acidity + num(sc.acidity),
          sweetness: acc.sweetness + num(sc.sweetness),
          body: acc.body + num(sc.body),
          clarity: acc.clarity + num(sc.clarity),
          finish: acc.finish + num(sc.finish),
        };
      },
      { acidity: 0, sweetness: 0, body: 0, clarity: 0, finish: 0 }
    );
    const n = sensorySessions.length;
    avgSensory = {
      acidity: Number((sumSensory.acidity / n).toFixed(1)),
      sweetness: Number((sumSensory.sweetness / n).toFixed(1)),
      body: Number((sumSensory.body / n).toFixed(1)),
      clarity: Number((sumSensory.clarity / n).toFixed(1)),
      finish: Number((sumSensory.finish / n).toFixed(1)),
    };
  }

  // Rozkład balansu smaku
  const balanceCounts: Record<string, number> = {
    balanced: 0,
    sour: 0,
    bitter: 0,
    astringent: 0,
    weak: 0,
    too_strong: 0,
  };
  for (const s of safeSessions) {
    if (s.tasteBalance && balanceCounts[s.tasteBalance] !== undefined) {
      balanceCounts[s.tasteBalance]++;
    }
  }

  // Nuty smakowe (Top flavor tags)
  const tagCounts: Record<string, number> = {};
  for (const s of safeSessions) {
    if (s.flavorTags && Array.isArray(s.flavorTags)) {
      for (const t of s.flavorTags) {
        if (typeof t === 'string' && t.trim()) {
          const tag = t.trim();
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        }
      }
    }
  }
  const topFlavorTags = Object.entries(tagCounts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    totalBrews,
    totalDoseGrams,
    totalWaterLiters,
    totalCaffeineMg,
    avgRating,
    methodsList,
    avgSensory,
    sensoryCount: sensorySessions.length,
    balanceCounts,
    topTags: topFlavorTags,
    topFlavorTags,
  };
}

export function useJournalAnalytics(relevantSessions?: BrewSession[] | null): JournalAnalyticsResult {
  return useMemo(() => computeJournalAnalytics(relevantSessions), [relevantSessions]);
}
