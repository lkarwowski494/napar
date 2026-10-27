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

export interface TeaBrewCostInput {
  leafGrams?: number;
  teaPricePer100g?: number;
  infusionsCount?: number;
  waterWeightGramsPerInfusion?: number;
  waterLiters?: number;
  waterSaltsCostPerLiter?: number;
  kettlePowerKw?: number;
  kettleBoilMinutes?: number;
  electricityPricePerKwh?: number;
  teaRoomReferencePricePerPot?: number;
}

export interface TeaCostMetrics {
  leafCost: number;
  waterCost: number;
  electricityKwh: number;
  energyCost: number;
  totalSessionCost: number;
  costPerInfusion: number;
  teaRoomPrice: number;
  savingsPerSession: number;
  savingsPercent: number;
}

export const DEFAULT_TEA_COST_PARAMETERS = {
  leafGrams: 5.0, // 5g gongfu dose
  teaPricePer100g: 60.0, // 60 PLN / 100g artisan loose leaf tea
  infusionsCount: 5, // 5 standard infusions
  waterWeightGramsPerInfusion: 100, // 100ml gaiwan
  waterSaltsCostPerLiter: 0.05,
  kettlePowerKw: 2.0,
  kettleBoilMinutes: 2.5,
  electricityPricePerKwh: 1.15,
  teaRoomReferencePricePerPot: 24.0, // Benchmark price of artisan tea service
};

function roundGrosze(val: number): number {
  if (!Number.isFinite(val)) return 0;
  const res = Math.round(val * 100) / 100;
  return Object.is(res, -0) ? 0 : res;
}

/**
 * Bezpiecznie formatuje wartość w PLN (np. 3.5 -> '3.50 zł'), neutralizując NaN, -0 i liczby z przecinkiem.
 */
export function formatPlnCost(val: number | string | undefined | null): string {
  if (val === undefined || val === null) return '0.00 zł';
  const raw = typeof val === 'number' ? val : (typeof val === 'string' ? parseFloat(val.replace(',', '.')) : NaN);
  const safe = Number.isFinite(raw) && !Object.is(raw, -0) ? Math.max(0, raw) : 0;
  return `${safe.toFixed(2)} zł`;
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

/**
 * Oblicza koszt sesji herbaty (np. Gongfu Cha) z wieloma infuzjami oraz koszt pojedynczego zalania.
 */
export function calculateTeaCost(input?: TeaBrewCostInput): TeaCostMetrics {
  const safeInput = input || {};
  const leaf =
    safeInput.leafGrams !== undefined && Number.isFinite(safeInput.leafGrams) && safeInput.leafGrams > 0
      ? safeInput.leafGrams
      : DEFAULT_TEA_COST_PARAMETERS.leafGrams;

  const teaPrice =
    safeInput.teaPricePer100g !== undefined && Number.isFinite(safeInput.teaPricePer100g) && safeInput.teaPricePer100g >= 0
      ? safeInput.teaPricePer100g
      : DEFAULT_TEA_COST_PARAMETERS.teaPricePer100g;

  const rawInfusions =
    safeInput.infusionsCount !== undefined && Number.isFinite(safeInput.infusionsCount) && safeInput.infusionsCount >= 1
      ? Math.floor(safeInput.infusionsCount)
      : DEFAULT_TEA_COST_PARAMETERS.infusionsCount;
  const infusions = Math.max(1, rawInfusions);

  let totalWaterLiters: number;
  if (safeInput.waterLiters !== undefined && Number.isFinite(safeInput.waterLiters) && safeInput.waterLiters > 0) {
    totalWaterLiters = safeInput.waterLiters;
  } else if (
    safeInput.waterWeightGramsPerInfusion !== undefined &&
    Number.isFinite(safeInput.waterWeightGramsPerInfusion) &&
    safeInput.waterWeightGramsPerInfusion > 0
  ) {
    totalWaterLiters = (safeInput.waterWeightGramsPerInfusion * infusions) / 1000;
  } else {
    totalWaterLiters = (DEFAULT_TEA_COST_PARAMETERS.waterWeightGramsPerInfusion * infusions) / 1000;
  }

  const waterSaltsCost =
    safeInput.waterSaltsCostPerLiter !== undefined &&
    Number.isFinite(safeInput.waterSaltsCostPerLiter) &&
    safeInput.waterSaltsCostPerLiter >= 0
      ? safeInput.waterSaltsCostPerLiter
      : DEFAULT_TEA_COST_PARAMETERS.waterSaltsCostPerLiter;

  const kettlePower =
    safeInput.kettlePowerKw !== undefined && Number.isFinite(safeInput.kettlePowerKw) && safeInput.kettlePowerKw >= 0
      ? safeInput.kettlePowerKw
      : DEFAULT_TEA_COST_PARAMETERS.kettlePowerKw;

  const boilMinutes =
    safeInput.kettleBoilMinutes !== undefined &&
    Number.isFinite(safeInput.kettleBoilMinutes) &&
    safeInput.kettleBoilMinutes >= 0
      ? safeInput.kettleBoilMinutes
      : DEFAULT_TEA_COST_PARAMETERS.kettleBoilMinutes;

  const electricityPrice =
    safeInput.electricityPricePerKwh !== undefined &&
    Number.isFinite(safeInput.electricityPricePerKwh) &&
    safeInput.electricityPricePerKwh >= 0
      ? safeInput.electricityPricePerKwh
      : DEFAULT_TEA_COST_PARAMETERS.electricityPricePerKwh;

  const teaRoomPrice =
    safeInput.teaRoomReferencePricePerPot !== undefined &&
    Number.isFinite(safeInput.teaRoomReferencePricePerPot) &&
    safeInput.teaRoomReferencePricePerPot >= 0
      ? safeInput.teaRoomReferencePricePerPot
      : DEFAULT_TEA_COST_PARAMETERS.teaRoomReferencePricePerPot;

  // 1. Koszt liści herbaty
  const leafCost = roundGrosze(leaf * (teaPrice / 100));

  // 2. Koszt wody
  const waterCost = roundGrosze(totalWaterLiters * waterSaltsCost);

  // 3. Koszt energii
  const electricityKwh = Math.round((kettlePower * (boilMinutes / 60)) * 1000) / 1000;
  const energyCost = roundGrosze(electricityKwh * electricityPrice);

  // 4. Całkowity koszt sesji (herbata nie wymaga papierowych filtrów)
  const totalSessionCost = roundGrosze(leafCost + waterCost + energyCost);

  // 5. Koszt pojedynczej infuzji
  const costPerInfusion = roundGrosze(totalSessionCost / infusions);

  // 6. Porównanie z herbaciarnią
  const savingsPerSession = roundGrosze(Math.max(0, teaRoomPrice - totalSessionCost));
  const savingsPercent =
    teaRoomPrice > 0 ? Math.min(100, Math.max(0, Math.round((savingsPerSession / teaRoomPrice) * 1000) / 10)) : 0;

  return {
    leafCost,
    waterCost,
    electricityKwh,
    energyCost,
    totalSessionCost,
    costPerInfusion,
    teaRoomPrice: roundGrosze(teaRoomPrice),
    savingsPerSession,
    savingsPercent,
  };
}
