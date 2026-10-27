// ============================================================================
// Napar (Steepwise) — Unit Tests: Search Utilities (RD-ENG-07, NFR-INT-015)
// ============================================================================

import { normSearch, matchesSearch, tokenizeSearch, matchesAllTokens } from '../search-utils';

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

  test('TASK-P56-01-ODK: wieloznakowe dopasowanie tokenowe (all tokens matching in any order)', () => {
    const text = 'Etiopia Yirgacheffe Żółty Miód (Natural V60)';
    // Wyszukiwanie wielosłowne w innej kolejności
    expect(matchesSearch(text, 'v60 etiopia')).toBe(true);
    expect(matchesSearch(text, 'natural miod yirgacheffe')).toBe(true);
    expect(matchesSearch(text, 'v60 kenya')).toBe(false);

    // Bezpośrednie użycie tokenizeSearch i matchesAllTokens
    expect(tokenizeSearch('  V60   Etiopia  Natural ')).toEqual(['v60', 'etiopia', 'natural']);
    expect(matchesAllTokens(text, 'etiopia v60')).toBe(true);
    expect(matchesAllTokens(text, 'etiopia chemex')).toBe(false);
  });

  test('TASK-P56-01-ODK: normalizacja znaków kontrolnych, BOM, podwójnych spacji i znaków ligaturowych', () => {
    // BOM i znaki kontrolne
    expect(normSearch('\uFEFFKawa\x00 Filter\t\r\n')).toBe('kawa filter');
    // Niemieckie i nordyckie znaki specjalne
    expect(normSearch('Kaffee Süß')).toBe('kaffee suss');
    expect(normSearch('København')).toBe('kobenhavn');
    expect(normSearch('Ærø')).toBe('aero');
  });
});
