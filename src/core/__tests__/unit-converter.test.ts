// ============================================================================
// Napar (Steepwise) — Unit Tests: Unit Converter (Metric / Imperial)
// ============================================================================

import {
  celsiusToFahrenheit,
  fahrenheitToCelsius,
  gramsToOunces,
  ouncesToGrams,
  mlToFluidOunces,
  fluidOuncesToMl,
  formatTemperature,
  formatDoseWeight,
  formatWaterWeight,
  formatWaterVolume,
  wInKeep,
  roundTo,
} from '../unit-converter';

describe('Unit Converter (DEC-21 Metric / Imperial)', () => {
  test('Przelicza temperaturę °C <-> °F', () => {
    // 93°C -> ok. 199°F
    expect(celsiusToFahrenheit(93)).toBe(199);
    expect(celsiusToFahrenheit(100)).toBe(212);
    expect(celsiusToFahrenheit(0)).toBe(32);

    expect(fahrenheitToCelsius(199)).toBe(93);
    expect(fahrenheitToCelsius(212)).toBe(100);
    expect(fahrenheitToCelsius(32)).toBe(0);
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
    expect(fluidOuncesToMl(8.45)).toBe(250);
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

      expect(fluidOuncesToMl(-10)).toBe(0);
      expect(fluidOuncesToMl(NaN)).toBe(0);
      expect(fluidOuncesToMl(Infinity)).toBe(0);

      expect(celsiusToFahrenheit(NaN)).toBe(0);
      expect(fahrenheitToCelsius(NaN)).toBe(0);
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
      expect(fahrenheitToCelsius('212 °F')).toBe(100);
      expect(fahrenheitToCelsius('199,4')).toBe(93);
      expect(fahrenheitToCelsius(32)).toBe(0);
      expect(Object.is(fahrenheitToCelsius(32), -0)).toBe(false);

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
      expect(fluidOuncesToMl('8,45 fl oz')).toBe(250);
      expect(fluidOuncesToMl(-0)).toBe(0);
      expect(Object.is(fluidOuncesToMl(-0), -0)).toBe(false);

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

      // 2. formatWaterVolume
      expect(formatWaterVolume(250, 'metric')).toBe('250 ml');
      expect(formatWaterVolume(250, 'imperial')).toBe('8.45 fl oz');
      expect(formatWaterVolume('250,5 ml', 'metric')).toBe('250.5 ml');
      expect(formatWaterVolume(-0, 'metric')).toBe('0 ml');
      expect(formatWaterVolume('invalid', 'metric')).toBe('0 ml');
      expect(formatWaterVolume('invalid', 'imperial')).toBe('0 fl oz');

      // 3. formatDoseWeight i formatWaterWeight ze stringami
      expect(formatDoseWeight('18,5 g', 'metric')).toBe('18.5g');
      expect(formatWaterWeight('300,5 g', 'metric')).toBe('300.5g');
    });
  });
});
