// ============================================================================
// Napar (Steepwise) — Craft Economics Engine: Cost Calculator (Zadanie N2)
// Calculates raw bean cost, mineralized water, kettle energy, filter paper
// and comparison against specialty coffee cafe benchmark.
// Apps4Brew Studio — 100% Offline-First, Zero Telemetry.
// ============================================================================

export interface BrewCostInput {
  doseGrams: number;
  waterWeightGrams?: number;
  waterLiters?: number;
  beanPricePerKg?: number;
  waterSaltsCostPerLiter?: number;
  kettlePowerKw?: number;
  kettleBoilMinutes?: number;
  electricityPricePerKwh?: number;
  filterPaperCost?: number;
  cafeReferencePrice?: number;
}

export interface BrewCostMetrics {
  coffeeCost: number;
  waterCost: number;
  electricityKwh: number;
  energyCost: number;
  filterCost: number;
  totalHomeCost: number;
  cafePrice: number;
  savingsPerCup: number;
  savingsPercent: number;
}

export const DEFAULT_BREW_COST_PARAMETERS = {
  beanPricePerKg: 260.0, // 65 PLN / 250g standard specialty coffee
  waterSaltsCostPerLiter: 0.05, // SCA / Barista Hustle mineral salts
  kettlePowerKw: 2.0, // 2000W electric gooseneck kettle
  kettleBoilMinutes: 3.0, // 3 minutes heating cycle
  electricityPricePerKwh: 1.15, // Domestic electricity tariff in Poland
  filterPaperCost: 0.25, // Hario V60 / Kalita / Chemex single filter
  cafeReferencePrice: 18.0, // Benchmark price of specialty filter cup in cafe
};

function roundGrosze(val: number): number {
  return Math.round(val * 100) / 100;
}

/**
 * Calculates itemized costs for a cup of coffee and monetary savings vs cafe.
 */
export function calculateBrewCost(input?: BrewCostInput): BrewCostMetrics {
  const safeInput = input || ({} as BrewCostInput);
  const dose =
    safeInput.doseGrams !== undefined && Number.isFinite(safeInput.doseGrams) && safeInput.doseGrams > 0
      ? safeInput.doseGrams
      : 0;

  // Water volume in liters
  let waterLiters: number;
  if (safeInput.waterLiters !== undefined && Number.isFinite(safeInput.waterLiters) && safeInput.waterLiters > 0) {
    waterLiters = safeInput.waterLiters;
  } else if (
    safeInput.waterWeightGrams !== undefined &&
    Number.isFinite(safeInput.waterWeightGrams) &&
    safeInput.waterWeightGrams > 0
  ) {
    waterLiters = safeInput.waterWeightGrams / 1000;
  } else {
    waterLiters = 0.25; // 250ml default single cup
  }

  const beanPrice =
    safeInput.beanPricePerKg !== undefined && Number.isFinite(safeInput.beanPricePerKg) && safeInput.beanPricePerKg >= 0
      ? safeInput.beanPricePerKg
      : DEFAULT_BREW_COST_PARAMETERS.beanPricePerKg;

  const waterSaltsCost =
    safeInput.waterSaltsCostPerLiter !== undefined &&
    Number.isFinite(safeInput.waterSaltsCostPerLiter) &&
    safeInput.waterSaltsCostPerLiter >= 0
      ? safeInput.waterSaltsCostPerLiter
      : DEFAULT_BREW_COST_PARAMETERS.waterSaltsCostPerLiter;

  const kettlePower =
    safeInput.kettlePowerKw !== undefined && Number.isFinite(safeInput.kettlePowerKw) && safeInput.kettlePowerKw >= 0
      ? safeInput.kettlePowerKw
      : DEFAULT_BREW_COST_PARAMETERS.kettlePowerKw;

  const boilMinutes =
    safeInput.kettleBoilMinutes !== undefined &&
    Number.isFinite(safeInput.kettleBoilMinutes) &&
    safeInput.kettleBoilMinutes >= 0
      ? safeInput.kettleBoilMinutes
      : DEFAULT_BREW_COST_PARAMETERS.kettleBoilMinutes;

  const electricityPrice =
    safeInput.electricityPricePerKwh !== undefined &&
    Number.isFinite(safeInput.electricityPricePerKwh) &&
    safeInput.electricityPricePerKwh >= 0
      ? safeInput.electricityPricePerKwh
      : DEFAULT_BREW_COST_PARAMETERS.electricityPricePerKwh;

  const filterCostVal =
    safeInput.filterPaperCost !== undefined &&
    Number.isFinite(safeInput.filterPaperCost) &&
    safeInput.filterPaperCost >= 0
      ? safeInput.filterPaperCost
      : DEFAULT_BREW_COST_PARAMETERS.filterPaperCost;

  const cafePrice =
    safeInput.cafeReferencePrice !== undefined &&
    Number.isFinite(safeInput.cafeReferencePrice) &&
    safeInput.cafeReferencePrice >= 0
      ? safeInput.cafeReferencePrice
      : DEFAULT_BREW_COST_PARAMETERS.cafeReferencePrice;

  // 1. Coffee cost
  const coffeeKg = dose / 1000;
  const coffeeCost = roundGrosze(coffeeKg * beanPrice);

  // 2. Mineralized water cost
  const waterCost = roundGrosze(waterLiters * waterSaltsCost);

  // 3. Kettle electrical energy: kWh = kW * (minutes / 60)
  const electricityKwh = Math.round((kettlePower * (boilMinutes / 60)) * 1000) / 1000;
  const energyCost = roundGrosze(electricityKwh * electricityPrice);

  // 4. Filter paper cost
  const filterCost = roundGrosze(filterCostVal);

  // 5. Total home preparation cost
  const totalHomeCost = roundGrosze(coffeeCost + waterCost + energyCost + filterCost);

  // 6. Savings comparison
  const savingsPerCup = roundGrosze(Math.max(0, cafePrice - totalHomeCost));
  const savingsPercent =
    cafePrice > 0 ? Math.min(100, Math.max(0, Math.round((savingsPerCup / cafePrice) * 1000) / 10)) : 0;

  return {
    coffeeCost,
    waterCost,
    electricityKwh,
    energyCost,
    filterCost,
    totalHomeCost,
    cafePrice: roundGrosze(cafePrice),
    savingsPerCup,
    savingsPercent,
  };
}
