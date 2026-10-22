// ============================================================================
// Napar (Steepwise) — Wektory i testy okrągłe konwersji jednostek (metryka -> imperial -> metryka)
// ============================================================================

import {
  celsiusToFahrenheit,
  fahrenheitToCelsius,
  gramsToOunces,
  ouncesToGrams,
  mlToFluidOunces,
  fluidOuncesToMl,
  baseToDisplay,
  unitFactor,
  wInKeep,
  roundTo,
} from '../unit-converter';

describe('wartości ręczne: przeliczniki', () => {
  test('15 g = 15 * 0,03527396 oz = 0,529 oz -> 0,53 oz', () => {
    expect(gramsToOunces(15)).toBe(0.53);
  });
  test('1 oz = 28,35 g (1 / 0,03527396 = 28,3495)', () => {
    expect(ouncesToGrams(1)).toBe(28);
    expect(wInKeep('1', 'oz')).toBe(28.35);
  });
  test('250 ml = 250 * 0,0338140 fl oz = 8,4535 -> 8,45 fl oz', () => {
    expect(mlToFluidOunces(250)).toBe(8.45);
  });
  test('8,5 fl oz = 8,5 / 0,0338140 = 251,4 ml', () => {
    expect(fluidOuncesToMl(8.5)).toBe(251);
  });
  test('0 °C = 32 °F; 100 °C = 212 °F; 93 °C = 199,4 °F -> 199 (zaokr. do pełnego stopnia)', () => {
    expect(celsiusToFahrenheit(0)).toBe(32);
    expect(celsiusToFahrenheit(100)).toBe(212);
    expect(celsiusToFahrenheit(93)).toBe(199);
  });
  test('212 °F = 100 °C; 199 °F = 92,78 °C -> 93', () => {
    expect(fahrenheitToCelsius(212)).toBe(100);
    expect(fahrenheitToCelsius(199)).toBe(93);
  });
  test('współczynniki jednostek (aliasy lb/lbs, floz/fl oz)', () => {
    expect(unitFactor('lb')).toBe(2.20462262185);
    expect(unitFactor('LBS')).toBe(2.20462262185);
    expect(unitFactor('floz')).toBe(0.0338140227);
    expect(unitFactor('oz')).toBe(0.03527396195);
    expect(unitFactor('g')).toBe(1);
    expect(unitFactor('°C')).toBe(1);
  });
});

describe('baseToDisplay: wartość bazowa -> wartość wyświetlana (0,1 precyzji)', () => {
  test('g -> oz: 15 g = 0,529 oz -> 0,5', () => {
    expect(baseToDisplay(15, 'oz')).toBe(0.5);
  });
  test('ml -> fl oz: 250 ml = 8,4535 fl oz -> 8,5', () => {
    expect(baseToDisplay(250, 'fl oz')).toBe(8.5);
  });
  test('°C -> °F: 93 °C = 199,4 °F -> 199,4', () => {
    expect(baseToDisplay(93, '°F')).toBe(199.4);
  });
  test('kg -> lb: 61,23 kg = 135,0 lb', () => {
    expect(baseToDisplay(61.23, 'lb')).toBe(135);
  });
  test('jednostki metryczne i brak jednostki: wartość bez zmian', () => {
    expect(baseToDisplay(15, 'g')).toBe(15);
    expect(baseToDisplay(93, '°C')).toBe(93);
    expect(baseToDisplay(7.25, '')).toBe(7.25);
  });
});

describe('testy okrągłe: metryka -> imperial -> metryka', () => {
  // Wartość wyświetlana zaokrąglana do 0,1 jednostki. Z prevBase (stored) wartość wraca dokładnie.
  // Bez prevBase błąd nie przekracza połowy kroku wyświetlania (0,05 jednostki imperialnej).
  const cases: Array<{ name: string; unit: string; values: number[]; halfStepBaseTolerance: number }> = [
    { name: 'g <-> oz', unit: 'oz', values: [7, 15, 18, 20, 60], halfStepBaseTolerance: 0.05 / 0.03527396195 },
    { name: 'ml <-> fl oz', unit: 'fl oz', values: [150, 250, 300, 500], halfStepBaseTolerance: 0.05 / 0.0338140227 },
    { name: '°C <-> °F', unit: '°F', values: [85, 90, 93, 96, 100], halfStepBaseTolerance: 0.05 * 5 / 9 },
  ];

  for (const c of cases) {
    test(`${c.name}: z prevBase wartość wraca bez zmian`, () => {
      for (const metric of c.values) {
        const shown = String(baseToDisplay(metric, c.unit));
        expect(wInKeep(shown, c.unit, metric)).toBe(metric);
      }
    });

    test(`${c.name}: bez prevBase różnica nie przekracza połowy kroku wyświetlania`, () => {
      for (const metric of c.values) {
        const shown = String(baseToDisplay(metric, c.unit));
        const back = wInKeep(shown, c.unit);
        expect(Math.abs(back - metric)).toBeLessThanOrEqual(c.halfStepBaseTolerance + 0.01);
      }
    });
  }

  test('konkretne przykłady: 15 g -> 0,5 oz -> 15 g; 250 ml -> 8,5 fl oz -> 250 ml; 93 °C -> 199,4 °F -> 93 °C', () => {
    expect(wInKeep('0.5', 'oz', 15)).toBe(15);
    expect(wInKeep('8.5', 'fl oz', 250)).toBe(250);
    expect(wInKeep('199.4', '°F', 93)).toBe(93);
  });

  test('zmiana wartości w imperialu zwraca nową wartość bazową: 1 oz -> 28,35 g; 10 fl oz -> 295,74 ml', () => {
    expect(wInKeep('1', 'oz', 15)).toBe(28.35);
    expect(wInKeep('10', 'fl oz', 250)).toBe(295.74);
  });

  test('100 cykli zapisu w oz nie dryfuje (15 g)', () => {
    let base = 15;
    for (let i = 0; i < 100; i++) {
      base = wInKeep(String(baseToDisplay(base, 'oz')), 'oz', base);
    }
    expect(base).toBe(15);
  });

  test('roundTo zaokrągla do zadanej liczby miejsc', () => {
    expect(roundTo(0.529, 1)).toBe(0.5);
    expect(roundTo(8.4535, 1)).toBe(8.5);
    expect(roundTo(2.345, 2)).toBe(2.35);
  });
});

describe('wInKeep: wejścia nietekstowe i nieliczbowe (gałęzie zabezpieczeń)', () => {
  test('wartość niebędąca tekstem zwraca poprzednią wartość bazową; bez niej 0', () => {
    expect(wInKeep(123 as unknown as string, 'g', 15)).toBe(15);
    expect(wInKeep(123 as unknown as string, 'g')).toBe(0);
  });
  test('tekst nieliczbowy lub nieskończony bez prevBase zwraca 0; z prevBase zwraca prevBase', () => {
    expect(wInKeep('abc', 'g')).toBe(0);
    expect(wInKeep('Infinity', 'g')).toBe(0);
    expect(wInKeep('Infinity', 'g', 18)).toBe(18);
  });
});
