// ============================================================================
// Napar (Steepwise) — Search Utilities (RD-ENG-07, NFR-INT-015)
// Normalizacja tekstu wyszukiwarki z obsługą polskich znaków diakrytycznych
// ============================================================================

/**
 * RD-ENG-07 & NFR-INT-015: Normalizacja tekstu wyszukiwarki
 * Usuwa znaki diakrytyczne (NFD) oraz zamienia 'ł'/'Ł' na 'l'/'L'.
 */
export function normSearch(s: string): string {
  if (typeof s !== 'string') return '';
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ł/g, 'l')
    .trim();
}

/**
 * Sprawdza czy tekst elementu pasuje do zapytania wyszukiwania
 */
export function matchesSearch(text: string, query: string): boolean {
  if (!query || query.trim() === '') return true;
  const normQuery = normSearch(query);
  const normTarget = normSearch(text);
  return normTarget.includes(normQuery);
}
