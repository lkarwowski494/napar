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
export function calculateBrewCost(input: BrewCostInput): BrewCostMetrics {
  const dose = Math.max(0, input.doseGrams || 0);

  // Water volume in liters
  let waterLiters = input.waterLiters;
  if (waterLiters === undefined || waterLiters === null) {
    if (input.waterWeightGrams !== undefined && input.waterWeightGrams > 0) {
      waterLiters = input.waterWeightGrams / 1000;
    } else {
      waterLiters = 0.25; // 250ml default single cup
    }
  }
  waterLiters = Math.max(0, waterLiters);

  const beanPrice =
    input.beanPricePerKg !== undefined && input.beanPricePerKg >= 0
      ? input.beanPricePerKg
      : DEFAULT_BREW_COST_PARAMETERS.beanPricePerKg;

  const waterSaltsCost =
    input.waterSaltsCostPerLiter !== undefined && input.waterSaltsCostPerLiter >= 0
      ? input.waterSaltsCostPerLiter
      : DEFAULT_BREW_COST_PARAMETERS.waterSaltsCostPerLiter;

  const kettlePower =
    input.kettlePowerKw !== undefined && input.kettlePowerKw >= 0
      ? input.kettlePowerKw
      : DEFAULT_BREW_COST_PARAMETERS.kettlePowerKw;

  const boilMinutes =
    input.kettleBoilMinutes !== undefined && input.kettleBoilMinutes >= 0
      ? input.kettleBoilMinutes
      : DEFAULT_BREW_COST_PARAMETERS.kettleBoilMinutes;

  const electricityPrice =
    input.electricityPricePerKwh !== undefined && input.electricityPricePerKwh >= 0
      ? input.electricityPricePerKwh
      : DEFAULT_BREW_COST_PARAMETERS.electricityPricePerKwh;

  const filterCostVal =
    input.filterPaperCost !== undefined && input.filterPaperCost >= 0
      ? input.filterPaperCost
      : DEFAULT_BREW_COST_PARAMETERS.filterPaperCost;

  const cafePrice =
    input.cafeReferencePrice !== undefined && input.cafeReferencePrice >= 0
      ? input.cafeReferencePrice
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
    cafePrice > 0 ? Math.round((savingsPerCup / cafePrice) * 1000) / 10 : 0;

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
