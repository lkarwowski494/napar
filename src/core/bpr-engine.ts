// ============================================================================
// Napar (Steepwise) — Silnik Automatyzacji Procesowej BPR (To-Be Architecture)
// 1. Automatyczne parsowanie czasu z opisu kroku procedury (Zero-Click Timer)
// 2. 14-dniowy Proaktywny Kalendarz i Harmonogram Akcji (1-Tap Action Feed)
// 3. Generator przypomnień kalendarzowych RFC 5545 (.ics)
// ============================================================================

import { InventoryItem, BrewSession } from './database-schema';

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
  fallbackSeconds = 30
): number {
  const safeFallback = Math.max(1, Math.round(fallbackSeconds || 30));
  if (!instruction || typeof instruction !== 'string') {
    return safeFallback;
  }

  const normalized = instruction.toLowerCase().replace(/,/g, '.');

  // 1. Zakres minut: np. "10-15 minut", "10–15 min", "2 do 3 minut"
  const minRangeMatch = normalized.match(
    /(\d+(?:\.\d+)?)\s*(?:[-–—]|do|to)\s*(\d+(?:\.\d+)?)\s*(?:minut[ay]?|min\b)/i
  );
  if (minRangeMatch) {
    const minVal = parseFloat(minRangeMatch[1]);
    if (!Number.isNaN(minVal) && minVal > 0) {
      return Math.round(minVal * 60);
    }
  }

  // 2. Zakres sekund: np. "30-45 s", "25–30 sekund", "15-20 sec"
  const secRangeMatch = normalized.match(
    /(\d+(?:\.\d+)?)\s*(?:[-–—]|do|to)\s*(\d+(?:\.\d+)?)\s*(?:sekund[ay]?|sek\b|sec(?:onds?)?\b|s\b)/i
  );
  if (secRangeMatch) {
    const secVal = parseFloat(secRangeMatch[1]);
    if (!Number.isNaN(secVal) && secVal > 0) {
      return Math.round(secVal);
    }
  }

  // 3. Pojedyncze minuty (+ opcjonalne sekundy): np. "przez 2 minuty", "1.5 min"
  const minSingleMatch = normalized.match(
    /(\d+(?:\.\d+)?)\s*(?:minut[ay]?|min\b)/i
  );
  if (minSingleMatch) {
    const mins = parseFloat(minSingleMatch[1]);
    if (!Number.isNaN(mins) && mins > 0) {
      return Math.round(mins * 60);
    }
  }

  // 4. Pojedyncze sekundy: np. "odczekaj 30 s", "przez 45 sekund", "wait 40s"
  const secSingleMatch = normalized.match(
    /(\d+(?:\.\d+)?)\s*(?:sekund[ay]?|sek\b|sec(?:onds?)?\b|s\b)/i
  );
  if (secSingleMatch) {
    const secs = parseFloat(secSingleMatch[1]);
    if (!Number.isNaN(secs) && secs > 0) {
      return Math.round(secs);
    }
  }

  return safeFallback;
}

function toDateKey(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(base: Date, days: number): Date {
  const copy = new Date(base.getTime());
  copy.setDate(copy.getDate() + days);
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
  const baseDate = new Date(referenceDateIso);
  const refDayStart = new Date(
    baseDate.getFullYear(),
    baseDate.getMonth(),
    baseDate.getDate()
  );

  const actions: ProactiveActionItem[] = [];
  const activeItems = (inventory || []).filter(
    (item) => !item.isArchived && item.remainingWeightGrams > 0
  );

  for (const item of activeItems) {
    if (item.type === 'coffee' && item.roastOrHarvestDate) {
      const roastDate = new Date(item.roastOrHarvestDate);
      if (!Number.isNaN(roastDate.getTime())) {
        const roastDayStart = new Date(
          roastDate.getFullYear(),
          roastDate.getMonth(),
          roastDate.getDate()
        );
        const daysSinceRoast = Math.floor(
          (refDayStart.getTime() - roastDayStart.getTime()) / (1000 * 3600 * 24)
        );

        if (daysSinceRoast < 7) {
          // Ziarna jeszcze odgazowują — zaplanuj otwarcie okna Peak w 7. dniu po wypale
          const daysUntilPeak = Math.min(13, Math.max(1, 7 - daysSinceRoast));
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
            subtitlePl: `Koniec odgazowania CO₂ (7. dzień po wypale) · ${item.remainingWeightGrams}g w spiżarni`,
            subtitleEn: `CO₂ degassing complete (Day 7 post-roast) · ${item.remainingWeightGrams}g left`,
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
            subtitlePl: `${daysSinceRoast} dni po wypale · Pozostało ${item.remainingWeightGrams}g — zaparz teraz`,
            subtitleEn: `${daysSinceRoast} days post-roast · ${item.remainingWeightGrams}g left — brew now`,
            badgeColor: 'success',
            inventoryItemId: item.id,
            recommendedMethod: 'V60',
            doseGrams: Math.min(18, item.remainingWeightGrams),
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
            subtitlePl: `${daysSinceRoast} dni po wypale · Zwiększ dozę lub zmiel drobniej (${item.remainingWeightGrams}g)`,
            subtitleEn: `${daysSinceRoast} days post-roast · Up-dose or grind finer (${item.remainingWeightGrams}g)`,
            badgeColor: 'warning',
            inventoryItemId: item.id,
            recommendedMethod: 'AeroPress',
            doseGrams: Math.min(18, item.remainingWeightGrams),
            waterGrams: 240,
            waterTempCelsius: 95,
          });
        }
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
        subtitlePl: `Herbata rzemieślnicza · Pozostało ${item.remainingWeightGrams}g w spiżarni`,
        subtitleEn: `Artisan tea · ${item.remainingWeightGrams}g remaining in stash`,
        badgeColor: 'success',
        inventoryItemId: item.id,
        recommendedMethod: 'Gaiwan',
        doseGrams: Math.min(5, item.remainingWeightGrams),
        waterGrams: 150,
        waterTempCelsius: 85,
      });
    }
  }

  // Jeśli brak aktywnych paczek lub jako uzupełnienie harmonogramu: dodaj kalibrację / powtórkę z najlepszej sesji
  if (actions.length === 0) {
    const topSession = (sessions || []).find((s) => (s.rating || 0) >= 4) || (sessions || [])[0];
    if (topSession) {
      actions.push({
        id: `action-repeat-${topSession.id}`,
        dateIso: toDateKey(refDayStart),
        daysOffset: 0,
        bucketLabelPl: 'DZIŚ',
        bucketLabelEn: 'TODAY',
        titlePl: `Powtórz udany przepis: ${topSession.recipeName || topSession.method}`,
        titleEn: `Repeat top recipe: ${topSession.recipeName || topSession.method}`,
        subtitlePl: `${topSession.doseGrams}g / ${topSession.waterGrams}g · ${topSession.waterTempCelsius}°C`,
        subtitleEn: `${topSession.doseGrams}g / ${topSession.waterGrams}g · ${topSession.waterTempCelsius}°C`,
        badgeColor: 'copper',
        recipeId: topSession.recipeId,
        recommendedMethod: topSession.method,
        doseGrams: topSession.doseGrams,
        waterGrams: topSession.waterGrams,
        waterTempCelsius: topSession.waterTempCelsius,
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
  const baseDate = new Date(referenceDateIso);
  const todayStart = new Date(
    baseDate.getFullYear(),
    baseDate.getMonth(),
    baseDate.getDate()
  );

  const schedule = buildProactiveActionSchedule(
    referenceDateIso,
    inventory,
    sessions
  );

  const sessionCountsByDate: Record<string, number> = {};
  for (const s of sessions || []) {
    if (s.brewedAt) {
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
    const dow = current.getDay();
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
      dayNumber: current.getDate(),
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
export function generateActionIcsContent(action: ProactiveActionItem): string {
  const cleanDate = (action.dateIso || '2026-10-17').replace(/-/g, '');
  const dtStart = `${cleanDate}T080000Z`;
  const dtEnd = `${cleanDate}T081500Z`;
  const summary = action.titlePl.replace(/[\r\n]+/g, ' ');
  const description = action.subtitlePl.replace(/[\r\n]+/g, ' ');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Apps4Brew Studio//Napar Steepwise//PL',
    'BEGIN:VEVENT',
    `UID:${action.id}@napar.apps4brew.studio`,
    `DTSTAMP:${dtStart}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}
