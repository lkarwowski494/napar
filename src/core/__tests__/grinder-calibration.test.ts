// ============================================================================
// Napar (Steepwise) — Unit Tests: kalibracja przelicznika kliknięć (poz. 12)
// Wartości oczekiwane policzone ręcznie. Cel EY 20,0; czułość 0,5 %/klik;
// próg 3 pary; ograniczenie ±5 klików; waga 1/(1+|odchylenie|).
// ============================================================================

import {
  GRINDER_CALIBRATION_MIN_PAIRS,
  GRINDER_EY_PER_CLICK,
  GRINDER_MAX_SHIFT_CLICKS,
  GRINDER_TARGET_EY_PERCENT,
  estimateGrinderCalibration,
  notifyGrinderCalibrationChanged,
  onGrinderCalibrationChanged,
  pairOffsetClicks,
  pairWeight,
  type CalibrationPair,
} from '../grinder-calibration';

const pair = (dialedClicks: number, baseClicks: number, extractionYieldPercent: number): CalibrationPair => ({
  dialedClicks,
  baseClicks,
  extractionYieldPercent,
});

describe('Kalibracja młynka: stałe metody', () => {
  test('Wartości zgodne z rejestrem (S-092..S-095, S-094)', () => {
    expect(GRINDER_CALIBRATION_MIN_PAIRS).toBe(3);
    expect(GRINDER_TARGET_EY_PERCENT).toBe(20.0);
    expect(GRINDER_EY_PER_CLICK).toBe(0.5);
    expect(GRINDER_MAX_SHIFT_CLICKS).toBe(5);
  });
});

describe('Kalibracja młynka: pojedyncza para', () => {
  test('Para z EY 18,0 % na nastawie bazowej: odchylenie −2 → offset (−2)/0,5 = −4 klików', () => {
    expect(pairOffsetClicks(pair(24, 24, 18))).toBe(-4);
  });

  test('Offset uwzględnia kliki już przesunięte kalibracją: (23 − 24) + (20 − 20)/0,5 = −1', () => {
    expect(pairOffsetClicks(pair(23, 24, 20))).toBe(-1);
  });

  test('Waga pary: EY 18 → 1/(1+2) = 1/3; EY 20 → 1', () => {
    expect(pairWeight(pair(24, 24, 18))).toBeCloseTo(1 / 3, 10);
    expect(pairWeight(pair(24, 24, 20))).toBe(1);
  });
});

describe('Kalibracja młynka: estymacja przesunięcia', () => {
  test('Brak par: bez zmiany', () => {
    expect(estimateGrinderCalibration([])).toEqual({ shiftClicks: 0, pairCount: 0, isActive: false });
  });

  test('Dwie pary: brak zmiany mimo danych (próg 3)', () => {
    const pairs = [pair(24, 24, 18), pair(24, 24, 19)];
    expect(estimateGrinderCalibration(pairs)).toEqual({ shiftClicks: 0, pairCount: 2, isActive: false });
  });

  test('Trzy pary: przesunięcie policzone ręcznie = −1,0 klika', () => {
    // offsety: −4 (w 1/3), −2 (w 1/2), +2 (w 1/2)
    // Σw·o = −4/3 − 1 + 1 = −4/3 ; Σw = 1/3 + 1/2 + 1/2 = 4/3 ; średnia = −1,0
    const pairs = [pair(24, 24, 18), pair(24, 24, 19), pair(24, 24, 21)];
    expect(estimateGrinderCalibration(pairs)).toEqual({ shiftClicks: -1, pairCount: 3, isActive: true });
  });

  test('Trzy pary przy EY 20: średnia ważona 1/3 klika zaokrąglona do 0,01 = 0,33', () => {
    // offsety: 1, 0, 0 ; wagi: 1, 1, 1 ; średnia = 1/3
    const pairs = [pair(25, 24, 20), pair(24, 24, 20), pair(24, 24, 20)];
    expect(estimateGrinderCalibration(pairs).shiftClicks).toBe(0.33);
  });

  test('Przesunięcie jest ograniczone do +5 klików', () => {
    // każda para: offset (24 − 24) + (30 − 20)/0,5 = +20 → średnia +20 → ograniczone do +5
    const pairs = [pair(24, 24, 30), pair(24, 24, 30), pair(24, 24, 30)];
    expect(estimateGrinderCalibration(pairs).shiftClicks).toBe(GRINDER_MAX_SHIFT_CLICKS);
  });

  test('Przesunięcie jest ograniczone do −5 klików', () => {
    // offset (24 − 24) + (10 − 20)/0,5 = −20 → ograniczone do −5
    const pairs = [pair(24, 24, 10), pair(24, 24, 10), pair(24, 24, 10)];
    expect(estimateGrinderCalibration(pairs).shiftClicks).toBe(-GRINDER_MAX_SHIFT_CLICKS);
  });
});

describe('Kalibracja młynka: powiadomienia o zmianie', () => {
  test('Słuchacz dostaje powiadomienie; po wyrejestrowaniu już nie', () => {
    const listener = jest.fn();
    const unsubscribe = onGrinderCalibrationChanged(listener);
    notifyGrinderCalibrationChanged();
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    notifyGrinderCalibrationChanged();
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
