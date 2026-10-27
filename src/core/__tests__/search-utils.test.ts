// ============================================================================
// Napar (Steepwise) — Unit Tests: Search Utilities (RD-ENG-07, NFR-INT-015)
// ============================================================================

import {
  normSearch,
  matchesSearch,
  tokenizeSearch,
  matchesAllTokens,
  matchesAnyField,
  filterBySearch,
  rankSearchResults,
} from '../search-utils';

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

  test('TASK-P61-01-ODK: matchesAnyField przeszukuje wiele pol jednoczesnie z ochrona przed null/undefined', () => {
    const fields = ['Etiopia Yirgacheffe', 'V60 3-Pour', 'James Hoffmann', null, undefined, 'Aromaty kwiatowe i cytrusowe'];

    expect(matchesAnyField(fields, 'hoffmann v60')).toBe(true);
    expect(matchesAnyField(fields, 'etiopia cytrusowe')).toBe(true);
    expect(matchesAnyField(fields, 'kenya')).toBe(false);
    expect(matchesAnyField(fields, '')).toBe(true);
    expect(matchesAnyField(null as any, 'v60')).toBe(false);
    expect(matchesAnyField([], 'v60')).toBe(false);
  });

  test('TASK-P63-01-ODK: filterBySearch filtruje tablice obiektow na podstawie zapytania i ekstraktora pol', () => {
    interface SampleCoffee {
      id: string;
      roastery: string;
      origin: string;
      notes: string[];
    }
    const coffees: SampleCoffee[] = [
      { id: '1', roastery: 'HAYB', origin: 'Etiopia Guji', notes: ['morela', 'bergamotka'] },
      { id: '2', roastery: 'Coffea Circulor', origin: 'Panama Geisha', notes: ['jaśmin', 'brzoskwinia'] },
      { id: '3', roastery: 'Hard Beans', origin: 'Kenia Nyeri', notes: ['czarna porzeczka'] },
    ];

    // 1. Dopasowanie po nazwie i nutach
    const guji = filterBySearch(coffees, 'guji morela', (c) => [c.roastery, c.origin, ...c.notes]);
    expect(guji.length).toBe(1);
    expect(guji[0].id).toBe('1');

    // 2. Dopasowanie wielowyrazowe z polskimi znakami
    const panama = filterBySearch(coffees, 'jasmin circuLOR', (c) => [c.roastery, c.origin, ...c.notes]);
    expect(panama.length).toBe(1);
    expect(panama[0].id).toBe('2');

    // 3. Puste zapytanie zwraca wszystkie
    expect(filterBySearch(coffees, '', (c) => [c.origin]).length).toBe(3);
    expect(filterBySearch(coffees, null as any, (c) => [c.origin]).length).toBe(3);

    // 4. Brak dopasowania
    expect(filterBySearch(coffees, 'Brazylia', (c) => [c.origin]).length).toBe(0);

    // 5. Odporność na nullish items
    expect(filterBySearch(null as any, 'guji', () => [])).toEqual([]);
    expect(filterBySearch(undefined as any, 'guji', () => [])).toEqual([]);
  });

  test('TASK-P66-01-ODK: rankSearchResults sortuje elementy wg trafnosci (tytuł > pola pomocnicze)', () => {
    interface RecipeEntry {
      id: string;
      title: string;
      notes: string;
    }

    const recipes: RecipeEntry[] = [
      { id: '1', title: 'Chemex Classic', notes: 'Zastosuj gruby przemiał i filtr v60' },
      { id: '2', title: 'V60 Tetsu Kasuya 4:6', notes: 'Japońska metoda dla drippera v60' },
      { id: '3', title: 'AeroPress Inverted', notes: 'Bardzo klarowny napar v60 like' },
      { id: '4', title: 'V60 Hoffmann 1-Cup', notes: 'Standardowy przepis V60' },
    ];

    // Szukamy "V60"
    // 'V60 Tetsu Kasuya 4:6' zaczyna się od 'v60' (score 80)
    // 'V60 Hoffmann 1-Cup' zaczyna się od 'v60' (score 80)
    // 'Chemex Classic' i 'AeroPress Inverted' mają v60 tylko w notes (score 20)
    const ranked = rankSearchResults(
      recipes,
      'V60',
      (r) => r.title,
      (r) => [r.notes]
    );

    expect(ranked.length).toBe(4);
    expect(ranked[0].id).toBe('2'); // Pierwszy z prefiksem V60
    expect(ranked[1].id).toBe('4'); // Drugi z prefiksem V60
    expect(['1', '3']).toContain(ranked[2].id);
    expect(['1', '3']).toContain(ranked[3].id);

    // Dokładne dopasowanie tytułu
    const single = [{ id: 'x', title: 'V60', notes: '' }, { id: 'y', title: 'V60 4:6', notes: '' }];
    const rankedSingle = rankSearchResults(single, 'v60', (s) => s.title);
    expect(rankedSingle[0].id).toBe('x'); // Dokładne dopasowanie 'v60' == 'v60'

    // Puste zapytanie lub brak pasujących
    expect(rankSearchResults(recipes, '', (r) => r.title).length).toBe(4);
    expect(rankSearchResults(recipes, 'Kalita', (r) => r.title).length).toBe(0);
    expect(rankSearchResults(null, 'v60', () => '')).toEqual([]);
  });
});
