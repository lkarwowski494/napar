// ============================================================================
// Napar (Steepwise) — Silnik Automatyzacji Procesowej BPR (To-Be Architecture)
// 1. Automatyczne parsowanie czasu z opisu kroku procedury (Zero-Click Timer)
// 2. 14-dniowy Proaktywny Kalendarz i Harmonogram Akcji (1-Tap Action Feed)
// 3. Generator przypomnień kalendarzowych RFC 5545 (.ics)
// ============================================================================

import { InventoryItem, BrewSession } from './database-schema';
import { pluralPl } from './i18n';

export interface CalendarDayItem {
  dateIso: string; // YYYY-MM-DD
  dayNumber: number;
  weekdayPl: string;
  weekdayEn: string;
  isToday: boolean;
  sessionCount: number;
  actionCount: number;
  dotType: 'none' | 'action' | 'session' | 'both';
}

export interface ProactiveActionItem {
  id: string;
  dateIso: string; // YYYY-MM-DD
  daysOffset: number; // 0 = DZIŚ, 1 = JUTRO, >1 = Za X dni
  bucketLabelPl: string;
  bucketLabelEn: string;
  titlePl: string;
  titleEn: string;
  subtitlePl: string;
  subtitleEn: string;
  badgeColor: 'copper' | 'success' | 'warning';
  priority?: 'high' | 'medium' | 'low' | string;
  inventoryItemId?: string;
  recipeId?: string;
  recommendedMethod?: string;
  doseGrams?: number;
  waterGrams?: number;
  waterTempCelsius?: number;
}

const WEEKDAYS_PL = ['Nd', 'Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So'];
const WEEKDAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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

/**
 * Wykrywa inkrement czasu parzenia dla wielokrotnych ekstrakcji (np. gongfu / wieloetapowe zalania herbaty)
 * z tekstu instrukcji ("dodaj 5s do każdego zalania", "+10s per steep", "zwiększ o 15 sekund", itp.).
 */
export function parseSteepIncrementSeconds(
  text: string | undefined | null,
  fallbackIncrement = 5
): number {
  const safeFallback = Number.isFinite(fallbackIncrement) && fallbackIncrement >= 0
    ? Math.max(0, Math.min(300, Math.round(fallbackIncrement)))
    : 5;

  if (!text || typeof text !== 'string' || !text.trim()) {
    return safeFallback;
  }

  const clean = text.trim().toLowerCase().replace(/,/g, '.');

  // Wzorce typu: "+10s", "+ 5 s", "dodaj 5s", "dodaj 10 sekund", "zwiększ o 15 sekund", "increase by 10s", "10s per steep", "+5s per steep"
  const match = clean.match(
    /(?:\+|dodaj|zwi[eę]ksz\s*o|increase\s*by)\s*(\d+(?:\.\d+)?)\s*(?:sekund(?:[a-ząęółśżźćń]+)?|sek\b|secs?\b|sec(?:onds?)?\b|s\b)?/i
  ) || clean.match(
    /(\d+(?:\.\d+)?)\s*(?:sekund(?:[a-ząęółśżźćń]+)?|sek\b|secs?\b|sec(?:onds?)?\b|s\b)\s*(?:per\s*steep|na\s*zalanie|do\s*ka[zż]dego)/i
  );

  if (match) {
    const val = parseFloat(match[1]);
    if (Number.isFinite(val) && val >= 0) {
      const res = Math.max(0, Math.min(300, Math.round(val)));
      return Object.is(res, -0) ? 0 : res;
    }
  }

  return safeFallback;
}

/**
 * Oblicza czas kolejnego parzenia na podstawie czasu bazowego, numeru infuzji i przyrostu czasu na parzenie.
 */
export function calculateNextSteepDuration(params: {
  baseDurationSeconds: number | string;
  infusionNumber: number;
  incrementSeconds?: number | string;
}): number {
  if (!params || typeof params !== 'object') {
    return 15;
  }
  const rawBase = typeof params.baseDurationSeconds === 'number'
    ? params.baseDurationSeconds
    : (typeof params.baseDurationSeconds === 'string' ? parseFloat(params.baseDurationSeconds.replace(',', '.')) : 15);
  const safeBase = Number.isFinite(rawBase) && rawBase > 0 ? rawBase : 15;

  const rawInc = typeof params.incrementSeconds === 'number'
    ? params.incrementSeconds
    : (typeof params.incrementSeconds === 'string' ? parseFloat(params.incrementSeconds.replace(',', '.')) : 0);
  const safeInc = Number.isFinite(rawInc) && rawInc >= 0 ? rawInc : 0;

  const infNum = Number.isFinite(params.infusionNumber) ? Math.max(1, Math.floor(params.infusionNumber)) : 1;
  const total = Math.round(safeBase + safeInc * (infNum - 1));
  const res = Math.max(1, Math.min(86400, total));
  return Object.is(res, -0) ? Math.round(safeBase) : res;
}

/**
 * Oblicza rekomendowane okno odgazowania CO2 oraz koniec szczytu swiezosci (Peak Window)
 * na podstawie stopnia wypalenia ziaren kawy (roast profile).
 */
export function calculateRoastDegassingWindow(roastProfile?: string | null): {
  degassingDays: number;
  peakEndDays: number;
} {
  if (!roastProfile || typeof roastProfile !== 'string') {
    return { degassingDays: 7, peakEndDays: 35 };
  }

  const clean = roastProfile
    .replace(/\uFEFF/g, '')
    .replace(/[\x00-\x1F\x7F-\x9F]/g, ' ')
    .trim()
    .toLowerCase();

  // Bardzo ciemny / wiedeński / neapolitański / spanish roast / extra dark: szybkie odgazowanie (3 dni), krótki peak (18 dni)
  if (
    clean.includes('extra dark') ||
    clean.includes('bardzo ciemn') ||
    clean.includes('neapolitan') ||
    clean.includes('spanish') ||
    clean.includes('vienna') ||
    clean.includes('wiedeń') ||
    clean.includes('wieden')
  ) {
    return { degassingDays: 3, peakEndDays: 18 };
  }

  // Ciemny wypał / espresso / dark: odgazowuje szybciej, starzeje się szybciej
  if (
    clean.includes('dark') ||
    clean.includes('ciemn') ||
    clean.includes('espresso') ||
    clean.includes('french') ||
    clean.includes('italian')
  ) {
    return { degassingDays: 5, peakEndDays: 25 };
  }

  // Bardzo jasny / cinnamon / ultra light / white: b. powolne odgazowywanie
  if (
    clean.includes('cinnamon') ||
    clean.includes('ultra light') ||
    clean.includes('ultra-light') ||
    clean.includes('white roast')
  ) {
    return { degassingDays: 14, peakEndDays: 55 };
  }

  // Jasny wypał / light / nordic / filter / city / new england: gęste ziarna odgazowują wolniej, peak trwa dłużej
  if (
    clean.includes('light') ||
    clean.includes('jasn') ||
    clean.includes('nordic') ||
    clean.includes('filter') ||
    clean.includes('city') ||
    clean.includes('new england')
  ) {
    return { degassingDays: 10, peakEndDays: 45 };
  }

  // Średni wypał / medium / omni / omniroast / standard
  return { degassingDays: 7, peakEndDays: 35 };
}

export type CoffeeFreshnessStatus = 'too_fresh' | 'peak' | 'past_peak' | 'expired' | 'unknown';

export interface CoffeeFreshnessResult {
  status: CoffeeFreshnessStatus;
  daysSinceRoast: number;
  degassingDays: number;
  peakEndDays: number;
  messagePl: string;
  messageEn: string;
}

/**
 * Precyzyjnie wyznacza status świeżości kawy i rekomendację parzenia
 * na podstawie daty palenia i profilu wypału (okno odgazowania SCA).
 */
export function calculateCoffeeFreshness(
  roastDate: string | Date | null | undefined,
  roastProfile?: string | null,
  referenceDate?: string | Date
): CoffeeFreshnessResult {
  const window = calculateRoastDegassingWindow(roastProfile);
  const fallbackResult: CoffeeFreshnessResult = {
    status: 'unknown',
    daysSinceRoast: 0,
    degassingDays: window.degassingDays,
    peakEndDays: window.peakEndDays,
    messagePl: 'Brak daty palenia',
    messageEn: 'No roast date',
  };

  if (!roastDate) return fallbackResult;

  let rDate: Date;
  if (roastDate instanceof Date) {
    rDate = roastDate;
  } else if (typeof roastDate === 'string') {
    const clean = roastDate.trim();
    if (!clean) return fallbackResult;
    rDate = new Date(clean);
  } else {
    return fallbackResult;
  }

  if (isNaN(rDate.getTime())) return fallbackResult;

  let ref: Date;
  if (referenceDate instanceof Date) {
    ref = referenceDate;
  } else if (typeof referenceDate === 'string') {
    ref = new Date(referenceDate);
    if (isNaN(ref.getTime())) ref = new Date();
  } else {
    ref = new Date();
  }

  const diffMs = ref.getTime() - rDate.getTime();
  const rawDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const daysSinceRoast = Math.max(0, rawDays);

  if (rawDays < 0 || daysSinceRoast < window.degassingDays) {
    const daysLeft = Math.max(1, window.degassingDays - daysSinceRoast);
    return {
      status: 'too_fresh',
      daysSinceRoast,
      degassingDays: window.degassingDays,
      peakEndDays: window.peakEndDays,
      messagePl: `Świeżo palona (odpoczywa jeszcze ${daysLeft} ${daysLeft === 1 ? 'dzień' : 'dni'})`,
      messageEn: `Freshly roasted (resting for ${daysLeft} more ${daysLeft === 1 ? 'day' : 'days'})`,
    };
  }

  if (daysSinceRoast <= window.peakEndDays) {
    return {
      status: 'peak',
      daysSinceRoast,
      degassingDays: window.degassingDays,
      peakEndDays: window.peakEndDays,
      messagePl: 'Szczyt smaku i aromatu (optymalne okno parzenia)',
      messageEn: 'Peak flavor and aroma (optimal brewing window)',
    };
  }

  if (daysSinceRoast <= window.peakEndDays + 30) {
    return {
      status: 'past_peak',
      daysSinceRoast,
      degassingDays: window.degassingDays,
      peakEndDays: window.peakEndDays,
      messagePl: 'Po optymalnym oknie (nadal dobra do parzenia)',
      messageEn: 'Past optimal peak (still good for brewing)',
    };
  }

  return {
    status: 'expired',
    daysSinceRoast,
    degassingDays: window.degassingDays,
    peakEndDays: window.peakEndDays,
    messagePl: 'Zestarzała kawa (rekomendowany cold brew)',
    messageEn: 'Aged coffee (cold brew recommended)',
  };
}


function toDateKey(d: Date): string {
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(base: Date, days: number): Date {
  const copy = new Date(base.getTime());
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

/**
 * Buduje harmonogram proaktywnych akcji (1-Tap Action Feed) na najbliższe 14 dni
 * na podstawie stanu spiżarni (okna odgazowania i szczytu Peak) oraz historii parzeń.
 */
export function buildProactiveActionSchedule(
  referenceDateIso: string,
  inventory: InventoryItem[],
  sessions: BrewSession[]
): ProactiveActionItem[] {
  const safeStr = typeof referenceDateIso === 'string' && referenceDateIso.trim() ? referenceDateIso.trim() : '';
  const parsedDate = safeStr ? new Date(safeStr) : new Date();
  const baseDate = Number.isFinite(parsedDate.getTime()) ? parsedDate : new Date();
  const refDayStart = new Date(
    Date.UTC(
      baseDate.getUTCFullYear(),
      baseDate.getUTCMonth(),
      baseDate.getUTCDate()
    )
  );

  const actions: ProactiveActionItem[] = [];
  const safeInventory = Array.isArray(inventory) ? inventory : [];
  const safeSessions = Array.isArray(sessions) ? sessions : [];

  const activeItems = safeInventory.filter(
    (item): item is InventoryItem => {
      if (!item || typeof item !== 'object' || item.isArchived) return false;
      const rawW = typeof item.remainingWeightGrams === 'number'
        ? item.remainingWeightGrams
        : (typeof item.remainingWeightGrams === 'string' ? parseFloat(item.remainingWeightGrams) : NaN);
      return Number.isFinite(rawW) && rawW > 0 && !Object.is(rawW, -0);
    }
  );

  for (const item of activeItems) {
    const rawW = typeof item.remainingWeightGrams === 'number'
      ? item.remainingWeightGrams
      : (typeof item.remainingWeightGrams === 'string' ? parseFloat(item.remainingWeightGrams) : NaN);
    const safeRemainingWeight = Number.isFinite(rawW) && rawW > 0 ? (Object.is(rawW, -0) ? 0 : rawW) : 0;
    if (safeRemainingWeight <= 0) {
      continue;
    }

    const itemType = typeof item.type === 'string' ? item.type.trim().toLowerCase() : '';
    if (itemType === 'coffee') {
      const roastDate =
        typeof item.roastOrHarvestDate === 'string' && item.roastOrHarvestDate.trim()
          ? new Date(item.roastOrHarvestDate.trim())
          : new Date(NaN);

      if (!Number.isNaN(roastDate.getTime())) {
        const roastDayStart = new Date(
          Date.UTC(
            roastDate.getUTCFullYear(),
            roastDate.getUTCMonth(),
            roastDate.getUTCDate()
          )
        );
        const rawDays = Math.floor(
          (refDayStart.getTime() - roastDayStart.getTime()) / (1000 * 3600 * 24)
        );
        const safeDaysRoast = Math.max(0, Object.is(rawDays, -0) || rawDays <= 0 ? 0 : rawDays);
        const daysSinceRoast = safeDaysRoast;
        const daysRoastPl = `${safeDaysRoast} ${pluralPl(safeDaysRoast, 'dzień', 'dni', 'dni')} po wypale`;
        const daysRoastEn = `${safeDaysRoast} day${safeDaysRoast === 1 ? '' : 's'} post-roast`;

        const { degassingDays, peakEndDays } = calculateRoastDegassingWindow(item.roastProfile);

        if (safeDaysRoast < degassingDays) {
          // Ziarna jeszcze odgazowują — zaplanuj otwarcie okna Peak po zakończeniu odgazowania
          const daysUntilPeak = Math.min(13, Math.max(1, degassingDays - safeDaysRoast));
          const targetDate = addDays(refDayStart, daysUntilPeak);
          actions.push({
            id: `action-peak-start-${item.id}`,
            dateIso: toDateKey(targetDate),
            daysOffset: daysUntilPeak,
            bucketLabelPl:
              daysUntilPeak === 1 ? 'JUTRO' : `Za ${daysUntilPeak} dni`,
            bucketLabelEn:
              daysUntilPeak === 1 ? 'TOMORROW' : `In ${daysUntilPeak} days`,
            titlePl: `Początek okna Peak: ${item.name}`,
            titleEn: `Peak window opens: ${item.name}`,
            subtitlePl: `Koniec odgazowania CO₂ (${degassingDays}. dzień po wypale) · ${safeRemainingWeight}g w spiżarni`,
            subtitleEn: `CO₂ degassing complete (Day ${degassingDays} post-roast) · ${safeRemainingWeight}g left`,
            badgeColor: 'copper',
            inventoryItemId: item.id,
            recommendedMethod: 'V60',
            doseGrams: 15,
            waterGrams: 250,
            waterTempCelsius: 93,
          });
        } else if (daysSinceRoast <= peakEndDays) {
          // Ziarna są w szczycie smaku (Peak Window) — akcja na DZIŚ
          actions.push({
            id: `action-peak-now-${item.id}`,
            dateIso: toDateKey(refDayStart),
            daysOffset: 0,
            bucketLabelPl: 'DZIŚ',
            bucketLabelEn: 'TODAY',
            titlePl: `Szczyt świeżości (Peak): ${item.name}`,
            titleEn: `Peak freshness window: ${item.name}`,
            subtitlePl: `${daysRoastPl} · Pozostało ${safeRemainingWeight}g — zaparz teraz`,
            subtitleEn: `${daysRoastEn} · ${safeRemainingWeight}g left — brew now`,
            badgeColor: 'success',
            inventoryItemId: item.id,
            recommendedMethod: 'V60',
            doseGrams: Math.min(18, safeRemainingWeight),
            waterGrams: 250,
            waterTempCelsius: 93,
          });
        } else {
          // Ziarna powyżej 35 dni — rekomendacja zużycia (DZIŚ / JUTRO)
          actions.push({
            id: `action-aging-${item.id}`,
            dateIso: toDateKey(addDays(refDayStart, 1)),
            daysOffset: 1,
            bucketLabelPl: 'JUTRO',
            bucketLabelEn: 'TOMORROW',
            titlePl: `Końcówka świeżości: ${item.name}`,
            titleEn: `Use aging beans: ${item.name}`,
            subtitlePl: `${daysRoastPl} · Zwiększ dozę lub zmiel drobniej (${safeRemainingWeight}g)`,
            subtitleEn: `${daysRoastEn} · Up-dose or grind finer (${safeRemainingWeight}g)`,
            badgeColor: 'warning',
            inventoryItemId: item.id,
            recommendedMethod: 'AeroPress',
            doseGrams: Math.min(18, safeRemainingWeight),
            waterGrams: 240,
            waterTempCelsius: 95,
          });
        }
      } else {
        // Ziarna kawy bez sprecyzowanej daty wypału — zaplanuj sesję na DZIŚ
        actions.push({
          id: `action-coffee-stash-${item.id}`,
          dateIso: toDateKey(refDayStart),
          daysOffset: 0,
          bucketLabelPl: 'DZIŚ',
          bucketLabelEn: 'TODAY',
          titlePl: `Rekomendacja parzenia: ${item.name}`,
          titleEn: `Brew recommendation: ${item.name}`,
          subtitlePl: `Kawa specialty ze spiżarni · Pozostało ${safeRemainingWeight}g`,
          subtitleEn: `Specialty coffee from stash · ${safeRemainingWeight}g remaining`,
          badgeColor: 'copper',
          inventoryItemId: item.id,
          recommendedMethod: 'V60',
          doseGrams: Math.min(18, safeRemainingWeight),
          waterGrams: 250,
          waterTempCelsius: 93,
        });
      }
    } else if (itemType === 'tea') {
      // Herbata liściasta w spiżarni — sesja degustacyjna
      const offset = actions.length === 0 ? 0 : 2;
      const targetDate = addDays(refDayStart, offset);
      actions.push({
        id: `action-tea-${item.id}`,
        dateIso: toDateKey(targetDate),
        daysOffset: offset,
        bucketLabelPl: offset === 0 ? 'DZIŚ' : `Za ${offset} dni`,
        bucketLabelEn: offset === 0 ? 'TODAY' : `In ${offset} days`,
        titlePl: `Rytuał liści: ${item.name}`,
        titleEn: `Leaf session: ${item.name}`,
        subtitlePl: `Herbata rzemieślnicza · Pozostało ${safeRemainingWeight}g w spiżarni`,
        subtitleEn: `Artisan tea · ${safeRemainingWeight}g remaining in stash`,
        badgeColor: 'success',
        inventoryItemId: item.id,
        recommendedMethod: 'Gaiwan',
        doseGrams: Math.min(5, safeRemainingWeight),
        waterGrams: 150,
        waterTempCelsius: 85,
      });
    }
  }

  // Jeśli brak aktywnych paczek lub jako uzupełnienie harmonogramu: dodaj kalibrację / powtórkę z najlepszej sesji
  if (actions.length === 0) {
    const validSessions = safeSessions.filter(
      (s): s is BrewSession => Boolean(s && typeof s === 'object')
    );
    const topSession = validSessions.find((s) => (s.rating || 0) >= 4) || validSessions[0];
    if (topSession) {
      const rawDose = typeof topSession.doseGrams === 'number' ? topSession.doseGrams : parseFloat(String(topSession.doseGrams));
      const safeDose = Number.isFinite(rawDose) && rawDose > 0 ? (Object.is(rawDose, -0) ? 15 : rawDose) : 15;
      const rawWater = typeof topSession.waterGrams === 'number' ? topSession.waterGrams : parseFloat(String(topSession.waterGrams));
      const safeWater = Number.isFinite(rawWater) && rawWater > 0 ? (Object.is(rawWater, -0) ? 250 : rawWater) : 250;
      const rawTemp = typeof topSession.waterTempCelsius === 'number' ? topSession.waterTempCelsius : parseFloat(String(topSession.waterTempCelsius));
      const safeTemp = Number.isFinite(rawTemp) && rawTemp > 0 ? (Object.is(rawTemp, -0) ? 93 : rawTemp) : 93;
      const isTea = (typeof topSession.beverageType === 'string' && topSession.beverageType.trim().toUpperCase() === 'TEA') ||
        (typeof topSession.method === 'string' && /gaiwan|gongfu|tea|herb/i.test(topSession.method));

      actions.push({
        id: `action-repeat-${topSession.id}`,
        dateIso: toDateKey(refDayStart),
        daysOffset: 0,
        bucketLabelPl: 'DZIŚ',
        bucketLabelEn: 'TODAY',
        titlePl: isTea
          ? `Powtórz udany napar herbaty: ${topSession.recipeName || topSession.method || 'Herbata'}`
          : `Powtórz udany przepis: ${topSession.recipeName || topSession.method || 'Przepis'}`,
        titleEn: isTea
          ? `Repeat top tea session: ${topSession.recipeName || topSession.method || 'Tea'}`
          : `Repeat top recipe: ${topSession.recipeName || topSession.method || 'Recipe'}`,
        subtitlePl: `${safeDose}g / ${safeWater}g · ${safeTemp}°C`,
        subtitleEn: `${safeDose}g / ${safeWater}g · ${safeTemp}°C`,
        badgeColor: isTea ? 'success' : 'copper',
        recipeId: topSession.recipeId,
        recommendedMethod: topSession.method || (isTea ? 'Gaiwan' : 'V60'),
        doseGrams: safeDose,
        waterGrams: safeWater,
        waterTempCelsius: safeTemp,
      });
    } else {
      actions.push({
        id: 'action-default-calibration',
        dateIso: toDateKey(refDayStart),
        daysOffset: 0,
        bucketLabelPl: 'DZIŚ',
        bucketLabelEn: 'TODAY',
        titlePl: 'Kalibracja porannego przelewu V60 (15g / 250g)',
        titleEn: 'Morning V60 Pour-Over Calibration (15g / 250g)',
        subtitlePl: 'Wzorcowa ekstrakcja startowa 1:16.7 w 93°C',
        subtitleEn: 'Reference 1:16.7 extraction at 93°C',
        badgeColor: 'copper',
        recommendedMethod: 'V60',
        doseGrams: 15,
        waterGrams: 250,
        waterTempCelsius: 93,
      });
    }
  }

  return actions.sort((a, b) => a.daysOffset - b.daysOffset);
}

/**
 * Buduje 14-dniowy interaktywny kalendarz (od dziś przez kolejne 13 dni)
 * wraz z kropkami oznaczającymi zaplanowane akcje oraz wykonane sesje.
 */
export function buildFourteenDayCalendar(
  referenceDateIso: string,
  inventory: InventoryItem[],
  sessions: BrewSession[]
): CalendarDayItem[] {
  const safeInventory = Array.isArray(inventory) ? inventory : [];
  const safeSessions = Array.isArray(sessions) ? sessions : [];
  const safeStr = typeof referenceDateIso === 'string' && referenceDateIso.trim() ? referenceDateIso.trim() : '';
  const parsedDate = safeStr ? new Date(safeStr) : new Date();
  const baseDate = Number.isFinite(parsedDate.getTime()) ? parsedDate : new Date();
  const safeDateIso = baseDate.toISOString();
  const todayStart = new Date(
    Date.UTC(
      baseDate.getUTCFullYear(),
      baseDate.getUTCMonth(),
      baseDate.getUTCDate()
    )
  );

  const schedule = buildProactiveActionSchedule(
    safeDateIso,
    safeInventory,
    safeSessions
  );

  const sessionCountsByDate: Record<string, number> = {};
  for (const s of safeSessions) {
    if (s && typeof s === 'object' && s.brewedAt) {
      const d = new Date(s.brewedAt);
      if (!Number.isNaN(d.getTime())) {
        const key = toDateKey(d);
        sessionCountsByDate[key] = (sessionCountsByDate[key] || 0) + 1;
      }
    }
  }

  const actionCountsByDate: Record<string, number> = {};
  for (const act of schedule) {
    actionCountsByDate[act.dateIso] = (actionCountsByDate[act.dateIso] || 0) + 1;
  }

  const days: CalendarDayItem[] = [];
  for (let offset = 0; offset < 14; offset++) {
    const current = addDays(todayStart, offset);
    const key = toDateKey(current);
    const dow = current.getUTCDay();
    const sCount = sessionCountsByDate[key] || 0;
    const aCount = actionCountsByDate[key] || 0;

    let dotType: CalendarDayItem['dotType'] = 'none';
    if (sCount > 0 && aCount > 0) {
      dotType = 'both';
    } else if (aCount > 0) {
      dotType = 'action';
    } else if (sCount > 0) {
      dotType = 'session';
    }

    days.push({
      dateIso: key,
      dayNumber: current.getUTCDate(),
      weekdayPl: WEEKDAYS_PL[dow],
      weekdayEn: WEEKDAYS_EN[dow],
      isToday: offset === 0,
      sessionCount: sCount,
      actionCount: aCount,
      dotType,
    });
  }

  return days;
}

/**
 * Filtruje listę wygenerowanych akcji proaktywnego kalendarza (np. na dziś, nadchodzące lub wszystkie aktywne).
 */
export function filterProactiveActions(
  actions?: ProactiveActionItem[] | null,
  filter: 'today' | 'upcoming' | 'all' = 'all'
): ProactiveActionItem[] {
  if (!Array.isArray(actions) || actions.length === 0) return [];
  const cleanFilter = typeof filter === 'string' ? filter.trim().toLowerCase() : 'all';

  return actions
    .filter((act) => {
      if (!act || typeof act.daysOffset !== 'number' || !Number.isFinite(act.daysOffset)) {
        return false;
      }
      if (cleanFilter === 'today') {
        return act.daysOffset === 0;
      }
      if (cleanFilter === 'upcoming') {
        return act.daysOffset > 0;
      }
      // 'all'
      return act.daysOffset >= 0;
    })
    .sort((a, b) => a.daysOffset - b.daysOffset);
}

/**
 * Wybiera najbliższą zalecaną akcję do wykonania (priorytetowo na dziś, a w razie braku — najbliższą nadchodzącą).
 */
export function findNextRecommendedAction(
  actions?: ProactiveActionItem[] | null
): ProactiveActionItem | null {
  if (!Array.isArray(actions) || actions.length === 0) return null;
  const todayActions = filterProactiveActions(actions, 'today');
  if (todayActions.length > 0) {
    return todayActions[0];
  }
  const upcomingActions = filterProactiveActions(actions, 'upcoming');
  if (upcomingActions.length > 0) {
    return upcomingActions[0];
  }
  return null;
}

/**
 * Generuje zawartość pliku kalendarzowego iCalendar (.ics, RFC 5545)
 * dla wybranej akcji z harmonogramu.
 */
export function escapeIcsText(str: string): string {
  if (typeof str !== 'string' || !str) return '';
  return str
    .replace(/\uFEFF/g, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

export function generateActionIcsContent(
  action: ProactiveActionItem,
  language: 'pl' | 'en' | string = 'pl'
): string {
  if (!action || typeof action !== 'object') {
    throw new Error('Nieprawidłowy obiekt akcji kalendarza');
  }
  const cleanLang = typeof language === 'string' ? language.trim().toLowerCase() : 'pl';
  const isEn = cleanLang === 'en' || cleanLang.startsWith('en');
  const rawDateStr = typeof action.dateIso === 'string' && action.dateIso.trim() ? action.dateIso.trim() : '';
  const dateMatch = rawDateStr.match(/^(\d{4}-\d{2}-\d{2})/);
  const todayIso = new Date().toISOString().slice(0, 10);
  let rawDate = dateMatch ? dateMatch[1] : todayIso;
  if (isNaN(new Date(rawDate).getTime())) {
    rawDate = todayIso;
  }
  const cleanDate = rawDate.replace(/-/g, '');
  const dtStart = `${cleanDate}T080000Z`;
  const dtEnd = `${cleanDate}T081500Z`;
  const nowUtc = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const dtStamp = nowUtc.length >= 15 ? nowUtc.slice(0, 15) + 'Z' : dtStart;
  const actionId = typeof action.id === 'string' && action.id.trim() ? action.id.trim().replace(/[^a-zA-Z0-9_-]/g, '_') : `action-${Date.now()}`;
  const rawSummary =
    (isEn
      ? (typeof action.titleEn === 'string' && action.titleEn.trim() ? action.titleEn.trim() : (typeof action.titlePl === 'string' ? action.titlePl.trim() : ''))
      : (typeof action.titlePl === 'string' && action.titlePl.trim() ? action.titlePl.trim() : '')) || (isEn ? 'Napar Brew Session' : 'Sesja parzenia Napar');
  const rawDescription =
    (isEn
      ? (typeof action.subtitleEn === 'string' && action.subtitleEn.trim() ? action.subtitleEn.trim() : (typeof action.subtitlePl === 'string' ? action.subtitlePl.trim() : ''))
      : (typeof action.subtitlePl === 'string' && action.subtitlePl.trim() ? action.subtitlePl.trim() : '')) || '';

  const summary = escapeIcsText(rawSummary);
  const description = escapeIcsText(rawDescription);

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:-//Apps4Brew Studio//Napar Steepwise//${isEn ? 'EN' : 'PL'}`,
    'BEGIN:VEVENT',
    `UID:${actionId}@napar.apps4brew.studio`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}


export interface ActionGroupMap {
  [dateIso: string]: ProactiveActionItem[];
}

/**
 * Grupuje akcje proaktywne według ich daty kalendarzowej (dateIso: YYYY-MM-DD).
 */
export function groupActionsByDate(actions: ProactiveActionItem[]): ActionGroupMap {
  if (!Array.isArray(actions)) return {};

  const map: ActionGroupMap = {};
  for (const action of actions) {
    if (!action || typeof action !== 'object') continue;
    const dateKey = typeof action.dateIso === 'string' && action.dateIso.trim() ? action.dateIso.trim() : '';
    if (!dateKey) continue;
    if (!map[dateKey]) {
      map[dateKey] = [];
    }
    map[dateKey].push(action);
  }
  return map;
}

export interface ActionScheduleCounts {
  total: number;
  today: number;
  tomorrow: number;
  upcoming: number;
  overdue: number;
  byBadgeColor: {
    copper: number;
    success: number;
    warning: number;
  };
}

/**
 * Podlicza akcje proaktywne w harmonogramie z podziałem na statusy i warianty kolorystyczne.
 */
export function getActionScheduleCounts(actions: ProactiveActionItem[]): ActionScheduleCounts {
  const counts: ActionScheduleCounts = {
    total: 0,
    today: 0,
    tomorrow: 0,
    upcoming: 0,
    overdue: 0,
    byBadgeColor: {
      copper: 0,
      success: 0,
      warning: 0,
    },
  };

  if (!Array.isArray(actions)) return counts;

  for (const action of actions) {
    if (!action || typeof action !== 'object') continue;
    counts.total++;

    const offset = typeof action.daysOffset === 'number' && !Number.isNaN(action.daysOffset)
      ? action.daysOffset
      : 0;

    if (offset === 0) {
      counts.today++;
    } else if (offset === 1) {
      counts.tomorrow++;
    } else if (offset > 1) {
      counts.upcoming++;
    } else if (offset < 0) {
      counts.overdue++;
    }

    if (action.badgeColor === 'copper') {
      counts.byBadgeColor.copper++;
    } else if (action.badgeColor === 'success') {
      counts.byBadgeColor.success++;
    } else if (action.badgeColor === 'warning') {
      counts.byBadgeColor.warning++;
    }
  }

  return counts;
}

export type ActionSortOption = 'date_asc' | 'date_desc' | 'urgency';

/**
 * Sortuje akcje proaktywne według wybranego kryterium:
 * - date_asc: chronologicznie od najwcześniejszych (zaległe < 0 -> dziś 0 -> jutro 1 -> przyszłe > 1)
 * - date_desc: od najpóźniejszych do najwcześniejszych
 * - urgency: wg pilności (dziś -> jutro -> zaległe -> przyszłość; w ramach grupy wg ważności odznaki: warning > copper > success).
 */
export function sortProactiveActions(
  actions: ProactiveActionItem[],
  sortBy: ActionSortOption = 'date_asc'
): ProactiveActionItem[] {
  if (!Array.isArray(actions)) return [];
  const copy = [...actions];

  const colorPriority = (color?: string): number => {
    switch (color) {
      case 'warning':
        return 1;
      case 'copper':
        return 2;
      case 'success':
        return 3;
      default:
        return 4;
    }
  };

  const urgencyTier = (offset: number): number => {
    if (offset === 0) return 1; // today
    if (offset === 1) return 2; // tomorrow
    if (offset < 0) return 3;  // overdue
    return 4;                  // future
  };

  return copy.sort((a, b) => {
    if (!a && !b) return 0;
    if (!a) return 1;
    if (!b) return -1;

    const offsetA = typeof a.daysOffset === 'number' && Number.isFinite(a.daysOffset) ? a.daysOffset : 0;
    const offsetB = typeof b.daysOffset === 'number' && Number.isFinite(b.daysOffset) ? b.daysOffset : 0;

    switch (sortBy) {
      case 'date_asc': {
        if (offsetA !== offsetB) return offsetA - offsetB;
        return (a.id || '').localeCompare(b.id || '');
      }
      case 'date_desc': {
        if (offsetA !== offsetB) return offsetB - offsetA;
        return (a.id || '').localeCompare(b.id || '');
      }
      case 'urgency': {
        const tierA = urgencyTier(offsetA);
        const tierB = urgencyTier(offsetB);
        if (tierA !== tierB) return tierA - tierB;

        const colorA = colorPriority(a.badgeColor);
        const colorB = colorPriority(b.badgeColor);
        if (colorA !== colorB) return colorA - colorB;

        if (offsetA !== offsetB) return offsetA - offsetB;
        return (a.id || '').localeCompare(b.id || '');
      }
      default:
        return offsetA - offsetB;
    }
  });
}

export interface ActionSearchCriteria {
  query?: string;
  badgeColor?: 'warning' | 'copper' | 'info' | 'success' | string;
  recommendedMethod?: string;
  maxDaysOffset?: number;
}

/**
 * Przeszukuje i filtruje listę akcji proaktywnego kalendarza wg zapytania tekstowego,
 * koloru odznaki, metody parzenia lub maksymalnego horyzontu dni.
 */
export function searchProactiveActions(
  actions?: ProactiveActionItem[] | null,
  criteria: ActionSearchCriteria = {}
): ProactiveActionItem[] {
  if (!Array.isArray(actions) || actions.length === 0) return [];
  const query = criteria && typeof criteria.query === 'string' ? criteria.query.trim().toLowerCase() : '';
  const badgeColor = criteria && typeof criteria.badgeColor === 'string' ? criteria.badgeColor.trim().toLowerCase() : '';
  const method = criteria && typeof criteria.recommendedMethod === 'string' ? criteria.recommendedMethod.trim().toLowerCase() : '';
  const maxOffset = criteria && typeof criteria.maxDaysOffset === 'number' && Number.isFinite(criteria.maxDaysOffset)
    ? criteria.maxDaysOffset
    : null;

  return actions.filter((act) => {
    if (!act || typeof act !== 'object') return false;

    if (query) {
      const titlePl = (act.titlePl || '').toLowerCase();
      const titleEn = (act.titleEn || '').toLowerCase();
      const subPl = (act.subtitlePl || '').toLowerCase();
      const subEn = (act.subtitleEn || '').toLowerCase();
      const recMethod = (act.recommendedMethod || '').toLowerCase();

      const match =
        titlePl.includes(query) ||
        titleEn.includes(query) ||
        subPl.includes(query) ||
        subEn.includes(query) ||
        recMethod.includes(query);

      if (!match) return false;
    }

    if (badgeColor && (act.badgeColor || '').toLowerCase() !== badgeColor) {
      return false;
    }

    if (method && (act.recommendedMethod || '').toLowerCase() !== method) {
      return false;
    }

    if (maxOffset !== null && typeof act.daysOffset === 'number') {
      if (act.daysOffset > maxOffset) return false;
    }

    return true;
  });
}


/**
 * Wyszukuje pojedynczą akcję proaktywną po jej identyfikatorze ID
 * z odpornością na wielkość liter, białe znaki i brakujące dane.
 */
export function getProactiveActionById(
  actions?: ProactiveActionItem[] | null,
  actionId?: string | null
): ProactiveActionItem | undefined {
  if (!Array.isArray(actions) || actions.length === 0) return undefined;
  if (!actionId || typeof actionId !== 'string' || !actionId.trim()) return undefined;

  const targetId = actionId.trim().toLowerCase();
  return actions.find((act) => {
    if (!act || typeof act !== 'object' || !act.id || typeof act.id !== 'string') return false;
    return act.id.trim().toLowerCase() === targetId;
  });
}


export interface ActionPriorityEvaluation {
  score: number;
  urgency: 'critical' | 'high' | 'medium' | 'low';
  urgencyLabelPl: string;
  urgencyLabelEn: string;
  recommendedTimingPl: string;
  recommendedTimingEn: string;
}

/**
 * Szacuje punktowy priorytet (0-100) oraz pilność wykonania rekomendacji proaktywnej BPR,
 * uwzględniając deklarowany priorytet akcji oraz dystans czasowy (daysOffset).
 */
export function calculateActionPriorityScore(
  action?: Partial<ProactiveActionItem> | null
): ActionPriorityEvaluation {
  if (!action || typeof action !== 'object') {
    return {
      score: 0,
      urgency: 'low',
      urgencyLabelPl: 'Niski',
      urgencyLabelEn: 'Low',
      recommendedTimingPl: 'W wolnej chwili',
      recommendedTimingEn: 'Whenever convenient',
    };
  }

  const prio = typeof action.priority === 'string' ? action.priority.trim().toLowerCase() : 'low';
  const offset = typeof action.daysOffset === 'number' && Number.isFinite(action.daysOffset) ? Math.max(0, action.daysOffset) : 0;

  let baseScore = 30;
  if (prio === 'high') {
    baseScore = 80;
  } else if (prio === 'medium') {
    baseScore = 55;
  }

  const timeDecay = Math.min(35, offset * 5);
  const todayBonus = offset === 0 ? 15 : 0;

  const rawScore = baseScore + todayBonus - timeDecay;
  const score = Math.min(100, Math.max(10, Math.round(rawScore)));

  let urgency: 'critical' | 'high' | 'medium' | 'low';
  let urgencyLabelPl: string;
  let urgencyLabelEn: string;
  let recommendedTimingPl: string;
  let recommendedTimingEn: string;

  if (score >= 90 || (prio === 'high' && offset === 0)) {
    urgency = 'critical';
    urgencyLabelPl = 'Krytyczny (Dzisiaj)';
    urgencyLabelEn = 'Critical (Today)';
    recommendedTimingPl = 'Wykonaj dzisiaj, aby nie przegapić optymalnego okna';
    recommendedTimingEn = 'Perform today to capture the optimal flavor window';
  } else if (score >= 70) {
    urgency = 'high';
    urgencyLabelPl = 'Wysoki';
    urgencyLabelEn = 'High';
    recommendedTimingPl = 'Zaplanuj w ciągu najbliższych 2 dni';
    recommendedTimingEn = 'Schedule within the next 2 days';
  } else if (score >= 50) {
    urgency = 'medium';
    urgencyLabelPl = 'Średni';
    urgencyLabelEn = 'Medium';
    recommendedTimingPl = 'Zaplanuj w tym tygodniu';
    recommendedTimingEn = 'Schedule this week';
  } else {
    urgency = 'low';
    urgencyLabelPl = 'Niski';
    urgencyLabelEn = 'Low';
    recommendedTimingPl = 'W wolnej chwili';
    recommendedTimingEn = 'Whenever convenient';
  }

  return {
    score,
    urgency,
    urgencyLabelPl,
    urgencyLabelEn,
    recommendedTimingPl,
    recommendedTimingEn,
  };
}

/**
 * Sortuje listę rekomendacji proaktywnych BPR malejąco według wyliczonego punktowego priorytetu
 * (calculateActionPriorityScore), a w przypadku remisu rosnąco według daysOffset (najbliższe najpierw).
 */
export function rankActionsByPriority(
  actions?: ProactiveActionItem[] | null
): ProactiveActionItem[] {
  if (!Array.isArray(actions) || actions.length === 0) return [];

  const validActions = actions.filter((act) => act && typeof act === 'object');
  if (validActions.length === 0) return [];

  return [...validActions].sort((a, b) => {
    const scoreA = calculateActionPriorityScore(a).score;
    const scoreB = calculateActionPriorityScore(b).score;
    if (scoreB !== scoreA) {
      return scoreB - scoreA;
    }
    const offsetA = typeof a.daysOffset === 'number' && Number.isFinite(a.daysOffset) ? a.daysOffset : 0;
    const offsetB = typeof b.daysOffset === 'number' && Number.isFinite(b.daysOffset) ? b.daysOffset : 0;
    return offsetA - offsetB;
  });
}

export interface BprActionFeedSummary {
  totalActions: number;
  todayCount: number;
  upcomingCount: number;
  highUrgencyCount: number;
  recommendedNextAction: ProactiveActionItem | null;
  dominantBadgeColor: 'copper' | 'success' | 'warning' | 'none';
  summaryMessagePl: string;
  summaryMessageEn: string;
}

/**
 * Agreguje statystyki kanału rekomendacji BPR (liczba akcji, podział na dziś/nadchodzące,
 * akcje pilne, najbliższa rekomendacja, dominujący kolor odznaki) wraz ze zlokalizowanym komunikatem.
 */
export function summarizeBprActionFeed(
  actions?: ProactiveActionItem[] | null
): BprActionFeedSummary {
  if (!Array.isArray(actions) || actions.length === 0) {
    return {
      totalActions: 0,
      todayCount: 0,
      upcomingCount: 0,
      highUrgencyCount: 0,
      recommendedNextAction: null,
      dominantBadgeColor: 'none',
      summaryMessagePl: 'Brak zaplanowanych rekomendacji — dodaj kawę do spiżarni, aby uruchomić silnik BPR.',
      summaryMessageEn: 'No scheduled recommendations — add coffee to inventory to activate BPR engine.',
    };
  }

  const validActions = actions.filter((act): act is ProactiveActionItem => Boolean(act && typeof act === 'object'));
  if (validActions.length === 0) {
    return {
      totalActions: 0,
      todayCount: 0,
      upcomingCount: 0,
      highUrgencyCount: 0,
      recommendedNextAction: null,
      dominantBadgeColor: 'none',
      summaryMessagePl: 'Brak zaplanowanych rekomendacji — dodaj kawę do spiżarni, aby uruchomić silnik BPR.',
      summaryMessageEn: 'No scheduled recommendations — add coffee to inventory to activate BPR engine.',
    };
  }

  let todayCount = 0;
  let upcomingCount = 0;
  let highUrgencyCount = 0;
  const colorCounts: Record<'copper' | 'success' | 'warning', number> = {
    copper: 0,
    success: 0,
    warning: 0,
  };

  for (const act of validActions) {
    const offset = typeof act.daysOffset === 'number' && Number.isFinite(act.daysOffset) ? act.daysOffset : 0;
    if (offset === 0) {
      todayCount++;
    } else if (offset > 0) {
      upcomingCount++;
    }

    const priorityInfo = calculateActionPriorityScore(act);
    if (priorityInfo.urgency === 'high') {
      highUrgencyCount++;
    }

    if (act.badgeColor === 'copper' || act.badgeColor === 'success' || act.badgeColor === 'warning') {
      colorCounts[act.badgeColor]++;
    }
  }

  let dominantBadgeColor: 'copper' | 'success' | 'warning' | 'none' = 'none';
  let maxCount = 0;
  for (const [color, count] of Object.entries(colorCounts)) {
    if (count > maxCount) {
      maxCount = count;
      dominantBadgeColor = color as 'copper' | 'success' | 'warning';
    }
  }

  const recommendedNextAction = findNextRecommendedAction(validActions);

  let summaryMessagePl: string;
  let summaryMessageEn: string;

  if (todayCount > 0) {
    summaryMessagePl = `Masz ${todayCount} rekomendacji na dziś (${highUrgencyCount} pilnych).`;
    summaryMessageEn = `You have ${todayCount} recommendations for today (${highUrgencyCount} urgent).`;
  } else if (recommendedNextAction && typeof recommendedNextAction.daysOffset === 'number') {
    summaryMessagePl = `Brak akcji na dziś. Najbliższa rekomendacja za ${recommendedNextAction.daysOffset} dni.`;
    summaryMessageEn = `No actions for today. Next recommendation in ${recommendedNextAction.daysOffset} days.`;
  } else {
    summaryMessagePl = 'Brak aktywnych rekomendacji na najbliższe dni.';
    summaryMessageEn = 'No active recommendations for upcoming days.';
  }

  return {
    totalActions: validActions.length,
    todayCount,
    upcomingCount,
    highUrgencyCount,
    recommendedNextAction,
    dominantBadgeColor,
    summaryMessagePl,
    summaryMessageEn,
  };
}

export type HabitDriftCategory =
  | 'stable'
  | 'time_drift_slower'
  | 'time_drift_faster'
  | 'temp_drift'
  | 'ratio_drift';

export interface HabitDriftMetrics {
  averageBrewTimeSeconds: number;
  averageWaterTempCelsius: number;
  averageRatio: number;
  averageRating: number;
}

export interface HabitDriftAnalysis {
  category: HabitDriftCategory;
  hasSignificantDrift: boolean;
  sessionCount: number;
  currentMetrics: HabitDriftMetrics;
  referenceMetrics: HabitDriftMetrics;
  timeDeltaSeconds: number;
  tempDeltaCelsius: number;
  ratioDelta: number;
  insightPl: string;
  insightEn: string;
  recommendationPl: string;
  recommendationEn: string;
}

/**
 * Analizuje powtarzalność ostatnich sesji parzenia i wykrywa dryf nawyków (czas, temperatura, proporcje).
 */
export function detectBrewingHabitDrift(
  recentSessions?: Array<{
    id?: string;
    doseGrams?: number;
    waterGrams?: number;
    waterTempCelsius?: number;
    totalTimeSeconds?: number;
    rating?: number;
  }> | null,
  referenceMetrics?: Partial<HabitDriftMetrics> | null
): HabitDriftAnalysis {
  const defaultRef: HabitDriftMetrics = {
    averageBrewTimeSeconds: 180,
    averageWaterTempCelsius: 93,
    averageRatio: 16.0,
    averageRating: 4.0,
  };

  const safeRef: HabitDriftMetrics = {
    averageBrewTimeSeconds:
      typeof referenceMetrics?.averageBrewTimeSeconds === 'number' && Number.isFinite(referenceMetrics.averageBrewTimeSeconds)
        ? referenceMetrics.averageBrewTimeSeconds
        : defaultRef.averageBrewTimeSeconds,
    averageWaterTempCelsius:
      typeof referenceMetrics?.averageWaterTempCelsius === 'number' && Number.isFinite(referenceMetrics.averageWaterTempCelsius)
        ? referenceMetrics.averageWaterTempCelsius
        : defaultRef.averageWaterTempCelsius,
    averageRatio:
      typeof referenceMetrics?.averageRatio === 'number' && Number.isFinite(referenceMetrics.averageRatio)
        ? referenceMetrics.averageRatio
        : defaultRef.averageRatio,
    averageRating:
      typeof referenceMetrics?.averageRating === 'number' && Number.isFinite(referenceMetrics.averageRating)
        ? referenceMetrics.averageRating
        : defaultRef.averageRating,
  };

  if (!Array.isArray(recentSessions) || recentSessions.length === 0) {
    return {
      category: 'stable',
      hasSignificantDrift: false,
      sessionCount: 0,
      currentMetrics: {
        averageBrewTimeSeconds: 0,
        averageWaterTempCelsius: 0,
        averageRatio: 0,
        averageRating: 0,
      },
      referenceMetrics: safeRef,
      timeDeltaSeconds: 0,
      tempDeltaCelsius: 0,
      ratioDelta: 0,
      insightPl: 'Brak zarejestrowanych sesji do analizy powtarzalności parametrów.',
      insightEn: 'No recorded sessions to analyze parameter consistency.',
      recommendationPl: 'Zarejestruj kilka kolejnych naparów, aby wygenerować analizę powtarzalności.',
      recommendationEn: 'Log several consecutive brews to generate a repeatability analysis.',
    };
  }

  const validSessions = recentSessions.filter((s) => s && typeof s === 'object');
  const sessionCount = validSessions.length;

  let sumTime = 0;
  let countTime = 0;
  let sumTemp = 0;
  let countTemp = 0;
  let sumRatio = 0;
  let countRatio = 0;
  let sumRating = 0;
  let countRating = 0;

  for (const s of validSessions) {
    if (typeof s.totalTimeSeconds === 'number' && Number.isFinite(s.totalTimeSeconds) && s.totalTimeSeconds > 0) {
      sumTime += s.totalTimeSeconds;
      countTime++;
    }
    if (typeof s.waterTempCelsius === 'number' && Number.isFinite(s.waterTempCelsius) && s.waterTempCelsius > 0) {
      sumTemp += s.waterTempCelsius;
      countTemp++;
    }
    if (
      typeof s.waterGrams === 'number' &&
      Number.isFinite(s.waterGrams) &&
      s.waterGrams > 0 &&
      typeof s.doseGrams === 'number' &&
      Number.isFinite(s.doseGrams) &&
      s.doseGrams > 0
    ) {
      sumRatio += s.waterGrams / s.doseGrams;
      countRatio++;
    }
    if (typeof s.rating === 'number' && Number.isFinite(s.rating) && s.rating > 0) {
      sumRating += s.rating;
      countRating++;
    }
  }

  const currentMetrics: HabitDriftMetrics = {
    averageBrewTimeSeconds: countTime > 0 ? Math.round(sumTime / countTime) : safeRef.averageBrewTimeSeconds,
    averageWaterTempCelsius: countTemp > 0 ? Math.round((sumTemp / countTemp) * 10) / 10 : safeRef.averageWaterTempCelsius,
    averageRatio: countRatio > 0 ? Math.round((sumRatio / countRatio) * 10) / 10 : safeRef.averageRatio,
    averageRating: countRating > 0 ? Math.round((sumRating / countRating) * 10) / 10 : safeRef.averageRating,
  };

  const timeDeltaSeconds = Math.round(currentMetrics.averageBrewTimeSeconds - safeRef.averageBrewTimeSeconds);
  const tempDeltaCelsius = Math.round((currentMetrics.averageWaterTempCelsius - safeRef.averageWaterTempCelsius) * 10) / 10;
  const ratioDelta = Math.round((currentMetrics.averageRatio - safeRef.averageRatio) * 10) / 10;

  if (sessionCount < 3) {
    return {
      category: 'stable',
      hasSignificantDrift: false,
      sessionCount,
      currentMetrics,
      referenceMetrics: safeRef,
      timeDeltaSeconds,
      tempDeltaCelsius,
      ratioDelta,
      insightPl: `Zbyt mała próba do wykrycia dryfu nawyków (${sessionCount} z min. 3 wymaganych sesji).`,
      insightEn: `Sample size too small to detect habit drift (${sessionCount} of min. 3 sessions required).`,
      recommendationPl: 'Kontynuuj parzenie z bieżącymi parametrami, aby zebrać więcej danych.',
      recommendationEn: 'Continue brewing with current settings to collect more baseline data.',
    };
  }

  let category: HabitDriftCategory = 'stable';
  let hasSignificantDrift = false;
  let insightPl = 'Twoje nawyki parzenia są stabilne i powtarzalne.';
  let insightEn = 'Your brewing parameters are stable and consistent.';
  let recommendationPl = 'Utrzymuj bieżące nastawy młynka i recepturę.';
  let recommendationEn = 'Maintain current grinder settings and recipe.';

  if (timeDeltaSeconds >= 25) {
    category = 'time_drift_slower';
    hasSignificantDrift = true;
    insightPl = `Średni czas parzenia wydłużył się o +${timeDeltaSeconds}s (obecnie ${currentMetrics.averageBrewTimeSeconds}s vs wzorzec ${safeRef.averageBrewTimeSeconds}s).`;
    insightEn = `Average brew time slowed by +${timeDeltaSeconds}s (now ${currentMetrics.averageBrewTimeSeconds}s vs reference ${safeRef.averageBrewTimeSeconds}s).`;
    recommendationPl: 'Sprawdź stan żaren młynka lub oczyść je z nagromadzonego pyłu (fines retention).';
    recommendationEn: 'Inspect grinder burrs or clean out fines retention to restore target flow rate.';
  } else if (timeDeltaSeconds <= -25) {
    category = 'time_drift_faster';
    hasSignificantDrift = true;
    insightPl = `Średni czas parzenia skrócił się o ${timeDeltaSeconds}s (obecnie ${currentMetrics.averageBrewTimeSeconds}s vs wzorzec ${safeRef.averageBrewTimeSeconds}s).`;
    insightEn = `Average brew time sped up by ${timeDeltaSeconds}s (now ${currentMetrics.averageBrewTimeSeconds}s vs reference ${safeRef.averageBrewTimeSeconds}s).`;
    recommendationPl = 'Zwróć uwagę na kanałowanie (channeling) lub zmiel ziarna nieco drobniej.';
    recommendationEn = 'Watch for channeling or adjust grinder setting slightly finer.';
  } else if (Math.abs(tempDeltaCelsius) >= 3) {
    category = 'temp_drift';
    hasSignificantDrift = true;
    const sign = tempDeltaCelsius > 0 ? `+${tempDeltaCelsius}` : `${tempDeltaCelsius}`;
    insightPl = `Temperatura wody przesunęła się o ${sign}°C (obecnie ${currentMetrics.averageWaterTempCelsius}°C vs wzorzec ${safeRef.averageWaterTempCelsius}°C).`;
    insightEn = `Water temperature drifted by ${sign}°C (now ${currentMetrics.averageWaterTempCelsius}°C vs reference ${safeRef.averageWaterTempCelsius}°C).`;
    recommendationPl = 'Skontroluj nastawę czajnika z termostatem, aby zachować optymalną ekstrakcję.';
    recommendationEn = 'Verify temperature-controlled kettle settings to maintain target extraction.';
  } else if (Math.abs(ratioDelta) >= 1.5) {
    category = 'ratio_drift';
    hasSignificantDrift = true;
    const sign = ratioDelta > 0 ? `+${ratioDelta}` : `${ratioDelta}`;
    insightPl = `Proporcja wody do kawy uległa zmianie o ${sign} (obecnie 1:${currentMetrics.averageRatio} vs 1:${safeRef.averageRatio}).`;
    insightEn = `Brew ratio shifted by ${sign} (now 1:${currentMetrics.averageRatio} vs 1:${safeRef.averageRatio}).`;
    recommendationPl = 'Skalibruj wagę kuchenną i trzymaj się stałej receptury.';
    recommendationEn = 'Tare your digital scale and verify bean-to-water ratio.';
  }

  // Handle recommendation for time_drift_slower properly (fixing typo in object property if any)
  if (category === 'time_drift_slower') {
    recommendationPl = 'Sprawdź stan żaren młynka lub oczyść je z nagromadzonego pyłu (fines retention).';
    recommendationEn = 'Inspect grinder burrs or clean out fines retention to restore target flow rate.';
  }

  return {
    category,
    hasSignificantDrift,
    sessionCount,
    currentMetrics,
    referenceMetrics: safeRef,
    timeDeltaSeconds,
    tempDeltaCelsius,
    ratioDelta,
    insightPl,
    insightEn,
    recommendationPl,
    recommendationEn,
  };
}

export interface AdaptiveRecipeAdjustment {
  method: string;
  recommendedTempOffsetCelsius: number;
  recommendedGrindDeltaClicks: number;
  recommendedTimeOffsetSeconds: number;
  recommendedRatioDelta: number;
  reasonPl: string;
  reasonEn: string;
}

/**
 * Generuje adaptacyjne korekty receptury (Adaptive Recipe Adjustment) na podstawie
 * subiektywnych uwag smakowych użytkownika z ostatnich sesji.
 */
export function generateAdaptiveRecipeAdjustment(
  method?: string | null,
  recentFeedback?: {
    isTooSour?: boolean;
    isTooBitter?: boolean;
    isTooWeak?: boolean;
    isTooStrong?: boolean;
    averageRating?: number;
  } | null
): AdaptiveRecipeAdjustment {
  const safeMethod = method && typeof method === 'string' && method.trim() ? method.trim() : 'V60';

  let recommendedTempOffsetCelsius = 0;
  let recommendedGrindDeltaClicks = 0;
  let recommendedTimeOffsetSeconds = 0;
  let recommendedRatioDelta = 0;

  const isTooSour = Boolean(recentFeedback?.isTooSour);
  const isTooBitter = Boolean(recentFeedback?.isTooBitter);
  const isTooWeak = Boolean(recentFeedback?.isTooWeak);
  const isTooStrong = Boolean(recentFeedback?.isTooStrong);

  let reasonPl = '';
  let reasonEn = '';

  if (isTooSour && isTooBitter) {
    recommendedTempOffsetCelsius = 0;
    recommendedGrindDeltaClicks = 1;
    recommendedTimeOffsetSeconds = 0;
    reasonPl = 'Jednoczesna kwasowość i gorycz sugerują nierównomierną ekstrakcję (channeling). Zmiel odrobinę grubiej (+1 klik) i zadbaj o równy strumień wody.';
    reasonEn = 'Simultaneous sourness and bitterness suggest uneven extraction (channeling). Grind slightly coarser (+1 click) and ensure even water flow.';
  } else if (isTooSour) {
    recommendedTempOffsetCelsius = 2;
    recommendedGrindDeltaClicks = -2;
    recommendedTimeOffsetSeconds = 15;
    reasonPl = 'Wyczuwalna kwasowość wskazuje na niedoekstrakcję. Zmiel drobniej (-2 kliki), podnieś temperaturę (+2°C) lub wydłuż czas parzenia.';
    reasonEn = 'Sourness indicates underextraction. Grind finer (-2 clicks), raise water temperature (+2°C), or extend brew time.';
  } else if (isTooBitter) {
    recommendedTempOffsetCelsius = -2;
    recommendedGrindDeltaClicks = 2;
    recommendedTimeOffsetSeconds = -15;
    reasonPl = 'Nadmierna gorycz wskazuje na przeekstrakcję. Zmiel grubiej (+2 kliki), obniż temperaturę (-2°C) lub skróć kontakt z wodą.';
    reasonEn = 'Bitterness indicates overextraction. Grind coarser (+2 clicks), lower water temperature (-2°C), or reduce brew time.';
  }

  if (isTooWeak) {
    recommendedRatioDelta = -1;
    const weakPl = 'Napar jest zbyt wodnisty. Zwiększ dozę kawy lub zmniejsz ilość wody (obniżenie proporcji o 1).';
    const weakEn = 'Brew is too watery. Increase coffee dose or reduce water amount (ratio -1).';
    if (!reasonPl) {
      reasonPl = weakPl;
      reasonEn = weakEn;
    } else {
      reasonPl += ' Dodatkowo napar jest zbyt wodnisty — zwiększ dozę kawy.';
      reasonEn += ' Additionally the brew is too watery — increase coffee dose.';
    }
  } else if (isTooStrong) {
    recommendedRatioDelta = 1;
    const strongPl = 'Napar jest zbyt intensywny. Zmniejsz dozę kawy lub dodaj więcej wody (podwyższenie proporcji o 1).';
    const strongEn = 'Brew is too intense. Decrease coffee dose or add more water (ratio +1).';
    if (!reasonPl) {
      reasonPl = strongPl;
      reasonEn = strongEn;
    } else {
      reasonPl += ' Dodatkowo napar jest zbyt mocny — użyj nieco więcej wody.';
      reasonEn += ' Additionally the brew is too strong — use slightly more water.';
    }
  }

  if (!reasonPl) {
    reasonPl = 'Brak uwag smakowych — parametry zrównoważone.';
    reasonEn = 'No taste issues reported — parameters are balanced.';
  }

  return {
    method: safeMethod,
    recommendedTempOffsetCelsius,
    recommendedGrindDeltaClicks,
    recommendedTimeOffsetSeconds,
    recommendedRatioDelta,
    reasonPl,
    reasonEn,
  };
}

export type RecipeComplexityLevel = 'beginner' | 'intermediate' | 'advanced' | 'master';

export interface RecipeComplexityEvaluation {
  complexityScore: number;
  level: RecipeComplexityLevel;
  stepCount: number;
  totalDurationSeconds: number;
  pourCount: number;
  hasAgitation: boolean;
  requiresSpecialTechnique: boolean;
  summaryPl: string;
  summaryEn: string;
}

export function evaluateRecipeComplexity(recipe: unknown): RecipeComplexityEvaluation {
  if (!recipe || typeof recipe !== 'object') {
    return {
      complexityScore: 0,
      level: 'beginner',
      stepCount: 0,
      totalDurationSeconds: 0,
      pourCount: 0,
      hasAgitation: false,
      requiresSpecialTechnique: false,
      summaryPl: 'Prosta receptura — brak zdefiniowanych kroków procedury.',
      summaryEn: 'Simple recipe — no procedure steps defined.',
    };
  }

  const rec = recipe as Record<string, unknown>;
  let steps: any[] = [];
  if (Array.isArray(rec.steps)) {
    steps = rec.steps;
  } else if (typeof rec.stepsJson === 'string') {
    try {
      const parsed = JSON.parse(rec.stepsJson);
      if (Array.isArray(parsed)) steps = parsed;
    } catch {
      steps = [];
    }
  }

  const stepCount = steps.length;
  let totalDurationSeconds = 0;
  let pourCount = 0;
  let hasAgitation = false;

  for (const step of steps) {
    if (!step || typeof step !== 'object') continue;
    const dur =
      typeof step.durationSeconds === 'number' &&
      Number.isFinite(step.durationSeconds) &&
      step.durationSeconds > 0
        ? step.durationSeconds
        : parseStepDurationSeconds(typeof step.description === 'string' ? step.description : '', 0);
    totalDurationSeconds += dur;

    const desc = `${step.title ?? ''} ${step.description ?? ''}`.toLowerCase();
    if (/(?:polej|wlej|zalej|zalan|zalew|pour|bloom|preinfuz)/i.test(desc)) {
      pourCount++;
    }
    if (/(?:zamieszaj|wymieszaj|swirl|stir|agitat|zakr[eę][cć]|mieszan)/i.test(desc)) {
      hasAgitation = true;
    }
  }

  const methodStr = typeof rec.method === 'string' ? rec.method.toLowerCase() : '';
  const nameStr = typeof rec.name === 'string' ? rec.name.toLowerCase() : '';
  const allText = `${methodStr} ${nameStr}`;

  const requiresSpecialTechnique =
    /(?:espresso|syfon|siphon|gongfu|ibrik|dżezw|turkish|ci[sś]nieni|bypass|turbulencj|pulse)/i.test(
      allText
    );

  const stepScore = Math.min(30, stepCount * 6);
  const durationScore =
    totalDurationSeconds > 600
      ? 15
      : totalDurationSeconds > 300
      ? 10
      : totalDurationSeconds > 120
      ? 5
      : 0;
  const pourScore = pourCount >= 4 ? 20 : pourCount >= 2 ? 10 : pourCount >= 1 ? 5 : 0;
  const agitationScore = hasAgitation ? 15 : 0;
  const techniqueScore = requiresSpecialTechnique ? 20 : 0;

  const rawScore = stepScore + durationScore + pourScore + agitationScore + techniqueScore;
  const complexityScore = Math.min(100, Math.max(0, rawScore));

  let level: RecipeComplexityLevel = 'beginner';
  let summaryPl = 'Prosta receptura dla początkujących z minimalną liczbą etapów.';
  let summaryEn = 'Simple beginner-friendly recipe with minimal procedural steps.';

  if (complexityScore >= 75) {
    level = 'master';
    summaryPl = 'Receptura mistrzowska wymagająca precyzyjnej kontroli ekstrakcji, zalewań i techniki.';
    summaryEn = 'Master-level recipe requiring meticulous extraction control, pours, and technique.';
  } else if (complexityScore >= 50) {
    level = 'advanced';
    summaryPl = 'Zaawansowana procedura parzenia z wieloetapowym dozowaniem wody i mieszaniem.';
    summaryEn = 'Advanced brewing routine featuring multi-stage water delivery and agitation.';
  } else if (complexityScore >= 25) {
    level = 'intermediate';
    summaryPl = 'Umiarkowanie złożona receptura wymagająca kontroli czasu i podstawowej techniki.';
    summaryEn = 'Moderately complex routine requiring timing awareness and basic technique.';
  }

  return {
    complexityScore,
    level,
    stepCount,
    totalDurationSeconds,
    pourCount,
    hasAgitation,
    requiresSpecialTechnique,
    summaryPl,
    summaryEn,
  };
}




export type BrewConsistencyGrade = 'exceptional' | 'consistent' | 'variable' | 'erratic';

export interface BrewConsistencyIndex {
  grade: BrewConsistencyGrade;
  consistencyScore: number;
  sessionCount: number;
  averageDoseGrams: number;
  doseStdDev: number;
  averageRatio: number;
  ratioStdDev: number;
  averageDurationSeconds: number;
  durationStdDev: number;
  summaryPl: string;
  summaryEn: string;
}

export function calculateBrewConsistencyIndex(
  sessions: unknown[] | null | undefined
): BrewConsistencyIndex {
  const safeSessions = Array.isArray(sessions) ? sessions : [];

  interface CleanBrew {
    dose: number;
    water: number;
    ratio: number;
    duration: number;
  }

  const cleanBrews: CleanBrew[] = [];

  for (const s of safeSessions) {
    if (!s || typeof s !== 'object') continue;
    const session = s as Record<string, unknown>;

    const dose =
      typeof session.doseGrams === 'number' && Number.isFinite(session.doseGrams) && session.doseGrams > 0
        ? session.doseGrams
        : typeof session.dose === 'number' && Number.isFinite(session.dose) && session.dose > 0
        ? session.dose
        : 0;

    const water =
      typeof session.waterGrams === 'number' && Number.isFinite(session.waterGrams) && session.waterGrams > 0
        ? session.waterGrams
        : typeof session.water === 'number' && Number.isFinite(session.water) && session.water > 0
        ? session.water
        : 0;

    const duration =
      typeof session.brewTimeSeconds === 'number' && Number.isFinite(session.brewTimeSeconds) && session.brewTimeSeconds > 0
        ? session.brewTimeSeconds
        : typeof session.durationSeconds === 'number' && Number.isFinite(session.durationSeconds) && session.durationSeconds > 0
        ? session.durationSeconds
        : 0;

    if (dose > 0 && water > 0) {
      const ratio = water / dose;
      cleanBrews.push({ dose, water, ratio, duration });
    }
  }

  const sessionCount = cleanBrews.length;

  if (sessionCount < 2) {
    const single = cleanBrews[0];
    return {
      grade: 'consistent',
      consistencyScore: 100,
      sessionCount,
      averageDoseGrams: single ? Math.round(single.dose * 10) / 10 : 0,
      doseStdDev: 0,
      averageRatio: single ? Math.round(single.ratio * 10) / 10 : 0,
      ratioStdDev: 0,
      averageDurationSeconds: single ? Math.round(single.duration) : 0,
      durationStdDev: 0,
      summaryPl: 'Zbyt mała liczba sesji do wyznaczenia odchylenia standardowego parametrów (wymagane min. 2).',
      summaryEn: 'Too few sessions to compute parameter standard deviations (minimum 2 required).',
    };
  }

  const sumDose = cleanBrews.reduce((acc, b) => acc + b.dose, 0);
  const avgDose = sumDose / sessionCount;
  const varianceDose =
    cleanBrews.reduce((acc, b) => acc + Math.pow(b.dose - avgDose, 2), 0) / sessionCount;
  const doseStdDev = Math.round(Math.sqrt(varianceDose) * 100) / 100;

  const sumRatio = cleanBrews.reduce((acc, b) => acc + b.ratio, 0);
  const avgRatio = sumRatio / sessionCount;
  const varianceRatio =
    cleanBrews.reduce((acc, b) => acc + Math.pow(b.ratio - avgRatio, 2), 0) / sessionCount;
  const ratioStdDev = Math.round(Math.sqrt(varianceRatio) * 100) / 100;

  const sumDuration = cleanBrews.reduce((acc, b) => acc + b.duration, 0);
  const avgDuration = sumDuration / sessionCount;
  const varianceDuration =
    cleanBrews.reduce((acc, b) => acc + Math.pow(b.duration - avgDuration, 2), 0) / sessionCount;
  const durationStdDev = Math.round(Math.sqrt(varianceDuration) * 100) / 100;

  const doseCv = avgDose > 0 ? doseStdDev / avgDose : 0;
  const ratioCv = avgRatio > 0 ? ratioStdDev / avgRatio : 0;
  const durCv = avgDuration > 0 ? durationStdDev / avgDuration : 0;

  const compositePenalty = doseCv * 35 + ratioCv * 40 + durCv * 25;
  const consistencyScore = Math.max(0, Math.min(100, Math.round(100 - compositePenalty * 100)));

  let grade: BrewConsistencyGrade = 'erratic';
  let summaryPl = `Niska powtarzalność parametrów (wskaźnik: ${consistencyScore}/100) — zauważalne odchylenia w dozie lub proporcji.`;
  let summaryEn = `Low brewing consistency score (${consistencyScore}/100) — noticeable deviations across dose or ratio.`;

  if (consistencyScore >= 90) {
    grade = 'exceptional';
    summaryPl = `Wybitna powtarzalność sesji parzenia (wskaźnik: ${consistencyScore}/100) — precyzyjnie kontrolowana doza, woda i czas.`;
    summaryEn = `Exceptional brewing consistency score (${consistencyScore}/100) — tightly controlled dose, water, and timing.`;
  } else if (consistencyScore >= 75) {
    grade = 'consistent';
    summaryPl = `Dobra powtarzalność sesji (wskaźnik: ${consistencyScore}/100) z niewielkimi, dopuszczalnymi wahaniami.`;
    summaryEn = `Good brewing consistency score (${consistencyScore}/100) with minor acceptable variations.`;
  } else if (consistencyScore >= 50) {
    grade = 'variable';
    summaryPl = `Umiarkowanie zróżnicowane parametry parzenia (wskaźnik: ${consistencyScore}/100).`;
    summaryEn = `Moderately variable brewing parameters score (${consistencyScore}/100).`;
  }

  return {
    grade,
    consistencyScore,
    sessionCount,
    averageDoseGrams: Math.round(avgDose * 10) / 10,
    doseStdDev,
    averageRatio: Math.round(avgRatio * 10) / 10,
    ratioStdDev,
    averageDurationSeconds: Math.round(avgDuration),
    durationStdDev,
    summaryPl,
    summaryEn,
  };
}
