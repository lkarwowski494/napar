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
];

/**
 * Zwraca zlokalizowaną nazwę profilu wody. Nieznane id (np. z importu JSON) zwracane jest bez zmian.
 */
export function getWaterProfileName(id: string, language: 'pl' | 'en' | string = 'pl'): string {
  if (!id || typeof id !== 'string') return '';
  const cleanId = id.trim();
  const recipe = WATER_RECIPES.find((r) => r.id === cleanId);
  if (!recipe) {
    const bottled = BOTTLED_WATER_BENCHMARKS.find((b) => b.id === cleanId);
    if (bottled) return bottled.brandName;
    return cleanId;
  }
  return language === 'pl' ? recipe.namePl : recipe.nameEn;
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
  waterVolumeLiters: number,
  targetGh: number,
  targetKh: number
): WaterCalculationResult {
  const vol = Number.isFinite(waterVolumeLiters) && waterVolumeLiters > 0 ? Math.max(0.1, Math.min(1000.0, waterVolumeLiters)) : 1.0;
  const gh = Number.isFinite(targetGh) && targetGh >= 0 ? Math.max(0, Math.min(5000, targetGh)) : 0;
  const kh = Number.isFinite(targetKh) && targetKh >= 0 ? Math.max(0, Math.min(5000, targetKh)) : 0;

  // W systemie koncentratów Barista Hustle:
  // 1g Buffer Concentrate dodany do 1L wody = 2 ppm KH
  // 1g Hardness Concentrate dodany do 1L wody = 2 ppm GH
  const concentrateBuffer = Number(((kh / 2.0) * vol).toFixed(1));
  const concentrateHardness = Number(((gh / 2.0) * vol).toFixed(1));

  // Waga suchych soli do bezpośredniego rozpuszczenia:
  // NaHCO3: 1 ppm KH = 0.00168 g NaHCO3 na 1L
  const dryNaHCO3 = Number((kh * 0.00168 * vol).toFixed(3));

  // MgSO4*7H2O: 1 ppm GH = 0.002465 g soli Epsom na 1L
  const dryMgSO4 = Number((gh * 0.002465 * vol).toFixed(3));

  // CaCl2*2H2O (wapń): 1 ppm GH = 0.00147 g na 1L
  const dryCaCl2 = Number((gh * 0.00147 * vol).toFixed(3));

  const totalWaterGrams = vol * 1000;
  const rawBaseWater = totalWaterGrams - concentrateBuffer - concentrateHardness;
  const baseWater = rawBaseWater <= 0 ? 0 : Number(rawBaseWater.toFixed(1));

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
  ghPpm: number,
  khPpm: number
): WaterDiagnosticResult {
  if (!Number.isFinite(ghPpm) || !Number.isFinite(khPpm) || ghPpm < 0 || khPpm < 0) {
    return {
      problemPl: 'Nieprawidłowe dane wejściowe parametrów wody.',
      problemEn: 'Invalid input data for water chemistry parameters.',
      causePl: 'Wartości GH lub KH nie są prawidłowymi liczbami skończonymi.',
      causeEn: 'GH or KH values are not valid finite numbers.',
      recommendationPl: 'Wprowadź poprawne, dodatnie wartości liczbowe dla twardości GH i buforu KH.',
      recommendationEn: 'Enter valid positive numerical values for GH hardness and KH buffer.',
    };
  }

  if (ghPpm > 1000 || khPpm > 1000) {
    return {
      problemPl: 'Woda niezdatna do parzenia speciality (skrajne zasolenie/mineralizacja).',
      problemEn: 'Water unsuitable for specialty brewing (extreme salinity/mineralization).',
      causePl: 'Ekstremalna mineralizacja (GH lub KH > 1000 ppm CaCO3) uniemożliwia jakąkolwiek kontrolowaną ekstrakcję.',
      causeEn: 'Extreme mineralization (GH or KH > 1000 ppm CaCO3) completely prevents controlled extraction.',
      recommendationPl: 'Użyj czystej wody z odwróconej osmozy (RO) lub wody destylowanej do przygotowania bazy.',
      recommendationEn: 'Use clean reverse osmosis (RO) or distilled water as brewing base.',
    };
  }

  if (khPpm > 75) {
    return {
      problemPl: 'Płaski napar, brak żywej kwasowości owocowej, posmak kredowy.',
      problemEn: 'Flat brew, lack of vibrant fruit acidity, chalky mouthfeel.',
      causePl: 'Zbyt wysoka alkaliczność (bufor KH > 75 ppm CaCO3) neutralizuje naturalne kwasy organiczne kawy (jabłkowy, cytrynowy).',
      causeEn: 'High alkalinity (KH buffer > 75 ppm CaCO3) completely neutralizes natural coffee organic acids (malic, citric).',
      recommendationPl: 'Zmniejsz bufor wodorowęglanowy (rozcieńcz wodę wodą demineralizowaną/RO do KH 35–45 ppm).',
      recommendationEn: 'Lower bicarbonate buffer (dilute base water with RO/distilled water down to KH 35-45 ppm).',
    };
  }

  if (khPpm < 20) {
    return {
      problemPl: 'Agresywny, ostry, chemiczny kwas, brak słodkiego balansu.',
      problemEn: 'Sharp, vinegar-like, unbuffered harsh acid, lack of sweetness.',
      causePl: 'Za niski bufor (KH < 20 ppm CaCO3). Nawet mała ilość kwasów drastycznie obniża pH naparu.',
      causeEn: 'Insufficient buffer (KH < 20 ppm CaCO3). Minute acid amounts drop brew pH drastically.',
      recommendationPl: 'Dodaj bufor sodowy (NaHCO3), aby osiągnąć min. 30–40 ppm KH.',
      recommendationEn: 'Add sodium bicarbonate (NaHCO3) buffer to reach at least 30-40 ppm KH.',
    };
  }

  if (ghPpm < 35) {
    return {
      problemPl: 'Cienkie body, niska intensywność aromatów, wodnisty finisz.',
      problemEn: 'Thin body, weak aroma intensity, watery hollow finish.',
      causePl: 'Niedobór kationów magnezu i wapnia (GH < 35 ppm CaCO3). Cząsteczki wody nie mają ładunku do związania olejków i estrów.',
      causeEn: 'Lack of magnesium and calcium cations (GH < 35 ppm CaCO3). Polar solvent lacks binding strength for aroma compounds.',
      recommendationPl: 'Podwyższ twardość ogólną solą magnezową (Epsom) do poziomu 60–85 ppm GH.',
      recommendationEn: 'Increase general hardness with magnesium Epsom salt to 60-85 ppm GH.',
    };
  }

  if (ghPpm > 150) {
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
export function ppmCaCO3ToDegreesDH(ppm: number): number {
  if (!Number.isFinite(ppm) || ppm <= 0) return 0;
  const safePpm = Math.min(10000, ppm);
  return Number((safePpm / 17.848).toFixed(4));
}

/**
 * Konwertuje twardość ze stopni niemieckich dH na ppm CaCO3 (1 dH = 17.848 ppm CaCO3)
 */
export function degreesDHToPpmCaCO3(dH: number): number {
  if (!Number.isFinite(dH) || dH <= 0) return 0;
  const safeDH = Math.min(500, dH);
  return Number((safeDH * 17.848).toFixed(2));
}

export function findWaterRecipeById(id: string): WaterRecipe | undefined {
  if (!id || typeof id !== 'string') return undefined;
  const cleanId = id.trim().toLowerCase();
  return WATER_RECIPES.find((r) => r.id.toLowerCase() === cleanId);
}

export function findBottledWaterById(id: string): BottledWaterProfile | undefined {
  if (!id || typeof id !== 'string') return undefined;
  const cleanId = id.trim().toLowerCase();
  return BOTTLED_WATER_BENCHMARKS.find((w) => w.id.toLowerCase() === cleanId);
}
