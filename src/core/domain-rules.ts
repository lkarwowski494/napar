// ============================================================================
// Napar — Core Domain Rules (RD-01…RD-30)
// Deterministic formulas for extraction, kinetics, water, and grind adjustments.
// ============================================================================

export interface ExtractionYieldResult {
  extractionYieldPercent: number;
  rating: 'under' | 'ideal' | 'over';
  descriptionPl: string;
  descriptionEn?: string;
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
 * RD-17 & RD-18: Estymacja dawki kofeiny w filiżance kawy: doza [g] × zawartość [mg/g] × wydajność metody.
 * Zawartość: arabika 12,0 mg/g, robusta 22,0 mg/g [T:KAWA-KOFEINA-MG-G] (otwarte: Olechno 2021 podaje dla zielonego
 * ziarna 0,9–1,2% i 1,6–2,4%, brak źródła dla kawy palonej). Wydajność: filtr 0,88, espresso 0,75, immersja 0,85,
 * cold brew 0,92 [T:KAWA-WYDAJNOSC-EKSTRAKCJI] (otwarte, bez źródła).
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
 * Szacuje całkowity ładunek kofeiny w suchych liściach herbaty (3,0% suchej masy) [T:HERBATA-KOFEINA-3PROC] (otwarte)
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
 * Frakcja n-tego zalania = 0,40 × 0,55^(n−1) (1.: 40%, 2.: 22%, 3.: 12,1%) [T:HERBATA-FRAKCJE-ZALAN] (otwarte, bez źródła)
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
 * Zakres ustawienia czasu półtrwania kofeiny: 2–8 h u zdrowych dorosłych wg EFSA [T:EFSA-T12-ZAKRES].
 * Jedno miejsce wartości dla ekranu Kofeina, Ustawień i zapisu w bazie (M1-audytor-generalny-017).
 */
/** Domyślny czas półtrwania: średnia u zdrowych dorosłych wg EFSA [T:EFSA-T12-ZAKRES] (M1-audytor-generalny-017, przekazanie 06→08). */
export const DEFAULT_CAFFEINE_HALF_LIFE_H = 4.0;
export const CAFFEINE_HALF_LIFE_MIN_H = 2.0;
export const CAFFEINE_HALF_LIFE_MAX_H = 8.0;

/** Ogranicza t½ do zakresu [T:EFSA-T12-ZAKRES] i zaokrągla do 0,1 h. */
export function clampCaffeineHalfLifeHours(hours: number): number {
  return Number(Math.max(CAFFEINE_HALF_LIFE_MIN_H, Math.min(CAFFEINE_HALF_LIFE_MAX_H, hours)).toFixed(1));
}

/**
 * RD-17: Farmakokinetyka eliminacji kofeiny (model jedno-kompartmentowy, bez fazy wchłaniania — uproszczenie) [T:EFSA-T12-ZAKRES]
 * C(t) = C0 * (1/2)^(t / t1/2)
 */
export function calculateRemainingCaffeineMg(
  initialDoseMg: number | string,
  hoursPassed: number | string,
  halfLifeHours: number | string = DEFAULT_CAFFEINE_HALF_LIFE_H
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
 * RD-20: Szacunek kofeiny w organizmie o porze snu — suma modelu eliminacji (RD-17) dla dawek z dnia.
 * Bez progu i bez oceny snu: źródło przypisane progowi 25 mg (Drake 2013) go nie podaje
 * (M1-audytor-generalny-015, DEC-05 a; rejestr SEN-PROG-25MG: wycofane).
 */
export function estimateBedtimeCaffeineMg(
  intakes: Array<{ doseMg: number; hoursUntilBedtime: number }>,
  halfLifeHours = DEFAULT_CAFFEINE_HALF_LIFE_H
): number {
  const validIntakes = Array.isArray(intakes) ? intakes.filter(Boolean) : [];
  const halfLife = Number.isFinite(halfLifeHours) && halfLifeHours > 0 ? Math.min(24, halfLifeHours) : DEFAULT_CAFFEINE_HALF_LIFE_H;

  let totalRemaining = 0;
  for (const intake of validIntakes) {
    if (intake && typeof intake === 'object') {
      const parsedHours = parseNumeric(intake.hoursUntilBedtime);
      const parsedDose = parseNumeric(intake.doseMg);
      if (!isNaN(parsedHours) && parsedHours >= 0 && !isNaN(parsedDose) && parsedDose > 0) {
        totalRemaining += calculateRemainingCaffeineMg(parsedDose, parsedHours, halfLife);
      }
    }
  }

  const result = Number(totalRemaining.toFixed(1));
  return Object.is(result, -0) || result < 0 ? 0 : result;
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
      issue: 'Zbyt kwaśna (Niedoparzenie)',
      issueEn: 'Too sour (Under-extracted)',
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
  halfLifeHours: number | string = DEFAULT_CAFFEINE_HALF_LIFE_H
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

