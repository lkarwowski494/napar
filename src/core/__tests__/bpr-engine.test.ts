import {
  parseStepDurationSeconds,
  buildProactiveActionSchedule,
  buildFourteenDayCalendar,
  generateActionIcsContent,
  escapeIcsText,
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

    it('prioritizes explicit step.durationSeconds over regex parsed text in recipes (M1-audytor-generalny-031)', () => {
      expect(
        parseStepDurationSeconds(
          'Zalej 200g wrzątku w 10 sekund i zamieszaj 3 razy ruchem prostoliniowym.',
          30,
          true
        )
      ).toBe(30);
      expect(
        parseStepDurationSeconds(
          'Maceracja przez 45s, a w 2:30 naciśnij dźwignię, aby spuścić napar.',
          60,
          true
        )
      ).toBe(60);
    });

    it('falls back to fallbackSeconds when no duration is present in text', () => {
      expect(parseStepDurationSeconds('Zalej równomiernie do pełnej wagi', 50)).toBe(50);
      expect(parseStepDurationSeconds('', 40)).toBe(40);
      expect(parseStepDurationSeconds(null, 35)).toBe(35);
      expect(parseStepDurationSeconds(undefined)).toBe(30);
    });

    it('TASK-P7-07-JAK: safely handles NaN and Infinity for fallbackSeconds', () => {
      expect(parseStepDurationSeconds('Brak czasu w instrukcji', NaN)).toBe(30);
      expect(parseStepDurationSeconds('Brak czasu w instrukcji', Infinity)).toBe(30);
      expect(parseStepDurationSeconds('Brak czasu w instrukcji', -10)).toBe(30);
      expect(parseStepDurationSeconds(undefined, NaN, true)).toBe(30);
      expect(parseStepDurationSeconds(undefined, Infinity, true)).toBe(30);
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

    it('escapes special characters (; , \\) in RFC 5545 TEXT and supports English export', () => {
      const schedule = buildProactiveActionSchedule(refIso, sampleInventory, sampleSessions);
      const icsEn = generateActionIcsContent(schedule[0], 'en');
      expect(icsEn).toContain('PRODID:-//Apps4Brew Studio//Napar Steepwise//EN');
      expect(icsEn).toContain('SUMMARY:Peak freshness window: Kenya AA Peak');

      const testAction = {
        ...schedule[0],
        titlePl: 'Kawa, specialty; palona\\ręcznie',
      };
      const icsEscaped = generateActionIcsContent(testAction, 'pl');
      expect(icsEscaped).toContain('SUMMARY:Kawa\\, specialty\\; palona\\\\ręcznie');
      expect(escapeIcsText('A, B; C\\ D\nE')).toBe('A\\, B\\; C\\\\ D\\nE');
    });
  
    it('TASK-P11-07-JAK: safely handles empty and corrupt referenceDateIso without generating NaN-NaN-NaN', () => {
      const scheduleFromEmpty = buildProactiveActionSchedule('', [], []);
      expect(scheduleFromEmpty.length).toBe(1);
      expect(scheduleFromEmpty[0].dateIso).not.toContain('NaN');
      expect(/^\d{4}-\d{2}-\d{2}$/.test(scheduleFromEmpty[0].dateIso)).toBe(true);

      const daysFromCorrupt = buildFourteenDayCalendar('corrupt-date-string', [], []);
      expect(daysFromCorrupt).toHaveLength(14);
      expect(daysFromCorrupt[0].dateIso).not.toContain('NaN');
      expect(Number.isFinite(daysFromCorrupt[0].dayNumber)).toBe(true);
    });

    it('TASK-P13-07-JAK: generateActionIcsContent chroni przed null/undefined i uzupełnia brakujące ID/tytuł', () => {
      expect(() => generateActionIcsContent(null as any)).toThrow('Nieprawidłowy obiekt akcji kalendarza');
      expect(() => generateActionIcsContent(undefined as any)).toThrow('Nieprawidłowy obiekt akcji kalendarza');

      const fallbackIcs = generateActionIcsContent({} as any);
      expect(fallbackIcs).toContain('BEGIN:VCALENDAR');
      expect(fallbackIcs).toContain('UID:action-');
      expect(fallbackIcs).toContain('SUMMARY:Sesja parzenia Napar');
    });

    it('TASK-P14-07-JAK: buildProactiveActionSchedule i buildFourteenDayCalendar chronią przed null w tablicach sessions i inventory', () => {
      const scheduleWithNulls = buildProactiveActionSchedule('2026-10-26T08:00:00Z', [null as any], [null as any]);
      expect(scheduleWithNulls.length).toBeGreaterThan(0);
      expect(scheduleWithNulls[0].id).toBe('action-default-calibration');

      const calendarWithNulls = buildFourteenDayCalendar('2026-10-26T08:00:00Z', [null as any], [null as any]);
      expect(calendarWithNulls).toHaveLength(14);
      expect(calendarWithNulls[0].sessionCount).toBe(0);
    });

    it('TASK-P33-03-ZAK: parseStepDurationSeconds parsuje string fallbackSeconds i clampuje do 86400s', () => {
      expect(parseStepDurationSeconds(null, '45')).toBe(45);
      expect(parseStepDurationSeconds(null, '0')).toBe(30);
      expect(parseStepDurationSeconds(null, '-10')).toBe(30);
      expect(parseStepDurationSeconds('przez 999999 minut')).toBe(86400);
      expect(parseStepDurationSeconds('odczekaj 999999 sekund')).toBe(86400);
      expect(parseStepDurationSeconds(null, -0)).toBe(30);
    });

    it('TASK-P34-03-ZAK: buildProactiveActionSchedule stosuje poprawną gramatykę interwałów po wypale (post-roast)', () => {
      const refIso = '2026-10-26T12:00:00Z';
      // 10 dni po wypale (szczyt świeżości Peak)
      const inventoryItemPeak: any = {
        id: 'coffee-peak-10',
        name: 'Kolumbia Geisha',
        type: 'coffee',
        roastOrHarvestDate: '2026-10-16T12:00:00Z',
        remainingWeightGrams: 200,
        isArchived: false,
      };

      // 40 dni po wypale (starzejące się ziarna)
      const inventoryItemAging: any = {
        id: 'coffee-aging-40',
        name: 'Etiopia Yirgacheffe',
        type: 'coffee',
        roastOrHarvestDate: '2026-09-16T12:00:00Z',
        remainingWeightGrams: 100,
        isArchived: false,
      };

      const schedule = buildProactiveActionSchedule(refIso, [inventoryItemPeak, inventoryItemAging], []);
      const peakAction = schedule.find((a) => a.id === 'action-peak-now-coffee-peak-10');
      expect(peakAction).toBeDefined();
      expect(peakAction?.subtitlePl).toContain('10 dni po wypale');
      expect(peakAction?.subtitleEn).toContain('10 days post-roast');

      const agingAction = schedule.find((a) => a.id === 'action-aging-coffee-aging-40');
      expect(agingAction).toBeDefined();
      expect(agingAction?.subtitlePl).toContain('40 dni po wypale');
      expect(agingAction?.subtitleEn).toContain('40 days post-roast');
    });

    it('TASK-P35-03-ZAK: generateActionIcsContent parsuje pełne ISO stringi daty i sanityzuje UID', () => {
      const actionWithFullIso: any = {
        id: 'action:peak/123@special!',
        dateIso: '2026-10-26T15:30:00.000Z',
        titlePl: 'Parzenie V60; z balansem, owocowe',
        subtitlePl: 'Kawa 15g; woda 250g, 93°C',
      };
      const ics = generateActionIcsContent(actionWithFullIso, 'pl');
      expect(ics).toContain('DTSTART:20261026T080000Z');
      expect(ics).toContain('DTEND:20261026T081500Z');
      expect(ics).toContain('UID:action_peak_123_special_@napar.apps4brew.studio');
      expect(ics).toContain('SUMMARY:Parzenie V60\\; z balansem\\, owocowe');
      expect(ics).toContain('DESCRIPTION:Kawa 15g\\; woda 250g\\, 93°C');
    });

    it('TASK-P36-03-ZAK: buildFourteenDayCalendar jest odporne na pustą datę, null i uszkodzone tablice', () => {
      const daysFromEmpty = buildFourteenDayCalendar('', null as any, undefined as any);
      expect(daysFromEmpty).toHaveLength(14);
      expect(daysFromEmpty[0].isToday).toBe(true);

      const daysFromInvalidDate = buildFourteenDayCalendar('not-a-date' as any, [] as any, [] as any);
      expect(daysFromInvalidDate).toHaveLength(14);
      expect(daysFromInvalidDate[0].isToday).toBe(true);
    });

    it('TASK-P37-03-ZAK: sanityzuje parametry receptury sesji w buildProactiveActionSchedule', () => {
      const corruptSession: any = {
        id: 'sess-corrupt',
        recipeId: 'rec-test',
        method: 'Chemex',
        recipeName: 'Chemex Classic',
        rating: 5,
        doseGrams: 'NaN',
        waterGrams: -0,
        waterTempCelsius: null,
      };

      const schedule = buildProactiveActionSchedule('', [], [corruptSession]);
      expect(schedule).toHaveLength(1);
      const action = schedule[0];
      expect(action.doseGrams).toBe(15);
      expect(action.waterGrams).toBe(250);
      expect(action.waterTempCelsius).toBe(93);
      expect(Object.is(action.doseGrams, -0)).toBe(false);
      expect(Object.is(action.waterGrams, -0)).toBe(false);
      expect(Object.is(action.waterTempCelsius, -0)).toBe(false);
      expect(action.subtitlePl).toBe('15g / 250g · 93°C');
    });

    it('TASK-P38-03-ZAK: wczesne wyjscie dla pustych ciagow i ochrona przed -0 w parseStepDurationSeconds', () => {
      expect(parseStepDurationSeconds('   ', 45)).toBe(45);
      expect(parseStepDurationSeconds('', 60)).toBe(60);
      expect(parseStepDurationSeconds('odczekaj 0 s', 30)).toBe(30);
      const res = parseStepDurationSeconds('odczekaj 40 sekund', 30);
      expect(res).toBe(40);
      expect(Object.is(res, -0)).toBe(false);
    });
  });
});
