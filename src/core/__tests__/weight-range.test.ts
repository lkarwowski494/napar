// ============================================================================
// Napar (Steepwise) — Test granic: zakres wagi bez sztywnego minimum (poz. 14 MVP)
// ============================================================================

import { stepWeightGrams, WEIGHT_FLOOR_GRAMS } from '../weight-range';

describe('Zakres wagi bez sztywnego minimum (poz. 14)', () => {
  test('dolny próg to 0 g, nie 1 g ani 10 g', () => {
    expect(WEIGHT_FLOOR_GRAMS).toBe(0);
  });

  test('steper dozy schodzi do 5 g i dalej do 4 g (dawniej zatrzymywał się na 1 g)', () => {
    expect(stepWeightGrams(5, -1)).toBe(4);
    expect(stepWeightGrams(2, -1)).toBe(1);
    expect(stepWeightGrams(1, -1)).toBe(0);
  });

  test('steper wody schodzi o 10 g bez zatrzymania na 10 g (np. 15 g → 5 g, 5 g → 0 g)', () => {
    expect(stepWeightGrams(15, -10)).toBe(5);
    expect(stepWeightGrams(5, -10)).toBe(0);
  });

  test('wynik nigdy nie jest ujemny', () => {
    expect(stepWeightGrams(0, -1)).toBe(0);
    expect(stepWeightGrams(3, -10)).toBe(0);
  });

  test('wartości 270 g, 320 g i 500 g nie są przycinane', () => {
    expect(stepWeightGrams(270, 0)).toBe(270);
    expect(stepWeightGrams(320, 0)).toBe(320);
    expect(stepWeightGrams(500, 0)).toBe(500);
    expect(stepWeightGrams(500, 10)).toBe(510);
    expect(stepWeightGrams(269, 1)).toBe(270);
    expect(stepWeightGrams(319, 1)).toBe(320);
  });

  test('krok ułamkowy jest zaokrąglany do 0,1 g (bez dryfu zmiennoprzecinkowego)', () => {
    expect(stepWeightGrams(0.1, 0.2)).toBe(0.3);
    expect(stepWeightGrams(18.3, -0.1)).toBe(18.2);
  });
});
