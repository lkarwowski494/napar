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

/**
 * Wyszukuje receptury wody specialty wg zapytania tekstowego (nazwa, przeznaczenie, opis, id).
 */
export function searchWaterRecipes(query?: string): WaterRecipe[] {
  if (typeof query !== 'string') {
    return [...WATER_RECIPES];
  }
  const clean = query.trim().toLowerCase();
  if (!clean) {
    return [...WATER_RECIPES];
  }
  const normQuery = clean.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  return WATER_RECIPES.filter((r) => {
    if (!r) return false;
    const namePlLower = (r.namePl || '').toLowerCase();
    const namePlNorm = namePlLower.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const nameEnLower = (r.nameEn || '').toLowerCase();
    const nameEnNorm = nameEnLower.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const descPlLower = (r.descriptionPl || '').toLowerCase();
    const descEnLower = (r.descriptionEn || '').toLowerCase();
    const bestForPlLower = (r.bestForPl || '').toLowerCase();
    const bestForEnLower = (r.bestForEn || '').toLowerCase();
    const idLower = (r.id || '').toLowerCase();

    return (
      namePlLower.includes(clean) ||
      namePlNorm.includes(normQuery) ||
      nameEnLower.includes(clean) ||
      nameEnNorm.includes(normQuery) ||
      descPlLower.includes(clean) ||
      descEnLower.includes(clean) ||
      bestForPlLower.includes(clean) ||
      bestForEnLower.includes(clean) ||
      idLower.includes(clean)
    );
  });
}

export interface WaterSuitabilityEvaluation {
  suitability: 'EXCELLENT' | 'GOOD' | 'ACCEPTABLE' | 'NOT_RECOMMENDED';
  ratingPl: string;
  ratingEn: string;
  verdictPl: string;
  verdictEn: string;
}

/**
 * Dynamicznie ocenia przydatność parametrów mineralnych wody (GH i KH w ppm CaCO3)
 * do parzenia kawy specialty lub herbaty rzemieślniczej.
 */
export function evaluateWaterSuitability(
  ghPpm: number | string,
  khPpm: number | string,
  beverage: 'coffee' | 'tea' | string = 'coffee'
): WaterSuitabilityEvaluation {
  const parseVal = (v: unknown): number => {
    if (typeof v === 'number') return Number.isFinite(v) && !Object.is(v, -0) ? Math.max(0, Math.min(5000, v)) : 0;
    if (typeof v === 'string') {
      const parsed = parseFloat(v.replace(/\uFEFF/g, '').replace(',', '.').trim());
      return Number.isFinite(parsed) && !Object.is(parsed, -0) ? Math.max(0, Math.min(5000, parsed)) : 0;
    }
    return 0;
  };

  const gh = parseVal(ghPpm);
  const kh = parseVal(khPpm);
  const isTea = typeof beverage === 'string' && beverage.trim().toLowerCase() === 'tea';

  if (isTea) {
    if (kh > 70 || gh > 150) {
      return {
        suitability: 'NOT_RECOMMENDED',
        ratingPl: 'Niezalecana',
        ratingEn: 'Not Recommended',
        verdictPl: 'Zbyt twarda woda do herbaty; gasi delikatne aromaty i powoduje mętność naparu.',
        verdictEn: 'Too hard for tea; suppresses delicate florals and creates murky brew.',
      };
    }
    if (gh <= 50 && kh <= 35) {
      return {
        suitability: 'EXCELLENT',
        ratingPl: 'Znakomita',
        ratingEn: 'Excellent',
        verdictPl: 'Idealna, miękka woda źródlana; pełna czystość i słodycz herbaty.',
        verdictEn: 'Ideal soft spring water; optimal clarity and tea sweetness.',
      };
    }
    if (gh <= 80 && kh <= 50) {
      return {
        suitability: 'GOOD',
        ratingPl: 'Dobra',
        ratingEn: 'Good',
        verdictPl: 'Dobra woda do herbaty; zbalansowany profil dla oolongów i herbat czarnych.',
        verdictEn: 'Good tea water; balanced profile for wulong and black teas.',
      };
    }
    return {
      suitability: 'ACCEPTABLE',
      ratingPl: 'Akceptowalna',
      ratingEn: 'Acceptable',
      verdictPl: 'Akceptowalne parametry dla mocniejszych herbat.',
      verdictEn: 'Acceptable parameters for robust teas.',
    };
  }

  // Coffee
  if (kh > 120 || gh > 300) {
    return {
      suitability: 'NOT_RECOMMENDED',
      ratingPl: 'Niezalecana',
      ratingEn: 'Not Recommended',
      verdictPl: 'Zbyt twarda woda; gasi kwasowość i tworzy kamień kotłowy w czajniku.',
      verdictEn: 'Water is too hard; mutes acidity and scales kettle.',
    };
  }
  if (gh >= 50 && gh <= 150 && kh >= 35 && kh <= 65) {
    return {
      suitability: 'EXCELLENT',
      ratingPl: 'Znakomita',
      ratingEn: 'Excellent',
      verdictPl: 'Idealne parametry SCA Golden Cup; czysta ekstrakcja i pełna słodycz kawy.',
      verdictEn: 'Ideal SCA Golden Cup parameters; clean extraction and high sweetness.',
    };
  }
  if (gh >= 30 && gh <= 200 && kh >= 20 && kh <= 85) {
    return {
      suitability: 'GOOD',
      ratingPl: 'Dobra',
      ratingEn: 'Good',
      verdictPl: 'Dobra woda do kawy; powtarzalna i zbalansowana ekstrakcja.',
      verdictEn: 'Good water for coffee; consistent and balanced extraction.',
    };
  }
  return {
    suitability: 'ACCEPTABLE',
    ratingPl: 'Akceptowalna',
    ratingEn: 'Acceptable',
    verdictPl: 'Akceptowalne parametry; możliwe lekkie przesunięcie balansu kwasowo-goryczkowego.',
    verdictEn: 'Acceptable parameters; minor balance shift possible.',
  };
}




export interface WaterBlendParams {
  tapHardnessPpm: number;
  pureWaterHardnessPpm?: number;
  targetHardnessPpm: number;
  totalBatchGrams: number;
}

export interface WaterBlendResult {
  tapWaterGrams: number;
  pureWaterGrams: number;
  totalBatchGrams: number;
  effectiveHardnessPpm: number;
}

/**
 * Oblicza proporcje mieszania twardej wody kranowej z wodą zdemineralizowaną (RO / destylowaną)
 * w celu osiągnięcia zadanego poziomu twardości ogólnej lub bufora.
 */
export function calculateWaterBlend(params: WaterBlendParams): WaterBlendResult {
  if (!params || typeof params !== 'object') {
    throw new Error('Parametry mieszania wody są wymagane');
  }

  const tapHardness = Number(params.tapHardnessPpm);
  const pureHardness =
    params.pureWaterHardnessPpm != null && Number.isFinite(Number(params.pureWaterHardnessPpm))
      ? Math.max(0, Number(params.pureWaterHardnessPpm))
      : 0;
  const targetHardness = Number(params.targetHardnessPpm);
  const totalBatch = Number(params.totalBatchGrams);

  if (!Number.isFinite(tapHardness) || tapHardness <= 0) {
    throw new Error('Twardość wody kranowej musi być większa od zera');
  }
  if (!Number.isFinite(targetHardness) || targetHardness < 0) {
    throw new Error('Docelowa twardość wody nie może być ujemna');
  }
  if (!Number.isFinite(totalBatch) || totalBatch <= 0) {
    throw new Error('Objętość partii wody musi być większa od zera');
  }

  if (tapHardness <= pureHardness) {
    throw new Error('Twardość kranowa musi być większa niż twardość wody czystej');
  }

  let tapGrams: number;
  let pureGrams: number;

  if (targetHardness >= tapHardness) {
    tapGrams = totalBatch;
    pureGrams = 0;
  } else if (targetHardness <= pureHardness) {
    tapGrams = 0;
    pureGrams = totalBatch;
  } else {
    const factor = (targetHardness - pureHardness) / (tapHardness - pureHardness);
    tapGrams = totalBatch * factor;
    pureGrams = totalBatch - tapGrams;
  }

  const effectivePpm = (tapGrams * tapHardness + pureGrams * pureHardness) / totalBatch;

  return {
    tapWaterGrams: Number(tapGrams.toFixed(1)),
    pureWaterGrams: Number(pureGrams.toFixed(1)),
    totalBatchGrams: Number(totalBatch.toFixed(1)),
    effectiveHardnessPpm: Number(effectivePpm.toFixed(1)),
  };
}

export interface HardnessRatioAnalysis {
  ratio: number;
  category: 'balanced' | 'chalky_buffered' | 'acidic_unbuffered';
  descriptionPl: string;
  descriptionEn: string;
}

/**
 * Oblicza i analizuje stosunek twardości ogólnej (GH) do twardości węglanowej / alkaliczności (KH).
 * Optymalna relacja dla specialty coffee mieści się w zakresie 1.5 - 3.5.
 */
export function calculateHardnessRatio(
  ghPpm: number | string,
  khPpm: number | string
): HardnessRatioAnalysis {
  const parseVal = (v: unknown): number => {
    if (typeof v === 'number') return Number.isFinite(v) && !Object.is(v, -0) ? Math.max(0, v) : 0;
    if (typeof v === 'string') {
      const parsed = parseFloat(v.replace(/\uFEFF/g, '').replace(',', '.').trim());
      return Number.isFinite(parsed) && !Object.is(parsed, -0) ? Math.max(0, parsed) : 0;
    }
    return 0;
  };

  const gh = parseVal(ghPpm);
  const kh = parseVal(khPpm);

  let rawRatio: number;
  if (kh > 0) {
    rawRatio = gh / kh;
  } else if (gh > 0) {
    rawRatio = gh;
  } else {
    rawRatio = 0;
  }

  const ratio = Number(Math.min(100, rawRatio).toFixed(2));

  let category: 'balanced' | 'chalky_buffered' | 'acidic_unbuffered';
  let descriptionPl: string;
  let descriptionEn: string;

  if (ratio < 1.5) {
    category = 'chalky_buffered';
    descriptionPl = 'Niska proporcja GH:KH (< 1.5) — kwasowość jest silnie tłumiona przez bufor zasadowy, napar może być płaski.';
    descriptionEn = 'Low GH:KH ratio (< 1.5) — acidity is excessively buffered, beverage may taste chalky or flat.';
  } else if (ratio > 3.5) {
    category = 'acidic_unbuffered';
    descriptionPl = 'Wysoka proporcja GH:KH (> 3.5) — niewystarczający bufor zasadowy, kwasowość może być ostra i gryząca.';
    descriptionEn = 'High GH:KH ratio (> 3.5) — insufficient alkalinity buffer, acidity may taste sour or aggressive.';
  } else {
    category = 'balanced';
    descriptionPl = 'Optymalna proporcja GH:KH (1.5 - 3.5) — zrównoważona ekstrakcja z zachowaniem słodyczy i żywej kwasowości.';
    descriptionEn = 'Optimal GH:KH ratio (1.5 - 3.5) — balanced extraction preserving sweetness and vibrant acidity.';
  }

  return {
    ratio,
    category,
    descriptionPl,
    descriptionEn,
  };
}

export interface WaterDilutionResult {
  sourceVolumeMl: number;
  diluentVolumeMl: number;
  totalVolumeMl: number;
  dilutionFactor: number;
  achievedPpm: number;
  isDilutionNeeded: boolean;
}

/**
 * Oblicza proporcje rozcieńczania wody źródlanej/kranowej wodą czystą (RO/destylowaną),
 * aby obniżyć stężenie minerałów (TDS/GH/KH) do pożądanego poziomu.
 */
export function calculateWaterDilution(
  sourcePpm: number | string,
  targetPpm: number | string,
  targetVolumeMl: number | string,
  diluentPpm: number | string = 0
): WaterDilutionResult {
  const parseNum = (v: unknown): number => {
    if (typeof v === 'number') return Number.isFinite(v) && !Object.is(v, -0) ? Math.max(0, v) : 0;
    if (typeof v === 'string') {
      const parsed = parseFloat(v.replace(/\uFEFF/g, '').replace(',', '.').trim());
      return Number.isFinite(parsed) && !Object.is(parsed, -0) ? Math.max(0, parsed) : 0;
    }
    return 0;
  };

  const src = parseNum(sourcePpm);
  const tgt = parseNum(targetPpm);
  const totVol = parseNum(targetVolumeMl);
  const dil = parseNum(diluentPpm);

  if (totVol <= 0) {
    return {
      sourceVolumeMl: 0,
      diluentVolumeMl: 0,
      totalVolumeMl: 0,
      dilutionFactor: 1,
      achievedPpm: 0,
      isDilutionNeeded: false,
    };
  }

  if (src <= tgt || src <= dil) {
    return {
      sourceVolumeMl: Number(totVol.toFixed(1)),
      diluentVolumeMl: 0,
      totalVolumeMl: Number(totVol.toFixed(1)),
      dilutionFactor: 1,
      achievedPpm: Number(src.toFixed(1)),
      isDilutionNeeded: false,
    };
  }

  let rawSourceVol: number;
  if (tgt <= dil) {
    rawSourceVol = 0;
  } else {
    rawSourceVol = totVol * ((tgt - dil) / (src - dil));
  }

  const safeSourceVol = Math.max(0, Math.min(totVol, rawSourceVol));
  const safeDiluentVol = Math.max(0, totVol - safeSourceVol);

  const sourceVolumeMl = Number(safeSourceVol.toFixed(1));
  const diluentVolumeMl = Number(safeDiluentVol.toFixed(1));
  const totalVolumeMl = Number(totVol.toFixed(1));

  const dilutionFactor =
    sourceVolumeMl > 0
      ? Number((totalVolumeMl / sourceVolumeMl).toFixed(2))
      : 1;

  const achievedPpm =
    totalVolumeMl > 0
      ? Number(((sourceVolumeMl * src + diluentVolumeMl * dil) / totalVolumeMl).toFixed(1))
      : 0;

  return {
    sourceVolumeMl,
    diluentVolumeMl,
    totalVolumeMl,
    dilutionFactor,
    achievedPpm,
    isDilutionNeeded: true,
  };
}

export interface WaterTdsEstimate {
  estimatedTdsPpm: number;
  estimatedEcMicroSiemens: number;
  category: 'low_mineral' | 'optimal_specialty' | 'high_mineral';
  descriptionPl: string;
  descriptionEn: string;
}

/**
 * Szacuje całkowite stężenie rozpuszczonych substancji mineralnych (TDS w ppm)
 * oraz przewodność elektrolityczną (EC w µS/cm) na podstawie twardości ogólnej (GH)
 * i węglanowej (KH).
 */
export function estimateWaterTdsFromHardness(
  ghPpm: number | string,
  khPpm: number | string,
  additionalSaltsPpm: number | string = 15
): WaterTdsEstimate {
  const parseNum = (v: unknown, fallback = 0): number => {
    if (typeof v === 'number') return Number.isFinite(v) && !Object.is(v, -0) ? Math.max(0, v) : fallback;
    if (typeof v === 'string') {
      const parsed = parseFloat(v.replace(/\uFEFF/g, '').replace(',', '.').trim());
      return Number.isFinite(parsed) && !Object.is(parsed, -0) ? Math.max(0, parsed) : fallback;
    }
    return fallback;
  };

  const gh = parseNum(ghPpm, 0);
  const kh = parseNum(khPpm, 0);
  const salts = parseNum(additionalSaltsPpm, 0);

  const rawTds = gh + kh + salts;
  const estimatedTdsPpm = Number(Math.max(0, Math.min(5000, rawTds)).toFixed(1));

  const rawEc = estimatedTdsPpm > 0 ? estimatedTdsPpm / 0.65 : 0;
  const estimatedEcMicroSiemens = Math.round(rawEc);

  let category: 'low_mineral' | 'optimal_specialty' | 'high_mineral';
  let descriptionPl: string;
  let descriptionEn: string;

  if (estimatedTdsPpm < 75) {
    category = 'low_mineral';
    descriptionPl = 'Niska mineralizacja (< 75 ppm TDS) — woda bardzo miękka, sprzyja herbatom zielonym i delikatnym, lecz w kawie może brakować ciała.';
    descriptionEn = 'Low mineralization (< 75 ppm TDS) — very soft water, ideal for delicate and green teas, but coffee may lack sweetness and body.';
  } else if (estimatedTdsPpm > 175) {
    category = 'high_mineral';
    descriptionPl = 'Wysoka mineralizacja (> 175 ppm TDS) — ryzyko nadmiernej ekstrakcji goryczy, płaskiego profilu i powstawania kamienia w bojlerze.';
    descriptionEn = 'High mineralization (> 175 ppm TDS) — risk of extracting harsh bitterness, chalky cup, and scale accumulation.';
  } else {
    category = 'optimal_specialty';
    descriptionPl = 'Optymalna mineralizacja specialty (75 - 175 ppm TDS) — zrównoważona ekstrakcja według standardów SCA.';
    descriptionEn = 'Optimal specialty mineralization (75 - 175 ppm TDS) — balanced extraction per SCA water guidelines.';
  }

  return {
    estimatedTdsPpm,
    estimatedEcMicroSiemens,
    category,
    descriptionPl,
    descriptionEn,
  };
}


export type AlkalinityCategory = 'low_buffer' | 'optimal_buffer' | 'moderate_buffer' | 'excessive_buffer';

export interface AlkalinityEvaluation {
  alkalinityPpm: number;
  category: AlkalinityCategory;
  bufferCapacity: 'insufficient' | 'ideal' | 'elevated' | 'excessive';
  acidityImpactPl: string;
  acidityImpactEn: string;
  recommendedAdjustmentPl: string;
  recommendedAdjustmentEn: string;
}

/**
 * Ocenia zasadowość (alkalinity / KH w ppm CaCO3) wody, jej pojemność buforową
 * oraz wpływ na sensorykę kwasowości w naparze kawowym.
 */
export function evaluateWaterAlkalinity(khPpm: number | string): AlkalinityEvaluation {
  const parseNum = (v: unknown, fallback = 0): number => {
    if (typeof v === 'number') return Number.isFinite(v) && !Object.is(v, -0) ? Math.max(0, v) : fallback;
    if (typeof v === 'string') {
      const parsed = parseFloat(v.replace(/\uFEFF/g, '').replace(',', '.').trim());
      return Number.isFinite(parsed) && !Object.is(parsed, -0) ? Math.max(0, parsed) : fallback;
    }
    return fallback;
  };

  const alkalinityPpm = Number(parseNum(khPpm, 0).toFixed(1));

  let category: AlkalinityCategory;
  let bufferCapacity: 'insufficient' | 'ideal' | 'elevated' | 'excessive';
  let acidityImpactPl: string;
  let acidityImpactEn: string;
  let recommendedAdjustmentPl: string;
  let recommendedAdjustmentEn: string;

  if (alkalinityPpm < 25) {
    category = 'low_buffer';
    bufferCapacity = 'insufficient';
    acidityImpactPl = 'Niski bufor — kwasowość kawy może być agresywna, ostra i nieprzyjemnie cytrynowa, a napar podatny na wahania pH.';
    acidityImpactEn = 'Low buffer — coffee acidity may taste sour, sharp and unbuffered, making the brew vulnerable to pH drops.';
    recommendedAdjustmentPl = 'Dodaj wodorowęglan sodu (sodę oczyszczoną) lub wodorowęglan potasu, aby podnieść KH do ~40 ppm.';
    recommendedAdjustmentEn = 'Add sodium or potassium bicarbonate to raise alkalinity/KH to ~40 ppm.';
  } else if (alkalinityPpm <= 55) {
    category = 'optimal_buffer';
    bufferCapacity = 'ideal';
    acidityImpactPl = 'Optymalny bufor specialty — doskonały balans pomiędzy czystą, żywą kwasowością a słodyczą i stabilnością pH.';
    acidityImpactEn = 'Optimal specialty buffer — perfect balance of vibrant, clean acidity, sweetness and pH stability.';
    recommendedAdjustmentPl = 'Parametry w strefie idealnej według standardów SCA (docelowo 40 ppm CaCO3). Nie wymaga korekty.';
    recommendedAdjustmentEn = 'Parameters within the ideal SCA window (target 40 ppm CaCO3). No adjustment needed.';
  } else if (alkalinityPpm <= 90) {
    category = 'moderate_buffer';
    bufferCapacity = 'elevated';
    acidityImpactPl = 'Podwyższony bufor — delikatne nuty owocowe i cytrusowe są stłumione, uwypuklone nuty czekoladowe i prażone.';
    acidityImpactEn = 'Elevated buffer — delicate fruity and floral acidity is muted, shifting flavor toward roasted and chocolate notes.';
    recommendedAdjustmentPl = 'Rozcieńcz wodę wodą demineralizowaną / RO lub użyj filtra dekarbonizującego (wymiana kationowa).';
    recommendedAdjustmentEn = 'Dilute with RO / distilled water or use a decarbonizing ion-exchange filter.';
  } else {
    category = 'excessive_buffer';
    bufferCapacity = 'excessive';
    acidityImpactPl = 'Zbyt wysoka zasadowość — napar jest płaski, kredowy, pozbawiony energii i słodyczy. Wysokie ryzyko osadzania kamienia kotłowego.';
    acidityImpactEn = 'Excessive alkalinity — brew is chalky, dull, lacking vibrancy and sweetness. High risk of limescale buildup.';
    recommendedAdjustmentPl = 'Wymaga znacznego rozcieńczenia z wodą RO / demineralizowaną lub całkowitego uzdatnienia osmotycznego.';
    recommendedAdjustmentEn = 'Requires substantial dilution with RO / distilled water or complete reverse osmosis remineralization.';
  }

  return {
    alkalinityPpm,
    category,
    bufferCapacity,
    acidityImpactPl,
    acidityImpactEn,
    recommendedAdjustmentPl,
    recommendedAdjustmentEn,
  };
}


export type CationRatioCategory = 'magnesium_dominant' | 'balanced_specialty' | 'calcium_dominant' | 'pure_soft';

export interface MineralCationRatioAnalysis {
  calciumIonPpm: number;
  magnesiumIonPpm: number;
  ratioMgToCa: number;
  category: CationRatioCategory;
  sensoryEmphasisPl: string;
  sensoryEmphasisEn: string;
  limescaleRisk: 'minimal' | 'low' | 'moderate' | 'high';
  recommendedUsagePl: string;
  recommendedUsageEn: string;
}

/**
 * Analizuje stosunek kationów magnezu (Mg2+) do wapnia (Ca2+) w wodzie parzenia
 * oraz ich wpływ sensoryczny na ekstrakcję kwasowości i ryzyko powstawania kamienia kotłowego.
 */
export function calculateMagnesiumCalciumRatio(
  calciumIonPpm: number | string,
  magnesiumIonPpm: number | string
): MineralCationRatioAnalysis {
  const parseNum = (v: unknown): number => {
    if (typeof v === 'number') return Number.isFinite(v) && !Object.is(v, -0) ? Math.max(0, Math.min(2000, v)) : 0;
    if (typeof v === 'string') {
      const parsed = parseFloat(v.replace(/\uFEFF/g, '').replace(',', '.').trim());
      return Number.isFinite(parsed) && !Object.is(parsed, -0) ? Math.max(0, Math.min(2000, parsed)) : 0;
    }
    return 0;
  };

  const ca = Number(parseNum(calciumIonPpm).toFixed(1));
  const mg = Number(parseNum(magnesiumIonPpm).toFixed(1));

  if (ca === 0 && mg === 0) {
    return {
      calciumIonPpm: 0,
      magnesiumIonPpm: 0,
      ratioMgToCa: 0,
      category: 'pure_soft',
      sensoryEmphasisPl: 'Brak minerałów kationowych — woda ultra-miękka, płaski napar pozbawiony wyrazistości.',
      sensoryEmphasisEn: 'Zero cation minerals — ultra-soft water, thin extraction lacking vibrancy.',
      limescaleRisk: 'minimal',
      recommendedUsagePl: 'Zalecana remineralizacja solami magnezu i wapnia przed parzeniem.',
      recommendedUsageEn: 'Remineralization with magnesium and calcium salts recommended before brewing.',
    };
  }

  let rawRatio = 0;
  if (ca > 0) {
    rawRatio = mg / ca;
  } else {
    rawRatio = Number(mg.toFixed(2));
  }

  const ratioMgToCa = Number(rawRatio.toFixed(2));

  let category: CationRatioCategory;
  let sensoryEmphasisPl: string;
  let sensoryEmphasisEn: string;
  let limescaleRisk: 'minimal' | 'low' | 'moderate' | 'high';
  let recommendedUsagePl: string;
  let recommendedUsageEn: string;

  if (ratioMgToCa > 2.0 || ca === 0) {
    category = 'magnesium_dominant';
    sensoryEmphasisPl = 'Dominacja magnezu — uwypuklona jasna, owocowa kwasowość i nuty kwiatowe. Minimalne ryzyko kamienia.';
    sensoryEmphasisEn = 'Magnesium dominant — vibrant fruit acidity and delicate floral notes highlighted. Minimal scale risk.';
    limescaleRisk = 'low';
    recommendedUsagePl = 'Idealna do metod przelewowych (V60, Chemex) i ziaren jasno palonych (Nordic roast).';
    recommendedUsageEn = 'Ideal for pour-over filters (V60, Chemex) and light Nordic roasts.';
  } else if (ratioMgToCa >= 0.5) {
    category = 'balanced_specialty';
    sensoryEmphasisPl = 'Zrównoważony profil kationowy — harmonijna ekstrakcja słodyczy, kwasowości i aksamitnego ciała.';
    sensoryEmphasisEn = 'Balanced cation profile — harmonic extraction of sweetness, acidity, and silky body.';
    limescaleRisk = ca > 60 ? 'moderate' : 'low';
    recommendedUsagePl = 'Uniwersalna woda do wszystkich metod parzenia specialty i espresso.';
    recommendedUsageEn = 'All-around specialty water for filter brewing and espresso.';
  } else {
    category = 'calcium_dominant';
    sensoryEmphasisPl = 'Dominacja wapnia — pełne, kremowe ciało, nuty czekoladowe, ale stłumiona kwasowość owocowa.';
    sensoryEmphasisEn = 'Calcium dominant — heavy creamy body, chocolate and nutty notes, muted delicate acidity.';
    limescaleRisk = ca > 80 ? 'high' : 'moderate';
    recommendedUsagePl = 'Sprzyja tradycyjnemu espresso i kawom o profilu czekoladowo-orzechowym; zalecana ochrona bojlera.';
    recommendedUsageEn = 'Favors classic espresso and chocolatey profiles; boiler scale protection recommended.';
  }

  return {
    calciumIonPpm: ca,
    magnesiumIonPpm: mg,
    ratioMgToCa,
    category,
    sensoryEmphasisPl,
    sensoryEmphasisEn,
    limescaleRisk,
    recommendedUsagePl,
    recommendedUsageEn,
  };
}

export type ResidualAlkalinityCategory =
  | 'negative_or_very_low'
  | 'optimal_specialty'
  | 'moderate_buffer'
  | 'excessive_dulling';

export interface ResidualAlkalinityAnalysis {
  alkalinityPpm: number;
  calciumHardnessPpm: number;
  magnesiumHardnessPpm: number;
  residualAlkalinityPpm: number;
  category: ResidualAlkalinityCategory;
  phBufferingCapacityPl: string;
  phBufferingCapacityEn: string;
  sensoryAcidityImpactPl: string;
  sensoryAcidityImpactEn: string;
}

/**
 * Wylicza zasadowość resztkową (Residual Alkalinity - RA wg Kolbacha w ppm CaCO3)
 * i ocenia zdolność wody do neutralizacji kwasów kawowych oraz zachowania kwasowości owocowej.
 * RA = Alkalinity - (CaHardness / 3.5 + MgHardness / 7.0)
 */
export function calculateResidualAlkalinity(
  alkalinityPpm: number | string,
  calciumHardnessPpm: number | string = 60,
  magnesiumHardnessPpm: number | string = 30
): ResidualAlkalinityAnalysis {
  const parseNum = (v: unknown): number => {
    if (typeof v === 'number') return Number.isFinite(v) && !Object.is(v, -0) ? Math.max(0, Math.min(1000, v)) : 0;
    if (typeof v === 'string') {
      const parsed = parseFloat(v.replace(/\uFEFF/g, '').replace(',', '.').trim());
      return Number.isFinite(parsed) && !Object.is(parsed, -0) ? Math.max(0, Math.min(1000, parsed)) : 0;
    }
    return 0;
  };

  const alk = Math.round(parseNum(alkalinityPpm) * 10) / 10;
  const ca = Math.round(parseNum(calciumHardnessPpm) * 10) / 10;
  const mg = Math.round(parseNum(magnesiumHardnessPpm) * 10) / 10;

  const raRaw = alk - (ca / 3.5 + mg / 7.0);
  const ra = Math.round(raRaw * 10) / 10;
  const safeRa = Object.is(ra, -0) ? 0 : ra;

  let category: ResidualAlkalinityCategory;
  let phBufferingCapacityPl: string;
  let phBufferingCapacityEn: string;
  let sensoryAcidityImpactPl: string;
  let sensoryAcidityImpactEn: string;

  if (safeRa < 5) {
    category = 'negative_or_very_low';
    phBufferingCapacityPl = 'Bardzo niska / Ujemna zasadowość resztkowa';
    phBufferingCapacityEn = 'Very Low / Negative Residual Alkalinity';
    sensoryAcidityImpactPl = 'Maksymalna jasność kwasowości owocowej (cytrynowa, jabłkowa), ryzyko nadmiernej ostrości przy jasnych paleniach.';
    sensoryAcidityImpactEn = 'Maximum fruit acidity brightness (citric, malic), potential sharpness with light roasts.';
  } else if (safeRa <= 25) {
    category = 'optimal_specialty';
    phBufferingCapacityPl = 'Optymalna zasadowość resztkowa Specialty';
    phBufferingCapacityEn = 'Optimal Specialty Residual Alkalinity';
    sensoryAcidityImpactPl = 'Złoty standard — idealna równowaga między żywą kwasowością a pełną słodyczą i czystym finiszem.';
    sensoryAcidityImpactEn = 'Golden standard — perfect balance between lively acidity, sweetness, and clean finish.';
  } else if (safeRa <= 50) {
    category = 'moderate_buffer';
    phBufferingCapacityPl = 'Umiarkowanie podwyższony bufor';
    phBufferingCapacityEn = 'Moderate Buffering Capacity';
    sensoryAcidityImpactPl = 'Kwasowość owocowa zauważalnie wygładzona, dominacja nut czekoladowych i orzechowych.';
    sensoryAcidityImpactEn = 'Fruit acidity noticeably rounded, emphasis on chocolate and nutty notes.';
  } else {
    category = 'excessive_dulling';
    phBufferingCapacityPl = 'Nadmierny bufor (Zasadowość tłumiąca)';
    phBufferingCapacityEn = 'Excessive Buffering (Acidity Dulling)';
    sensoryAcidityImpactPl = 'Silne stłumienie kwasowości, napar może sprawiać wrażenie płaskiego, kredowego i mdłego.';
    sensoryAcidityImpactEn = 'Heavy acidity suppression, brew may taste flat, chalky, and dull.';
  }

  return {
    alkalinityPpm: alk,
    calciumHardnessPpm: ca,
    magnesiumHardnessPpm: mg,
    residualAlkalinityPpm: safeRa,
    category,
    phBufferingCapacityPl,
    phBufferingCapacityEn,
    sensoryAcidityImpactPl,
    sensoryAcidityImpactEn,
  };
}

export type SulfateToChlorideCategory =
  | 'very_bitter_dry'
  | 'crisp_accentuated'
  | 'balanced'
  | 'sweet_rounded'
  | 'full_sweet_malty';

export interface SulfateToChlorideRatioAnalysis {
  sulfatePpm: number;
  chloridePpm: number;
  ratio: number;
  category: SulfateToChlorideCategory;
  sensoryBalancePl: string;
  sensoryBalanceEn: string;
  brewingRecommendationPl: string;
  brewingRecommendationEn: string;
}

/**
 * Wylicza stosunek siarczanów do chlorków (SO4 : Cl) w wodzie
 * i ocenia balans sensoryczny między wytrawnością/goryczką a słodyczą/pełnią naparu.
 */
export function calculateSulfateToChlorideRatio(
  sulfatePpm: number | string,
  chloridePpm: number | string
): SulfateToChlorideRatioAnalysis {
  const parseNum = (v: unknown): number => {
    if (typeof v === 'number') return Number.isFinite(v) && !Object.is(v, -0) ? Math.max(0, Math.min(1000, v)) : 0;
    if (typeof v === 'string') {
      const parsed = parseFloat(v.replace(/\uFEFF/g, '').replace(',', '.').trim());
      return Number.isFinite(parsed) && !Object.is(parsed, -0) ? Math.max(0, Math.min(1000, parsed)) : 0;
    }
    return 0;
  };

  const so4 = Math.round(parseNum(sulfatePpm) * 10) / 10;
  const cl = Math.round(parseNum(chloridePpm) * 10) / 10;

  let ratio: number;
  if (cl === 0 && so4 === 0) {
    ratio = 1.0;
  } else if (cl === 0) {
    ratio = Math.min(20.0, Math.round((so4 / 0.1) * 100) / 100);
  } else {
    ratio = Math.round((so4 / cl) * 100) / 100;
  }

  let category: SulfateToChlorideCategory;
  let sensoryBalancePl: string;
  let sensoryBalanceEn: string;
  let brewingRecommendationPl: string;
  let brewingRecommendationEn: string;

  if (ratio > 2.0) {
    category = 'very_bitter_dry';
    sensoryBalancePl = 'Wyraźna dominacja siarczanów — wytrawny, rześki finisz z mocno zarysowaną goryczką.';
    sensoryBalanceEn = 'Strong sulfate dominance — dry, crisp finish with pronounced bitterness.';
    brewingRecommendationPl = 'Idealne dla jasnych, rześkich przelewów oraz stylów wytrawnych; unikać przy ziarnach podatnych na cierpkość.';
    brewingRecommendationEn = 'Ideal for light, crisp pour-overs and dry profiles; avoid with beans prone to astringency.';
  } else if (ratio >= 1.3) {
    category = 'crisp_accentuated';
    sensoryBalancePl = 'Lekka przewaga siarczanów — podkreślona kwasowość, klarowność nut kwiatowych i wytrawność.';
    sensoryBalanceEn = 'Slight sulfate advantage — enhanced acidity, floral clarity, and crispness.';
    brewingRecommendationPl = 'Świetny balans dla mytych kaw afrykańskich (Etiopia, Kenia) i herbat wysokogórskich.';
    brewingRecommendationEn = 'Great balance for washed African coffees (Ethiopia, Kenya) and high-mountain teas.';
  } else if (ratio >= 0.8) {
    category = 'balanced';
    sensoryBalancePl = 'Równowaga siarczanów i chlorków — harmonijna relacja słodyczy, kwasowości i gęstości naparu.';
    sensoryBalanceEn = 'Sulfate and chloride balance — harmonious harmony between sweetness, acidity, and body.';
    brewingRecommendationPl = 'Wszechstronny profil optymalny do cuppingu SCA, dripów i klasycznego balansu sensorycznego.';
    brewingRecommendationEn = 'Versatile profile optimal for SCA cupping, drip, and classic sensory balance.';
  } else if (ratio >= 0.4) {
    category = 'sweet_rounded';
    sensoryBalancePl = 'Przewaga chlorków — uwypuklona słodycz, gładkie body i zaokrąglona kwasowość.';
    sensoryBalanceEn = 'Chloride advantage — accentuated sweetness, smooth mouthfeel, and rounded acidity.';
    brewingRecommendationPl = 'Doskonały profil dla obróbek naturalnych/honey oraz nowoczesnego espresso o gęstej teksturze.';
    brewingRecommendationEn = 'Excellent for natural/honey process coffees and modern full-bodied espresso.';
  } else {
    category = 'full_sweet_malty';
    sensoryBalancePl = 'Silna dominacja chlorków — maksymalnie aksamitne body, wysoka słodycz i stłumiona ostrość.';
    sensoryBalanceEn = 'Strong chloride dominance — silky body, enhanced sweetness, and softened sharpness.';
    brewingRecommendationPl = 'Polecane do ciemniejszych paleni, espresso mlecznego i herbat czarnych o głębokim likierze.';
    brewingRecommendationEn = 'Recommended for darker roasts, milk-based espresso, and rich black teas.';
  }

  return {
    sulfatePpm: so4,
    chloridePpm: cl,
    ratio,
    category,
    sensoryBalancePl,
    sensoryBalanceEn,
    brewingRecommendationPl,
    brewingRecommendationEn,
  };
}

export type HardnessDominance = 'calcium_dominant' | 'magnesium_dominant' | 'balanced';

export interface TotalHardnessIonAnalysis {
  calciumPpm: number;
  magnesiumPpm: number;
  calciumHardnessPpmCaCO3: number;
  magnesiumHardnessPpmCaCO3: number;
  totalHardnessPpmCaCO3: number;
  totalHardnessGermanDegrees: number; // °dH
  totalHardnessFrenchDegrees: number; // °fH
  dominance: HardnessDominance;
  calciumPercentage: number;
  magnesiumPercentage: number;
  brewingImpactPl: string;
  brewingImpactEn: string;
}

/**
 * Przelicza stężenia jonów wapnia (Ca2+) i magnezu (Mg2+) na twardość ogólną (GH jako ppm CaCO3, °dH, °fH)
 * oraz ocenia dominację kationową i wpływ na ekstrakcję kawy.
 * Formuła Standard Methods / SCA: GH (ppm CaCO3) = Ca * 2.497 + Mg * 4.118
 */
export function calculateTotalHardnessFromIons(
  calciumPpm: number | string | undefined | null,
  magnesiumPpm: number | string | undefined | null
): TotalHardnessIonAnalysis {
  const sanitize = (val: unknown): number => {
    if (typeof val === 'number') {
      return Number.isFinite(val) && val > 0 ? val : 0;
    }
    if (typeof val === 'string') {
      const parsed = parseFloat(val.replace(',', '.').trim());
      return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
    }
    return 0;
  };

  const ca = sanitize(calciumPpm);
  const mg = sanitize(magnesiumPpm);

  const caHardness = Math.round(ca * 2.497 * 10) / 10;
  const mgHardness = Math.round(mg * 4.118 * 10) / 10;
  const totalGh = Math.round((caHardness + mgHardness) * 10) / 10;

  const totalDdH = Math.round((totalGh / 17.848) * 10) / 10;
  const totalFh = Math.round((totalGh / 10) * 10) / 10;

  let caPercent = 0;
  let mgPercent = 0;
  let dominance: HardnessDominance = 'balanced';
  let brewingImpactPl = 'Brak wykrywalnych jonów twardości (woda ultraczysta / demineralizowana).';
  let brewingImpactEn = 'No detectable hardness ions (ultrapure / demineralized water).';

  if (totalGh > 0) {
    caPercent = Math.round((caHardness / totalGh) * 1000) / 10;
    mgPercent = Math.round((mgHardness / totalGh) * 1000) / 10;

    if (caPercent >= 65) {
      dominance = 'calcium_dominant';
      brewingImpactPl = `Przewaga wapnia (${caPercent}%) — uwypukla przejrzystość, czystość i delikatne nuty owocowe, z mniejszą ekstrakcją ciężkich związków.`;
      brewingImpactEn = `Calcium dominance (${caPercent}%) — enhances clarity, cleanliness, and delicate florals with lower extraction of heavy flavors.`;
    } else if (mgPercent >= 65) {
      dominance = 'magnesium_dominant';
      brewingImpactPl = `Przewaga magnezu (${mgPercent}%) — silnie wiąże tlenowe grupy kwasów owocowych, maksymalizując słodycz i owocową kwasowość.`;
      brewingImpactEn = `Magnesium dominance (${mgPercent}%) — strongly binds oxygen-rich fruit acids, maximizing sweetness and vibrant fruit acidity.`;
    } else {
      dominance = 'balanced';
      brewingImpactPl = `Zrównoważony profil jonowy (Ca ${caPercent}%, Mg ${mgPercent}%) — optymalny balans słodyczy, body i kwasowości w metodach przelewowych.`;
      brewingImpactEn = `Balanced cation profile (Ca ${caPercent}%, Mg ${mgPercent}%) — optimal balance of sweetness, body, and acidity for pour-overs.`;
    }
  }

  return {
    calciumPpm: ca,
    magnesiumPpm: mg,
    calciumHardnessPpmCaCO3: caHardness,
    magnesiumHardnessPpmCaCO3: mgHardness,
    totalHardnessPpmCaCO3: totalGh,
    totalHardnessGermanDegrees: totalDdH,
    totalHardnessFrenchDegrees: totalFh,
    dominance,
    calciumPercentage: caPercent,
    magnesiumPercentage: mgPercent,
    brewingImpactPl,
    brewingImpactEn,
  };
}

export type LimescaleRiskLevel = 'none' | 'low' | 'moderate' | 'high' | 'severe';

export interface LimescaleRiskAssessment {
  riskLevel: LimescaleRiskLevel;
  calciumHardnessPpm: number;
  alkalinityKhPpm: number;
  waterTempCelsius: number;
  scalingIndexScore: number;
  descaleFrequencyRecommendationPl: string;
  descaleFrequencyRecommendationEn: string;
  summaryPl: string;
  summaryEn: string;
}

/**
 * Ocenia ryzyko wytrącania kamienia kotłowego (CaCO3) w bojlerach ekspresów i czajnikach
 * na podstawie twardości wapniowej, zasadowości (buforu KH) i temperatury wody.
 */
export function evaluateLimescaleRisk(
  calciumHardnessPpmCaCO3: number | string | undefined | null,
  alkalinityKhPpm: number | string | undefined | null,
  waterTempCelsius: number | string = 93
): LimescaleRiskAssessment {
  const parseNum = (v: unknown, fallback = 0): number => {
    if (typeof v === 'number') {
      return Number.isFinite(v) && !Object.is(v, -0) ? Math.max(0, Math.min(1000, v)) : fallback;
    }
    if (typeof v === 'string') {
      const parsed = parseFloat(v.replace(/\uFEFF/g, '').replace(',', '.').trim());
      return Number.isFinite(parsed) && !Object.is(parsed, -0) ? Math.max(0, Math.min(1000, parsed)) : fallback;
    }
    return fallback;
  };

  const ca = Number(parseNum(calciumHardnessPpmCaCO3, 0).toFixed(1));
  const kh = Number(parseNum(alkalinityKhPpm, 0).toFixed(1));

  let temp = 93;
  if (typeof waterTempCelsius === 'number') {
    temp = Number.isFinite(waterTempCelsius) ? Math.max(10, Math.min(140, waterTempCelsius)) : 93;
  } else if (typeof waterTempCelsius === 'string') {
    const parsed = parseFloat(waterTempCelsius.replace(/\uFEFF/g, '').replace(',', '.').trim());
    temp = Number.isFinite(parsed) ? Math.max(10, Math.min(140, parsed)) : 93;
  }

  // Wodorowęglan wapnia wytrąca się jako CaCO3; czynnikiem ograniczającym jest min(Ca, KH)
  const precipitationPotential = Math.min(ca, kh);
  const tempFactor = Math.max(0.3, Math.min(2.0, temp / 93));
  const scalingIndexScore = Math.round(precipitationPotential * tempFactor);

  let riskLevel: LimescaleRiskLevel = 'none';
  let descaleFrequencyRecommendationPl = 'Brak konieczności odkamieniania (woda bezwapniowa / zerowy bufor).';
  let descaleFrequencyRecommendationEn = 'No descaling needed (calcium-free water / zero buffer).';
  let summaryPl = 'Brak ryzyka osadzania kamienia. Zwróć uwagę na ryzyko korozji przy zerowym buforze.';
  let summaryEn = 'No limescale risk. Watch for corrosion risk with zero buffer.';

  if (scalingIndexScore > 0) {
    if (scalingIndexScore < 30) {
      riskLevel = 'low';
      descaleFrequencyRecommendationPl = 'Odkamienianie profilaktyczne raz na 6–12 miesięcy.';
      descaleFrequencyRecommendationEn = 'Preventative descaling every 6–12 months.';
      summaryPl = 'Niskie ryzyko powstawania kamienia kotłowego. Bezpieczne dla czajników i ekspresów.';
      summaryEn = 'Low limescale risk. Safe for kettles and espresso machines.';
    } else if (scalingIndexScore < 75) {
      riskLevel = 'moderate';
      descaleFrequencyRecommendationPl = 'Zalecane odkamienianie co 2–3 miesiące.';
      descaleFrequencyRecommendationEn = 'Descaling recommended every 2–3 months.';
      summaryPl = 'Umiarkowane ryzyko osadzania kamienia. Wymaga regularnej inspekcji bojlera.';
      summaryEn = 'Moderate limescale risk. Requires periodic boiler inspection.';
    } else if (scalingIndexScore < 140) {
      riskLevel = 'high';
      descaleFrequencyRecommendationPl = 'Wymagane odkamienianie raz w miesiącu lub zmiękczenie wody.';
      descaleFrequencyRecommendationEn = 'Monthly descaling or water softening required.';
      summaryPl = 'Wysokie ryzyko zarastania grzałek i zaworów ekspresu. Zalecane zmiękczenie kationowe lub RO.';
      summaryEn = 'High risk of scale buildup on heating elements and valves. Cation exchange or RO recommended.';
    } else {
      riskLevel = 'severe';
      descaleFrequencyRecommendationPl = 'Krytyczne ryzyko awarii: odkamienianie co 1–2 tygodnie lub bezwzględna filtracja.';
      descaleFrequencyRecommendationEn = 'Critical risk of failure: descaling every 1–2 weeks or mandatory filtration.';
      summaryPl = 'Krytyczna twardość węglanowa. Woda szybko uszkodzi ekspres ciśnieniowy i zakamieni czajnik.';
      summaryEn = 'Critical carbonate hardness. Water will rapidly scale equipment and damage espresso boilers.';
    }
  }

  return {
    riskLevel,
    calciumHardnessPpm: ca,
    alkalinityKhPpm: kh,
    waterTempCelsius: temp,
    scalingIndexScore,
    descaleFrequencyRecommendationPl,
    descaleFrequencyRecommendationEn,
    summaryPl,
    summaryEn,
  };
}

export type BoilerCorrosionRiskLevel = 'safe' | 'low' | 'moderate' | 'high' | 'critical';

export interface BoilerCorrosionRiskAssessment {
  riskLevel: BoilerCorrosionRiskLevel;
  chloridePpm: number;
  sulfatePpm: number;
  ph: number;
  alkalinityKh: number;
  isPittingRisk: boolean;
  recommendationPl: string;
  recommendationEn: string;
  summaryPl: string;
  summaryEn: string;
}

/**
 * Ocenia ryzyko korozji wżerowej (pitting) i kwasowej bojlera ekspresu ciśnieniowego
 * na podstawie stężenia agresywnych chlorków (norma SCA < 30 ppm), siarczanów, pH i buforu KH.
 */
export function evaluateBoilerCorrosionRisk(
  params?: {
    chloridePpm?: number | string | null;
    sulfatePpm?: number | string | null;
    ph?: number | string | null;
    alkalinityKh?: number | string | null;
  } | null
): BoilerCorrosionRiskAssessment {
  const parseNum = (v: unknown, fallback = 0, min = 0, max = 1000): number => {
    if (typeof v === 'number') {
      return Number.isFinite(v) && !Object.is(v, -0) ? Math.max(min, Math.min(max, v)) : fallback;
    }
    if (typeof v === 'string') {
      const parsed = parseFloat(v.replace(/\uFEFF/g, '').replace(',', '.').trim());
      return Number.isFinite(parsed) && !Object.is(parsed, -0)
        ? Math.max(min, Math.min(max, parsed))
        : fallback;
    }
    return fallback;
  };

  const chloride = Number(parseNum(params?.chloridePpm, 0, 0, 1000).toFixed(1));
  const sulfate = Number(parseNum(params?.sulfatePpm, 0, 0, 1000).toFixed(1));
  const alkalinity = Number(
    parseNum(params?.alkalinityKh != null ? params.alkalinityKh : 40, 40, 0, 500).toFixed(1)
  );
  const phVal = Number(parseNum(params?.ph != null ? params.ph : 7.2, 7.2, 3, 11).toFixed(2));

  const isPittingRisk = chloride > 30;

  let riskLevel: BoilerCorrosionRiskLevel = 'safe';
  let recommendationPl =
    'Bezpieczna woda dla miedzianych i stalowych bojlerów ekspresów ciśnieniowych.';
  let recommendationEn =
    'Water is safe for copper and stainless steel espresso machine boilers.';
  let summaryPl = 'Optymalny bilans: niskie stężenie chlorków i stabilny bufor kwasowości.';
  let summaryEn = 'Optimal balance: low chloride levels and stable acidity buffering.';

  if (phVal < 6.0 || (chloride > 50 && phVal < 6.8) || (chloride > 30 && alkalinity < 10)) {
    riskLevel = 'critical';
    recommendationPl =
      'Krytyczne ryzyko wżerów korozyjnych i korozji kwasowej bojlera! Bezwzględnie wyeliminuj chlorki (filtr RO z remineralizacją) i podnieś bufor KH.';
    recommendationEn =
      'Critical risk of boiler pitting and acid corrosion! Eliminate chlorides immediately (RO filter with remineralization) and raise KH buffer.';
    summaryPl =
      'Krytyczne zagrożenie korozją: kwaśne środowisko lub niebezpieczne stężenie agresywnych jonów chlorkowych.';
    summaryEn =
      'Critical corrosion hazard: acidic environment or dangerous aggressive chloride concentration.';
  } else if (chloride > 30 || alkalinity < 15 || phVal < 6.5) {
    riskLevel = 'high';
    recommendationPl =
      'Wysokie ryzyko korozji bojlera. Stężenie chlorków przekracza normę SCA (maks. 30 ppm) lub bufor KH jest zbyt niski.';
    recommendationEn =
      'High boiler corrosion risk. Chloride exceeds SCA standard (max 30 ppm) or KH buffer is too low.';
    summaryPl = 'Wysokie ryzyko wżerów i korozji metali w wysokiej temperaturze bojlera.';
    summaryEn = 'High risk of pitting and metal corrosion at boiler operating temperatures.';
  } else if (chloride >= 15 || alkalinity < 30 || phVal < 6.8) {
    riskLevel = 'moderate';
    recommendationPl =
      'Umiarkowane ryzyko korozyjne. Zalecane monitorowanie chlorków i utrzymywanie buforu KH na poziomie 40–50 ppm.';
    recommendationEn =
      'Moderate corrosion risk. Monitor chloride and maintain KH buffer at 40–50 ppm.';
    summaryPl = 'Dopuszczalne parametry, jednak zalecana ostrożność w bojlerach parowych.';
    summaryEn = 'Acceptable parameters, but caution advised in steam boilers.';
  } else if (chloride > 10 || alkalinity > 80 || phVal > 8.0) {
    riskLevel = 'low';
    recommendationPl = 'Niskie ryzyko korozji bojlera. Woda w granicach bezpieczeństwa.';
    recommendationEn = 'Low boiler corrosion risk. Water within safety margins.';
    summaryPl = 'Bezpieczne parametry dla aparatury ciśnieniowej.';
    summaryEn = 'Safe parameters for pressure brewing equipment.';
  }

  return {
    riskLevel,
    chloridePpm: chloride,
    sulfatePpm: sulfate,
    ph: phVal,
    alkalinityKh: alkalinity,
    isPittingRisk,
    recommendationPl,
    recommendationEn,
    summaryPl,
    summaryEn,
  };
}




export type WaterHardnessLevel =
  | 'very_soft'
  | 'soft'
  | 'moderately_hard'
  | 'hard'
  | 'very_hard';

export interface WaterHardnessScale {
  hardnessPpm: number;
  level: WaterHardnessLevel;
  germanDegreesDh: number;
  frenchDegreesFh: number;
  grainsPerGallonGpg: number;
  isScaCompliant: boolean;
  recommendationPl: string;
  recommendationEn: string;
}

export function calculateWaterHardnessScale(
  hardnessPpm: number | string | null | undefined
): WaterHardnessScale {
  let val = 0;
  if (typeof hardnessPpm === 'number') {
    val =
      Number.isFinite(hardnessPpm) && !Object.is(hardnessPpm, -0) && hardnessPpm > 0
        ? hardnessPpm
        : 0;
  } else if (typeof hardnessPpm === 'string') {
    const cleaned = hardnessPpm.replace(/\uFEFF/g, '').replace(',', '.').trim();
    const parsed = parseFloat(cleaned);
    val = Number.isFinite(parsed) && !Object.is(parsed, -0) && parsed > 0 ? parsed : 0;
  }

  const roundedPpm = Math.round(val * 10) / 10;
  const germanDegreesDh = Math.round((roundedPpm / 17.848) * 100) / 100;
  const frenchDegreesFh = Math.round((roundedPpm / 10.0) * 100) / 100;
  const grainsPerGallonGpg = Math.round((roundedPpm / 17.118) * 100) / 100;

  let level: WaterHardnessLevel = 'very_soft';
  let recommendationPl =
    'Woda bardzo miękka (<60 ppm CaCO3). Może powodować niedoekstrakcję i płaski profil smakowy.';
  let recommendationEn =
    'Very soft water (<60 ppm CaCO3). May lead to underextraction and flat flavor profile.';

  if (roundedPpm > 300) {
    level = 'very_hard';
    recommendationPl =
      'Woda bardzo twarda (>300 ppm CaCO3). Zmiękcz wodę (filtr RO lub dejonizacja), aby chronić sprzęt przed kamieniem i uniknąć cierpkości.';
    recommendationEn =
      'Very hard water (>300 ppm CaCO3). Soften water (RO or deionization) to protect equipment from scale and prevent chalkiness.';
  } else if (roundedPpm >= 180) {
    level = 'hard';
    recommendationPl =
      'Woda twarda (180–300 ppm CaCO3). Wymaga filtracji zmiękczającej w celu ochrony bojlera i zrównoważenia ekstrakcji.';
    recommendationEn =
      'Hard water (180–300 ppm CaCO3). Requires softening filtration to protect boiler and balance extraction.';
  } else if (roundedPpm >= 120) {
    level = 'moderately_hard';
    recommendationPl =
      'Woda umiarkowanie twarda (120–180 ppm CaCO3). Dobra ekstrakcja, ale monitoruj odkładanie się kamienia.';
    recommendationEn =
      'Moderately hard water (120–180 ppm CaCO3). Good extraction, but monitor limescale accumulation.';
  } else if (roundedPpm >= 60) {
    level = 'soft';
    recommendationPl =
      'Woda miękka w idealnym zakresie specialty SCA (50–175 ppm CaCO3). Znakomity balans słodyczy, kwasowości i czystości naparu.';
    recommendationEn =
      'Soft water within ideal SCA specialty range (50–175 ppm CaCO3). Excellent balance of sweetness, acidity, and clarity.';
  }

  const isScaCompliant = roundedPpm >= 50 && roundedPpm <= 175;

  return {
    hardnessPpm: roundedPpm,
    level,
    germanDegreesDh,
    frenchDegreesFh,
    grainsPerGallonGpg,
    isScaCompliant,
    recommendationPl,
    recommendationEn,
  };
}


// ============================================================================
// TASK-P98-07-JAK: Water Alkalinity Buffer Evaluator (Bufor alkaliczności wody)
// ============================================================================

export type AlkalinityBufferLevel = 'unbuffered' | 'crisp' | 'balanced' | 'high' | 'excessive';

export interface WaterAlkalinityBufferEvaluation {
  alkalinityPpm: number;
  level: AlkalinityBufferLevel;
  degreesGermanDkh: number;
  milliEquivalentsPerLiter: number;
  isScaOptimal: boolean;
  recommendedAdjustmentPpm: number;
  acidityImpactPl: string;
  acidityImpactEn: string;
  recommendationPl: string;
  recommendationEn: string;
}

/**
 * Ocenia zdolność buforowania kwasów organicznych (alkaliczność wody jako ppm CaCO3),
 * wpływ na percepcję kwasowości w filiżance oraz stopnie dKH.
 */
export function evaluateWaterAlkalinityBuffer(
  alkalinityPpm: number
): WaterAlkalinityBufferEvaluation {
  const safePpm =
    typeof alkalinityPpm === 'number' && Number.isFinite(alkalinityPpm) && !Object.is(alkalinityPpm, -0)
      ? Math.max(0, Math.min(1000, alkalinityPpm))
      : 0;

  const roundedPpm = Math.round(safePpm * 10) / 10;
  const degreesGermanDkh = Math.round((roundedPpm / 17.848) * 100) / 100;
  const milliEquivalentsPerLiter = Math.round((roundedPpm / 50.04) * 100) / 100;

  const targetScaAlkalinity = 40;
  const recommendedAdjustmentPpm = Math.round((targetScaAlkalinity - roundedPpm) * 10) / 10;
  const isScaOptimal = roundedPpm >= 35 && roundedPpm <= 45;

  let level: AlkalinityBufferLevel = 'unbuffered';
  let acidityImpactPl = 'Agresywna, ostra i niekontrolowana kwasowość. Brak bufora stabilizującego pH.';
  let acidityImpactEn = 'Harsh, sharp, and erratic acidity. Total lack of pH buffering capacity.';
  let recommendationPl = 'Dodaj wodorowęglan potasu (KHCO3) lub sodu (NaHCO3) do poziomu ~40 ppm CaCO3 dla osłodzenia naparu.';
  let recommendationEn = 'Add potassium (KHCO3) or sodium bicarbonate (NaHCO3) to ~40 ppm CaCO3 to buffer and sweeten.';

  if (roundedPpm > 120) {
    level = 'excessive';
    acidityImpactPl = 'Całkowite zgaszenie kwasowości owocowej, mdły, kredowy i płaski profil smakowy.';
    acidityImpactEn = 'Complete flattening of fruity acidity, chalky, dull, and lifeless flavor profile.';
    recommendationPl = 'Zredukuj alkaliczność przez filtrację odwróconej osmozy (RO) lub dejonizację.';
    recommendationEn = 'Reduce alkalinity via reverse osmosis (RO) filtration or deionization.';
  } else if (roundedPpm >= 75) {
    level = 'high';
    acidityImpactPl = 'Wyciszenie delikatnych nut kwasowości, dominacja ciężkich nut orzechowo-czekoladowych.';
    acidityImpactEn = 'Muted delicate fruit acids, dominance of heavy nutty and roasty chocolate notes.';
    recommendationPl = 'Rozcieńcz wodę wodą destylowaną/RO, aby przywrócić soczystość i blask kawy.';
    recommendationEn = 'Dilute water with distilled/RO water to restore cup juiciness and vibrancy.';
  } else if (roundedPpm >= 40) {
    level = 'balanced';
    acidityImpactPl = 'Idealny balans SCA: żywa, soczysta kwasowość harmonijnie połączona ze słodyczą.';
    acidityImpactEn = 'Ideal SCA balance: vibrant, juicy acidity seamlessly harmonized with sweetness.';
    recommendationPl = 'Optymalny bufor alkaliczności dla filtrów specialty i espresso.';
    recommendationEn = 'Optimal alkalinity buffer for specialty filter brews and espresso.';
  } else if (roundedPpm >= 20) {
    level = 'crisp';
    acidityImpactPl = 'Wyrazista, krystaliczna i jasna kwasowość; styl skandynawski dla kaw mytych.';
    acidityImpactEn = 'Prominent, crystalline, and bright acidity; Nordic style for high-elevation washed coffees.';
    recommendationPl = 'Znakomita woda dla miłośników owocowych nut Kenii i Etiopii.';
    recommendationEn = 'Superb water profile for fruit-forward Kenyan and Ethiopian light roasts.';
  }

  return {
    alkalinityPpm: roundedPpm,
    level,
    degreesGermanDkh,
    milliEquivalentsPerLiter,
    isScaOptimal,
    recommendedAdjustmentPpm,
    acidityImpactPl,
    acidityImpactEn,
    recommendationPl,
    recommendationEn,
  };
}


// ============================================================================
// TASK-P100-07-JAK: Boiling Degassing & Decarbonation Impact (Dekarbonizacja wrzenia)
// ============================================================================

export type DegassingEfficiencyLevel = 'gentle' | 'optimal' | 'excessive_deoxygenation';

export interface BoilingDegassingImpact {
  initialAlkalinityPpm: number;
  initialTotalHardnessPpm: number;
  boilingDurationSeconds: number;
  residualAlkalinityPpm: number;
  residualTotalHardnessPpm: number;
  alkalinityLossPercent: number;
  efficiencyLevel: DegassingEfficiencyLevel;
  oxygenRetentionPercent: number;
  sensoryAssessmentPl: string;
  sensoryAssessmentEn: string;
  recommendationPl: string;
  recommendationEn: string;
}

export function calculateBoilingDegassingImpact(options?: {
  initialAlkalinityPpm?: number | string | null;
  initialTotalHardnessPpm?: number | string | null;
  boilingDurationSeconds?: number | string | null;
} | null): BoilingDegassingImpact {
  const parseNum = (val: unknown, fallback: number, min: number, max: number): number => {
    if (typeof val === 'number' && Number.isFinite(val) && !Object.is(val, -0)) {
      return Math.max(min, Math.min(max, val));
    }
    if (typeof val === 'string') {
      const parsed = parseFloat(val.replace(/\uFEFF/g, '').replace(',', '.').trim());
      if (Number.isFinite(parsed) && !Object.is(parsed, -0)) {
        return Math.max(min, Math.min(max, parsed));
      }
    }
    return fallback;
  };

  const initialAlkalinityPpm = Math.round(parseNum(options?.initialAlkalinityPpm, 50, 0, 500) * 10) / 10;
  const initialTotalHardnessPpm = Math.round(parseNum(options?.initialTotalHardnessPpm, 100, 0, 1000) * 10) / 10;
  const boilingDurationSeconds = Math.round(parseNum(options?.boilingDurationSeconds, 30, 0, 600));

  const lossFraction = Math.min(0.6, 0.05 + (boilingDurationSeconds / 60) * 0.12);
  const alkalinityLossPercent = Math.round(lossFraction * 100);

  const residualAlkalinityPpm = Math.max(0, Math.round(initialAlkalinityPpm * (1 - lossFraction) * 10) / 10);
  const khDelta = initialAlkalinityPpm - residualAlkalinityPpm;

  const residualTotalHardnessPpm = Math.max(
    0,
    Math.round((initialTotalHardnessPpm - khDelta * 0.7) * 10) / 10
  );

  const oxygenRetentionPercent = Math.max(10, Math.round(100 - (boilingDurationSeconds / 60) * 25));

  let efficiencyLevel: DegassingEfficiencyLevel = 'gentle';
  let sensoryAssessmentPl = 'Krótkie zagotowanie: zachowana wysoka świeżość wody i rozpuszczony tlen.';
  let sensoryAssessmentEn = 'Brief boil: high dissolved oxygen and cup freshness preserved.';
  let recommendationPl = 'Optymalny czas dla delikatnych przelewów; woda zachowuje pełny blask kwasowości.';
  let recommendationEn = 'Optimal timing for delicate pour-overs; water retains vibrant fruit acidity.';

  if (boilingDurationSeconds > 150) {
    efficiencyLevel = 'excessive_deoxygenation';
    sensoryAssessmentPl = `Długie wrzenie (${boilingDurationSeconds}s): znaczne odgazowanie tlenu (${oxygenRetentionPercent}%) i ryzyko mdłego, płaskiego naparu.`;
    sensoryAssessmentEn = `Prolonged boiling (${boilingDurationSeconds}s): severe oxygen loss (${oxygenRetentionPercent}%) risking a dull, flat extraction.`;
    recommendationPl = 'Unikaj wielokrotnego lub długiego gotowania tej samej wody w czajniku.';
    recommendationEn = 'Avoid prolonged or repeated re-boiling of the same kettle water.';
  } else if (boilingDurationSeconds > 45) {
    efficiencyLevel = 'optimal';
    sensoryAssessmentPl = `Umiarkowane wrzenie: obniżenie bufora KH o ${alkalinityLossPercent}%, co sprzyja wyeksponowaniu kwasowości twardej kranówki.`;
    sensoryAssessmentEn = `Moderate boil: KH buffer reduced by ${alkalinityLossPercent}%, helping brighten hard tap water.`;
    recommendationPl = 'Dobra technika dla zmiękczenia twardszej wody przed zalaniem drippera.';
    recommendationEn = 'Effective technique to naturally soften moderately hard water before brewing.';
  }

  return {
    initialAlkalinityPpm,
    initialTotalHardnessPpm,
    boilingDurationSeconds,
    residualAlkalinityPpm,
    residualTotalHardnessPpm,
    alkalinityLossPercent,
    efficiencyLevel,
    oxygenRetentionPercent,
    sensoryAssessmentPl,
    sensoryAssessmentEn,
    recommendationPl,
    recommendationEn,
  };
}

export type LarsonSkoldRiskLevel = 'low' | 'moderate' | 'high' | 'severe';

export interface LarsonSkoldIndexResult {
  chloridePpm: number;
  sulfatePpm: number;
  alkalinityPpm: number;
  larsonSkoldIndex: number;
  riskLevel: LarsonSkoldRiskLevel;
  corrosionTendencyPl: string;
  corrosionTendencyEn: string;
  recommendationPl: string;
  recommendationEn: string;
  summaryPl: string;
  summaryEn: string;
}

/**
 * Ocenia wskaźnik korozyjności Larsona-Skolda (Larson-Skold Index - LI),
 * który wyznacza proporcję jonów agresywnych (chlorki, siarczany)
 * do jonów buforujących (wodorowęglany / zasadowość) w ekspresach ciśnieniowych i bojlerach.
 * Wzór: LI = ( [Cl-] / 35.45 + 2 * [SO42-] / 96.06 ) / ( [Alkalinity CaCO3] / 50.04 )
 */
export function evaluateLarsonSkoldIndex(
  chloridePpm: number | string | null | undefined,
  sulfatePpm: number | string | null | undefined,
  alkalinityPpm: number | string | null | undefined,
  options?: { locale?: string } | null
): LarsonSkoldIndexResult {
  const parseDefensive = (val: number | string | null | undefined, defaultVal = 0): number => {
    if (val === null || val === undefined) return defaultVal;
    const parsed = typeof val === 'number' ? val : parseFloat(String(val));
    return isNaN(parsed) || !isFinite(parsed) ? defaultVal : Math.max(0, parsed);
  };

  const cl = parseDefensive(chloridePpm, 0);
  const so4 = parseDefensive(sulfatePpm, 0);
  const alk = parseDefensive(alkalinityPpm, 0);

  let rawIndex = 0;
  if (alk <= 0) {
    rawIndex = cl > 0 || so4 > 0 ? 99.9 : 0;
  } else {
    const meqCl = cl / 35.45;
    const meqSO4 = (2 * so4) / 96.06;
    const meqAlk = alk / 50.04;
    rawIndex = (meqCl + meqSO4) / meqAlk;
  }

  const larsonSkoldIndex = Math.round(rawIndex * 100) / 100;

  let riskLevel: LarsonSkoldRiskLevel = 'low';
  let corrosionTendencyPl = 'Niska tendencja korozyjna; woda bezpieczna dla mosiężnych i stalowych bojlerów.';
  let corrosionTendencyEn = 'Low corrosion tendency; water is safe for brass and stainless steel boilers.';
  let recommendationPl = 'Wskaźnik w normie (LI < 0.8). Bufor wodorowęglanowy skutecznie neutralizuje jony korozyjne.';
  let recommendationEn = 'Index within safe range (LI < 0.8). Bicarbonate buffer effectively passivates corrosive ions.';

  if (larsonSkoldIndex >= 2.5 || (alk === 0 && (cl > 0 || so4 > 0))) {
    riskLevel = 'severe';
    corrosionTendencyPl = 'Krytyczne zagrożenie wżerowe i agresywna korozja metalowych elementów ekspresu.';
    corrosionTendencyEn = 'Severe pitting hazard and aggressive corrosion of espresso machine metal parts.';
    recommendationPl = 'Konieczna demineralizacja i remineralizacja: drastyczny nadmiar chlorków/siarczanów niszczy pasywację metalu.';
    recommendationEn = 'Immediate remineralization/filtration required: extreme chloride/sulfate levels actively destroy metal passivation.';
  } else if (larsonSkoldIndex >= 1.2) {
    riskLevel = 'high';
    corrosionTendencyPl = 'Wysoka korozyjność; chlorki i siarczany dominują nad buforem wodorowęglanowym.';
    corrosionTendencyEn = 'High corrosion tendency; chlorides and sulfates overpower the bicarbonate buffer.';
    recommendationPl = 'Zwiększ alkaliczność wody (KH) lub zastosuj filtrację odwróconej osmozy, aby obniżyć chlorki.';
    recommendationEn = 'Increase water alkalinity (KH) or apply reverse osmosis to reduce aggressive chloride concentration.';
  } else if (larsonSkoldIndex >= 0.8) {
    riskLevel = 'moderate';
    corrosionTendencyPl = 'Umiarkowane ryzyko korozji; jony agresywne zbliżają się do stężenia buforu alkalicznego.';
    corrosionTendencyEn = 'Moderate corrosion risk; corrosive ions approaching alkaline buffer concentrations.';
    recommendationPl = 'Zalecane regularne inspekcje bojlera parowego i utrzymywanie stabilnego buforu KH.';
    recommendationEn = 'Regular steam boiler inspections recommended along with maintaining a stable KH buffer.';
  }

  const summaryPl = `Wskaźnik Larsona-Skolda: ${larsonSkoldIndex.toFixed(2)} (${riskLevel.toUpperCase()}). ${corrosionTendencyPl}`;
  const summaryEn = `Larson-Skold Index: ${larsonSkoldIndex.toFixed(2)} (${riskLevel.toUpperCase()}). ${corrosionTendencyEn}`;

  return {
    chloridePpm: cl,
    sulfatePpm: so4,
    alkalinityPpm: alk,
    larsonSkoldIndex,
    riskLevel,
    corrosionTendencyPl,
    corrosionTendencyEn,
    recommendationPl,
    recommendationEn,
    summaryPl,
    summaryEn,
  };
}

export type ConductivityScaleCategory =
  | 'ultra_pure'
  | 'soft_specialty'
  | 'balanced_sca'
  | 'hard_tap';

export interface ConductivityToTdsResult {
  conductivityUsCm: number;
  conversionFactor: number;
  factorName: string;
  tdsPpm: number;
  category: ConductivityScaleCategory;
  categoryLabelPl: string;
  categoryLabelEn: string;
  suitabilityPl: string;
  suitabilityEn: string;
  summaryPl: string;
  summaryEn: string;
}

/**
 * Konwertuje przewodność elektryczną wody (EC w µS/cm) na sumę substancji rozpuszczonych (TDS w ppm)
 * w oparciu o współczynniki kalibracji (Coffee Standard 0.50, Natural 442 0.64, KCl 0.70).
 */
export function convertConductivityToTds(
  conductivityUsCm?: number | string | null,
  conversionFactor?: number | 'coffee' | 'standard' | 'natural_442' | string | null
): ConductivityToTdsResult {
  const parseNum = (val: unknown, fallback: number, min: number, max: number): number => {
    if (typeof val === 'number' && Number.isFinite(val) && !Object.is(val, -0)) {
      return Math.min(max, Math.max(min, val));
    }
    if (typeof val === 'string') {
      const parsed = parseFloat(val.replace(/\uFEFF/g, '').replace(',', '.').trim());
      if (Number.isFinite(parsed) && !Object.is(parsed, -0)) {
        return Math.min(max, Math.max(min, parsed));
      }
    }
    return fallback;
  };

  const ec = Math.round(parseNum(conductivityUsCm, 150, 0, 5000) * 10) / 10;

  let factor = 0.5;
  let factorName = 'Coffee Standard (0.50)';

  if (typeof conversionFactor === 'string') {
    const rawF = conversionFactor.trim().toLowerCase();
    if (rawF.includes('442') || rawF.includes('natural')) {
      factor = 0.64;
      factorName = 'Natural 442 (0.64)';
    } else if (rawF.includes('kcl') || rawF.includes('high')) {
      factor = 0.7;
      factorName = 'KCl Standard (0.70)';
    } else if (rawF.includes('coffee') || rawF.includes('standard')) {
      factor = 0.5;
      factorName = 'Coffee Standard (0.50)';
    } else {
      const numF = parseFloat(rawF.replace(',', '.'));
      if (Number.isFinite(numF)) {
        factor = Math.min(0.85, Math.max(0.45, Math.round(numF * 100) / 100));
        factorName = `Custom (${factor.toFixed(2)})`;
      }
    }
  } else if (typeof conversionFactor === 'number' && Number.isFinite(conversionFactor)) {
    factor = Math.min(0.85, Math.max(0.45, Math.round(conversionFactor * 100) / 100));
    factorName = `Custom (${factor.toFixed(2)})`;
  }

  const tdsPpm = Math.round(ec * factor * 10) / 10;

  let category: ConductivityScaleCategory = 'balanced_sca';
  let categoryLabelPl = 'Złoty standard specialty';
  let categoryLabelEn = 'SCA Golden Standard';
  let suitabilityPl = '';
  let suitabilityEn = '';

  if (tdsPpm < 15) {
    category = 'ultra_pure';
    categoryLabelPl = 'Woda ultra-czysta (RO / demineralizowana)';
    categoryLabelEn = 'Ultra-pure / Demineralized Water';
    suitabilityPl = 'Zbyt niska mineralizacja do bezpośredniej ekstrakcji kawy; wymaga dodania buforu i minerałów twardości.';
    suitabilityEn = 'Insufficient mineral content for balanced extraction; requires remineralization with buffer and hardness.';
  } else if (tdsPpm < 75) {
    category = 'soft_specialty';
    categoryLabelPl = 'Woda miękka specialty';
    categoryLabelEn = 'Soft Specialty Water';
    suitabilityPl = 'Znakomita do delikatnych zielonych i białych herbat oraz bardzo jasnych przelewów Nordic roast.';
    suitabilityEn = 'Superb for delicate green/white teas and ultra-light Nordic pour-overs.';
  } else if (tdsPpm <= 175) {
    category = 'balanced_sca';
    categoryLabelPl = 'Złoty standard SCA (zrównoważona)';
    categoryLabelEn = 'SCA Golden Standard (Balanced)';
    suitabilityPl = 'Optymalny balans buforu KH i twardości GH: wyrazista słodycz, czysta kwasowość i stabilna ekstrakcja.';
    suitabilityEn = 'Optimal balance of KH buffer and GH hardness: rich sweetness, crisp acidity, and stable extraction.';
  } else {
    category = 'hard_tap';
    categoryLabelPl = 'Woda twarda / kranowa';
    categoryLabelEn = 'Hard / High Mineral Tap Water';
    suitabilityPl = 'Wysokie ryzyko osadzania kamienia kotłowego i przytłumienia owocowej kwasowości kawy.';
    suitabilityEn = 'High scaling risk in kettle/boiler and muting of delicate origin fruit notes.';
  }

  const summaryPl = `Przewodność ${ec} µS/cm -> TDS: ${tdsPpm} ppm (współczynnik: ${factorName}, kategoria: ${categoryLabelPl}). ${suitabilityPl}`;
  const summaryEn = `Conductivity ${ec} µS/cm -> TDS: ${tdsPpm} ppm (factor: ${factorName}, category: ${categoryLabelEn}). ${suitabilityEn}`;

  return {
    conductivityUsCm: ec,
    conversionFactor: factor,
    factorName,
    tdsPpm,
    category,
    categoryLabelPl,
    categoryLabelEn,
    suitabilityPl,
    suitabilityEn,
    summaryPl,
    summaryEn,
  };
}
