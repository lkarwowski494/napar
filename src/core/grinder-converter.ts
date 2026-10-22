// ============================================================================
// Napar (Steepwise) — Grinder Dial-in Converter
// Konwerter nastaw młynków specialty na bazie średniej wielkości cząstek (mikrony µm)
// Comandante C40, Timemore C2/C3, 1Zpresso K-Ultra, Fellow Ode Gen 2, Baratza Encore, Kingrinder K6
// ============================================================================

export interface GrinderModel {
  id: string;
  name: string;
  burrType: string; // np. 'Żarna stożkowe 39mm Nitro Blade', 'Żarna płaskie 64mm'
  stepMicrons: number; // krok w mikronach
  minSetting: number;
  maxSetting: number;
  formatSetting: (rawClicks: number) => string;
  parseSetting: (text: string) => number; // zwraca szacowaną wartość w mikronach
  micronsPerSettingOffset: number; // baza offsetowa dla zera
}

export interface GrindCategory {
  id: string;
  namePl: string;
  nameEn: string;
  micronMin: number;
  micronMax: number;
  defaultMicrons: number;
  methodsPl: string;
  methodsEn: string;
}

export const GRIND_CATEGORIES: GrindCategory[] = [
  {
    id: 'espresso',
    namePl: 'Bardzo drobno (Espresso)',
    nameEn: 'Extra Fine (Espresso)',
    micronMin: 200,
    micronMax: 450,
    defaultMicrons: 350,
    methodsPl: 'Ekspres ciśnieniowy, Kawiarka / Moka',
    methodsEn: 'Espresso machine, Moka pot',
  },
  {
    id: 'aeropress',
    namePl: 'Drobno-średnio (AeroPress)',
    nameEn: 'Fine-Medium (AeroPress)',
    micronMin: 460,
    micronMax: 600,
    defaultMicrons: 540,
    methodsPl: 'AeroPress standard, Phin, Ibrik',
    methodsEn: 'AeroPress standard, Phin, Cezve',
  },
  {
    id: 'pourover_v60',
    namePl: 'Średnio (V60 / Kalita / Drip)',
    nameEn: 'Medium (V60 / Kalita / Drip)',
    micronMin: 610,
    micronMax: 800,
    defaultMicrons: 720,
    methodsPl: 'Hario V60, Kalita Wave, Origami, Melitta',
    methodsEn: 'Hario V60, Kalita Wave, Origami, Melitta',
  },
  {
    id: 'chemex_cupping',
    namePl: 'Średnio-grubo (Chemex / Cupping)',
    nameEn: 'Medium-Coarse (Chemex / Cupping)',
    micronMin: 810,
    micronMax: 1000,
    defaultMicrons: 900,
    methodsPl: 'Chemex, Cupping sensoryczny SCA, Clever Dripper',
    methodsEn: 'Chemex, SCA Sensory Cupping, Clever Dripper',
  },
  {
    id: 'frenchpress_coldbrew',
    namePl: 'Grubo (French Press / Cold Brew)',
    nameEn: 'Coarse (French Press / Cold Brew)',
    micronMin: 1010,
    micronMax: 1400,
    defaultMicrons: 1150,
    methodsPl: 'French Press, Cold Brew, Syfon',
    methodsEn: 'French Press, Cold Brew, Syphon',
  },
];

export const SUPPORTED_GRINDERS: GrinderModel[] = [
  {
    id: 'comandante_c40',
    name: 'Comandante C40 MK3/MK4',
    burrType: 'Nitro Blade (39mm stożkowe)',
    stepMicrons: 30.0,
    minSetting: 5,
    maxSetting: 45,
    micronsPerSettingOffset: 0,
    formatSetting: (clicks: number) => `${Math.round(clicks)} klików`,
    parseSetting: (text: string) => {
      const num = parseFloat(text.replace(',', '.').replace(/[^0-9.]/g, '')) || 24;
      return num * 30.0;
    },
  },
  {
    id: 'timemore_c2_c3',
    name: 'Timemore Chestnut C2 / C3',
    burrType: 'Stal nierdzewna (38mm stożkowe)',
    stepMicrons: 35.0,
    minSetting: 6,
    maxSetting: 36,
    micronsPerSettingOffset: 0,
    formatSetting: (clicks: number) => `${Math.round(clicks)} klików`,
    parseSetting: (text: string) => {
      const num = parseFloat(text.replace(',', '.').replace(/[^0-9.]/g, '')) || 18;
      return num * 35.0;
    },
  },
  {
    id: '1zpresso_k_ultra',
    name: '1Zpresso K-Ultra / K-Max',
    burrType: 'K-Burr (48mm heptagonalne)',
    stepMicrons: 20.0,
    minSetting: 20,
    maxSetting: 110,
    micronsPerSettingOffset: 0,
    formatSetting: (clicks: number) => {
      const whole = Math.floor(clicks / 10);
      const frac = Math.round(clicks % 10);
      return `${whole}.${frac} (${clicks} klików)`;
    },
    parseSetting: (text: string) => {
      // Jeśli format 7.5 -> 75 klików * 20um
      const num = parseFloat(text.replace(',', '.')) || 7.5;
      if (num < 15) {
        return num * 10 * 20.0;
      }
      return num * 20.0;
    },
  },
  {
    id: 'fellow_ode_gen2',
    name: 'Fellow Ode Gen 2',
    burrType: 'Gen 2 Flat Burrs (64mm płaskie)',
    stepMicrons: 40.0, // ok. 40 mikronów na 1 krok (1/3 numeru)
    minSetting: 1,
    maxSetting: 31,
    micronsPerSettingOffset: 200,
    formatSetting: (clicks: number) => {
      // clicks reprezentuje pozycję od 1.0 do 11.0 (krok co 1/3)
      const major = Math.floor((clicks - 1) / 3) + 1;
      const sub = (clicks - 1) % 3;
      const subChar = sub === 0 ? '' : sub === 1 ? '⅓' : '⅔';
      return `${major}${subChar}`;
    },
    parseSetting: (text: string) => {
      const val = parseFloat(text.replace(',', '.')) || 5.0;
      return 200 + val * 3 * 40.0;
    },
  },
  {
    id: 'baratza_encore',
    name: 'Baratza Encore / ESP',
    burrType: 'M2 / M3 Stożkowe (40mm)',
    stepMicrons: 35.0,
    minSetting: 1,
    maxSetting: 40,
    micronsPerSettingOffset: 150,
    formatSetting: (clicks: number) => `Nastawa #${Math.round(clicks)}`,
    parseSetting: (text: string) => {
      const num = parseFloat(text.replace(',', '.').replace(/[^0-9.]/g, '')) || 16;
      return 150 + num * 35.0;
    },
  },
  {
    id: 'kingrinder_k6',
    name: 'Kingrinder K6',
    burrType: 'Seven-Core (48mm stożkowe)',
    stepMicrons: 16.0,
    minSetting: 25,
    maxSetting: 140,
    micronsPerSettingOffset: 0,
    formatSetting: (clicks: number) => `${Math.round(clicks)} klików`,
    parseSetting: (text: string) => {
      const num = parseFloat(text.replace(',', '.').replace(/[^0-9.]/g, '')) || 90;
      return num * 16.0;
    },
  },
  {
    id: 'wilfa_svart',
    name: 'Wilfa Svart Aroma / Classic',
    burrType: 'Stożkowe stalowe (40mm)',
    stepMicrons: 45.0,
    minSetting: 1,
    maxSetting: 20,
    micronsPerSettingOffset: 250,
    formatSetting: (clicks: number) => {
      if (clicks <= 3) return 'Moka / Aeropress (Drobno)';
      if (clicks <= 8) return `Filter #${Math.round(clicks)} (V60 / Drip)`;
      if (clicks <= 14) return `Filter #${Math.round(clicks)} (Chemex)`;
      return `French Press #${Math.round(clicks)}`;
    },
    parseSetting: (text: string) => {
      const num = parseFloat(text.replace(',', '.').replace(/[^0-9.]/g, '')) || 7;
      return 250 + num * 45.0;
    },
  },
  {
    id: 'kinu_m47',
    name: 'Kinu M47 (Classic/Simplicity/Phoenix)',
    burrType: 'Black Fusion (47mm stożkowe)',
    stepMicrons: 10.0,
    minSetting: 10,
    maxSetting: 50,
    micronsPerSettingOffset: 0,
    formatSetting: (clicks: number) => {
      const major = Math.floor(clicks / 10);
      const minor = Math.round(clicks % 10);
      return `${major}.${minor} obrotu (${clicks} klików)`;
    },
    parseSetting: (text: string) => {
      const num = parseFloat(text.replace(',', '.')) || 3.5;
      return num < 10 ? num * 10 * 10.0 : num * 10.0;
    },
  },
  {
    id: 'eureka_mignon',
    name: 'Eureka Mignon (Filtro / Crono / Specialita)',
    burrType: 'Płaskie żarna 50mm / 55mm',
    stepMicrons: 25.0,
    minSetting: 1,
    maxSetting: 30,
    micronsPerSettingOffset: 200,
    formatSetting: (clicks: number) => `Pozycja #${Math.round(clicks * 10) / 10}`,
    parseSetting: (text: string) => {
      const num = parseFloat(text.replace(',', '.').replace(/[^0-9.]/g, '')) || 5;
      return 200 + num * 25.0;
    },
  },
  {
    id: 'generic_grinder',
    name: 'Inny młynek (Skala uniwersalna µm)',
    burrType: 'Uniwersalna skala mikronowa',
    stepMicrons: 10.0,
    minSetting: 20,
    maxSetting: 140,
    micronsPerSettingOffset: 0,
    formatSetting: (clicks: number) => {
      const microns = clicks * 10.0;
      let desc = 'Średnio';
      if (microns < 450) desc = 'Bardzo drobno (Espresso)';
      else if (microns < 610) desc = 'Drobno (AeroPress)';
      else if (microns < 810) desc = 'Średnio (V60 / Drip)';
      else if (microns < 1010) desc = 'Średnio-grubo (Chemex)';
      else desc = 'Grubo (French Press / Cold Brew)';
      return `${Math.round(microns)} µm · ${desc}`;
    },
    parseSetting: (text: string) => {
      const num = parseFloat(text.replace(',', '.').replace(/[^0-9.]/g, '')) || 720;
      return num;
    },
  },
];

/**
 * Młynek o zadanym identyfikatorze: najpierw tabela modeli, potem dodatkowe (własne, poz. 11).
 * Nieznany identyfikator daje pierwszy model z tabeli (dawne zachowanie).
 */
export function findGrinderModel(grinderId: string, extra: readonly GrinderModel[] = []): GrinderModel {
  return [...SUPPORTED_GRINDERS, ...extra].find((g) => g.id === grinderId) || SUPPORTED_GRINDERS[0];
}

/**
 * Konwertuje rozmiar cząstek w mikronach na nastawę zaokrągloną do pełnego kliknięcia,
 * po dodaniu przesunięcia kalibracji (w klikach, np. z grinder-calibration.ts).
 * Tabela modeli (SUPPORTED_GRINDERS) nie jest zmieniana; przesunięcie 0 daje wynik bazowy.
 */
export function convertMicronsWithShift(
  microns: number,
  grinderId: string,
  shiftClicks: number,
  extra: readonly GrinderModel[] = []
): { formatted: string; rawValue: number; grinderName: string } {
  const grinder = findGrinderModel(grinderId, extra);

  const targetMicrons = Math.max(150, Math.min(1500, microns));
  const effectiveMicrons = Math.max(0, targetMicrons - grinder.micronsPerSettingOffset);
  const rawClicks = Math.round(effectiveMicrons / grinder.stepMicrons + shiftClicks);
  const clampedClicks = Math.max(grinder.minSetting, Math.min(grinder.maxSetting, rawClicks));

  return {
    formatted: grinder.formatSetting(clampedClicks),
    rawValue: clampedClicks,
    grinderName: grinder.name,
  };
}

/**
 * Konwertuje rozmiar cząstek w mikronach na czytelną nastawę dla zadanego modelu młynka
 */
export function convertMicronsToGrinder(
  microns: number,
  grinderId: string,
  extra: readonly GrinderModel[] = []
): { formatted: string; rawValue: number; grinderName: string } {
  return convertMicronsWithShift(microns, grinderId, 0, extra);
}

/**
 * Konwertuje nastawę z jednego młynka na drugi młynek poprzez mikrony
 */
export function convertBetweenGrinders(
  sourceGrinderId: string,
  sourceValue: number | string,
  targetGrinderId: string
): { targetFormatted: string; microns: number } {
  const sourceGrinder =
    SUPPORTED_GRINDERS.find((g) => g.id === sourceGrinderId) || SUPPORTED_GRINDERS[0];
  const targetGrinder =
    SUPPORTED_GRINDERS.find((g) => g.id === targetGrinderId) || SUPPORTED_GRINDERS[1];

  let microns = 720;
  if (typeof sourceValue === 'number') {
    microns = sourceGrinder.micronsPerSettingOffset + sourceValue * sourceGrinder.stepMicrons;
  } else {
    microns = sourceGrinder.parseSetting(sourceValue);
  }

  const result = convertMicronsToGrinder(microns, targetGrinder.id);
  return {
    targetFormatted: result.formatted,
    microns: Math.round(microns),
  };
}

/**
 * Zwraca szacowany rozmiar cząstek w mikronach dla danej metody lub opisu przemiału receptury
 */
export function getRecipeMicrons(recipe: {
  method?: string;
  grindSettingDescriptionPl?: string;
  grind_size_description?: string;
}): number {
  const method = (recipe.method || '').toUpperCase();
  const desc = (recipe.grindSettingDescriptionPl || recipe.grind_size_description || '').toLowerCase();

  if (desc.includes('bardzo drobno') || method === 'ESPRESSO') {
    return 350;
  }
  if (desc.includes('drobno') || method === 'AEROPRESS') {
    if (desc.includes('16') || desc.includes('18')) return 520;
    return 560;
  }
  if (method === 'V60' || method === 'ORIGAMI' || method === 'KALITA' || method === 'SWITCH') {
    if (desc.includes('28') || desc.includes('30') || desc.includes('grubo')) return 850;
    if (desc.includes('18') || desc.includes('20')) return 600;
    return 720;
  }
  if (method === 'CHEMEX' || method === 'CLEVER_DRIPPER' || method === 'CUPPING') {
    return 880;
  }
  if (method === 'FRENCH_PRESS' || method === 'COLD_BREW') {
    return 1150;
  }
  return 720;
}

/**
 * Zwraca rekomendację nastawy dla konkretnego młynka i receptury.
 * `baseValue` to nastawa z tabeli modelu bez kalibracji; zapisuje się ją z parzeniem,
 * by kalibracja mogła porównać użyte kliki z bazą (grinder-calibration.ts).
 */
export function getRecommendedGrindForRecipe(
  recipe: { method?: string; grindSettingDescriptionPl?: string; grind_size_description?: string },
  grinderId: string,
  shiftClicks = 0,
  extra: readonly GrinderModel[] = []
): { formatted: string; rawValue: number; grinderName: string; microns: number; baseValue: number } {
  const microns = getRecipeMicrons(recipe);
  const result = convertMicronsWithShift(microns, grinderId, shiftClicks, extra);
  const baseValue = convertMicronsToGrinder(microns, grinderId, extra).rawValue;
  return {
    ...result,
    microns,
    baseValue,
  };
}
