// ============================================================================
// Napar (Steepwise) — Parsowanie liczb dziesiętnych z pól formularzy
// Akceptuje kropkę i przecinek jako separator dziesiętny (np. "1.5" i "1,5").
// Zwraca NaN dla pustego tekstu, tekstu nie będącego liczbą i wartości z
// dodatkowymi znakami (np. "12abc"), tak jak parseFloat zwraca NaN dla braku liczby.
// ============================================================================

const DECIMAL_PATTERN = /^[+-]?(\d+\.?\d*|\.\d+)$/;

/**
 * Zamienia tekst z pola formularza na liczbę. Spacje na początku i końcu są ignorowane.
 * Zwraca NaN, gdy tekst nie jest pojedynczą liczbą dziesiętną.
 */
export function parseDecimal(input: string): number {
  if (typeof input !== 'string') return NaN;
  const normalized = input.trim().replace(',', '.');
  if (!DECIMAL_PATTERN.test(normalized)) return NaN;
  return Number(normalized);
}
