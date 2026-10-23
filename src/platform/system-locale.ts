// ============================================================================
// Napar (Steepwise) — Adapter platformy: język systemu (BCP 47)
// Bez zależności od expo. Błąd lub brak danych -> null (decyduje język zapasowy).
// ============================================================================

export function readSystemLocale(): string | null {
  try {
    const locale = new Intl.DateTimeFormat().resolvedOptions().locale;
    return typeof locale === 'string' && locale.length > 0 ? locale : null;
  } catch {
    return null;
  }
}
