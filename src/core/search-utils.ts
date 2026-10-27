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

