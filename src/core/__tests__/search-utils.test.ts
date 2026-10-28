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
  highlightSearchMatch,
  SearchHighlightSegment,
  calculateLevenshteinDistance,
  isFuzzyMatch,
  filterByFuzzySearch,
  FuzzySearchOptions,
  extractSearchSnippet,
  suggestSearchCorrections,
  SearchCorrectionSuggestion,
  calculateSearchRelevanceScore,
  SearchRelevanceScore,
  filterSearchEntriesByTags,
  filterSearchEntriesByNumericRange,
  NumericRangeFilterOptions,
  aggregateSearchFacets,
  SearchFacetItem,
  filterBySearchFacets,
  parseSearchQuery,
  ParsedSearchQuery,
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

  test('TASK-P70-01-ODK: highlightSearchMatch dzieli tekst na pasujace i niepasujace segmenty', () => {
    // 1. Podział tekstu "Etiopia Yirgacheffe" dla zapytania "etiop"
    const segs: SearchHighlightSegment[] = highlightSearchMatch('Etiopia Yirgacheffe', 'etiop');
    expect(segs.length).toBe(2);
    expect(segs[0]).toEqual({ text: 'Etiop', isMatch: true });
    expect(segs[1]).toEqual({ text: 'ia Yirgacheffe', isMatch: false });

    // 2. Dopasowanie w środku: "Chemex Classic" dla "mex"
    const segsMid = highlightSearchMatch('Chemex Classic', 'mex');
    expect(segsMid.length).toBe(3);
    expect(segsMid[0]).toEqual({ text: 'Che', isMatch: false });
    expect(segsMid[1]).toEqual({ text: 'mex', isMatch: true });
    expect(segsMid[2]).toEqual({ text: ' Classic', isMatch: false });

    // 3. Brak dopasowania
    const noMatch = highlightSearchMatch('Kenia Nyeri', 'Guji');
    expect(noMatch.length).toBe(1);
    expect(noMatch[0]).toEqual({ text: 'Kenia Nyeri', isMatch: false });

    // 4. Bezpieczeństwo znaków specjalnych regex (np. "[", "(", "*", "+")
    const specialChars = highlightSearchMatch('V60 (Kasuya 4:6)', '(Kasuya');
    expect(specialChars.length).toBe(3);
    expect(specialChars[1]).toEqual({ text: '(Kasuya', isMatch: true });

    // 5. Puste wejścia i null
    expect(highlightSearchMatch('', 'test')).toEqual([]);
    expect(highlightSearchMatch(null, 'test')).toEqual([]);
    expect(highlightSearchMatch('Kawa', '')).toEqual([{ text: 'Kawa', isMatch: false }]);
    expect(highlightSearchMatch('Kawa', null)).toEqual([{ text: 'Kawa', isMatch: false }]);
  });

  test('TASK-P73-01-ODK: calculateLevenshteinDistance i isFuzzyMatch wspierają wyszukiwanie rozmyte', () => {
    // 1. Odległość Levenshteina
    expect(calculateLevenshteinDistance('v60', 'v60')).toBe(0);
    expect(calculateLevenshteinDistance('aeropress', 'aeropres')).toBe(1);
    expect(calculateLevenshteinDistance('geisha', 'gesha')).toBe(1);
    expect(calculateLevenshteinDistance('yirgacheffe', 'yirgahefe')).toBe(2);
    expect(calculateLevenshteinDistance('', 'v60')).toBe(3);
    expect(calculateLevenshteinDistance(null as any, 'v60')).toBe(3);

    // 2. isFuzzyMatch
    expect(isFuzzyMatch('Hario V60 Dripper', 'v60')).toBe(true);
    expect(isFuzzyMatch('AeroPress Inverted', 'aeropres')).toBe(true);
    expect(isFuzzyMatch('Ethiopia Yirgacheffe Washed', 'yirgahefe')).toBe(true);
    expect(isFuzzyMatch('Geisha Panama', 'gesha')).toBe(true);

    // 3. Brak dopasowania przy dużej różnicy
    expect(isFuzzyMatch('Chemex Classic', 'aeropress')).toBe(false);

    // 4. Odporność na null i puste stringi
    expect(isFuzzyMatch(null, 'v60')).toBe(false);
    expect(isFuzzyMatch('v60', null)).toBe(false);
  });

  test('TASK-P75-01-ODK: filterByFuzzySearch filtruje kolekcję z tolerancją literówek', () => {
    const items = [
      { id: '1', name: 'Ethiopia Yirgacheffe Washed', origin: 'Ethiopia' },
      { id: '2', name: 'Panama Geisha Boquete', origin: 'Panama' },
      { id: '3', name: 'Colombia Huila Pink Bourbon', origin: 'Colombia' },
      { id: '4', name: 'Kenya Nyeri AA', origin: 'Kenya' },
    ];

    const opts: FuzzySearchOptions = { maxDistance: 2 };

    // 1. Wyszukiwanie z literówką "yirgahefe"
    const byFuzzy = filterByFuzzySearch(items, 'yirgahefe', (item) => [item.name, item.origin], opts);
    expect(byFuzzy.length).toBe(1);
    expect(byFuzzy[0].id).toBe('1');

    // 2. Wyszukiwanie z literówką "gesha" dla Panama Geisha
    const byGeisha = filterByFuzzySearch(items, 'gesha', (item) => [item.name]);
    expect(byGeisha.length).toBe(1);
    expect(byGeisha[0].id).toBe('2');

    // 3. Puste zapytanie zwraca wszystkie elementy
    expect(filterByFuzzySearch(items, '', (item) => [item.name]).length).toBe(4);
    expect(filterByFuzzySearch(items, null, (item) => [item.name]).length).toBe(4);

    // 4. Odporność na nullish i błędy ekstraktora
    expect(filterByFuzzySearch(null, 'test', () => [])).toEqual([]);
    expect(filterByFuzzySearch(items, 'test', () => { throw new Error('fail'); })).toEqual([]);
  });

  test('TASK-P78-01-ODK: extractSearchSnippet wyodrębnia fragment kontekstowy z wielokropkiem', () => {
    const longText = 'Kawa specialty z regionu Yirgacheffe w Etiopii cechuje się wyraźną cytrusową kwasowością, nutami jaśminu i herbaty bergamotki oraz czystym, lekkim finiszem.';

    // 1. Dopasowanie w środku zdania
    const snippetMid = extractSearchSnippet(longText, 'jaśminu', 50);
    expect(snippetMid).toContain('jaśminu');
    expect(snippetMid.startsWith('...')).toBe(true);
    expect(snippetMid.endsWith('...')).toBe(true);
    expect(snippetMid.length).toBeLessThanOrEqual(60);

    // 2. Krótki tekst nie wymaga obcinania
    expect(extractSearchSnippet('Krótki tekst', 'tekst', 50)).toBe('Krótki tekst');

    // 3. Brak zapytania obcina od początku
    const noQuery = extractSearchSnippet(longText, '', 40);
    expect(noQuery.endsWith('...')).toBe(true);
    expect(noQuery.startsWith('Kawa')).toBe(true);

    // 4. Odporność na null, undefined, liczby ujemne i -0
    expect(extractSearchSnippet(null, 'test')).toBe('');
    expect(extractSearchSnippet(longText, null, -10)).toBeDefined();
  });

  test('TASK-P80-01-ODK: suggestSearchCorrections podpowiada korekty literówek na podstawie słownika', () => {
    const dictionary = ['Geisha', 'Bourbon', 'Ethiopia', 'Kenya', 'Chemex', 'Aeropress', 'V60', 'Caturra'];

    // 1. Literówka "geish" -> "Geisha"
    const suggestions: SearchCorrectionSuggestion[] = suggestSearchCorrections('geish', dictionary);
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions[0].suggestedTerm).toBe('Geisha');
    expect(suggestions[0].distance).toBe(1);
    expect(suggestions[0].similarityScore).toBeGreaterThanOrEqual(0.8);

    // 2. Literówka "chemx" -> "Chemex"
    const chemxSug = suggestSearchCorrections('chemx', dictionary);
    expect(chemxSug.length).toBeGreaterThan(0);
    expect(chemxSug[0].suggestedTerm).toBe('Chemex');

    // 3. Dokładne dopasowanie "kenya" -> distance 0, similarity 1
    const exact = suggestSearchCorrections('kenya', dictionary);
    expect(exact[0].distance).toBe(0);
    expect(exact[0].similarityScore).toBe(1);

    // 4. Pusty słownik, brak zapytania lub zbyt duża odległość
    expect(suggestSearchCorrections('', dictionary)).toEqual([]);
    expect(suggestSearchCorrections('xyzqwertyuiop', dictionary, 3, 2)).toEqual([]);
    expect(suggestSearchCorrections(null as any, dictionary)).toEqual([]);
    expect(suggestSearchCorrections('test', null as any)).toEqual([]);
  });

  test('TASK-P82-01-ODK: calculateSearchRelevanceScore ocenia relewancję dopasowania wyszukiwania', () => {
    // 1. Dokładne dopasowanie (exact match) -> 100 punktów
    const exact: SearchRelevanceScore = calculateSearchRelevanceScore('Ethiopia Yirgacheffe', 'ethiopia yirgacheffe');
    expect(exact.score).toBe(100);
    expect(exact.exactMatch).toBe(true);
    expect(exact.prefixMatch).toBe(true);
    expect(exact.tokenCoverage).toBe(1);

    // 2. Dopasowanie prefiksowe (prefix match) -> >= 80 punktów
    const prefix = calculateSearchRelevanceScore('Ethiopia Yirgacheffe Washed', 'Ethiopia');
    expect(prefix.score).toBeGreaterThanOrEqual(80);
    expect(prefix.exactMatch).toBe(false);
    expect(prefix.prefixMatch).toBe(true);
    expect(prefix.tokenCoverage).toBe(1);

    // 3. Wszystkie tokeny dopasowane w środku tekstu
    const allTokens = calculateSearchRelevanceScore('Specialty Coffee Ethiopia Natural', 'Ethiopia Natural');
    expect(allTokens.score).toBeGreaterThanOrEqual(70);
    expect(allTokens.tokenCoverage).toBe(1);

    // 4. Częściowe dopasowanie tokenów
    const partial = calculateSearchRelevanceScore('Panama Geisha Washed', 'Geisha Natural');
    expect(partial.tokenCoverage).toBe(0.5);
    expect(partial.score).toBeGreaterThan(0);
    expect(partial.score).toBeLessThan(70);

    // 5. Brak dopasowania lub puste dane
    const zero = calculateSearchRelevanceScore('Kenya Nyeri', 'Colombia Huila');
    expect(zero.score).toBe(0);
    expect(zero.tokenCoverage).toBe(0);

    const empty = calculateSearchRelevanceScore(null, 'test');
    expect(empty.score).toBe(0);
    expect(empty.tokenCoverage).toBe(0);
  });

  test('TASK-P85-01-ODK: filterSearchEntriesByTags filtruje elementy po tagach w trybach all oraz any', () => {
    const coffees = [
      { id: '1', name: 'Ethiopia Yirgacheffe', tags: ['floral', 'citrus', 'tea-like'] },
      { id: '2', name: 'Kenya Nyeri', tags: ['citrus', 'blackcurrant', 'juicy'] },
      { id: '3', name: 'Colombia Geisha', tags: ['floral', 'jasmine', 'bergamot'] },
      { id: '4', name: 'Brazil Cerrado', tags: ['chocolate', 'nutty', 'caramel'] },
    ];

    // 1. Tryb 'all' (koniunkcja) — floral ORAZ citrus -> tylko Ethiopia
    const allMatch = filterSearchEntriesByTags(coffees, (c) => c.tags, ['floral', 'citrus'], 'all');
    expect(allMatch.length).toBe(1);
    expect(allMatch[0].id).toBe('1');

    // 2. Tryb 'any' (alternatywa) — floral LUB citrus -> Ethiopia, Kenya, Colombia
    const anyMatch = filterSearchEntriesByTags(coffees, (c) => c.tags, ['floral', 'citrus'], 'any');
    expect(anyMatch.length).toBe(3);
    const anyIds = anyMatch.map((c) => c.id);
    expect(anyIds).toContain('1');
    expect(anyIds).toContain('2');
    expect(anyIds).toContain('3');

    // 3. Obsługa stringa rozdzielanego przecinkami
    const fromString = filterSearchEntriesByTags(coffees, (c) => c.tags, 'chocolate, nutty');
    expect(fromString.length).toBe(1);
    expect(fromString[0].id).toBe('4');

    // 4. Puste zapytanie lub brak tagów zwraca wszystkie elementy
    expect(filterSearchEntriesByTags(coffees, (c) => c.tags, []).length).toBe(4);
    expect(filterSearchEntriesByTags(coffees, (c) => c.tags, null).length).toBe(4);
    expect(filterSearchEntriesByTags(coffees, (c) => c.tags, '').length).toBe(4);

    // 5. Odporność na nullish kolekcję, uszkodzone tagi i błędy ekstraktora
    expect(filterSearchEntriesByTags(null, (c: any) => c.tags, ['floral'])).toEqual([]);
    expect(filterSearchEntriesByTags(coffees, () => { throw new Error('fail'); }, ['floral'])).toEqual([]);
  });

  test('TASK-P87-01-ODK: filterSearchEntriesByNumericRange filtruje elementy po przedziale numerycznym', () => {
    const coffees = [
      { id: '1', name: 'Ethiopia Yirgacheffe', altitude: 2100, dose: 15 },
      { id: '2', name: 'Colombia Huila', altitude: 1750, dose: 18 },
      { id: '3', name: 'Brazil Santos', altitude: 900, dose: '20,0' },
      { id: '4', name: 'Unknown Estate', altitude: null, dose: 16 },
    ];

    // 1. Filtr z min i max (przedział 1000 - 2000m) -> Colombia Huila (1750m)
    const midAltitude = filterSearchEntriesByNumericRange(coffees, (c) => c.altitude, { min: 1000, max: 2000 });
    expect(midAltitude.length).toBe(1);
    expect(midAltitude[0].id).toBe('2');

    // 2. Filtr tylko min (>= 1750m) w trybie inclusive (domyślnym) -> Ethiopia (2100) i Colombia (1750)
    const highAltitude = filterSearchEntriesByNumericRange(coffees, (c) => c.altitude, { min: 1750 });
    expect(highAltitude.length).toBe(2);

    // 3. Tryb exclusive (inclusive = false) dla min: 1750 -> tylko Ethiopia (2100)
    const strictHigh = filterSearchEntriesByNumericRange(coffees, (c) => c.altitude, { min: 1750, inclusive: false });
    expect(strictHigh.length).toBe(1);
    expect(strictHigh[0].id).toBe('1');

    // 4. Parsowanie stringów z przecinkami dziesiętnymi w dozie
    const doseFilter = filterSearchEntriesByNumericRange(coffees, (c) => c.dose, { min: '17,5', max: '21' });
    expect(doseFilter.length).toBe(2);
    const ids = doseFilter.map((c) => c.id);
    expect(ids).toContain('2');
    expect(ids).toContain('3');

    // 5. Brak kryteriów min/max zwraca całą listę
    const noFilter = filterSearchEntriesByNumericRange(coffees, (c) => c.altitude, null);
    expect(noFilter.length).toBe(4);

    // 6. Odporność na błędy ekstraktora i pustą listę
    expect(filterSearchEntriesByNumericRange(null, (c: any) => c.dose)).toEqual([]);
    expect(filterSearchEntriesByNumericRange(coffees, () => { throw new Error('fail'); }, { min: 10 })).toEqual([]);
  });

  test('TASK-P90-01-ODK: aggregateSearchFacets agreguje fasety zliczania kategorii i tagów', () => {
    const items = [
      { id: '1', method: 'V60', origin: 'Ethiopia', tags: ['floral', 'fruity'] },
      { id: '2', method: 'V60', origin: 'Colombia', tags: ['chocolate', 'fruity'] },
      { id: '3', method: 'AeroPress', origin: 'Ethiopia', tags: ['floral'] },
      { id: '4', method: 'Chemex', origin: null, tags: [] },
      { id: '5', method: 'V60', origin: 'Ethiopia', tags: null },
    ];

    // 1. Agregacja z wieloma ekstraktorami (wartości pojedyncze oraz tablice)
    const facets: Record<string, SearchFacetItem[]> = aggregateSearchFacets(items, {
      method: (it) => it.method,
      origin: (it) => it.origin,
      tags: (it) => it.tags,
    });

    // Weryfikacja fasety 'method': V60 (3), AeroPress (1), Chemex (1)
    expect(facets.method).toHaveLength(3);
    expect(facets.method[0]).toEqual({ value: 'V60', count: 3 });

    // Weryfikacja fasety 'origin': Ethiopia (3), Colombia (1)
    expect(facets.origin).toHaveLength(2);
    expect(facets.origin[0]).toEqual({ value: 'Ethiopia', count: 3 });
    expect(facets.origin[1]).toEqual({ value: 'Colombia', count: 1 });

    // Weryfikacja fasety 'tags': fruity (2), floral (2), chocolate (1)
    expect(facets.tags).toHaveLength(3);
    const floralFacet = facets.tags.find((t) => t.value === 'floral');
    const fruityFacet = facets.tags.find((t) => t.value === 'fruity');
    expect(floralFacet?.count).toBe(2);
    expect(fruityFacet?.count).toBe(2);

    // 2. Odporność na pustą tablicę, null, undefined i błędy ekstraktora
    expect(aggregateSearchFacets(null, { method: (it: any) => it.method })).toEqual({ method: [] });
    expect(aggregateSearchFacets([], { method: (it: any) => it.method })).toEqual({ method: [] });
    expect(aggregateSearchFacets(items, null as any)).toEqual({});
    expect(aggregateSearchFacets(items, {
      broken: () => { throw new Error('boom'); },
    })).toEqual({ broken: [] });
  });

  test('TASK-P92-01-ODK: filterBySearchFacets filtruje elementy według wybranych wartości faset', () => {
    const items = [
      { id: '1', method: 'V60', origin: 'Ethiopia', tags: ['fruity', 'floral'] },
      { id: '2', method: 'V60', origin: 'Colombia', tags: ['chocolate', 'caramel'] },
      { id: '3', method: 'AeroPress', origin: 'Ethiopia', tags: ['fruity'] },
      { id: '4', method: 'Chemex', origin: 'Ethiopia', tags: ['floral', 'citrus'] },
    ];

    const extractors = {
      method: (it: typeof items[0]) => it.method,
      origin: (it: typeof items[0]) => it.origin,
      tags: (it: typeof items[0]) => it.tags,
    };

    // 1. Filtrowanie pojedynczej fasety: method = ['V60'] -> items 1, 2
    const v60Only = filterBySearchFacets(items, { method: ['V60'] }, extractors);
    expect(v60Only.map((i) => i.id)).toEqual(['1', '2']);

    // 2. Filtrowanie wielu faset (AND między fasetami, OR wewnątrz wartości):
    // origin = ['Ethiopia'] AND tags = ['floral'] -> items 1, 4
    const ethiopiaFloral = filterBySearchFacets(items, {
      origin: ['Ethiopia'],
      tags: ['floral'],
    }, extractors);
    expect(ethiopiaFloral.map((i) => i.id)).toEqual(['1', '4']);

    // 3. Case-insensitive dopasowanie wartości fasety
    const caseInsensitive = filterBySearchFacets(items, {
      origin: ['ethiopia'],
      method: ['v60'],
    }, extractors);
    expect(caseInsensitive.map((i) => i.id)).toEqual(['1']);

    // 4. Puste wybrane fasety zwracają wszystkie elementy
    expect(filterBySearchFacets(items, {}, extractors)).toHaveLength(4);
    expect(filterBySearchFacets(items, { method: [] }, extractors)).toHaveLength(4);

    // 5. Odporność na null, undefined i błędy ekstraktora
    expect(filterBySearchFacets(null, { method: ['V60'] }, extractors)).toEqual([]);
    expect(filterBySearchFacets(items, null, extractors)).toHaveLength(4);
    expect(filterBySearchFacets(items, { method: ['V60'] }, null)).toHaveLength(4);
    expect(filterBySearchFacets(items, {
      broken: ['val'],
    }, {
      broken: () => { throw new Error('fail'); },
    })).toEqual([]);
  });

  test('TASK-P94-01-ODK: parseSearchQuery parsuje zapytania z filtrami polowymi i negacjami', () => {
    // 1. Złożone zapytanie z tokenami swobodnymi, filtrami polowymi i negacją
    const parsed: ParsedSearchQuery = parseSearchQuery('ethiopia method:v60 origin:yirgacheffe -decaf -dark');
    expect(parsed.isEmpty).toBe(false);
    expect(parsed.rawQuery).toBe('ethiopia method:v60 origin:yirgacheffe -decaf -dark');
    expect(parsed.freeTextTokens).toEqual(['ethiopia']);
    expect(parsed.fieldFilters).toEqual({
      method: ['v60'],
      origin: ['yirgacheffe'],
    });
    expect(parsed.negatedTokens).toEqual(['decaf', 'dark']);

    // 2. Wiele wartości tego samego filtra (np. roaster:hardbeans roaster:kafar)
    const multiFilter = parseSearchQuery('roaster:hardbeans roaster:kafar washed');
    expect(multiFilter.freeTextTokens).toEqual(['washed']);
    expect(multiFilter.fieldFilters.roaster).toEqual(['hardbeans', 'kafar']);

    // 3. Puste zapytanie lub whitespace
    const empty = parseSearchQuery('   ');
    expect(empty.isEmpty).toBe(true);
    expect(empty.freeTextTokens).toEqual([]);
    expect(empty.fieldFilters).toEqual({});
    expect(empty.negatedTokens).toEqual([]);

    // 4. Odporność na null, undefined i wartości nienapisowe
    expect(parseSearchQuery(null).isEmpty).toBe(true);
    expect(parseSearchQuery(undefined).isEmpty).toBe(true);
    expect(parseSearchQuery(123 as any).isEmpty).toBe(true);
  });
});
