// ============================================================================
// Napar (Steepwise) — Unit Tests: eksport CSV i ochrona przed wstrzykiwaniem formuł
// ============================================================================

import {
  buildInventoryCsv,
  buildSessionsCsv,
  escapeCsvCell,
  FORMULA_PREFIX_CHARS,
  INVENTORY_CSV_HEADERS,
  SESSIONS_CSV_HEADERS,
} from '../csv-export';
import type { BrewSession, InventoryItem } from '../database-schema';

describe('escapeCsvCell: ochrona przed wstrzykiwaniem formuł (NFR-SEC-015)', () => {
  test.each([
    ['=', '='],
    ['+', '+'],
    ['-', '-'],
    ['@', '@'],
    ['\t', 'tab'],
    ['\r', 'CR'],
  ])('wartość zaczynająca się od znaku %s (%s) dostaje prefiks apostrofu', (char) => {
    // Prefiks zawiera apostrof, więc komórka jest zawsze zawijana w cudzysłowy
    expect(escapeCsvCell(`${char}SUM(A1)`)).toBe(`"'${char}SUM(A1)"`);
  });

  test('prefiks obejmuje też ujemne liczby (bez wyjątku)', () => {
    expect(escapeCsvCell(-5)).toBe(`"'-5"`);
    expect(escapeCsvCell('-1.5')).toBe(`"'-1.5"`);
  });

  test('lista znaków niebezpiecznych jest kompletna', () => {
    expect([...FORMULA_PREFIX_CHARS].sort()).toEqual(['\t', '\r', '+', '-', '=', '@'].sort());
  });

  test('wartość bez znaku niebezpiecznego nie dostaje prefiksu', () => {
    expect(escapeCsvCell('Kenia AA')).toBe('Kenia AA');
    expect(escapeCsvCell(15)).toBe('15');
  });
});

describe('escapeCsvCell: escapowanie CSV', () => {
  test('przecinek, cudzysłów, nowa linia i apostrof zawijają wartość w cudzysłowy', () => {
    expect(escapeCsvCell('a,b')).toBe('"a,b"');
    expect(escapeCsvCell('say "hi"')).toBe('"say ""hi"""');
    expect(escapeCsvCell('linia\ndruga')).toBe('"linia\ndruga"');
    expect(escapeCsvCell('wiersz\rkoniec')).toBe('"wiersz\rkoniec"');
    expect(escapeCsvCell("O'Brien")).toBe(`"O'Brien"`);
  });

  test('wartości puste, null i undefined', () => {
    expect(escapeCsvCell(null)).toBe('');
    expect(escapeCsvCell(undefined)).toBe('');
    expect(escapeCsvCell('')).toBe('');
    expect(escapeCsvCell(0)).toBe('0');
    expect(escapeCsvCell(false)).toBe('false');
  });

  test('zabezpieczenie i escapowanie działają razem', () => {
    expect(escapeCsvCell('=HYPERLINK("x","y")')).toBe(`"'=HYPERLINK(""x"",""y"")"`);
  });
});

function session(overrides: Partial<BrewSession> = {}): BrewSession {
  return {
    id: 's1',
    beverageType: 'COFFEE',
    method: 'V60',
    doseGrams: 15,
    waterGrams: 250,
    waterTempCelsius: 94,
    totalTimeSeconds: 180,
    flavorTags: [],
    brewedAt: '2026-10-22T07:00:00.000Z',
    ...overrides,
  };
}

describe('buildSessionsCsv', () => {
  test('pusta lista zwraca tylko nagłówki', () => {
    expect(buildSessionsCsv([])).toBe(SESSIONS_CSV_HEADERS.join(','));
  });

  test('wiersz z pełnymi danymi i wartościami domyślnymi', () => {
    const full = session({
      recipeName: 'V60 domowe',
      inventoryItemName: 'Kenia',
      rating: 4,
      tasteBalance: 'balanced',
      tdsPercentage: 1.4,
      extractionYieldPercentage: 20,
      caffeineContentMg: 95,
      flavorTags: ['owoce', 'miód'],
      notes: 'Notatka',
    });
    const bare = session({ id: 's2', flavorTags: undefined as unknown as string[] });
    const [header, rowFull, rowBare] = buildSessionsCsv([full, bare]).split('\n');
    expect(header).toBe(SESSIONS_CSV_HEADERS.join(','));
    expect(rowFull).toBe('s1,2026-10-22T07:00:00.000Z,COFFEE,V60,V60 domowe,Kenia,15,250,94,180,4,balanced,1.4,20,95,owoce; miód,Notatka');
    expect(rowBare).toBe('s2,2026-10-22T07:00:00.000Z,COFFEE,V60,,,15,250,94,180,,,,,,,');
  });

  test('złośliwe wartości w komórkach są neutralizowane', () => {
    const evil = session({ notes: '=cmd|"/c calc"!A1', recipeName: '+1+1' });
    const row = buildSessionsCsv([evil]).split('\n')[1];
    expect(row).toContain(`"'+1+1"`);
    expect(row).toContain(`"'=cmd|""/c calc""!A1"`);
  });
});

function item(overrides: Partial<InventoryItem> = {}): InventoryItem {
  return {
    id: 'i1',
    name: 'Kenia',
    type: 'coffee',
    initialWeightGrams: 250,
    remainingWeightGrams: 100,
    flavorNotes: [],
    isFavorite: false,
    isArchived: false,
    createdAt: '2026-10-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('buildInventoryCsv', () => {
  test('pusta lista zwraca tylko nagłówki', () => {
    expect(buildInventoryCsv([])).toBe(INVENTORY_CSV_HEADERS.join(','));
  });

  test('brak listy notatek daje pustą komórkę', () => {
    const [, row] = buildInventoryCsv([item({ flavorNotes: undefined as unknown as string[] })]).split('\n');
    expect(row.split(',')[9]).toBe('');
  });

  test('wiersze z wartościami opcjonalnymi i bez nich', () => {
    const full = item({
      roasterOrProducer: 'Palarnia',
      origin: 'Kenia',
      roastOrHarvestDate: '2026-10-01',
      roastProfile: 'light',
      flavorNotes: ['cytrus', 'kakao'],
      isFavorite: true,
      isArchived: true,
    });
    const bare = item({ id: 'i2', name: '=2+2' });
    const [header, rowFull, rowBare] = buildInventoryCsv([full, bare]).split('\n');
    expect(header).toBe(INVENTORY_CSV_HEADERS.join(','));
    expect(rowFull).toBe('i1,Kenia,coffee,Palarnia,Kenia,2026-10-01,light,250,100,cytrus; kakao,1,1');
    expect(rowBare).toBe(`i2,"'=2+2",coffee,,,,,250,100,,0,0`);
  });
});
