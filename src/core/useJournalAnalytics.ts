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

export function computeJournalAnalytics(relevantSessions: BrewSession[]): JournalAnalyticsResult {
  const totalBrews = relevantSessions.length;
  const totalDoseGrams = relevantSessions.reduce((acc, s) => acc + (s.doseGrams || 0), 0);
  const totalWaterGrams = relevantSessions.reduce((acc, s) => acc + (s.waterGrams || 0), 0);
  const totalWaterLiters = (totalWaterGrams / 1000).toFixed(1);
  const totalCaffeineMg = Math.round(relevantSessions.reduce((acc, s) => acc + (s.caffeineContentMg || 0), 0));
  const ratedSessions = relevantSessions.filter((s) => typeof s.rating === 'number' && s.rating > 0);
  const avgRating =
    ratedSessions.length > 0
      ? (ratedSessions.reduce((acc, s) => acc + s.rating!, 0) / ratedSessions.length).toFixed(1)
      : '—';

  // Rozkład metod
  const methodCounts: Record<string, number> = {};
  for (const s of relevantSessions) {
    const m = s.method || 'Inna';
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
  const sensorySessions = relevantSessions.filter((s) => s.sensory);
  let avgSensory: SensoryProfile | null = null;
  if (sensorySessions.length > 0) {
    const sumSensory = sensorySessions.reduce(
      (acc, s) => {
        const sc = s.sensory!;
        return {
          acidity: acc.acidity + (sc.acidity || 0),
          sweetness: acc.sweetness + (sc.sweetness || 0),
          body: acc.body + (sc.body || 0),
          clarity: acc.clarity + (sc.clarity || 0),
          finish: acc.finish + (sc.finish || 0),
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
  for (const s of relevantSessions) {
    if (s.tasteBalance && balanceCounts[s.tasteBalance] !== undefined) {
      balanceCounts[s.tasteBalance]++;
    }
  }

  // Nuty smakowe (Top flavor tags)
  const tagCounts: Record<string, number> = {};
  for (const s of relevantSessions) {
    if (s.flavorTags && Array.isArray(s.flavorTags)) {
      for (const t of s.flavorTags) {
        tagCounts[t] = (tagCounts[t] || 0) + 1;
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

export function useJournalAnalytics(relevantSessions: BrewSession[]): JournalAnalyticsResult {
  return useMemo(() => computeJournalAnalytics(relevantSessions), [relevantSessions]);
}
