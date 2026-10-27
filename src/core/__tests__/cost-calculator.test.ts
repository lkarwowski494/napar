// ============================================================================
// Napar (Steepwise) — Unit Tests: Cost Calculator
// ============================================================================

import {
  calculateBrewCost,
  calculateTeaCost,
  formatPlnCost,
  formatCost,
  DEFAULT_BREW_COST_PARAMETERS,
  DEFAULT_TEA_COST_PARAMETERS,
} from '../cost-calculator';

describe('Cost Calculator Engine (Craft Economics)', () => {
  test('Oblicza domyślny koszt filiżanki V60 z domyślnymi parametrami', () => {
    // 15g kawy, 250g wody
    const metrics = calculateBrewCost({
      doseGrams: 15,
      waterWeightGrams: 250,
    });

    // 15g * 0.26 zł/g = 3.90 zł
    expect(metrics.coffeeCost).toBe(3.9);
    // 0.25L * 0.05 zł/L = 0.01 zł
    expect(metrics.waterCost).toBe(0.01);
    // 2 kW * (3 / 60) h = 0.1 kWh; 0.1 * 1.15 zł = 0.12 zł (zaokrąglone)
    expect(metrics.electricityKwh).toBe(0.1);
    expect(metrics.energyCost).toBe(0.12);
    // Filtr 0.25 zł
    expect(metrics.filterCost).toBe(0.25);
    // Całkowity: 3.90 + 0.01 + 0.12 + 0.25 = 4.28 zł
    expect(metrics.totalHomeCost).toBe(4.28);
    // Cena kawiarniana: 18.00 zł
    expect(metrics.cafePrice).toBe(18.0);
    // Oszczędność: 18.00 - 4.28 = 13.72 zł
    expect(metrics.savingsPerCup).toBe(13.72);
    // % oszczędności: 13.72 / 18.00 ≈ 76.2%
    expect(metrics.savingsPercent).toBeCloseTo(76.2, 1);
  });

  test('Obsługuje podanie waterLiters bezpośrednio oraz niestandardowe ceny', () => {
    const metrics = calculateBrewCost({
      doseGrams: 30,
      waterLiters: 0.5,
      beanPricePerKg: 300,
      waterSaltsCostPerLiter: 0.1,
      kettlePowerKw: 1.5,
      kettleBoilMinutes: 4.0,
      electricityPricePerKwh: 1.2,
      filterPaperCost: 0.3,
      cafeReferencePrice: 25.0,
    });

    // 30g * 0.30 zł = 9.00 zł
    expect(metrics.coffeeCost).toBe(9.0);
    // 0.5L * 0.10 zł = 0.05 zł
    expect(metrics.waterCost).toBe(0.05);
    // 1.5 * (4/60) = 0.1 kWh; 0.1 * 1.2 = 0.12 zł
    expect(metrics.electricityKwh).toBe(0.1);
    expect(metrics.energyCost).toBe(0.12);
    expect(metrics.filterCost).toBe(0.3);
    expect(metrics.totalHomeCost).toBe(9.47);
    expect(metrics.savingsPerCup).toBe(15.53);
    expect(metrics.savingsPercent).toBeCloseTo(62.1, 1);
  });

  test('Obsługuje skrajne i zerowe wartości wejściowe bezpiecznie', () => {
    const zeroMetrics = calculateBrewCost({
      doseGrams: 0,
      waterWeightGrams: 0,
      cafeReferencePrice: 0,
      filterPaperCost: 0,
      kettlePowerKw: 0,
      waterSaltsCostPerLiter: 0,
      beanPricePerKg: 0,
    });

    expect(zeroMetrics.totalHomeCost).toBe(0);
    expect(zeroMetrics.savingsPerCup).toBe(0);
    expect(zeroMetrics.savingsPercent).toBe(0);
  });

  test('Gdy koszt domowy przekracza cenę referencyjną, oszczędność wynosi 0', () => {
    const metrics = calculateBrewCost({
      doseGrams: 50,
      beanPricePerKg: 1000, // 50 zł za 50g
      cafeReferencePrice: 10,
    });

    expect(metrics.totalHomeCost).toBeGreaterThan(metrics.cafePrice);
    expect(metrics.savingsPerCup).toBe(0);
    expect(metrics.savingsPercent).toBe(0);
  });

  test('TASK-P7-03-ZAK: Odporność na wartości Infinity i NaN w parametrach wejściowych', () => {
    const nanMetrics = calculateBrewCost({
      doseGrams: NaN,
      waterWeightGrams: NaN,
      waterLiters: NaN,
      beanPricePerKg: Infinity,
      cafeReferencePrice: NaN,
      electricityPricePerKwh: Infinity,
      filterPaperCost: NaN,
      kettleBoilMinutes: Infinity,
      kettlePowerKw: NaN,
      waterSaltsCostPerLiter: Infinity,
    });

    expect(Number.isFinite(nanMetrics.totalHomeCost)).toBe(true);
    expect(Number.isFinite(nanMetrics.savingsPerCup)).toBe(true);
    expect(Number.isFinite(nanMetrics.savingsPercent)).toBe(true);
    expect(nanMetrics.coffeeCost).toBe(0); // dose NaN -> 0
    expect(nanMetrics.cafePrice).toBe(DEFAULT_BREW_COST_PARAMETERS.cafeReferencePrice); // NaN -> default
    expect(nanMetrics.waterCost).toBe(0.01); // 0.25L * 0.05 default
  });

  test('TASK-P10-07-JAK: calculateBrewCost jest odporne na brak argumentu i ogranicza savingsPercent do 100%', () => {
    const defaultMetrics = calculateBrewCost(undefined);
    expect(defaultMetrics).toBeDefined();
    expect(defaultMetrics.totalHomeCost).toBeGreaterThan(0);
    expect(defaultMetrics.savingsPercent).toBeLessThanOrEqual(100);
    expect(defaultMetrics.savingsPercent).toBeGreaterThanOrEqual(0);

    const highSavings = calculateBrewCost({
      doseGrams: 1,
      beanPricePerKg: 10,
      filterPaperCost: 0,
      electricityPricePerKwh: 0,
      waterSaltsCostPerLiter: 0,
      cafeReferencePrice: 1000,
    });
    expect(highSavings.savingsPercent).toBeLessThanOrEqual(100);
  });

  test('TASK-P60-08-PRO: calculateTeaCost oblicza koszt wielonaparowej sesji Gongfu Cha i koszt pojedynczej infuzji', () => {
    expect(DEFAULT_TEA_COST_PARAMETERS.leafGrams).toBe(5.0);
    expect(DEFAULT_TEA_COST_PARAMETERS.teaPricePer100g).toBe(60.0);
    expect(DEFAULT_TEA_COST_PARAMETERS.infusionsCount).toBe(5);

    const teaMetrics = calculateTeaCost({
      leafGrams: 5,
      teaPricePer100g: 60,
      infusionsCount: 5,
      waterWeightGramsPerInfusion: 100,
      teaRoomReferencePricePerPot: 25.0,
    });

    expect(teaMetrics.leafCost).toBe(3.0); // 5g * 0.60 zł = 3.00 zł
    expect(teaMetrics.totalSessionCost).toBeGreaterThan(3.0);
    expect(teaMetrics.costPerInfusion).toBeCloseTo(teaMetrics.totalSessionCost / 5, 2);
    expect(teaMetrics.savingsPerSession).toBeGreaterThan(20.0);
    expect(teaMetrics.savingsPercent).toBeGreaterThan(80);
  });

  test('TASK-P60-08-PRO: formatPlnCost bezpiecznie formatuje kwoty w PLN z ochrona przed -0 i NaN', () => {
    expect(formatPlnCost(3.5)).toBe('3.50 zł');
    expect(formatPlnCost(0)).toBe('0.00 zł');
    expect(formatPlnCost(-0)).toBe('0.00 zł');
    expect(formatPlnCost('4,25')).toBe('4.25 zł');
    expect(formatPlnCost(NaN)).toBe('0.00 zł');
    expect(formatPlnCost(null)).toBe('0.00 zł');
  });

  test('TASK-P65-08-PRO: formatCost bezpiecznie formatuje kwoty wielowalutowe (PLN, EUR, USD, GBP)', () => {
    expect(formatCost(3.5, 'PLN')).toBe('3.50 zł');
    expect(formatCost(3.5)).toBe('3.50 zł');
    expect(formatCost('4,20', 'EUR')).toBe('€4.20');
    expect(formatCost(12.5, 'USD')).toBe('$12.50');
    expect(formatCost(8.75, 'GBP')).toBe('£8.75');
    expect(formatCost(-5, 'EUR')).toBe('€0.00');
    expect(formatCost(-0, 'USD')).toBe('$0.00');
    expect(formatCost(NaN, 'GBP')).toBe('£0.00');
    expect(formatCost(null, 'PLN')).toBe('0.00 zł');
    expect(formatCost(undefined, 'EUR')).toBe('€0.00');
    expect(formatCost(15, 'UNKNOWN' as any)).toBe('15.00 zł');
  });
});
