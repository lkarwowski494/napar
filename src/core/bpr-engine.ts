// ============================================================================
// Napar — Parser czasu kroków procedury (Zero-Click Timer)
// ============================================================================

/**
 * Parsuje czas trwania kroku (w sekundach) bezpośrednio z opisu tekstowego
 * (np. "przez 10–15 minut", "odczekaj 30 s", "przez 2 minuty", "wait 45 sec").
 * Jeśli tekst nie zawiera jednoznacznej jednostki czasu, zwraca fallbackSeconds.
 */
export function parseStepDurationSeconds(
  instruction: string | undefined | null,
  fallbackSeconds: number | string = 30,
  prioritizeFallback = false
): number {
  const parsedFallback =
    typeof fallbackSeconds === 'number'
      ? fallbackSeconds
      : typeof fallbackSeconds === 'string'
      ? parseFloat(fallbackSeconds.replace(',', '.'))
      : NaN;
  let safeFallback =
    Number.isFinite(parsedFallback) && parsedFallback > 0
      ? Math.max(1, Math.min(86400, Math.round(parsedFallback)))
      : 30;
  if (Object.is(safeFallback, -0)) safeFallback = 30;

  if (prioritizeFallback) {
    return safeFallback;
  }
  if (!instruction || typeof instruction !== 'string' || !instruction.trim()) {
    return safeFallback;
  }

  const normalized = instruction
    .replace(/\uFEFF/g, '')
    .replace(/[\x00-\x1F\x7F-\x9F]/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/,/g, '.');

  // 0. Ułamki i naturalne wyrażenia czasu (pół minuty, 1/2 minuty, kwadrans, godziny)
  if (/(?:p[oó][lł]torej\s*godzin|one\s+and\s+a\s+half\s*hour|1\s+1\/2\s*h(?:our)?)/i.test(normalized)) {
    return 5400;
  }
  if (/(?:p[oó][lł]\s*godzin|half\s*(?:an?\s*)?hour|1\/2\s*h(?:our)?)/i.test(normalized)) {
    return 1800;
  }
  if (/(?:p[oó][lł]torej\s*minut|one\s+and\s+a\s+half\s*min|1\s+1\/2\s*min)/i.test(normalized)) {
    return 90;
  }
  if (/(?:p[oó][lł]\s*minut|half\s*(?:a\s*)?minut|1\/2\s*min)/i.test(normalized)) {
    return 30;
  }
  if (/(?:3\/4\s*minut)/i.test(normalized)) {
    return 45;
  }
  if (/(?:1\/4\s*minut|quarter\s*minut)/i.test(normalized)) {
    return 15;
  }
  if (/(?:kwadrans|quarter\s*of\s*an\s*hour)/i.test(normalized)) {
    return 900;
  }

  // 0a. Złożone godziny i minuty: np. "1 godzina i 30 minut", "1 hr 15 mins", "1 godz. 20 min"
  const compoundHrMatch = normalized.match(
    /(\d+(?:\.\d+)?)\s*(?:godzin(?:[a-ząęółśżźćń]+)?|godz\.?|hours?|hrs?|h\b)\s*(?:i|and)?\s*(\d+(?:\.\d+)?)\s*(?:minut(?:[a-ząęółśżźćń]+)?|minutes?|mins?|min\b|m\b)/i
  );
  if (compoundHrMatch) {
    const hrs = parseFloat(compoundHrMatch[1]);
    const mins = parseFloat(compoundHrMatch[2]);
    if (!Number.isNaN(hrs) && !Number.isNaN(mins) && (hrs > 0 || mins > 0)) {
      const res = Math.max(1, Math.min(86400, Math.round(hrs * 3600 + mins * 60)));
      return Object.is(res, -0) ? safeFallback : res;
    }
  }

  // 0b. Zakres godzin: np. "10-12 godzin", "8–12 godz.", "12 do 16 godzin", "8 to 12 hours", "12-16 hrs"
  const hrRangeMatch = normalized.match(
    /(\d+(?:\.\d+)?)\s*(?:[-–—]|do|to)\s*(\d+(?:\.\d+)?)\s*(?:godzin(?:[a-ząęółśżźćń]+)?|godz\.?|hours?|hrs?|h\b)/i
  );
  if (hrRangeMatch) {
    const hrVal = parseFloat(hrRangeMatch[1]);
    if (!Number.isNaN(hrVal) && hrVal > 0) {
      const res = Math.max(1, Math.min(86400, Math.round(hrVal * 3600)));
      return Object.is(res, -0) ? safeFallback : res;
    }
  }

  // 0c. Pojedyncze godziny: np. "12 godzin", "8 godz.", "steep 10 hours", "12 hrs", "1.5 godz."
  const hrSingleMatch = normalized.match(
    /(\d+(?:\.\d+)?)\s*(?:godzin(?:[a-ząęółśżźćń]+)?|godz\.?|hours?|hrs?|h\b)/i
  );
  if (hrSingleMatch) {
    const hrs = parseFloat(hrSingleMatch[1]);
    if (!Number.isNaN(hrs) && hrs > 0) {
      const res = Math.max(1, Math.min(86400, Math.round(hrs * 3600)));
      return Object.is(res, -0) ? safeFallback : res;
    }
  }

  // 1. Zakres minut: np. "10-15 minut", "10–15 min", "2 do 3 minut", "2 to 3 mins"
  const minRangeMatch = normalized.match(
    /(\d+(?:\.\d+)?)\s*(?:[-–—]|do|to)\s*(\d+(?:\.\d+)?)\s*(?:minut(?:[a-ząęółśżźćń]+)?|minutes?|mins?|min\b)/i
  );
  if (minRangeMatch) {
    const minVal = parseFloat(minRangeMatch[1]);
    if (!Number.isNaN(minVal) && minVal > 0) {
      const res = Math.max(1, Math.min(86400, Math.round(minVal * 60)));
      return Object.is(res, -0) ? safeFallback : res;
    }
  }

  // 2. Zakres sekund: np. "30-45 s", "25–30 sekund", "15-20 sec", "15-20 secs"
  const secRangeMatch = normalized.match(
    /(\d+(?:\.\d+)?)\s*(?:[-–—]|do|to)\s*(\d+(?:\.\d+)?)\s*(?:sekund(?:[a-ząęółśżźćń]+)?|sek\b|secs?\b|sec(?:onds?)?\b|s\b)/i
  );
  if (secRangeMatch) {
    const secVal = parseFloat(secRangeMatch[1]);
    if (!Number.isNaN(secVal) && secVal > 0) {
      const res = Math.max(1, Math.min(86400, Math.round(secVal)));
      return Object.is(res, -0) ? safeFallback : res;
    }
  }

  // 3. Złożone minuty i sekundy: np. "1 min 30 sek", "2 minuty i 15 sekund", "1 min 45 s", "2m 30s", "2m30s"
  const compoundMatch = normalized.match(
    /(\d+(?:\.\d+)?)\s*(?:minut(?:[a-ząęółśżźćń]+)?|minutes?|mins?|min\b|m(?=\d|\b))\s*(?:i|and)?\s*(\d+(?:\.\d+)?)\s*(?:sekund(?:[a-ząęółśżźćń]+)?|sek\b|secs?\b|sec(?:onds?)?\b|s\b)/i
  );
  if (compoundMatch) {
    const mins = parseFloat(compoundMatch[1]);
    const secs = parseFloat(compoundMatch[2]);
    if (!Number.isNaN(mins) && !Number.isNaN(secs) && (mins > 0 || secs > 0)) {
      const res = Math.max(1, Math.min(86400, Math.round(mins * 60 + secs)));
      return Object.is(res, -0) ? safeFallback : res;
    }
  }

  // 4. Pojedyncze minuty (+ opcjonalne sekundy): np. "przez 2 minuty", "1.5 min", "wait 2 mins", "steep 4 minutes", "odczekaj 2m"
  const minSingleMatch = normalized.match(
    /(\d+(?:\.\d+)?)\s*(?:minut(?:[a-ząęółśżźćń]+)?|minutes?|mins?|min\b|m\b)/i
  );
  if (minSingleMatch) {
    const mins = parseFloat(minSingleMatch[1]);
    if (!Number.isNaN(mins) && mins > 0) {
      const res = Math.max(1, Math.min(86400, Math.round(mins * 60)));
      return Object.is(res, -0) ? safeFallback : res;
    }
  }

  // 4. Pojedyncze sekundy: np. "odczekaj 30 s", "przez 45 sekund", "wait 40s", "pause 25 secs"
  const secSingleMatch = normalized.match(
    /(\d+(?:\.\d+)?)\s*(?:sekund(?:[a-ząęółśżźćń]+)?|sek\b|secs?\b|sec(?:onds?)?\b|s\b)/i
  );
  if (secSingleMatch) {
    const secs = parseFloat(secSingleMatch[1]);
    if (!Number.isNaN(secs) && secs > 0) {
      const res = Math.max(1, Math.min(86400, Math.round(secs)));
      return Object.is(res, -0) ? safeFallback : res;
    }
  }

  return safeFallback;
}
