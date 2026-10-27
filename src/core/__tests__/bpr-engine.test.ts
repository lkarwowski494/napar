import {
  parseStepDurationSeconds,
  parseSteepIncrementSeconds,
  calculateNextSteepDuration,
  calculateCoffeeFreshness,
  CoffeeFreshnessStatus,
  filterProactiveActions,
  findNextRecommendedAction,
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

    it('TASK-P39-03-ZAK: escapeIcsText defensywnie odrzuca typy nienapisowe (null, undefined, number, object)', () => {
      expect(escapeIcsText(null as any)).toBe('');
      expect(escapeIcsText(undefined as any)).toBe('');
      expect(escapeIcsText(12345 as any)).toBe('');
      expect(escapeIcsText({} as any)).toBe('');
      expect(escapeIcsText([] as any)).toBe('');
      expect(escapeIcsText(true as any)).toBe('');
    });

    it('TASK-P40-03-ZAK: generateActionIcsContent uzywa biezacej daty UTC ISO jako dynamicznego fallbacku', () => {
      const todayIso = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const actionWithoutDate: any = {
        id: 'action-fallback-date',
        titlePl: 'Sesja dzisiejsza',
        dateIso: '',
      };
      const ics = generateActionIcsContent(actionWithoutDate, 'pl');
      expect(ics).toContain(`DTSTART:${todayIso}T080000Z`);
      expect(ics).toContain(`DTEND:${todayIso}T081500Z`);
    });

    it('TASK-P41-03-ZAK: buildProactiveActionSchedule rozpoznaje sesje herbaty (beverageType/method) stosujac styl success i Gaiwan', () => {
      const teaSession: any = {
        id: 'sess-tea-repeat',
        recipeId: 'rec-sencha',
        recipeName: 'Sencha Asamushi',
        beverageType: 'tea', // lowercase
        method: 'Kyusu',
        rating: 5,
        doseGrams: 5,
        waterGrams: 150,
        waterTempCelsius: 75,
      };
      const schedule = buildProactiveActionSchedule('', [], [teaSession]);
      expect(schedule).toHaveLength(1);
      const action = schedule[0];
      expect(action.badgeColor).toBe('success');
      expect(action.titlePl).toContain('Powtórz udany napar herbaty');
      expect(action.recommendedMethod).toBe('Kyusu');
    });

    it('TASK-P42-03-ZAK: generateActionIcsContent normalizuje wielkosc liter jezyka i wspiera warianty regionalne en-US', () => {
      const action: any = {
        id: 'action-lang-test',
        titlePl: 'Parzenie V60',
        titleEn: 'V60 Brew Session',
        subtitlePl: 'Doza 15g, woda 250g',
        subtitleEn: 'Dose 15g, water 250g',
        dateIso: '2026-11-01',
      };
      // Wielkie litery 'EN'
      const icsUpperEn = generateActionIcsContent(action, 'EN' as any);
      expect(icsUpperEn).toContain('SUMMARY:V60 Brew Session');
      expect(icsUpperEn).toContain('DESCRIPTION:Dose 15g\\, water 250g');
      expect(icsUpperEn).toContain('//EN');

      // Wariant regionalny 'en-US'
      const icsRegionalEn = generateActionIcsContent(action, 'en-US' as any);
      expect(icsRegionalEn).toContain('SUMMARY:V60 Brew Session');
      expect(icsRegionalEn).toContain('//EN');

      // Nieznany / fallback pl
      const icsFallback = generateActionIcsContent(action, 'de' as any);
      expect(icsFallback).toContain('SUMMARY:Parzenie V60');
      expect(icsFallback).toContain('//PL');
    });

    it('TASK-P43-03-ZAK: generateActionIcsContent generuje RFC 5545 DTSTAMP z biezacym czasem UTC oraz sanityzuje wagi string w inventory', () => {
      const action: any = {
        id: 'action-dtstamp-test',
        titlePl: 'Parzenie V60',
        dateIso: '2026-12-01',
      };
      const ics = generateActionIcsContent(action, 'pl');
      expect(ics).toMatch(/DTSTAMP:\d{8}T\d{6}Z/);
      expect(ics).toContain('DTSTART:20261201T080000Z');

      // Sanityzacja wag string w inventory
      const stringWeightInventory: any[] = [
        {
          id: 'bean-str-weight',
          name: 'Kenya Nyeri',
          type: 'coffee',
          roastOrHarvestDate: '2026-10-15',
          remainingWeightGrams: '250',
          isArchived: false,
        },
      ];
      const schedule = buildProactiveActionSchedule('2026-10-26T08:00:00.000Z', stringWeightInventory as any, []);
      expect(schedule.length).toBeGreaterThan(0);
      expect(schedule[0].subtitlePl).toContain('250g');
      expect(schedule[0].doseGrams).toBe(18);
    });

    it('TASK-P44-03-ZAK: parseStepDurationSeconds poprawnie rozpoznaje formy mins, secs, odmiany fleksyjne minut/sekund', () => {
      expect(parseStepDurationSeconds('wait 2 mins', 30)).toBe(120);
      expect(parseStepDurationSeconds('steep for 3 to 4 mins', 30)).toBe(180);
      expect(parseStepDurationSeconds('pause for 45 secs', 30)).toBe(45);
      expect(parseStepDurationSeconds('wait 15-20 secs', 30)).toBe(15);
      expect(parseStepDurationSeconds('w 5 minutach zalej', 30)).toBe(300);
      expect(parseStepDurationSeconds('w 10 sekundach zakoncz', 30)).toBe(10);
    });

    it('TASK-P45-03-ZAK: generateActionIcsContent weryfikuje poprawnosc daty kalendarzowej a buildProactiveActionSchedule obsluguje kawe bez daty wypalu', () => {
      const invalidDateAction: any = {
        id: 'action-invalid-cal',
        titlePl: 'Sesja V60',
        dateIso: '2026-99-99',
      };
      const ics = generateActionIcsContent(invalidDateAction, 'pl');
      expect(ics).toMatch(/DTSTART:\d{8}T080000Z/);
      expect(ics).not.toContain('20269999');

      const noRoastInventory: any[] = [
        {
          id: 'coffee-no-roast-date',
          name: 'Panama Geisha',
          type: 'coffee',
          remainingWeightGrams: 100,
          isArchived: false,
        },
      ];
      const schedule = buildProactiveActionSchedule('2026-10-26T08:00:00.000Z', noRoastInventory as any, []);
      expect(schedule.length).toBe(1);
      expect(schedule[0].titlePl).toContain('Panama Geisha');
      expect(schedule[0].daysOffset).toBe(0);
    });

    it('TASK-P46-03-ZAK: buildProactiveActionSchedule odporne na date wypalu z przyszlosci (brak ujemnych dni)', () => {
      const futureRoastInventory: any[] = [
        {
          id: 'coffee-future-roast',
          name: 'Future Roast Coffee',
          type: 'coffee',
          roastOrHarvestDate: '2026-10-30', // 4 dni w przyszłości względem 2026-10-26
          remainingWeightGrams: 200,
          isArchived: false,
        },
      ];
      const schedule = buildProactiveActionSchedule('2026-10-26T08:00:00.000Z', futureRoastInventory as any, []);
      expect(schedule.length).toBe(1);
      expect(schedule[0].subtitlePl).toContain('Koniec odgazowania CO₂');
      expect(schedule[0].subtitlePl).not.toContain('-');
      expect(schedule[0].daysOffset).toBe(7); // 7 dni do otwarcia okna peak
    });

    it('TASK-P47-03-ZAK: escapeIcsText filtruje niedozwolone znaki kontrolne RFC 5545', () => {
      // Znaki kontrolne ASCII (np. \x00, \x08, \x0b, \x1f)
      const inputWithControls = 'Cold\x00 Brew\x08 Special\x1F Session\r\nNotes';
      const escaped = escapeIcsText(inputWithControls);
      expect(escaped).toBe('Cold Brew Special Session\\nNotes');
      expect(escaped).not.toContain('\x00');
      expect(escaped).not.toContain('\x08');
      expect(escaped).not.toContain('\x1F');
    });

    it('TASK-P48-03-ZAK: parseStepDurationSeconds obsluguje zlozone jednostki minut i sekund oraz ignoruje paczki z 0g w spiżarni', () => {
      // 1. Złożone minuty i sekundy
      expect(parseStepDurationSeconds('Zaparzaj przez 1 min 30 sek pod przykryciem', 30)).toBe(90);
      expect(parseStepDurationSeconds('Odczekaj 2 minuty i 15 sekund', 30)).toBe(135);
      expect(parseStepDurationSeconds('Steep for 1 min 45 s', 30)).toBe(105);

      // 2. Paczka z zerową wagą pozostałą (remainingWeightGrams <= 0) jest ignorowana
      const emptyBagInventory: any[] = [
        {
          id: 'coffee-empty',
          name: 'Pusta paczka',
          type: 'coffee',
          roastOrHarvestDate: '2026-10-15',
          remainingWeightGrams: 0,
          isArchived: false,
        },
      ];
      const schedule = buildProactiveActionSchedule('2026-10-26T08:00:00.000Z', emptyBagInventory as any, []);
      // Powinno pominąć pustą paczkę i wygenerować domyślną kalibrację zamiast akcji dla 0g
      expect(schedule.some((act) => act.inventoryItemId === 'coffee-empty')).toBe(false);
      expect(schedule[0].id).toBe('action-default-calibration');
    });

    it('TASK-P49-03-ZAK: buildProactiveActionSchedule case-insensitively obsluguje type coffee i tea (np. COFFEE, TEA, Tea)', () => {
      const mixedTypeInventory: any[] = [
        {
          id: 'coffee-upper',
          name: 'Kenya Nyeri Peaberry',
          type: 'COFFEE',
          roastOrHarvestDate: '2026-10-15',
          remainingWeightGrams: 200,
          isArchived: false,
        },
        {
          id: 'tea-mixed',
          name: 'Gyokuro Uji',
          type: 'Tea',
          remainingWeightGrams: 50,
          isArchived: false,
        },
      ];
      const schedule = buildProactiveActionSchedule('2026-10-26T08:00:00.000Z', mixedTypeInventory as any, []);
      expect(schedule.some((act) => act.inventoryItemId === 'coffee-upper')).toBe(true);
      expect(schedule.some((act) => act.inventoryItemId === 'tea-mixed')).toBe(true);
    });

    it('TASK-P50-03-ZAK: parseStepDurationSeconds wspiera przecinek w fallbackSeconds a generateActionIcsContent bezpiecznie obsluguje nie-stringowe tytuly', () => {
      // 1. Przecinek dziesiętny w fallbackSeconds
      expect(parseStepDurationSeconds('brak czasu w opisie', '45,5')).toBe(46);

      // 2. Nie-stringowe tytuły w generateActionIcsContent
      const nonStringAction: any = {
        id: 'action-non-string',
        titlePl: 12345,
        subtitlePl: null,
        dateIso: '2026-11-15',
      };
      const ics = generateActionIcsContent(nonStringAction, 'pl');
      expect(ics).toContain('SUMMARY:Sesja parzenia Napar');
      expect(ics).toContain('DTSTART:20261115T080000Z');

      const nonStringActionEn: any = {
        id: 'action-non-string-en',
        titleEn: undefined,
        titlePl: null,
        dateIso: '2026-11-15',
      };
      const icsEn = generateActionIcsContent(nonStringActionEn, 'en');
      expect(icsEn).toContain('SUMMARY:Napar Brew Session');
    });

    it('TASK-P51-03-ZAK: parseStepDurationSeconds parsuje ulamkowe i naturalne wyrazania czasu (pol minuty, poltorej minuty, half a minute, 1/2 min)', () => {
      expect(parseStepDurationSeconds('Odczekaj pół minuty po preinfuzji')).toBe(30);
      expect(parseStepDurationSeconds('odczekaj pol minuty')).toBe(30);
      expect(parseStepDurationSeconds('wait half a minute')).toBe(30);
      expect(parseStepDurationSeconds('parz przez 1/2 minuty')).toBe(30);
      expect(parseStepDurationSeconds('maceruj przez półtorej minuty')).toBe(90);
      expect(parseStepDurationSeconds('parz poltorej minuty')).toBe(90);
      expect(parseStepDurationSeconds('infuse for 1.5 min')).toBe(90);
      expect(parseStepDurationSeconds('odczekaj kwadrans na ostygnięcie')).toBe(900);
    });

    it('TASK-P52-03-ZAK: parseSteepIncrementSeconds i calculateNextSteepDuration obsluguja inkrementacje wielokrotnych parzen', () => {
      // 1. Ekstrakcja inkrementu z tekstu
      expect(parseSteepIncrementSeconds('Dodaj 5s do każdego kolejnego zalania')).toBe(5);
      expect(parseSteepIncrementSeconds('+10s per steep')).toBe(10);
      expect(parseSteepIncrementSeconds('Zwiększ o 15 sekund przy każdym parzeniu')).toBe(15);
      expect(parseSteepIncrementSeconds('kolejne parzenie + 20 s')).toBe(20);
      expect(parseSteepIncrementSeconds('brak informacji', 5)).toBe(5);

      // 2. Kalkulacja kolejnego czasu parzenia
      expect(calculateNextSteepDuration({ baseDurationSeconds: 15, infusionNumber: 1, incrementSeconds: 5 })).toBe(15);
      expect(calculateNextSteepDuration({ baseDurationSeconds: 15, infusionNumber: 2, incrementSeconds: 5 })).toBe(20);
      expect(calculateNextSteepDuration({ baseDurationSeconds: 15, infusionNumber: 4, incrementSeconds: 5 })).toBe(30);
      expect(calculateNextSteepDuration({ baseDurationSeconds: '20,5' as any, infusionNumber: 3, incrementSeconds: '5,5' as any })).toBe(32);
      expect(calculateNextSteepDuration({ baseDurationSeconds: 10, infusionNumber: 0 })).toBe(10);
    });

    it('TASK-P53-03-ZAK: calculateRoastDegassingWindow i buildProactiveActionSchedule uwzgledniaja profil palenia (dark vs light vs medium)', () => {
      // @ts-ignore
      const { calculateRoastDegassingWindow } = require('../bpr-engine');

      // 1. Sprawdzenie okien odgazowania wg profilu palenia
      expect(calculateRoastDegassingWindow('dark')).toEqual({ degassingDays: 5, peakEndDays: 25 });
      expect(calculateRoastDegassingWindow('ciemny')).toEqual({ degassingDays: 5, peakEndDays: 25 });
      expect(calculateRoastDegassingWindow('espresso')).toEqual({ degassingDays: 5, peakEndDays: 25 });

      expect(calculateRoastDegassingWindow('light')).toEqual({ degassingDays: 10, peakEndDays: 45 });
      expect(calculateRoastDegassingWindow('nordic')).toEqual({ degassingDays: 10, peakEndDays: 45 });
      expect(calculateRoastDegassingWindow('jasny')).toEqual({ degassingDays: 10, peakEndDays: 45 });

      expect(calculateRoastDegassingWindow('medium')).toEqual({ degassingDays: 7, peakEndDays: 35 });
      expect(calculateRoastDegassingWindow(undefined)).toEqual({ degassingDays: 7, peakEndDays: 35 });

      // 2. Weryfikacja harmonogramu dla ziaren light roast (wypalonych 6 dni temu - wciąz odgazowują!)
      const testInventory: any[] = [
        {
          id: 'coffee-light',
          name: 'Panama Geisha Light',
          type: 'coffee',
          roastProfile: 'light',
          roastOrHarvestDate: '2026-10-20', // 6 dni temu w stosunku do 2026-10-26
          remainingWeightGrams: 200,
          isArchived: false,
        },
        {
          id: 'coffee-dark',
          name: 'Brazil Santos Espresso',
          type: 'coffee',
          roastProfile: 'dark',
          roastOrHarvestDate: '2026-10-20', // 6 dni temu -> dla dark to już Peak (dzień 5 był końcem odgazowania)!
          remainingWeightGrams: 250,
          isArchived: false,
        },
      ];

      const schedule = buildProactiveActionSchedule('2026-10-26T08:00:00.000Z', testInventory, []);

      // coffee-light powinien mieć akcję oczekiwania na Peak (10 - 6 = za 4 dni)
      const lightAction = schedule.find((a) => a.inventoryItemId === 'coffee-light');
      expect(lightAction).toBeDefined();
      expect(lightAction?.id).toBe('action-peak-start-coffee-light');
      expect(lightAction?.daysOffset).toBe(4);
      expect(lightAction?.subtitlePl).toContain('10. dzień po wypale');

      // coffee-dark powinien mieć akcję szczytu Peak na DZIŚ (ponieważ 6 dni >= 5 dni odgazowania)
      const darkAction = schedule.find((a) => a.inventoryItemId === 'coffee-dark');
      expect(darkAction).toBeDefined();
      expect(darkAction?.id).toBe('action-peak-now-coffee-dark');
      expect(darkAction?.daysOffset).toBe(0);
    });

    it('TASK-P54-03-ZAK: parseStepDurationSeconds parsuje godziny (pojedyncze, zakresy, złożone i naturalne) dla Cold Brew z clampem do 86400', () => {
      // 1. Naturalne wyrażenia godzinowe
      expect(parseStepDurationSeconds('Maceruj przez pół godziny w temperaturze pokojowej')).toBe(1800);
      expect(parseStepDurationSeconds('Steep for half an hour on the counter')).toBe(1800);
      expect(parseStepDurationSeconds('Zostaw na półtorej godziny')).toBe(5400);
      expect(parseStepDurationSeconds('Infuse for one and a half hours')).toBe(5400);

      // 2. Pojedyncze godziny
      expect(parseStepDurationSeconds('Maceruj w lodówce przez 12 godzin')).toBe(43200);
      expect(parseStepDurationSeconds('Parz przez 8 godz.')).toBe(28800);
      expect(parseStepDurationSeconds('Steep for 10 hours')).toBe(36000);
      expect(parseStepDurationSeconds('Cold brew 12 hrs')).toBe(43200);
      expect(parseStepDurationSeconds('Ekstrakcja 1.5 godz.')).toBe(5400);

      // 3. Zakres godzin (dolna granica)
      expect(parseStepDurationSeconds('Zostaw na 12-16 godzin')).toBe(43200);
      expect(parseStepDurationSeconds('Steep for 8 to 12 hours')).toBe(28800);

      // 4. Złożone godziny i minuty
      expect(parseStepDurationSeconds('1 godzina i 30 minut powolnej maceracji')).toBe(5400);
      expect(parseStepDurationSeconds('1 hr 15 mins cold immersion')).toBe(4500);

      // 5. Clampowanie do 86400 dla ekstrakcji powyżej 24 godzin
      expect(parseStepDurationSeconds('Ekstrakcja przez 36 godzin')).toBe(86400);
    });

    it('TASK-P58-11-WZR: bpr-engine obsluguje notacje minutowa m, BOM i bezpiecznie chroni przed blednymi parametrami', () => {
      // 1. Notacja m w parowaniu czasu
      expect(parseStepDurationSeconds('Odczekaj 2m 30s przed nastepnym zalaniem')).toBe(150);
      expect(parseStepDurationSeconds('Zaparzaj przez 1m 45s')).toBe(105);
      expect(parseStepDurationSeconds('Czas ekstrakcji 2m30s')).toBe(150);
      expect(parseStepDurationSeconds('Odczekaj 2m')).toBe(120);
      expect(parseStepDurationSeconds('\uFEFFPreinfuzja przez 45s')).toBe(45);

      // 2. calculateNextSteepDuration z pustymi/nieprawidłowymi parametrami
      expect(calculateNextSteepDuration(undefined as any)).toBe(15);
      expect(calculateNextSteepDuration(null as any)).toBe(15);
      expect(calculateNextSteepDuration({ baseDurationSeconds: -0, infusionNumber: 1 })).toBe(15);

      // 3. calculateRoastDegassingWindow z BOM i typami niebędącymi stringami
      const { calculateRoastDegassingWindow } = require('../bpr-engine');
      expect(calculateRoastDegassingWindow('\uFEFFlight')).toEqual({ degassingDays: 10, peakEndDays: 45 });
      expect(calculateRoastDegassingWindow('\uFEFFdark')).toEqual({ degassingDays: 5, peakEndDays: 25 });
      expect(calculateRoastDegassingWindow(12345 as any)).toEqual({ degassingDays: 7, peakEndDays: 35 });

      // 4. escapeIcsText z BOM
      expect(escapeIcsText('\uFEFFTest\\;,\n')).toBe('Test\\\\\\;\\,\\n');
    });

    it('TASK-P60-11-WZR: calculateRoastDegassingWindow obsluguje profile vienna/spanish, cinnamon/ultra-light oraz city', () => {
      const { calculateRoastDegassingWindow } = require('../bpr-engine');
      // Bardzo ciemny / vienna
      expect(calculateRoastDegassingWindow('vienna roast')).toEqual({ degassingDays: 3, peakEndDays: 18 });
      expect(calculateRoastDegassingWindow('wiedeński')).toEqual({ degassingDays: 3, peakEndDays: 18 });
      expect(calculateRoastDegassingWindow('extra dark')).toEqual({ degassingDays: 3, peakEndDays: 18 });

      // Bardzo jasny / cinnamon / ultra-light
      expect(calculateRoastDegassingWindow('cinnamon')).toEqual({ degassingDays: 14, peakEndDays: 55 });
      expect(calculateRoastDegassingWindow('ultra light')).toEqual({ degassingDays: 14, peakEndDays: 55 });

      // City / Filter / Nordic
      expect(calculateRoastDegassingWindow('city roast')).toEqual({ degassingDays: 10, peakEndDays: 45 });
    });

    it('TASK-P60-11-WZR: buildProactiveActionSchedule i buildFourteenDayCalendar chronia przed obiektami niebedacymi tablicami', () => {
      const schedule = buildProactiveActionSchedule('invalid-date', {} as any, null as any);
      expect(Array.isArray(schedule)).toBe(true);
      expect(schedule.length).toBeGreaterThan(0);

      const calendar = buildFourteenDayCalendar('invalid-date', null as any, {} as any);
      expect(Array.isArray(calendar)).toBe(true);
      expect(calendar.length).toBe(14);
    });

    it('TASK-P63-11-WZR: calculateCoffeeFreshness poprawnie wyznacza status swiezosci kawy', () => {
      const refDate = new Date('2026-10-27T12:00:00.000Z');

      // 1. Brak daty lub nieprawidłowa data -> 'unknown'
      expect(calculateCoffeeFreshness(null).status).toBe('unknown');
      expect(calculateCoffeeFreshness(undefined).status).toBe('unknown');
      expect(calculateCoffeeFreshness('invalid-date').status).toBe('unknown');
      expect(calculateCoffeeFreshness('').status).toBe('unknown');

      // 2. Data w przyszłości lub zbyt świeża (odpoczynek: np. 2 dni po paleniu dla filtra 10 dni) -> 'too_fresh'
      const fresh2Days = calculateCoffeeFreshness('2026-10-25T12:00:00.000Z', 'light filter', refDate);
      const expectedStatus: CoffeeFreshnessStatus = fresh2Days.status;
      expect(expectedStatus).toBe('too_fresh');
      expect(fresh2Days.daysSinceRoast).toBe(2);
      expect(fresh2Days.degassingDays).toBe(10);
      expect(fresh2Days.messagePl).toContain('odpoczywa');

      // 3. W oknie szczytowym (np. 15 dni po paleniu dla filtra, okno 10-45 dni) -> 'peak'
      const peak = calculateCoffeeFreshness('2026-10-12T12:00:00.000Z', 'light filter', refDate);
      expect(peak.status).toBe('peak');
      expect(peak.daysSinceRoast).toBe(15);
      expect(peak.messagePl).toContain('Szczyt');
      expect(peak.messageEn).toContain('Peak');

      // 4. Po szczycie (np. 50 dni po paleniu dla filtra, peakEndDays 45, do 75 dni) -> 'past_peak'
      const pastPeak = calculateCoffeeFreshness('2026-09-07T12:00:00.000Z', 'light filter', refDate);
      expect(pastPeak.status).toBe('past_peak');
      expect(pastPeak.daysSinceRoast).toBe(50);

      // 5. Zestarzała (np. 90 dni po paleniu) -> 'expired'
      const expired = calculateCoffeeFreshness('2026-07-20T12:00:00.000Z', 'light filter', refDate);
      expect(expired.status).toBe('expired');
      expect(expired.messagePl).toContain('Zestarzała');
      expect(expired.messageEn).toContain('Aged');
    });

    it('TASK-P66-04-SZT: filterProactiveActions i findNextRecommendedAction selekcjonuja akcje kalendarza', () => {
      const actions = [
        { id: 'act-past', dateIso: '2026-10-25', daysOffset: -2, titlePl: 'Przeszła', titleEn: 'Past' },
        { id: 'act-today-1', dateIso: '2026-10-27', daysOffset: 0, titlePl: 'Poranny V60', titleEn: 'Morning V60' },
        { id: 'act-today-2', dateIso: '2026-10-27', daysOffset: 0, titlePl: 'Popołudniowy Gaiwan', titleEn: 'Afternoon Gaiwan' },
        { id: 'act-up-1', dateIso: '2026-10-28', daysOffset: 1, titlePl: 'Szczyt smaku Kenia', titleEn: 'Peak Flavor Kenya' },
        { id: 'act-up-2', dateIso: '2026-10-30', daysOffset: 3, titlePl: 'Otwórz Geishę', titleEn: 'Open Geisha' },
      ] as any[];

      // 1. filterProactiveActions('today')
      const today = filterProactiveActions(actions, 'today');
      expect(today.length).toBe(2);
      expect(today[0].id).toBe('act-today-1');

      // 2. filterProactiveActions('upcoming')
      const upcoming = filterProactiveActions(actions, 'upcoming');
      expect(upcoming.length).toBe(2);
      expect(upcoming[0].id).toBe('act-up-1');
      expect(upcoming[1].id).toBe('act-up-2');

      // 3. filterProactiveActions('all')
      const allActive = filterProactiveActions(actions, 'all');
      expect(allActive.length).toBe(4); // pomija przeszłe (< 0)

      // 4. findNextRecommendedAction (priorytetyzuje dzisiejszą akcję)
      const nextToday = findNextRecommendedAction(actions);
      expect(nextToday?.id).toBe('act-today-1');

      // 5. findNextRecommendedAction gdy brak dzisiejszych -> zwraca najbliższą nadchodzącą
      const nextUpcomingOnly = findNextRecommendedAction([
        { id: 'act-up-1', dateIso: '2026-10-28', daysOffset: 1, titlePl: 'Jutro', titleEn: 'Tomorrow' },
      ] as any[]);
      expect(nextUpcomingOnly?.id).toBe('act-up-1');

      // 6. Odporność na null/undefined/pustą tablicę
      expect(filterProactiveActions(null)).toEqual([]);
      expect(findNextRecommendedAction(null)).toBeNull();
      expect(findNextRecommendedAction([])).toBeNull();
    });
  });
});
