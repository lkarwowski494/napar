// ============================================================================
// Napar (Steepwise) — Unit Tests: Search Utilities (RD-ENG-07, NFR-INT-015)
// ============================================================================

import { normSearch, matchesSearch } from '../search-utils';

describe('Search Utilities (RD-ENG-07 & NFR-INT-015)', () => {
  test('Wektory testowe z dokumentu BRD (RD-ENG-07)', () => {
    // • normSearch("Żółty liść Ćma") -> "zolty lisc cma"
    expect(normSearch('Żółty liść Ćma')).toBe('zolty lisc cma');

    // • normSearch("Wyciskanie sztangi leżąc") -> "wyciskanie sztangi lezac"
    expect(normSearch('Wyciskanie sztangi leżąc')).toBe('wyciskanie sztangi lezac');

    // • normSearch("  Mąka Żytnia 2000 ") -> "maka zytnia 2000"
    expect(normSearch('  Mąka Żytnia 2000 ')).toBe('maka zytnia 2000');
  });

  test('Zamiana małych i wielkich liter ł/Ł na l', () => {
    expect(normSearch('Łódź')).toBe('lodz');
    expect(normSearch('biała płukana kawa')).toBe('biala plukana kawa');
    expect(normSearch('Comandante C40 z żarnami ze stali')).toBe('comandante c40 z zarnami ze stali');
  });

  test('Obsługa wartości brzegowych', () => {
    expect(normSearch('')).toBe('');
    expect(normSearch('   ')).toBe('');
    expect(normSearch(null as any)).toBe('');
    expect(normSearch(undefined as any)).toBe('');
  });

  test('matchesSearch znajduje frazę bez względu na wielkość liter i polskie znaki', () => {
    const text = 'Etiopia Yirgacheffe Żółty Miód (Natural)';
    expect(matchesSearch(text, 'etiopia')).toBe(true);
    expect(matchesSearch(text, 'zolty')).toBe(true);
    expect(matchesSearch(text, 'miod')).toBe(true);
    expect(matchesSearch(text, 'ŻÓŁTY')).toBe(true);
    expect(matchesSearch(text, 'Kenya')).toBe(false);

    // Puste zapytanie pasuje do wszystkiego
    expect(matchesSearch(text, '')).toBe(true);
    expect(matchesSearch(text, '   ')).toBe(true);
  });
});
