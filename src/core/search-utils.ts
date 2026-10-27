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


