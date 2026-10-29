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

const CATEGORY_ALIASES: Record<string, string> = {
  espresso: 'espresso',
  moka: 'espresso',
  aeropress: 'aeropress',
  phin: 'aeropress',
  ibrik: 'aeropress',
  cezve: 'aeropress',
  pourover_v60: 'pourover_v60',
  v60: 'pourover_v60',
  drip: 'pourover_v60',
  kalita: 'pourover_v60',
  chemex_cupping: 'chemex_cupping',
  chemex: 'chemex_cupping',
  cupping: 'chemex_cupping',
  frenchpress_coldbrew: 'frenchpress_coldbrew',
  frenchpress: 'frenchpress_coldbrew',
  coldbrew: 'frenchpress_coldbrew',
  'french-press': 'frenchpress_coldbrew',
  'cold-brew': 'frenchpress_coldbrew',
};

/**
 * Wyszukuje kategorię grubości mielenia po identyfikatorze lub aliasie
 */
export function findGrindCategoryById(id: string): GrindCategory | undefined {
  if (!id || typeof id !== 'string') return undefined;
  const clean = id.trim().toLowerCase();
  if (!clean) return undefined;
  const mapped = CATEGORY_ALIASES[clean] || CATEGORY_ALIASES[clean.replace(/[\s_-]+/g, '')];
  if (mapped) {
    const direct = GRIND_CATEGORIES.find((c) => c.id === mapped);
    if (direct) return direct;
  }
  return GRIND_CATEGORIES.find((c) => c.id.toLowerCase() === clean);
}

/**
 * Dobiera optymalną kategorię przemiału dla zadanego rozmiaru cząstek w mikronach
 */
export function findGrindCategoryForMicrons(microns: number | string): GrindCategory {
  const isInvalid =
    microns === null ||
    microns === undefined ||
    typeof microns === 'boolean' ||
    typeof microns === 'object' ||
    typeof microns === 'symbol';

  if (isInvalid) {
    return GRIND_CATEGORIES.find((c) => c.id === 'pourover_v60') || GRIND_CATEGORIES[2];
  }

  const raw =
    typeof microns === 'string'
      ? parseFloat(microns.trim().replace(/,/g, '.'))
      : Number(microns);

  if (!Number.isFinite(raw) || raw <= 0 || Object.is(raw, -0)) {
    return GRIND_CATEGORIES.find((c) => c.id === 'pourover_v60') || GRIND_CATEGORIES[2];
  }

  if (raw <= 455) {
    return GRIND_CATEGORIES.find((c) => c.id === 'espresso') || GRIND_CATEGORIES[0];
  }
  if (raw <= 605) {
    return GRIND_CATEGORIES.find((c) => c.id === 'aeropress') || GRIND_CATEGORIES[1];
  }
  if (raw <= 805) {
    return GRIND_CATEGORIES.find((c) => c.id === 'pourover_v60') || GRIND_CATEGORIES[2];
  }
  if (raw <= 1005) {
    return GRIND_CATEGORIES.find((c) => c.id === 'chemex_cupping') || GRIND_CATEGORIES[3];
  }
  return GRIND_CATEGORIES.find((c) => c.id === 'frenchpress_coldbrew') || GRIND_CATEGORIES[4];
}


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
    formatSetting: (clicks: number, lang = 'pl') => {
      const c = Object.is(Math.round(clicks), -0) ? 0 : Math.round(clicks);
      return lang === 'en' ? `${c} clicks` : `${c} klików`;
    },
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
    formatSetting: (clicks: number, lang = 'pl') => {
      const c = Object.is(Math.round(clicks), -0) ? 0 : Math.round(clicks);
      return lang === 'en' ? `${c} clicks` : `${c} klików`;
    },
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
    formatSetting: (clicks: number, lang = 'pl') => {
      const c = Object.is(Math.round(clicks), -0) ? 0 : Math.round(clicks);
      return lang === 'en' ? `Setting #${c}` : `Nastawa #${c}`;
    },
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
    id: '1zpresso_j_max',
    name: '1Zpresso J-Max / J-Ultra',
    burrType: 'Żarna tytanowe (48mm stożkowe)',
    burrTypePl: 'Żarna tytanowe (48mm stożkowe)',
    burrTypeEn: 'Titanium-coated burrs (48mm conical)',
    stepMicrons: 8.4,
    minSetting: 30,
    maxSetting: 220,
    micronsPerSettingOffset: 0,
    formatSetting: (clicks: number, lang = 'pl') => {
      const rot = Math.floor(clicks / 90);
      const sub = Math.floor((clicks % 90) / 10);
      const click = Math.round(clicks % 10);
      const unit = lang === 'en' ? 'clicks' : 'klików';
      return `${rot}.${sub}.${click} (${clicks} ${unit})`;
    },
    parseSetting: (text: string) => {
      const str = (typeof text === 'string' ? text : String(text || '')).replace(',', '.');
      const num = parseFloat(str.replace(/[^0-9.]/g, '')) || 50;
      return num * 8.4;
    },
  },
  {
    id: '1zpresso_zp6',
    name: '1Zpresso ZP6 Special',
    burrType: 'Żarna sześciokątne 48mm (Pour-Over Focus)',
    burrTypePl: 'Żarna sześciokątne 48mm (Pour-Over Focus)',
    burrTypeEn: 'Hexagonal 48mm burrs (Pour-Over Focus)',
    stepMicrons: 12.2,
    minSetting: 10,
    maxSetting: 90,
    micronsPerSettingOffset: 0,
    formatSetting: (clicks: number, lang = 'pl') => {
      const rot = Math.floor(clicks / 60);
      const sub = Math.floor((clicks % 60) / 10);
      const click = Math.round(clicks % 10);
      const unit = lang === 'en' ? 'clicks' : 'klików';
      return `${rot}.${sub}.${click} (${clicks} ${unit})`;
    },
    parseSetting: (text: string) => {
      const str = (typeof text === 'string' ? text : String(text || '')).replace(',', '.');
      const num = parseFloat(str.replace(/[^0-9.]/g, '')) || 45;
      return num * 12.2;
    },
  },
  {
    id: 'niche_zero',
    name: 'Niche Zero',
    burrType: 'Mazzer Kony (63mm stożkowe)',
    burrTypePl: 'Mazzer Kony (63mm stożkowe)',
    burrTypeEn: 'Mazzer Kony (63mm conical)',
    stepMicrons: 20.0,
    minSetting: 0,
    maxSetting: 60,
    micronsPerSettingOffset: 150,
    formatSetting: (clicks: number, lang = 'pl') => {
      const c = Object.is(Math.round(clicks), -0) ? 0 : Math.round(clicks);
      return lang === 'en' ? `Niche #${c}` : `Nastawa Niche #${c}`;
    },
    parseSetting: (text: string) => {
      const str = (typeof text === 'string' ? text : String(text || '')).replace(',', '.');
      const num = parseFloat(str.replace(/[^0-9.]/g, '')) || 25;
      return 150 + num * 20.0;
    },
  },
  {
    id: 'mahlkoenig_ek43',
    name: 'Mahlkönig EK43 / EK43S',
    burrType: 'Płaskie żarna odlewane 98mm (Cast Steel)',
    burrTypePl: 'Płaskie żarna odlewane 98mm (Cast Steel)',
    burrTypeEn: 'Cast steel 98mm flat burrs',
    stepMicrons: 75.0,
    minSetting: 1,
    maxSetting: 16,
    micronsPerSettingOffset: 100,
    formatSetting: (clicks: number, lang = 'pl') => {
      const c = Object.is(Math.round(clicks), -0) ? 0 : Math.round(clicks);
      return lang === 'en' ? `Dial #${c}` : `Tarcza #${c}`;
    },
    parseSetting: (text: string) => {
      const str = (typeof text === 'string' ? text : String(text || '')).replace(',', '.');
      const num = parseFloat(str.replace(/[^0-9.]/g, '')) || 9;
      return 100 + num * 75.0;
    },
  },
  {
    id: 'timemore_sculptor',
    name: 'Timemore Sculptor 064 / 078',
    burrType: 'Turbo Burrs / Płaskie 64mm/78mm',
    burrTypePl: 'Turbo Burrs / Płaskie 64mm/78mm',
    burrTypeEn: 'Turbo Burrs / Flat 64mm/78mm',
    stepMicrons: 55.0,
    minSetting: 0,
    maxSetting: 18,
    micronsPerSettingOffset: 200,
    formatSetting: (clicks: number, lang = 'pl') => {
      const c = Object.is(Math.round(clicks), -0) ? 0 : Math.round(clicks);
      return lang === 'en' ? `Dial #${c}` : `Nastawa #${c}`;
    },
    parseSetting: (text: string) => {
      const str = (typeof text === 'string' ? text : String(text || '')).replace(',', '.');
      const num = parseFloat(str.replace(/[^0-9.]/g, '')) || 9;
      return 200 + num * 55.0;
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

const GRINDER_ALIASES: Record<string, string> = {
  c40: 'comandante_c40',
  comandante: 'comandante_c40',
  'c40-mk3': 'comandante_c40',
  'c40-mk4': 'comandante_c40',
  'c40 mk3': 'comandante_c40',
  'c40 mk4': 'comandante_c40',
  c40mk3: 'comandante_c40',
  c40mk4: 'comandante_c40',
  'comandante-c40': 'comandante_c40',
  'comandante c40': 'comandante_c40',
  c2: 'timemore_c2_c3',
  c3: 'timemore_c2_c3',
  timemore: 'timemore_c2_c3',
  'timemore-c2': 'timemore_c2_c3',
  'timemore-c3': 'timemore_c2_c3',
  'timemore-c2-c3': 'timemore_c2_c3',
  'timemore c2': 'timemore_c2_c3',
  'timemore c3': 'timemore_c2_c3',
  chestnut: 'timemore_c2_c3',
  'timemore chestnut': 'timemore_c2_c3',
  c3s: 'timemore_c2_c3',
  'c3 esp': 'timemore_c2_c3',
  svart: 'wilfa_svart',
  wilfa: 'wilfa_svart',
  'wilfa-svart': 'wilfa_svart',
  'wilfa svart': 'wilfa_svart',
  wilfasvart: 'wilfa_svart',
  'svart aroma': 'wilfa_svart',
  kultra: '1zpresso_k_ultra',
  'k-ultra': '1zpresso_k_ultra',
  '1zpresso-k-ultra': '1zpresso_k_ultra',
  '1zpresso k-ultra': '1zpresso_k_ultra',
  kmax: '1zpresso_k_ultra',
  'k-max': '1zpresso_k_ultra',
  ode: 'fellow_ode_gen2',
  'ode-gen2': 'fellow_ode_gen2',
  'ode gen 2': 'fellow_ode_gen2',
  'ode 2': 'fellow_ode_gen2',
  'ode-2': 'fellow_ode_gen2',
  'fellow-ode': 'fellow_ode_gen2',
  'fellow ode': 'fellow_ode_gen2',
  encore: 'baratza_encore',
  baratza: 'baratza_encore',
  'baratza-encore': 'baratza_encore',
  'encore-esp': 'baratza_encore',
  'encore esp': 'baratza_encore',
  'baratza esp': 'baratza_encore',
  k6: 'kingrinder_k6',
  kingrinder: 'kingrinder_k6',
  'kingrinder-k6': 'kingrinder_k6',
  'kingrinder k6': 'kingrinder_k6',
  'k-6': 'kingrinder_k6',
  kinu: 'kinu_m47',
  m47: 'kinu_m47',
  'kinu-m47': 'kinu_m47',
  'kinu m47': 'kinu_m47',
  mignon: 'eureka_mignon',
  eureka: 'eureka_mignon',
  'eureka-mignon': 'eureka_mignon',
  'eureka mignon': 'eureka_mignon',
  specialita: 'eureka_mignon',
  zp6: '1zpresso_zp6',
  'zp6-special': '1zpresso_zp6',
  'zp-6': '1zpresso_zp6',
  '1zpresso-zp6': '1zpresso_zp6',
  '1zpresso zp6': '1zpresso_zp6',
  jmax: '1zpresso_j_max',
  'j-max': '1zpresso_j_max',
  '1zpresso-j-max': '1zpresso_j_max',
  '1zpresso j-max': '1zpresso_j_max',
  df64: 'eureka_mignon',
  'df-64': 'eureka_mignon',
  'turin df64': 'eureka_mignon',
  'turin-df64': 'eureka_mignon',
  'g-iota': 'eureka_mignon',
  giota: 'eureka_mignon',
  'ode-gen1': 'fellow_ode_gen2',
  'ode gen 1': 'fellow_ode_gen2',
  'ode-1': 'fellow_ode_gen2',
  'ode 1': 'fellow_ode_gen2',
  ode1: 'fellow_ode_gen2',
  'fellow ode 1': 'fellow_ode_gen2',
  'baratza encore esp': 'baratza_encore',
  'baratza-encore-esp': 'baratza_encore',
  k4: 'kingrinder_k6',
  'kingrinder k4': 'kingrinder_k6',
  'kingrinder-k4': 'kingrinder_k6',
  'jx-pro': '1zpresso_j_max',
  'jx pro': '1zpresso_j_max',
  '1zpresso jx-pro': '1zpresso_j_max',
  '1zpresso jx pro': '1zpresso_j_max',
  '1zpresso-jx-pro': '1zpresso_j_max',
  q2: 'timemore_c2_c3',
  '1zpresso q2': 'timemore_c2_c3',
  '1zpresso-q2': 'timemore_c2_c3',
  'c3 pro': 'timemore_c2_c3',
  'c3-pro': 'timemore_c2_c3',
  c3pro: 'timemore_c2_c3',
  'timemore c3 pro': 'timemore_c2_c3',
  'comandante mk3': 'comandante_c40',
  'comandante mk4': 'comandante_c40',
  'mignon filtro': 'eureka_mignon',
  'mignon-filtro': 'eureka_mignon',
  'mignon crono': 'eureka_mignon',
  'mignon manuale': 'eureka_mignon',
  'mignon silenzio': 'eureka_mignon',
  niche: 'niche_zero',
  'niche-zero': 'niche_zero',
  'niche zero': 'niche_zero',
  nichezero: 'niche_zero',
  ek43: 'mahlkoenig_ek43',
  ek43s: 'mahlkoenig_ek43',
  'ek-43': 'mahlkoenig_ek43',
  'ek 43': 'mahlkoenig_ek43',
  mahlkonig: 'mahlkoenig_ek43',
  mahlkoenig: 'mahlkoenig_ek43',
  'mahlkonig ek43': 'mahlkoenig_ek43',
  'mahlkoenig ek43': 'mahlkoenig_ek43',
  sculptor: 'timemore_sculptor',
  'timemore sculptor': 'timemore_sculptor',
  'timemore-sculptor': 'timemore_sculptor',
  'sculptor 078': 'timemore_sculptor',
  'sculptor-078': 'timemore_sculptor',
  'sculptor 064': 'timemore_sculptor',
  'sculptor-064': 'timemore_sculptor',
};

export function findGrinderById(id: string): GrinderModel | undefined {
  if (!id || typeof id !== 'string') return undefined;
  const cleanId = id.trim().toLowerCase();
  const mappedId = GRINDER_ALIASES[cleanId];
  if (mappedId) {
    const found = SUPPORTED_GRINDERS.find((g) => g.id.toLowerCase() === mappedId);
    if (found) return found;
  }
  return SUPPORTED_GRINDERS.find((g) => g.id.toLowerCase() === cleanId);
}

/**
 * Konwertuje rozmiar cząstek w mikronach na czytelną nastawę dla zadanego modelu młynka
 */
export function convertMicronsToGrinder(
  microns: number | string,
  grinderId: string,
  language = 'pl'
): { formatted: string; rawValue: number; grinderName: string } {
  const cleanId = typeof grinderId === 'string' ? grinderId.trim().toLowerCase() : '';
  const grinder = findGrinderById(cleanId) || SUPPORTED_GRINDERS[0];

  let parsedMicrons = NaN;
  if (typeof microns === 'number') {
    parsedMicrons = microns;
  } else if (typeof microns === 'string') {
    parsedMicrons = parseFloat(microns.trim().replace(',', '.'));
  }
  const safeMicrons = Number.isFinite(parsedMicrons) && parsedMicrons > 0 && !Object.is(parsedMicrons, -0) ? parsedMicrons : 720;
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
  const sourceGrinder = findGrinderById(cleanSourceId) || SUPPORTED_GRINDERS[0];
  const targetGrinder = findGrinderById(cleanTargetId) || SUPPORTED_GRINDERS[1];

  let microns = 720;
  if (typeof sourceValue === 'number') {
    if (Number.isFinite(sourceValue) && sourceValue >= 0 && !Object.is(sourceValue, -0)) {
      microns = sourceGrinder.micronsPerSettingOffset + sourceValue * sourceGrinder.stepMicrons;
    }
  } else if (typeof sourceValue === 'string') {
    const normalized = sourceValue.trim().replace(',', '.');
    const parsed = sourceGrinder.parseSetting(normalized);
    if (Number.isFinite(parsed) && parsed > 0 && !Object.is(parsed, -0)) {
      microns = parsed;
    }
  }
  if (!Number.isFinite(microns) || microns <= 0 || Object.is(microns, -0)) {
    microns = 720;
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

  if (
    desc.includes('bardzo drobno') ||
    desc.includes('extra fine') ||
    desc.includes('turkish') ||
    desc.includes('tygielek') ||
    desc.includes('cezve') ||
    desc.includes('ibrik') ||
    desc.includes('dżezw') ||
    desc.includes('dzezw') ||
    desc.includes('espresso') ||
    desc.includes('americano') ||
    desc.includes('lungo') ||
    desc.includes('flat white') ||
    desc.includes('cortado') ||
    desc.includes('macchiato') ||
    desc.includes('flair') ||
    desc.includes('cafelat') ||
    desc.includes('robot') ||
    desc.includes('rok espresso') ||
    desc.includes('la pavoni') ||
    desc.includes('pavoni') ||
    desc.includes('cremina') ||
    desc.includes('olympia') ||
    desc.includes('dźwigni') ||
    desc.includes('dzwigni') ||
    desc.includes('lever espresso') ||
    desc.includes('manual lever') ||
    method === 'ESPRESSO' ||
    method.includes('ESPRESSO') ||
    method === 'FLAIR' ||
    method.includes('FLAIR') ||
    method === 'ROBOT' ||
    method.includes('ROBOT') ||
    method.includes('CAFELAT') ||
    method === 'ROK' ||
    method.includes('ROK') ||
    method.includes('PAVONI') ||
    method.includes('CREMINA') ||
    method.includes('OLYMPIA') ||
    method === 'LEVER' ||
    (!method.includes('CLEVER') && (method.includes('LEVER_') || method.includes('_LEVER') || method.includes('MANUAL LEVER') || method.includes('DZWIGNI'))) ||
    method.includes('AMERICANO') ||
    method.includes('LUNGO') ||
    method.includes('FLAT_WHITE') ||
    method.includes('FLAT WHITE') ||
    method.includes('CORTADO') ||
    method.includes('MACCHIATO') ||
    method === 'TURKISH' ||
    method === 'CEZVE' ||
    method === 'IBRIK' ||
    method.includes('IBRIK') ||
    method.includes('DZEZW') ||
    method.includes('DŻEZW')
  ) {
    if (
      desc.includes('turkish') ||
      desc.includes('tygielek') ||
      desc.includes('cezve') ||
      desc.includes('ibrik') ||
      desc.includes('dżezw') ||
      desc.includes('dzezw') ||
      method === 'TURKISH' ||
      method === 'CEZVE' ||
      method === 'IBRIK' ||
      method.includes('IBRIK') ||
      method.includes('DZEZW') ||
      method.includes('DŻEZW')
    ) {
      return 200;
    }
    return 350;
  }
  if (
    method === 'MOKA' ||
    method === 'BIALETTI' ||
    method.includes('MOKA') ||
    method.includes('BIALETTI') ||
    desc.includes('kawiark') ||
    desc.includes('moka') ||
    desc.includes('bialetti')
  ) {
    return 450;
  }
  if (
    method === 'PHIN' ||
    method.includes('PHIN') ||
    desc.includes('phin')
  ) {
    return 480;
  }
  if (
    method === 'TRICOLATE' ||
    method.includes('TRICOLATE') ||
    method === 'SIBARIST' ||
    method.includes('SIBARIST') ||
    desc.includes('tricolate') ||
    desc.includes('sibarist') ||
    desc.includes('zero bypass')
  ) {
    return 500;
  }
  if (
    method === 'SIPHON' ||
    method === 'SYFON' ||
    method.includes('SIPHON') ||
    method.includes('SYFON') ||
    method.includes('SYPHON') ||
    desc.includes('siphon') ||
    desc.includes('syfon') ||
    desc.includes('syphon') ||
    method === 'VACPOT' ||
    method === 'VAC_POT' ||
    method.includes('VACPOT') ||
    method.includes('VAC POT') ||
    method.includes('VAC_POT') ||
    desc.includes('vacpot') ||
    desc.includes('vac pot') ||
    method.includes('TECHNICA') ||
    desc.includes('technica')
  ) {
    return 650;
  }
  if (
    method.includes('FLASH') ||
    method.includes('ICED_V60') ||
    method.includes('ICED V60') ||
    method.includes('ICE V60') ||
    method.includes('JAPANESE ICED') ||
    desc.includes('flash brew') ||
    desc.includes('iced v60') ||
    desc.includes('japanese iced')
  ) {
    return 600;
  }
  if (
    method === 'CLEVER_DRIPPER' ||
    method === 'CLEVER' ||
    method === 'CLEVER DRIPPER' ||
    method === 'CLEVER_COFFEE_DRIPPER' ||
    method.includes('CLEVER') ||
    desc.includes('clever')
  ) {
    if (
      !desc.includes('średnio-grubo') &&
      !desc.includes('srednio-grubo') &&
      !desc.includes('medium-coarse') &&
      (desc.includes('grubo') || desc.includes('coarse'))
    ) {
      return 950;
    }
    if (desc.includes('drobno') || desc.includes('drobniej') || desc.includes('fine')) {
      return 650;
    }
    return 880;
  }
  if (
    method === 'SWITCH_IMMERSION' ||
    method === 'SWITCH' ||
    method === 'HARIO_SWITCH' ||
    method.includes('SWITCH') ||
    desc.includes('switch')
  ) {
    if (
      method.includes('IMMERS') ||
      method.includes('ZANURZEN') ||
      desc.includes('immers') ||
      desc.includes('zanurzen')
    ) {
      if (
        !desc.includes('średnio') &&
        !desc.includes('medium') &&
        (desc.includes('grubo') || desc.includes('coarse'))
      ) {
        return 900;
      }
      if (desc.includes('drobno') || desc.includes('drobniej') || desc.includes('fine')) {
        return 600;
      }
      return 800;
    }
    if (desc.includes('28') || desc.includes('30') || desc.includes('grubo') || desc.includes('coarse')) return 850;
    if (desc.includes('18') || desc.includes('20') || desc.includes('drobno') || desc.includes('drobniej') || desc.includes('fine')) return 600;
    return 720;
  }
  if (
    desc.includes('drobno') ||
    desc.includes('fine') ||
    method === 'AEROPRESS' ||
    method.includes('AEROPRESS') ||
    method.includes('DELTER') ||
    method.includes('INVERTED') ||
    method.includes('PRISMO') ||
    desc.includes('aeropress') ||
    desc.includes('delter') ||
    desc.includes('inverted') ||
    desc.includes('odwrócon') ||
    desc.includes('odwrocon') ||
    desc.includes('prismo') ||
    desc.includes('flow control')
  ) {
    if (desc.includes('grubo') || desc.includes('coarse')) return 850;
    if (
      !desc.includes('drobno') &&
      !desc.includes('fine') &&
      (desc.includes('średnio') || desc.includes('srednio') || desc.includes('medium'))
    ) {
      return 720;
    }
    if (desc.includes('16') || desc.includes('18')) return 520;
    return 560;
  }
  if (
    method === 'PULSAR' ||
    method.includes('PULSAR') ||
    desc.includes('pulsar') ||
    method.includes('NEXTLEVEL') ||
    method.includes('NEXT LEVEL') ||
    desc.includes('nextlevel') ||
    desc.includes('next level')
  ) {
    if (desc.includes('grubo') || desc.includes('coarse')) return 750;
    return 600;
  }
  if (
    method === 'KASUYA' ||
    method.includes('KASUYA') ||
    method.includes('4:6') ||
    desc.includes('kasuya') ||
    desc.includes('4:6')
  ) {
    return 950;
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
    method === 'MUGEN' ||
    method.includes('MUGEN') ||
    desc.includes('mugen') ||
    method.includes('CAFEC') ||
    desc.includes('cafec') ||
    desc.includes('flower dripper') ||
    desc.includes('deep 27') ||
    desc.includes('deep27') ||
    method.includes('DEEP 27') ||
    method.includes('DEEP_27') ||
    method === 'TRINITY' ||
    method === 'TRINITY_ONE' ||
    method.includes('TRINITY') ||
    desc.includes('trinity') ||
    method === 'GINA' ||
    method.includes('GINA') ||
    desc.includes('gina') ||
    method.includes('TSUBAME') ||
    desc.includes('tsubame') ||
    method === 'OREA' ||
    method.includes('OREA') ||
    desc.includes('orea') ||
    method === 'APRIL' ||
    method.includes('APRIL') ||
    desc.includes('april') ||
    method === 'MELITTA' ||
    method.includes('MELITTA') ||
    desc.includes('melitta') ||
    method === 'BEEHOUSE' ||
    method.includes('BEEHOUSE') ||
    desc.includes('beehouse') ||
    method === 'KONO' ||
    method.includes('KONO') ||
    desc.includes('kono') ||
    method === 'LILYDRIP' ||
    method.includes('LILYDRIP') ||
    method.includes('LILY DRIP') ||
    desc.includes('lilydrip') ||
    desc.includes('lily drip')
  ) {
    if (desc.includes('28') || desc.includes('30') || desc.includes('grubo') || desc.includes('coarse')) return 850;
    if (desc.includes('18') || desc.includes('20')) return 600;
    return 720;
  }
  if (
    method === 'CHEMEX' ||
    method.includes('CHEMEX') ||
    desc.includes('chemex') ||
    method === 'CUPPING' ||
    method.includes('CUPPING') ||
    method.includes('KAPPING') ||
    desc.includes('cupping') ||
    desc.includes('kapping')
  ) {
    return 880;
  }
  if (
    method === 'BATCH_BREW' ||
    method === 'BATCH BREW' ||
    method === 'BATCH' ||
    method.includes('BATCH') ||
    method.includes('MOCCAMASTER') ||
    method.includes('PRZELEWOW') ||
    desc.includes('batch brew') ||
    desc.includes('batch') ||
    desc.includes('moccamaster') ||
    desc.includes('przelewowy')
  ) {
    return 820;
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
    desc.includes('cold drip') ||
    desc.includes('ice drip') ||
    desc.includes('cold brew') ||
    method.includes('SLOW_DRIP') ||
    method.includes('SLOW DRIP') ||
    desc.includes('slow drip') ||
    method.includes('ICE_BREW') ||
    method.includes('ICE BREW') ||
    desc.includes('ice brew') ||
    method.includes('MIZUDASHI') ||
    desc.includes('mizudashi') ||
    method.includes('DUTCH') ||
    desc.includes('dutch') ||
    desc.includes('kyoto') ||
    method.includes('TODDY') ||
    desc.includes('toddy') ||
    method.includes('KARLSBAD') ||
    desc.includes('karlsbad') ||
    method.includes('BAYREUTH') ||
    desc.includes('bayreuth') ||
    method.includes('WALKUERE') ||
    method.includes('WALKÜRE') ||
    method.includes('WALKURE') ||
    desc.includes('walküre') ||
    desc.includes('walkuere') ||
    desc.includes('walkure') ||
    desc.includes('coarse') ||
    method.includes('MACERAT') ||
    method.includes('MACERACJ') ||
    method.includes('NITRO') ||
    desc.includes('maceracj') ||
    desc.includes('macerat') ||
    desc.includes('na zimno') ||
    desc.includes('cold steep') ||
    desc.includes('cold infusion') ||
    desc.includes('nitro')
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

export interface MethodGrindSettingResult {
  clicks: number;
  formatted: string;
  microns: number;
  category: GrindCategory;
  grinderName: string;
}

/**
 * Wylicza bezpośrednią nastawę wybranego młynka dla wskazanej metody parzenia (np. V60, AeroPress, Chemex, Espresso).
 */
export function getGrinderSettingForMethod(
  grinderId: string,
  method: string,
  language = 'pl'
): MethodGrindSettingResult {
  const safeMethod = typeof method === 'string' ? method.trim() : '';
  const microns = getRecipeMicrons({ method: safeMethod });
  const grinder = findGrinderById(grinderId) || SUPPORTED_GRINDERS[0];
  const converted = convertMicronsToGrinder(microns, grinder.id, language);
  const category = findGrindCategoryForMicrons(microns);

  return {
    clicks: converted.rawValue,
    formatted: converted.formatted,
    microns,
    category,
    grinderName: grinder.name,
  };
}


export interface GrinderSettingOverviewItem {
  grinderId: string;
  grinderName: string;
  formatted: string;
  clicks: number;
  microns: number;
}

/**
 * Zwraca zestawienie nastaw dla wszystkich wspieranych młynków dla wskazanej metody parzenia.
 */
export function getGrindSettingsOverview(
  method: string,
  language = 'pl'
): GrinderSettingOverviewItem[] {
  const safeMethod = typeof method === 'string' ? method.trim() : '';

  return SUPPORTED_GRINDERS.map((grinder) => {
    const setting = getGrinderSettingForMethod(grinder.id, safeMethod, language);
    return {
      grinderId: grinder.id,
      grinderName: setting.grinderName,
      formatted: setting.formatted,
      clicks: setting.clicks,
      microns: setting.microns,
    };
  });
}

export interface GrinderSearchCriteria {
  query?: string;
  burrType?: string;
  maxStepMicrons?: number;
}

/**
 * Filtruje i wyszukuje modele młynków według zadanych kryteriów (zapytanie tekstowe, typ żaren, skok mikroregulacji).
 */
export function filterGrinders(
  grinders?: GrinderModel[] | null,
  criteria: GrinderSearchCriteria = {}
): GrinderModel[] {
  const list = Array.isArray(grinders) ? grinders : SUPPORTED_GRINDERS;
  const query = criteria && typeof criteria.query === 'string' ? criteria.query.trim().toLowerCase() : '';
  const burr = criteria && typeof criteria.burrType === 'string' ? criteria.burrType.trim().toLowerCase() : '';
  const maxStep = criteria && typeof criteria.maxStepMicrons === 'number' && Number.isFinite(criteria.maxStepMicrons)
    ? criteria.maxStepMicrons
    : null;

  return list.filter((grinder) => {
    if (!grinder || typeof grinder !== 'object') return false;

    if (query) {
      const name = (grinder.name || '').toLowerCase();
      const id = (grinder.id || '').toLowerCase();
      const burrName = (grinder.burrType || '').toLowerCase();
      if (!name.includes(query) && !id.includes(query) && !burrName.includes(query)) {
        return false;
      }
    }

    if (burr) {
      const burrName = (grinder.burrType || '').toLowerCase();
      const burrPl = (grinder.burrTypePl || '').toLowerCase();
      const burrEn = (grinder.burrTypeEn || '').toLowerCase();
      if (!burrName.includes(burr) && !burrPl.includes(burr) && !burrEn.includes(burr)) {
        return false;
      }
    }

    if (maxStep !== null && grinder.stepMicrons > maxStep) {
      return false;
    }

    return true;
  });
}

export interface FinesRiskAnalysis {
  grinderId: string;
  grinderName: string;
  burrType: string;
  targetMicrons: number;
  finesRiskScore: number;
  riskLevel: 'low' | 'moderate' | 'high';
  cloggingRiskDescriptionPl: string;
  cloggingRiskDescriptionEn: string;
  recommendedAdjustmentPl: string;
  recommendedAdjustmentEn: string;
}

/**
 * Szacuje ryzyko powstawania nadmiernej ilości pyłu kawowego (fines)
 * dla wybranego młynka, nastawy w mikronach i stopnia wypalenia ziaren.
 */
export function estimateGrindFinesRisk(
  grinderIdOrModel: string | GrinderModel | null | undefined,
  targetMicrons: number | string,
  roastLevel: 'light' | 'medium' | 'dark' | string = 'light'
): FinesRiskAnalysis {
  let grinder: GrinderModel;
  if (grinderIdOrModel && typeof grinderIdOrModel === 'object' && 'id' in grinderIdOrModel) {
    grinder = grinderIdOrModel as GrinderModel;
  } else if (typeof grinderIdOrModel === 'string') {
    grinder = findGrinderById(grinderIdOrModel) || SUPPORTED_GRINDERS[0];
  } else {
    grinder = SUPPORTED_GRINDERS[0];
  }

  const rawMicrons =
    typeof targetMicrons === 'number'
      ? targetMicrons
      : typeof targetMicrons === 'string'
      ? parseFloat(targetMicrons.replace(/\uFEFF/g, '').replace(',', '.').trim())
      : 720;
  const safeMicrons = Number.isFinite(rawMicrons) && !Object.is(rawMicrons, -0) ? Math.max(0, Math.min(2500, rawMicrons)) : 720;

  let baseScore: number;
  if (safeMicrons < 350) {
    baseScore = 75;
  } else if (safeMicrons < 600) {
    baseScore = 50;
  } else if (safeMicrons < 850) {
    baseScore = 30;
  } else {
    baseScore = 18;
  }

  const isFlat = (grinder.burrType || '').toLowerCase().includes('flat') || (grinder.burrTypePl || '').toLowerCase().includes('płask');
  const burrModifier = isFlat ? -15 : 5;

  const roast = typeof roastLevel === 'string' ? roastLevel.trim().toLowerCase() : 'light';
  let roastModifier = 0;
  if (roast.includes('dark') || roast.includes('ciemn')) {
    roastModifier = 15;
  } else if (roast.includes('med') || roast.includes('średn')) {
    roastModifier = 5;
  }

  const totalScore = Math.max(0, Math.min(100, Math.round(baseScore + burrModifier + roastModifier)));

  let riskLevel: 'low' | 'moderate' | 'high';
  let cloggingRiskDescriptionPl: string;
  let cloggingRiskDescriptionEn: string;
  let recommendedAdjustmentPl: string;
  let recommendedAdjustmentEn: string;

  if (totalScore >= 70) {
    riskLevel = 'high';
    cloggingRiskDescriptionPl = 'Wysoki poziom pyłu kawowego — duże ryzyko przeciągania ekstrakcji i zatykania filtra papierowego.';
    cloggingRiskDescriptionEn = 'High fines risk — elevated probability of extended drawdown and paper filter clogging.';
    recommendedAdjustmentPl = 'Zastosuj grubszą nastawę o 1-2 kliki, delikatniejsze zalewanie bez intensywnego mieszania (swirl) lub sito odsiewające.';
    recommendedAdjustmentEn = 'Grind 1-2 clicks coarser, pour gently without aggressive swirling, or use a particle sifter.';
  } else if (totalScore >= 40) {
    riskLevel = 'moderate';
    cloggingRiskDescriptionPl = 'Umiarkowany poziom pyłu kawowego — zbalansowany przepływ wody z pożądanym ciałem naparu.';
    cloggingRiskDescriptionEn = 'Moderate fines risk — balanced water flow rate with pleasant brew body.';
    recommendedAdjustmentPl = 'Standardowa technika zalewania z umiarkowaną agitacją złoża kawowego.';
    recommendedAdjustmentEn = 'Standard pouring technique with moderate bed agitation.';
  } else {
    riskLevel = 'low';
    cloggingRiskDescriptionPl = 'Niski poziom pyłu kawowego — czysty profil sensoryczny, wysoka przejrzystość i szybki spływ wody.';
    cloggingRiskDescriptionEn = 'Low fines risk — clean sensory profile, high clarity, and fast drawdown.';
    recommendedAdjustmentPl = 'Brak konieczności korekty techniki; możesz zastosować nieco drobniejszy przemiał dla wyższej ekstrakcji.';
    recommendedAdjustmentEn = 'No technique correction needed; you can grind slightly finer to increase extraction yield.';
  }

  return {
    grinderId: grinder.id,
    grinderName: grinder.name,
    burrType: grinder.burrType,
    targetMicrons: safeMicrons,
    finesRiskScore: totalScore,
    riskLevel,
    cloggingRiskDescriptionPl,
    cloggingRiskDescriptionEn,
    recommendedAdjustmentPl,
    recommendedAdjustmentEn,
  };
}

export interface GrinderAdjustmentResult {
  grinderId: string;
  grinderName: string;
  startMicrons: number;
  targetMicrons: number;
  startClicks: number;
  targetClicks: number;
  clickDelta: number;
  direction: 'coarser' | 'finer' | 'identical';
  formattedStartSetting: string;
  formattedTargetSetting: string;
  recommendationPl: string;
  recommendationEn: string;
}

/**
 * Asystuje w precyzyjnej zmianie nastawy młynka pomiędzy dwoma rozmiarami cząstek w mikronach,
 * obliczając różnicę w klikach, kierunek regulacji oraz wskazówkę dla użytkownika.
 */
export function calculateGrinderAdjustment(
  grinderIdOrModel: string | GrinderModel | null | undefined,
  startMicrons: number | string,
  targetMicrons: number | string,
  language: string = 'pl'
): GrinderAdjustmentResult {
  let grinder: GrinderModel;
  if (grinderIdOrModel && typeof grinderIdOrModel === 'object' && 'id' in grinderIdOrModel) {
    grinder = grinderIdOrModel as GrinderModel;
  } else if (typeof grinderIdOrModel === 'string') {
    grinder = findGrinderById(grinderIdOrModel) || SUPPORTED_GRINDERS[0];
  } else {
    grinder = SUPPORTED_GRINDERS[0];
  }

  const parseM = (m: number | string, defaultVal: number): number => {
    if (typeof m === 'number') {
      return Number.isFinite(m) && !Object.is(m, -0) ? Math.max(150, Math.min(1500, m)) : defaultVal;
    }
    if (typeof m === 'string') {
      const parsed = parseFloat(m.trim().replace(',', '.'));
      return Number.isFinite(parsed) && !Object.is(parsed, -0) ? Math.max(150, Math.min(1500, parsed)) : defaultVal;
    }
    return defaultVal;
  };

  const safeStart = parseM(startMicrons, 720);
  const safeTarget = parseM(targetMicrons, 720);

  const startConv = convertMicronsToGrinder(safeStart, grinder.id, language);
  const targetConv = convertMicronsToGrinder(safeTarget, grinder.id, language);

  const startClicks = startConv.rawValue;
  const targetClicks = targetConv.rawValue;
  let clickDelta = targetClicks - startClicks;
  if (Object.is(clickDelta, -0)) {
    clickDelta = 0;
  }

  let direction: 'coarser' | 'finer' | 'identical';
  let recommendationPl: string;
  let recommendationEn: string;

  const absClicks = Math.abs(clickDelta);

  if (clickDelta > 0) {
    direction = 'coarser';
    const unitPl = absClicks === 1 ? 'klik' : absClicks < 5 ? 'kliki' : 'klików';
    const unitEn = absClicks === 1 ? 'click' : 'clicks';
    recommendationPl = `Przestaw młynek o ${absClicks} ${unitPl} grubiej.`;
    recommendationEn = `Adjust grinder ${absClicks} ${unitEn} coarser.`;
  } else if (clickDelta < 0) {
    direction = 'finer';
    const unitPl = absClicks === 1 ? 'klik' : absClicks < 5 ? 'kliki' : 'klików';
    const unitEn = absClicks === 1 ? 'click' : 'clicks';
    recommendationPl = `Przestaw młynek o ${absClicks} ${unitPl} drobniej.`;
    recommendationEn = `Adjust grinder ${absClicks} ${unitEn} finer.`;
  } else {
    direction = 'identical';
    recommendationPl = 'Brak konieczności regulacji — nastawa jest optymalna.';
    recommendationEn = 'No adjustment needed — the setting is already optimal.';
  }

  return {
    grinderId: grinder.id,
    grinderName: startConv.grinderName,
    startMicrons: safeStart,
    targetMicrons: safeTarget,
    startClicks,
    targetClicks,
    clickDelta,
    direction,
    formattedStartSetting: startConv.formatted,
    formattedTargetSetting: targetConv.formatted,
    recommendationPl,
    recommendationEn,
  };
}


export interface GrindDistributionEstimate {
  targetMicrons: number;
  burrType: 'conical' | 'flat';
  finesPercentage: number;
  targetRangePercentage: number;
  bouldersPercentage: number;
  span: number;
  d10Microns: number;
  d50Microns: number;
  d90Microns: number;
  unimodalityScore: number;
  descriptionPl: string;
  descriptionEn: string;
}

/**
 * Szacuje profil rozkładu wielkości cząstek mielenia (fines, boulders, span, unimodality)
 * na podstawie wielkości docelowej w mikronach oraz geometrii żaren (stożkowe vs płaskie).
 */
export function estimateGrindDistribution(
  targetMicrons: number | string,
  burrType: 'conical' | 'flat' | string = 'conical'
): GrindDistributionEstimate {
  const parseNum = (v: unknown, fallback = 750): number => {
    if (typeof v === 'number') return Number.isFinite(v) && !Object.is(v, -0) ? Math.max(150, Math.min(1500, v)) : fallback;
    if (typeof v === 'string') {
      const parsed = parseFloat(v.replace(/\uFEFF/g, '').replace(',', '.').trim());
      return Number.isFinite(parsed) && !Object.is(parsed, -0) ? Math.max(150, Math.min(1500, parsed)) : fallback;
    }
    return fallback;
  };

  const safeTarget = Math.round(parseNum(targetMicrons, 750));
  const isFlat =
    typeof burrType === 'string' &&
    (burrType.trim().toLowerCase().includes('flat') || burrType.trim().toLowerCase() === 'plaskie' || burrType.trim().toLowerCase() === 'płaskie');
  const type: 'conical' | 'flat' = isFlat ? 'flat' : 'conical';

  let d10Microns: number;
  let d50Microns: number;
  let d90Microns: number;
  let finesPercentage: number;
  let bouldersPercentage: number;
  let span: number;
  let unimodalityScore: number;
  let descriptionPl: string;
  let descriptionEn: string;

  d50Microns = safeTarget;

  if (type === 'flat') {
    d10Microns = Math.round(safeTarget * 0.55);
    d90Microns = Math.round(safeTarget * 1.55);
    span = Number(((d90Microns - d10Microns) / d50Microns).toFixed(2));
    finesPercentage = Number((8 + (1500 - safeTarget) * 0.005).toFixed(1));
    bouldersPercentage = Number((6 + safeTarget * 0.004).toFixed(1));
    unimodalityScore = Math.min(100, Math.max(0, Math.round(85 - span * 10)));
    descriptionPl = 'Żarna płaskie — wąski rozkład wielkości cząstek (unimodalny), wyższa przejrzystość smaku i wysoka ekstrakcja.';
    descriptionEn = 'Flat burrs — narrow particle size distribution (unimodal), enhanced flavor clarity and higher extraction.';
  } else {
    d10Microns = Math.round(safeTarget * 0.40);
    d90Microns = Math.round(safeTarget * 1.80);
    span = Number(((d90Microns - d10Microns) / d50Microns).toFixed(2));
    finesPercentage = Number((14 + (1500 - safeTarget) * 0.006).toFixed(1));
    bouldersPercentage = Number((9 + safeTarget * 0.005).toFixed(1));
    unimodalityScore = Math.min(100, Math.max(0, Math.round(70 - span * 10)));
    descriptionPl = 'Żarna stożkowe — szerszy, bimodalny rozkład cząstek, więcej pyłu budującego kremowe body i słodycz.';
    descriptionEn = 'Conical burrs — broader, bimodal particle distribution, higher fines producing fuller body and sweetness.';
  }

  const targetRangePercentage = Number(Math.max(0, 100 - finesPercentage - bouldersPercentage).toFixed(1));

  return {
    targetMicrons: safeTarget,
    burrType: type,
    finesPercentage,
    targetRangePercentage,
    bouldersPercentage,
    span,
    d10Microns,
    d50Microns,
    d90Microns,
    unimodalityScore,
    descriptionPl,
    descriptionEn,
  };
}

export type BurrSpeedCategory = 'ultra_low' | 'low' | 'medium' | 'high';

export interface BurrSpeedImpactAnalysis {
  rpm: number;
  burrType: 'conical' | 'flat';
  speedCategory: BurrSpeedCategory;
  heatGenerationScore: number;
  finesTendencyScore: number;
  clarityVsBody: 'high_clarity' | 'balanced' | 'full_body';
  descriptionPl: string;
  descriptionEn: string;
}

/**
 * Szacuje wpływ prędkości obrotowej żaren (RPM) oraz geometrii żaren na nagrzewanie,
 * frakcję pyłu i profil sensoryczny (przejrzystość vs body).
 */
export function calculateBurrSpeedImpact(
  rpm: number | string,
  burrType: 'conical' | 'flat' | string = 'flat'
): BurrSpeedImpactAnalysis {
  const parseNum = (v: unknown, fallback = 900): number => {
    if (typeof v === 'number') return Number.isFinite(v) && !Object.is(v, -0) ? Math.max(100, Math.min(3000, v)) : fallback;
    if (typeof v === 'string') {
      const parsed = parseFloat(v.replace(/\uFEFF/g, '').replace(',', '.').trim());
      return Number.isFinite(parsed) && !Object.is(parsed, -0) ? Math.max(100, Math.min(3000, parsed)) : fallback;
    }
    return fallback;
  };

  const safeRpm = Math.round(parseNum(rpm, 900));
  const isFlat =
    typeof burrType === 'string' &&
    (burrType.trim().toLowerCase().includes('flat') || burrType.trim().toLowerCase() === 'plaskie' || burrType.trim().toLowerCase() === 'płaskie');
  const type: 'conical' | 'flat' = isFlat ? 'flat' : 'conical';

  let speedCategory: BurrSpeedCategory;
  let heatGenerationScore: number;
  let finesTendencyScore: number;
  let clarityVsBody: 'high_clarity' | 'balanced' | 'full_body';
  let descriptionPl: string;
  let descriptionEn: string;

  if (safeRpm < 500) {
    speedCategory = 'ultra_low';
    heatGenerationScore = Math.round(10 + (safeRpm / 500) * 15);
    finesTendencyScore = type === 'flat' ? 20 : 35;
    clarityVsBody = 'high_clarity';
    descriptionPl = 'Bardzo niskie obroty żaren — minimalne nagrzewanie przemiału, zredukowana ilość pyłu i maksymalna przejrzystość nut smakowych.';
    descriptionEn = 'Very low burr RPM — minimal heat buildup, reduced fines, and peak flavor clarity.';
  } else if (safeRpm < 900) {
    speedCategory = 'low';
    heatGenerationScore = Math.round(25 + ((safeRpm - 500) / 400) * 20);
    finesTendencyScore = type === 'flat' ? 35 : 50;
    clarityVsBody = 'high_clarity';
    descriptionPl = 'Niskie obroty żaren — zrównoważona retencja i wysoka czystość profilu sensorycznego.';
    descriptionEn = 'Low burr RPM — balanced retention and high sensory clarity.';
  } else if (safeRpm < 1400) {
    speedCategory = 'medium';
    heatGenerationScore = Math.round(45 + ((safeRpm - 900) / 500) * 25);
    finesTendencyScore = type === 'flat' ? 55 : 68;
    clarityVsBody = 'balanced';
    descriptionPl = 'Umiarkowane obroty żaren — wszechstronny profil parzenia łączący dobrą ekstrakcję z wyrazistym body.';
    descriptionEn = 'Moderate burr RPM — versatile profile balancing solid extraction with noticeable body.';
  } else {
    speedCategory = 'high';
    heatGenerationScore = Math.min(100, Math.round(70 + ((safeRpm - 1400) / 1600) * 30));
    finesTendencyScore = type === 'flat' ? 75 : 88;
    clarityVsBody = 'full_body';
    descriptionPl = 'Wysokie obroty żaren — szybsze mielenie, wyższa temperatura komory mielenia i większa frakcja pyłu dająca pełniejsze body.';
    descriptionEn = 'High burr RPM — fast throughput, higher chamber heat, and increased fines creating heavier body.';
  }

  return {
    rpm: safeRpm,
    burrType: type,
    speedCategory,
    heatGenerationScore,
    finesTendencyScore,
    clarityVsBody,
    descriptionPl,
    descriptionEn,
  };
}

export interface GrindTimeEstimate {
  grinderId: string;
  grinderName: string;
  doseGrams: number;
  targetMicrons: number;
  isElectric: boolean;
  throughputGramsPerSecond: number;
  estimatedSeconds: number;
  formattedDuration: string;
  advicePl: string;
  adviceEn: string;
}

/**
 * Szacuje czas mielenia porcji ziaren kawy dla wybranego modelu młynka i grubości przemiału.
 */
export function estimateGrindDuration(
  grinderId: string,
  doseGrams: number | string,
  targetMicrons?: number | string
): GrindTimeEstimate {
  const grinder = (typeof grinderId === 'string' && findGrinderById(grinderId)) ||
    SUPPORTED_GRINDERS.find((g) => g.id === 'generic_grinder') ||
    SUPPORTED_GRINDERS[0];

  const parseNum = (v: unknown, fallback: number): number => {
    if (typeof v === 'number') return Number.isFinite(v) && !Object.is(v, -0) ? v : fallback;
    if (typeof v === 'string') {
      const parsed = parseFloat(v.replace(/\uFEFF/g, '').replace(',', '.').trim());
      return Number.isFinite(parsed) && !Object.is(parsed, -0) ? parsed : fallback;
    }
    return fallback;
  };

  const rawDose = parseNum(doseGrams, 15);
  const safeDose = rawDose <= 0 ? 15 : Math.max(1, Math.min(200, Math.round(rawDose * 10) / 10));

  const rawMicrons = parseNum(targetMicrons, 700);
  const safeMicrons = rawMicrons < 100 ? 700 : Math.max(150, Math.min(1600, Math.round(rawMicrons)));

  const electricIds = new Set([
    'fellow_ode_gen2',
    'baratza_encore',
    'wilfa_svart',
    'eureka_mignon',
    'niche_zero',
    'mahlkoenig_ek43',
    'timemore_sculptor',
  ]);
  const isElectric = electricIds.has(grinder.id);

  let baseThroughput = 0.65;
  if (grinder.id === 'mahlkoenig_ek43') baseThroughput = 10.0;
  else if (grinder.id === 'timemore_sculptor') baseThroughput = 4.0;
  else if (grinder.id === 'fellow_ode_gen2') baseThroughput = 3.5;
  else if (grinder.id === 'eureka_mignon') baseThroughput = 2.2;
  else if (grinder.id === 'baratza_encore') baseThroughput = 2.0;
  else if (grinder.id === 'wilfa_svart') baseThroughput = 1.8;
  else if (grinder.id === 'niche_zero') baseThroughput = 1.8;
  else if (isElectric) baseThroughput = 2.5;
  else if (grinder.id === '1zpresso_k_ultra') baseThroughput = 0.9;
  else if (grinder.id === 'kingrinder_k6') baseThroughput = 0.85;
  else if (grinder.id === '1zpresso_j_max') baseThroughput = 0.75;
  else if (grinder.id === 'comandante_c40') baseThroughput = 0.65;
  else if (grinder.id === 'kinu_m47') baseThroughput = 0.65;
  else if (grinder.id === '1zpresso_zp6') baseThroughput = 0.6;
  else if (grinder.id === 'timemore_c2_c3') baseThroughput = 0.55;
  else baseThroughput = 0.65;

  const micronFactor = Math.max(0.65, Math.min(1.35, safeMicrons / 700));
  const throughputGramsPerSecond = Math.round(baseThroughput * micronFactor * 100) / 100;
  const estimatedSeconds = Math.max(1, Math.round(safeDose / throughputGramsPerSecond));

  const formattedDuration =
    estimatedSeconds >= 60
      ? `${Math.floor(estimatedSeconds / 60)} min ${estimatedSeconds % 60} s`
      : `${estimatedSeconds} s`;

  const advicePl = isElectric
    ? `Młynek elektryczny ${grinder.name}: zmielenie ${safeDose}g przy grubości ${safeMicrons} µm zajmie ok. ${formattedDuration}.`
    : `Młynek ręczny ${grinder.name}: zmielenie ${safeDose}g przy grubości ${safeMicrons} µm zajmie ok. ${formattedDuration} przy jednostajnym tempie kręcenia.`;

  const adviceEn = isElectric
    ? `Electric grinder ${grinder.name}: grinding ${safeDose}g at ${safeMicrons} µm will take approximately ${formattedDuration}.`
    : `Manual grinder ${grinder.name}: grinding ${safeDose}g at ${safeMicrons} µm will take approximately ${formattedDuration} at steady hand-cranking speed.`;

  return {
    grinderId: grinder.id,
    grinderName: grinder.name,
    doseGrams: safeDose,
    targetMicrons: safeMicrons,
    isElectric,
    throughputGramsPerSecond,
    estimatedSeconds,
    formattedDuration,
    advicePl,
    adviceEn,
  };
}

/**
 * Zwraca sformatowaną nastawę wybranego młynka dla zadanej grubości mielenia w mikronach.
 */
export function formatGrinderDialSetting(
  grinderId: string,
  microns: number | string,
  language = 'pl'
): string {
  const cleanId = typeof grinderId === 'string' ? grinderId.trim().toLowerCase() : '';
  const grinder = findGrinderById(cleanId) || SUPPORTED_GRINDERS[0];
  const res = convertMicronsToGrinder(microns, grinder.id, language);
  return res.formatted;
}

export type GrindAdjustmentDirection = 'finer' | 'coarser' | 'unchanged';

export interface GrinderStepDeltaAnalysis {
  grinderId: string;
  grinderName: string;
  fromMicrons: number;
  toMicrons: number;
  deltaMicrons: number;
  direction: GrindAdjustmentDirection;
  stepClicks: number;
  micronsPerStep: number;
  fromDialFormatted: string;
  toDialFormatted: string;
  advicePl: string;
  adviceEn: string;
}

/**
 * Oblicza liczbę klików/kroków oraz kierunek regulacji młynka przy zmianie docelowej grubości mielenia.
 */
export function calculateGrinderStepDelta(
  grinderId: string | undefined | null,
  fromMicrons: number | string | undefined | null,
  toMicrons: number | string | undefined | null,
  language = 'pl'
): GrinderStepDeltaAnalysis {
  const cleanId = typeof grinderId === 'string' ? grinderId.trim().toLowerCase() : '';
  const grinder =
    (cleanId && findGrinderById(cleanId)) ||
    SUPPORTED_GRINDERS.find((g) => g.id === 'generic_grinder') ||
    SUPPORTED_GRINDERS[0];

  const parseMicrons = (val: unknown): number => {
    if (typeof val === 'number') {
      return Number.isFinite(val) && val > 0 && !Object.is(val, -0) ? val : 0;
    }
    if (typeof val === 'string') {
      const clean = val.replace(/\uFEFF/g, '').replace(/[^\d.,-]/g, '').replace(',', '.').trim();
      const num = parseFloat(clean);
      return Number.isFinite(num) && num > 0 && !Object.is(num, -0) ? num : 0;
    }
    return 0;
  };

  const from = parseMicrons(fromMicrons);
  const to = parseMicrons(toMicrons);

  const safeFrom = from > 0 ? Math.round(from) : 720;
  const safeTo = to > 0 ? Math.round(to) : (from > 0 ? safeFrom : 720);
  const deltaMicrons = from === 0 && to === 0 ? 0 : safeTo - safeFrom;

  const fromSetting = convertMicronsToGrinder(safeFrom, grinder.id, language);
  const toSetting = convertMicronsToGrinder(safeTo, grinder.id, language);

  const stepMicrons = grinder.stepMicrons > 0 ? grinder.stepMicrons : 30;
  let direction: GrindAdjustmentDirection = 'unchanged';
  let stepClicks = 0;

  if (deltaMicrons < 0) {
    direction = 'finer';
    stepClicks = Math.round(Math.abs(deltaMicrons) / stepMicrons);
  } else if (deltaMicrons > 0) {
    direction = 'coarser';
    stepClicks = Math.round(deltaMicrons / stepMicrons);
  }

  let advicePl = `Nastawa młynka ${grinder.name} pozostaje bez zmian (${fromSetting.formatted}).`;
  let adviceEn = `Grinder setting for ${grinder.name} remains unchanged (${fromSetting.formatted}).`;

  if (direction === 'finer') {
    const clicksPl = stepClicks === 1 ? '1 klik' : stepClicks < 5 ? `${stepClicks} kliki` : `${stepClicks} klików`;
    const clicksEn = stepClicks === 1 ? '1 click' : `${stepClicks} clicks`;
    advicePl = `Przestaw młynek ${grinder.name} o ${clicksPl} drobniej (${fromSetting.formatted} ➔ ${toSetting.formatted}).`;
    adviceEn = `Adjust ${grinder.name} ${clicksEn} finer (${fromSetting.formatted} ➔ ${toSetting.formatted}).`;
  } else if (direction === 'coarser') {
    const clicksPl = stepClicks === 1 ? '1 klik' : stepClicks < 5 ? `${stepClicks} kliki` : `${stepClicks} klików`;
    const clicksEn = stepClicks === 1 ? '1 click' : `${stepClicks} clicks`;
    advicePl = `Przestaw młynek ${grinder.name} o ${clicksPl} grubiej (${fromSetting.formatted} ➔ ${toSetting.formatted}).`;
    adviceEn = `Adjust ${grinder.name} ${clicksEn} coarser (${fromSetting.formatted} ➔ ${toSetting.formatted}).`;
  }

  return {
    grinderId: grinder.id,
    grinderName: grinder.name,
    fromMicrons: safeFrom,
    toMicrons: safeTo,
    deltaMicrons,
    direction,
    stepClicks,
    micronsPerStep: stepMicrons,
    fromDialFormatted: fromSetting.formatted,
    toDialFormatted: toSetting.formatted,
    advicePl,
    adviceEn,
  };
}

export type GrinderRetentionClass = 'ultra_low' | 'low' | 'medium' | 'high';

export interface GrinderRetentionEstimate {
  grinderId: string;
  grinderName: string;
  isHandGrinder: boolean;
  retentionClass: GrinderRetentionClass;
  typicalRetentionGrams: number;
  recommendedPurgeGrams: number;
  advicePl: string;
  adviceEn: string;
}

/**
 * Szacuje retencję kawy w komorze żaren i wylocie młynka oraz rekomenduje dawkę przedmuchu (purge dose)
 * przy zmianie ziaren lub znaczącej regulacji grubości mielenia.
 */
export function estimateGrinderRetention(
  grinderId: string | undefined | null,
  options?: {
    isChangingBeans?: boolean;
    isLargeGrindAdjustment?: boolean;
  } | null
): GrinderRetentionEstimate {
  const cleanId = typeof grinderId === 'string' ? grinderId.trim().toLowerCase() : '';
  const grinder =
    (cleanId && findGrinderById(cleanId)) ||
    SUPPORTED_GRINDERS.find((g) => g.id === 'generic_grinder') ||
    SUPPORTED_GRINDERS[0];

  const electricIds = new Set([
    'fellow_ode_gen2',
    'baratza_encore',
    'wilfa_svart',
    'eureka_mignon',
    'niche_zero',
    'mahlkoenig_ek43',
    'timemore_sculptor',
  ]);

  const singleDoseElectricIds = new Set([
    'fellow_ode_gen2',
    'niche_zero',
    'timemore_sculptor',
  ]);

  const isHand = !electricIds.has(grinder.id) && grinder.id !== 'generic_grinder';

  let retentionClass: GrinderRetentionClass = 'medium';
  let typicalRetentionGrams = 1.0;
  let basePurgeGrams = 1.0;

  if (isHand) {
    retentionClass = 'ultra_low';
    typicalRetentionGrams = 0.1;
    basePurgeGrams = 0;
  } else if (singleDoseElectricIds.has(grinder.id)) {
    retentionClass = 'low';
    typicalRetentionGrams = 0.4;
    basePurgeGrams = 0.5;
  } else if (grinder.id === 'eureka_mignon' || grinder.id === 'mahlkoenig_ek43') {
    retentionClass = 'high';
    typicalRetentionGrams = 2.5;
    basePurgeGrams = 2.5;
  } else if (grinder.id === 'baratza_encore' || grinder.id === 'wilfa_svart') {
    retentionClass = 'medium';
    typicalRetentionGrams = 1.2;
    basePurgeGrams = 1.5;
  } else {
    // generic grinder
    retentionClass = 'medium';
    typicalRetentionGrams = 1.0;
    basePurgeGrams = 1.0;
  }

  const isChangingBeans = Boolean(options?.isChangingBeans);
  const isLargeGrindAdjustment = Boolean(options?.isLargeGrindAdjustment);

  let recommendedPurgeGrams = basePurgeGrams;
  if (isChangingBeans) {
    if (retentionClass === 'ultra_low') {
      recommendedPurgeGrams = 1.0;
    } else if (retentionClass === 'low') {
      recommendedPurgeGrams = 1.5;
    } else if (retentionClass === 'medium') {
      recommendedPurgeGrams = 2.5;
    } else {
      recommendedPurgeGrams = 4.0;
    }
  }

  if (isLargeGrindAdjustment) {
    recommendedPurgeGrams += retentionClass === 'ultra_low' ? 0.5 : 1.0;
  }

  recommendedPurgeGrams = Math.round(recommendedPurgeGrams * 10) / 10;

  let advicePl = '';
  let adviceEn = '';

  if (retentionClass === 'ultra_low') {
    advicePl = `Młynek ręczny ${grinder.name} posiada znikomą retencję (~${typicalRetentionGrams}g). Wystarczy delikatne ostukanie żaren.`;
    adviceEn = `Manual grinder ${grinder.name} features negligible retention (~${typicalRetentionGrams}g). Gentle tap is sufficient.`;
  } else if (retentionClass === 'low') {
    advicePl = `Młynek single-dose ${grinder.name} charakteryzuje się niską retencją (~${typicalRetentionGrams}g). Rekomendowany przedmuch: ${recommendedPurgeGrams}g.`;
    adviceEn = `Single-dose grinder ${grinder.name} features low retention (~${typicalRetentionGrams}g). Recommended purge: ${recommendedPurgeGrams}g.`;
  } else if (retentionClass === 'medium') {
    advicePl = `Młynek elektryczny ${grinder.name} ma umiarkowaną retencję (~${typicalRetentionGrams}g). Przed parzeniem zaleca się przemielić ${recommendedPurgeGrams}g kawy.`;
    adviceEn = `Electric grinder ${grinder.name} has moderate retention (~${typicalRetentionGrams}g). Purging ${recommendedPurgeGrams}g of coffee recommended.`;
  } else {
    advicePl = `Młynek ${grinder.name} zatrzymuje sporo kawy w kanale wylotowym (~${typicalRetentionGrams}g). Wymagany przedmuch (purge): ${recommendedPurgeGrams}g.`;
    adviceEn = `Grinder ${grinder.name} retains significant coffee in chute (~${typicalRetentionGrams}g). Required purge: ${recommendedPurgeGrams}g.`;
  }

  return {
    grinderId: grinder.id,
    grinderName: grinder.name,
    isHandGrinder: isHand,
    retentionClass,
    typicalRetentionGrams,
    recommendedPurgeGrams,
    advicePl,
    adviceEn,
  };
}






export type BurrSeasoningStage = 'raw' | 'breaking_in' | 'seasoned' | 'fully_stabilized';

export interface BurrSeasoningEstimate {
  burrType: 'conical' | 'flat';
  burrDiameterMm: number;
  kilogramsGround: number;
  recommendedSeasoningKg: number;
  progressPercent: number;
  stage: BurrSeasoningStage;
  isSeasoned: boolean;
  statusPl: string;
  statusEn: string;
  impactNotesPl: string;
  impactNotesEn: string;
}

/**
 * Szacuje stopień dotarcia i wygrzania (seasoning) nowych żaren młynka
 * na podstawie geometrii (żarna stożkowe vs płaskie), średnicy oraz łącznej zmielonej masy kawy.
 */
export function estimateBurrSeasoningProgress(
  params?: {
    burrType?: 'conical' | 'flat' | string | null;
    burrDiameterMm?: number | string | null;
    kilogramsGround?: number | string | null;
  } | null
): BurrSeasoningEstimate {
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

  const rawType =
    typeof params?.burrType === 'string' ? params.burrType.trim().toLowerCase() : '';
  const burrType: 'conical' | 'flat' = rawType.includes('flat') ? 'flat' : 'conical';

  const defaultDiameter = burrType === 'flat' ? 64 : 40;
  const burrDiameterMm = Number(
    parseNum(params?.burrDiameterMm, defaultDiameter, 20, 150).toFixed(0)
  );
  const kilogramsGround = Number(parseNum(params?.kilogramsGround, 0, 0, 1000).toFixed(2));

  let recommendedSeasoningKg = 4;
  if (burrType === 'flat') {
    if (burrDiameterMm <= 54) {
      recommendedSeasoningKg = 5;
    } else if (burrDiameterMm <= 64) {
      recommendedSeasoningKg = 8;
    } else if (burrDiameterMm <= 83) {
      recommendedSeasoningKg = 12;
    } else {
      recommendedSeasoningKg = 15;
    }
  } else {
    if (burrDiameterMm <= 38) {
      recommendedSeasoningKg = 3;
    } else if (burrDiameterMm <= 48) {
      recommendedSeasoningKg = 4;
    } else {
      recommendedSeasoningKg = 6;
    }
  }

  const progressPercent = Math.min(
    100,
    Math.round((kilogramsGround / recommendedSeasoningKg) * 100)
  );
  const isSeasoned = progressPercent >= 100;

  let stage: BurrSeasoningStage = 'raw';
  let statusPl = 'Nowe żarna — podwyższona produkcja pyłu (fines) i niestabilny czas ekstrakcji.';
  let statusEn = 'Brand new burrs — elevated fines production and inconsistent flow rate.';
  let impactNotesPl =
    'Zaleca się przemiał taniej kawy lub nieco grubsze mielenie w pierwszych tygodniach.';
  let impactNotesEn =
    'Recommended to grind cheaper beans or dial slightly coarser during first weeks.';

  if (progressPercent >= 100) {
    stage = 'fully_stabilized';
    statusPl =
      'Żarna w pełni wygrzane i ustabilizowane (optymalna powtarzalność i minimalny pył).';
    statusEn =
      'Burrs fully seasoned and stabilized (optimal consistency and minimal fines).';
    impactNotesPl =
      'Żarna osiągnęły pełną dojrzałość geometryczną. Perfekcyjny rozkład cząstek.';
    impactNotesEn = 'Burrs reached full geometric maturity. Perfect particle size distribution.';
  } else if (progressPercent >= 75) {
    stage = 'seasoned';
    statusPl = 'Żarna wygrzane — rozkład cząstek ustabilizowany.';
    statusEn = 'Burrs seasoned — particle distribution stabilized.';
    impactNotesPl =
      'Ekstrakcja jest wysoce powtarzalna; mikroskopijne zadziory zostały wygładzone.';
    impactNotesEn =
      'Extraction is highly repeatable; microscopic burr imperfections smoothed out.';
  } else if (progressPercent >= 25) {
    stage = 'breaking_in';
    statusPl = 'Etap dotarcia żaren — powolna stabilizacja frakcji pyłowej.';
    statusEn = 'Breaking-in stage — gradual fines stabilization.';
    impactNotesPl =
      'Wydajność ekstrakcji rośnie. Nastawy mielenia stają się bardziej przewidywalne.';
    impactNotesEn = 'Extraction yield increasing. Grind settings becoming more predictable.';
  }

  return {
    burrType,
    burrDiameterMm,
    kilogramsGround,
    recommendedSeasoningKg,
    progressPercent,
    stage,
    isSeasoned,
    statusPl,
    statusEn,
    impactNotesPl,
    impactNotesEn,
  };
}


export type GrindUniformityGrade = 'exceptional' | 'good' | 'moderate' | 'broad';

export interface GrindDistributionSpread {
  burrType: 'flat' | 'conical' | 'other';
  targetMicrons: number;
  spreadMicrons: number;
  finesPercent: number;
  bouldersPercent: number;
  uniformityScore: number;
  grade: GrindUniformityGrade;
  summaryPl: string;
  summaryEn: string;
}

export function estimateGrindDistributionSpread(
  params?: {
    burrType?: 'flat' | 'conical' | string | null;
    targetMicrons?: number | string | null;
    rpm?: number | string | null;
  } | null
): GrindDistributionSpread {
  const parseNum = (v: unknown, fallback = 0, min = 0, max = 3000): number => {
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

  const rawType =
    typeof params?.burrType === 'string' ? params.burrType.trim().toLowerCase() : '';
  const burrType: 'flat' | 'conical' | 'other' = rawType.includes('flat')
    ? 'flat'
    : rawType.includes('conical')
    ? 'conical'
    : 'conical';

  const targetMicrons = Number(parseNum(params?.targetMicrons, 750, 100, 2500).toFixed(0));

  let finesPercent = 10;
  let bouldersPercent = 8;
  let spreadMicrons = 400;

  if (burrType === 'flat') {
    if (targetMicrons <= 350) {
      finesPercent = 10;
      bouldersPercent = 3;
      spreadMicrons = 250;
    } else if (targetMicrons <= 900) {
      finesPercent = 7;
      bouldersPercent = 5;
      spreadMicrons = 320;
    } else {
      finesPercent = 8;
      bouldersPercent = 9;
      spreadMicrons = 420;
    }
  } else {
    if (targetMicrons <= 350) {
      finesPercent = 16;
      bouldersPercent = 4;
      spreadMicrons = 380;
    } else if (targetMicrons <= 900) {
      finesPercent = 12;
      bouldersPercent = 8;
      spreadMicrons = 480;
    } else {
      finesPercent = 14;
      bouldersPercent = 12;
      spreadMicrons = 600;
    }
  }

  const baseUniformity = burrType === 'flat' ? 90 : 75;
  const finesPenalty = Math.max(0, (finesPercent - 8) * 1.5);
  const bouldersPenalty = Math.max(0, (bouldersPercent - 6) * 1.2);
  const uniformityScore = Math.max(
    0,
    Math.min(100, Math.round(baseUniformity - finesPenalty - bouldersPenalty))
  );

  let grade: GrindUniformityGrade = 'broad';
  let summaryPl = `Szeroki rozkład cząstek (wynik: ${uniformityScore}/100) — zauważalny pył i cząstki grube.`;
  let summaryEn = `Broad particle distribution (${uniformityScore}/100) — noticeable fines and boulders.`;

  if (uniformityScore >= 85) {
    grade = 'exceptional';
    summaryPl = `Wybitna unimodalność i wąski rozkład cząstek (żarna ${
      burrType === 'flat' ? 'płaskie' : 'stożkowe'
    }, ${targetMicrons} µm).`;
    summaryEn = `Exceptional unimodality and narrow particle spread (${burrType} burrs, ${targetMicrons} µm).`;
  } else if (uniformityScore >= 70) {
    grade = 'good';
    summaryPl = `Dobra powtarzalność i kontrolowana frakcja pyłu (wynik: ${uniformityScore}/100).`;
    summaryEn = `Good particle uniformity with controlled fines (${uniformityScore}/100).`;
  } else if (uniformityScore >= 55) {
    grade = 'moderate';
    summaryPl = `Umiarkowana równomierność — klasyczny rozkład bimodalny.`;
    summaryEn = `Moderate uniformity — classic bimodal distribution.`;
  }

  return {
    burrType,
    targetMicrons,
    spreadMicrons,
    finesPercent,
    bouldersPercent,
    uniformityScore,
    grade,
    summaryPl,
    summaryEn,
  };
}


// ============================================================================
// TASK-P98-08-PRO: Grinder Burr Calibration Engine (Kalibrator punktu zerowego żaren)
// ============================================================================

export type BurrCalibrationStatus = 'aligned' | 'minor_offset' | 'misaligned';

export interface GrinderBurrCalibration {
  currentClick: number;
  effectiveClick: number;
  targetMicrons: number;
  estimatedMicrons: number;
  deltaMicrons: number;
  recommendedClickAdjustment: number;
  recommendedCalibratedClick: number;
  zeroClickOffset: number;
  micronsPerClick: number;
  status: BurrCalibrationStatus;
  summaryPl: string;
  summaryEn: string;
}

export function calculateGrinderBurrCalibration(params?: {
  currentClick?: number | string | null;
  targetMicrons?: number | string | null;
  zeroClickOffset?: number | string | null;
  micronsPerClick?: number | string | null;
}): GrinderBurrCalibration {
  const parseNum = (val: unknown, fallback: number, min: number, max: number): number => {
    if (typeof val === 'number' && Number.isFinite(val) && !Object.is(val, -0)) {
      return Math.max(min, Math.min(max, val));
    }
    if (typeof val === 'string') {
      const normalized = val.trim().replace(',', '.');
      const parsed = parseFloat(normalized);
      if (Number.isFinite(parsed) && !Object.is(parsed, -0)) {
        return Math.max(min, Math.min(max, parsed));
      }
    }
    return fallback;
  };

  const currentClick = Math.round(parseNum(params?.currentClick, 15, 0, 200));
  const targetMicrons = Math.round(parseNum(params?.targetMicrons, 600, 50, 2500));
  const zeroClickOffset = Math.round(parseNum(params?.zeroClickOffset, 0, -50, 50));
  const micronsPerClick = Math.round(parseNum(params?.micronsPerClick, 25, 1, 200) * 10) / 10;

  const effectiveClick = Math.max(0, currentClick - zeroClickOffset);
  const estimatedMicrons = Math.round(effectiveClick * micronsPerClick);
  const deltaMicrons = estimatedMicrons - targetMicrons;

  const recommendedIdealClicks = Math.round(targetMicrons / micronsPerClick);
  const recommendedCalibratedClick = Math.max(0, recommendedIdealClicks + zeroClickOffset);
  const recommendedClickAdjustment = recommendedCalibratedClick - currentClick;

  const absOffset = Math.abs(zeroClickOffset);
  const status: BurrCalibrationStatus =
    absOffset === 0 ? 'aligned' : absOffset <= 2 ? 'minor_offset' : 'misaligned';

  let summaryPl = `Młynek skalibrowany idealnie (punkt zerowy na kliku 0). Realna grubość: ${estimatedMicrons} µm (cel: ${targetMicrons} µm).`;
  let summaryEn = `Grinder perfectly aligned (zero touch at click 0). Actual particle size: ${estimatedMicrons} µm (target: ${targetMicrons} µm).`;

  if (status === 'minor_offset') {
    summaryPl = `Niewielkie przesunięcie punktu zerowego żaren (${zeroClickOffset > 0 ? '+' : ''}${zeroClickOffset} klik). Realna grubość: ${estimatedMicrons} µm. Zalecana nastawa dla ${targetMicrons} µm: klik ${recommendedCalibratedClick}.`;
    summaryEn = `Minor zero-point offset (${zeroClickOffset > 0 ? '+' : ''}${zeroClickOffset} clicks). Actual particle size: ${estimatedMicrons} µm. Recommended setting for ${targetMicrons} µm: click ${recommendedCalibratedClick}.`;
  } else if (status === 'misaligned') {
    summaryPl = `Znaczne przesunięcie żaren (${zeroClickOffset > 0 ? '+' : ''}${zeroClickOffset} klików). Wymagana korekta tarczy kalibracyjnej lub nastawy na klik ${recommendedCalibratedClick}.`;
    summaryEn = `Significant burr misalignment (${zeroClickOffset > 0 ? '+' : ''}${zeroClickOffset} clicks). Recalibrate adjustment dial or set to click ${recommendedCalibratedClick}.`;
  }

  return {
    currentClick,
    effectiveClick,
    targetMicrons,
    estimatedMicrons,
    deltaMicrons,
    recommendedClickAdjustment,
    recommendedCalibratedClick,
    zeroClickOffset,
    micronsPerClick,
    status,
    summaryPl,
    summaryEn,
  };
}
