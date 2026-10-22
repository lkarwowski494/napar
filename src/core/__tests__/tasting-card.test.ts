// ============================================================================
// Napar (Steepwise) — Testy modelu karty degustacyjnej (poz. 31 MVP)
// Składanie danych z sesji: pola opcjonalne, puste napisy, zakresy EY i oceny.
// ============================================================================

import {
  TASTING_BALANCE_CODES,
  buildTastingCardModel,
  formatTastingDuration,
  formatTastingRating,
  formatTastingYield,
} from '../tasting-card';
import type { BrewSession } from '../database-schema';

const fullSession: BrewSession = {
  id: 'sess-1',
  recipeName: 'V60 Hoffmann',
  inventoryItemName: 'Kenya Nyeri',
  beverageType: 'COFFEE',
  method: 'V60',
  doseGrams: 15,
  waterGrams: 250,
  waterTempCelsius: 95,
  totalTimeSeconds: 195,
  rating: 4.5,
  flavorTags: ['porzeczka', 'miód'],
  tasteBalance: 'balanced',
  extractionYieldPercentage: 20.4,
  notes: '  Soczyste, długi finisz  ',
  brewedAt: '2026-10-20T08:30:00.000Z',
};

const minimalSession: BrewSession = {
  id: 'sess-2',
  beverageType: 'TEA',
  method: 'GONGFU',
  doseGrams: 7,
  waterGrams: 110,
  waterTempCelsius: 96,
  totalTimeSeconds: 0,
  flavorTags: [],
  brewedAt: '2026-10-21T09:00:00.000Z',
};

describe('Karta degustacyjna: model z sesji (poz. 31 MVP)', () => {
  test('pełna sesja trafia do modelu z przycięciem notatek', () => {
    const model = buildTastingCardModel(fullSession);
    expect(model).toEqual({
      title: 'V60 Hoffmann',
      beverageType: 'COFFEE',
      method: 'V60',
      brewedAtIso: '2026-10-20T08:30:00.000Z',
      inventoryName: 'Kenya Nyeri',
      doseGrams: 15,
      waterGrams: 250,
      waterTempCelsius: 95,
      totalTimeSeconds: 195,
      rating: 4.5,
      balance: 'balanced',
      extractionYieldPercent: 20.4,
      flavorTags: ['porzeczka', 'miód'],
      notes: 'Soczyste, długi finisz',
    });
  });

  test('bez nazwy receptury tytułem jest metoda parzenia', () => {
    const model = buildTastingCardModel({ ...fullSession, recipeName: '   ' });
    expect(model.title).toBe('V60');
  });

  test('brak nazwy receptury (null) też przechodzi na metodę', () => {
    const model = buildTastingCardModel({ ...fullSession, recipeName: null as unknown as undefined });
    expect(model.title).toBe('V60');
  });

  test('sesja minimalna: pola opcjonalne jako null, nuty puste', () => {
    const model = buildTastingCardModel(minimalSession);
    expect(model.title).toBe('GONGFU');
    expect(model.inventoryName).toBeNull();
    expect(model.rating).toBeNull();
    expect(model.balance).toBeNull();
    expect(model.extractionYieldPercent).toBeNull();
    expect(model.notes).toBeNull();
    expect(model.flavorTags).toEqual([]);
  });

  test('ocena 0 i brak oceny dają null', () => {
    expect(buildTastingCardModel({ ...fullSession, rating: 0 }).rating).toBeNull();
    expect(buildTastingCardModel({ ...fullSession, rating: undefined }).rating).toBeNull();
  });

  test('EY: wartość dodatnia przechodzi, zero i wartości ujemne są pomijane', () => {
    expect(buildTastingCardModel({ ...fullSession, extractionYieldPercentage: 0 }).extractionYieldPercent).toBeNull();
    expect(buildTastingCardModel({ ...fullSession, extractionYieldPercentage: -1 }).extractionYieldPercent).toBeNull();
    expect(buildTastingCardModel({ ...fullSession, extractionYieldPercentage: 19.8 }).extractionYieldPercent).toBe(19.8);
  });

  test('balans: tylko znane kody, reszta jako null', () => {
    for (const code of TASTING_BALANCE_CODES) {
      expect(buildTastingCardModel({ ...fullSession, tasteBalance: code }).balance).toBe(code);
    }
    expect(buildTastingCardModel({ ...fullSession, tasteBalance: 'ideal' }).balance).toBeNull();
    expect(buildTastingCardModel({ ...fullSession, tasteBalance: undefined }).balance).toBeNull();
  });

  test('notatki z samych spacji i brak notatek dają null', () => {
    expect(buildTastingCardModel({ ...fullSession, notes: '   ' }).notes).toBeNull();
    expect(buildTastingCardModel({ ...fullSession, notes: undefined }).notes).toBeNull();
    expect(buildTastingCardModel({ ...fullSession, notes: null as unknown as undefined }).notes).toBeNull();
  });

  test('lista nut jest kopią, nie tą samą referencją', () => {
    const model = buildTastingCardModel(fullSession);
    expect(model.flavorTags).toEqual(fullSession.flavorTags);
    expect(model.flavorTags).not.toBe(fullSession.flavorTags);
  });

  test('brak listy nut w sesji daje pustą listę', () => {
    const model = buildTastingCardModel({ ...fullSession, flavorTags: undefined as unknown as string[] });
    expect(model.flavorTags).toEqual([]);
  });

  test('pusty napis jako nazwa magazynu daje null', () => {
    expect(buildTastingCardModel({ ...fullSession, inventoryItemName: '' }).inventoryName).toBeNull();
  });
});

describe('Karta degustacyjna: formatowanie wartości', () => {
  test('czas w formacie m:ss, także powyżej 59 minut', () => {
    expect(formatTastingDuration(0)).toBe('0:00');
    expect(formatTastingDuration(65)).toBe('1:05');
    expect(formatTastingDuration(195)).toBe('3:15');
    expect(formatTastingDuration(3725)).toBe('62:05');
  });

  test('ocena i EY z jednym miejscem po przecinku', () => {
    expect(formatTastingRating(4.5)).toBe('4.5');
    expect(formatTastingRating(5)).toBe('5.0');
    expect(formatTastingYield(20.44)).toBe('20.4');
  });
});
