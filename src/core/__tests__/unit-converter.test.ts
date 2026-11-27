// ============================================================================
// Napar — Unit Tests: Unit Converter (Metric / Imperial)
// ============================================================================

import {
  celsiusToFahrenheit,

  gramsToOunces,
  ouncesToGrams,
  mlToFluidOunces,

  formatTemperature,
  formatDoseWeight,
  formatWaterWeight,

  wInKeep,
  roundTo,
} from '../unit-converter';

describe('Unit Converter (DEC-21 Metric / Imperial)', () => {
  test('Przelicza temperaturę °C <-> °F', () => {
    // 93°C -> ok. 199°F
    expect(celsiusToFahrenheit(93)).toBe(199);
    expect(celsiusToFahrenheit(100)).toBe(212);
    expect(celsiusToFahrenheit(0)).toBe(32);
  });

  test('Przelicza wagę suchą gramy <-> uncje (oz)', () => {
    // 15g -> 0.53 oz
    expect(gramsToOunces(15)).toBe(0.53);
    expect(gramsToOunces(28.35)).toBe(1.0);
    expect(ouncesToGrams(1.0)).toBe(28);
    expect(ouncesToGrams(0.53)).toBe(15);
  });

  test('Przelicza objętość wody ml <-> fl oz', () => {
    // 250 ml -> 8.45 fl oz
    expect(mlToFluidOunces(250)).toBe(8.45);
  });

  test('formatTemperature formatuje poprawnie w obu systemach', () => {
    expect(formatTemperature(93, 'metric')).toBe('93°C');
    expect(formatTemperature(93, 'imperial')).toBe('199°F');
  });

  test('formatDoseWeight formatuje wagę dozy surowca', () => {
    expect(formatDoseWeight(18, 'metric')).toBe('18g');
    expect(formatDoseWeight(18, 'imperial')).toBe('0.63 oz');
  });

  test('formatWaterWeight formatuje wagę/objętość wody', () => {
    expect(formatWaterWeight(300, 'metric')).toBe('300g');
    expect(formatWaterWeight(300, 'imperial')).toBe('10.14 fl oz');
    expect(formatDoseWeight(15.33333333, 'metric')).toBe('15.3g');
    expect(formatWaterWeight(249.9999999, 'metric')).toBe('250g');
  });

  test('Formatters używają metrycznych jednostek jako domyślnych parametrów', () => {
    expect(formatTemperature(93)).toBe('93°C');
    expect(formatDoseWeight(18)).toBe('18g');
    expect(formatWaterWeight(300)).toBe('300g');
  });

  describe('RD-ENG-01 & BR-TEST-005: wInKeep (Konwersja bez dryfu zaokrągleń)', () => {
    test('Wektory testowe z dokumentu BRD (RD-ENG-01)', () => {
      // • wInKeep("135", "lb", 61.23) -> 61.23 (brak dryfu na 61.25)
      expect(wInKeep('135', 'lb', 61.23)).toBe(61.23);

      // • wInKeep("135,0", "lb", 61.23) -> 61.23
      expect(wInKeep('135,0', 'lb', 61.23)).toBe(61.23);

      // • wInKeep("140", "lb", 61.23) -> 63.5
      expect(wInKeep('140', 'lb', 61.23)).toBe(63.5);

      // • wInKeep("80,5", "kg", 80) -> 80.5
      expect(wInKeep('80,5', 'kg', 80)).toBe(80.5);
    });

    test('Jednostki kawowe: gramy <-> uncje (oz)', () => {
      // 15.0 g = 0.53 oz. Użytkownik widzi 0.5 oz po zaokrągleniu i zatwierdza bez zmian
      expect(wInKeep('0.5', 'oz', 15.0)).toBe(15.0);
      expect(wInKeep('0,5', 'oz', 15.0)).toBe(15.0);

      // Nowa wartość wpisana: 1.0 oz
      expect(wInKeep('1.0', 'oz', 15.0)).toBe(28.35);
      expect(wInKeep('135', 'lbs', 61.23)).toBe(61.23);
    });

    test('Jednostki wody: ml/g <-> fl oz', () => {
      // 250 g wody = 8.5 fl oz. Użytkownik zatwierdza 8.5
      expect(wInKeep('8.5', 'fl oz', 250)).toBe(250);
      expect(wInKeep('8,5', 'fl oz', 250)).toBe(250);
      expect(wInKeep('8.5', 'floz', 250)).toBe(250);

      // Nowa wartość: 10 fl oz
      expect(wInKeep('10', 'fl oz', 250)).toBe(295.74);
    });

    test('Temperatura: °C <-> °F', () => {
      // 93°C = 199.4°F -> 199.4°F. Wpisane 199.4
      expect(wInKeep('199.4', '°F', 93)).toBe(93);
      expect(wInKeep('199,4', '°F', 93)).toBe(93);

      // Nowa temperatura: 205°F
      expect(wInKeep('205', '°F', 93)).toBe(96.11);
      // Bez prevBase
      expect(wInKeep('212', '°F')).toBe(100);
    });

    test('Obsługa wartości brzegowych: pusty ciąg, NaN, brak prevBase', () => {
      expect(wInKeep('', 'g', 15)).toBe(15);
      expect(wInKeep('   ', 'g', 15)).toBe(15);
      expect(wInKeep('abc', 'g', 15)).toBe(15);
      expect(wInKeep('15', 'g')).toBe(15);
      expect(wInKeep('20,5', 'g')).toBe(20.5);
    });

    test('Gongfu 7.0 g z uncjami (0.25 oz) zachowuje 7.0 g bez mnożenia przez 28.35x (M1-audytor-generalny-004)', () => {
      const baseLeaf = 7.0;
      const displayedOz = String(gramsToOunces(baseLeaf)); // '0.25'
      expect(displayedOz).toBe('0.25');
      const preservedGrams = wInKeep(displayedOz, 'oz', baseLeaf);
      expect(preservedGrams).toBe(7.0);

      const baseVessel = 100;
      const displayedFlOz = String(mlToFluidOunces(baseVessel)); // '3.38'
      const preservedMl = wInKeep(displayedFlOz, 'fl oz', baseVessel);
      expect(preservedMl).toBe(100);
    });

    test('Inwariant 100 cykli otwarcia i zapisu formularza bez dryfu', () => {
      let baseVal = 15.0; // 15g kawy
      for (let i = 0; i < 100; i++) {
        const displayedOz = String(roundTo(baseVal * 0.03527396195, 1));
        baseVal = wInKeep(displayedOz, 'oz', baseVal);
      }
      expect(baseVal).toBe(15.0);
    });

    test('TASK-P6-03-ZAK: Odporność na wartości ujemne, NaN i Infinity', () => {
      expect(gramsToOunces(-10)).toBe(0);
      expect(gramsToOunces(NaN)).toBe(0);
      expect(gramsToOunces(Infinity)).toBe(0);

      expect(ouncesToGrams(-5)).toBe(0);
      expect(ouncesToGrams(NaN)).toBe(0);
      expect(ouncesToGrams(Infinity)).toBe(0);

      expect(mlToFluidOunces(-100)).toBe(0);
      expect(mlToFluidOunces(NaN)).toBe(0);
      expect(mlToFluidOunces(Infinity)).toBe(0);

      expect(celsiusToFahrenheit(NaN)).toBe(0);
    });

    test('TASK-P10-03-ZAK: formatTemperature, formatDoseWeight, formatWaterWeight i roundTo są odporne na NaN/Infinity', () => {
      expect(formatTemperature(NaN, 'metric')).toBe('0°C');
      expect(formatTemperature(NaN, 'imperial')).toBe('32°F');
      expect(formatTemperature(-Infinity, 'metric')).toBe('0°C');

      expect(formatDoseWeight(NaN, 'metric')).toBe('0g');
      expect(formatDoseWeight(-10, 'metric')).toBe('0g');
      expect(formatDoseWeight(NaN, 'imperial')).toBe('0 oz');

      expect(formatWaterWeight(NaN, 'metric')).toBe('0g');
      expect(formatWaterWeight(-50, 'metric')).toBe('0g');
      expect(formatWaterWeight(NaN, 'imperial')).toBe('0 fl oz');

      expect(roundTo(NaN, 2)).toBe(0);
      expect(roundTo(Infinity, 2)).toBe(0);
    });

    test('TASK-P11-03-ZAK: wInKeep jest odporne na brakujący unit oraz NaN w prevBase', () => {
      expect(wInKeep('15', undefined as any)).toBe(15);
      expect(wInKeep('15', null as any)).toBe(15);
      expect(wInKeep('invalid', 'g', NaN)).toBe(0);
      expect(wInKeep('invalid', 'g', Infinity)).toBe(0);
      expect(wInKeep('0.7', 'oz', 20)).toBe(20);
    });

    test('TASK-P56-11-WZR: funkcje konwersji jednostek parsuja stringi z jednostkami i przecinkami oraz chronia przed -0', () => {
      // 1. celsiusToFahrenheit i fahrenheitToCelsius ze stringami
      expect(celsiusToFahrenheit('93')).toBe(199);
      expect(celsiusToFahrenheit('93,5')).toBe(200);
      expect(celsiusToFahrenheit('100 °C')).toBe(212);
      expect(celsiusToFahrenheit(-0)).toBe(32);

      // 2. gramsToOunces i ouncesToGrams
      expect(gramsToOunces('15,0 g')).toBe(0.53);
      expect(gramsToOunces('28,35')).toBe(1.0);
      expect(gramsToOunces(-0)).toBe(0);
      expect(Object.is(gramsToOunces(-0), -0)).toBe(false);
      expect(ouncesToGrams('0,53 oz')).toBe(15);
      expect(ouncesToGrams('1.0')).toBe(28);
      expect(ouncesToGrams(-0)).toBe(0);
      expect(Object.is(ouncesToGrams(-0), -0)).toBe(false);

      // 3. mlToFluidOunces i fluidOuncesToMl
      expect(mlToFluidOunces('250 ml')).toBe(8.45);
      expect(mlToFluidOunces('250,5')).toBe(8.47);
      expect(mlToFluidOunces(-0)).toBe(0);
      expect(Object.is(mlToFluidOunces(-0), -0)).toBe(false);

      // 4. roundTo ochrona przed -0
      expect(roundTo(-0, 2)).toBe(0);
      expect(Object.is(roundTo(-0, 2), -0)).toBe(false);
      expect(roundTo(-0.0001, 1)).toBe(0);
      expect(Object.is(roundTo(-0.0001, 1), -0)).toBe(false);

      // 5. wInKeep ze stringami z jednostkami
      expect(wInKeep(' 250,5 g ', 'g')).toBe(250.5);
      expect(wInKeep('-0', 'g')).toBe(0);
      expect(Object.is(wInKeep('-0', 'g'), -0)).toBe(false);
    });

    test('TASK-P62-09-LOK: formatWaterVolume oraz formatTemperature odporne na stringi, przecinki, jednostki i -0', () => {
      // 1. formatTemperature ze stringami, przecinkami i -0
      expect(formatTemperature('93,5 °C', 'metric')).toBe('94°C');
      expect(formatTemperature('93', 'imperial')).toBe('199°F');
      expect(formatTemperature(-0, 'metric')).toBe('0°C');
      expect(formatTemperature('invalid', 'metric')).toBe('0°C');
      expect(formatTemperature('invalid', 'imperial')).toBe('32°F');

      // 3. formatDoseWeight i formatWaterWeight ze stringami
      expect(formatDoseWeight('18,5 g', 'metric')).toBe('18.5g');
      expect(formatWaterWeight('300,5 g', 'metric')).toBe('300.5g');
    });

    test('M1-audytor-generalny-006: formatClockTime dla niepoprawnej daty nie zwraca Invalid Date', () => {
      const { formatClockTime } = require('../unit-converter');
      expect(formatClockTime('not-a-date', 'pl')).toBe('—');
      expect(formatClockTime('not-a-date', 'en')).toBe('—');
      expect(formatClockTime('2026-11-19T12:30:00Z', 'pl')).not.toBe('—');
    });

    test('D4 Stryker: pełne pokrycie parseLocaleFloat, exact konwersji, formatDecimal, bedtime, delta i wInKeep', () => {
      const {
        parseLocaleFloat,
        ouncesToGramsExact,
        fluidOuncesToMl,
        formatDecimal,
        normalizeBedtimeHourNumber,
        formatBedtimeHour,
        formatTemperatureDelta,
        formatClockTime,
      } = require('../unit-converter');

      // parseLocaleFloat: BOM/control chars, leading dot, signs, anchored start, -0, Infinity, non-string
      expect(parseLocaleFloat('\uFEFF 12,5 ')).toBe(12.5);
      expect(parseLocaleFloat('.5')).toBe(0.5);
      expect(parseLocaleFloat('+.5')).toBe(0.5);
      expect(parseLocaleFloat('-3,25')).toBe(-3.25);
      expect(Number.isNaN(parseLocaleFloat('abc 12'))).toBe(true);
      expect(Object.is(parseLocaleFloat(-0), 0)).toBe(true);
      expect(Object.is(parseLocaleFloat('-0'), 0)).toBe(true);
      expect(Number.isNaN(parseLocaleFloat(Infinity))).toBe(true);
      expect(Number.isNaN(parseLocaleFloat({}))).toBe(true);

      // 0 boundary for grams/oz/ml/fl oz
      expect(gramsToOunces(0)).toBe(0);
      expect(ouncesToGrams(0)).toBe(0);
      expect(mlToFluidOunces(0)).toBe(0);

      // ouncesToGramsExact & fluidOuncesToMl
      expect(ouncesToGramsExact(1)).toBe(28.35);
      expect(ouncesToGramsExact('0,53 oz')).toBe(15.03);
      expect(ouncesToGramsExact(0)).toBe(0);
      expect(ouncesToGramsExact(-1)).toBe(0);
      expect(ouncesToGramsExact(NaN)).toBe(0);

      expect(fluidOuncesToMl(10)).toBe(295.7);
      expect(fluidOuncesToMl('8,45 fl oz')).toBe(249.9);
      expect(fluidOuncesToMl(0)).toBe(0);
      expect(fluidOuncesToMl(-2)).toBe(0);
      expect(fluidOuncesToMl(NaN)).toBe(0);

      // formatDecimal
      expect(formatDecimal(1.5)).toBe('1.5');
      expect(formatDecimal(1.5, 2, 'en')).toBe('1.50');
      expect(formatDecimal(1.5, 1, 'pl')).toBe('1,5');
      expect(formatDecimal(12.345, 2, 'pl')).toBe('12,35');

      // formatDoseWeight & formatWaterWeight PL commas and 0 boundaries
      expect(formatDoseWeight(15.3, 'metric', 'pl')).toBe('15,3g');
      expect(formatDoseWeight(15, 'imperial', 'pl')).toBe('0,53 oz');
      expect(formatDoseWeight(0, 'metric', 'pl')).toBe('0g');
      expect(formatDoseWeight(0, 'imperial', 'pl')).toBe('0 oz');
      expect(formatWaterWeight(250.5, 'metric', 'pl')).toBe('250,5g');
      expect(formatWaterWeight(250, 'imperial', 'pl')).toBe('8,45 fl oz');
      expect(formatWaterWeight(0, 'metric', 'pl')).toBe('0g');
      expect(formatWaterWeight(0, 'imperial', 'pl')).toBe('0 fl oz');

      // roundTo edge cases
      expect(roundTo(1.2345, -1)).toBe(1);
      expect(roundTo(1.2345, NaN as any)).toBe(1);
      expect(roundTo(1.234567890123, 20)).toBe(1.2345678901);
      expect(Object.is(roundTo(-0.001, 2), 0)).toBe(true);

      // wInKeep edge cases (non-string, -0 prevBase, anchored regex, trimmed unit, F/°F int vs decimal, 2-decimal oz, no prevBase)
      expect(wInKeep(null as any, 'g', 15)).toBe(15);
      expect(Object.is(wInKeep(null as any, 'g', -0), 0)).toBe(true);
      expect(wInKeep('abc 12', 'g', 15)).toBe(15);
      expect(wInKeep('\uFEFF .5 ', 'g')).toBe(0.5);
      expect(wInKeep('1.0', '  OZ  ', 15)).toBe(28.35);
      expect(wInKeep('10', 'oz')).toBe(283.5);
      expect(wInKeep('10', 'oz', 0)).toBe(283.5);
      expect(wInKeep('0.53', 'oz', 15)).toBe(15);
      expect(wInKeep('0.54', 'oz', 15)).toBe(15.31);
      expect(wInKeep('199', 'F', 93)).toBe(93);
      expect(wInKeep('199.0', 'F', 93)).toBe(92.78);
      expect(wInKeep('199.4', 'f', 93)).toBe(93);
      expect(wInKeep('212', 'F')).toBe(100);
      expect(wInKeep('15.1', 'g', 15)).toBe(15.1);

      // normalizeBedtimeHourNumber & formatBedtimeHour
      expect(normalizeBedtimeHourNumber(24)).toBe('00');
      expect(normalizeBedtimeHourNumber(25)).toBe('01');
      expect(normalizeBedtimeHourNumber(-1)).toBe('23');
      expect(normalizeBedtimeHourNumber(5.9)).toBe('05');
      expect(normalizeBedtimeHourNumber(NaN)).toBe('23');
      expect(formatBedtimeHour(24)).toBe('00:00');
      expect(formatBedtimeHour(7)).toBe('07:00');

      // formatTemperatureDelta
      expect(formatTemperatureDelta(2)).toBe('2°C');
      expect(formatTemperatureDelta(2, 'metric')).toBe('2°C');
      expect(formatTemperatureDelta(2, 'imperial')).toBe('4°F');
      expect(formatTemperatureDelta(-3, 'imperial')).toBe('-5°F');

      // formatClockTime locale selection
      const spy = jest.spyOn(Date.prototype, 'toLocaleTimeString').mockReturnValue('12:30');
      expect(formatClockTime('2026-11-19T12:30:00Z', 'pl')).toBe('12:30');
      expect(spy).toHaveBeenLastCalledWith('pl-PL', { hour: '2-digit', minute: '2-digit' });
      expect(formatClockTime('2026-11-19T12:30:00Z', 'en')).toBe('12:30');
      expect(spy).toHaveBeenLastCalledWith('en-US', { hour: '2-digit', minute: '2-digit' });
      spy.mockRestore();

      // celsiusToFahrenheit -0 check
      expect(Object.is(celsiusToFahrenheit(-17.78), 0)).toBe(true);
      expect(formatTemperature(-0.1, 'metric')).toBe('0°C');

      // Pass 2: multi-digit leading-dot decimals, overflow to Infinity, wInKeep metric non-drift & Fahrenheit decimals
      expect(parseLocaleFloat('.25')).toBe(0.25);
      expect(Number.isNaN(parseLocaleFloat('9'.repeat(350)))).toBe(true);
      expect(wInKeep('.25', 'g')).toBe(0.25);
      expect(wInKeep('+15', 'g')).toBe(15);
      expect(wInKeep('9'.repeat(350), 'g', 15)).toBe(15);
      expect(wInKeep('15.04', 'g', 15)).toBe(15.04);
      expect(wInKeep('15', 'ml', 15)).toBe(15);
      expect(wInKeep('100', '°F', -5)).toBe(37.78);
      expect(wInKeep('0.5', 'oz', NaN)).toBe(14.17);
      expect(wInKeep('199.05', '°F', 93)).toBe(92.81);
      expect(wInKeep('200.0', '°F', 93)).toBe(93.33);
    });
  });
});

