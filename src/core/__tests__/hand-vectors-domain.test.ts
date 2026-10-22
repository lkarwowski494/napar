// ============================================================================
// Napar (Steepwise) — Wektory referencyjne: domain-rules (oczekiwane wartości liczone ręcznie)
// Każda wartość oczekiwana jest wyliczona na kartce ze wzoru podanego w komentarzu, nie z kodu.
// ============================================================================

import {
  calculateBrewWater,
  calculateBrewDose,
  calculateBrewRatio,
  calculateLiquidYield,
  calculateExtractionYield,
  evaluateRestingWindow,
  estimateCoffeeCaffeineMg,
  estimateTeaInfusionCaffeineMg,
  calculateRemainingCaffeineMg,
  evaluateBedtimeCaffeine,
  calculateCaffeineDecay,
  calculateHoursUntilSafeCaffeine,
  diagnoseExtractionTaste,
  diagnoseTaste,
  diagnoseTeaTaste,
  calculateBatchScaling,
  scaleRecipeDose,
} from '../domain-rules';

describe('RD-01 proporcje: wartości ręczne', () => {
  test('woda = dawka * ratio: 18 g * 16,67 = 300,06 -> 300,1 g', () => {
    expect(calculateBrewWater(18, 16.67)).toBe(300.1);
  });
  test('dawka = woda / ratio: 300 g / 16 = 18,75 -> 18,8 g (toFixed(1))', () => {
    expect(calculateBrewDose(300, 16)).toBe(18.8);
  });
  test('ratio = woda / dawka: 300 g / 18 g = 16,666 -> 16,7', () => {
    expect(calculateBrewRatio(18, 300)).toBe(16.7);
  });
  test('ratio dla 15 g i 250 g = 16,666 -> 16,7; dla 20 g i 300 g = 15,0', () => {
    expect(calculateBrewRatio(15, 250)).toBe(16.7);
    expect(calculateBrewRatio(20, 300)).toBe(15);
  });
  test('ratio zwraca 0 dla zera (zabezpieczenie, nie dzielenie przez zero)', () => {
    expect(calculateBrewRatio(0, 300)).toBe(0);
  });
});

describe('RD-02 retencja wody: wartości ręczne', () => {
  test('300 g - 18 g * 2,0 = 264 g', () => {
    expect(calculateLiquidYield(300, 18)).toBe(264);
  });
  test('300 g - 18 g * 1,5 = 273 g (współczynnik jawnie podany)', () => {
    expect(calculateLiquidYield(300, 18, 1.5)).toBe(273);
  });
});

describe('RD-03 EY: wartości ręczne i granice', () => {
  test('20 g kawy, 300 g napoju, TDS 1,4 % -> EY = 300 * 1,4 / 20 = 21,0 %', () => {
    const r = calculateExtractionYield({ beverageWeightGrams: 300, tdsPercent: 1.4, doseGrams: 20 });
    expect(r.extractionYieldPercent).toBe(21.0);
    expect(r.rating).toBe('ideal');
  });
  test('zamiana argumentów nie jest możliwa: obiekt z nazwanymi polami', () => {
    const r = calculateExtractionYield({ doseGrams: 20, tdsPercent: 1.4, beverageWeightGrams: 300 });
    expect(r.extractionYieldPercent).toBe(21.0);
  });
  test('granica 18,0 % należy do zakresu idealnego: 300 * 1,2 / 20 = 18,0', () => {
    expect(calculateExtractionYield({ beverageWeightGrams: 300, tdsPercent: 1.2, doseGrams: 20 }).rating).toBe('ideal');
  });
  test('poniżej 18,0 % (17,85) -> under', () => {
    const r = calculateExtractionYield({ beverageWeightGrams: 300, tdsPercent: 1.19, doseGrams: 20 });
    expect(r.extractionYieldPercent).toBe(17.85);
    expect(r.rating).toBe('under');
  });
  test('powyżej 22,0 % (22,5) -> over', () => {
    const r = calculateExtractionYield({ beverageWeightGrams: 300, tdsPercent: 1.5, doseGrams: 20 });
    expect(r.extractionYieldPercent).toBe(22.5);
    expect(r.rating).toBe('over');
  });
});

describe('RD-07 okno świeżości: granice dni (wartości ręczne)', () => {
  const now = new Date('2026-10-22T12:00:00Z');
  const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000);

  test('5 dni -> degassing, 6 dni -> peak', () => {
    expect(evaluateRestingWindow(daysAgo(5), now).stage).toBe('degassing');
    expect(evaluateRestingWindow(daysAgo(6), now).stage).toBe('peak');
  });
  test('30 dni -> peak, 31 dni -> stable', () => {
    expect(evaluateRestingWindow(daysAgo(30), now).stage).toBe('peak');
    expect(evaluateRestingWindow(daysAgo(31), now).stage).toBe('stable');
  });
  test('60 dni -> stable, 61 dni -> aging', () => {
    expect(evaluateRestingWindow(daysAgo(60), now).stage).toBe('stable');
    expect(evaluateRestingWindow(daysAgo(61), now).stage).toBe('aging');
  });
  test('data palenia w przyszłości -> 0 dni (degassing)', () => {
    const r = evaluateRestingWindow(new Date('2026-10-30T12:00:00Z'), now);
    expect(r.daysSinceRoast).toBe(0);
    expect(r.stage).toBe('degassing');
  });
});

describe('RD-17 kofeina w kawie: wartości ręczne (dawka * mg/g * sprawność)', () => {
  test('filtr, arabika: 15 * 12,0 * 0,88 = 158,4 mg', () => {
    expect(estimateCoffeeCaffeineMg(15, 'arabica', 'filter')).toBe(158.4);
  });
  test('domyślne argumenty to arabika i filtr: 10 * 12,0 * 0,88 = 105,6 mg', () => {
    expect(estimateCoffeeCaffeineMg(10)).toBe(105.6);
  });
  test('robusta, filtr: 15 * 22,0 * 0,88 = 290,4 mg', () => {
    expect(estimateCoffeeCaffeineMg(15, 'robusta', 'filter')).toBe(290.4);
  });
  test('espresso: 18 * 12,0 * 0,75 = 162,0 mg', () => {
    expect(estimateCoffeeCaffeineMg(18, 'arabica', 'espresso')).toBe(162);
  });
  test('immersion: 15 * 12,0 * 0,85 = 153,0 mg; cold brew: 15 * 12,0 * 0,92 = 165,6 mg', () => {
    expect(estimateCoffeeCaffeineMg(15, 'arabica', 'immersion')).toBe(153);
    expect(estimateCoffeeCaffeineMg(15, 'arabica', 'cold_brew')).toBe(165.6);
  });
});

describe('RD-19 herbata Gongfu: udział kofeiny w zalaniach (wartości z komentarza 45/30/15 %)', () => {
  test('100 mg w liściach: zalania 1, 2, 3 -> 45, 30, 15 mg', () => {
    expect(estimateTeaInfusionCaffeineMg(100, 1)).toBe(45);
    expect(estimateTeaInfusionCaffeineMg(100, 2)).toBe(30);
    expect(estimateTeaInfusionCaffeineMg(100, 3)).toBe(15);
  });
});

describe('RD-17/RD-20/RD-21 farmakokinetyka (t1/2 = 5 h, wzór C = C0 * 0,5^(t/t1/2))', () => {
  test('120 mg po 5 h -> 60 mg; po 10 h -> 30 mg; po 15 h -> 15 mg', () => {
    expect(calculateRemainingCaffeineMg(120, 5)).toBe(60);
    expect(calculateRemainingCaffeineMg(120, 10)).toBe(30);
    expect(calculateRemainingCaffeineMg(120, 15)).toBe(15);
  });
  test('120 mg po 6 h przy t1/2 = 3 h -> 120 * 0,5^2 = 30 mg', () => {
    expect(calculateRemainingCaffeineMg(120, 6, 3)).toBe(30);
  });
  test('calculateCaffeineDecay: 120 mg po 5 h -> 60; 100 mg po 10 h -> 25', () => {
    expect(calculateCaffeineDecay(120, 5)).toBe(60);
    expect(calculateCaffeineDecay(100, 10)).toBe(25);
  });
  test('sen: 80 mg 5 h przed snem + 40 mg 0 h przed snem = 40 + 40 = 80 mg (próg 25 mg -> niebezpiecznie)', () => {
    const r = evaluateBedtimeCaffeine([
      { doseMg: 80, hoursUntilBedtime: 5 },
      { doseMg: 40, hoursUntilBedtime: 0 },
    ]);
    expect(r.totalRemainingMg).toBe(80);
    expect(r.isSafeForSleep).toBe(false);
  });
  test('sen: dawka spożyta po położeniu się (hours < 0) nie wlicza się', () => {
    const r = evaluateBedtimeCaffeine([{ doseMg: 100, hoursUntilBedtime: -1 }]);
    expect(r.totalRemainingMg).toBe(0);
    expect(r.isSafeForSleep).toBe(true);
  });
  test('sen: 120 mg 10 h przed snem = 30 mg > 25 mg', () => {
    const r = evaluateBedtimeCaffeine([{ doseMg: 120, hoursUntilBedtime: 10 }], 25);
    expect(r.totalRemainingMg).toBe(30);
    expect(r.safeThresholdMg).toBe(25);
    expect(r.isSafeForSleep).toBe(false);
  });
  test('RD-21: 200 mg do progu 25 mg -> log2(8) = 3 półokresy = 15 h', () => {
    expect(calculateHoursUntilSafeCaffeine(200, 25, 5)).toBe(15);
  });
});

describe('RD-05 kompas ekstrakcji (diagnozy)', () => {
  test('kawa: kwaśna -> zmiel drobniej i podnieś temperaturę', () => {
    const [d] = diagnoseExtractionTaste({ isSour: true });
    expect(d.grindAdjustment).toBe('finer');
    expect(d.tempAdjustment).toBe('higher');
  });
  test('kawa: wodnista -> brak zmiany mielenia, opis dawki +1 g', () => {
    const [d] = diagnoseExtractionTaste({ isWatery: true });
    expect(d.grindAdjustment).toBeUndefined();
    expect(d.recommendationPl).toContain('+1g');
  });
  test('kawa: zbyt intensywna -> wydłuż ratio (opis zawiera 1:16.6)', () => {
    const [d] = diagnoseExtractionTaste({ isTooIntense: true });
    expect(d.recommendationPl).toContain('1:16.6');
  });
  test('diagnoseTaste jest aliasem diagnoseExtractionTaste', () => {
    expect(diagnoseTaste({ isSour: true })).toEqual(diagnoseExtractionTaste({ isSour: true }));
  });
  test('herbata przez diagnoseExtractionTaste: poparzenie -> temperatura niżej, czas -5 s (zakres 5–10 s z komentarza)', () => {
    const [d] = diagnoseExtractionTaste({ beverageType: 'TEA', isScalded: true });
    expect(d.tempAdjustment).toBe('lower');
    expect(d.steepTimeAdjustmentSeconds).toBe(-5);
  });
  test('herbata: gorycz -> skróć o 5–10 s (wartość -10 mieści się w zakresie komentarza)', () => {
    const [d] = diagnoseTeaTaste({ isBitterOrAstringent: true });
    expect(d.steepTimeAdjustmentSeconds).toBeGreaterThanOrEqual(-10);
    expect(d.steepTimeAdjustmentSeconds).toBeLessThanOrEqual(-5);
  });
  test('herbata: wodnista -> wydłuż o 10–15 s (wartość 15 mieści się w zakresie komentarza)', () => {
    const [d] = diagnoseTeaTaste({ isWeakOrWatery: true });
    expect(d.steepTimeAdjustmentSeconds).toBeGreaterThanOrEqual(10);
    expect(d.steepTimeAdjustmentSeconds).toBeLessThanOrEqual(15);
  });
  test('herbata bez wad -> brak diagnoz', () => {
    expect(diagnoseTeaTaste({})).toEqual([]);
  });
});

describe('RD-06 skalowanie porcji: wartości ręczne', () => {
  test('2 porcje z 15 g / 250 g -> 30 g / 500 g, +2 kliki', () => {
    const r = calculateBatchScaling(15, 250, 2);
    expect(r.scaledDoseGrams).toBe(30);
    expect(r.scaledWaterGrams).toBe(500);
    expect(r.grindAdjustmentClicks).toBe(2);
  });
  test('3 porcje -> +4 kliki; liczba porcji zaokrąglana: 2,6 -> 3', () => {
    expect(calculateBatchScaling(15, 250, 3).grindAdjustmentClicks).toBe(4);
    expect(calculateBatchScaling(15, 250, 2.6).multiplier).toBe(3);
  });
});

describe('scaleRecipeDose: suma kroków równa wodzie docelowej', () => {
  const steps = [
    { id: 'a', name: 'Bloom', waterGrams: 40, durationSeconds: 30 },
    { id: 'b', name: 'Nalew', waterGrams: 60, durationSeconds: 60 },
  ];
  test('dawka 10 g -> 20 g: współczynnik 2, woda 100 g -> 200 g, kroki 80 + 120', () => {
    const r = scaleRecipeDose(steps, 10, 20);
    expect(r.multiplier).toBe(2);
    expect(r.targetWaterGrams).toBe(200);
    expect(r.steps.map((s) => s.waterGrams)).toEqual([80, 120]);
  });
  test('zerowa dawka jest odrzucana', () => {
    expect(() => scaleRecipeDose(steps, 0, 20)).toThrow();
    expect(() => scaleRecipeDose(steps, 10, 0)).toThrow();
  });
});

describe('RD-21: wartości domyślne progu i półokresu', () => {
  test('domyślnie próg 25 mg i t1/2 5 h: 100 mg -> 10 h; 20 mg -> 0 h', () => {
    expect(calculateHoursUntilSafeCaffeine(100)).toBe(10);
    expect(calculateHoursUntilSafeCaffeine(20)).toBe(0);
  });
});
