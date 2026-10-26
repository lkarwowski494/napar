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
      ? parseFloat(fallbackSeconds)
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

  const normalized = instruction.trim().toLowerCase().replace(/,/g, '.');

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

  // 3. Pojedyncze minuty (+ opcjonalne sekundy): np. "przez 2 minuty", "1.5 min", "wait 2 mins", "steep 4 minutes"
  const minSingleMatch = normalized.match(
    /(\d+(?:\.\d+)?)\s*(?:minut(?:[a-ząęółśżźćń]+)?|minutes?|mins?|min\b)/i
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

    if (item.type === 'coffee') {
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

        if (safeDaysRoast < 7) {
          // Ziarna jeszcze odgazowują — zaplanuj otwarcie okna Peak w 7. dniu po wypale
          const daysUntilPeak = Math.min(13, Math.max(1, 7 - safeDaysRoast));
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
            subtitlePl: `Koniec odgazowania CO₂ (7. dzień po wypale) · ${safeRemainingWeight}g w spiżarni`,
            subtitleEn: `CO₂ degassing complete (Day 7 post-roast) · ${safeRemainingWeight}g left`,
            badgeColor: 'copper',
            inventoryItemId: item.id,
            recommendedMethod: 'V60',
            doseGrams: 15,
            waterGrams: 250,
            waterTempCelsius: 93,
          });
        } else if (daysSinceRoast <= 35) {
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
    } else if (item.type === 'tea') {
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
 * Generuje zawartość pliku kalendarzowego iCalendar (.ics, RFC 5545)
 * dla wybranej akcji z harmonogramu.
 */
export function escapeIcsText(str: string): string {
  if (typeof str !== 'string' || !str) return '';
  return str
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
  const rawSummary = (isEn ? action.titleEn || action.titlePl : action.titlePl) || 'Sesja parzenia Napar';
  const rawDescription = (isEn ? action.subtitleEn || action.subtitlePl : action.subtitlePl) || '';

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
