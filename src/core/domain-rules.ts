// ============================================================================
// Napar (Steepwise) — Core Domain Rules (RD-01…RD-30)
// Deterministic formulas for extraction, kinetics, water, and grind adjustments.
// ============================================================================

export interface ExtractionYieldResult {
  extractionYieldPercent: number;
  rating: 'under' | 'ideal' | 'over';
  descriptionPl: string;
}

export interface RestingWindowResult {
  daysSinceRoast: number;
  stage: 'degassing' | 'peak' | 'stable' | 'aging';
  messagePl: string;
  badgeColor: 'amber' | 'green' | 'blue' | 'gray';
}

export interface BedtimeCaffeineEvaluation {
  totalRemainingMg: number;
  safeThresholdMg: number;
  isSafeForSleep: boolean;
  messagePl: string;
}

export interface TasteDiagnosis {
  issue: string;
  recommendationPl: string;
  grindAdjustment?: 'finer' | 'coarser';
  tempAdjustment?: 'higher' | 'lower';
}

/**
 * RD-01: Proporcja parzenia (Brew Ratio)
 * Oblicza masę wody dla zadanej dozy i współczynnika (np. 1:16.6)
 */
export function calculateBrewWater(doseGrams: number, ratio: number): number {
  if (doseGrams <= 0 || ratio <= 0) {
    throw new Error('Doza i ratio muszą być większe od zera');
  }
  return Number((doseGrams * ratio).toFixed(1));
}

/**
 * RD-01b: Oblicza dozę kawy/herbaty dla zadanej objętości wody
 */
export function calculateBrewDose(waterGrams: number, ratio: number): number {
  if (waterGrams <= 0 || ratio <= 0) {
    throw new Error('Woda i ratio muszą być większe od zera');
  }
  return Number((waterGrams / ratio).toFixed(1));
}

/**
 * RD-01c: Oblicza współczynnik ratio dla zadanej dozy i wody (np. 15g, 250g -> 16.7)
 */
export function calculateBrewRatio(doseGrams: number, waterGrams: number): number {
  if (doseGrams <= 0 || waterGrams <= 0) {
    return 0;
  }
  return Number((waterGrams / doseGrams).toFixed(1));
}

/**
 * RD-02: Absorpcja wody przez zmieloną kawę (Water Retention Index)
 * Domyślny współczynnik: 2.0g wody na każdy 1g zmielonej kawy
 */
export function calculateLiquidYield(waterGrams: number, doseGrams: number, retentionFactor = 2.0): number {
  if (waterGrams <= 0 || doseGrams <= 0 || retentionFactor < 0) {
    throw new Error('Nieprawidłowe parametry wyliczania uzysku');
  }
  const retained = doseGrams * retentionFactor;
  const yieldGrams = Math.max(0, waterGrams - retained);
  return Number(yieldGrams.toFixed(1));
}

/**
 * RD-03: Wydajność ekstrakcji (Extraction Yield - EY %)
 * EY = (Masa naparu * TDS%) / Doza sucha
 * Standard SCA Golden Cup: 18.0% - 22.0%
 */
export function calculateExtractionYield(
  beverageWeightGrams: number,
  tdsPercent: number,
  doseGrams: number
): ExtractionYieldResult {
  if (beverageWeightGrams <= 0 || tdsPercent <= 0 || doseGrams <= 0) {
    throw new Error('Parametry ekstrakcji muszą być większe od zera');
  }

  const ey = Number(((beverageWeightGrams * tdsPercent) / doseGrams).toFixed(2));

  let rating: 'under' | 'ideal' | 'over';
  let descriptionPl: string;

  if (ey < 18.0) {
    rating = 'under';
    descriptionPl = 'Niedoparzenie (Under-extracted) — dominacja kwasowości, brak słodyczy';
  } else if (ey > 22.0) {
    rating = 'over';
    descriptionPl = 'Przeparzenie (Over-extracted) — suchość, posmak popiołowy i gorycz';
  } else {
    rating = 'ideal';
    descriptionPl = 'Zrównoważona ekstrakcja (Golden Cup) — pełna słodycz, czysty bukiet';
  }

  return {
    extractionYieldPercent: ey,
    rating,
    descriptionPl,
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
  const roastDate = new Date(roastDateInput);
  const now = currentDateInput ? new Date(currentDateInput) : new Date();

  const diffTime = now.getTime() - roastDate.getTime();
  const daysSinceRoast = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

  if (daysSinceRoast <= 6) {
    return {
      daysSinceRoast,
      stage: 'degassing',
      messagePl: 'Zbyt świeża (Odgazowanie CO₂) — odczekaj do 7. dnia po wypale',
      badgeColor: 'amber',
    };
  } else if (daysSinceRoast <= 35) {
    return {
      daysSinceRoast,
      stage: 'peak',
      messagePl: 'Szczyt smaku (Peak Flavor) — idealne okno ekstrakcji (7–35 dni)',
      badgeColor: 'green',
    };
  } else if (daysSinceRoast <= 60) {
    return {
      daysSinceRoast,
      stage: 'stable',
      messagePl: 'Stabilna jakość ziaren (36–60 dni) — zmiel o 1 klik drobniej dla zachowania słodyczy',
      badgeColor: 'blue',
    };
  } else {
    return {
      daysSinceRoast,
      stage: 'aging',
      messagePl: 'Ziarna tracą lotne aromaty (>60 dni) — zwiększ dozę lub zmiel o 1–2 kliki drobniej',
      badgeColor: 'gray',
    };
  }
}

/**
 * RD-17 & RD-18: Estymacja dawki kofeiny w filiżance kawy
 * Średnio 1g suchej Arabiki = 10.5 mg wyekstrahowanej kofeiny w przelewie
 * Robusta = 18.7 mg/g
 */
export function estimateCoffeeCaffeineMg(
  doseGrams: number,
  beanType: 'arabica' | 'robusta' = 'arabica',
  method: 'filter' | 'espresso' | 'immersion' | 'cold_brew' = 'filter'
): number {
  if (doseGrams <= 0) return 0;

  const baseRatePerGram = beanType === 'robusta' ? 22.0 : 12.0;

  let extractionEfficiency = 0.88; // Domyślnie filtr/drip
  if (method === 'espresso') extractionEfficiency = 0.75;
  if (method === 'immersion') extractionEfficiency = 0.85;
  if (method === 'cold_brew') extractionEfficiency = 0.92;

  const totalMg = doseGrams * baseRatePerGram * extractionEfficiency;
  return Number(totalMg.toFixed(1));
}

/**
 * RD-19: Uwalnianie kofeiny w wielokrotnych zalaniach herbaty Gongfu Cha
 * 1 zalanie: 45%, 2 zalanie: 30%, 3 zalanie: 15%, kolejne: 10% łącznie
 */
export function estimateTeaInfusionCaffeineMg(totalLeafCaffeineMg: number, infusionNumber: number): number {
  if (totalLeafCaffeineMg <= 0 || infusionNumber <= 0) return 0;

  let fraction = 0.05;
  if (infusionNumber === 1) fraction = 0.45;
  else if (infusionNumber === 2) fraction = 0.30;
  else if (infusionNumber === 3) fraction = 0.15;
  else if (infusionNumber === 4) fraction = 0.05;
  else fraction = 0.02;

  return Number((totalLeafCaffeineMg * fraction).toFixed(1));
}

/**
 * RD-17: Farmakokinetyka eliminacji kofeiny (model jedno-kompartmentowy)
 * C(t) = C0 * (1/2)^(t / t1/2)
 */
export function calculateRemainingCaffeineMg(initialDoseMg: number, hoursPassed: number, halfLifeHours = 5.0): number {
  if (initialDoseMg <= 0 || hoursPassed < 0 || halfLifeHours <= 0) return 0;
  const remaining = initialDoseMg * Math.pow(0.5, hoursPassed / halfLifeHours);
  return Number(remaining.toFixed(1));
}

/**
 * RD-20: Obliczenie stężenia kofeiny przed snem
 */
export function evaluateBedtimeCaffeine(
  intakes: Array<{ doseMg: number; hoursUntilBedtime: number }>,
  safeThresholdMg = 25.0,
  halfLifeHours = 5.0
): BedtimeCaffeineEvaluation {
  let totalRemaining = 0;

  for (const intake of intakes) {
    if (intake.hoursUntilBedtime >= 0) {
      totalRemaining += calculateRemainingCaffeineMg(intake.doseMg, intake.hoursUntilBedtime, halfLifeHours);
    }
  }

  totalRemaining = Number(totalRemaining.toFixed(1));
  const isSafeForSleep = totalRemaining <= safeThresholdMg;

  let messagePl: string;
  if (isSafeForSleep) {
    messagePl = `Szacowany poziom kofeiny o porze snu (${totalRemaining} mg) mieści się w orientacyjnym progu niskiego wpływu na sen.`;
  } else {
    messagePl = `Poziom kofeiny (${totalRemaining} mg) przekracza próg ${safeThresholdMg} mg — ryzyko spłycenia snu.`;
  }

  return {
    totalRemainingMg: totalRemaining,
    safeThresholdMg,
    isSafeForSleep,
    messagePl,
  };
}

/**
 * RD-21: Oblicza minimalną liczbę godzin przed snem, po której można wypić daną dawkę
 */
export function calculateHoursUntilSafeCaffeine(doseMg: number, safeThresholdMg = 25.0, halfLifeHours = 5.0): number {
  if (doseMg <= safeThresholdMg) return 0;
  // dose * (0.5)^(t / halfLife) = threshold
  // t / halfLife = log2(dose / threshold)
  const ratio = doseMg / safeThresholdMg;
  const hours = halfLifeHours * (Math.log(ratio) / Math.LN2);
  return Number(hours.toFixed(1));
}

export interface TasteDiagnosis {
  issue: string;
  recommendationPl: string;
  grindAdjustment?: 'finer' | 'coarser';
  tempAdjustment?: 'higher' | 'lower';
  steepTimeAdjustmentSeconds?: number;
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
      recommendationPl: 'Zmiel drobniej (np. -2 kliki na młynku) lub podwyższ temperaturę wody o 2°C, aby zwiększyć ekstrakcję cukrów.',
      grindAdjustment: 'finer',
      tempAdjustment: 'higher',
    });
  }

  if (params.isBitter || params.isAstringent) {
    diagnoses.push({
      issue: 'Gorzka / sucha w ustach (Przeparzenie)',
      recommendationPl: 'Zmiel grubiej (np. +2 kliki na młynku) lub obniż temperaturę wody o 2-3°C, aby ograniczyć wymywanie tanin i gorzkich kwasów.',
      grindAdjustment: 'coarser',
      tempAdjustment: 'lower',
    });
  }

  if (params.isWatery) {
    diagnoses.push({
      issue: 'Płaska / rozwodniona (Za niska doza lub za gruby przemiał)',
      recommendationPl: 'Zwiększ dozę kawy o +1g lub zmniejsz współczynnik ratio (np. z 1:17 na 1:15.5).',
    });
  }

  if (params.isTooIntense) {
    diagnoses.push({
      issue: 'Zbyt ciężka / przytłaczająca',
      recommendationPl: 'Wydłuż ratio (np. z 1:15 na 1:16.6) dodając więcej wody, by otworzyć bukiet aromatyczny.',
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
      recommendationPl: 'Obniż temperaturę wody do 70–80°C dla zielonej/białej herbaty, aby chronić aminokwasy L-teaniny i zapobiec gorzkiemu wyciekowi katechin.',
      tempAdjustment: 'lower',
      steepTimeAdjustmentSeconds: -5,
    });
  }

  if (params.isBitterOrAstringent) {
    diagnoses.push({
      issue: 'Nadmierna ściągająca cierpkość (Zbyt długa infuzja lub za duża doza)',
      recommendationPl: 'Skróć czas parzenia o 5–10 sekund w metodzie Gongfu Cha lub obniż temperaturę wody o 3–5°C.',
      tempAdjustment: 'lower',
      steepTimeAdjustmentSeconds: -10,
    });
  }

  if (params.isWeakOrWatery) {
    diagnoses.push({
      issue: 'Zbyt wodnisty / brak głębi aromatu (Niedostateczna infuzja)',
      recommendationPl: 'Wydłuż czas parzenia o 10–15 sekund lub podnieś temperaturę wody o 3–5°C (szczególnie dla dojrzałych puerhów i oolongów skalnych).',
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
  servings: number
): BatchScalingResult {
  const count = Math.max(1, Math.min(4, Math.round(servings)));
  const scaledDose = Number((baseDoseGrams * count).toFixed(1));
  const scaledWater = Number((baseWaterGrams * count).toFixed(1));

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
  initialMg: number,
  elapsedHours: number,
  halfLifeHours = 5.0
): number {
  return Number((initialMg * Math.pow(0.5, elapsedHours / halfLifeHours)).toFixed(4));
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
>(steps: T[], originalDose: number, newDose: number): ScaledRecipeResult {
  if (originalDose <= 0 || newDose <= 0) {
    throw new Error('Doza musi być większa od zera');
  }
  const factor = newDose / originalDose;
  const originalWater = steps.reduce((sum, s) => sum + s.waterGrams, 0);
  const targetWater = Number((originalWater * factor).toFixed(1));

  let allocated = 0;
  const scaledSteps = steps.map((s, idx) => {
    if (idx === steps.length - 1) {
      const remaining = Number((targetWater - allocated).toFixed(1));
      return { ...s, waterGrams: remaining };
    }
    const scaledWater = Number((s.waterGrams * factor).toFixed(1));
    allocated += scaledWater;
    return { ...s, waterGrams: scaledWater };
  });

  return {
    multiplier: factor,
    newDoseGrams: newDose,
    targetWaterGrams: targetWater,
    steps: scaledSteps,
  };
}


