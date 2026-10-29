// ============================================================================
// Napar (Steepwise) — Search Utilities (RD-ENG-07, NFR-INT-015)
// Normalizacja tekstu wyszukiwarki z obsługą polskich znaków diakrytycznych
// ============================================================================

/**
 * RD-ENG-07 & NFR-INT-015: Normalizacja tekstu wyszukiwarki
 * Usuwa BOM, znaki kontrolne, znaki diakrytyczne (NFD), ligatury (ß->ss, æ->ae)
 * oraz zamienia 'ł'/'Ł' na 'l'/'L', normalizując wielokrotne białe znaki.
 */
export function normSearch(s: string): string {
  if (typeof s !== 'string') return '';
  if (!s) return '';

  // Szybka ścieżka dla typowych fraz ASCII bez znaków diakrytycznych i kontrolnych
  if (/^[a-z0-9 ]+$/.test(s)) {
    return s.includes('  ') ? s.replace(/\s+/g, ' ').trim() : s.trim();
  }

  return s
    .replace(/\uFEFF/g, '')
    .replace(/[\x00-\x1F\x7F-\x9F]/g, ' ')
    .toLowerCase()
    .replace(/ß/g, 'ss')
    .replace(/æ/g, 'ae')
    .replace(/œ/g, 'oe')
    .replace(/ø/g, 'o')
    .replace(/đ/g, 'd')
    .replace(/ð/g, 'd')
    .replace(/þ/g, 'th')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ł/g, 'l')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Dzieli zapytanie na znormalizowane tokeny słów
 */
export function tokenizeSearch(query: string): string[] {
  const norm = normSearch(query);
  if (!norm) return [];
  return norm.split(' ').filter(Boolean);
}

/**
 * Sprawdza czy tekst elementu zawiera wszystkie tokeny zapytania w dowolnej kolejności
 */
export function matchesAllTokens(text: string, query: string): boolean {
  const tokens = tokenizeSearch(query);
  if (tokens.length === 0) return true;
  const normTarget = normSearch(text);
  return tokens.every((token) => normTarget.includes(token));
}

/**
 * Sprawdza czy tekst elementu pasuje do zapytania wyszukiwania.
 * Najpierw sprawdza dokładne dopasowanie podciągu, a w przypadku zapytań
 * wielowyrazowych dopasowuje wszystkie tokeny w dowolnej kolejności.
 */
export function matchesSearch(text: string, query: string): boolean {
  if (!query || typeof query !== 'string' || query.trim() === '') return true;
  const normQuery = normSearch(query);
  if (!normQuery) return true;
  const normTarget = normSearch(text);
  if (normTarget.includes(normQuery)) return true;

  const tokens = normQuery.split(' ').filter(Boolean);
  if (tokens.length <= 1) return false;
  return tokens.every((token) => normTarget.includes(token));
}

/**
 * Sprawdza czy którekolwiek pole z tablicy pasuje do zapytania wyszukiwania.
 * Łączy niepuste pola tekstowe i dopasowuje tokeny zapytania w dowolnej kolejności.
 */
export function matchesAnyField(
  fields: (string | undefined | null | unknown)[],
  query: string | undefined | null
): boolean {
  if (!query || typeof query !== 'string' || query.trim() === '') return true;
  if (!Array.isArray(fields) || fields.length === 0) return false;
  const combined = fields
    .filter((f): f is string => typeof f === 'string' && f.trim() !== '')
    .join(' ');
  return matchesSearch(combined, query);
}

/**
 * Filtruje tablicę obiektów dowolnego typu na podstawie zapytania wyszukiwania
 * i funkcji ekstrahującej przeszukiwane pola tekstowe.
 */
export function filterBySearch<T>(
  items: T[] | undefined | null,
  query: string | undefined | null,
  extractFields: (item: T) => (string | undefined | null | unknown)[]
): T[] {
  if (!Array.isArray(items)) return [];
  if (!query || typeof query !== 'string' || query.trim() === '') {
    return [...items];
  }
  if (typeof extractFields !== 'function') return [...items];

  return items.filter((item) => {
    if (!item) return false;
    try {
      const fields = extractFields(item);
      return matchesAnyField(fields, query);
    } catch {
      return false;
    }
  });
}

/**
 * RD-ENG-07: Sortuje elementy według trafności dopasowania do zapytania.
 * Wyniki z dopasowaniem w tytule (dokładne/prefiksowe/zawiera) otrzymują wyższy priorytet
 * niż wyniki pasujące wyłącznie w polach pomocniczych (secondary).
 * Zachowuje stabilną kolejność dla wyników o tym samym priorytecie.
 */
export function rankSearchResults<T>(
  items: T[] | undefined | null,
  query: string | undefined | null,
  extractTitle: (item: T) => string | undefined | null,
  extractSecondary?: (item: T) => (string | undefined | null | unknown)[]
): T[] {
  if (!Array.isArray(items) || items.length === 0) return [];
  if (!query || typeof query !== 'string' || !query.trim()) {
    return [...items];
  }
  const normQuery = normSearch(query);
  if (!normQuery) return [...items];

  const scored: { item: T; score: number; index: number }[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item) continue;
    let titleStr = '';
    try {
      titleStr = typeof extractTitle === 'function' ? String(extractTitle(item) ?? '') : '';
    } catch {
      titleStr = '';
    }
    const normTitle = normSearch(titleStr);

    let secondaryFields: (string | undefined | null | unknown)[] = [];
    if (typeof extractSecondary === 'function') {
      try {
        secondaryFields = extractSecondary(item) || [];
      } catch {
        secondaryFields = [];
      }
    }

    // Obliczamy wagę dopasowania:
    // 100: dokładne dopasowanie tytułu
    // 80: tytuł zaczyna się od zapytania
    // 60: tytuł zawiera całe zapytanie
    // 40: tytuł zawiera wszystkie tokeny
    // 20: którekolwiek pole pomocnicze zawiera dopasowanie
    let score = 0;
    if (normTitle === normQuery) {
      score = 100;
    } else if (normTitle.startsWith(normQuery)) {
      score = 80;
    } else if (normTitle.includes(normQuery)) {
      score = 60;
    } else if (matchesSearch(normTitle, normQuery)) {
      score = 40;
    } else if (matchesAnyField(secondaryFields, normQuery)) {
      score = 20;
    }

    if (score > 0) {
      scored.push({ item, score, index: i });
    }
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.index - b.index;
  });

  return scored.map((s) => s.item);
}



export interface SearchHighlightSegment {
  text: string;
  isMatch: boolean;
}

/**
 * Dzieli tekst źródłowy na segmenty dopasowane i niedopasowane do zapytania wyszukiwania.
 * Ułatwia renderowanie podświetlonych fragmentów w komponentach UI.
 */
export function highlightSearchMatch(
  text: string | undefined | null,
  query: string | undefined | null
): SearchHighlightSegment[] {
  if (text === undefined || text === null) return [];
  const rawText = String(text);
  if (!rawText) return [];
  if (!query || typeof query !== 'string' || !query.trim()) {
    return [{ text: rawText, isMatch: false }];
  }

  const cleanQuery = query.trim();
  const escapedQuery = cleanQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  let regex: RegExp;
  try {
    regex = new RegExp(`(${escapedQuery})`, 'gi');
  } catch {
    return [{ text: rawText, isMatch: false }];
  }

  const parts = rawText.split(regex);
  const segments: SearchHighlightSegment[] = [];

  for (const part of parts) {
    if (!part) continue;
    const isMatch = part.toLowerCase() === cleanQuery.toLowerCase();
    segments.push({ text: part, isMatch });
  }

  return segments.length > 0 ? segments : [{ text: rawText, isMatch: false }];
}

/**
 * Oblicza odległość edycyjną Levenshteina między dwoma ciągami znaków.
 */
export function calculateLevenshteinDistance(
  a: string | undefined | null,
  b: string | undefined | null
): number {
  const s1 = typeof a === 'string' ? normSearch(a) : '';
  const s2 = typeof b === 'string' ? normSearch(b) : '';

  if (s1 === s2) return 0;
  if (s1.length === 0) return s2.length;
  if (s2.length === 0) return s1.length;

  const m = s1.length;
  const n = s2.length;
  let prevRow = new Array(n + 1);
  let currRow = new Array(n + 1);

  for (let j = 0; j <= n; j++) {
    prevRow[j] = j;
  }

  for (let i = 1; i <= m; i++) {
    currRow[0] = i;
    const char1 = s1.charCodeAt(i - 1);
    for (let j = 1; j <= n; j++) {
      const cost = char1 === s2.charCodeAt(j - 1) ? 0 : 1;
      currRow[j] = Math.min(
        prevRow[j] + 1,       // deletion
        currRow[j - 1] + 1,   // insertion
        prevRow[j - 1] + cost // substitution
      );
    }
    const temp = prevRow;
    prevRow = currRow;
    currRow = temp;
  }

  return prevRow[n];
}

/**
 * Sprawdza, czy zapytanie pasuje rozmycie (fuzzy) do tekstu docelowego
 * w ramach dopuszczalnej odległości edycyjnej.
 */
export function isFuzzyMatch(
  target: string | undefined | null,
  query: string | undefined | null,
  maxDistance?: number
): boolean {
  if (!target || !query) return false;
  const sTarget = normSearch(target);
  const sQuery = normSearch(query);
  if (!sTarget || !sQuery) return false;

  if (sTarget.includes(sQuery)) return true;

  const allowedDist =
    typeof maxDistance === 'number' && Number.isFinite(maxDistance) && maxDistance >= 0
      ? Math.floor(maxDistance)
      : sQuery.length > 5
      ? 2
      : 1;

  const tokens = tokenizeSearch(target);
  for (const token of tokens) {
    if (token === sQuery) return true;
    if (Math.abs(token.length - sQuery.length) <= allowedDist) {
      if (calculateLevenshteinDistance(token, sQuery) <= allowedDist) {
        return true;
      }
    }
  }

  return calculateLevenshteinDistance(sTarget, sQuery) <= allowedDist;
}

export interface FuzzySearchOptions {
  maxDistance?: number;
}

/**
 * Filtruje tablicę obiektów na podstawie rozmytego dopasowania (fuzzy match),
 * tolerując literówki i drobne błędy zapisu.
 */
export function filterByFuzzySearch<T>(
  items: T[] | undefined | null,
  query: string | undefined | null,
  extractFields: (item: T) => (string | undefined | null | unknown)[],
  options?: FuzzySearchOptions
): T[] {
  if (!Array.isArray(items)) return [];
  if (!query || typeof query !== 'string' || query.trim() === '') {
    return [...items];
  }

  const normQuery = normSearch(query);
  if (!normQuery) return [...items];

  const maxDist = options?.maxDistance;

  return items.filter((item) => {
    if (!item) return false;
    try {
      const fields = extractFields(item);
      if (!Array.isArray(fields) || fields.length === 0) return false;

      return fields.some((field) => {
        if (typeof field !== 'string' || !field.trim()) return false;
        return isFuzzyMatch(field, normQuery, maxDist);
      });
    } catch {
      return false;
    }
  });
}


/**
 * Wyodrębnia skrót tekstu (snippet) wokół pasującego zapytania wyszukiwania,
 * dodając wielokropek (...) na początku lub na końcu, jeśli tekst został obcięty.
 */
export function extractSearchSnippet(
  text: string | undefined | null,
  query: string | undefined | null,
  maxLength = 80
): string {
  if (typeof text !== 'string' || !text.trim()) return '';
  const safeText = text.trim();
  const safeMax =
    typeof maxLength === 'number' && Number.isFinite(maxLength) && maxLength > 0 && !Object.is(maxLength, -0)
      ? Math.floor(maxLength)
      : 80;

  if (safeText.length <= safeMax) {
    return safeText;
  }

  const cleanQuery = typeof query === 'string' ? query.trim().toLowerCase() : '';
  if (!cleanQuery) {
    return `${safeText.slice(0, safeMax).trimEnd()}...`;
  }

  const lowerText = safeText.toLowerCase();
  const matchIndex = lowerText.indexOf(cleanQuery);

  if (matchIndex === -1) {
    return `${safeText.slice(0, safeMax).trimEnd()}...`;
  }

  // Obliczamy okno wokół dopasowania
  const halfWindow = Math.floor((safeMax - cleanQuery.length) / 2);
  let startIndex = Math.max(0, matchIndex - halfWindow);
  let endIndex = Math.min(safeText.length, startIndex + safeMax);

  if (endIndex - startIndex < safeMax) {
    startIndex = Math.max(0, endIndex - safeMax);
  }

  let snippet = safeText.slice(startIndex, endIndex).trim();
  if (startIndex > 0) {
    snippet = `...${snippet}`;
  }
  if (endIndex < safeText.length) {
    snippet = `${snippet}...`;
  }

  return snippet;
}


export interface SearchCorrectionSuggestion {
  originalQuery: string;
  suggestedTerm: string;
  distance: number;
  similarityScore: number;
}

/**
 * Podpowiada potencjalne korekty literówek dla zapytania wyszukiwania na podstawie
 * słownika referencyjnego przy użyciu algorytmu odległości edycyjnej Levenshteina.
 */
export function suggestSearchCorrections(
  query: string | undefined | null,
  dictionary: string[],
  maxSuggestions = 3,
  maxDistance = 3
): SearchCorrectionSuggestion[] {
  if (
    !query ||
    typeof query !== 'string' ||
    !query.trim() ||
    !Array.isArray(dictionary) ||
    dictionary.length === 0
  ) {
    return [];
  }

  const cleanQuery = query.trim();
  const normQ = normSearch(cleanQuery);
  if (!normQ) return [];

  const safeMax = typeof maxSuggestions === 'number' && maxSuggestions > 0 ? maxSuggestions : 3;
  const safeDist = typeof maxDistance === 'number' && maxDistance >= 0 ? maxDistance : 3;

  const matches: SearchCorrectionSuggestion[] = [];
  const seen = new Set<string>();

  for (const term of dictionary) {
    if (!term || typeof term !== 'string' || !term.trim()) continue;
    const lowerTerm = term.trim().toLowerCase();
    if (seen.has(lowerTerm)) continue;
    seen.add(lowerTerm);

    const normTerm = normSearch(term);
    const dist = calculateLevenshteinDistance(normQ, normTerm);

    if (dist <= safeDist) {
      const maxLen = Math.max(normQ.length, normTerm.length);
      const similarityScore = maxLen > 0 ? Number((1 - dist / maxLen).toFixed(2)) : 1.0;

      matches.push({
        originalQuery: cleanQuery,
        suggestedTerm: term.trim(),
        distance: dist,
        similarityScore: Object.is(similarityScore, -0) ? 0 : similarityScore,
      });
    }
  }

  matches.sort((a, b) => {
    if (a.distance !== b.distance) return a.distance - b.distance;
    if (b.similarityScore !== a.similarityScore) return b.similarityScore - a.similarityScore;
    return a.suggestedTerm.localeCompare(b.suggestedTerm);
  });

  return matches.slice(0, safeMax);
}

export interface SearchRelevanceScore {
  score: number;
  exactMatch: boolean;
  prefixMatch: boolean;
  tokenCoverage: number;
}

/**
 * Oblicza punktowy wskaźnik dopasowania wyszukiwania (0-100) dla zadanego tekstu i zapytania,
 * badając zgodność dokładną, prefiksową oraz ułamek odnalezionych tokenów (token coverage).
 */
export function calculateSearchRelevanceScore(
  text: string | undefined | null,
  query: string | undefined | null
): SearchRelevanceScore {
  if (
    !text ||
    typeof text !== 'string' ||
    !text.trim() ||
    !query ||
    typeof query !== 'string' ||
    !query.trim()
  ) {
    return {
      score: 0,
      exactMatch: false,
      prefixMatch: false,
      tokenCoverage: 0,
    };
  }

  const normT = normSearch(text);
  const normQ = normSearch(query);

  if (!normT || !normQ) {
    return {
      score: 0,
      exactMatch: false,
      prefixMatch: false,
      tokenCoverage: 0,
    };
  }

  if (normT === normQ) {
    return {
      score: 100,
      exactMatch: true,
      prefixMatch: true,
      tokenCoverage: 1,
    };
  }

  const prefixMatch = normT.startsWith(normQ);
  const tokens = tokenizeSearch(normQ);
  if (tokens.length === 0) {
    return {
      score: 0,
      exactMatch: false,
      prefixMatch: false,
      tokenCoverage: 0,
    };
  }

  let matchedTokensCount = 0;
  for (const token of tokens) {
    if (normT.includes(token)) {
      matchedTokensCount++;
    }
  }

  const tokenCoverage = Number((matchedTokensCount / tokens.length).toFixed(2));
  let score = 0;

  if (prefixMatch) {
    score = Math.max(80, Math.round(80 + tokenCoverage * 15));
  } else if (tokenCoverage === 1) {
    const containsPhrase = normT.includes(normQ);
    score = containsPhrase ? 85 : 70;
  } else if (tokenCoverage > 0) {
    score = Math.round(tokenCoverage * 60);
  }

  return {
    score,
    exactMatch: false,
    prefixMatch,
    tokenCoverage,
  };
}

/**
 * Filtruje kolekcję encji według listy tagów zapytania (np. nuty smakowe, metody parzenia).
 * Obsługuje tryb koniunkcji ('all' - wszystkie tagi muszą pasować)
 * lub alternatywy ('any' - przynajmniej jeden tag musi pasować).
 * Tagi są znormalizowane i odporne na wielkość liter oraz diakrytyki.
 */
export function filterSearchEntriesByTags<T>(
  entries: T[] | undefined | null,
  tagExtractor: (entry: T) => string[] | undefined | null,
  queryTags?: string[] | string | null,
  matchMode: 'all' | 'any' = 'all'
): T[] {
  if (!Array.isArray(entries)) return [];
  if (typeof tagExtractor !== 'function') return [];

  let rawTags: string[] = [];
  if (Array.isArray(queryTags)) {
    rawTags = queryTags.filter((t): t is string => typeof t === 'string');
  } else if (typeof queryTags === 'string') {
    rawTags = queryTags.split(/[,\n;]/).map((t) => t.trim());
  }

  const normalizedQueryTags = rawTags
    .map((t) => normSearch(t))
    .filter((t) => t.length > 0);

  if (normalizedQueryTags.length === 0) {
    return entries.slice();
  }

  const mode = matchMode === 'any' ? 'any' : 'all';

  return entries.filter((entry) => {
    let entryTags: (string | undefined | null)[] = [];
    try {
      const extracted = tagExtractor(entry);
      if (Array.isArray(extracted)) {
        entryTags = extracted;
      }
    } catch {
      return false;
    }

    const normalizedEntryTags = entryTags
      .filter((t): t is string => typeof t === 'string')
      .map((t) => normSearch(t))
      .filter((t) => t.length > 0);

    if (mode === 'any') {
      return normalizedQueryTags.some((qt) =>
        normalizedEntryTags.some((et) => et === qt || et.includes(qt))
      );
    } else {
      return normalizedQueryTags.every((qt) =>
        normalizedEntryTags.some((et) => et === qt || et.includes(qt))
      );
    }
  });
}

export interface NumericRangeFilterOptions {
  min?: number | string | null;
  max?: number | string | null;
  inclusive?: boolean;
}

/**
 * Filtruje kolekcję encji według zadanego przedziału numerycznego (np. wysokość upraw, proporcja, doza, woda).
 * Z pełną sanityzacją wartości wejściowych, obsługą stringów z przecinkami dziesiętnymi, NaN, Infinity i -0.
 */
export function filterSearchEntriesByNumericRange<T>(
  entries: T[] | undefined | null,
  valueExtractor: (entry: T) => number | string | undefined | null,
  options?: NumericRangeFilterOptions | null
): T[] {
  if (!Array.isArray(entries)) return [];
  if (typeof valueExtractor !== 'function') return [];

  const parseNum = (v: unknown): number | null => {
    if (v === null || v === undefined) return null;
    if (typeof v === 'number') {
      return Number.isFinite(v) && !Object.is(v, -0) ? v : Object.is(v, -0) ? 0 : null;
    }
    if (typeof v === 'string') {
      const clean = v.replace(/\uFEFF/g, '').replace(/[^\d.,+-]/g, '').replace(',', '.').trim();
      const parsed = parseFloat(clean);
      return Number.isFinite(parsed) && !Object.is(parsed, -0) ? parsed : Object.is(parsed, -0) ? 0 : null;
    }
    return null;
  };

  const minVal = parseNum(options?.min);
  const maxVal = parseNum(options?.max);
  const inclusive = options?.inclusive !== false;

  // Jeśli brak filtrów min i max, zwracamy kopię tablicy
  if (minVal === null && maxVal === null) {
    return entries.slice();
  }

  return entries.filter((entry) => {
    let val: number | null = null;
    try {
      val = parseNum(valueExtractor(entry));
    } catch {
      return false;
    }

    if (val === null) return false;

    if (minVal !== null) {
      if (inclusive ? val < minVal : val <= minVal) {
        return false;
      }
    }

    if (maxVal !== null) {
      if (inclusive ? val > maxVal : val >= maxVal) {
        return false;
      }
    }

    return true;
  });
}

export interface SearchFacetItem {
  value: string;
  count: number;
}

/**
 * Agreguje fasety (wartości i liczbę ich wystąpień) dla kolekcji obiektów na podstawie mapy ekstraktorów.
 * Obsługuje wartości pojedyncze (string/number) oraz tablice (np. tagi).
 * Wyniki dla każdej fasety są posortowane malejąco według liczby wystąpień, a następnie alfabetycznie.
 */
export function aggregateSearchFacets<T>(
  entries: T[] | undefined | null,
  facetKeyExtractors: Record<string, (item: T) => string | string[] | undefined | null> | undefined | null
): Record<string, SearchFacetItem[]> {
  if (!facetKeyExtractors || typeof facetKeyExtractors !== 'object') {
    return {};
  }

  const result: Record<string, SearchFacetItem[]> = {};
  const facetKeys = Object.keys(facetKeyExtractors);

  for (const key of facetKeys) {
    result[key] = [];
  }

  if (!Array.isArray(entries) || entries.length === 0) {
    return result;
  }

  for (const facetName of facetKeys) {
    const extractor = facetKeyExtractors[facetName];
    if (typeof extractor !== 'function') {
      result[facetName] = [];
      continue;
    }

    const counts = new Map<string, number>();

    for (const item of entries) {
      if (!item) continue;
      let rawVal: unknown;
      try {
        rawVal = extractor(item);
      } catch {
        continue;
      }

      if (rawVal === undefined || rawVal === null) continue;

      if (Array.isArray(rawVal)) {
        for (const v of rawVal) {
          if (typeof v === 'string' && v.trim()) {
            const clean = v.trim();
            counts.set(clean, (counts.get(clean) || 0) + 1);
          } else if (typeof v === 'number' && Number.isFinite(v)) {
            const clean = String(v);
            counts.set(clean, (counts.get(clean) || 0) + 1);
          }
        }
      } else if (typeof rawVal === 'string' && rawVal.trim()) {
        const clean = rawVal.trim();
        counts.set(clean, (counts.get(clean) || 0) + 1);
      } else if (typeof rawVal === 'number' && Number.isFinite(rawVal)) {
        const clean = String(rawVal);
        counts.set(clean, (counts.get(clean) || 0) + 1);
      }
    }

    const facetItems: SearchFacetItem[] = Array.from(counts.entries()).map(([value, count]) => ({
      value,
      count,
    }));

    facetItems.sort((a, b) => {
      if (b.count !== a.count) {
        return b.count - a.count;
      }
      return a.value.localeCompare(b.value);
    });

    result[facetName] = facetItems;
  }

  return result;
}

/**
 * Filtruje kolekcję elementów na podstawie zaznaczonych wartości faset (faceted search).
 * Stosuje logikę AND pomiędzy fasetami (kategorią, pochodzeniem, tagami) oraz OR wewnątrz wartości danej fasety.
 */
export function filterBySearchFacets<T>(
  items: T[] | undefined | null,
  selectedFacets: Record<string, (string | number)[]> | undefined | null,
  extractors: Record<string, (item: T) => unknown> | undefined | null
): T[] {
  if (!Array.isArray(items)) return [];
  if (
    !selectedFacets ||
    typeof selectedFacets !== 'object' ||
    !extractors ||
    typeof extractors !== 'object'
  ) {
    return [...items];
  }

  // Wyodrębnij tylko te fasety, które mają niepuste zaznaczone wartości
  const activeFacets = Object.entries(selectedFacets).filter(([_, values]) => {
    return Array.isArray(values) && values.length > 0;
  });

  if (activeFacets.length === 0) {
    return [...items];
  }

  return items.filter((item) => {
    if (!item) return false;

    for (const [facetName, selectedValues] of activeFacets) {
      const extractor = extractors[facetName];
      if (typeof extractor !== 'function') continue;

      let extracted: unknown;
      try {
        extracted = extractor(item);
      } catch {
        return false;
      }

      if (extracted === undefined || extracted === null) return false;

      const matchFound = selectedValues.some((selectedVal) => {
        if (typeof selectedVal === 'string') {
          const normSelected = selectedVal.trim().toLowerCase();
          if (Array.isArray(extracted)) {
            return extracted.some(
              (v) => typeof v === 'string' && v.trim().toLowerCase() === normSelected
            );
          }
          if (typeof extracted === 'string') {
            return extracted.trim().toLowerCase() === normSelected;
          }
          return false;
        }

        if (typeof selectedVal === 'number' && Number.isFinite(selectedVal)) {
          if (Array.isArray(extracted)) {
            return extracted.some((v) => typeof v === 'number' && v === selectedVal);
          }
          if (typeof extracted === 'number') {
            return extracted === selectedVal;
          }
          return false;
        }

        return false;
      });

      if (!matchFound) return false;
    }

    return true;
  });
}






export interface ParsedSearchQuery {
  rawQuery: string;
  freeTextTokens: string[];
  fieldFilters: Record<string, string[]>;
  negatedTokens: string[];
  isEmpty: boolean;
}

/**
 * Parsuje złożone zapytanie wyszukiwania, wyodrębniając filtry polowe (np. method:v60),
 * tokeny zanegowane (np. -decaf) oraz swobodne tokeny tekstowe.
 */
export function parseSearchQuery(rawQuery: string | undefined | null): ParsedSearchQuery {
  if (typeof rawQuery !== 'string' || !rawQuery.trim()) {
    return {
      rawQuery: typeof rawQuery === 'string' ? rawQuery : '',
      freeTextTokens: [],
      fieldFilters: {},
      negatedTokens: [],
      isEmpty: true,
    };
  }

  const cleanRaw = rawQuery.replace(/\uFEFF/g, '').trim();
  const rawTokens = cleanRaw.split(/\s+/).filter(Boolean);

  const freeTextTokens: string[] = [];
  const fieldFilters: Record<string, string[]> = {};
  const negatedTokens: string[] = [];

  for (const token of rawTokens) {
    const fieldMatch = token.match(/^([a-zA-Z_]+):(.+)$/);
    if (fieldMatch) {
      const fieldKey = fieldMatch[1].toLowerCase();
      const fieldValue = fieldMatch[2].toLowerCase();
      if (!fieldFilters[fieldKey]) {
        fieldFilters[fieldKey] = [];
      }
      fieldFilters[fieldKey].push(fieldValue);
      continue;
    }

    if (token.startsWith('-') && token.length > 1) {
      negatedTokens.push(token.slice(1).toLowerCase());
      continue;
    }

    freeTextTokens.push(token.toLowerCase());
  }

  const isEmpty =
    freeTextTokens.length === 0 &&
    Object.keys(fieldFilters).length === 0 &&
    negatedTokens.length === 0;

  return {
    rawQuery: cleanRaw,
    freeTextTokens,
    fieldFilters,
    negatedTokens,
    isEmpty,
  };
}


export interface SearchMatchHighlight {
  text: string;
  isMatch: boolean;
}

/**
 * Bezpiecznie dzieli tekst na pasujące i niepasujące segmenty na podstawie zapytania
 * lub listy tokenów (np. dla podświetlania w interfejsie użytkownika), zachowując wielkość liter.
 */
export function highlightSearchMatches(
  text: string | undefined | null,
  queryOrTokens: string | string[] | undefined | null
): SearchMatchHighlight[] {
  if (typeof text !== 'string' || text.length === 0) {
    return [];
  }

  let tokens: string[] = [];
  if (Array.isArray(queryOrTokens)) {
    tokens = queryOrTokens
      .filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
      .map((t) => t.trim());
  } else if (typeof queryOrTokens === 'string') {
    tokens = queryOrTokens
      .split(/\s+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
  }

  if (tokens.length === 0) {
    return [{ text, isMatch: false }];
  }

  const intervals: [number, number][] = [];
  const lowerText = text.toLowerCase();

  for (const token of tokens) {
    const lowerToken = token.toLowerCase();
    let startIndex = 0;
    while (startIndex < lowerText.length) {
      const idx = lowerText.indexOf(lowerToken, startIndex);
      if (idx === -1) break;
      intervals.push([idx, idx + lowerToken.length]);
      startIndex = idx + Math.max(1, lowerToken.length);
    }
  }

  if (intervals.length === 0) {
    return [{ text, isMatch: false }];
  }

  intervals.sort((a, b) => a[0] - b[0] || a[1] - b[1]);

  const merged: [number, number][] = [];
  let current = intervals[0];

  for (let i = 1; i < intervals.length; i++) {
    const next = intervals[i];
    if (next[0] <= current[1]) {
      current[1] = Math.max(current[1], next[1]);
    } else {
      merged.push(current);
      current = next;
    }
  }
  merged.push(current);

  const result: SearchMatchHighlight[] = [];
  let cursor = 0;

  for (const [start, end] of merged) {
    if (start > cursor) {
      result.push({ text: text.slice(cursor, start), isMatch: false });
    }
    result.push({ text: text.slice(start, end), isMatch: true });
    cursor = end;
  }

  if (cursor < text.length) {
    result.push({ text: text.slice(cursor), isMatch: false });
  }

  return result;
}


// ============================================================================
// TASK-P99-01-ODK: Multi-Field Search Relevance Scorer (Wielopolowy skaner relewancji)
// ============================================================================

export type MultiFieldMatchTier = 'exact' | 'strong' | 'moderate' | 'weak' | 'none';

export interface MultiFieldSearchScore {
  totalScore: number;
  tier: MultiFieldMatchTier;
  dominantField: 'title' | 'subtitle' | 'content' | 'tags' | 'none';
  matchedTokens: string[];
  missingTokens: string[];
  fieldScores: {
    title: number;
    subtitle: number;
    content: number;
    tags: number;
  };
  summaryPl: string;
  summaryEn: string;
}

export function evaluateMultiFieldSearchScore(
  item:
    | {
        title?: string | null;
        subtitle?: string | null;
        content?: string | null;
        tags?: string[] | null;
      }
    | null
    | undefined,
  query: string | null | undefined,
  weights?: {
    title?: number;
    subtitle?: number;
    content?: number;
    tags?: number;
  } | null
): MultiFieldSearchScore {
  const emptyResult: MultiFieldSearchScore = {
    totalScore: 0,
    tier: 'none',
    dominantField: 'none',
    matchedTokens: [],
    missingTokens: [],
    fieldScores: { title: 0, subtitle: 0, content: 0, tags: 0 },
    summaryPl: 'Brak dopasowania do zapytania wyszukiwania.',
    summaryEn: 'No match for the search query.',
  };

  if (!item || typeof item !== 'object' || !query || typeof query !== 'string' || !query.trim()) {
    return emptyResult;
  }

  const tokens = tokenizeSearch(query);
  if (tokens.length === 0) {
    return emptyResult;
  }

  const titleStr = typeof item.title === 'string' ? item.title : '';
  const subtitleStr = typeof item.subtitle === 'string' ? item.subtitle : '';
  const contentStr = typeof item.content === 'string' ? item.content : '';
  const tagsStr = Array.isArray(item.tags)
    ? item.tags.filter((t) => typeof t === 'string').join(' ')
    : '';

  const wTitle = typeof weights?.title === 'number' && weights.title >= 0 ? weights.title : 0.45;
  const wSub = typeof weights?.subtitle === 'number' && weights.subtitle >= 0 ? weights.subtitle : 0.25;
  const wTags = typeof weights?.tags === 'number' && weights.tags >= 0 ? weights.tags : 0.20;
  const wContent = typeof weights?.content === 'number' && weights.content >= 0 ? weights.content : 0.10;
  const totalWeight = (wTitle + wSub + wTags + wContent) || 1.0;

  const scoreTitle = calculateSearchRelevanceScore(titleStr, query).score;
  const scoreSubtitle = calculateSearchRelevanceScore(subtitleStr, query).score;
  const scoreTags = calculateSearchRelevanceScore(tagsStr, query).score;
  const scoreContent = calculateSearchRelevanceScore(contentStr, query).score;

  const weightedSum =
    (scoreTitle * wTitle +
      scoreSubtitle * wSub +
      scoreTags * wTags +
      scoreContent * wContent) /
    totalWeight;

  const totalScore = Math.max(0, Math.min(100, Math.round(weightedSum)));

  // Dopasowanie tokenów w dowolnym z pól
  const combinedNormText = normSearch(`${titleStr} ${subtitleStr} ${tagsStr} ${contentStr}`);
  const matchedTokens: string[] = [];
  const missingTokens: string[] = [];

  for (const token of tokens) {
    if (combinedNormText.includes(token)) {
      matchedTokens.push(token);
    } else {
      missingTokens.push(token);
    }
  }

  let dominantField: 'title' | 'subtitle' | 'content' | 'tags' | 'none' = 'none';
  if (totalScore > 0) {
    const scores = [
      { field: 'title' as const, score: scoreTitle },
      { field: 'subtitle' as const, score: scoreSubtitle },
      { field: 'tags' as const, score: scoreTags },
      { field: 'content' as const, score: scoreContent },
    ];
    scores.sort((a, b) => b.score - a.score);
    dominantField = scores[0].field;
  }

  let tier: MultiFieldMatchTier = 'none';
  let summaryPl = 'Brak dopasowania do zapytania.';
  let summaryEn = 'No query match.';

  if (totalScore >= 90) {
    tier = 'exact';
    summaryPl = `Dokładne dopasowanie (${totalScore}/100) w polu ${dominantField}.`;
    summaryEn = `Exact match (${totalScore}/100) in ${dominantField} field.`;
  } else if (totalScore >= 65) {
    tier = 'strong';
    summaryPl = `Silne dopasowanie wielopolowe (${totalScore}/100) z dominacją pola ${dominantField}.`;
    summaryEn = `Strong multi-field match (${totalScore}/100) dominated by ${dominantField}.`;
  } else if (totalScore >= 40) {
    tier = 'moderate';
    summaryPl = `Umiarkowane dopasowanie (${totalScore}/100), odnaleziono ${matchedTokens.length}/${tokens.length} słów kluczowych.`;
    summaryEn = `Moderate match (${totalScore}/100), matched ${matchedTokens.length}/${tokens.length} keywords.`;
  } else if (totalScore > 0) {
    tier = 'weak';
    summaryPl = `Częściowe lub słabe dopasowanie (${totalScore}/100).`;
    summaryEn = `Partial or weak match (${totalScore}/100).`;
  }

  return {
    totalScore,
    tier,
    dominantField,
    matchedTokens,
    missingTokens,
    fieldScores: {
      title: scoreTitle,
      subtitle: scoreSubtitle,
      content: scoreContent,
      tags: scoreTags,
    },
    summaryPl,
    summaryEn,
  };
}

export type SearchCoverageTier = 'exact_full' | 'high_coverage' | 'partial' | 'none';

export interface SearchTermCoverage {
  query: string;
  totalQueryTerms: number;
  matchedTermsCount: number;
  coverageRatio: number;
  coveragePercent: number;
  tier: SearchCoverageTier;
  matchedTerms: string[];
  missingTerms: string[];
  summaryPl: string;
  summaryEn: string;
}

export function calculateSearchTermCoverage(
  query: string | undefined | null,
  targetText: string | string[] | undefined | null
): SearchTermCoverage {
  const safeQuery = typeof query === 'string' ? query.trim() : '';
  const tokens = Array.from(new Set(tokenizeSearch(safeQuery)));

  let flatTarget = '';
  if (Array.isArray(targetText)) {
    flatTarget = targetText.filter((t) => typeof t === 'string').join(' ');
  } else if (typeof targetText === 'string') {
    flatTarget = targetText;
  }
  const normTarget = normSearch(flatTarget);

  if (tokens.length === 0) {
    return {
      query: safeQuery,
      totalQueryTerms: 0,
      matchedTermsCount: 0,
      coverageRatio: 1.0,
      coveragePercent: 100,
      tier: 'exact_full',
      matchedTerms: [],
      missingTerms: [],
      summaryPl: 'Puste zapytanie wyszukiwania (pokrycie: 100%).',
      summaryEn: 'Empty search query (coverage: 100%).',
    };
  }

  const matchedTerms: string[] = [];
  const missingTerms: string[] = [];

  for (const token of tokens) {
    if (normTarget.includes(token)) {
      matchedTerms.push(token);
    } else {
      missingTerms.push(token);
    }
  }

  const matchedTermsCount = matchedTerms.length;
  const coverageRatio = Math.round((matchedTermsCount / tokens.length) * 100) / 100;
  const coveragePercent = Math.round((matchedTermsCount / tokens.length) * 100);

  let tier: SearchCoverageTier = 'none';
  if (coveragePercent === 100) {
    tier = 'exact_full';
  } else if (coveragePercent >= 65) {
    tier = 'high_coverage';
  } else if (coveragePercent > 0) {
    tier = 'partial';
  }

  const missingFormattedPl = missingTerms.length > 0 ? missingTerms.join(', ') : 'brak';
  const missingFormattedEn = missingTerms.length > 0 ? missingTerms.join(', ') : 'none';

  const summaryPl = `Pokrycie zapytania: ${coveragePercent}% (${matchedTermsCount}/${tokens.length} słów kluczowych). Brakujące: ${missingFormattedPl}.`;
  const summaryEn = `Query coverage: ${coveragePercent}% (${matchedTermsCount}/${tokens.length} terms). Missing: ${missingFormattedEn}.`;

  return {
    query: safeQuery,
    totalQueryTerms: tokens.length,
    matchedTermsCount,
    coverageRatio,
    coveragePercent,
    tier,
    matchedTerms,
    missingTerms,
    summaryPl,
    summaryEn,
  };
}

export type SearchRelevanceGrade = 'exact' | 'high' | 'medium' | 'low' | 'none';

export interface SearchMatchRelevanceResult {
  searchTerm: string;
  targetText: string;
  relevanceScore: number;
  grade: SearchRelevanceGrade;
  isExactMatch: boolean;
  isPrefixMatch: boolean;
  isSubstringMatch: boolean;
  explanationPl: string;
  explanationEn: string;
}

/**
 * Ocenia stopień trafności dopasowania zapytania wyszukiwania do tekstu docelowego,
 * uwzględniając dopasowanie ścisłe, prefiks słowa, podciąg oraz odległość Levenshteina.
 */
export function calculateSearchMatchRelevance(
  searchTerm: string | undefined | null,
  targetText: string | undefined | null
): SearchMatchRelevanceResult {
  const normTerm = typeof searchTerm === 'string' ? normSearch(searchTerm).trim() : '';
  const normTarget = typeof targetText === 'string' ? normSearch(targetText).trim() : '';

  if (!normTerm || !normTarget) {
    return {
      searchTerm: typeof searchTerm === 'string' ? searchTerm : '',
      targetText: typeof targetText === 'string' ? targetText : '',
      relevanceScore: 0,
      grade: 'none',
      isExactMatch: false,
      isPrefixMatch: false,
      isSubstringMatch: false,
      explanationPl: 'Brak terminu lub tekstu docelowego — trafność 0.',
      explanationEn: 'Missing search term or target text — relevance 0.',
    };
  }

  const isExactMatch = normTerm === normTarget;
  const isPrefixMatch = normTarget.startsWith(normTerm);
  const isSubstringMatch = normTarget.includes(normTerm);

  let relevanceScore = 0;
  let grade: SearchRelevanceGrade = 'none';

  if (isExactMatch) {
    relevanceScore = 100;
    grade = 'exact';
  } else if (isPrefixMatch) {
    const ratio = normTerm.length / normTarget.length;
    relevanceScore = Math.min(95, Math.round(80 + ratio * 15));
    grade = 'high';
  } else if (isSubstringMatch) {
    const words = normTarget.split(/\s+/);
    const wordPrefix = words.some((w) => w.startsWith(normTerm));
    if (wordPrefix) {
      relevanceScore = 80;
      grade = 'high';
    } else {
      relevanceScore = 60;
      grade = 'medium';
    }
  } else {
    const dist = calculateLevenshteinDistance(normTerm, normTarget);
    const maxLen = Math.max(normTerm.length, normTarget.length);
    const similarity = maxLen > 0 ? (maxLen - dist) / maxLen : 0;
    if (similarity >= 0.7) {
      relevanceScore = Math.round(similarity * 60);
      grade = 'medium';
    } else if (similarity >= 0.4) {
      relevanceScore = Math.round(similarity * 40);
      grade = 'low';
    } else {
      relevanceScore = 0;
      grade = 'none';
    }
  }

  let explanationPl = '';
  let explanationEn = '';

  if (grade === 'exact') {
    explanationPl = 'Ścisłe dopasowanie pełnej frazy (100 punktów).';
    explanationEn = 'Exact full string match (100 points).';
  } else if (grade === 'high') {
    explanationPl = `Wysoka trafność (${relevanceScore}/100): prefiks słowa lub kluczowej frazy.`;
    explanationEn = `High relevance (${relevanceScore}/100): word or phrase prefix match.`;
  } else if (grade === 'medium') {
    explanationPl = `Umiarkowana trafność (${relevanceScore}/100): podciąg w tekście lub bliskie podobieństwo leksykalne.`;
    explanationEn = `Moderate relevance (${relevanceScore}/100): substring match or close lexical similarity.`;
  } else if (grade === 'low') {
    explanationPl = `Niska trafność (${relevanceScore}/100): częściowe dopasowanie z literówkami.`;
    explanationEn = `Low relevance (${relevanceScore}/100): partial match with potential typos.`;
  } else {
    explanationPl = 'Brak dopasowania semantycznego lub leksykalnego (0 punktów).';
    explanationEn = 'No semantic or lexical match found (0 points).';
  }

  return {
    searchTerm: typeof searchTerm === 'string' ? searchTerm : '',
    targetText: typeof targetText === 'string' ? targetText : '',
    relevanceScore,
    grade,
    isExactMatch,
    isPrefixMatch,
    isSubstringMatch,
    explanationPl,
    explanationEn,
  };
}
