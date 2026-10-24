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
  });
});
