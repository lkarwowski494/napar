import {
  parseStepDurationSeconds,
  buildProactiveActionSchedule,
  buildFourteenDayCalendar,
  generateActionIcsContent,
} from '../bpr-engine';
import { InventoryItem, BrewSession } from '../database-schema';

describe('BPR Engine — Zero-Click Duration Parser & Proactive 14-Day Calendar', () => {
  describe('parseStepDurationSeconds', () => {
    it('parses range of minutes (e.g. "przez 10–15 minut") into lower-bound seconds', () => {
      expect(parseStepDurationSeconds('Gotuj przez 10–15 minut na wolnym ogniu', 30)).toBe(600);
      expect(parseStepDurationSeconds('Parz przez 2-3 min', 45)).toBe(120);
      expect(parseStepDurationSeconds('Steep for 3 to 4 minutes', 30)).toBe(180);
    });

    it('parses range of seconds (e.g. "odczekaj 30-45 s")', () => {
      expect(parseStepDurationSeconds('Odczekaj 30-45 s na odgazowanie', 60)).toBe(30);
      expect(parseStepDurationSeconds('Zalewaj przez 20–25 sekund', 60)).toBe(20);
    });

    it('parses single minute values', () => {
      expect(parseStepDurationSeconds('Parz pod przykryciem przez 2 minuty', 30)).toBe(120);
      expect(parseStepDurationSeconds('Odczekaj 1,5 min', 30)).toBe(90);
    });

    it('parses single second values', () => {
      expect(parseStepDurationSeconds('Odczekaj 35 s przed kolejnym zalaniem', 60)).toBe(35);
      expect(parseStepDurationSeconds('Preinfuzja przez 45 sekund', 30)).toBe(45);
      expect(parseStepDurationSeconds('Wait 25 sec and pour', 30)).toBe(25);
    });

    it('falls back to fallbackSeconds when no duration is present in text', () => {
      expect(parseStepDurationSeconds('Zalej równomiernie do pełnej wagi', 50)).toBe(50);
      expect(parseStepDurationSeconds('', 40)).toBe(40);
      expect(parseStepDurationSeconds(null, 35)).toBe(35);
      expect(parseStepDurationSeconds(undefined)).toBe(30);
    });
  });

  describe('buildProactiveActionSchedule & buildFourteenDayCalendar', () => {
    const refIso = '2026-10-17T10:00:00.000Z';

    const sampleInventory: InventoryItem[] = [
      {
        id: 'bean-degas',
        name: 'Ethiopia Guji Fresh',
        type: 'coffee',
        roastOrHarvestDate: '2026-10-14', // 3 days ago -> 4 days until Peak
        initialWeightGrams: 250,
        remainingWeightGrams: 250,
        flavorNotes: ['jasmine'],
        isFavorite: true,
        isArchived: false,
        createdAt: refIso,
        updatedAt: refIso,
      },
      {
        id: 'bean-peak',
        name: 'Kenya AA Peak',
        type: 'coffee',
        roastOrHarvestDate: '2026-10-03', // 14 days ago -> in Peak window (DZIŚ)
        initialWeightGrams: 250,
        remainingWeightGrams: 180,
        flavorNotes: ['blackcurrant'],
        isFavorite: false,
        isArchived: false,
        createdAt: refIso,
        updatedAt: refIso,
      },
      {
        id: 'bean-aging',
        name: 'Colombia Aging',
        type: 'coffee',
        roastOrHarvestDate: '2026-08-20', // >35 days ago -> JUTRO
        initialWeightGrams: 250,
        remainingWeightGrams: 60,
        flavorNotes: ['chocolate'],
        isFavorite: false,
        isArchived: false,
        createdAt: refIso,
        updatedAt: refIso,
      },
      {
        id: 'tea-gyokuro',
        name: 'Uji Gyokuro',
        type: 'tea',
        initialWeightGrams: 50,
        remainingWeightGrams: 40,
        flavorNotes: ['umami'],
        isFavorite: true,
        isArchived: false,
        createdAt: refIso,
        updatedAt: refIso,
      },
    ];

    const sampleSessions: BrewSession[] = [
      {
        id: 'sess-1',
        beverageType: 'COFFEE',
        method: 'V60',
        recipeName: 'Hoffmann V60',
        doseGrams: 15,
        waterGrams: 250,
        waterTempCelsius: 93,
        totalTimeSeconds: 180,
        rating: 5,
        flavorTags: ['floral'],
        brewedAt: '2026-10-17T08:30:00.000Z',
      },
    ];

    it('builds chronological action schedule sorted by daysOffset (DZIŚ -> JUTRO -> Za X dni)', () => {
      const schedule = buildProactiveActionSchedule(refIso, sampleInventory, sampleSessions);
      expect(schedule.length).toBe(4);
      expect(schedule[0].daysOffset).toBe(0);
      expect(schedule[0].bucketLabelPl).toBe('DZIŚ');
      expect(schedule[0].inventoryItemId).toBe('bean-peak');

      expect(schedule[1].daysOffset).toBe(1);
      expect(schedule[1].bucketLabelPl).toBe('JUTRO');
      expect(schedule[1].inventoryItemId).toBe('bean-aging');

      expect(schedule.some((a) => a.inventoryItemId === 'bean-degas')).toBe(true);
      expect(schedule.some((a) => a.inventoryItemId === 'tea-gyokuro')).toBe(true);
    });

    it('falls back to top session or default calibration when inventory is empty', () => {
      const fromSession = buildProactiveActionSchedule(refIso, [], sampleSessions);
      expect(fromSession.length).toBe(1);
      expect(fromSession[0].titlePl).toContain('Hoffmann V60');

      const fromDefault = buildProactiveActionSchedule(refIso, [], []);
      expect(fromDefault.length).toBe(1);
      expect(fromDefault[0].id).toBe('action-default-calibration');
    });

    it('builds a 14-day calendar with colored status dots for actions and sessions', () => {
      const days = buildFourteenDayCalendar(refIso, sampleInventory, sampleSessions);
      expect(days).toHaveLength(14);
      expect(days[0].isToday).toBe(true);
      expect(days[0].dotType).toBe('both');
      expect(days[1].dotType).toBe('action');
    });

    it('generates valid RFC 5545 VCALENDAR .ics content', () => {
      const schedule = buildProactiveActionSchedule(refIso, sampleInventory, sampleSessions);
      const ics = generateActionIcsContent(schedule[0]);
      expect(ics).toContain('BEGIN:VCALENDAR');
      expect(ics).toContain('BEGIN:VEVENT');
      expect(ics).toContain('SUMMARY:Szczyt świeżości (Peak): Kenya AA Peak');
      expect(ics).toContain('END:VCALENDAR');
    });
  });
});
