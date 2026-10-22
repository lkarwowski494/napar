// ============================================================================
// Napar (Steepwise) — Wektory referencyjne: water-chemistry i cost-calculator (wartości liczone ręcznie)
// ============================================================================

import { calculateWaterMinerals, diagnoseWaterSensoryImpact, ppmCaCO3ToDegreesDH } from '../water-chemistry';
import { calculateBrewCost, DEFAULT_BREW_COST_PARAMETERS } from '../cost-calculator';

describe('water-chemistry: wzory z komentarzy (Barista Hustle: 1 g koncentratu / 1 L = 2 ppm)', () => {
  test('1 L, GH 80, KH 40: bufor = 40/2 = 20 g, twardość = 80/2 = 40 g', () => {
    const r = calculateWaterMinerals(1, 80, 40);
    expect(r.concentrateBufferGrams).toBe(20);
    expect(r.concentrateHardnessGrams).toBe(40);
  });

  test('1 L, GH 80, KH 40: suche sole NaHCO3 = 40*0,00168 = 0,067 g; MgSO4 = 80*0,002465 = 0,197 g; CaCl2 = 80*0,00147 = 0,118 g', () => {
    const r = calculateWaterMinerals(1, 80, 40);
    expect(r.dryBakingSodaNaHCO3Grams).toBe(0.067);
    expect(r.dryEpsomSaltMgSO4Grams).toBe(0.197);
    expect(r.dryCalciumChlorideCaCl2Grams).toBe(0.118);
  });

  test('0 L (poniżej minimum 0,1 L) traktowane jako 0,1 L; ujemne twardości jako 0: bufor = 40/2 * 0,1 = 2 g, GH = 0', () => {
    const r = calculateWaterMinerals(0, -5, 40);
    expect(r.waterVolumeLiters).toBe(0.1);
    expect(r.targetGhPpm).toBe(0);
    expect(r.concentrateBufferGrams).toBe(2);
    expect(r.concentrateHardnessGrams).toBe(0);
  });

  test('przeliczenie ppm CaCO3 na stopnie niemieckie: 17,848 ppm = 1 dH; 178,48 ppm = 10 dH', () => {
    expect(ppmCaCO3ToDegreesDH(17.848)).toBe(1);
    expect(ppmCaCO3ToDegreesDH(178.48)).toBe(10);
  });

  test('diagnoza sensoryczna: granice (KH 75 i GH 35/150 mieszczą się w złotym oknie)', () => {
    expect(diagnoseWaterSensoryImpact(150, 75).problemPl).toContain('Optymalny');
    expect(diagnoseWaterSensoryImpact(35, 20).problemPl).toContain('Optymalny');
  });
  test('diagnoza sensoryczna: KH 76 -> płaski napar; KH 19 -> agresywny; GH 34 -> cienkie body; GH 151 -> sucha gorycz', () => {
    expect(diagnoseWaterSensoryImpact(80, 76).problemPl).toContain('Płaski');
    expect(diagnoseWaterSensoryImpact(80, 19).problemPl).toContain('Agresywny');
    expect(diagnoseWaterSensoryImpact(34, 40).problemPl).toContain('Cienkie body');
    expect(diagnoseWaterSensoryImpact(151, 40).problemPl).toContain('sucha gorycz');
  });
});

describe('cost-calculator: wartości ręczne (15 g, domyślne ceny)', () => {
  // Ręcznie: kawa 0,015 kg * 260 zł/kg = 3,90 zł
  // woda 0,25 L * 0,05 zł/L = 0,0125 -> 0,01 zł
  // prąd: 2 kW * (3 min / 60) = 0,1 kWh; 0,1 * 1,15 zł = 0,115 -> 0,12 zł
  // filtr 0,25 zł; razem 3,90 + 0,01 + 0,12 + 0,25 = 4,28 zł
  // oszczędność: 18,00 - 4,28 = 13,72 zł; 13,72 / 18,00 = 76,2 %
  const r = calculateBrewCost({ doseGrams: 15 });

  test('pozycje kosztów', () => {
    expect(r.coffeeCost).toBe(3.9);
    expect(r.waterCost).toBe(0.01);
    expect(r.electricityKwh).toBe(0.1);
    expect(r.energyCost).toBe(0.12);
    expect(r.filterCost).toBe(0.25);
  });

  test('suma, oszczędność i procent', () => {
    expect(r.totalHomeCost).toBe(4.28);
    expect(r.cafePrice).toBe(18);
    expect(r.savingsPerCup).toBe(13.72);
    expect(r.savingsPercent).toBe(76.2);
  });

  test('stałe domyślne odpowiadają opisom w komentarzach: 65 zł / 250 g = 260 zł/kg', () => {
    expect(DEFAULT_BREW_COST_PARAMETERS.beanPricePerKg).toBe((65 / 250) * 1000);
  });

  test('waga wody podana w gramach: 300 g = 0,3 L * 0,05 = 0,015 -> 0,02 zł', () => {
    expect(calculateBrewCost({ doseGrams: 15, waterWeightGrams: 300 }).waterCost).toBe(0.02);
  });
});
