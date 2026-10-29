// ============================================================================
// Napar (Steepwise) — Core Domain Rules (RD-01…RD-30)
// Deterministic formulas for extraction, kinetics, water, and grind adjustments.
// ============================================================================

export interface ExtractionYieldResult {
  extractionYieldPercent: number;
  rating: 'under' | 'ideal' | 'over';
  descriptionPl: string;
  descriptionEn?: string;
}

export interface RestingWindowResult {
  daysSinceRoast: number;
  stage: 'degassing' | 'peak' | 'stable' | 'aging';
  messagePl: string;
  messageEn?: string;
  badgeColor: 'amber' | 'green' | 'blue' | 'gray';
}

export interface BedtimeCaffeineEvaluation {
  totalRemainingMg: number;
  safeThresholdMg: number;
  isSafeForSleep: boolean;
  messagePl: string;
  messageEn?: string;
}

export interface TasteDiagnosis {
  issue: string;
  issueEn?: string;
  recommendationPl: string;
  recommendationEn?: string;
  grindAdjustment?: 'finer' | 'coarser';
  tempAdjustment?: 'higher' | 'lower';
  steepTimeAdjustmentSeconds?: number;
}

export interface BeverageYieldResult {
  doseGrams: number;
  waterGrams: number;
  beverageGrams: number;
}

/**
 * RD-01: Proporcja parzenia (Brew Ratio)
 * Oblicza masę wody dla zadanej dozy i współczynnika (np. 1:16.6)
 * Zabezpieczenie przed przepełnieniem masy wody poprzez clamp maxWaterGrams (domyślnie 50000g)
 */
export function calculateBrewWater(doseGrams: number, ratio: number, maxWaterGrams = 50000.0): number {
  if (!Number.isFinite(doseGrams) || !Number.isFinite(ratio) || doseGrams <= 0 || ratio <= 0) {
    throw new Error('Doza i ratio muszą być większe od zera');
  }
  const rawWater = doseGrams * ratio;
  const safeMaxWater = Number.isFinite(maxWaterGrams) && maxWaterGrams > 0 ? maxWaterGrams : 50000.0;
  const clamped = Math.min(rawWater, safeMaxWater);
  return Number(clamped.toFixed(1));
}

/**
 * RD-01b: Oblicza dozę kawy/herbaty dla zadanej objętości wody
 * Zabezpieczenie przed przepełnieniem dozy poprzez clamp maxDoseGrams (domyślnie 1000g)
 */
export function calculateBrewDose(waterGrams: number, ratio: number, maxDoseGrams = 1000.0): number {
  if (!Number.isFinite(waterGrams) || !Number.isFinite(ratio) || waterGrams <= 0 || ratio <= 0) {
    throw new Error('Woda i ratio muszą być większe od zera');
  }
  const rawDose = waterGrams / ratio;
  const safeMaxDose = Number.isFinite(maxDoseGrams) && maxDoseGrams > 0 ? maxDoseGrams : 1000.0;
  const clamped = Math.min(rawDose, safeMaxDose);
  return Number(clamped.toFixed(1));
}

/**
 * RD-01c: Oblicza współczynnik ratio dla zadanej dozy i wody (np. 15g, 250g -> 16.7)
 * Zabezpieczenie przed astronomicznymi wartościami poprzez clamp maxRatio (domyślnie 100.0)
 */
export function calculateBrewRatio(doseGrams: number, waterGrams: number, maxRatio = 100.0): number {
  const parsedDose = typeof doseGrams === 'number' ? doseGrams : parseFloat(String(doseGrams));
  const parsedWater = typeof waterGrams === 'number' ? waterGrams : parseFloat(String(waterGrams));
  if (!Number.isFinite(parsedDose) || !Number.isFinite(parsedWater) || parsedDose <= 0 || parsedWater <= 0) {
    return 0;
  }
  const ratio = parsedWater / parsedDose;
  const safeMaxRatio = Number.isFinite(maxRatio) && maxRatio > 0 ? maxRatio : 100.0;
  let clamped = Math.min(ratio, safeMaxRatio);
  if (Object.is(clamped, -0) || clamped <= 0) clamped = 0;
  return Number(clamped.toFixed(1));
}

/**
 * RD-02: Absorpcja wody przez zmieloną kawę (Water Retention Index)
 * Domyślny współczynnik: 2.0g wody na każdy 1g zmielonej kawy
 */
export function calculateLiquidYield(
  waterGrams: number,
  doseGrams: number,
  retentionFactor = 2.0,
  maxRetentionFactor = 10.0
): number {
  const parsedWater = typeof waterGrams === 'number' ? waterGrams : parseFloat(String(waterGrams));
  const parsedDose = typeof doseGrams === 'number' ? doseGrams : parseFloat(String(doseGrams));
  const parsedRetention = typeof retentionFactor === 'number' ? retentionFactor : parseFloat(String(retentionFactor));
  if (!Number.isFinite(parsedWater) || !Number.isFinite(parsedDose) || !Number.isFinite(parsedRetention) || parsedWater <= 0 || parsedDose <= 0 || parsedRetention < 0) {
    throw new Error('Nieprawidłowe parametry wyliczania uzysku');
  }
  const safeRetention = Number.isFinite(maxRetentionFactor) && maxRetentionFactor > 0
    ? Math.min(parsedRetention, maxRetentionFactor)
    : parsedRetention;
  const retained = parsedDose * safeRetention;
  let yieldGrams = Math.max(0, parsedWater - retained);
  if (Object.is(yieldGrams, -0)) yieldGrams = 0;
  return Number(yieldGrams.toFixed(1));
}

/**
 * RD-02b: Odwrotna kalkulacja uzysku z uwzględnieniem retencji wody (Target Beverage Yield)
 * Oblicza potrzebną dozę suchą i całkowitą objętość wody, aby otrzymać zadaną objętość gotowego naparu w naczyniu.
 * Wzór: Beverage = Dose * (Ratio - RetentionFactor)  =>  Dose = Beverage / (Ratio - RetentionFactor)
 */
export function calculateDoseForBeverageYield(
  targetBeverageGrams: number | string,
  ratio: number | string = 16.0,
  retentionFactor: number | string = 2.0,
  maxDoseGrams = 1000.0,
  maxWaterGrams = 50000.0
): BeverageYieldResult {
  const parsedBev =
    typeof targetBeverageGrams === 'number'
      ? targetBeverageGrams
      : parseFloat(String(targetBeverageGrams).replace(/\uFEFF/g, '').replace(',', '.'));
  const parsedRatio =
    typeof ratio === 'number'
      ? ratio
      : parseFloat(String(ratio).replace(/\uFEFF/g, '').replace(',', '.'));
  const parsedRetention =
    typeof retentionFactor === 'number'
      ? retentionFactor
      : parseFloat(String(retentionFactor).replace(/\uFEFF/g, '').replace(',', '.'));

  if (
    !Number.isFinite(parsedBev) ||
    !Number.isFinite(parsedRatio) ||
    !Number.isFinite(parsedRetention) ||
    parsedBev <= 0 ||
    parsedRatio <= 0 ||
    parsedRetention < 0 ||
    parsedRatio <= parsedRetention
  ) {
    return { doseGrams: 0, waterGrams: 0, beverageGrams: 0 };
  }

  const effectiveRatio = parsedRatio - parsedRetention;
  const rawDose = parsedBev / effectiveRatio;
  const safeMaxDose = Number.isFinite(maxDoseGrams) && maxDoseGrams > 0 ? maxDoseGrams : 1000.0;
  const safeMaxWater = Number.isFinite(maxWaterGrams) && maxWaterGrams > 0 ? maxWaterGrams : 50000.0;

  let clampedDose = Math.min(rawDose, safeMaxDose);
  let rawWater = clampedDose * parsedRatio;
  let clampedWater = Math.min(rawWater, safeMaxWater);

  if (clampedWater < rawWater) {
    clampedDose = clampedWater / parsedRatio;
  }

  const finalDose = Number(clampedDose.toFixed(1));
  const finalWater = Number(clampedWater.toFixed(1));
  let finalBeverage = Math.max(0, finalWater - finalDose * parsedRetention);
  if (Object.is(finalBeverage, -0)) finalBeverage = 0;

  return {
    doseGrams: Object.is(finalDose, -0) ? 0 : finalDose,
    waterGrams: Object.is(finalWater, -0) ? 0 : finalWater,
    beverageGrams: Number(finalBeverage.toFixed(1)),
  };
}

/**
 * RD-03: Wydajność ekstrakcji (Extraction Yield - EY %)
 * EY = (Masa naparu * TDS%) / Doza sucha
 * Standard SCA Golden Cup: 18.0% - 22.0% [T:SCA-GOLDENCUP-EY]
 */
export function calculateExtractionYield(
  beverageWeightGrams: number,
  tdsPercent: number,
  doseGrams: number,
  maxTdsPercent = 30.0,
  maxBeverageGrams = 50000.0,
  maxEyPercent?: number
): ExtractionYieldResult {
  const parsedBev = typeof beverageWeightGrams === 'number' ? beverageWeightGrams : parseFloat(String(beverageWeightGrams));
  const parsedTds = typeof tdsPercent === 'number' ? tdsPercent : parseFloat(String(tdsPercent));
  const parsedDose = typeof doseGrams === 'number' ? doseGrams : parseFloat(String(doseGrams));
  if (!Number.isFinite(parsedBev) || !Number.isFinite(parsedTds) || !Number.isFinite(parsedDose) || parsedBev <= 0 || parsedTds <= 0 || parsedDose <= 0) {
    throw new Error('Parametry ekstrakcji muszą być większe od zera');
  }

  const safeTds = Number.isFinite(maxTdsPercent) && maxTdsPercent > 0 ? Math.min(parsedTds, maxTdsPercent) : parsedTds;
  const safeBeverage = Number.isFinite(maxBeverageGrams) && maxBeverageGrams > 0 ? Math.min(parsedBev, maxBeverageGrams) : parsedBev;
  let rawEy = (safeBeverage * safeTds) / parsedDose;
  if (Number.isFinite(maxEyPercent) && (maxEyPercent as number) > 0) {
    rawEy = Math.min(maxEyPercent as number, rawEy);
  }
  let ey = Number(rawEy.toFixed(2));
  if (Object.is(ey, -0)) ey = 0;

  let rating: 'under' | 'ideal' | 'over';
  let descriptionPl: string;
  let descriptionEn: string;

  if (ey < 18.0) {
    rating = 'under';
    descriptionPl = 'Niedoparzenie (Under-extracted) — dominacja kwasowości, brak słodyczy';
    descriptionEn = 'Under-extracted — sour acidity dominates, lacking sweetness';
  } else if (ey > 22.0) {
    rating = 'over';
    descriptionPl = 'Przeparzenie (Over-extracted) — suchość, posmak popiołowy i gorycz';
    descriptionEn = 'Over-extracted — harsh bitterness, dryness and astringency';
  } else {
    rating = 'ideal';
    descriptionPl = 'Zrównoważona ekstrakcja (Golden Cup) — pełna słodycz, czysty bukiet';
    descriptionEn = 'Balanced Golden Cup extraction — sweet, vibrant and clean';
  }

  return {
    extractionYieldPercent: ey,
    rating,
    descriptionPl,
    descriptionEn,
  };
}

/**
 * RD-07: Wskaźnik świeżości i okna degustacyjnego (Resting Window)
 * Dni od daty palenia:
 * 1-5: odgazowywanie CO2
 * 6-30: okno szczytowe (peak)
 * 31-60: stabilna dojrzałość
 * >60: utrata lotnych aromatów (aging)
 */
export function evaluateRestingWindow(roastDateInput: Date | string, currentDateInput?: Date | string): RestingWindowResult {
  if (!roastDateInput || (typeof roastDateInput === 'string' && !roastDateInput.trim())) {
    return {
      daysSinceRoast: 0,
      stage: 'degassing',
      messagePl: 'Brak daty palenia — świeżość nieznana',
      messageEn: 'No roast date — freshness unknown',
      badgeColor: 'gray',
    };
  }
  const roastDate = new Date(roastDateInput);
  const now = currentDateInput ? new Date(currentDateInput) : new Date();

  const roastTime = roastDate.getTime();
  const nowTime = now.getTime();
  if (!Number.isFinite(roastTime) || !Number.isFinite(nowTime)) {
    return {
      daysSinceRoast: 0,
      stage: 'degassing',
      messagePl: 'Nieprawidłowy format daty palenia',
      messageEn: 'Invalid roast date format',
      badgeColor: 'gray',
    };
  }

  const diffTime = Math.max(0, nowTime - roastTime);
  const rawDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const daysSinceRoast = Object.is(rawDays, -0) || rawDays <= 0 ? 0 : rawDays;

  if (daysSinceRoast <= 6) {
    return {
      daysSinceRoast,
      stage: 'degassing',
      messagePl: 'Zbyt świeża (Odgazowanie CO₂) — odczekaj do 7. dnia po wypale',
      messageEn: 'Too fresh (CO₂ degassing) — wait until day 7 post-roast',
      badgeColor: 'amber',
    };
  } else if (daysSinceRoast <= 35) {
    return {
      daysSinceRoast,
      stage: 'peak',
      messagePl: 'Szczyt smaku (Peak Flavor) — idealne okno ekstrakcji (7–35 dni)',
      messageEn: 'Peak flavor — ideal extraction window (7–35 days)',
      badgeColor: 'green',
    };
  } else if (daysSinceRoast <= 60) {
    return {
      daysSinceRoast,
      stage: 'stable',
      messagePl: 'Stabilna jakość ziaren (36–60 dni) — zmiel o 1 klik drobniej dla zachowania słodyczy',
      messageEn: 'Stable bean quality (36–60 days) — grind 1 click finer to preserve sweetness',
      badgeColor: 'blue',
    };
  } else {
    return {
      daysSinceRoast,
      stage: 'aging',
      messagePl: 'Ziarna tracą lotne aromaty (>60 dni) — zwiększ dozę lub zmiel o 1–2 kliki drobniej',
      messageEn: 'Aromatics fading (>60 days) — increase dose or grind 1–2 clicks finer',
      badgeColor: 'gray',
    };
  }
}

function parseNumeric(val: unknown): number {
  if (typeof val === 'number') {
    if (!Number.isFinite(val)) return NaN;
    return Object.is(val, -0) ? 0 : val;
  }
  if (typeof val === 'string') {
    const clean = val.replace(/[\x00-\x1F\x7F\uFEFF]/g, '').trim().replace(/,/g, '.');
    const m = clean.match(/^[+-]?\d+(?:\.\d+)?/);
    if (!m) return NaN;
    const num = parseFloat(m[0]);
    if (!Number.isFinite(num)) return NaN;
    return Object.is(num, -0) ? 0 : num;
  }
  return NaN;
}

/**
 * RD-17 & RD-18: Estymacja dawki kofeiny w filiżance kawy
 * Średnio 1g suchej Arabiki = 10.5 mg wyekstrahowanej kofeiny w przelewie
 * Robusta = 18.7 mg/g
 */
export function estimateCoffeeCaffeineMg(
  doseGrams: number | string,
  beanType: 'arabica' | 'robusta' = 'arabica',
  method: 'filter' | 'espresso' | 'immersion' | 'cold_brew' = 'filter'
): number {
  const parsedDose = parseNumeric(doseGrams);
  if (isNaN(parsedDose) || parsedDose <= 0) return 0;
  const safeDose = Math.min(1000, parsedDose);

  const normalizedBean = typeof beanType === 'string' && beanType.toLowerCase().trim() === 'robusta' ? 'robusta' : 'arabica';
  const normalizedMethod = typeof method === 'string' ? method.toLowerCase().trim() : 'filter';

  const baseRatePerGram = normalizedBean === 'robusta' ? 22.0 : 12.0;

  let extractionEfficiency = 0.88; // Domyślnie filtr/drip
  if (normalizedMethod === 'espresso') extractionEfficiency = 0.75;
  if (normalizedMethod === 'immersion') extractionEfficiency = 0.85;
  if (normalizedMethod === 'cold_brew') extractionEfficiency = 0.92;

  const totalMg = safeDose * baseRatePerGram * extractionEfficiency;
  const result = Number(totalMg.toFixed(1));
  return Object.is(result, -0) ? 0 : result;
}

/**
 * Szacuje całkowity ładunek kofeiny w suchych liściach herbaty (3.0% wagi suchej)
 */
export function estimateTotalLeafCaffeineMg(leafDoseGrams: number | string): number {
  const parsedDose = parseNumeric(leafDoseGrams);
  if (isNaN(parsedDose) || parsedDose <= 0) return 0;
  const safeDose = Math.min(1000, parsedDose);
  const result = Number((safeDose * 1000 * 0.03).toFixed(1));
  return Object.is(result, -0) ? 0 : result;
}

/**
 * RD-19: Uwalnianie kofeiny w wielokrotnych zalaniach herbaty Gongfu Cha
 * 1 zalanie: 45%, 2 zalanie: 30%, 3 zalanie: 15%, kolejne: 10% łącznie
 */
export function estimateTeaInfusionCaffeineMg(totalLeafCaffeineMg: number | string, infusionNumber: number | string): number {
  const parsedTotal = parseNumeric(totalLeafCaffeineMg);
  const parsedInfusion = parseNumeric(infusionNumber);
  if (isNaN(parsedTotal) || isNaN(parsedInfusion) || parsedTotal <= 0 || parsedInfusion <= 0) return 0;
  const fraction = 0.40 * Math.pow(0.55, parsedInfusion - 1);
  const result = Number((parsedTotal * fraction).toFixed(1));
  return Object.is(result, -0) ? 0 : result;
}

/**
 * RD-17: Farmakokinetyka eliminacji kofeiny (model jedno-kompartmentowy) [T:EFSA-CAFF-2015] [T:NEHLIG-CYP1A2-2018]
 * C(t) = C0 * (1/2)^(t / t1/2)
 */
export function calculateRemainingCaffeineMg(
  initialDoseMg: number | string,
  hoursPassed: number | string,
  halfLifeHours: number | string = 5.0
): number {
  const parsedDose = parseNumeric(initialDoseMg);
  const parsedHours = parseNumeric(hoursPassed);
  const parsedHalfLife = parseNumeric(halfLifeHours);

  if (
    isNaN(parsedDose) ||
    isNaN(parsedHours) ||
    isNaN(parsedHalfLife) ||
    parsedDose <= 0 ||
    parsedHours < 0 ||
    parsedHalfLife <= 0
  ) {
    return 0;
  }
  const remaining = parsedDose * Math.pow(0.5, parsedHours / parsedHalfLife);
  let result = Number(remaining.toFixed(1));
  if (Object.is(result, -0) || result <= 0) result = 0;
  return result;
}

/**
 * RD-20: Obliczenie stężenia kofeiny przed snem [T:DRAKE-SLEEP-2013]
 */
export function evaluateBedtimeCaffeine(
  intakes: Array<{ doseMg: number; hoursUntilBedtime: number }>,
  safeThresholdMg = 25.0,
  halfLifeHours = 5.0
): BedtimeCaffeineEvaluation {
  const safeIntakes = Array.isArray(intakes) ? intakes.filter(Boolean) : [];
  const safeThreshold = Number.isFinite(safeThresholdMg) && safeThresholdMg >= 0 ? Math.min(1000, safeThresholdMg) : 25.0;
  const safeHalfLife = Number.isFinite(halfLifeHours) && halfLifeHours > 0 ? Math.min(24, halfLifeHours) : 5.0;

  let totalRemaining = 0;

  for (const intake of safeIntakes) {
    if (intake && typeof intake === 'object') {
      const parsedHours = parseNumeric(intake.hoursUntilBedtime);
      const parsedDose = parseNumeric(intake.doseMg);
      if (!isNaN(parsedHours) && parsedHours >= 0 && !isNaN(parsedDose) && parsedDose > 0) {
        totalRemaining += calculateRemainingCaffeineMg(parsedDose, parsedHours, safeHalfLife);
      }
    }
  }

  totalRemaining = Number(totalRemaining.toFixed(1));
  if (Object.is(totalRemaining, -0) || totalRemaining < 0) totalRemaining = 0;
  const isSafeForSleep = totalRemaining <= safeThreshold;

  let messagePl: string;
  let messageEn: string;
  if (isSafeForSleep) {
    messagePl = `Szacowany poziom kofeiny o porze snu (${totalRemaining} mg) mieści się w orientacyjnym progu niskiego wpływu na sen.`;
    messageEn = `Estimated bedtime caffeine level (${totalRemaining} mg) is within the low sleep disruption threshold.`;
  } else {
    messagePl = `Poziom kofeiny (${totalRemaining} mg) przekracza próg ${safeThreshold} mg — ryzyko spłycenia snu.`;
    messageEn = `Bedtime caffeine level (${totalRemaining} mg) exceeds the ${safeThreshold} mg threshold — risk of light sleep.`;
  }

  return {
    totalRemainingMg: totalRemaining,
    safeThresholdMg: safeThreshold,
    isSafeForSleep,
    messagePl,
    messageEn,
  };
}

/**
 * RD-21: Oblicza minimalną liczbę godzin przed snem, po której można wypić daną dawkę
 */
export function calculateHoursUntilSafeCaffeine(
  doseMg: number | string,
  safeThresholdMg: number | string = 25.0,
  halfLifeHours: number | string = 5.0
): number {
  const parsedDose = parseNumeric(doseMg);
  const parsedThreshold = parseNumeric(safeThresholdMg);
  const parsedHalfLife = parseNumeric(halfLifeHours);

  if (
    isNaN(parsedDose) ||
    isNaN(parsedThreshold) ||
    isNaN(parsedHalfLife) ||
    parsedDose <= parsedThreshold ||
    parsedThreshold <= 0 ||
    parsedHalfLife <= 0
  ) {
    return 0;
  }
  const hours = parsedHalfLife * (Math.log(parsedDose / parsedThreshold) / Math.log(2));
  let result = Number(hours.toFixed(1));
  if (Object.is(result, -0) || result <= 0) result = 0;
  return result;
}

export interface TasteDiagnosis {
  issue: string;
  issueEn?: string;
  recommendationPl: string;
  recommendationEn?: string;
  grindAdjustment?: 'finer' | 'coarser';
  tempAdjustment?: 'higher' | 'lower';
  steepTimeAdjustmentSeconds?: number;
}

export interface BeverageYieldResult {
  doseGrams: number;
  waterGrams: number;
  beverageGrams: number;
}

/**
 * RD-05: Deterministyczny kompas ekstrakcji (Dial-in Doctor dla Kawy)
 */
export function diagnoseExtractionTaste(params: {
  isSour?: boolean;
  isBitter?: boolean;
  isAstringent?: boolean;
  isWatery?: boolean;
  isTooIntense?: boolean;
  beverageType?: 'COFFEE' | 'TEA';
  isScalded?: boolean;
}): TasteDiagnosis[] {
  if (params.beverageType === 'TEA') {
    return diagnoseTeaTaste({
      isBitterOrAstringent: params.isBitter || params.isAstringent,
      isWeakOrWatery: params.isWatery,
      isScaldedOrCooked: params.isScalded,
    });
  }

  const diagnoses: TasteDiagnosis[] = [];

  if (params.isSour) {
    diagnoses.push({
      issue: 'Zbyt kwaśna / cierpka (Niedoparzenie)',
      issueEn: 'Too sour / astringent (Under-extracted)',
      recommendationPl: 'Zmiel drobniej (np. -2 kliki na młynku) lub podwyższ temperaturę wody o 2°C, aby zwiększyć ekstrakcję cukrów.',
      recommendationEn: 'Grind finer (e.g. -2 clicks on grinder) or raise water temperature by 2°C to increase sweetness extraction.',
      grindAdjustment: 'finer',
      tempAdjustment: 'higher',
    });
  }

  if (params.isBitter || params.isAstringent) {
    diagnoses.push({
      issue: 'Gorzka / sucha w ustach (Przeparzenie)',
      issueEn: 'Bitter / dry mouthfeel (Over-extracted)',
      recommendationPl: 'Zmiel grubiej (np. +2 kliki na młynku) lub obniż temperaturę wody o 2-3°C, aby ograniczyć wymywanie tanin i gorzkich kwasów.',
      recommendationEn: 'Grind coarser (e.g. +2 clicks on grinder) or lower water temperature by 2-3°C to reduce harsh tannins.',
      grindAdjustment: 'coarser',
      tempAdjustment: 'lower',
    });
  }

  if (params.isWatery) {
    diagnoses.push({
      issue: 'Płaska / rozwodniona (Za niska doza lub za gruby przemiał)',
      issueEn: 'Flat / watery (Under-dosed or too coarse)',
      recommendationPl: 'Zwiększ dozę kawy o +1g lub zmniejsz współczynnik ratio (np. z 1:17 na 1:15.5).',
      recommendationEn: 'Increase coffee dose by +1g or tighten brew ratio (e.g. from 1:17 to 1:15.5).',
    });
  }

  if (params.isTooIntense) {
    diagnoses.push({
      issue: 'Zbyt ciężka / przytłaczająca',
      issueEn: 'Too heavy / overwhelming',
      recommendationPl: 'Wydłuż ratio (np. z 1:15 na 1:16.6) dodając więcej wody, by otworzyć bukiet aromatyczny.',
      recommendationEn: 'Lengthen brew ratio (e.g. from 1:15 to 1:16.6) with more water to open aromatic clarity.',
    });
  }

  return diagnoses;
}

/**
 * RD-05b: Deterministyczny kompas parzenia herbaty rzemieślniczej i Gongfu Cha
 */
export function diagnoseTeaTaste(params: {
  isBitterOrAstringent?: boolean;
  isWeakOrWatery?: boolean;
  isScaldedOrCooked?: boolean;
  teaType?: 'GREEN' | 'OOLONG' | 'BLACK' | 'PUERH' | 'WHITE';
}): TasteDiagnosis[] {
  const diagnoses: TasteDiagnosis[] = [];

  if (params.isScaldedOrCooked) {
    diagnoses.push({
      issue: 'Poparzone liście / ugotowany posmak (Za gorąca woda)',
      issueEn: 'Scalded leaves / cooked taste (Water too hot)',
      recommendationPl: 'Obniż temperaturę wody do 70–80°C dla zielonej/białej herbaty, aby chronić aminokwasy L-teaniny i zapobiec gorzkiemu wyciekowi katechin.',
      recommendationEn: 'Lower water temperature to 70-80°C for green/white tea to protect L-theanine amino acids and prevent bitter catechin leaching.',
      tempAdjustment: 'lower',
      steepTimeAdjustmentSeconds: -5,
    });
  }

  if (params.isBitterOrAstringent) {
    diagnoses.push({
      issue: 'Nadmierna ściągająca cierpkość (Zbyt długa infuzja lub za duża doza)',
      issueEn: 'Excessive astringent bitterness (Steep too long or dose too high)',
      recommendationPl: 'Skróć czas parzenia o 5–10 sekund w metodzie Gongfu Cha lub obniż temperaturę wody o 3–5°C.',
      recommendationEn: 'Shorten steep time by 5-10 seconds in Gongfu Cha or reduce water temperature by 3-5°C.',
      tempAdjustment: 'lower',
      steepTimeAdjustmentSeconds: -10,
    });
  }

  if (params.isWeakOrWatery) {
    diagnoses.push({
      issue: 'Zbyt wodnisty / brak głębi aromatu (Niedostateczna infuzja)',
      issueEn: 'Too watery / lack of aroma depth (Under-extracted infusion)',
      recommendationPl: 'Wydłuż czas parzenia o 10–15 sekund lub podnieś temperaturę wody o 3–5°C (szczególnie dla dojrzałych puerhów i oolongów skalnych).',
      recommendationEn: 'Lengthen steep time by 10-15 seconds or raise water temperature by 3-5°C (especially for aged puerh and rock oolong).',
      tempAdjustment: 'higher',
      steepTimeAdjustmentSeconds: 15,
    });
  }

  return diagnoses;
}

export const diagnoseTaste = diagnoseExtractionTaste;

export interface BatchScalingResult {
  multiplier: number;
  scaledDoseGrams: number;
  scaledWaterGrams: number;
  grindAdjustmentClicks: number;
  recommendationPl: string;
  recommendationEn: string;
}

/**
 * RD-06: Kalkulator Skalowania Porcji (Batch Scaling dla 1–4 osób)
 * Większy zasyp (np. 30–60g zamiast 15g) zwiększa głębokość złoża (bed depth) i opór hydrauliczny,
 * co wydłuża czas kontaktu (drawdown time). Wymaga to kompensacji grubszego mielenia (+2 do +4 klików),
 * aby zapobiec nadmiernej ekstrakcji, zatykaniu filtra i goryczy.
 */
export function calculateBatchScaling(
  baseDoseGrams: number,
  baseWaterGrams: number,
  servings: number,
  maxDoseGrams = 1000.0,
  maxWaterGrams = 50000.0
): BatchScalingResult {
  if (
    !Number.isFinite(baseDoseGrams) ||
    baseDoseGrams <= 0 ||
    !Number.isFinite(baseWaterGrams) ||
    baseWaterGrams <= 0
  ) {
    throw new Error('Doza bazowa i woda muszą być liczbami większymi od zera');
  }
  const safeServings = Number.isFinite(servings) ? servings : 1;
  const count = Math.max(1, Math.min(4, Math.round(safeServings)));
  const rawScaledDose = baseDoseGrams * count;
  const rawScaledWater = baseWaterGrams * count;
  const scaledDose = Number((Number.isFinite(maxDoseGrams) && maxDoseGrams > 0 ? Math.min(rawScaledDose, maxDoseGrams) : rawScaledDose).toFixed(1));
  const scaledWater = Number((Number.isFinite(maxWaterGrams) && maxWaterGrams > 0 ? Math.min(rawScaledWater, maxWaterGrams) : rawScaledWater).toFixed(1));

  let clicks = 0;
  let recPl = 'Domyślne mielenie dla pojedynczej porcji.';
  let recEn = 'Default grind setting for single serving.';

  if (count === 2) {
    clicks = 2;
    recPl = 'Zalecane +2 kliki grubiej ze względu na wyższe złoże kawy i dłuższy czas przepływu.';
    recEn = 'Recommended +2 clicks coarser due to deeper coffee bed and longer contact time.';
  } else if (count >= 3) {
    clicks = 4;
    recPl = `Zalecane +4 kliki grubiej dla dużej porcji (${count} os.) w celu uniknięcia przeparzenia i zapychania filtra.`;
    recEn = `Recommended +4 clicks coarser for large batch (${count} servings) to prevent over-extraction and stalling.`;
  }

  return {
    multiplier: count,
    scaledDoseGrams: scaledDose,
    scaledWaterGrams: scaledWater,
    grindAdjustmentClicks: clicks,
    recommendationPl: recPl,
    recommendationEn: recEn,
  };
}

/**
 * Farmakokinetyka eliminacji kofeiny: C(t) = C0 * 0.5^(t / t_half)
 */
export function calculateCaffeineDecay(
  initialMg: number | string,
  elapsedHours: number | string,
  halfLifeHours: number | string = 5.0
): number {
  const pInitial = parseNumeric(initialMg);
  const pElapsed = parseNumeric(elapsedHours);
  const pHalfLife = parseNumeric(halfLifeHours);
  if (
    isNaN(pInitial) ||
    isNaN(pElapsed) ||
    isNaN(pHalfLife) ||
    pInitial <= 0 ||
    pElapsed < 0 ||
    pHalfLife <= 0
  ) {
    return 0;
  }
  let res = Number((pInitial * Math.pow(0.5, pElapsed / pHalfLife)).toFixed(4));
  if (Object.is(res, -0) || res < 0) res = 0;
  return res;
}

export interface ScaledRecipeResult {
  multiplier: number;
  newDoseGrams: number;
  targetWaterGrams: number;
  steps: Array<{
    id: string;
    name: string;
    waterGrams: number;
    durationSeconds: number;
    instruction?: string;
  }>;
}

/**
 * Skaluje kroki zalewania receptury zachowując addytywność (suma kroków == targetWaterGrams)
 */
export function scaleRecipeDose<
  T extends { id: string; name: string; waterGrams: number; durationSeconds: number; instruction?: string }
>(steps: T[], originalDose: number, newDose: number, maxDoseGrams = 1000.0, maxWaterGrams = 50000.0): ScaledRecipeResult {
  if (
    !Array.isArray(steps) ||
    !Number.isFinite(originalDose) ||
    !Number.isFinite(newDose) ||
    originalDose <= 0 ||
    newDose <= 0
  ) {
    throw new Error('Doza musi być większa od zera');
  }
  const safeNewDose = Number.isFinite(maxDoseGrams) && maxDoseGrams > 0 ? Math.min(newDose, maxDoseGrams) : newDose;
  const factor = safeNewDose / originalDose;
  const originalWater = steps.reduce((sum, s) => sum + (s && Number.isFinite(s.waterGrams) && s.waterGrams > 0 ? s.waterGrams : 0), 0);
  const rawTargetWater = Number((originalWater * factor).toFixed(1));
  const safeMaxWater = Number.isFinite(maxWaterGrams) && maxWaterGrams > 0 ? maxWaterGrams : 50000.0;
  const targetWater = Math.min(safeMaxWater, rawTargetWater);

  let allocated = 0;
  const scaledSteps = steps.map((s, idx) => {
    if (idx === steps.length - 1) {
      const remaining = Math.max(0, Number((targetWater - allocated).toFixed(1)));
      return { ...s, waterGrams: remaining };
    }
    const safeStepWater = Number.isFinite(s.waterGrams) && s.waterGrams > 0 ? s.waterGrams : 0;
    const scaledWater = Math.max(0, Number((safeStepWater * factor).toFixed(1)));
    allocated += scaledWater;
    return { ...s, waterGrams: scaledWater };
  });

  return {
    multiplier: factor,
    newDoseGrams: safeNewDose,
    targetWaterGrams: targetWater,
    steps: scaledSteps,
  };
}

export interface BypassBrewParams {
  concentrateDoseGrams: number;
  concentrateWaterGrams: number;
  targetRatio?: number;
  targetTotalWaterGrams?: number;
  absorptionRatio?: number;
}

export interface BypassBrewResult {
  concentrateDoseGrams: number;
  concentrateWaterGrams: number;
  bypassWaterGrams: number;
  totalWaterGrams: number;
  effectiveRatio: number;
  estimatedBeverageYieldGrams: number;
}

/**
 * RD-25: Oblicza parametry rozcieńczania (Bypass Brewing)
 * np. dla Americano, Iced Filter, batch brew concentrate.
 */
export function calculateBypassBrew(params: BypassBrewParams): BypassBrewResult {
  if (!params || typeof params !== 'object') {
    throw new Error('Parametry bypass brew są wymagane');
  }

  const dose = Number(params.concentrateDoseGrams);
  const brewWater = Number(params.concentrateWaterGrams);

  if (!Number.isFinite(dose) || dose <= 0) {
    throw new Error('Doza koncentratu musi być większa od zera');
  }
  if (!Number.isFinite(brewWater) || brewWater <= 0) {
    throw new Error('Woda do zaparzenia koncentratu musi być większa od zera');
  }

  const absorption =
    params.absorptionRatio != null &&
    Number.isFinite(Number(params.absorptionRatio)) &&
    Number(params.absorptionRatio) >= 0
      ? Number(params.absorptionRatio)
      : 2.0;

  let totalWater = 0;

  if (params.targetTotalWaterGrams != null) {
    const targetWater = Number(params.targetTotalWaterGrams);
    if (!Number.isFinite(targetWater) || targetWater < brewWater) {
      throw new Error('Docelowa łączna ilość wody nie może być mniejsza niż woda do zaparzenia');
    }
    totalWater = targetWater;
  } else if (params.targetRatio != null) {
    const ratio = Number(params.targetRatio);
    if (!Number.isFinite(ratio) || ratio <= 0) {
      throw new Error('Docelowe ratio musi być większe od zera');
    }
    totalWater = dose * ratio;
    if (totalWater < brewWater) {
      throw new Error('Docelowe ratio dałoby mniej wody niż zaparzono w koncentracie');
    }
  } else {
    throw new Error('Wymagane jest targetRatio lub targetTotalWaterGrams');
  }

  const bypassWater = Math.max(0, totalWater - brewWater);
  const effectiveRatio = dose > 0 ? Number((totalWater / dose).toFixed(2)) : 0;
  const retainedWater = dose * absorption;
  const rawBeverageYield = totalWater - retainedWater;
  const beverageYield = Object.is(rawBeverageYield, -0) || rawBeverageYield <= 0
    ? 0
    : Number(rawBeverageYield.toFixed(1));

  return {
    concentrateDoseGrams: Number(dose.toFixed(1)),
    concentrateWaterGrams: Number(brewWater.toFixed(1)),
    bypassWaterGrams: Number(bypassWater.toFixed(1)),
    totalWaterGrams: Number(totalWater.toFixed(1)),
    effectiveRatio,
    estimatedBeverageYieldGrams: beverageYield,
  };
}





export interface EspressoFlowRateEvaluation {
  flowRateGps: number;
  status: 'too_slow' | 'optimal' | 'too_fast';
  labelPl: string;
  labelEn: string;
  diagnosisPl: string;
  diagnosisEn: string;
}

/**
 * RD-26: Oblicza średnią prędkość przepływu espresso (g/s).
 */
export function calculateEspressoFlowRate(
  beverageYieldGrams: number | string,
  brewTimeSeconds: number | string
): number {
  const yieldG =
    typeof beverageYieldGrams === 'number'
      ? beverageYieldGrams
      : typeof beverageYieldGrams === 'string'
      ? parseFloat(beverageYieldGrams.replace(/\uFEFF/g, '').replace(',', '.').trim())
      : NaN;

  const timeS =
    typeof brewTimeSeconds === 'number'
      ? brewTimeSeconds
      : typeof brewTimeSeconds === 'string'
      ? parseFloat(brewTimeSeconds.replace(/\uFEFF/g, '').replace(',', '.').trim())
      : NaN;

  if (
    !Number.isFinite(yieldG) ||
    !Number.isFinite(timeS) ||
    yieldG <= 0 ||
    timeS <= 0 ||
    Object.is(yieldG, -0) ||
    Object.is(timeS, -0)
  ) {
    return 0;
  }

  const rate = yieldG / timeS;
  return Number(rate.toFixed(2));
}

/**
 * RD-27: Klasyfikuje przepływ espresso w celu diagnozy ekstrakcji.
 * Standard specialty espresso: 1.0 - 1.8 g/s (typowo 36g w 25-30s = 1.2-1.4 g/s).
 */
export function classifyEspressoFlowRate(
  flowRateGps: number | string
): EspressoFlowRateEvaluation {
  const rate =
    typeof flowRateGps === 'number'
      ? flowRateGps
      : typeof flowRateGps === 'string'
      ? parseFloat(flowRateGps.replace(/\uFEFF/g, '').replace(',', '.').trim())
      : NaN;

  const safeRate = Number.isFinite(rate) && rate > 0 && !Object.is(rate, -0) ? rate : 0;
  const roundedRate = Number(safeRate.toFixed(2));

  if (roundedRate < 1.0) {
    return {
      flowRateGps: roundedRate,
      status: 'too_slow',
      labelPl: 'Zbyt wolny (dławienie)',
      labelEn: 'Too Slow (Restricted)',
      diagnosisPl: 'Kawa wypływa zbyt wolno; ryzyko przeparzenia i goryczy. Zmiel grubiej.',
      diagnosisEn: 'Flow is choked; risk of over-extraction and bitterness. Grind coarser.',
    };
  }

  if (roundedRate > 1.8) {
    return {
      flowRateGps: roundedRate,
      status: 'too_fast',
      labelPl: 'Zbyt szybki (gushing)',
      labelEn: 'Too Fast (Gushing)',
      diagnosisPl:
        'Kawa wypływa zbyt gwałtownie; ryzyko niedoparzenia i kwasowości. Zmiel drobniej lub popraw dystrybucję (WDT).',
      diagnosisEn:
        'Flow is rushing; risk of under-extraction and sourness. Grind finer or improve distribution (WDT).',
    };
  }

  return {
    flowRateGps: roundedRate,
    status: 'optimal',
    labelPl: 'Optymalny',
    labelEn: 'Optimal',
    diagnosisPl: 'Wzorcowe tempo ekstrakcji espresso w stylu specialty.',
    diagnosisEn: 'Standard specialty espresso extraction flow rate.',
  };
}

export type BrewMatrixQuadrant =
  | 'weak_under'
  | 'balanced_under'
  | 'strong_under'
  | 'weak_ideal'
  | 'golden_cup'
  | 'strong_ideal'
  | 'weak_over'
  | 'balanced_over'
  | 'strong_over';

export interface BrewMatrixEvaluation {
  eyPercent: number;
  tdsPercent: number;
  quadrant: BrewMatrixQuadrant;
  labelPl: string;
  labelEn: string;
  recommendationPl: string;
  recommendationEn: string;
}

/**
 * Diagnozuje ekstrakcję na 9-kwadrantowej macierzy SCA Brewing Control Chart
 * w relacji uzysku (EY%) do siły naparu (TDS%).
 */
export function evaluateBrewMatrix(
  eyPercent: number | string,
  tdsPercent: number | string
): BrewMatrixEvaluation {
  const parseVal = (v: unknown): number => {
    if (typeof v === 'number') return Number.isFinite(v) && !Object.is(v, -0) ? Math.max(0, v) : 0;
    if (typeof v === 'string') {
      const parsed = parseFloat(v.replace(/\uFEFF/g, '').replace(',', '.').trim());
      return Number.isFinite(parsed) && !Object.is(parsed, -0) ? Math.max(0, parsed) : 0;
    }
    return 0;
  };

  const ey = Number(parseVal(eyPercent).toFixed(2));
  const tds = Number(parseVal(tdsPercent).toFixed(2));

  let quadrant: BrewMatrixQuadrant;
  let labelPl: string;
  let labelEn: string;
  let recommendationPl: string;
  let recommendationEn: string;

  const isUnder = ey < 18.0;
  const isOver = ey > 22.0;
  const isWeak = tds < 1.15;
  const isStrong = tds > 1.45;

  if (isUnder) {
    if (isWeak) {
      quadrant = 'weak_under';
      labelPl = 'Słaby i niedoparzony';
      labelEn = 'Weak & Under-extracted';
      recommendationPl = 'Zwiększ dozę (lub zmniejsz wodę) i zmiel drobniej.';
      recommendationEn = 'Increase coffee dose (or reduce water) and grind finer.';
    } else if (isStrong) {
      quadrant = 'strong_under';
      labelPl = 'Mocny i niedoparzony';
      labelEn = 'Strong & Under-extracted';
      recommendationPl = 'Zmniejsz dozę (więcej wody na gram kawy) i zmiel drobniej.';
      recommendationEn = 'Reduce dose (higher brew ratio) and grind finer.';
    } else {
      quadrant = 'balanced_under';
      labelPl = 'Zrównoważona moc, niedoparzony';
      labelEn = 'Balanced Strength, Under-extracted';
      recommendationPl = 'Zmiel drobniej lub podnieś temperaturę wody, aby zwiększyć ekstrakcję.';
      recommendationEn = 'Grind finer or increase water temperature to extract more.';
    }
  } else if (isOver) {
    if (isWeak) {
      quadrant = 'weak_over';
      labelPl = 'Słaby i przeparzony';
      labelEn = 'Weak & Over-extracted';
      recommendationPl = 'Zwiększ dozę kawy i zmiel grubiej, aby uniknąć goryczy i cierpkości.';
      recommendationEn = 'Increase coffee dose and grind coarser to eliminate bitterness.';
    } else if (isStrong) {
      quadrant = 'strong_over';
      labelPl = 'Mocny i przeparzony';
      labelEn = 'Strong & Over-extracted';
      recommendationPl = 'Zmniejsz dozę kawy i zmiel wyraźnie grubiej.';
      recommendationEn = 'Decrease dose and grind coarser.';
    } else {
      quadrant = 'balanced_over';
      labelPl = 'Zrównoważona moc, przeparzony';
      labelEn = 'Balanced Strength, Over-extracted';
      recommendationPl = 'Zmiel grubiej lub obniż temperaturę wody, aby zredukować cierpkość i posmak popiołowy.';
      recommendationEn = 'Grind coarser or lower water temperature to tame bitterness and dryness.';
    }
  } else {
    // Ideal EY
    if (isWeak) {
      quadrant = 'weak_ideal';
      labelPl = 'Słaby, lecz zrównoważony';
      labelEn = 'Weak & Balanced';
      recommendationPl = 'Ekstrakcja jest poprawna, lecz napar jest zbyt wodnisty. Zwiększ dozę kawy zachowując stopień mielenia.';
      recommendationEn = 'Extraction is balanced but beverage is watery. Increase dose keeping grind size.';
    } else if (isStrong) {
      quadrant = 'strong_ideal';
      labelPl = 'Mocny, lecz zrównoważony';
      labelEn = 'Strong & Balanced';
      recommendationPl = 'Bardzo intensywny, pełny napar. Jeśli wolisz lżejszy profil, zwiększ proporcję wody.';
      recommendationEn = 'Rich, intense cup. If you prefer a lighter brew, increase water ratio slightly.';
    } else {
      quadrant = 'golden_cup';
      labelPl = 'SCA Golden Cup (Idealny)';
      labelEn = 'SCA Golden Cup (Ideal)';
      recommendationPl = 'Wzorcowy profil ekstrakcji — optymalna słodycz, zbalansowana kwasowość i pełne body.';
      recommendationEn = 'Target extraction profile — optimal sweetness, balanced acidity and clarity.';
    }
  }

  return {
    eyPercent: ey,
    tdsPercent: tds,
    quadrant,
    labelPl,
    labelEn,
    recommendationPl,
    recommendationEn,
  };
}

export type EspressoRatioStyle = 'ristretto' | 'normale' | 'lungo' | 'allonge';

export interface EspressoRatioEvaluation {
  doseGrams: number;
  yieldGrams: number;
  ratio: number;
  ratioFormatted: string;
  style: EspressoRatioStyle;
  styleLabelPl: string;
  styleLabelEn: string;
  sensoryExpectationPl: string;
  sensoryExpectationEn: string;
}

/**
 * Klasyfikuje proporcję espresso (in-to-out ratio) i określa styl oraz profil sensoryczny
 * naparu (Ristretto <= 1:1.5, Normale 1:1.6 - 1:2.4, Lungo 1:2.5 - 1:3.5, Allongé > 1:3.5).
 */
export function evaluateEspressoRatio(
  doseGrams: number | string,
  yieldGrams: number | string
): EspressoRatioEvaluation {
  const parseVal = (v: unknown): number => {
    if (typeof v === 'number') return Number.isFinite(v) && !Object.is(v, -0) ? Math.max(0, v) : 0;
    if (typeof v === 'string') {
      const parsed = parseFloat(v.replace(/\uFEFF/g, '').replace(',', '.').trim());
      return Number.isFinite(parsed) && !Object.is(parsed, -0) ? Math.max(0, parsed) : 0;
    }
    return 0;
  };

  const dose = parseVal(doseGrams);
  const liquid = parseVal(yieldGrams);

  let rawRatio = 0;
  if (dose > 0 && liquid > 0) {
    rawRatio = liquid / dose;
  }

  const ratio = Number(rawRatio.toFixed(2));
  const ratioFormatted = `1:${ratio.toFixed(1)}`;

  let style: EspressoRatioStyle;
  let styleLabelPl: string;
  let styleLabelEn: string;
  let sensoryExpectationPl: string;
  let sensoryExpectationEn: string;

  if (ratio <= 1.5) {
    style = 'ristretto';
    styleLabelPl = 'Ristretto';
    styleLabelEn = 'Ristretto';
    sensoryExpectationPl = 'Skoncentrowany napar, gęste body, wysoka słodycz z dominacją nut kwasowych i zredukowaną goryczą.';
    sensoryExpectationEn = 'Concentrated shot, thick syrupy body, high sweetness with upfront acidity and low bitterness.';
  } else if (ratio <= 2.4) {
    style = 'normale';
    styleLabelPl = 'Normale (Standard)';
    styleLabelEn = 'Normale (Standard)';
    sensoryExpectationPl = 'Klasyczne zrównoważone espresso — optymalna harmonia słodyczy, kwasowości, aksamitnej cremy i czystego finiszu.';
    sensoryExpectationEn = 'Classic balanced espresso — optimal harmony of sweetness, acidity, velvety crema and clean finish.';
  } else if (ratio <= 3.5) {
    style = 'lungo';
    styleLabelPl = 'Lungo';
    styleLabelEn = 'Lungo';
    sensoryExpectationPl = 'Wydłużona ekstrakcja, lżejsze body, wyraźniejsza goryczka i nuty prażone przy wyższym uzysku rozpuszczalnych cząstek.';
    sensoryExpectationEn = 'Extended extraction, lighter body, more pronounced roast and bitter notes with higher total extraction.';
  } else {
    style = 'allonge';
    styleLabelPl = 'Allongé / Café Crème';
    styleLabelEn = 'Allongé / Long Shot';
    sensoryExpectationPl = 'Bardzo długa ekstrakcja o profilu zbliżonym do kawy przelewowej, wysoka przejrzystość i niska intensywność.';
    sensoryExpectationEn = 'Very long shot approaching drip coffee clarity, high volume and low concentration.';
  }

  return {
    doseGrams: dose,
    yieldGrams: liquid,
    ratio,
    ratioFormatted,
    style,
    styleLabelPl,
    styleLabelEn,
    sensoryExpectationPl,
    sensoryExpectationEn,
  };
}

export type ColdBrewStyle = 'concentrate' | 'ready_to_drink' | 'underextracted_weak' | 'overly_dense';

export interface ColdBrewRatioEvaluation {
  doseGrams: number;
  waterGrams: number;
  ratio: number;
  ratioFormatted: string;
  style: ColdBrewStyle;
  styleLabelPl: string;
  styleLabelEn: string;
  recommendedDilutionPl: string;
  recommendedDilutionEn: string;
  sensoryDescriptionPl: string;
  sensoryDescriptionEn: string;
}

/**
 * Klasyfikuje proporcję maceracji Cold Brew (woda:kawa) i określa profil naparu
 * (overly_dense < 1:3.5, concentrate 1:3.5 - 1:7.5, ready_to_drink 1:7.5 - 1:15, underextracted_weak > 1:15).
 */
export function evaluateColdBrewRatio(
  doseGrams: number | string,
  waterGrams: number | string
): ColdBrewRatioEvaluation {
  const parseVal = (v: unknown): number => {
    if (typeof v === 'number') return Number.isFinite(v) && !Object.is(v, -0) ? Math.max(0, v) : 0;
    if (typeof v === 'string') {
      const parsed = parseFloat(v.replace(/\uFEFF/g, '').replace(',', '.').trim());
      return Number.isFinite(parsed) && !Object.is(parsed, -0) ? Math.max(0, parsed) : 0;
    }
    return 0;
  };

  const dose = parseVal(doseGrams);
  const water = parseVal(waterGrams);

  let rawRatio = 0;
  if (dose > 0 && water > 0) {
    rawRatio = water / dose;
  }

  const ratio = Number(rawRatio.toFixed(2));
  const ratioFormatted = `1:${ratio.toFixed(1)}`;

  let style: ColdBrewStyle;
  let styleLabelPl: string;
  let styleLabelEn: string;
  let recommendedDilutionPl: string;
  let recommendedDilutionEn: string;
  let sensoryDescriptionPl: string;
  let sensoryDescriptionEn: string;

  if (ratio <= 0 || ratio < 3.5) {
    style = 'overly_dense';
    styleLabelPl = 'Zbyt gęsty ekstrakt / zawiesina';
    styleLabelEn = 'Overly dense / muddy slurry';
    recommendedDilutionPl = 'Wymaga znacznego rozcieńczenia (1:2 lub więcej) i odfiltrowania drobinek.';
    recommendedDilutionEn = 'Requires heavy dilution (1:2 or higher) and fine filtration.';
    sensoryDescriptionPl = 'Skrajnie intensywny, lepki ekstrakt o wysokim stężeniu pyłu i olejków.';
    sensoryDescriptionEn = 'Extremely intense, viscous extract with high suspended solids and oils.';
  } else if (ratio <= 7.5) {
    style = 'concentrate';
    styleLabelPl = 'Koncentrat Cold Brew';
    styleLabelEn = 'Cold Brew Concentrate';
    recommendedDilutionPl = 'Rozcieńcz 1:1 z wodą, mlekiem, napojem owsianym lub tonikiem z lodem.';
    recommendedDilutionEn = 'Dilute 1:1 with fresh water, milk, oat drink, or tonic with ice.';
    sensoryDescriptionPl = 'Mocny, głęboki napar o czekoladowo-orzechowym profilu, doskonały jako baza do napojów.';
    sensoryDescriptionEn = 'Rich, deep infusion with chocolate and nutty profile, ideal beverage base.';
  } else if (ratio <= 15.0) {
    style = 'ready_to_drink';
    styleLabelPl = 'Gotowe do picia (RTD)';
    styleLabelEn = 'Ready-to-drink (RTD)';
    recommendedDilutionPl = 'Bez rozcieńczania; podawaj bezpośrednio z kostkami lodu.';
    recommendedDilutionEn = 'No dilution needed; serve chilled straight over ice.';
    sensoryDescriptionPl = 'Aksamitna, gładka kawa o naturalnej słodyczy, zbalansowanej kwasowości i orzeźwiającym finiszu.';
    sensoryDescriptionEn = 'Velvety smooth coffee with natural sweetness, mellow acidity, and refreshing finish.';
  } else {
    style = 'underextracted_weak';
    styleLabelPl = 'Rozwodnione Cold Brew';
    styleLabelEn = 'Dilute / weak Cold Brew';
    recommendedDilutionPl = 'Brak potrzeby rozcieńczania; w przyszłości zredukuj ilość wody.';
    recommendedDilutionEn = 'No dilution needed; reduce water volume for future batches.';
    sensoryDescriptionPl = 'Lekki, cienki napar o niskiej intensywności smaku i braku wyrazistego body.';
    sensoryDescriptionEn = 'Light, thin cup with low flavor intensity and lack of body.';
  }

  return {
    doseGrams: dose,
    waterGrams: water,
    ratio,
    ratioFormatted,
    style,
    styleLabelPl,
    styleLabelEn,
    recommendedDilutionPl,
    recommendedDilutionEn,
    sensoryDescriptionPl,
    sensoryDescriptionEn,
  };
}


export type PourOverRatioStyle =
  | 'strong_dense'
  | 'balanced_specialty'
  | 'light_delicate'
  | 'overly_dilute';

export interface PourOverRatioEvaluation {
  doseGrams: number;
  waterGrams: number;
  ratio: number;
  ratioFormatted: string;
  style: PourOverRatioStyle;
  styleLabelPl: string;
  styleLabelEn: string;
  sensoryExpectationPl: string;
  sensoryExpectationEn: string;
}

/**
 * Klasyfikuje proporcję metod przelewowych pour-over (V60, Chemex, Kalita Wave, Origami itp.)
 * i określa styl oraz profil sensoryczny naparu (Strong < 1:14, Balanced 1:14 - 1:17, Light 1:17 - 1:19, Dilute > 1:19).
 */
export function evaluatePourOverRatio(
  doseGrams: number | string,
  waterGrams: number | string
): PourOverRatioEvaluation {
  const parseVal = (v: unknown): number => {
    if (typeof v === 'number') return Number.isFinite(v) && !Object.is(v, -0) ? Math.max(0, v) : 0;
    if (typeof v === 'string') {
      const parsed = parseFloat(v.replace(/\uFEFF/g, '').replace(',', '.').trim());
      return Number.isFinite(parsed) && !Object.is(parsed, -0) ? Math.max(0, parsed) : 0;
    }
    return 0;
  };

  const dose = parseVal(doseGrams);
  const water = parseVal(waterGrams);

  let rawRatio = 0;
  if (dose > 0 && water > 0) {
    rawRatio = water / dose;
  }

  const ratio = Number(rawRatio.toFixed(2));
  const ratioFormatted = `1:${ratio.toFixed(1)}`;

  let style: PourOverRatioStyle;
  let styleLabelPl: string;
  let styleLabelEn: string;
  let sensoryExpectationPl: string;
  let sensoryExpectationEn: string;

  if (ratio <= 0 || ratio < 14.0) {
    style = 'strong_dense';
    styleLabelPl = 'Skoncentrowany / Mocny';
    styleLabelEn = 'Strong / Concentrated';
    sensoryExpectationPl = 'Wysoka intensywność, gęste body, wyczuwalne nuty kwasowe i słodycz, ale ryzyko niedoekstrakcji.';
    sensoryExpectationEn = 'High intensity, heavy body, pronounced acidity and sweetness, but risk of under-extraction.';
  } else if (ratio <= 17.0) {
    style = 'balanced_specialty';
    styleLabelPl = 'Zrównoważone Specialty';
    styleLabelEn = 'Balanced Specialty';
    sensoryExpectationPl = 'Złoty standard parzenia specialty — czyste nuty terroir, wyrazista kwasowość owocowa, słodycz i gładki finisz.';
    sensoryExpectationEn = 'Golden standard for specialty coffee — clean origin notes, vibrant fruit acidity, sweetness and smooth finish.';
  } else if (ratio <= 19.0) {
    style = 'light_delicate';
    styleLabelPl = 'Lekki / Herbaciany';
    styleLabelEn = 'Light / Tea-like';
    sensoryExpectationPl = 'Lekkie, zwiewne body w stylu skandynawskim, uwypuklona przejrzystość nut kwiatowych i owocowych.';
    sensoryExpectationEn = 'Light, airy tea-like body in Nordic style, highlighting delicate floral and fruity nuances.';
  } else {
    style = 'overly_dilute';
    styleLabelPl = 'Rozwodniony / Wodnisty';
    styleLabelEn = 'Overly Dilute / Watery';
    sensoryExpectationPl = 'Płaski, rozwodniony napar o niskiej intensywności smaku, podatny na nadmierną ekstrakcję goryczy z pyłu.';
    sensoryExpectationEn = 'Flat, thin watery cup with muted sweetness and risk of astringent over-extracted fines.';
  }

  return {
    doseGrams: dose,
    waterGrams: water,
    ratio,
    ratioFormatted,
    style,
    styleLabelPl,
    styleLabelEn,
    sensoryExpectationPl,
    sensoryExpectationEn,
  };
}


export type FrenchPressRatioStyle =
  | 'rich_heavy'
  | 'balanced_immersion'
  | 'light_clean'
  | 'overly_thin';

export interface FrenchPressRatioEvaluation {
  doseGrams: number;
  waterGrams: number;
  ratio: number;
  ratioFormatted: string;
  style: FrenchPressRatioStyle;
  styleLabelPl: string;
  styleLabelEn: string;
  sensoryExpectationPl: string;
  sensoryExpectationEn: string;
}

/**
 * Ocenia proporcję parzenia dla metody immersyjnej French Press (praska francuska),
 * kategoryzując styl naparu oraz dostarczając precyzyjne deskryptory sensoryczne.
 */
export function evaluateFrenchPressRatio(
  doseGrams: number | string,
  waterGrams: number | string
): FrenchPressRatioEvaluation {
  const parseVal = (v: unknown): number => {
    if (typeof v === 'number') {
      return Number.isFinite(v) && v > 0 && !Object.is(v, -0) ? v : 0;
    }
    if (typeof v === 'string') {
      const parsed = parseFloat(v.replace(/\uFEFF/g, '').replace(',', '.').trim());
      return Number.isFinite(parsed) && parsed > 0 && !Object.is(parsed, -0) ? parsed : 0;
    }
    return 0;
  };

  const dose = parseVal(doseGrams);
  const water = parseVal(waterGrams);

  let rawRatio = 0;
  if (dose > 0 && water > 0) {
    rawRatio = water / dose;
  }

  const ratio = Number(rawRatio.toFixed(2));
  const ratioFormatted = `1:${ratio.toFixed(1)}`;

  let style: FrenchPressRatioStyle;
  let styleLabelPl: string;
  let styleLabelEn: string;
  let sensoryExpectationPl: string;
  let sensoryExpectationEn: string;

  if (ratio <= 0 || ratio < 14.0) {
    style = 'rich_heavy';
    styleLabelPl = 'Gęsty / Bardzo intensywny';
    styleLabelEn = 'Rich / Very Heavy';
    sensoryExpectationPl = 'Bardzo gęste, oleiste body, niska klarowność, mocna słodycz i akcenty gorzkiej czekolady.';
    sensoryExpectationEn = 'Very rich, oily heavy body, low clarity, intense sweetness and dark chocolate notes.';
  } else if (ratio <= 16.5) {
    style = 'balanced_immersion';
    styleLabelPl = 'Zrównoważona immersja';
    styleLabelEn = 'Balanced Immersion';
    sensoryExpectationPl = 'Klasyczny złoty standard praski francuskiej — pełne, kremowe body, wysoka słodycz karmelowa i gładki finisz.';
    sensoryExpectationEn = 'Classic golden standard for French Press — full creamy body, rich caramel sweetness and smooth finish.';
  } else if (ratio <= 18.0) {
    style = 'light_clean';
    styleLabelPl = 'Lekki / Czysty';
    styleLabelEn = 'Light / Clean';
    sensoryExpectationPl = 'Większa przejrzystość nut owocowych i kwiatowych, lżejsze body o delikatniejszym finiszu.';
    sensoryExpectationEn = 'Enhanced clarity of floral and fruity notes, lighter body with delicate finish.';
  } else {
    style = 'overly_thin';
    styleLabelPl = 'Zbyt wodnisty';
    styleLabelEn = 'Overly Thin / Watery';
    sensoryExpectationPl = 'Płaski napar o zbyt niskim stężeniu rozpuszczonych związków, pozbawiony charakterystycznego body immersji.';
    sensoryExpectationEn = 'Flat cup with weak dissolved solids concentration, lacking characteristic immersion body.';
  }

  return {
    doseGrams: dose,
    waterGrams: water,
    ratio,
    ratioFormatted,
    style,
    styleLabelPl,
    styleLabelEn,
    sensoryExpectationPl,
    sensoryExpectationEn,
  };
}

export type AeroPressRatioStyle =
  | 'concentrate_espresso_style'
  | 'rich_short'
  | 'balanced_standard'
  | 'light_extended'
  | 'overly_dilute';

export interface AeroPressRatioEvaluation {
  doseGrams: number;
  waterGrams: number;
  ratio: number;
  ratioFormatted: string;
  style: AeroPressRatioStyle;
  styleLabelPl: string;
  styleLabelEn: string;
  sensoryExpectationPl: string;
  sensoryExpectationEn: string;
}

/**
 * Ocenia proporcję parzenia dla AeroPressa (metoda hybrydowa ciśnieniowo-immersyjna),
 * kategoryzując styl naparu (od intensywnego koncentratu po lekki przelew)
 * oraz dostarczając deskryptory sensoryczne.
 */
export function evaluateAeroPressRatio(
  doseGrams: number | string,
  waterGrams: number | string
): AeroPressRatioEvaluation {
  const parseVal = (v: unknown): number => {
    if (typeof v === 'number') {
      return Number.isFinite(v) && v > 0 && !Object.is(v, -0) ? v : 0;
    }
    if (typeof v === 'string') {
      const parsed = parseFloat(v.replace(/\uFEFF/g, '').replace(',', '.').trim());
      return Number.isFinite(parsed) && parsed > 0 && !Object.is(parsed, -0) ? parsed : 0;
    }
    return 0;
  };

  const dose = parseVal(doseGrams);
  const water = parseVal(waterGrams);

  let rawRatio = 0;
  if (dose > 0 && water > 0) {
    rawRatio = water / dose;
  }

  const ratio = Number(rawRatio.toFixed(2));
  const ratioFormatted = `1:${ratio.toFixed(1)}`;

  let style: AeroPressRatioStyle;
  let styleLabelPl: string;
  let styleLabelEn: string;
  let sensoryExpectationPl: string;
  let sensoryExpectationEn: string;

  if (ratio <= 0 || ratio < 7.0) {
    style = 'concentrate_espresso_style';
    styleLabelPl = 'Koncentrat / Styl espresso';
    styleLabelEn = 'Concentrate / Espresso-style';
    sensoryExpectationPl = 'Gęsty, intensywny ekstrakt idealny pod rozcieńczenie (bypass / Americano) lub z mlekiem.';
    sensoryExpectationEn = 'Dense, intense concentrate ideal for dilution (bypass / Americano) or with milk.';
  } else if (ratio <= 11.0) {
    style = 'rich_short';
    styleLabelPl = 'Krótki / Intensywny (Short Brew)';
    styleLabelEn = 'Rich / Short Brew';
    sensoryExpectationPl = 'Wyraziste body, skondensowana słodycz i soczysta kwasowość — profil popularny w mistrzostwach World AeroPress Championship.';
    sensoryExpectationEn = 'Pronounced body, condensed sweetness and juicy acidity — popular profile in World AeroPress Championship recipes.';
  } else if (ratio <= 16.0) {
    style = 'balanced_standard';
    styleLabelPl = 'Zrównoważony Standard';
    styleLabelEn = 'Balanced Standard';
    sensoryExpectationPl = 'Nowoczesny złoty standard AeroPressa — doskonały balans słodyczy, kwasowości i czystości naparu.';
    sensoryExpectationEn = 'Modern AeroPress golden standard — excellent harmony of sweetness, acidity and cup clarity.';
  } else if (ratio <= 18.0) {
    style = 'light_extended';
    styleLabelPl = 'Lekki / Drip-style';
    styleLabelEn = 'Light / Drip-style';
    sensoryExpectationPl = 'Zwiewny, herbaciany napar przypominający delikatny przelew z drippera o wysokiej przejrzystości nut smakowych.';
    sensoryExpectationEn = 'Airy, tea-like cup reminiscent of delicate pour-over drip with high flavor transparency.';
  } else {
    style = 'overly_dilute';
    styleLabelPl = 'Zbyt rozwodniony';
    styleLabelEn = 'Overly Dilute';
    sensoryExpectationPl = 'Płaski napar o zbyt niskim stężeniu rozpuszczonych związków i braku wyrazistej struktury.';
    sensoryExpectationEn = 'Flat cup with weak dissolved solids concentration and lacking flavor structure.';
  }

  return {
    doseGrams: dose,
    waterGrams: water,
    ratio,
    ratioFormatted,
    style,
    styleLabelPl,
    styleLabelEn,
    sensoryExpectationPl,
    sensoryExpectationEn,
  };
}

export type MokaPotRatioStyle =
  | 'ristretto_concentrated'
  | 'classic_italian'
  | 'lungo_delicate'
  | 'overly_dilute';

export interface MokaPotRatioEvaluation {
  doseGrams: number;
  waterGrams: number;
  ratio: number;
  ratioFormatted: string;
  style: MokaPotRatioStyle;
  styleLabelPl: string;
  styleLabelEn: string;
  sensoryProfilePl: string;
  sensoryProfileEn: string;
  brewingRecommendationPl: string;
  brewingRecommendationEn: string;
}

/**
 * Klasyfikuje proporcję parzenia kawiarki (Moka Pot / Bialetti)
 * i ocenia profil sensoryczny naparu oraz zalecenia techniczne ekstrakcji.
 */
export function evaluateMokaPotRatio(
  doseGrams: number | string,
  waterGrams: number | string
): MokaPotRatioEvaluation {
  const parseVal = (v: unknown): number => {
    if (typeof v === 'number') {
      return Number.isFinite(v) && v > 0 && !Object.is(v, -0) ? v : 0;
    }
    if (typeof v === 'string') {
      const parsed = parseFloat(v.replace(/\uFEFF/g, '').replace(',', '.').trim());
      return Number.isFinite(parsed) && parsed > 0 && !Object.is(parsed, -0) ? parsed : 0;
    }
    return 0;
  };

  const dose = parseVal(doseGrams);
  const water = parseVal(waterGrams);

  let rawRatio = 0;
  if (dose > 0 && water > 0) {
    rawRatio = water / dose;
  }

  const ratio = Math.round(rawRatio * 100) / 100;
  const ratioFormatted = `1:${ratio.toFixed(1)}`;

  let style: MokaPotRatioStyle;
  let styleLabelPl: string;
  let styleLabelEn: string;
  let sensoryProfilePl: string;
  let sensoryProfileEn: string;
  let brewingRecommendationPl: string;
  let brewingRecommendationEn: string;

  if (ratio <= 0 || ratio < 6.5) {
    style = 'ristretto_concentrated';
    styleLabelPl = 'Skoncentrowana Moka / Styl Ristretto';
    styleLabelEn = 'Concentrated Moka / Ristretto-style';
    sensoryProfilePl = 'Maksymalna gęstość i syropowata tekstura, dominacja nut ciemnej czekolady i orzechów, niska gorycz termiczna.';
    sensoryProfileEn = 'Maximum density and syrupy body, dominant dark chocolate and nutty notes, low thermal bitterness.';
    brewingRecommendationPl = 'Zdejmij kawiarkę z ognia natychmiast po pojawieniu się pierwszych bąbelków; idealne pod flat white lub cortado.';
    brewingRecommendationEn = 'Remove moka pot from heat immediately when bubbling starts; ideal for flat white or cortado.';
  } else if (ratio <= 9.0) {
    style = 'classic_italian';
    styleLabelPl = 'Klasyczna włoska kawiarka (Złoty standard)';
    styleLabelEn = 'Classic Italian Moka (Golden Standard)';
    sensoryProfilePl = 'Wzorcowy włoski profil — wyrazista słodycz, aksamitne body, głęboki finisz bez przypalonych posmaków.';
    sensoryProfileEn = 'Benchmark Italian profile — rich sweetness, velvety mouthfeel, deep finish without scorched notes.';
    brewingRecommendationPl = 'Złoty standard proporcji kawiarki (ok. 1:7 - 1:8). Zalej dolny zbiornik gorącą wodą, aby skrócić kontakt z palnikiem.';
    brewingRecommendationEn = 'Golden standard moka ratio (~1:7 - 1:8). Fill boiler with pre-heated water to minimize heat exposure.';
  } else if (ratio <= 12.0) {
    style = 'lungo_delicate';
    styleLabelPl = 'Wydłużona Moka / Styl Lungo';
    styleLabelEn = 'Extended Moka / Lungo-style';
    sensoryProfilePl = 'Lżejsza tekstura i wyższa klarowność, zwiększona ekstrakcja z nutami karmelu i prażonych migdałów.';
    sensoryProfileEn = 'Lighter texture and cup clarity, higher extraction with caramel and toasted almond notes.';
    brewingRecommendationPl = 'Dobre dla ziaren średnio palonych; schłodź dolny zbiornik zimną wodą pod kranem przy pierwszych oznakach pryskania.';
    brewingRecommendationEn = 'Good for medium roasts; cool base under cold tap water at first signs of sputtering.';
  } else {
    style = 'overly_dilute';
    styleLabelPl = 'Zbyt rozwodniona / Przegrzana';
    styleLabelEn = 'Overly Dilute / Scorched';
    sensoryProfilePl = 'Płaski napar o podwyższonej cierpkości i goryczce wynikającej z nadmiernego przepływu pary przez zmieloną kawę.';
    sensoryProfileEn = 'Thin cup with increased astringency and bitterness caused by excess steam channeling through grounds.';
    brewingRecommendationPl = 'Zwiększ dozę kawy lub nie napełniaj zbiornika powyżej zaworu bezpieczeństwa.';
    brewingRecommendationEn = 'Increase coffee dose or avoid filling boiler above safety valve.';
  }

  return {
    doseGrams: dose,
    waterGrams: water,
    ratio,
    ratioFormatted,
    style,
    styleLabelPl,
    styleLabelEn,
    sensoryProfilePl,
    sensoryProfileEn,
    brewingRecommendationPl,
    brewingRecommendationEn,
  };
}

export type TurkishCoffeeRatioStyle =
  | 'concentrated_dense'
  | 'traditional_ibrik'
  | 'light_ibrik'
  | 'overly_dilute';

export interface TurkishCoffeeRatioEvaluation {
  doseGrams: number;
  waterGrams: number;
  ratio: number;
  ratioFormatted: string;
  style: TurkishCoffeeRatioStyle;
  styleLabelPl: string;
  styleLabelEn: string;
  sensoryProfilePl: string;
  sensoryProfileEn: string;
  brewingRecommendationPl: string;
  brewingRecommendationEn: string;
}

/**
 * Ocenia proporcję parzenia kawy po turecku (Cezve / Ibrik / Dżezwa) oraz profil sensoryczny naparu
 * (< 1:8 skoncentrowany, 1:8 - 1:11 tradycyjny złoty standard, 1:11.1 - 1:14 nowoczesny specialty cezve, > 1:14 zbyt rozwodniony).
 */
export function evaluateTurkishCoffeeRatio(
  doseGrams: number | string | undefined | null,
  waterGrams: number | string | undefined | null
): TurkishCoffeeRatioEvaluation {
  const parseVal = (v: unknown): number => {
    if (typeof v === 'number') return Number.isFinite(v) && !Object.is(v, -0) ? Math.max(0, v) : 0;
    if (typeof v === 'string') {
      const parsed = parseFloat(v.replace(/\uFEFF/g, '').replace(',', '.').trim());
      return Number.isFinite(parsed) && !Object.is(parsed, -0) ? Math.max(0, parsed) : 0;
    }
    return 0;
  };

  const dose = parseVal(doseGrams);
  const water = parseVal(waterGrams);

  let rawRatio = 0;
  if (dose > 0 && water > 0) {
    rawRatio = water / dose;
  }

  const ratio = Math.round(rawRatio * 10) / 10;
  const ratioFormatted = `1:${ratio.toFixed(1)}`;

  let style: TurkishCoffeeRatioStyle;
  let styleLabelPl: string;
  let styleLabelEn: string;
  let sensoryProfilePl: string;
  let sensoryProfileEn: string;
  let brewingRecommendationPl: string;
  let brewingRecommendationEn: string;

  if (ratio <= 0 || ratio < 8.0) {
    style = 'concentrated_dense';
    styleLabelPl = 'Styl skoncentrowany / Syropowata kawa';
    styleLabelEn = 'Concentrated style / Syrupy coffee';
    sensoryProfilePl = 'Bardzo gęste, syropowate body z mocno zaakcentowaną nutą gorzkiej czekolady i przypraw korzennych.';
    sensoryProfileEn = 'Very dense, syrupy body with pronounced dark chocolate and warming spice notes.';
    brewingRecommendationPl = 'Podawaj w małych filiżankach (demitasse) z odrobiną kardamonu i szklanką zimnej wody.';
    brewingRecommendationEn = 'Serve in small demitasse cups with optional cardamom and a glass of cold water.';
  } else if (ratio <= 11.0) {
    style = 'traditional_ibrik';
    styleLabelPl = 'Klasyczna kawa po turecku (Złoty standard)';
    styleLabelEn = 'Classic Turkish Coffee (Golden Standard)';
    sensoryProfilePl = 'Wzorcowy profil tradycyjny — obfita, aksamitna pianka (köpük), głęboka słodycz, harmonijne body bez nadmiernej goryczy.';
    sensoryProfileEn = 'Benchmark traditional profile — abundant velvety foam (köpük), deep sweetness, and harmonious body without harsh bitterness.';
    brewingRecommendationPl = 'Złoty standard proporcji tygielka (ok. 1:10, np. 7-8g kawy na 70-80g wody). Gotuj na małym ogniu i zdejmij przy pierwszym uniesieniu piany.';
    brewingRecommendationEn = 'Golden standard Cezve ratio (~1:10, e.g. 7-8g coffee to 70-80g water). Brew over low heat and remove at the first foam rise.';
  } else if (ratio <= 14.0) {
    style = 'light_ibrik';
    styleLabelPl = 'Nowoczesna lekka kawa po turecku / Styl specialty';
    styleLabelEn = 'Modern light Turkish coffee / Specialty style';
    sensoryProfilePl = 'Lżejsza, bardziej klarowna tekstura naparu z uwypukloną owocową kwasowością i nutami kwiatowymi (styl specialty Cezve/Ibrik).';
    sensoryProfileEn = 'Lighter, clearer cup texture with highlighted fruit acidity and floral notes (modern specialty Cezve/Ibrik style).';
    brewingRecommendationPl = 'Idealne do jasno palonych ziaren jednorodnych (Single Origin); używaj precyzyjnego tygielka miedzianego lub ze stali nierdzewnej.';
    brewingRecommendationEn = 'Ideal for light roast single-origin coffees; use a high-precision copper or stainless steel Cezve.';
  } else {
    style = 'overly_dilute';
    styleLabelPl = 'Zbyt rozwodniona / Słaba pianka';
    styleLabelEn = 'Overly dilute / Weak foam';
    sensoryProfilePl = 'Wodnisty napar o słabej, szybko opadającej piance i rozmytych nutach sensorycznych.';
    sensoryProfileEn = 'Watery brew with unstable foam that collapses quickly and washed-out flavors.';
    brewingRecommendationPl = 'Zwiększ ilość bardzo drobno zmielonej kawy (puder) do uzyskania proporcji 1:10.';
    brewingRecommendationEn = 'Increase ultra-fine powder coffee dose to achieve a 1:10 ratio.';
  }

  return {
    doseGrams: dose,
    waterGrams: water,
    ratio,
    ratioFormatted,
    style,
    styleLabelPl,
    styleLabelEn,
    sensoryProfilePl,
    sensoryProfileEn,
    brewingRecommendationPl,
    brewingRecommendationEn,
  };
}

export type CuppingRatioStyle =
  | 'concentrated'
  | 'standard_sca'
  | 'diluted';

export interface CuppingRatioEvaluation {
  doseGrams: number;
  waterGrams: number;
  ratio: number;
  ratioFormatted: string;
  style: CuppingRatioStyle;
  isScaCompliant: boolean;
  styleLabelPl: string;
  styleLabelEn: string;
  sensoryProfilePl: string;
  sensoryProfileEn: string;
  brewingRecommendationPl: string;
  brewingRecommendationEn: string;
}

/**
 * Ocenia zgodność proporcji cuppingu z protokołem Specialty Coffee Association (SCA).
 * Standard SCA to 55g kawy na 1000ml wody (ok. 8.25g na 150ml czarki cuppingowej, czyli proporcja 1:18.18).
 */
export function evaluateCuppingRatio(
  doseGrams: number | string | undefined | null,
  waterGrams: number | string | undefined | null
): CuppingRatioEvaluation {
  const parseNum = (v: unknown): number => {
    if (typeof v === 'number') return Number.isFinite(v) && !Object.is(v, -0) ? Math.max(0, v) : 0;
    if (typeof v === 'string') {
      const parsed = parseFloat(v.replace(/\uFEFF/g, '').replace(',', '.').trim());
      return Number.isFinite(parsed) && !Object.is(parsed, -0) ? Math.max(0, parsed) : 0;
    }
    return 0;
  };

  const dose = parseNum(doseGrams);
  const water = parseNum(waterGrams);

  let rawRatio = 0;
  if (dose > 0 && water > 0) {
    rawRatio = water / dose;
  }

  const ratio = Math.round(rawRatio * 10) / 10;
  const ratioFormatted = `1:${ratio.toFixed(1)}`;

  let style: CuppingRatioStyle;
  let isScaCompliant = false;
  let styleLabelPl: string;
  let styleLabelEn: string;
  let sensoryProfilePl: string;
  let sensoryProfileEn: string;
  let brewingRecommendationPl: string;
  let brewingRecommendationEn: string;

  if (ratio <= 0 || ratio < 17.0) {
    style = 'concentrated';
    isScaCompliant = false;
    styleLabelPl = 'Skoncentrowany / Poniżej standardu SCA';
    styleLabelEn = 'Concentrated / Below SCA Standard';
    sensoryProfilePl = 'Zbyt gęsty i intensywny napar, który może maskować subtelne wady lub uwypuklać nadmierną gorycz kosztem oceny czystości kwasowości.';
    sensoryProfileEn = 'Too dense and intense brew that can mask subtle defects or overstate bitterness at the expense of evaluating acidity clarity.';
    brewingRecommendationPl = 'Dla 150ml czarki cuppingowej użyj wzorcowej dozy 8.25g zmielonej kawy (proporcja 1:18.18).';
    brewingRecommendationEn = 'For a 150ml cupping bowl, use the benchmark dose of 8.25g ground coffee (1:18.18 ratio).';
  } else if (ratio <= 19.0) {
    style = 'standard_sca';
    isScaCompliant = true;
    styleLabelPl = 'Wzorcowy standard SCA (55g / 1000ml)';
    styleLabelEn = 'Benchmark SCA Standard (55g / 1000ml)';
    sensoryProfilePl = 'Optymalne stężenie do oceny sensorycznej — zbalansowana klarowność nut kwasowych, słodyczy i posmaku zgodna z protokołem oceny cuppingowej.';
    sensoryProfileEn = 'Optimal concentration for sensory scoring — balanced clarity of acidity, sweetness, and aftertaste aligned with the cupping protocol.';
    brewingRecommendationPl = 'Zgodne z oficjalnym protokołem cuppingowym SCA. Zalej wodą o temp. 93°C, odczekaj 4 minuty i przełam skorupę.';
    brewingRecommendationEn = 'Complies with official SCA cupping protocol. Pour water at 93°C, wait 4 minutes and break the crust.';
  } else {
    style = 'diluted';
    isScaCompliant = false;
    styleLabelPl = 'Rozwodniony / Za niska koncentracja';
    styleLabelEn = 'Diluted / Under-concentrated';
    sensoryProfilePl = 'Zbyt wodnisty napar, utrudniający prawidłową ocenę body i nut smakowych ziaren.';
    sensoryProfileEn = 'Watery brew, hindering proper evaluation of body, sweetness, and flavor notes.';
    brewingRecommendationPl = 'Zwiększ dozę kawy do 8.25g na 150ml wody, aby spełnić wytyczne protokołu oceny ziaren.';
    brewingRecommendationEn = 'Increase coffee dose to 8.25g per 150ml water to meet bean evaluation standards.';
  }

  return {
    doseGrams: dose,
    waterGrams: water,
    ratio,
    ratioFormatted,
    style,
    isScaCompliant,
    styleLabelPl,
    styleLabelEn,
    sensoryProfilePl,
    sensoryProfileEn,
    brewingRecommendationPl,
    brewingRecommendationEn,
  };
}





export type SiphonRatioStyle = 'dense_strong' | 'balanced_classic' | 'light_delicate' | 'extreme';

export interface SiphonRatioEvaluation {
  doseGrams: number;
  waterGrams: number;
  ratio: number;
  ratioFormatted: string;
  style: SiphonRatioStyle;
  isBalanced: boolean;
  styleLabelPl: string;
  styleLabelEn: string;
  sensoryProfilePl: string;
  sensoryProfileEn: string;
  brewingRecommendationPl: string;
  brewingRecommendationEn: string;
}

/**
 * Ocenia proporcje parzenia kawy w syfonie próżniowym (Vacuum Pot)
 * pod kątem balansu sensorycznego, wyrazistości nut i czystości ekstrakcji.
 */
export function evaluateSiphonRatio(
  doseGrams: number | string | undefined | null,
  waterGrams: number | string | undefined | null
): SiphonRatioEvaluation {
  const parseNum = (v: unknown): number => {
    if (typeof v === 'number') return Number.isFinite(v) && !Object.is(v, -0) ? Math.max(0, v) : 0;
    if (typeof v === 'string') {
      const parsed = parseFloat(v.replace(/\uFEFF/g, '').replace(',', '.').trim());
      return Number.isFinite(parsed) && !Object.is(parsed, -0) ? Math.max(0, parsed) : 0;
    }
    return 0;
  };

  const dose = parseNum(doseGrams);
  const water = parseNum(waterGrams);

  let rawRatio = 0;
  if (dose > 0 && water > 0) {
    rawRatio = water / dose;
  }

  const ratio = Math.round(rawRatio * 10) / 10;
  const ratioFormatted = `1:${ratio.toFixed(1)}`;

  let style: SiphonRatioStyle;
  let isBalanced = false;
  let styleLabelPl: string;
  let styleLabelEn: string;
  let sensoryProfilePl: string;
  let sensoryProfileEn: string;
  let brewingRecommendationPl: string;
  let brewingRecommendationEn: string;

  if (ratio <= 0 || ratio < 14.0) {
    style = 'dense_strong';
    isBalanced = false;
    styleLabelPl = 'Mocny / Skoncentrowany napar';
    styleLabelEn = 'Dense / Concentrated brew';
    sensoryProfilePl =
      'Intensywny napar o ciężkim body i mocnym akcencie goryczkowym. Może przysłaniać delikatniejsze nuty kwiatowe.';
    sensoryProfileEn =
      'Intense brew with heavy body and bold bitterness. May overpower delicate floral nuances.';
    brewingRecommendationPl =
      'Zmniejsz dozę ziaren lub użyj nieco więcej wody, aby osiągnąć klasyczny balans 1:15.';
    brewingRecommendationEn =
      'Reduce coffee dose or add more water to achieve classic 1:15 balance.';
  } else if (ratio <= 16.5) {
    style = 'balanced_classic';
    isBalanced = true;
    styleLabelPl = 'Zbalansowany standard syfonu (1:14.5 – 1:16.5)';
    styleLabelEn = 'Balanced classic siphon (1:14.5 – 1:16.5)';
    sensoryProfilePl =
      'Wzorcowy profil próżniowy: jedwabiste, herbaciane body, niezwykle czysty profil smakowy i wyrazista słodycz.';
    sensoryProfileEn =
      'Benchmark siphon cup: silky tea-like body, ultra-clean flavor clarity and vibrant sweetness.';
    brewingRecommendationPl =
      'Optymalna proporcja dla syfonu. Parz przez 45–60 sekund po wymieszaniu i odstaw źródło ciepła.';
    brewingRecommendationEn =
      'Optimal ratio for siphon brewing. Steep for 45–60 seconds after stirring and remove heat source.';
  } else if (ratio <= 18.0) {
    style = 'light_delicate';
    isBalanced = false;
    styleLabelPl = 'Lekki / Delikatny napar';
    styleLabelEn = 'Light / Delicate brew';
    sensoryProfilePl =
      'Bardzo lekki napar z dominacją zwiewnych nut kwasowych, o obniżonej konsystencji.';
    sensoryProfileEn = 'Very light cup dominated by ethereal acidity with lighter body.';
    brewingRecommendationPl =
      'Dobre dla ziaren o bardzo delikatnym profilu (np. etiopskie odmiany dzikie).';
    brewingRecommendationEn =
      'Great for subtle, delicate beans (e.g. wild heirloom Ethiopian varietals).';
  } else {
    style = 'extreme';
    isBalanced = false;
    styleLabelPl = 'Zbyt rozwodniony / Skrajna proporcja';
    styleLabelEn = 'Overly diluted / Extreme ratio';
    sensoryProfilePl = 'Wodnista filiżanka o znikomej słodyczy i braku głębi smakowej.';
    sensoryProfileEn = 'Watery cup with minimal sweetness and lacking depth.';
    brewingRecommendationPl = 'Zwiększ dozę kawy do minimum 18–20g na 300ml wody.';
    brewingRecommendationEn = 'Increase coffee dose to at least 18–20g per 300ml of water.';
  }

  return {
    doseGrams: dose,
    waterGrams: water,
    ratio,
    ratioFormatted,
    style,
    isBalanced,
    styleLabelPl,
    styleLabelEn,
    sensoryProfilePl,
    sensoryProfileEn,
    brewingRecommendationPl,
    brewingRecommendationEn,
  };
}


export type ChemexRatioStyle =
  | 'dense_concentrated'
  | 'balanced_classic'
  | 'light_delicate'
  | 'watery';

export interface ChemexRatioEvaluation {
  doseGrams: number;
  waterGrams: number;
  ratio: number;
  ratioFormatted: string;
  style: ChemexRatioStyle;
  isClassicBalanced: boolean;
  styleLabelPl: string;
  styleLabelEn: string;
  sensoryProfilePl: string;
  sensoryProfileEn: string;
  brewingRecommendationPl: string;
  brewingRecommendationEn: string;
}

/**
 * Ocenia proporcje parzenia kawy w zaparzaczu Chemex
 * pod kątem krystalicznej czystości naparu, słodyczy i balansu ekstrakcji w grubych filtrach papierowych.
 */
export function evaluateChemexRatio(
  doseGrams: number | string | undefined | null,
  waterGrams: number | string | undefined | null
): ChemexRatioEvaluation {
  const parseNum = (v: unknown): number => {
    if (typeof v === 'number') return Number.isFinite(v) && !Object.is(v, -0) ? Math.max(0, v) : 0;
    if (typeof v === 'string') {
      const parsed = parseFloat(v.replace(/\uFEFF/g, '').replace(',', '.').trim());
      return Number.isFinite(parsed) && !Object.is(parsed, -0) ? Math.max(0, parsed) : 0;
    }
    return 0;
  };

  const dose = parseNum(doseGrams);
  const water = parseNum(waterGrams);

  let rawRatio = 0;
  if (dose > 0 && water > 0) {
    rawRatio = water / dose;
  }

  const ratio = Math.round(rawRatio * 10) / 10;
  const ratioFormatted = `1:${ratio.toFixed(1)}`;

  let style: ChemexRatioStyle;
  let isClassicBalanced = false;
  let styleLabelPl: string;
  let styleLabelEn: string;
  let sensoryProfilePl: string;
  let sensoryProfileEn: string;
  let brewingRecommendationPl: string;
  let brewingRecommendationEn: string;

  if (ratio <= 0 || ratio < 14.0) {
    style = 'dense_concentrated';
    isClassicBalanced = false;
    styleLabelPl = 'Gęsty / Skoncentrowany napar';
    styleLabelEn = 'Dense / Concentrated brew';
    sensoryProfilePl =
      'Intensywny napar o podwyższonej kwasowości lub goryczce, przytłumiający czystość filtrów Chemex.';
    sensoryProfileEn =
      'Intense brew with elevated acidity or bitterness, masking Chemex filter clarity.';
    brewingRecommendationPl =
      'Zwiększ ilość wody lub zmniejsz dozę kawy, aby osiągnąć klasyczny zakres 1:15 – 1:16.6.';
    brewingRecommendationEn =
      'Increase water amount or reduce coffee dose to reach the classic 1:15 – 1:16.6 range.';
  } else if (ratio <= 17.0) {
    style = 'balanced_classic';
    isClassicBalanced = true;
    styleLabelPl = 'Zbalansowany standard Chemex (1:14.0 – 1:17.0)';
    styleLabelEn = 'Balanced classic Chemex (1:14.0 – 1:17.0)';
    sensoryProfilePl =
      'Krystalicznie czysty napar, wysoka słodycz, lśniąca kwasowość i aksamitne, lekkie body.';
    sensoryProfileEn =
      'Crystal clear cup, high sweetness, sparkling acidity, and silky, tea-like light body.';
    brewingRecommendationPl =
      'Wzorcowa proporcja dla Chemex. Stosuj grubszy przemiał i polewanie spiralne od środka.';
    brewingRecommendationEn =
      'Benchmark Chemex ratio. Use medium-coarse grind and gentle spiral pouring from center.';
  } else if (ratio <= 19.0) {
    style = 'light_delicate';
    isClassicBalanced = false;
    styleLabelPl = 'Lekki / Delikatny napar (1:17.1 – 1:19.0)';
    styleLabelEn = 'Light / Delicate brew (1:17.1 – 1:19.0)';
    sensoryProfilePl =
      'Bardzo zwiewny napar z wyeksponowaną kwasowością kwiatowo-owocową i lekkim finiszem.';
    sensoryProfileEn =
      'Very delicate cup emphasizing floral and citrus acidity with an airy finish.';
    brewingRecommendationPl =
      'Doskonałe dla bardzo jasnych ziaren terroir Afryki Wschodniej (Etiopia, Kenia).';
    brewingRecommendationEn =
      'Great for ultra-light East African terroir roasts (Ethiopia, Kenya).';
  } else {
    style = 'watery';
    isClassicBalanced = false;
    styleLabelPl = 'Zbyt rozwodniony napar (> 1:19.0)';
    styleLabelEn = 'Watery brew (> 1:19.0)';
    sensoryProfilePl =
      'Rozwodniona filiżanka o płaskim profilu, braku słodyczy i pustym posmaku.';
    sensoryProfileEn =
      'Diluted cup with flat profile, lacking sweetness and hollow aftertaste.';
    brewingRecommendationPl =
      'Zwiększ dozę kawy do standardowych 30g na 500ml wody (1:16.7).';
    brewingRecommendationEn =
      'Increase coffee dose to standard 30g per 500ml water (1:16.7).';
  }

  return {
    doseGrams: dose,
    waterGrams: water,
    ratio,
    ratioFormatted,
    style,
    isClassicBalanced,
    styleLabelPl,
    styleLabelEn,
    sensoryProfilePl,
    sensoryProfileEn,
    brewingRecommendationPl,
    brewingRecommendationEn,
  };
}


// ============================================================================
// TASK-P99-11-WZR: Hybrid Switch Immersion Ratio Evaluator (Reguła hybrydowa Switch)
// ============================================================================

export type SwitchBrewStyle = 'concentrated_immersion' | 'classic_switch' | 'light_tea_like' | 'watery';

export interface SwitchImmersionEvaluation {
  doseGrams: number;
  waterGrams: number;
  ratio: number;
  ratioFormatted: string;
  style: SwitchBrewStyle;
  isOptimalSwitch: boolean;
  recommendedSteepSeconds: number;
  styleLabelPl: string;
  styleLabelEn: string;
  sensoryProfilePl: string;
  sensoryProfileEn: string;
  brewingRecommendationPl: string;
  brewingRecommendationEn: string;
}

/**
 * Ocenia proporcję parzenia dla hybrydowych metod infuzyjno-przelewowych (Hario Switch, Clever Dripper),
 * określając profil sensoryczny, optymalny czas zamknięcia zaworu i styl ekstrakcji.
 */
export function evaluateSwitchImmersionRatio(options?: {
  doseGrams?: number | string | null;
  waterGrams?: number | string | null;
  steepTimeSeconds?: number | string | null;
}): SwitchImmersionEvaluation {
  const parseNum = (val: unknown, fallback: number): number => {
    if (typeof val === 'number' && Number.isFinite(val) && !Object.is(val, -0) && val > 0) {
      return val;
    }
    if (typeof val === 'string') {
      const parsed = parseFloat(val.trim().replace(',', '.'));
      if (Number.isFinite(parsed) && !Object.is(parsed, -0) && parsed > 0) {
        return parsed;
      }
    }
    return fallback;
  };

  const dose = Math.round(parseNum(options?.doseGrams, 18) * 10) / 10;
  const water = Math.round(parseNum(options?.waterGrams, 280) * 10) / 10;
  const ratio = Math.round((water / dose) * 10) / 10;
  const ratioFormatted = `1:${ratio.toFixed(1)}`;

  let style: SwitchBrewStyle = 'classic_switch';
  let isOptimalSwitch = true;
  let recommendedSteepSeconds = 120;
  let styleLabelPl = 'Klasyczny Hario Switch (1:14.5 – 1:16.5)';
  let styleLabelEn = 'Classic Hario Switch (1:14.5 – 1:16.5)';
  let sensoryProfilePl =
    'Optymalna harmonia: wysoka słodycz i aksamitne body z pełnej immersji połączone z czystością spływu przez papierowy filtr.';
  let sensoryProfileEn =
    'Optimal balance: deep sweetness and velvety body of full immersion combined with paper-filtered clarity.';
  let brewingRecommendationPl =
    'Zamknij zawór na 2:00 minuty po zalaniu wodą 90–93°C, a następnie zwolnij przełącznik dla swobodnego spływu.';
  let brewingRecommendationEn =
    'Keep switch closed for 2:00 minutes with 90–93°C water, then press release button for clean drawdown.';

  if (ratio < 14.5) {
    style = 'concentrated_immersion';
    isOptimalSwitch = false;
    recommendedSteepSeconds = 105;
    styleLabelPl = 'Skoncentrowana immersja (< 1:14.5)';
    styleLabelEn = 'Concentrated immersion (< 1:14.5)';
    sensoryProfilePl =
      'Gęsta, likierowa tekstura i intensywny ekstrakt; styl God-Method lub pod napar z lodem.';
    sensoryProfileEn =
      'Dense liqueur-like mouthfeel and rich intensity; ideal for God-Method or iced brews.';
    brewingRecommendationPl =
      'Wydłuż preinfuzję otwartą do 30s, zamknij zawór na kolejne 60s i zredukuj opór złoża.';
    brewingRecommendationEn =
      'Perform open bloom for 30s, close switch for 60s, and brew over ice or enjoy intense body.';
  } else if (ratio > 18.0) {
    style = 'watery';
    isOptimalSwitch = false;
    recommendedSteepSeconds = 90;
    styleLabelPl = 'Zbyt rozwodniony napar (> 1:18.0)';
    styleLabelEn = 'Watery brew (> 1:18.0)';
    sensoryProfilePl =
      'Niski ekstrakt, spłaszczona słodycz i wodnisty finisz wskutek nadmiaru wody.';
    sensoryProfileEn =
      'Thin cup, diluted sweetness, and hollow mouthfeel due to excess water ratio.';
    brewingRecommendationPl =
      'Zwiększ dozę kawy lub zmniejsz ilość wody do zalecanych proporcji 1:15–1:16.';
    brewingRecommendationEn =
      'Increase coffee dose or reduce water volume to optimal 1:15–1:16 ratio.';
  } else if (ratio > 16.5) {
    style = 'light_tea_like';
    isOptimalSwitch = true;
    recommendedSteepSeconds = 120;
    styleLabelPl = 'Lekki i herbaciany (1:16.6 – 1:18.0)';
    styleLabelEn = 'Light and tea-like (1:16.6 – 1:18.0)';
    sensoryProfilePl =
      'Zwiewna, krystalicznie czysta filiżanka z wyeksponowaną kwasowością i delikatnymi nutami kwiatowymi.';
    sensoryProfileEn =
      'Crisp, tea-like clarity accentuating floral notes and lively fruit acidity.';
    brewingRecommendationPl =
      'Znakomity profil dla mytych kaw z Panamy i Etiopii z infuzją 1:45-2:00 min.';
    brewingRecommendationEn =
      'Superb for delicate washed geishas and Ethiopian coffees steeped for 1:45-2:00 min.';
  }

  return {
    doseGrams: dose,
    waterGrams: water,
    ratio,
    ratioFormatted,
    style,
    isOptimalSwitch,
    recommendedSteepSeconds,
    styleLabelPl,
    styleLabelEn,
    sensoryProfilePl,
    sensoryProfileEn,
    brewingRecommendationPl,
    brewingRecommendationEn,
  };
}
