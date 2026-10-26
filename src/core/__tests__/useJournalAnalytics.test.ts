// ============================================================================
// Apps4Brew Studio — Unit Tests: useJournalAnalytics / computeJournalAnalytics
// TASK-P12-07-JAK
// ============================================================================

import { computeJournalAnalytics } from '../useJournalAnalytics';
import { BrewSession } from '../database-schema';

describe('useJournalAnalytics / computeJournalAnalytics', () => {
  test('zwraca bezpieczne wartości domyślne dla null, undefined i pustej tablicy', () => {
    const fromNull = computeJournalAnalytics(null);
    expect(fromNull.totalBrews).toBe(0);
    expect(fromNull.totalDoseGrams).toBe(0);
    expect(fromNull.totalWaterLiters).toBe('0.0');
    expect(fromNull.totalCaffeineMg).toBe(0);
    expect(fromNull.avgRating).toBe('—');
    expect(fromNull.avgSensory).toBeNull();
    expect(fromNull.sensoryCount).toBe(0);
    expect(fromNull.methodsList).toEqual([]);
    expect(fromNull.topFlavorTags).toEqual([]);

    const fromUndefined = computeJournalAnalytics(undefined);
    expect(fromUndefined.totalBrews).toBe(0);
    expect(fromUndefined.totalWaterLiters).toBe('0.0');

    const fromEmpty = computeJournalAnalytics([]);
    expect(fromEmpty.totalBrews).toBe(0);
  });

  test('odporność na wartości NaN, null oraz uszkodzone obiekty sesji', () => {
    const corruptSessions = [
      null as any,
      undefined as any,
      {
        id: 'sess-corrupt-1',
        recipeName: 'Corrupt 1',
        beverageType: 'COFFEE',
        method: '',
        doseGrams: NaN,
        waterGrams: Infinity,
        caffeineContentMg: -50,
        rating: NaN,
      } as any,
      {
        id: 'sess-corrupt-2',
        recipeName: 'Corrupt 2',
        beverageType: 'COFFEE',
        method: 'V60',
        doseGrams: 15,
        waterGrams: 250,
        caffeineContentMg: 120,
        rating: 5,
      } as any,
    ];

    const result = computeJournalAnalytics(corruptSessions);
    expect(result.totalBrews).toBe(2);
    expect(result.totalDoseGrams).toBe(15);
    expect(result.totalWaterLiters).toBe('0.3');
    expect(result.totalCaffeineMg).toBe(120);
    expect(result.avgRating).toBe('5.0');
    expect(result.methodsList).toEqual([
      { method: 'Inna', count: 1, percent: 50 },
      { method: 'V60', count: 1, percent: 50 },
    ]);
  });

  test('poprawnie agreguje sensorykę, balans smaku oraz tagi smakowe', () => {
    const sessions: BrewSession[] = [
      {
        id: 'sess-1',
        recipeName: 'Etiopia V60',
        beverageType: 'COFFEE',
        method: 'V60',
        doseGrams: 18,
        waterGrams: 300,
        waterTempCelsius: 93,
        totalTimeSeconds: 170,
        flavorTags: ['jaśmin', 'bergamotka'],
        brewedAt: '2026-10-25T08:00:00Z',
        rating: 4.5,
        caffeineContentMg: 140,
        tasteBalance: 'balanced',
        sensory: {
          acidity: 4,
          sweetness: 4,
          body: 2,
          clarity: 5,
          finish: 4,
        },
      },
      {
        id: 'sess-2',
        recipeName: 'Kenia Aeropress',
        beverageType: 'COFFEE',
        method: 'Aeropress',
        doseGrams: 14,
        waterGrams: 200,
        waterTempCelsius: 85,
        totalTimeSeconds: 120,
        flavorTags: ['czarna porzeczka', 'jaśmin'],
        brewedAt: '2026-10-25T14:00:00Z',
        rating: 5,
        caffeineContentMg: 110,
        tasteBalance: 'balanced',
        sensory: {
          acidity: 5,
          sweetness: 3,
          body: 3,
          clarity: 4,
          finish: 4,
        },
      },
    ];

    const res = computeJournalAnalytics(sessions);
    expect(res.totalBrews).toBe(2);
    expect(res.totalDoseGrams).toBe(32);
    expect(res.totalWaterLiters).toBe('0.5');
    expect(res.totalCaffeineMg).toBe(250);
    expect(res.avgRating).toBe('4.8');

    expect(res.avgSensory).toEqual({
      acidity: 4.5,
      sweetness: 3.5,
      body: 2.5,
      clarity: 4.5,
      finish: 4.0,
    });
    expect(res.sensoryCount).toBe(2);
    expect(res.balanceCounts.balanced).toBe(2);
    expect(res.balanceCounts.sour).toBe(0);

    expect(res.topFlavorTags[0]).toEqual({ tag: 'jaśmin', count: 2 });
    expect(res.topFlavorTags.some((t) => t.tag === 'bergamotka')).toBe(true);
    expect(res.topFlavorTags.some((t) => t.tag === 'czarna porzeczka')).toBe(true);
  });
});
