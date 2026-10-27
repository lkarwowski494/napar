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
