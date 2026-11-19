import { parseStepDurationSeconds } from '../bpr-engine';

describe('BPR Engine — Zero-Click Duration Parser', () => {
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

    it('TASK-P48-03-ZAK: parseStepDurationSeconds obsluguje zlozone jednostki minut i sekund', () => {
      expect(parseStepDurationSeconds('Zaparzaj przez 1 min 30 sek pod przykryciem', 30)).toBe(90);
      expect(parseStepDurationSeconds('Odczekaj 2 minuty i 15 sekund', 30)).toBe(135);
      expect(parseStepDurationSeconds('Steep for 1 min 45 s', 30)).toBe(105);
    });

    it('TASK-P50-03-ZAK: parseStepDurationSeconds wspiera przecinek w fallbackSeconds', () => {
      expect(parseStepDurationSeconds('brak czasu w opisie', '45,5')).toBe(46);
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

    it('TASK-P54-03-ZAK: parseStepDurationSeconds parsuje godziny (pojedyncze, zakresy, złożone i naturalne) dla Cold Brew z clampem do 86400', () => {
      expect(parseStepDurationSeconds('Maceruj przez pół godziny w temperaturze pokojowej')).toBe(1800);
      expect(parseStepDurationSeconds('Steep for half an hour on the counter')).toBe(1800);
      expect(parseStepDurationSeconds('Zostaw na półtorej godziny')).toBe(5400);
      expect(parseStepDurationSeconds('Infuse for one and a half hours')).toBe(5400);

      expect(parseStepDurationSeconds('Maceruj w lodówce przez 12 godzin')).toBe(43200);
      expect(parseStepDurationSeconds('Parz przez 8 godz.')).toBe(28800);
      expect(parseStepDurationSeconds('Steep for 10 hours')).toBe(36000);
      expect(parseStepDurationSeconds('Cold brew 12 hrs')).toBe(43200);
      expect(parseStepDurationSeconds('Ekstrakcja 1.5 godz.')).toBe(5400);

      expect(parseStepDurationSeconds('Zostaw na 12-16 godzin')).toBe(43200);
      expect(parseStepDurationSeconds('Steep for 8 to 12 hours')).toBe(28800);

      expect(parseStepDurationSeconds('1 godzina i 30 minut powolnej maceracji')).toBe(5400);
      expect(parseStepDurationSeconds('1 hr 15 mins cold immersion')).toBe(4500);

      expect(parseStepDurationSeconds('Ekstrakcja przez 36 godzin')).toBe(86400);
    });

    it('TASK-P58-11-WZR: bpr-engine obsluguje notacje minutowa m, BOM i bezpiecznie chroni przed blednymi parametrami', () => {
      expect(parseStepDurationSeconds('Odczekaj 2m 30s przed nastepnym zalaniem')).toBe(150);
      expect(parseStepDurationSeconds('Zaparzaj przez 1m 45s')).toBe(105);
      expect(parseStepDurationSeconds('Czas ekstrakcji 2m30s')).toBe(150);
      expect(parseStepDurationSeconds('Odczekaj 2m')).toBe(120);
      expect(parseStepDurationSeconds('\uFEFFPreinfuzja przez 45s')).toBe(45);
    });
  });
});
