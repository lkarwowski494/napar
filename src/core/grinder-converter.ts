// ============================================================================
// Napar (Steepwise) — Grinder Dial-in Converter
// Konwerter nastaw młynków specialty na bazie średniej wielkości cząstek (mikrony µm)
// Comandante C40, Timemore C2/C3, 1Zpresso K-Ultra, Fellow Ode Gen 2, Baratza Encore, Kingrinder K6
// ============================================================================

export interface GrinderModel {
  id: string;
  name: string;
  namePl?: string;
  nameEn?: string;
  burrType: string;
  burrTypePl?: string;
  burrTypeEn?: string;
  stepMicrons: number;
  minSetting: number;
  maxSetting: number;
  formatSetting: (rawClicks: number, language?: string) => string;
  parseSetting: (text: string) => number;
  micronsPerSettingOffset: number;
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
    burrTypePl: 'Nitro Blade (39mm stożkowe)',
    burrTypeEn: 'Nitro Blade (39mm conical)',
    stepMicrons: 30.0,
    minSetting: 5,
    maxSetting: 45,
    micronsPerSettingOffset: 0,
    formatSetting: (clicks: number, lang = 'pl') => lang === 'en' ? `${Math.round(clicks)} clicks` : `${Math.round(clicks)} klików`,
    parseSetting: (text: string) => {
      const str = (typeof text === 'string' ? text : String(text || '')).replace(',', '.');
      const num = parseFloat(str.replace(/[^0-9.]/g, '')) || 24;
      return num * 30.0;
    },
  },
  {
    id: 'timemore_c2_c3',
    name: 'Timemore Chestnut C2 / C3',
    burrType: 'Stal nierdzewna (38mm stożkowe)',
    burrTypePl: 'Stal nierdzewna (38mm stożkowe)',
    burrTypeEn: 'Stainless steel (38mm conical)',
    stepMicrons: 35.0,
    minSetting: 6,
    maxSetting: 36,
    micronsPerSettingOffset: 0,
    formatSetting: (clicks: number, lang = 'pl') => lang === 'en' ? `${Math.round(clicks)} clicks` : `${Math.round(clicks)} klików`,
    parseSetting: (text: string) => {
      const str = (typeof text === 'string' ? text : String(text || '')).replace(',', '.');
      const num = parseFloat(str.replace(/[^0-9.]/g, '')) || 18;
      return num * 35.0;
    },
  },
  {
    id: '1zpresso_k_ultra',
    name: '1Zpresso K-Ultra / K-Max',
    burrType: 'K-Burr (48mm heptagonalne)',
    burrTypePl: 'K-Burr (48mm heptagonalne)',
    burrTypeEn: 'K-Burr (48mm heptagonal)',
    stepMicrons: 20.0,
    minSetting: 20,
    maxSetting: 110,
    micronsPerSettingOffset: 0,
    formatSetting: (clicks: number, lang = 'pl') => {
      const whole = Math.floor(clicks / 10);
      const frac = Math.round(clicks % 10);
      const unit = lang === 'en' ? 'clicks' : 'klików';
      return `${whole}.${frac} (${clicks} ${unit})`;
    },
    parseSetting: (text: string) => {
      // Jeśli format 7.5 -> 75 klików * 20um
      const str = (typeof text === 'string' ? text : String(text || '')).replace(',', '.');
      const num = parseFloat(str) || 7.5;
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
    burrTypePl: 'Gen 2 Flat Burrs (64mm płaskie)',
    burrTypeEn: 'Gen 2 Flat Burrs (64mm flat)',
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
      const str = (typeof text === 'string' ? text : String(text || '')).replace(',', '.');
      let sub = 0;
      if (str.includes('⅓') || str.includes('1/3')) sub = 1;
      else if (str.includes('⅔') || str.includes('2/3')) sub = 2;
      const num = parseInt(str.replace(/[^0-9]/g, ''), 10) || 5;
      const clicks = (num - 1) * 3 + 1 + sub;
      return 200 + clicks * 40.0;
    },
  },
  {
    id: 'baratza_encore',
    name: 'Baratza Encore / ESP',
    burrType: 'M2 / M3 Stożkowe (40mm)',
    burrTypePl: 'M2 / M3 Stożkowe (40mm)',
    burrTypeEn: 'M2 / M3 Conical (40mm)',
    stepMicrons: 35.0,
    minSetting: 1,
    maxSetting: 40,
    micronsPerSettingOffset: 150,
    formatSetting: (clicks: number, lang = 'pl') => lang === 'en' ? `Setting #${Math.round(clicks)}` : `Nastawa #${Math.round(clicks)}`,
    parseSetting: (text: string) => {
      const str = (typeof text === 'string' ? text : String(text || '')).replace(',', '.');
      const num = parseFloat(str.replace(/[^0-9.]/g, '')) || 16;
      return 150 + num * 35.0;
    },
  },
  {
    id: 'kingrinder_k6',
    name: 'Kingrinder K6',
    burrType: 'Seven-Core (48mm stożkowe)',
    burrTypePl: 'Seven-Core (48mm stożkowe)',
    burrTypeEn: 'Seven-Core (48mm conical)',
    stepMicrons: 16.0,
    minSetting: 25,
    maxSetting: 140,
    micronsPerSettingOffset: 0,
    formatSetting: (clicks: number, lang = 'pl') => lang === 'en' ? `${Math.round(clicks)} clicks` : `${Math.round(clicks)} klików`,
    parseSetting: (text: string) => {
      const str = (typeof text === 'string' ? text : String(text || '')).replace(',', '.');
      const num = parseFloat(str.replace(/[^0-9.]/g, '')) || 90;
      return num * 16.0;
    },
  },
  {
    id: 'wilfa_svart',
    name: 'Wilfa Svart Aroma / Classic',
    burrType: 'Stożkowe stalowe (40mm)',
    burrTypePl: 'Stożkowe stalowe (40mm)',
    burrTypeEn: 'Conical steel (40mm)',
    stepMicrons: 45.0,
    minSetting: 1,
    maxSetting: 20,
    micronsPerSettingOffset: 250,
    formatSetting: (clicks: number, lang = 'pl') => {
      if (clicks <= 3) return lang === 'en' ? 'Moka / Aeropress (Fine)' : 'Moka / Aeropress (Drobno)';
      if (clicks <= 8) return `Filter #${Math.round(clicks)} (V60 / Drip)`;
      if (clicks <= 14) return `Filter #${Math.round(clicks)} (Chemex)`;
      return `French Press #${Math.round(clicks)}`;
    },
    parseSetting: (text: string) => {
      const str = (typeof text === 'string' ? text : String(text || '')).replace(',', '.');
      const num = parseFloat(str.replace(/[^0-9.]/g, '')) || 7;
      return 250 + num * 45.0;
    },
  },
  {
    id: 'kinu_m47',
    name: 'Kinu M47 (Classic/Simplicity/Phoenix)',
    burrType: 'Black Fusion (47mm stożkowe)',
    burrTypePl: 'Black Fusion (47mm stożkowe)',
    burrTypeEn: 'Black Fusion (47mm conical)',
    stepMicrons: 10.0,
    minSetting: 10,
    maxSetting: 50,
    micronsPerSettingOffset: 0,
    formatSetting: (clicks: number, lang = 'pl') => {
      const major = Math.floor(clicks / 10);
      const minor = Math.round(clicks % 10);
      const unitRot = lang === 'en' ? 'rotations' : 'obrotu';
      const unitClick = lang === 'en' ? 'clicks' : 'klików';
      return `${major}.${minor} ${unitRot} (${clicks} ${unitClick})`;
    },
    parseSetting: (text: string) => {
      const str = (typeof text === 'string' ? text : String(text || '')).replace(',', '.');
      const num = parseFloat(str) || 3.5;
      return num < 10 ? num * 10 * 10.0 : num * 10.0;
    },
  },
  {
    id: 'eureka_mignon',
    name: 'Eureka Mignon (Filtro / Crono / Specialita)',
    burrType: 'Płaskie żarna 50mm / 55mm',
    burrTypePl: 'Płaskie żarna 50mm / 55mm',
    burrTypeEn: 'Flat burrs 50mm / 55mm',
    stepMicrons: 25.0,
    minSetting: 1,
    maxSetting: 30,
    micronsPerSettingOffset: 200,
    formatSetting: (clicks: number, lang = 'pl') => lang === 'en' ? `Position #${Math.round(clicks * 10) / 10}` : `Pozycja #${Math.round(clicks * 10) / 10}`,
    parseSetting: (text: string) => {
      const str = (typeof text === 'string' ? text : String(text || '')).replace(',', '.');
      const num = parseFloat(str.replace(/[^0-9.]/g, '')) || 5;
      return 200 + num * 25.0;
    },
  },
  {
    id: 'generic_grinder',
    name: 'Inny młynek (Skala uniwersalna µm)',
    namePl: 'Inny młynek (Skala uniwersalna µm)',
    nameEn: 'Other grinder (Universal µm scale)',
    burrType: 'Uniwersalna skala mikronowa',
    burrTypePl: 'Uniwersalna skala mikronowa',
    burrTypeEn: 'Universal micron scale',
    stepMicrons: 10.0,
    minSetting: 20,
    maxSetting: 140,
    micronsPerSettingOffset: 0,
    formatSetting: (clicks: number, lang = 'pl') => {
      const microns = clicks * 10.0;
      let desc = lang === 'en' ? 'Medium' : 'Średnio';
      if (microns < 450) desc = lang === 'en' ? 'Extra Fine (Espresso)' : 'Bardzo drobno (Espresso)';
      else if (microns < 610) desc = lang === 'en' ? 'Fine (AeroPress)' : 'Drobno (AeroPress)';
      else if (microns < 810) desc = lang === 'en' ? 'Medium (V60 / Drip)' : 'Średnio (V60 / Drip)';
      else if (microns < 1010) desc = lang === 'en' ? 'Medium-Coarse (Chemex)' : 'Średnio-grubo (Chemex)';
      else desc = lang === 'en' ? 'Coarse (French Press / Cold Brew)' : 'Grubo (French Press / Cold Brew)';
      return `${Math.round(microns)} µm · ${desc}`;
    },
    parseSetting: (text: string) => {
      const str = (typeof text === 'string' ? text : String(text || '')).replace(',', '.');
      const num = parseFloat(str.replace(/[^0-9.]/g, '')) || 720;
      return num;
    },
  },
];

export function findGrinderById(id: string): GrinderModel | undefined {
  if (!id || typeof id !== 'string') return undefined;
  const cleanId = id.trim().toLowerCase();
  return SUPPORTED_GRINDERS.find((g) => g.id.toLowerCase() === cleanId);
}

/**
 * Konwertuje rozmiar cząstek w mikronach na czytelną nastawę dla zadanego modelu młynka
 */
export function convertMicronsToGrinder(
  microns: number,
  grinderId: string,
  language = 'pl'
): { formatted: string; rawValue: number; grinderName: string } {
  const cleanId = typeof grinderId === 'string' ? grinderId.trim().toLowerCase() : '';
  const grinder =
    SUPPORTED_GRINDERS.find((g) => g.id.toLowerCase() === cleanId) || SUPPORTED_GRINDERS[0];

  const safeMicrons = Number.isFinite(microns) && microns > 0 ? microns : 720;
  const targetMicrons = Math.max(150, Math.min(1500, safeMicrons));
  const effectiveMicrons = Math.max(0, targetMicrons - grinder.micronsPerSettingOffset);
  const rawClicks = Math.round(effectiveMicrons / grinder.stepMicrons);
  const clampedClicks = Math.max(grinder.minSetting, Math.min(grinder.maxSetting, rawClicks));
  const grinderName =
    language === 'en' && grinder.nameEn ? grinder.nameEn : (grinder.namePl || grinder.name);

  return {
    formatted: grinder.formatSetting(clampedClicks, language),
    rawValue: clampedClicks,
    grinderName,
  };
}

/**
 * Konwertuje nastawę z jednego młynka na drugi młynek poprzez mikrony
 */
export function convertBetweenGrinders(
  sourceGrinderId: string,
  sourceValue: number | string,
  targetGrinderId: string,
  language = 'pl'
): { targetFormatted: string; microns: number } {
  const cleanSourceId = typeof sourceGrinderId === 'string' ? sourceGrinderId.trim().toLowerCase() : '';
  const cleanTargetId = typeof targetGrinderId === 'string' ? targetGrinderId.trim().toLowerCase() : '';
  const sourceGrinder =
    SUPPORTED_GRINDERS.find((g) => g.id.toLowerCase() === cleanSourceId) || SUPPORTED_GRINDERS[0];
  const targetGrinder =
    SUPPORTED_GRINDERS.find((g) => g.id.toLowerCase() === cleanTargetId) || SUPPORTED_GRINDERS[1];

  let microns = 720;
  if (typeof sourceValue === 'number') {
    if (Number.isFinite(sourceValue) && sourceValue >= 0) {
      microns = sourceGrinder.micronsPerSettingOffset + sourceValue * sourceGrinder.stepMicrons;
    }
  } else if (typeof sourceValue === 'string') {
    const normalized = sourceValue.trim().replace(',', '.');
    const parsed = sourceGrinder.parseSetting(normalized);
    if (Number.isFinite(parsed) && parsed > 0) {
      microns = parsed;
    }
  }

  const result = convertMicronsToGrinder(microns, targetGrinder.id, language);
  return {
    targetFormatted: result.formatted,
    microns: Math.round(microns),
  };
}

/**
 * Zwraca szacowany rozmiar cząstek w mikronach dla danej metody lub opisu przemiału receptury
 */
export function getRecipeMicrons(recipe?: {
  method?: string;
  grindSettingDescriptionPl?: string;
  grindSettingDescriptionEn?: string;
  grind_size_description?: string;
} | null): number {
  if (!recipe || typeof recipe !== 'object') {
    return 720;
  }
  const method = (typeof recipe.method === 'string' ? recipe.method : '').trim().toUpperCase();
  const desc = (
    typeof (recipe as any).grindSettingDescriptionPl === 'string'
      ? (recipe as any).grindSettingDescriptionPl
      : typeof (recipe as any).grindSettingDescriptionEn === 'string'
      ? (recipe as any).grindSettingDescriptionEn
      : typeof (recipe as any).grind_size_description === 'string'
      ? (recipe as any).grind_size_description
      : ''
  ).toLowerCase();

  if (desc.includes('bardzo drobno') || desc.includes('extra fine') || desc.includes('turkish') || desc.includes('tygielek') || desc.includes('cezve') || method === 'ESPRESSO' || method === 'TURKISH' || method === 'CEZVE') {
    if (desc.includes('turkish') || desc.includes('tygielek') || desc.includes('cezve') || method === 'TURKISH' || method === 'CEZVE') {
      return 200;
    }
    return 350;
  }
  if (method === 'MOKA' || desc.includes('kawiark') || desc.includes('moka')) {
    return 450;
  }
  if (method === 'SIPHON' || method === 'SYFON' || desc.includes('siphon') || desc.includes('syfon')) {
    return 650;
  }
  if (desc.includes('drobno') || desc.includes('fine') || method === 'AEROPRESS') {
    if (desc.includes('16') || desc.includes('18')) return 520;
    return 560;
  }
  if (
    method === 'V60' ||
    method.includes('V60') ||
    desc.includes('v60') ||
    method === 'ORIGAMI' ||
    method.includes('ORIGAMI') ||
    desc.includes('origami') ||
    method === 'KALITA' ||
    method.includes('KALITA') ||
    desc.includes('kalita') ||
    method === 'SWITCH' ||
    method.includes('SWITCH') ||
    desc.includes('switch')
  ) {
    if (desc.includes('28') || desc.includes('30') || desc.includes('grubo') || desc.includes('coarse')) return 850;
    if (desc.includes('18') || desc.includes('20')) return 600;
    return 720;
  }
  if (
    method === 'CHEMEX' ||
    method.includes('CHEMEX') ||
    desc.includes('chemex') ||
    method === 'CLEVER_DRIPPER' ||
    method === 'CLEVER' ||
    method === 'CLEVER DRIPPER' ||
    method.includes('CLEVER') ||
    desc.includes('clever') ||
    method === 'CUPPING' ||
    desc.includes('cupping')
  ) {
    return 880;
  }
  if (
    method === 'FRENCH_PRESS' ||
    method === 'FRENCHPRESS' ||
    method === 'FRENCH PRESS' ||
    method === 'PRASKA_FRANCUSKA' ||
    method === 'PRASKA' ||
    method.includes('FRENCH') ||
    desc.includes('french') ||
    desc.includes('prask') ||
    method.includes('COLD') ||
    method.includes('ICE') ||
    method === 'COLD_BREW' ||
    method === 'COLD_DRIP' ||
    desc.includes('coarse')
  ) {
    return 1150;
  }
  return 720;
}

/**
 * Zwraca rekomendację nastawy dla konkretnego młynka i receptury
 */
export function getRecommendedGrindForRecipe(
  recipe: { method?: string; grindSettingDescriptionPl?: string; grindSettingDescriptionEn?: string; grind_size_description?: string } | null | undefined,
  grinderId: string,
  language = 'pl'
): { formatted: string; rawValue: number; grinderName: string; microns: number } {
  const microns = getRecipeMicrons(recipe);
  const result = convertMicronsToGrinder(microns, grinderId, language);
  return {
    ...result,
    microns,
  };
}
