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
});
