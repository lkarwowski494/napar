// ============================================================================
// Napar (Steepwise) — Water Chemistry & Mineralization Calculator
// Matematyka remineralizacji wody dla kawy specialty i herbaty (SCA & Barista Hustle) [T:SCA-WATER-STD] [T:BH-WATER-2016] [T:HENDON-WATER-2015]
// ============================================================================

export interface WaterRecipe {
  id: string;
  namePl: string;
  nameEn: string;
  descriptionPl: string;
  descriptionEn: string;
  targetGhPpm: number; // General Hardness (ppm CaCO3)
  targetKhPpm: number; // Carbonate Hardness / Alkalinity (ppm CaCO3)
  bestForPl: string;
  bestForEn: string;
}

export interface BottledWaterProfile {
  id: string;
  brandName: string;
  originCountry: string;
  tdsPpm: number;
  estimatedGhPpm: number;
  estimatedKhPpm: number;
  suitability: 'EXCELLENT' | 'GOOD' | 'ACCEPTABLE' | 'NOT_RECOMMENDED';
  verdictPl: string;
  verdictEn: string;
}

export const WATER_RECIPES: WaterRecipe[] = [
  {
    id: 'barista_hustle_80_40',
    namePl: 'Barista Hustle 80/40',
    nameEn: 'Barista Hustle 80/40',
    descriptionPl: 'Złoty standard dla jasnych filtrów (Etiopia, Kenia, Geisha). Żywa owocowość i optymalna słodycz.',
    descriptionEn: 'The benchmark standard for light roast filter (Ethiopia, Kenya, Geisha). Crisp acidity with natural sweetness.',
    targetGhPpm: 80,
    targetKhPpm: 40,
    bestForPl: 'Jasno palone przelewy (V60, Kalita, Chemex)',
    bestForEn: 'Light roast pour-overs (V60, Kalita, Chemex)',
  },
  {
    id: 'sca_standard',
    namePl: 'Standard SCA (Specialty Coffee)',
    nameEn: 'SCA Standard Water',
    descriptionPl: 'Oficjalny profil Specialty Coffee Association dla cuppingu i turniejów Brewers Cup.',
    descriptionEn: 'Official Specialty Coffee Association standard for cupping and Brewers Cup competitions.',
    targetGhPpm: 68,
    targetKhPpm: 40,
    bestForPl: 'Cupping sensoryczny i wszechstronne parzenie',
    bestForEn: 'Sensory cupping and versatile brewing',
  },
  {
    id: 'melbourne_soft',
    namePl: 'Melbourne Sweet & Soft',
    nameEn: 'Melbourne Sweet & Soft',
    descriptionPl: 'Bardzo miękka woda podkreślająca krystaliczną czystość i delikatne nuty kwiatowe.',
    descriptionEn: 'Ultra-soft water profile emphasizing crystalline clarity and delicate floral notes.',
    targetGhPpm: 50,
    targetKhPpm: 25,
    bestForPl: 'Ekspresyjne myte Etiopie i herbaty jaśminowe',
    bestForEn: 'High-acidity washed Ethiopias & jasmine teas',
  },
  {
    id: 'scott_rao_wonder',
    namePl: 'Scott Rao Wonder Water',
    nameEn: 'Scott Rao Wonder Water',
    descriptionPl: 'Lekko wyższy bufor i twardość zapewniające gęstsze body i długi finisz.',
    descriptionEn: 'Slightly higher buffer and hardness delivering rounder body and longer finish.',
    targetGhPpm: 85,
    targetKhPpm: 45,
    bestForPl: 'AeroPress, French Press i nowoczesne espresso',
    bestForEn: 'AeroPress, French Press and modern espresso',
  },
  {
    id: 'hendon_medium_dark',
    namePl: 'Hendon Hard Water (Medium Roast)',
    nameEn: 'Hendon Hard Water (Medium Roast)',
    descriptionPl: 'Wysoka mineralizacja buforująca nadmiar kwasowości w kawach średnio i ciemniej palonych.',
    descriptionEn: 'High mineralization buffering excess acidity in medium and dark roasts.',
    targetGhPpm: 120,
    targetKhPpm: 60,
    bestForPl: 'Klasyczne espresso, kawiarka i ciemniejsze profile',
    bestForEn: 'Traditional espresso, moka pot & richer roasts',
  },
  {
    id: 'tea_delicate',
    namePl: 'Herbata Szlachetna (Zielona / Biała)',
    nameEn: 'Artisan Tea Water (Green / White)',
    descriptionPl: 'Niska zawartość minerałów chroniąca delikatne aminokwasy (L-teaninę) i świeży likier.',
    descriptionEn: 'Gentle mineral level preserving delicate amino acids (L-theanine) and fresh liquor.',
    targetGhPpm: 30,
    targetKhPpm: 15,
    bestForPl: 'Sencha, Gyokuro, Pai Mu Tan, Silver Needle',
    bestForEn: 'Sencha, Gyokuro, Pai Mu Tan, Silver Needle',
  },
  {
    id: 'tea_gongfu_rock_puerh',
    namePl: 'Gongfu Wulong & Puerh (Górska Woda)',
    nameEn: 'Gongfu Rock Wulong & Puerh (Mountain Style)',
    descriptionPl: 'Średnia twardość magnezowo-krzemowa wyciągająca mineralność i prażony czar Yan Cha.',
    descriptionEn: 'Balanced magnesium mineral water extracting roast depth and mineral body of Yan Cha.',
    targetGhPpm: 60,
    targetKhPpm: 30,
    bestForPl: 'Da Hong Pao, Rou Gui, Dancong, Sheng Puerh',
    bestForEn: 'Da Hong Pao, Rou Gui, Dancong, Sheng Puerh',
  },
];

export const BOTTLED_WATER_BENCHMARKS: BottledWaterProfile[] = [
  {
    id: 'volvic',
    brandName: 'Volvic',
    originCountry: 'Francja',
    tdsPpm: 130,
    estimatedGhPpm: 62,
    estimatedKhPpm: 55,
    suitability: 'EXCELLENT',
    verdictPl: 'Światowy punkt odniesienia do cuppingu i dripa V60. Zrównoważona i powtarzalna.',
    verdictEn: 'Global benchmark for cupping and V60 filter. Balanced, consistent mineral ratio.',
  },
  {
    id: 'zywiecki_krysztal',
    brandName: 'Żywiecki Kryształ',
    originCountry: 'Polska',
    tdsPpm: 95,
    estimatedGhPpm: 45,
    estimatedKhPpm: 35,
    suitability: 'EXCELLENT',
    verdictPl: 'Znakomita woda źródlana o niskim buforze. Podkreśla kwasowość owocową w metodach przelewowych.',
    verdictEn: 'Superb low-buffer spring water. Emphasizes bright fruity acidity in pour-overs.',
  },
  {
    id: 'zywiec_zdroj',
    brandName: 'Żywiec Zdrój (Niegazowany)',
    originCountry: 'Polska',
    tdsPpm: 230,
    estimatedGhPpm: 105,
    estimatedKhPpm: 90,
    suitability: 'ACCEPTABLE',
    verdictPl: 'Wyższy bufor lekko wygładza kwasowość. Dobra do herbat czarnych i kaw średnio palonych.',
    verdictEn: 'Higher buffer softens brightness. Decent for black tea and medium roasts.',
  },
  {
    id: 'muszynianka',
    brandName: 'Muszynianka / Cechini',
    originCountry: 'Polska',
    tdsPpm: 1400,
    estimatedGhPpm: 650,
    estimatedKhPpm: 480,
    suitability: 'NOT_RECOMMENDED',
    verdictPl: 'Zbyt twarda do ekstrakcji specialty. Zabija kwasowość, powoduje kredowy posmak i niszczy czajnik.',
    verdictEn: 'Extremely hard mineral water. Mutes acidity, gives chalky taste and scales equipment.',
  },
  {
    id: 'spa_reine',
    brandName: 'Spa Reine',
    originCountry: 'Belgia',
    tdsPpm: 33,
    estimatedGhPpm: 18,
    estimatedKhPpm: 15,
    suitability: 'GOOD',
    verdictPl: 'Bardzo miękka woda górska, idealna do herbat zielonych i jaskrawo kwasowych przelewów.',
    verdictEn: 'Very soft mountain spring water, great for green tea and bright pour-overs.',
  },
  {
    id: 'evian',
    brandName: 'Evian',
    originCountry: 'Francja',
    tdsPpm: 345,
    estimatedGhPpm: 220,
    estimatedKhPpm: 260,
    suitability: 'NOT_RECOMMENDED',
    verdictPl: 'Zbyt wysoki bufor wodorowęglanowy gasi kwasowość i spłaszcza profil smakowy filtrów.',
    verdictEn: 'Very high bicarbonate buffer dulls acidity and flattens filter flavor profiles.',
  },
  {
    id: 'ashbeck',
    brandName: 'Ashbeck',
    originCountry: 'Wielka Brytania',
    tdsPpm: 85,
    estimatedGhPpm: 45,
    estimatedKhPpm: 25,
    suitability: 'EXCELLENT',
    verdictPl: 'Popularna woda baristów w UK o niskiej zawartości minerałów. Idealna do dripa V60 i aeropressu.',
    verdictEn: 'Popular UK barista staple with low mineral content. Excellent for V60 drip and AeroPress.',
  },
  {
    id: 'highland_spring',
    brandName: 'Highland Spring',
    originCountry: 'Szkocja',
    tdsPpm: 140,
    estimatedGhPpm: 70,
    estimatedKhPpm: 60,
    suitability: 'GOOD',
    verdictPl: 'Zrównoważona woda źródlana o umiarkowanym buforze, dobra do parzenia przelewowego i herbat.',
    verdictEn: 'Balanced Scottish spring water with moderate buffer, good for pour-overs and teas.',
  },
  {
    id: 'aqua_panna',
    brandName: 'Acqua Panna',
    originCountry: 'Włochy',
    tdsPpm: 140,
    estimatedGhPpm: 80,
    estimatedKhPpm: 60,
    suitability: 'EXCELLENT',
    verdictPl: 'Oficjalna woda cuppingowa mistrzostw baristów (WBC). Aksamitne body i idealny balans minerałów.',
    verdictEn: 'Official cupping water of World Barista Championships. Silky body and ideal mineral balance.',
  },
  {
    id: 'crystal_geyser',
    brandName: 'Crystal Geyser',
    originCountry: 'USA',
    tdsPpm: 110,
    estimatedGhPpm: 55,
    estimatedKhPpm: 40,
    suitability: 'EXCELLENT',
    verdictPl: 'Ulubiona woda amerykańskich kawiarni specialty do parzenia V60 i Kalita Wave. Bardzo czysty profil.',
    verdictEn: 'US specialty coffee favorite for V60 and Kalita Wave. Exceptionally clean extraction profile.',
  },
];

/**
 * Zwraca zlokalizowaną nazwę profilu wody. Nieznane id (np. z importu JSON) zwracane jest bez zmian.
 */
export function getWaterProfileName(id: string, language: 'pl' | 'en' | string = 'pl'): string {
  if (typeof id !== 'string') return '';
  const cleanId = id.trim();
  if (!cleanId) return '';
  const cleanLang = typeof language === 'string' ? language.trim().toLowerCase() : 'pl';
  const isEn = cleanLang === 'en' || cleanLang.startsWith('en');
  const recipe = findWaterRecipeById(cleanId);
  if (recipe) {
    return isEn ? (recipe.nameEn || recipe.namePl) : (recipe.namePl || recipe.nameEn);
  }
  const bottled = findBottledWaterById(cleanId);
  if (bottled) {
    return bottled.brandName;
  }
  return cleanId;
}

export interface WaterCalculationResult {
  waterVolumeLiters: number;
  targetGhPpm: number;
  targetKhPpm: number;
  // Metoda A: Gotowe butelki koncentratu Barista Hustle (1.68g NaHCO3 / 500g i 2.45g MgSO4 / 500g)
  concentrateBufferGrams: number;
  concentrateHardnessGrams: number;
  baseWaterGrams: number; // Dopełnienie do 1000g na każdy litr (woda demineralizowana/RO)
  // Metoda B: Bezpośrednie odważenie suchych soli do wody bazowej
  dryBakingSodaNaHCO3Grams: number;
  dryEpsomSaltMgSO4Grams: number;
  dryCalciumChlorideCaCl2Grams: number; // opcjonalny wariant wapniowy
}

/**
 * Wylicza zapotrzebowanie na koncentraty i sole mineralne dla zadanej objętości wody
 * @param waterVolumeLiters Objętość wody bazowej (np. 1.0, 5.0)
 * @param targetGh Twardość ogólna w ppm CaCO3 (magnez/wapń)
 * @param targetKh Alkaliczność/bufor w ppm CaCO3 (wodorowęglan)
 */
export function calculateWaterMinerals(
  waterVolumeLiters: number | string,
  targetGh: number | string,
  targetKh: number | string
): WaterCalculationResult {
  const rawVol =
    typeof waterVolumeLiters !== 'number' && typeof waterVolumeLiters !== 'string'
      ? NaN
      : (typeof waterVolumeLiters === 'string' ? parseFloat(waterVolumeLiters.trim().replace(/,/g, '.')) : waterVolumeLiters);
  const rawGh =
    typeof targetGh !== 'number' && typeof targetGh !== 'string'
      ? NaN
      : (typeof targetGh === 'string' ? parseFloat(targetGh.trim().replace(/,/g, '.')) : targetGh);
  const rawKh =
    typeof targetKh !== 'number' && typeof targetKh !== 'string'
      ? NaN
      : (typeof targetKh === 'string' ? parseFloat(targetKh.trim().replace(/,/g, '.')) : targetKh);
  let vol = Number.isFinite(rawVol) && rawVol > 0 && !Object.is(rawVol, -0) ? Math.max(0.1, Math.min(1000.0, rawVol)) : 1.0;
  if (Object.is(vol, -0)) vol = 1.0;
  let gh = Number.isFinite(rawGh) && rawGh >= 0 && !Object.is(rawGh, -0) ? Math.max(0, Math.min(5000, rawGh)) : 0;
  let kh = Number.isFinite(rawKh) && rawKh >= 0 && !Object.is(rawKh, -0) ? Math.max(0, Math.min(5000, rawKh)) : 0;
  if (Object.is(gh, -0)) gh = 0;
  if (Object.is(kh, -0)) kh = 0;

  // W systemie koncentratów Barista Hustle:
  // 1g Buffer Concentrate dodany do 1L wody = 2 ppm KH
  // 1g Hardness Concentrate dodany do 1L wody = 2 ppm GH
  let concentrateBuffer = Number(((kh / 2.0) * vol).toFixed(1));
  let concentrateHardness = Number(((gh / 2.0) * vol).toFixed(1));
  if (Object.is(concentrateBuffer, -0) || concentrateBuffer < 0 || !Number.isFinite(concentrateBuffer)) concentrateBuffer = 0;
  if (Object.is(concentrateHardness, -0) || concentrateHardness < 0 || !Number.isFinite(concentrateHardness)) concentrateHardness = 0;

  // Waga suchych soli do bezpośredniego rozpuszczenia:
  // NaHCO3: 1 ppm KH = 0.00168 g NaHCO3 na 1L
  let dryNaHCO3 = Number((kh * 0.00168 * vol).toFixed(3));
  if (Object.is(dryNaHCO3, -0) || dryNaHCO3 < 0 || !Number.isFinite(dryNaHCO3)) dryNaHCO3 = 0;

  // MgSO4*7H2O: 1 ppm GH = 0.002465 g soli Epsom na 1L
  let dryMgSO4 = Number((gh * 0.002465 * vol).toFixed(3));
  if (Object.is(dryMgSO4, -0) || dryMgSO4 < 0 || !Number.isFinite(dryMgSO4)) dryMgSO4 = 0;

  // CaCl2*2H2O (wapń): 1 ppm GH = 0.00147 g na 1L
  let dryCaCl2 = Number((gh * 0.00147 * vol).toFixed(3));
  if (Object.is(dryCaCl2, -0) || dryCaCl2 < 0 || !Number.isFinite(dryCaCl2)) dryCaCl2 = 0;

  const totalWaterGrams = vol * 1000;
  const rawBaseWater = totalWaterGrams - concentrateBuffer - concentrateHardness;
  let baseWater = rawBaseWater <= 0 || !Number.isFinite(rawBaseWater) ? 0 : Number(rawBaseWater.toFixed(1));
  if (Object.is(baseWater, -0)) baseWater = 0;

  return {
    waterVolumeLiters: vol,
    targetGhPpm: gh,
    targetKhPpm: kh,
    concentrateBufferGrams: concentrateBuffer,
    concentrateHardnessGrams: concentrateHardness,
    baseWaterGrams: baseWater,
    dryBakingSodaNaHCO3Grams: dryNaHCO3,
    dryEpsomSaltMgSO4Grams: dryMgSO4,
    dryCalciumChlorideCaCl2Grams: dryCaCl2,
  };
}

export interface CationHardnessBreakdown {
  calciumIonPpm: number;
  magnesiumIonPpm: number;
  calciumGhPpm: number;
  magnesiumGhPpm: number;
  totalGhPpm: number;
  cationRatioMgToCa: number;
  dominantCation: 'magnesium' | 'calcium' | 'balanced';
}

/**
 * Oblicza rozbicie twardości ogólnej (GH) na wkład kationów wapnia (Ca2+) i magnezu (Mg2+)
 * zgodnie ze współczynnikami SCA/Hendon (1 mg/L Ca2+ = 2.497 ppm CaCO3; 1 mg/L Mg2+ = 4.118 ppm CaCO3).
 */
export function calculateCationHardnessBreakdown(
  calciumIonPpm: number | string,
  magnesiumIonPpm: number | string
): CationHardnessBreakdown {
  const isInvalid = (val: any) =>
    val === null ||
    val === undefined ||
    typeof val === 'boolean' ||
    typeof val === 'object' ||
    typeof val === 'symbol';

  const rawCa = isInvalid(calciumIonPpm)
    ? 0
    : typeof calciumIonPpm === 'string'
    ? parseFloat(calciumIonPpm.trim().replace(/,/g, '.'))
    : Number(calciumIonPpm);

  const rawMg = isInvalid(magnesiumIonPpm)
    ? 0
    : typeof magnesiumIonPpm === 'string'
    ? parseFloat(magnesiumIonPpm.trim().replace(/,/g, '.'))
    : Number(magnesiumIonPpm);

  const safeCa = Number.isFinite(rawCa) && rawCa >= 0 && !Object.is(rawCa, -0) ? Math.min(2000, rawCa) : 0;
  const safeMg = Number.isFinite(rawMg) && rawMg >= 0 && !Object.is(rawMg, -0) ? Math.min(2000, rawMg) : 0;

  // 1 mg/L Ca2+ = 2.497 ppm CaCO3
  const caGh = Number((safeCa * 2.497).toFixed(2));
  // 1 mg/L Mg2+ = 4.118 ppm CaCO3
  const mgGh = Number((safeMg * 4.118).toFixed(2));
  const totalGh = Number((caGh + mgGh).toFixed(2));

  let ratio = 1;
  let dominant: 'magnesium' | 'calcium' | 'balanced' = 'balanced';
  if (safeCa > 0 && safeMg > 0) {
    ratio = Number((safeMg / safeCa).toFixed(2));
    if (ratio > 1.2) dominant = 'magnesium';
    else if (ratio < 0.8) dominant = 'calcium';
    else dominant = 'balanced';
  } else if (safeMg > 0) {
    ratio = Infinity;
    dominant = 'magnesium';
  } else if (safeCa > 0) {
    ratio = 0;
    dominant = 'calcium';
  }

  return {
    calciumIonPpm: safeCa,
    magnesiumIonPpm: safeMg,
    calciumGhPpm: Object.is(caGh, -0) ? 0 : caGh,
    magnesiumGhPpm: Object.is(mgGh, -0) ? 0 : mgGh,
    totalGhPpm: Object.is(totalGh, -0) ? 0 : totalGh,
    cationRatioMgToCa: Object.is(ratio, -0) ? 0 : ratio,
    dominantCation: dominant,
  };
}

/**
 * Oblicza ilość buforu (NaHCO3 w gramach oraz koncentratu BH w gramach/ml)
 * potrzebną do podniesienia zasadowości z poziomu currentKh do targetKh w zadanej objętości wody.
 * Jeśli currentKh >= targetKh, zwraca 0 (brak konieczności buforowania).
 */
export function calculateBufferAddition(
  waterVolumeLiters: number | string,
  currentKhPpm: number | string,
  targetKhPpm: number | string
): {
  bufferConcentrateGrams: number;
  dryBakingSodaGrams: number;
  khDeficitPpm: number;
} {
  const rawVol =
    typeof waterVolumeLiters !== 'number' && typeof waterVolumeLiters !== 'string'
      ? NaN
      : (typeof waterVolumeLiters === 'string' ? parseFloat(waterVolumeLiters.trim().replace(/,/g, '.')) : waterVolumeLiters);
  const rawCurrentKh =
    typeof currentKhPpm !== 'number' && typeof currentKhPpm !== 'string'
      ? NaN
      : (typeof currentKhPpm === 'string' ? parseFloat(currentKhPpm.trim().replace(/,/g, '.')) : currentKhPpm);
  const rawTargetKh =
    typeof targetKhPpm !== 'number' && typeof targetKhPpm !== 'string'
      ? NaN
      : (typeof targetKhPpm === 'string' ? parseFloat(targetKhPpm.trim().replace(/,/g, '.')) : targetKhPpm);

  let vol = Number.isFinite(rawVol) && rawVol > 0 && !Object.is(rawVol, -0) ? Math.max(0.1, Math.min(1000.0, rawVol)) : 1.0;
  if (Object.is(vol, -0)) vol = 1.0;
  let currentKh = Number.isFinite(rawCurrentKh) && rawCurrentKh >= 0 && !Object.is(rawCurrentKh, -0) ? Math.max(0, Math.min(5000, rawCurrentKh)) : 0;
  let targetKh = Number.isFinite(rawTargetKh) && rawTargetKh >= 0 && !Object.is(rawTargetKh, -0) ? Math.max(0, Math.min(5000, rawTargetKh)) : 0;
  if (Object.is(currentKh, -0)) currentKh = 0;
  if (Object.is(targetKh, -0)) targetKh = 0;

  const rawDeficit = targetKh > currentKh ? targetKh - currentKh : 0;
  const khDeficit = Number(rawDeficit.toFixed(2));

  let concentrateBuffer = Number(((khDeficit / 2.0) * vol).toFixed(1));
  if (Object.is(concentrateBuffer, -0) || concentrateBuffer < 0 || !Number.isFinite(concentrateBuffer)) concentrateBuffer = 0;

  let dryNaHCO3 = Number((khDeficit * 0.00168 * vol).toFixed(3));
  if (Object.is(dryNaHCO3, -0) || dryNaHCO3 < 0 || !Number.isFinite(dryNaHCO3)) dryNaHCO3 = 0;

  return {
    bufferConcentrateGrams: concentrateBuffer,
    dryBakingSodaGrams: dryNaHCO3,
    khDeficitPpm: khDeficit,
  };
}

export interface WaterDiagnosticResult {
  problemPl: string;
  problemEn: string;
  causePl: string;
  causeEn: string;
  recommendationPl: string;
  recommendationEn: string;
}

/**
 * Diagnozuje wpływ parametrów chemicznych wody na sensorykę naparu
 */
export function diagnoseWaterSensoryImpact(
  ghPpm: number | string,
  khPpm: number | string
): WaterDiagnosticResult {
  const isInvalidType = (val: any) =>
    val === null ||
    val === undefined ||
    typeof val === 'boolean' ||
    typeof val === 'object' ||
    typeof val === 'symbol';

  if (isInvalidType(ghPpm) || isInvalidType(khPpm)) {
    return {
      problemPl: 'Nieprawidłowe dane wejściowe parametrów wody.',
      problemEn: 'Invalid input data for water chemistry parameters.',
      causePl: 'Wartości GH lub KH nie mogą być puste, niezdefiniowane ani typu logicznego (boolean).',
      causeEn: 'GH or KH values cannot be null, undefined, or of boolean type.',
      recommendationPl: 'Wprowadź poprawne, dodatnie wartości liczbowe dla twardości GH i buforu KH.',
      recommendationEn: 'Enter valid positive numerical values for GH hardness and KH buffer.',
    };
  }
  const rawGh = typeof ghPpm === 'string' ? parseFloat(ghPpm.trim().replace(/,/g, '.')) : Number(ghPpm);
  const rawKh = typeof khPpm === 'string' ? parseFloat(khPpm.trim().replace(/,/g, '.')) : Number(khPpm);
  let safeGh = Number.isFinite(rawGh) ? rawGh : NaN;
  let safeKh = Number.isFinite(rawKh) ? rawKh : NaN;
  if (Object.is(safeGh, -0)) safeGh = 0;
  if (Object.is(safeKh, -0)) safeKh = 0;

  if (!Number.isFinite(safeGh) || !Number.isFinite(safeKh) || safeGh < 0 || safeKh < 0) {
    return {
      problemPl: 'Nieprawidłowe dane wejściowe parametrów wody.',
      problemEn: 'Invalid input data for water chemistry parameters.',
      causePl: 'Wartości GH lub KH nie są prawidłowymi liczbami skończonymi.',
      causeEn: 'GH or KH values are not valid finite numbers.',
      recommendationPl: 'Wprowadź poprawne, dodatnie wartości liczbowe dla twardości GH i buforu KH.',
      recommendationEn: 'Enter valid positive numerical values for GH hardness and KH buffer.',
    };
  }

  if (safeGh > 1000 || safeKh > 1000) {
    return {
      problemPl: 'Woda niezdatna do parzenia speciality (skrajne zasolenie/mineralizacja).',
      problemEn: 'Water unsuitable for specialty brewing (extreme salinity/mineralization).',
      causePl: 'Ekstremalna mineralizacja (GH lub KH > 1000 ppm CaCO3) uniemożliwia jakąkolwiek kontrolowaną ekstrakcję.',
      causeEn: 'Extreme mineralization (GH or KH > 1000 ppm CaCO3) completely prevents controlled extraction.',
      recommendationPl: 'Użyj czystej wody z odwróconej osmozy (RO) lub wody destylowanej do przygotowania bazy.',
      recommendationEn: 'Use clean reverse osmosis (RO) or distilled water as brewing base.',
    };
  }

  if (safeKh > 75) {
    return {
      problemPl: 'Płaski napar, brak żywej kwasowości owocowej, posmak kredowy.',
      problemEn: 'Flat brew, lack of vibrant fruit acidity, chalky mouthfeel.',
      causePl: 'Zbyt wysoka alkaliczność (bufor KH > 75 ppm CaCO3) neutralizuje naturalne kwasy organiczne kawy (jabłkowy, cytrynowy).',
      causeEn: 'High alkalinity (KH buffer > 75 ppm CaCO3) completely neutralizes natural coffee organic acids (malic, citric).',
      recommendationPl: 'Zmniejsz bufor wodorowęglanowy (rozcieńcz wodę wodą demineralizowaną/RO do KH 35–45 ppm).',
      recommendationEn: 'Lower bicarbonate buffer (dilute base water with RO/distilled water down to KH 35-45 ppm).',
    };
  }

  if (safeKh < 20) {
    return {
      problemPl: 'Agresywny, ostry, chemiczny kwas, brak słodkiego balansu.',
      problemEn: 'Sharp, vinegar-like, unbuffered harsh acid, lack of sweetness.',
      causePl: 'Za niski bufor (KH < 20 ppm CaCO3). Nawet mała ilość kwasów drastycznie obniża pH naparu.',
      causeEn: 'Insufficient buffer (KH < 20 ppm CaCO3). Minute acid amounts drop brew pH drastically.',
      recommendationPl: 'Dodaj bufor sodowy (NaHCO3), aby osiągnąć min. 30–40 ppm KH.',
      recommendationEn: 'Add sodium bicarbonate (NaHCO3) buffer to reach at least 30-40 ppm KH.',
    };
  }

  if (safeGh < 35) {
    return {
      problemPl: 'Cienkie body, niska intensywność aromatów, wodnisty finisz.',
      problemEn: 'Thin body, weak aroma intensity, watery hollow finish.',
      causePl: 'Niedobór kationów magnezu i wapnia (GH < 35 ppm CaCO3). Cząsteczki wody nie mają ładunku do związania olejków i estrów.',
      causeEn: 'Lack of magnesium and calcium cations (GH < 35 ppm CaCO3). Polar solvent lacks binding strength for aroma compounds.',
      recommendationPl: 'Podwyższ twardość ogólną solą magnezową (Epsom) do poziomu 60–85 ppm GH.',
      recommendationEn: 'Increase general hardness with magnesium Epsom salt to 60-85 ppm GH.',
    };
  }

  if (safeGh > 150) {
    return {
      problemPl: 'Ciężka, sucha gorycz, szybkie osadzanie kamienia w czajniku.',
      problemEn: 'Heavy dry bitterness, rapid kettle scale accumulation.',
      causePl: 'Nadmierna twardość ogólna (GH > 150 ppm CaCO3) powoduje nadekstrakcję niepożądanych związków polifenolowych.',
      causeEn: 'Excessive general hardness (GH > 150 ppm CaCO3) over-extracts astringent polyphenols.',
      recommendationPl: 'Zastosuj zmiękczanie lub filtr odwróconej osmozy (RO) przed remineralizacją.',
      recommendationEn: 'Use water softening or reverse osmosis (RO) before remineralizing.',
    };
  }

  return {
    problemPl: 'Optymalny profil wody (Golden Zone).',
    problemEn: 'Optimal water chemistry profile (Golden Zone).',
    causePl: 'Twardość GH (ekstrakcja) i bufor KH (balans kwasowości) mieszczą się w idealnym oknie SCA i Barista Hustle.',
    causeEn: 'GH hardness (extraction power) and KH buffer (acid balance) lie strictly within SCA & Barista Hustle sweet spots.',
    recommendationPl: 'Woda jest doskonale zbalansowana. Skup się na parametrach mielenia i technice nalewania.',
    recommendationEn: 'Water is dialed in perfectly. Focus on grind setting calibration and pouring dynamics.',
  };
}

/**
 * Konwertuje twardość z ppm CaCO3 na stopnie niemieckie dH (1 dH = 17.848 ppm CaCO3)
 */
export function ppmCaCO3ToDegreesDH(ppm: number | string): number {
  if (typeof ppm !== 'number' && typeof ppm !== 'string') return 0;
  const numPpm = typeof ppm === 'string' ? parseFloat(ppm.trim().replace(/,/g, '.')) : ppm;
  if (!Number.isFinite(numPpm) || numPpm <= 0 || Object.is(numPpm, -0)) return 0;
  const safePpm = Math.min(10000, numPpm);
  let result = Number((safePpm / 17.848).toFixed(4));
  if (Object.is(result, -0)) result = 0;
  return result;
}

/**
 * Konwertuje twardość ze stopni niemieckich dH na ppm CaCO3 (1 dH = 17.848 ppm CaCO3)
 */
export function degreesDHToPpmCaCO3(dH: number | string): number {
  if (typeof dH !== 'number' && typeof dH !== 'string') return 0;
  const numDH = typeof dH === 'string' ? parseFloat(dH.trim().replace(/,/g, '.')) : dH;
  if (!Number.isFinite(numDH) || numDH <= 0 || Object.is(numDH, -0)) return 0;
  const safeDH = Math.min(500, numDH);
  let result = Number((safeDH * 17.848).toFixed(2));
  if (Object.is(result, -0)) result = 0;
  return result;
}

/**
 * Konwertuje twardość ze stopni francuskich °fH na ppm CaCO3 (1 °fH = 10 ppm CaCO3)
 */
export function degreesFHToPpmCaCO3(fH: number | string): number {
  if (typeof fH !== 'number' && typeof fH !== 'string') return 0;
  const numFH = typeof fH === 'string' ? parseFloat(fH.trim().replace(/,/g, '.')) : fH;
  if (!Number.isFinite(numFH) || numFH <= 0 || Object.is(numFH, -0)) return 0;
  const safeFH = Math.min(1000, numFH);
  let result = Number((safeFH * 10).toFixed(2));
  if (Object.is(result, -0)) result = 0;
  return result;
}

/**
 * Konwertuje twardość z ppm CaCO3 na stopnie francuskie °fH (1 °fH = 10 ppm CaCO3)
 */
export function ppmCaCO3ToDegreesFH(ppm: number | string): number {
  if (typeof ppm !== 'number' && typeof ppm !== 'string') return 0;
  const numPpm = typeof ppm === 'string' ? parseFloat(ppm.trim().replace(/,/g, '.')) : ppm;
  if (!Number.isFinite(numPpm) || numPpm <= 0 || Object.is(numPpm, -0)) return 0;
  const safePpm = Math.min(10000, numPpm);
  let result = Number((safePpm / 10).toFixed(4));
  if (Object.is(result, -0)) result = 0;
  return result;
}

/**
 * Konwertuje twardość z ppm CaCO3 na stopnie Clarka / angielskie °e (1 °Clark = 14.254 ppm CaCO3)
 */
export function ppmCaCO3ToDegreesClark(ppm: number | string): number {
  if (typeof ppm !== 'number' && typeof ppm !== 'string') return 0;
  const numPpm = typeof ppm === 'string' ? parseFloat(ppm.trim().replace(/,/g, '.')) : ppm;
  if (!Number.isFinite(numPpm) || numPpm <= 0 || Object.is(numPpm, -0)) return 0;
  const safePpm = Math.min(10000, numPpm);
  let result = Number((safePpm / 14.254).toFixed(4));
  if (Object.is(result, -0)) result = 0;
  return result;
}

/**
 * Konwertuje twardość ze stopni Clarka / angielskich °e na ppm CaCO3 (1 °Clark = 14.254 ppm CaCO3)
 */
export function degreesClarkToPpmCaCO3(clark: number | string): number {
  if (typeof clark !== 'number' && typeof clark !== 'string') return 0;
  const numClark = typeof clark === 'string' ? parseFloat(clark.trim().replace(/,/g, '.')) : clark;
  if (!Number.isFinite(numClark) || numClark <= 0 || Object.is(numClark, -0)) return 0;
  const safeClark = Math.min(1000, numClark);
  let result = Number((safeClark * 14.254).toFixed(2));
  if (Object.is(result, -0)) result = 0;
  return result;
}

export type WaterHardnessCategory = 'VERY_SOFT' | 'SOFT' | 'MODERATELY_HARD' | 'HARD' | 'VERY_HARD';

/**
 * Klasyfikuje twardość ogólną wody (GH w ppm CaCO3) wg międzynarodowych norm SCA/WQA
 */
export function classifyWaterHardness(ghPpm: number | string): WaterHardnessCategory {
  if (
    ghPpm === null ||
    ghPpm === undefined ||
    typeof ghPpm === 'boolean' ||
    typeof ghPpm === 'object' ||
    typeof ghPpm === 'symbol'
  ) {
    return 'SOFT';
  }
  const raw = typeof ghPpm === 'string' ? parseFloat(ghPpm.trim().replace(/,/g, '.')) : Number(ghPpm);
  if (!Number.isFinite(raw) || raw < 0) {
    return 'SOFT';
  }
  const safe = Object.is(raw, -0) ? 0 : raw;
  if (safe <= 50) return 'VERY_SOFT';
  if (safe <= 100) return 'SOFT';
  if (safe <= 175) return 'MODERATELY_HARD';
  if (safe <= 300) return 'HARD';
  return 'VERY_HARD';
}

/**
 * Klasyfikuje twardość wody bezpośrednio ze stopni niemieckich dH
 */
export function classifyWaterHardnessFromDH(dH: number | string): WaterHardnessCategory {
  if (typeof dH === 'number' && Object.is(dH, -0)) {
    return 'VERY_SOFT';
  }
  if (dH === '0' || dH === 0) {
    return 'VERY_SOFT';
  }
  const rawNum = typeof dH === 'string' ? parseFloat(dH.trim().replace(/,/g, '.')) : dH;
  if (!Number.isFinite(rawNum) || rawNum < 0) {
    return 'SOFT';
  }
  const ppm = degreesDHToPpmCaCO3(dH);
  return classifyWaterHardness(ppm);
}

/**
 * Klasyfikuje twardość wody bezpośrednio ze stopni Clarka (°e / °Clark)
 */
export function classifyWaterHardnessFromClark(clark: number | string): WaterHardnessCategory {
  if (typeof clark === 'number' && Object.is(clark, -0)) {
    return 'VERY_SOFT';
  }
  if (clark === '0' || clark === 0) {
    return 'VERY_SOFT';
  }
  const rawNum = typeof clark === 'string' ? parseFloat(clark.trim().replace(/,/g, '.')) : clark;
  if (!Number.isFinite(rawNum) || rawNum < 0) {
    return 'SOFT';
  }
  const ppm = degreesClarkToPpmCaCO3(clark);
  return classifyWaterHardness(ppm);
}

/**
 * Klasyfikuje twardość wody na podstawie stopni francuskich (°fH).
 * 1 °fH = 10.0 ppm CaCO3.
 */
export function classifyWaterHardnessFromFH(fH: number | string): WaterHardnessCategory {
  if (typeof fH === 'number' && Object.is(fH, -0)) {
    return 'VERY_SOFT';
  }
  if (fH === '0' || fH === 0 || fH === '-0') {
    return 'VERY_SOFT';
  }
  const rawNum = typeof fH === 'string' ? parseFloat(fH.trim().replace(/,/g, '.')) : fH;
  if (!Number.isFinite(rawNum) || rawNum < 0) {
    return 'SOFT';
  }
  const ppm = degreesFHToPpmCaCO3(fH);
  return classifyWaterHardness(ppm);
}

/**
 * Formatuje nazwę kategorii twardości wody w języku polskim lub angielskim.
 */
export function formatWaterHardnessCategory(
  category: WaterHardnessCategory | string,
  language: 'pl' | 'en' | string = 'pl'
): string {
  const cleanCat = typeof category === 'string' ? category.trim().toUpperCase() : '';
  const isEn = typeof language === 'string' && (language.toLowerCase() === 'en' || language.toLowerCase().startsWith('en'));
  switch (cleanCat) {
    case 'VERY_SOFT':
      return isEn ? 'Very Soft' : 'Bardzo miękka';
    case 'SOFT':
      return isEn ? 'Soft' : 'Miękka';
    case 'MODERATELY_HARD':
      return isEn ? 'Moderately Hard' : 'Średnio twarda';
    case 'HARD':
      return isEn ? 'Hard' : 'Twarda';
    case 'VERY_HARD':
      return isEn ? 'Very Hard' : 'Bardzo twarda';
    default:
      return isEn ? 'Unknown' : 'Nieznana';
  }
}

const RECIPE_ALIASES: Record<string, string> = {
  bh: 'barista_hustle_80_40',
  'bh-80-40': 'barista_hustle_80_40',
  'bh-80/40': 'barista_hustle_80_40',
  'bh 80/40': 'barista_hustle_80_40',
  'bh 80 40': 'barista_hustle_80_40',
  'barista-hustle': 'barista_hustle_80_40',
  'barista hustle': 'barista_hustle_80_40',
  sca: 'sca_standard',
  'sca-standard': 'sca_standard',
  'sca standard': 'sca_standard',
  melbourne: 'melbourne_soft',
  'melbourne-soft': 'melbourne_soft',
  'melbourne soft': 'melbourne_soft',
  rao: 'scott_rao_wonder',
  'scott-rao': 'scott_rao_wonder',
  'scott rao': 'scott_rao_wonder',
  scottrao: 'scott_rao_wonder',
  hendon: 'hendon_medium_dark',
  'hendon-hard': 'hendon_medium_dark',
  'hendon hard': 'hendon_medium_dark',
  'tea-delicate': 'tea_delicate',
  'tea delicate': 'tea_delicate',
  'rock-tea': 'tea_gongfu_rock_puerh',
  'rock tea': 'tea_gongfu_rock_puerh',
  puerh: 'tea_gongfu_rock_puerh',
  'gongfu-rock': 'tea_gongfu_rock_puerh',
};

export function findWaterRecipeById(id: string): WaterRecipe | undefined {
  if (typeof id !== 'string') return undefined;
  const cleanId = id.trim().toLowerCase();
  if (!cleanId) return undefined;
  const underscoreId = cleanId.replace(/-/g, '_');
  const hyphenId = cleanId.replace(/_/g, '-');
  const normId = cleanId.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const aliasId = RECIPE_ALIASES[normId] || RECIPE_ALIASES[normId.replace(/[\s_-]+/g, '')];
  if (aliasId) {
    const directMatch = WATER_RECIPES.find((r) => r.id === aliasId);
    if (directMatch) return directMatch;
  }

  return WATER_RECIPES.find((r) => {
    if (!r || typeof r !== 'object') return false;
    if (typeof r.id === 'string') {
      const rIdLower = r.id.toLowerCase();
      if (rIdLower === cleanId || rIdLower === underscoreId || rIdLower === hyphenId) return true;
    }
    if (typeof r.namePl === 'string') {
      const plClean = r.namePl.toLowerCase();
      const plNorm = r.namePl.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      if (plClean === cleanId || plNorm === normId || plClean.includes(cleanId) || cleanId.includes(plClean)) return true;
    }
    if (typeof r.nameEn === 'string') {
      const enClean = r.nameEn.toLowerCase();
      const enNorm = r.nameEn.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      if (enClean === cleanId || enNorm === normId || enClean.includes(cleanId) || cleanId.includes(enClean)) return true;
    }
    return false;
  });
}

const BOTTLED_ALIASES: Record<string, string> = {
  volvic: 'volvic',
  zywiec: 'zywiec_zdroj',
  'zywiec-zdroj': 'zywiec_zdroj',
  'zywiec zdroj': 'zywiec_zdroj',
  'zywiec-zdroj-niegazowany': 'zywiec_zdroj',
  'zywiec zdroj niegazowany': 'zywiec_zdroj',
  zywiecki: 'zywiecki_krysztal',
  'zywiecki-krysztal': 'zywiecki_krysztal',
  muszyna: 'muszynianka',
  muszynianka: 'muszynianka',
  cechini: 'muszynianka',
  'cechini muszyna': 'muszynianka',
  'cechini-muszyna': 'muszynianka',
  spa: 'spa_reine',
  spareine: 'spa_reine',
  'spa-reine': 'spa_reine',
  evian: 'evian',
  tesco: 'ashbeck',
  ashbeck: 'ashbeck',
  'tesco-ashbeck': 'ashbeck',
  'tesco ashbeck': 'ashbeck',
  tescoashbeck: 'ashbeck',
  'highland-spring': 'highland_spring',
  'highland spring': 'highland_spring',
  highlandspring: 'highland_spring',
  highland: 'highland_spring',
  'acqua-panna': 'aqua_panna',
  'acqua panna': 'aqua_panna',
  acquapanna: 'aqua_panna',
  'aqua-panna': 'aqua_panna',
  'aqua panna': 'aqua_panna',
  aquapanna: 'aqua_panna',
  panna: 'aqua_panna',
  'crystal-geyser': 'crystal_geyser',
  'crystal geyser': 'crystal_geyser',
  crystalgeyser: 'crystal_geyser',
  geyser: 'crystal_geyser',
};

export function findBottledWaterById(id: string): BottledWaterProfile | undefined {
  if (typeof id !== 'string') return undefined;
  const cleanId = id.trim().toLowerCase();
  if (!cleanId) return undefined;
  const underscoreId = cleanId.replace(/-/g, '_');
  const hyphenId = cleanId.replace(/_/g, '-');
  const normId = cleanId.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const aliasId = BOTTLED_ALIASES[normId] || BOTTLED_ALIASES[normId.replace(/[\s_-]+/g, '')];
  if (aliasId) {
    const directMatch = BOTTLED_WATER_BENCHMARKS.find((w) => w.id === aliasId);
    if (directMatch) return directMatch;
  }

  return BOTTLED_WATER_BENCHMARKS.find((w) => {
    if (!w || typeof w !== 'object') return false;
    if (typeof w.id === 'string') {
      const wIdLower = w.id.toLowerCase();
      if (wIdLower === cleanId || wIdLower === underscoreId || wIdLower === hyphenId) return true;
    }
    if (typeof w.brandName === 'string') {
      const brandClean = w.brandName.toLowerCase();
      const brandNorm = w.brandName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      if (brandClean === cleanId || brandNorm === normId || brandClean.includes(cleanId) || cleanId.includes(brandClean)) return true;
      const tokens = brandNorm.split(/[\s/(),-]+/).filter(Boolean);
      if (tokens.some((tok) => tok === normId || (tok.length >= 3 && cleanId.includes(tok)))) return true;
    }
    return false;
  });
}

/**
 * Zwraca listę wód butelkowanych przefiltrowanych wg oceny przydatności (suitability).
 * Domyślnie lub dla 'ALL' zwraca wszystkie dostępne wody.
 */
export function getBottledWatersBySuitability(
  suitability?: BottledWaterProfile['suitability'] | 'ALL' | string
): BottledWaterProfile[] {
  if (!suitability || typeof suitability !== 'string') {
    return [...BOTTLED_WATER_BENCHMARKS];
  }
  const clean = suitability.trim().toUpperCase();
  if (!clean || clean === 'ALL') {
    return [...BOTTLED_WATER_BENCHMARKS];
  }
  return BOTTLED_WATER_BENCHMARKS.filter((w) => w.suitability === clean);
}

/**
 * Wyszukuje wody butelkowane wg zapytania tekstowego (nazwa marki, kraj pochodzenia, werdykt).
 */
export function searchBottledWaters(query?: string): BottledWaterProfile[] {
  if (typeof query !== 'string') {
    return [...BOTTLED_WATER_BENCHMARKS];
  }
  const clean = query.trim().toLowerCase();
  if (!clean) {
    return [...BOTTLED_WATER_BENCHMARKS];
  }
  const normQuery = clean.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  return BOTTLED_WATER_BENCHMARKS.filter((w) => {
    if (!w) return false;
    const brandLower = (w.brandName || '').toLowerCase();
    const brandNorm = brandLower.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const originLower = (w.originCountry || '').toLowerCase();
    const originNorm = originLower.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const idLower = (w.id || '').toLowerCase();

    return (
      brandLower.includes(clean) ||
      brandNorm.includes(normQuery) ||
      originLower.includes(clean) ||
      originNorm.includes(normQuery) ||
      idLower.includes(clean) ||
      idLower.includes(normQuery)
    );
  });
}

