// ============================================================================
// Napar (Steepwise) — Knowledge Base / Kompendium Terroir, Odmian i Tradycji
// (BR-WIEDZA-001 & BR-WIEDZA-002)
// Specialty Coffee Varieties, Processing, Origins & Artisan Tea Classification
// All sensory descriptions externalized into i18n catalog (TASK-R09-02)
// ============================================================================

import { KNOWLEDGE_LOCALES, KnowledgeLocaleEntry } from './knowledge-locales';

function getLocale(id: string): KnowledgeLocaleEntry {
  const loc = KNOWLEDGE_LOCALES[id];
  if (!loc) throw new Error(`Missing knowledge locale entry for ${id}`);
  return loc;
}

export interface CoffeeVarietyInfo {
  id: string;
  name: string;
  nativeRegion: string;
  geneticLineage: string;
  sensoryProfilePl: string;
  sensoryProfileEn: string;
  cupCharacteristics: {
    acidity: 'Niska' | 'Średnia' | 'Wysoka' | 'Wybitna / Cytrusowa' | 'Fosforowa / Soczysta';
    body: 'Lekkie / Herbaciane' | 'Średnie / Jedwabiste' | 'Pełne / Kremowe' | 'Syropowate';
    sweetness: 'Wysoka' | 'Bardzo wysoka' | 'Zbalansowana' | 'Cukierkowa / Miodowa';
  };
  keyNotesPl: string[];
  keyNotesEn: string[];
  recommendedRoast: 'Jasne (Filter)' | 'Jasne / Omniroast' | 'Średnie (Espresso)';
  descriptionPl: string;
  descriptionEn: string;
}

export interface CoffeeProcessInfo {
  id: string;
  name: string;
  processType: 'WASHED' | 'NATURAL' | 'HONEY' | 'ANAEROBIC' | 'CARBONIC_MACERATION' | 'WET_HULLED';
  sensoryImpactPl: string;
  sensoryImpactEn: string;
  dryingDurationDays: string;
  waterConsumption: 'Wysokie' | 'Umiarkowane' | 'Zerowe' | 'Brak (maceracja w tanku)';
  keyNotesPl: string[];
  keyNotesEn: string[];
  descriptionPl: string;
  descriptionEn: string;
}

export interface CoffeeOriginInfo {
  id: string;
  country: string;
  countryEn?: string;
  countryCode: string;
  primaryRegions: string[];
  typicalAltitudeMeters: string;
  harvestMonths: string;
  mainVarieties: string[];
  flavorProfilePl: string;
  flavorProfileEn: string;
  keyNotesPl: string[];
  keyNotesEn: string[];
  descriptionPl: string;
  descriptionEn: string;
}

export interface TeaCategoryInfo {
  id: string;
  namePl: string;
  nameEn: string;
  traditionalName: string;
  oxidationRangePercent: string;
  killGreenMethod: string;
  waterTemperatureCelsius: number;
  sensoryProfilePl: string;
  sensoryProfileEn: string;
  famousVarietiesPl: string[];
  famousVarietiesEn: string[];
  famousRegions: string[];
  healthAttributesPl: string;
  descriptionPl: string;
  descriptionEn: string;
}

export const COFFEE_VARIETIES: CoffeeVarietyInfo[] = [
  {
    id: 'variety-geisha',
    name: 'Geisha (Gesha)',
    nativeRegion: 'Gori Gesha (Etiopia) / Boquete (Panama)',
    geneticLineage: 'Dzikie populacje endemiczne z lasu Gori Gesha',
    sensoryProfilePl: getLocale('variety-geisha').sensoryProfilePl!,
    sensoryProfileEn: getLocale('variety-geisha').sensoryProfileEn!,
    cupCharacteristics: {
      "acidity": "Wybitna / Cytrusowa",
      "body": "Lekkie / Herbaciane",
      "sweetness": "Bardzo wysoka"
},
    keyNotesPl: getLocale('variety-geisha').keyNotesPl!,
    keyNotesEn: getLocale('variety-geisha').keyNotesEn!,
    recommendedRoast: 'Jasne (Filter)',
    descriptionPl: getLocale('variety-geisha').descriptionPl,
    descriptionEn: getLocale('variety-geisha').descriptionEn,
  },
  {
    id: 'variety-sl28-sl34',
    name: 'SL28 & SL34',
    nativeRegion: 'Scott Agricultural Laboratories (Kenia)',
    geneticLineage: 'Selekcja szczepów Bourbon / Tanganyika drought-resistant z lat 1935–1939',
    sensoryProfilePl: getLocale('variety-sl28-sl34').sensoryProfilePl!,
    sensoryProfileEn: getLocale('variety-sl28-sl34').sensoryProfileEn!,
    cupCharacteristics: {
      "acidity": "Fosforowa / Soczysta",
      "body": "Średnie / Jedwabiste",
      "sweetness": "Wysoka"
},
    keyNotesPl: getLocale('variety-sl28-sl34').keyNotesPl!,
    keyNotesEn: getLocale('variety-sl28-sl34').keyNotesEn!,
    recommendedRoast: 'Jasne (Filter)',
    descriptionPl: getLocale('variety-sl28-sl34').descriptionPl,
    descriptionEn: getLocale('variety-sl28-sl34').descriptionEn,
  },
  {
    id: 'variety-pink-bourbon',
    name: 'Pink Bourbon (Różowy Bourbon)',
    nativeRegion: 'Huila (Kolumbia)',
    geneticLineage: 'Naturalna hybryda szczepów etiopskich landraces zidentyfikowana w San Adolfo',
    sensoryProfilePl: getLocale('variety-pink-bourbon').sensoryProfilePl!,
    sensoryProfileEn: getLocale('variety-pink-bourbon').sensoryProfileEn!,
    cupCharacteristics: {
      "acidity": "Wybitna / Cytrusowa",
      "body": "Średnie / Jedwabiste",
      "sweetness": "Cukierkowa / Miodowa"
},
    keyNotesPl: getLocale('variety-pink-bourbon').keyNotesPl!,
    keyNotesEn: getLocale('variety-pink-bourbon').keyNotesEn!,
    recommendedRoast: 'Jasne (Filter)',
    descriptionPl: getLocale('variety-pink-bourbon').descriptionPl,
    descriptionEn: getLocale('variety-pink-bourbon').descriptionEn,
  },
  {
    id: 'variety-ethiopian-landraces',
    name: 'Ethiopian Heirloom / Landraces',
    nativeRegion: 'Yirgacheffe, Guji, Sidama (Etiopia)',
    geneticLineage: 'Dziko rosnące odmiany endemiczne pierwotnych lasów deszczowych Etiopii',
    sensoryProfilePl: getLocale('variety-ethiopian-landraces').sensoryProfilePl!,
    sensoryProfileEn: getLocale('variety-ethiopian-landraces').sensoryProfileEn!,
    cupCharacteristics: {
      "acidity": "Wybitna / Cytrusowa",
      "body": "Lekkie / Herbaciane",
      "sweetness": "Wysoka"
},
    keyNotesPl: getLocale('variety-ethiopian-landraces').keyNotesPl!,
    keyNotesEn: getLocale('variety-ethiopian-landraces').keyNotesEn!,
    recommendedRoast: 'Jasne (Filter)',
    descriptionPl: getLocale('variety-ethiopian-landraces').descriptionPl,
    descriptionEn: getLocale('variety-ethiopian-landraces').descriptionEn,
  },
  {
    id: 'variety-bourbon',
    name: 'Bourbon (Red, Yellow, Orange)',
    nativeRegion: 'Wyspa Reunion (dawniej Île Bourbon)',
    geneticLineage: 'Naturalna mutacja Typiki wyselekcjonowana przez francuskich misjonarzy',
    sensoryProfilePl: getLocale('variety-bourbon').sensoryProfilePl!,
    sensoryProfileEn: getLocale('variety-bourbon').sensoryProfileEn!,
    cupCharacteristics: {
      "acidity": "Średnia",
      "body": "Pełne / Kremowe",
      "sweetness": "Bardzo wysoka"
},
    keyNotesPl: getLocale('variety-bourbon').keyNotesPl!,
    keyNotesEn: getLocale('variety-bourbon').keyNotesEn!,
    recommendedRoast: 'Jasne / Omniroast',
    descriptionPl: getLocale('variety-bourbon').descriptionPl,
    descriptionEn: getLocale('variety-bourbon').descriptionEn,
  },
  {
    id: 'variety-typica',
    name: 'Typica',
    nativeRegion: 'Jemen / Ameryka Łacińska',
    geneticLineage: 'Prapoczątek większości współczesnych odmian Arabiki (Coffea arabica var. typica)',
    sensoryProfilePl: getLocale('variety-typica').sensoryProfilePl!,
    sensoryProfileEn: getLocale('variety-typica').sensoryProfileEn!,
    cupCharacteristics: {
      "acidity": "Średnia",
      "body": "Średnie / Jedwabiste",
      "sweetness": "Zbalansowana"
},
    keyNotesPl: getLocale('variety-typica').keyNotesPl!,
    keyNotesEn: getLocale('variety-typica').keyNotesEn!,
    recommendedRoast: 'Jasne / Omniroast',
    descriptionPl: getLocale('variety-typica').descriptionPl,
    descriptionEn: getLocale('variety-typica').descriptionEn,
  },
  {
    id: 'variety-caturra-catuai',
    name: 'Caturra & Catuai',
    nativeRegion: 'Brazylia / Kostaryka',
    geneticLineage: 'Caturra: karłowata mutacja Bourbona; Catuai: krzyżówka Caturra x Mundo Novo',
    sensoryProfilePl: getLocale('variety-caturra-catuai').sensoryProfilePl!,
    sensoryProfileEn: getLocale('variety-caturra-catuai').sensoryProfileEn!,
    cupCharacteristics: {
      "acidity": "Średnia",
      "body": "Średnie / Jedwabiste",
      "sweetness": "Zbalansowana"
},
    keyNotesPl: getLocale('variety-caturra-catuai').keyNotesPl!,
    keyNotesEn: getLocale('variety-caturra-catuai').keyNotesEn!,
    recommendedRoast: 'Jasne / Omniroast',
    descriptionPl: getLocale('variety-caturra-catuai').descriptionPl,
    descriptionEn: getLocale('variety-caturra-catuai').descriptionEn,
  },
  {
    id: 'variety-pacamara-maragogype',
    name: 'Pacamara & Maragogype',
    nativeRegion: 'Salwador / Brazylia',
    geneticLineage: 'Maragogype: olbrzymia mutacja Typiki; Pacamara: krzyżówka Pacas x Maragogype',
    sensoryProfilePl: getLocale('variety-pacamara-maragogype').sensoryProfilePl!,
    sensoryProfileEn: getLocale('variety-pacamara-maragogype').sensoryProfileEn!,
    cupCharacteristics: {
      "acidity": "Średnia",
      "body": "Syropowate",
      "sweetness": "Wysoka"
},
    keyNotesPl: getLocale('variety-pacamara-maragogype').keyNotesPl!,
    keyNotesEn: getLocale('variety-pacamara-maragogype').keyNotesEn!,
    recommendedRoast: 'Jasne (Filter)',
    descriptionPl: getLocale('variety-pacamara-maragogype').descriptionPl,
    descriptionEn: getLocale('variety-pacamara-maragogype').descriptionEn,
  },
  {
    id: 'variety-castillo-colombia',
    name: 'Castillo & Colombia',
    nativeRegion: 'Cenicafé (Kolumbia)',
    geneticLineage: 'Hybryda Caturra x Híbrido de Timor (odporność na rdzę liściową Roya)',
    sensoryProfilePl: getLocale('variety-castillo-colombia').sensoryProfilePl!,
    sensoryProfileEn: getLocale('variety-castillo-colombia').sensoryProfileEn!,
    cupCharacteristics: {
      "acidity": "Średnia",
      "body": "Pełne / Kremowe",
      "sweetness": "Zbalansowana"
},
    keyNotesPl: getLocale('variety-castillo-colombia').keyNotesPl!,
    keyNotesEn: getLocale('variety-castillo-colombia').keyNotesEn!,
    recommendedRoast: 'Jasne / Omniroast',
    descriptionPl: getLocale('variety-castillo-colombia').descriptionPl,
    descriptionEn: getLocale('variety-castillo-colombia').descriptionEn,
  },
  {
    id: 'variety-eugenioides',
    name: 'Coffea Eugenioides',
    nativeRegion: 'Góry Afryki Wschodniej (Kenia, Uganda, Rwanda)',
    geneticLineage: 'Dziki rodzic botaniczny Coffea Arabica (Arabica = Eugenioides x Canephora)',
    sensoryProfilePl: getLocale('variety-eugenioides').sensoryProfilePl!,
    sensoryProfileEn: getLocale('variety-eugenioides').sensoryProfileEn!,
    cupCharacteristics: {
      "acidity": "Niska",
      "body": "Lekkie / Herbaciane",
      "sweetness": "Cukierkowa / Miodowa"
},
    keyNotesPl: getLocale('variety-eugenioides').keyNotesPl!,
    keyNotesEn: getLocale('variety-eugenioides').keyNotesEn!,
    recommendedRoast: 'Jasne (Filter)',
    descriptionPl: getLocale('variety-eugenioides').descriptionPl,
    descriptionEn: getLocale('variety-eugenioides').descriptionEn,
  },
];

export const COFFEE_PROCESSES: CoffeeProcessInfo[] = [
  {
    id: 'process-washed',
    name: 'Washed (Mokra / Myta)',
    processType: 'WASHED',
    sensoryImpactPl: getLocale('process-washed').sensoryImpactPl!,
    sensoryImpactEn: getLocale('process-washed').sensoryImpactEn!,
    dryingDurationDays: '8–14 dni na stołach afrykańskich',
    waterConsumption: 'Wysokie',
    keyNotesPl: getLocale('process-washed').keyNotesPl!,
    keyNotesEn: getLocale('process-washed').keyNotesEn!,
    descriptionPl: getLocale('process-washed').descriptionPl,
    descriptionEn: getLocale('process-washed').descriptionEn,
  },
  {
    id: 'process-natural',
    name: 'Natural (Sucha / Tradycyjna)',
    processType: 'NATURAL',
    sensoryImpactPl: getLocale('process-natural').sensoryImpactPl!,
    sensoryImpactEn: getLocale('process-natural').sensoryImpactEn!,
    dryingDurationDays: '18–30 dni suszenia w całości',
    waterConsumption: 'Zerowe',
    keyNotesPl: getLocale('process-natural').keyNotesPl!,
    keyNotesEn: getLocale('process-natural').keyNotesEn!,
    descriptionPl: getLocale('process-natural').descriptionPl,
    descriptionEn: getLocale('process-natural').descriptionEn,
  },
  {
    id: 'process-honey',
    name: 'Honey (Yellow, Red, Black Honey)',
    processType: 'HONEY',
    sensoryImpactPl: getLocale('process-honey').sensoryImpactPl!,
    sensoryImpactEn: getLocale('process-honey').sensoryImpactEn!,
    dryingDurationDays: '12–25 dni w zależności od grubości śluzu',
    waterConsumption: 'Umiarkowane',
    keyNotesPl: getLocale('process-honey').keyNotesPl!,
    keyNotesEn: getLocale('process-honey').keyNotesEn!,
    descriptionPl: getLocale('process-honey').descriptionPl,
    descriptionEn: getLocale('process-honey').descriptionEn,
  },
  {
    id: 'process-anaerobic',
    name: 'Anaerobic (Beztlenowa w tankach)',
    processType: 'ANAEROBIC',
    sensoryImpactPl: getLocale('process-anaerobic').sensoryImpactPl!,
    sensoryImpactEn: getLocale('process-anaerobic').sensoryImpactEn!,
    dryingDurationDays: '48–120h w tanku + 15–20 dni suszenia',
    waterConsumption: 'Brak (maceracja w tanku)',
    keyNotesPl: getLocale('process-anaerobic').keyNotesPl!,
    keyNotesEn: getLocale('process-anaerobic').keyNotesEn!,
    descriptionPl: getLocale('process-anaerobic').descriptionPl,
    descriptionEn: getLocale('process-anaerobic').descriptionEn,
  },
  {
    id: 'process-carbonic-maceration',
    name: 'Carbonic Maceration (Maceracja Węglowa)',
    processType: 'CARBONIC_MACERATION',
    sensoryImpactPl: getLocale('process-carbonic-maceration').sensoryImpactPl!,
    sensoryImpactEn: getLocale('process-carbonic-maceration').sensoryImpactEn!,
    dryingDurationDays: '60–100h w CO2 + 20 dni suszenia',
    waterConsumption: 'Brak (maceracja w tanku)',
    keyNotesPl: getLocale('process-carbonic-maceration').keyNotesPl!,
    keyNotesEn: getLocale('process-carbonic-maceration').keyNotesEn!,
    descriptionPl: getLocale('process-carbonic-maceration').descriptionPl,
    descriptionEn: getLocale('process-carbonic-maceration').descriptionEn,
  },
  {
    id: 'process-wet-hulled',
    name: 'Wet-Hulled (Giling Basah - Sumatra)',
    processType: 'WET_HULLED',
    sensoryImpactPl: getLocale('process-wet-hulled').sensoryImpactPl!,
    sensoryImpactEn: getLocale('process-wet-hulled').sensoryImpactEn!,
    dryingDurationDays: 'Szybkie łuskanie przy wilgotności 30–35%',
    waterConsumption: 'Wysokie',
    keyNotesPl: getLocale('process-wet-hulled').keyNotesPl!,
    keyNotesEn: getLocale('process-wet-hulled').keyNotesEn!,
    descriptionPl: getLocale('process-wet-hulled').descriptionPl,
    descriptionEn: getLocale('process-wet-hulled').descriptionEn,
  },
];

export const COFFEE_ORIGINS: CoffeeOriginInfo[] = [
  {
    id: 'origin-ethiopia',
    country: 'Etiopia',
    countryEn: 'Ethiopia',
    countryCode: 'ET',
    primaryRegions: ["Yirgacheffe","Guji","Sidama","Harrar","Jimma"],
    typicalAltitudeMeters: '1800 – 2200 m n.p.m.',
    harvestMonths: 'Listopad – Luty',
    mainVarieties: ["Kurume","Dega","Wolisho","Heirloom Landraces"],
    flavorProfilePl: getLocale('origin-ethiopia').flavorProfilePl!,
    flavorProfileEn: getLocale('origin-ethiopia').flavorProfileEn!,
    keyNotesPl: getLocale('origin-ethiopia').keyNotesPl!,
    keyNotesEn: getLocale('origin-ethiopia').keyNotesEn!,
    descriptionPl: getLocale('origin-ethiopia').descriptionPl,
    descriptionEn: getLocale('origin-ethiopia').descriptionEn,
  },
  {
    id: 'origin-kenya',
    country: 'Kenia',
    countryEn: 'Kenya',
    countryCode: 'KE',
    primaryRegions: ["Nyeri","Kirinyaga","Murang’a","Kiambu","Embu"],
    typicalAltitudeMeters: '1600 – 2100 m n.p.m.',
    harvestMonths: 'Październik – Grudzień (główny), Czerwiec – Lipiec (fly crop)',
    mainVarieties: ["SL28","SL34","Ruiru 11","Batian"],
    flavorProfilePl: getLocale('origin-kenya').flavorProfilePl!,
    flavorProfileEn: getLocale('origin-kenya').flavorProfileEn!,
    keyNotesPl: getLocale('origin-kenya').keyNotesPl!,
    keyNotesEn: getLocale('origin-kenya').keyNotesEn!,
    descriptionPl: getLocale('origin-kenya').descriptionPl,
    descriptionEn: getLocale('origin-kenya').descriptionEn,
  },
  {
    id: 'origin-colombia',
    country: 'Kolumbia',
    countryEn: 'Colombia',
    countryCode: 'CO',
    primaryRegions: ["Huila","Nariño","Antioquia","Tolima","Cauca"],
    typicalAltitudeMeters: '1400 – 2100 m n.p.m.',
    harvestMonths: 'Zbiory przez cały rok dzięki zróżnicowanym mikroklimatom andyjskim',
    mainVarieties: ["Castillo","Caturra","Pink Bourbon","Colombia","Geisha"],
    flavorProfilePl: getLocale('origin-colombia').flavorProfilePl!,
    flavorProfileEn: getLocale('origin-colombia').flavorProfileEn!,
    keyNotesPl: getLocale('origin-colombia').keyNotesPl!,
    keyNotesEn: getLocale('origin-colombia').keyNotesEn!,
    descriptionPl: getLocale('origin-colombia').descriptionPl,
    descriptionEn: getLocale('origin-colombia').descriptionEn,
  },
  {
    id: 'origin-guatemala',
    country: 'Gwatemala',
    countryEn: 'Guatemala',
    countryCode: 'GT',
    primaryRegions: ["Antigua","Huehuetenango","Cobán","Fraijanes","Atitlán"],
    typicalAltitudeMeters: '1500 – 2000 m n.p.m.',
    harvestMonths: 'Grudzień – Kwiecień',
    mainVarieties: ["Bourbon","Caturra","Typica","Maragogype","Pacamara"],
    flavorProfilePl: getLocale('origin-guatemala').flavorProfilePl!,
    flavorProfileEn: getLocale('origin-guatemala').flavorProfileEn!,
    keyNotesPl: getLocale('origin-guatemala').keyNotesPl!,
    keyNotesEn: getLocale('origin-guatemala').keyNotesEn!,
    descriptionPl: getLocale('origin-guatemala').descriptionPl,
    descriptionEn: getLocale('origin-guatemala').descriptionEn,
  },
  {
    id: 'origin-costa-rica',
    country: 'Kostaryka',
    countryEn: 'Costa Rica',
    countryCode: 'CR',
    primaryRegions: ["Tarrazú","West Valley","Central Valley","Brunca"],
    typicalAltitudeMeters: '1200 – 1900 m n.p.m.',
    harvestMonths: 'Grudzień – Marzec',
    mainVarieties: ["Caturra","Catuai","Villa Sarchi","SL28","Geisha"],
    flavorProfilePl: getLocale('origin-costa-rica').flavorProfilePl!,
    flavorProfileEn: getLocale('origin-costa-rica').flavorProfileEn!,
    keyNotesPl: getLocale('origin-costa-rica').keyNotesPl!,
    keyNotesEn: getLocale('origin-costa-rica').keyNotesEn!,
    descriptionPl: getLocale('origin-costa-rica').descriptionPl,
    descriptionEn: getLocale('origin-costa-rica').descriptionEn,
  },
  {
    id: 'origin-brazil',
    country: 'Brazylia',
    countryEn: 'Brazil',
    countryCode: 'BR',
    primaryRegions: ["Sul de Minas","Cerrado Mineiro","Mogiana","Espírito Santo"],
    typicalAltitudeMeters: '800 – 1350 m n.p.m.',
    harvestMonths: 'Maj – Wrzesień',
    mainVarieties: ["Yellow Bourbon","Mundo Novo","Catucai","Catuai"],
    flavorProfilePl: getLocale('origin-brazil').flavorProfilePl!,
    flavorProfileEn: getLocale('origin-brazil').flavorProfileEn!,
    keyNotesPl: getLocale('origin-brazil').keyNotesPl!,
    keyNotesEn: getLocale('origin-brazil').keyNotesEn!,
    descriptionPl: getLocale('origin-brazil').descriptionPl,
    descriptionEn: getLocale('origin-brazil').descriptionEn,
  },
  {
    id: 'origin-panama',
    country: 'Panama',
    countryEn: 'Panama',
    countryCode: 'PA',
    primaryRegions: ["Boquete","Volcán","Renacimiento"],
    typicalAltitudeMeters: '1400 – 2000 m n.p.m.',
    harvestMonths: 'Grudzień – Marzec',
    mainVarieties: ["Geisha (Gesha)","Typica","Pacamara","Catuai"],
    flavorProfilePl: getLocale('origin-panama').flavorProfilePl!,
    flavorProfileEn: getLocale('origin-panama').flavorProfileEn!,
    keyNotesPl: getLocale('origin-panama').keyNotesPl!,
    keyNotesEn: getLocale('origin-panama').keyNotesEn!,
    descriptionPl: getLocale('origin-panama').descriptionPl,
    descriptionEn: getLocale('origin-panama').descriptionEn,
  },
];

export const TEA_CATEGORIES: TeaCategoryInfo[] = [
  {
    id: 'tea-white',
    namePl: getLocale('tea-white').namePl!,
    nameEn: getLocale('tea-white').nameEn!,
    traditionalName: '白茶 (Bái Chá)',
    oxidationRangePercent: '5% – 10% (minimalna naturalna)',
    killGreenMethod: 'Brak Sha Qing (tylko powolne więdnięcie i suszenie na słońcu)',
    waterTemperatureCelsius: 80,
    sensoryProfilePl: getLocale('tea-white').sensoryProfilePl!,
    sensoryProfileEn: getLocale('tea-white').sensoryProfileEn!,
    famousVarietiesPl: getLocale('tea-white').famousVarietiesPl!,
    famousVarietiesEn: getLocale('tea-white').famousVarietiesEn || [],
    famousRegions: ["Fuding (Fujian, Chiny)","Zhenghe (Fujian, Chiny)"],
    healthAttributesPl: getLocale('tea-white').healthAttributesPl!,
    descriptionPl: getLocale('tea-white').descriptionPl,
    descriptionEn: getLocale('tea-white').descriptionEn,
  },
  {
    id: 'tea-green',
    namePl: getLocale('tea-green').namePl!,
    nameEn: getLocale('tea-green').nameEn!,
    traditionalName: '绿茶 (Lǜ Chá) / 緑茶 (Ryokucha)',
    oxidationRangePercent: '0% (całkowity brak oksydacji)',
    killGreenMethod: 'Parowanie parą wodną (Japonia: Sencha/Gyokuro) lub prażenie w woku Sha Qing (Chiny: Long Jing)',
    waterTemperatureCelsius: 75,
    sensoryProfilePl: getLocale('tea-green').sensoryProfilePl!,
    sensoryProfileEn: getLocale('tea-green').sensoryProfileEn!,
    famousVarietiesPl: getLocale('tea-green').famousVarietiesPl!,
    famousVarietiesEn: getLocale('tea-green').famousVarietiesEn || [],
    famousRegions: ["Hangzhou (Zhejiang, Chiny)","Uji (Kioto, Japonia)","Shizuoka (Japonia)"],
    healthAttributesPl: getLocale('tea-green').healthAttributesPl!,
    descriptionPl: getLocale('tea-green').descriptionPl,
    descriptionEn: getLocale('tea-green').descriptionEn,
  },
  {
    id: 'tea-yellow',
    namePl: getLocale('tea-yellow').namePl!,
    nameEn: getLocale('tea-yellow').nameEn!,
    traditionalName: '黄茶 (Huáng Chá)',
    oxidationRangePercent: '10% – 20% (mikro-fermentacja Men Huang)',
    killGreenMethod: 'Wok z fazą dusznego zawijania pod wilgotnym płótnem (Men Huang / Sealing Yellow)',
    waterTemperatureCelsius: 85,
    sensoryProfilePl: getLocale('tea-yellow').sensoryProfilePl!,
    sensoryProfileEn: getLocale('tea-yellow').sensoryProfileEn!,
    famousVarietiesPl: getLocale('tea-yellow').famousVarietiesPl!,
    famousVarietiesEn: getLocale('tea-yellow').famousVarietiesEn || [],
    famousRegions: ["Jezioro Dongting (Hunan, Chiny)","Góra Mengding (Syczuan, Chiny)","Huo Shan (Anhui, Chiny)"],
    healthAttributesPl: getLocale('tea-yellow').healthAttributesPl!,
    descriptionPl: getLocale('tea-yellow').descriptionPl,
    descriptionEn: getLocale('tea-yellow').descriptionEn,
  },
  {
    id: 'tea-oolong',
    namePl: getLocale('tea-oolong').namePl!,
    nameEn: getLocale('tea-oolong').nameEn!,
    traditionalName: '乌龙茶 (Wūlóng Chá - Czarny Smok)',
    oxidationRangePercent: '15% – 70% (częściowo oksydowana)',
    killGreenMethod: 'Wytrząsanie na bambusowych sitach (Zuo Qing) + prażenie w piecach węglowych',
    waterTemperatureCelsius: 95,
    sensoryProfilePl: getLocale('tea-oolong').sensoryProfilePl!,
    sensoryProfileEn: getLocale('tea-oolong').sensoryProfileEn!,
    famousVarietiesPl: getLocale('tea-oolong').famousVarietiesPl!,
    famousVarietiesEn: getLocale('tea-oolong').famousVarietiesEn || [],
    famousRegions: ["Wuyi Shan (Fujian, Chiny)","Anxi (Fujian, Chiny)","Fenghuang Shan (Guangdong, Chiny)","Nantou (Tajwan)"],
    healthAttributesPl: getLocale('tea-oolong').healthAttributesPl!,
    descriptionPl: getLocale('tea-oolong').descriptionPl,
    descriptionEn: getLocale('tea-oolong').descriptionEn,
  },
  {
    id: 'tea-black',
    namePl: getLocale('tea-black').namePl!,
    nameEn: getLocale('tea-black').nameEn!,
    traditionalName: '红茶 (Hóng Chá - Czerwona Herbata)',
    oxidationRangePercent: '100% (pełna oksydacja enzymatyczna)',
    killGreenMethod: 'Pełne rolowanie i wielogodzinna oksydacja w wilgotnym powietrzu, następnie suszenie',
    waterTemperatureCelsius: 98,
    sensoryProfilePl: getLocale('tea-black').sensoryProfilePl!,
    sensoryProfileEn: getLocale('tea-black').sensoryProfileEn!,
    famousVarietiesPl: getLocale('tea-black').famousVarietiesPl!,
    famousVarietiesEn: getLocale('tea-black').famousVarietiesEn || [],
    famousRegions: ["Wuyi Shan (Fujian, Chiny)","Qimen (Anhui, Chiny)","Dianxi (Yunnan, Chiny)","Darjeeling & Assam (Indie)"],
    healthAttributesPl: getLocale('tea-black').healthAttributesPl!,
    descriptionPl: getLocale('tea-black').descriptionPl,
    descriptionEn: getLocale('tea-black').descriptionEn,
  },
  {
    id: 'tea-puerh',
    namePl: getLocale('tea-puerh').namePl!,
    nameEn: getLocale('tea-puerh').nameEn!,
    traditionalName: '黑茶 (Hēichá) / 普洱茶 (Pǔ’ěr Chá)',
    oxidationRangePercent: 'Post-fermentacja mikrobiologiczna (od miesięcy do dziesięcioleci)',
    killGreenMethod: 'Sha Qing w słońcu (Maocha) + dojrzewanie naturalne (Sheng) lub stosowe Wo Dui (Shou)',
    waterTemperatureCelsius: 98,
    sensoryProfilePl: getLocale('tea-puerh').sensoryProfilePl!,
    sensoryProfileEn: getLocale('tea-puerh').sensoryProfileEn!,
    famousVarietiesPl: getLocale('tea-puerh').famousVarietiesPl!,
    famousVarietiesEn: getLocale('tea-puerh').famousVarietiesEn || [],
    famousRegions: ["Xishuangbanna (Yunnan, Chiny)","Pu’er (Yunnan, Chiny)","Lincang (Yunnan, Chiny)","Anhua (Hunan, Chiny)"],
    healthAttributesPl: getLocale('tea-puerh').healthAttributesPl!,
    descriptionPl: getLocale('tea-puerh').descriptionPl,
    descriptionEn: getLocale('tea-puerh').descriptionEn,
  },
];

export function searchCoffeeVarieties(query: string): CoffeeVarietyInfo[] {
  if (!query || typeof query !== 'string' || !query.trim()) return COFFEE_VARIETIES;
  const q = query.toLowerCase().trim();
  return COFFEE_VARIETIES.filter((v) =>
    (v.id && typeof v.id === 'string' && v.id.toLowerCase().includes(q)) ||
    (v.name && typeof v.name === 'string' && v.name.toLowerCase().includes(q)) ||
    (v.nativeRegion && typeof v.nativeRegion === 'string' && v.nativeRegion.toLowerCase().includes(q)) ||
    (v.geneticLineage && typeof v.geneticLineage === 'string' && v.geneticLineage.toLowerCase().includes(q)) ||
    (v.recommendedRoast && typeof v.recommendedRoast === 'string' && v.recommendedRoast.toLowerCase().includes(q)) ||
    (v.cupCharacteristics && (
      (v.cupCharacteristics.acidity && typeof v.cupCharacteristics.acidity === 'string' && v.cupCharacteristics.acidity.toLowerCase().includes(q)) ||
      (v.cupCharacteristics.body && typeof v.cupCharacteristics.body === 'string' && v.cupCharacteristics.body.toLowerCase().includes(q)) ||
      (v.cupCharacteristics.sweetness && typeof v.cupCharacteristics.sweetness === 'string' && v.cupCharacteristics.sweetness.toLowerCase().includes(q))
    )) ||
    (Array.isArray(v.keyNotesPl) && v.keyNotesPl.some((k) => typeof k === 'string' && k.toLowerCase().includes(q))) ||
    (Array.isArray(v.keyNotesEn) && v.keyNotesEn.some((k) => typeof k === 'string' && k.toLowerCase().includes(q))) ||
    (v.sensoryProfilePl && typeof v.sensoryProfilePl === 'string' && v.sensoryProfilePl.toLowerCase().includes(q)) ||
    (v.sensoryProfileEn && typeof v.sensoryProfileEn === 'string' && v.sensoryProfileEn.toLowerCase().includes(q)) ||
    (v.descriptionPl && typeof v.descriptionPl === 'string' && v.descriptionPl.toLowerCase().includes(q)) ||
    (v.descriptionEn && typeof v.descriptionEn === 'string' && v.descriptionEn.toLowerCase().includes(q))
  );
}

export function searchCoffeeProcesses(query: string): CoffeeProcessInfo[] {
  if (!query || typeof query !== 'string' || !query.trim()) return COFFEE_PROCESSES;
  const q = query.toLowerCase().trim();
  return COFFEE_PROCESSES.filter((p) =>
    (p.id && typeof p.id === 'string' && p.id.toLowerCase().includes(q)) ||
    (p.name && typeof p.name === 'string' && p.name.toLowerCase().includes(q)) ||
    (p.processType && typeof p.processType === 'string' && p.processType.toLowerCase().includes(q)) ||
    (Array.isArray(p.keyNotesPl) && p.keyNotesPl.some((k) => typeof k === 'string' && k.toLowerCase().includes(q))) ||
    (Array.isArray(p.keyNotesEn) && p.keyNotesEn.some((k) => typeof k === 'string' && k.toLowerCase().includes(q))) ||
    (p.dryingDurationDays && typeof p.dryingDurationDays === 'string' && p.dryingDurationDays.toLowerCase().includes(q)) ||
    (p.waterConsumption && typeof p.waterConsumption === 'string' && p.waterConsumption.toLowerCase().includes(q)) ||
    (p.sensoryImpactPl && typeof p.sensoryImpactPl === 'string' && p.sensoryImpactPl.toLowerCase().includes(q)) ||
    (p.sensoryImpactEn && typeof p.sensoryImpactEn === 'string' && p.sensoryImpactEn.toLowerCase().includes(q)) ||
    (p.descriptionPl && typeof p.descriptionPl === 'string' && p.descriptionPl.toLowerCase().includes(q)) ||
    (p.descriptionEn && typeof p.descriptionEn === 'string' && p.descriptionEn.toLowerCase().includes(q))
  );
}

export function searchCoffeeOrigins(query: string): CoffeeOriginInfo[] {
  if (!query || typeof query !== 'string' || !query.trim()) return COFFEE_ORIGINS;
  const q = query.toLowerCase().trim();
  return COFFEE_ORIGINS.filter((o) =>
    (o.id && typeof o.id === 'string' && o.id.toLowerCase().includes(q)) ||
    (o.country && typeof o.country === 'string' && o.country.toLowerCase().includes(q)) ||
    (o.countryEn && typeof o.countryEn === 'string' && o.countryEn.toLowerCase().includes(q)) ||
    (o.countryCode && typeof o.countryCode === 'string' && o.countryCode.toLowerCase().includes(q)) ||
    (o.typicalAltitudeMeters && typeof o.typicalAltitudeMeters === 'string' && o.typicalAltitudeMeters.toLowerCase().includes(q)) ||
    (o.harvestMonths && typeof o.harvestMonths === 'string' && o.harvestMonths.toLowerCase().includes(q)) ||
    (Array.isArray(o.primaryRegions) && o.primaryRegions.some((r) => typeof r === 'string' && r.toLowerCase().includes(q))) ||
    (Array.isArray(o.mainVarieties) && o.mainVarieties.some((v) => typeof v === 'string' && v.toLowerCase().includes(q))) ||
    (o.flavorProfilePl && typeof o.flavorProfilePl === 'string' && o.flavorProfilePl.toLowerCase().includes(q)) ||
    (o.flavorProfileEn && typeof o.flavorProfileEn === 'string' && o.flavorProfileEn.toLowerCase().includes(q)) ||
    (Array.isArray(o.keyNotesPl) && o.keyNotesPl.some((k) => typeof k === "string" && k.toLowerCase().includes(q))) ||
    (Array.isArray(o.keyNotesEn) && o.keyNotesEn.some((k) => typeof k === "string" && k.toLowerCase().includes(q))) ||
    (o.descriptionPl && typeof o.descriptionPl === 'string' && o.descriptionPl.toLowerCase().includes(q)) ||
    (o.descriptionEn && typeof o.descriptionEn === 'string' && o.descriptionEn.toLowerCase().includes(q))
  );
}

export function searchTeaCategories(query: string): TeaCategoryInfo[] {
  if (!query || typeof query !== 'string' || !query.trim()) return TEA_CATEGORIES;
  const q = query.toLowerCase().trim();
  return TEA_CATEGORIES.filter((t) =>
    (t.id && typeof t.id === 'string' && t.id.toLowerCase().includes(q)) ||
    (t.namePl && typeof t.namePl === 'string' && t.namePl.toLowerCase().includes(q)) ||
    (t.nameEn && typeof t.nameEn === 'string' && t.nameEn.toLowerCase().includes(q)) ||
    (t.traditionalName && typeof t.traditionalName === 'string' && t.traditionalName.toLowerCase().includes(q)) ||
    (t.oxidationRangePercent && typeof t.oxidationRangePercent === 'string' && t.oxidationRangePercent.toLowerCase().includes(q)) ||
    (t.killGreenMethod && typeof t.killGreenMethod === 'string' && t.killGreenMethod.toLowerCase().includes(q)) ||
    (Array.isArray(t.famousVarietiesPl) && t.famousVarietiesPl.some((v) => typeof v === 'string' && v.toLowerCase().includes(q))) ||
    (Array.isArray(t.famousVarietiesEn) && t.famousVarietiesEn.some((v) => typeof v === 'string' && v.toLowerCase().includes(q))) ||
    (Array.isArray(t.famousRegions) && t.famousRegions.some((r) => typeof r === 'string' && r.toLowerCase().includes(q))) ||
    (t.sensoryProfilePl && typeof t.sensoryProfilePl === 'string' && t.sensoryProfilePl.toLowerCase().includes(q)) ||
    (t.sensoryProfileEn && typeof t.sensoryProfileEn === 'string' && t.sensoryProfileEn.toLowerCase().includes(q)) ||
    (t.healthAttributesPl && typeof t.healthAttributesPl === 'string' && t.healthAttributesPl.toLowerCase().includes(q)) ||
    (t.descriptionPl && typeof t.descriptionPl === 'string' && t.descriptionPl.toLowerCase().includes(q)) ||
    (t.descriptionEn && typeof t.descriptionEn === 'string' && t.descriptionEn.toLowerCase().includes(q))
  );
}

const VARIETY_ALIASES: Record<string, string> = {
  gesha: 'variety-geisha',
  geisha: 'variety-geisha',
  'sl-28': 'variety-sl28-sl34',
  'sl-34': 'variety-sl28-sl34',
  sl28: 'variety-sl28-sl34',
  sl34: 'variety-sl28-sl34',
  bourbon: 'variety-bourbon',
  typica: 'variety-typica',
  caturra: 'variety-caturra-catuai',
  catuai: 'variety-caturra-catuai',
  pacamara: 'variety-pacamara-maragogype',
  maragogype: 'variety-pacamara-maragogype',
  maragogipe: 'variety-pacamara-maragogype',
  castillo: 'variety-castillo-colombia',
  colombia: 'variety-castillo-colombia',
  heirloom: 'variety-ethiopian-landraces',
  'ethiopian-heirloom': 'variety-ethiopian-landraces',
  ethiopianheirloom: 'variety-ethiopian-landraces',
  landraces: 'variety-ethiopian-landraces',
  eugenioides: 'variety-eugenioides',
  pinkbourbon: 'variety-pink-bourbon',
  'pink-bourbon': 'variety-pink-bourbon',
  batian: 'variety-sl28-sl34',
  ruiru11: 'variety-sl28-sl34',
  'ruiru-11': 'variety-sl28-sl34',
  'ruiru 11': 'variety-sl28-sl34',
  sidra: 'variety-bourbon',
  wushwush: 'variety-ethiopian-landraces',
  'wush-wush': 'variety-ethiopian-landraces',
  'wush wush': 'variety-ethiopian-landraces',
  chiroso: 'variety-ethiopian-landraces',
  tabi: 'variety-castillo-colombia',
  mokka: 'variety-typica',
  mocha: 'variety-typica',
  java: 'variety-typica',
  laurina: 'variety-bourbon',
  pacas: 'variety-pacamara-maragogype',
  mundonovo: 'variety-caturra-catuai',
  'mundo novo': 'variety-caturra-catuai',
  'mundo-novo': 'variety-caturra-catuai',
  parainema: 'variety-castillo-colombia',
  yellowbourbon: 'variety-bourbon',
  'yellow-bourbon': 'variety-bourbon',
  'yellow bourbon': 'variety-bourbon',
  redbourbon: 'variety-bourbon',
  'red-bourbon': 'variety-bourbon',
  'red bourbon': 'variety-bourbon',
  orangebourbon: 'variety-bourbon',
  'orange-bourbon': 'variety-bourbon',
  'orange bourbon': 'variety-bourbon',
  maracaturra: 'variety-pacamara-maragogype',
  'anacafe-14': 'variety-pacamara-maragogype',
  anacafe14: 'variety-pacamara-maragogype',
  k7: 'variety-sl28-sl34',
  obata: 'variety-caturra-catuai',
  catigua: 'variety-caturra-catuai',
  'bourbon-pointu': 'variety-bourbon',
  bourbonpointu: 'variety-bourbon',
  papayo: 'variety-bourbon',
  'gesha 1931': 'variety-geisha',
  'gesha-1931': 'variety-geisha',
  gesha1931: 'variety-geisha',
  'panama geisha': 'variety-geisha',
  'panama-geisha': 'variety-geisha',
  panamageisha: 'variety-geisha',
  villalobos: 'variety-typica',
  'san ramon': 'variety-typica',
  'san-ramon': 'variety-typica',
  sanramon: 'variety-typica',
  marsellesa: 'variety-castillo-colombia',
  mejorado: 'variety-typica',
  arusha: 'variety-typica',
  tekisic: 'variety-bourbon',
  ombligon: 'variety-ethiopian-landraces',
  'bourbon aji': 'variety-bourbon',
  'bourbon-aji': 'variety-bourbon',
  bourbonaji: 'variety-bourbon',
  'catuai amarillo': 'variety-caturra-catuai',
  'catuai-amarillo': 'variety-caturra-catuai',
  catuaiamarillo: 'variety-caturra-catuai',
  'catuai rojo': 'variety-caturra-catuai',
  'catuai-rojo': 'variety-caturra-catuai',
  catuairojo: 'variety-caturra-catuai',
  'caturra amarillo': 'variety-caturra-catuai',
  'caturra-amarillo': 'variety-caturra-catuai',
  caturraamarillo: 'variety-caturra-catuai',
  'caturra rojo': 'variety-caturra-catuai',
  'caturra-rojo': 'variety-caturra-catuai',
  caturrarojo: 'variety-caturra-catuai',
  'bourbon rayado': 'variety-bourbon',
  'bourbon-rayado': 'variety-bourbon',
  bourbonrayado: 'variety-bourbon',
  'green tip geisha': 'variety-geisha',
  'green-tip-geisha': 'variety-geisha',
  greentipgeisha: 'variety-geisha',
  'bronze tip geisha': 'variety-geisha',
  'bronze-tip-geisha': 'variety-geisha',
  bronzetipgeisha: 'variety-geisha',
  'dilla alghe': 'variety-ethiopian-landraces',
  'dilla-alghe': 'variety-ethiopian-landraces',
  dillaalghe: 'variety-ethiopian-landraces',
  dega: 'variety-ethiopian-landraces',
  kurume: 'variety-ethiopian-landraces',
  wolisho: 'variety-ethiopian-landraces',
  'mara-caturra': 'variety-pacamara-maragogype',
  'mara caturra': 'variety-pacamara-maragogype',
  paraiso: 'variety-caturra-catuai',
  bernardina: 'variety-pacamara-maragogype',
  purpurascens: 'variety-bourbon',
};

export function findCoffeeVarietyById(id: string): CoffeeVarietyInfo | undefined {
  if (!id || typeof id !== 'string' || !id.trim()) return undefined;
  const cleanId = id.replace(/\uFEFF/g, '').replace(/[\x00-\x1F\x7F]/g, '').trim().toLowerCase();
  const normId = cleanId.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const aliasMatchId = VARIETY_ALIASES[normId] || VARIETY_ALIASES[normId.replace(/[\s_-]+/g, '')];
  if (aliasMatchId) {
    const found = COFFEE_VARIETIES.find((v) => v.id === aliasMatchId);
    if (found) return found;
  }
  return COFFEE_VARIETIES.find((v) => {
    if (v.id && v.id.trim().toLowerCase() === cleanId) return true;
    if (v.name) {
      const vNameClean = v.name.trim().toLowerCase();
      const vNameNorm = v.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      if (vNameClean === cleanId || vNameNorm === normId) return true;
      if (vNameClean.includes(cleanId) || cleanId.includes(vNameClean)) return true;
      const tokens = vNameNorm.split(/[\s/(),-]+/).filter(Boolean);
      if (tokens.some((tok) => tok === normId || (tok.length >= 3 && cleanId.includes(tok)))) return true;
    }
    return false;
  });
}

const PROCESS_ALIASES: Record<string, string> = {
  washed: 'process-washed',
  mokra: 'process-washed',
  myta: 'process-washed',
  natural: 'process-natural',
  sucha: 'process-natural',
  honey: 'process-honey',
  miodowa: 'process-honey',
  pulpednatural: 'process-honey',
  'pulped-natural': 'process-honey',
  semiwashed: 'process-honey',
  'semi-washed': 'process-honey',
  blackhoney: 'process-honey',
  'black-honey': 'process-honey',
  'black honey': 'process-honey',
  redhoney: 'process-honey',
  'red-honey': 'process-honey',
  'red honey': 'process-honey',
  yellowhoney: 'process-honey',
  'yellow-honey': 'process-honey',
  'yellow honey': 'process-honey',
  whitehoney: 'process-honey',
  'white-honey': 'process-honey',
  'white honey': 'process-honey',
  goldhoney: 'process-honey',
  'gold-honey': 'process-honey',
  'gold honey': 'process-honey',
  anaerobic: 'process-anaerobic',
  beztlenowa: 'process-anaerobic',
  carbonic: 'process-carbonic-maceration',
  carbonicmaceration: 'process-carbonic-maceration',
  'carbonic-maceration': 'process-carbonic-maceration',
  maceracjaweglowa: 'process-carbonic-maceration',
  'maceracja-weglowa': 'process-carbonic-maceration',
  wethulled: 'process-wet-hulled',
  'wet-hulled': 'process-wet-hulled',
  gilingbasah: 'process-wet-hulled',
  'giling-basah': 'process-wet-hulled',
  thermalshock: 'process-anaerobic',
  'thermal-shock': 'process-anaerobic',
  'thermal shock': 'process-anaerobic',
  szoktermiczny: 'process-anaerobic',
  'szok-termiczny': 'process-anaerobic',
  'szok termiczny': 'process-anaerobic',
  cryomaceration: 'process-anaerobic',
  'cryo-maceration': 'process-anaerobic',
  'cryo maceration': 'process-anaerobic',
  kriomaceracja: 'process-anaerobic',
  nitromaceration: 'process-anaerobic',
  'nitro-maceration': 'process-anaerobic',
  'nitro maceration': 'process-anaerobic',
  'nitrogen-flushed': 'process-anaerobic',
  cofermentation: 'process-anaerobic',
  'co-fermentation': 'process-anaerobic',
  kofermentacja: 'process-anaerobic',
  lactic: 'process-anaerobic',
  'lactic-anaerobic': 'process-anaerobic',
  mleczna: 'process-anaerobic',
  doublewashed: 'process-washed',
  'double-washed': 'process-washed',
  podwojniemyta: 'process-washed',
  'podwojnie-myta': 'process-washed',
  yeast: 'process-anaerobic',
  'yeast-fermentation': 'process-anaerobic',
  drozdze: 'process-anaerobic',
  'fermentacja-drozdzowa': 'process-anaerobic',
  'fermentacja drozdzowa': 'process-anaerobic',
  'natural-carbonic': 'process-carbonic-maceration',
  'natural carbonic': 'process-carbonic-maceration',
  'natural carbonic maceration': 'process-carbonic-maceration',
  'anaerobic-natural': 'process-anaerobic',
  'anaerobic natural': 'process-anaerobic',
  'anaerobic-washed': 'process-anaerobic',
  'anaerobic washed': 'process-anaerobic',
  'anaerobic-honey': 'process-anaerobic',
  'anaerobic honey': 'process-anaerobic',
  anaerobico: 'process-anaerobic',
  lavado: 'process-washed',
  winey: 'process-natural',
  'wine-process': 'process-natural',
  'wine process': 'process-natural',
  experimental: 'process-anaerobic',
  eksperymentalna: 'process-anaerobic',
  koji: 'process-anaerobic',
  'koji-fermentation': 'process-anaerobic',
  'koji fermentation': 'process-anaerobic',
  kojifermentation: 'process-anaerobic',
  aerobic: 'process-anaerobic',
  'aerobic-fermentation': 'process-anaerobic',
  'aerobic fermentation': 'process-anaerobic',
  'yeast-inoculated': 'process-anaerobic',
  'yeast inoculated': 'process-anaerobic',
  'extended-fermentation': 'process-anaerobic',
  'extended fermentation': 'process-anaerobic',
  'yeast fermentation': 'process-anaerobic',
  yeastfermentation: 'process-anaerobic',
  'double anaerobic': 'process-anaerobic',
  'double-anaerobic': 'process-anaerobic',
  doubleanaerobic: 'process-anaerobic',
  'monsooned malabar': 'process-wet-hulled',
  'monsooned-malabar': 'process-wet-hulled',
  monsoonedmalabar: 'process-wet-hulled',
};

export function findCoffeeProcessById(id: string): CoffeeProcessInfo | undefined {
  if (!id || typeof id !== 'string' || !id.trim()) return undefined;
  const cleanId = id.replace(/\uFEFF/g, '').replace(/[\x00-\x1F\x7F]/g, '').trim().toLowerCase();
  const normId = cleanId.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const aliasMatchId = PROCESS_ALIASES[normId] || PROCESS_ALIASES[normId.replace(/[\s_-]+/g, '')];
  if (aliasMatchId) {
    const found = COFFEE_PROCESSES.find((p) => p.id === aliasMatchId);
    if (found) return found;
  }
  return COFFEE_PROCESSES.find((p) => {
    if (p.id && p.id.trim().toLowerCase() === cleanId) return true;
    if (p.processType && p.processType.trim().toLowerCase() === cleanId) return true;
    if (p.name) {
      const pNameClean = p.name.trim().toLowerCase();
      const pNameNorm = p.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      if (pNameClean === cleanId || pNameNorm === normId) return true;
      if (pNameClean.includes(cleanId) || cleanId.includes(pNameClean)) return true;
      const tokens = pNameNorm.split(/[\s/(),-]+/).filter(Boolean);
      if (tokens.some((tok) => tok === normId || (tok.length >= 3 && cleanId.includes(tok)))) return true;
    }
    return false;
  });
}

const ORIGIN_ALIASES: Record<string, string> = {
  // Ethiopia
  eth: 'origin-ethiopia',
  ethiopia: 'origin-ethiopia',
  etiopia: 'origin-ethiopia',
  et: 'origin-ethiopia',
  yirgacheffe: 'origin-ethiopia',
  sidama: 'origin-ethiopia',
  guji: 'origin-ethiopia',
  harrar: 'origin-ethiopia',
  limu: 'origin-ethiopia',
  jimma: 'origin-ethiopia',
  kochere: 'origin-ethiopia',
  chelchele: 'origin-ethiopia',
  hambela: 'origin-ethiopia',
  worka: 'origin-ethiopia',
  aricha: 'origin-ethiopia',
  bensa: 'origin-ethiopia',
  // Kenya
  ken: 'origin-kenya',
  kenya: 'origin-kenya',
  kenia: 'origin-kenya',
  ke: 'origin-kenya',
  nyeri: 'origin-kenya',
  kirinyaga: 'origin-kenya',
  kiambu: 'origin-kenya',
  embu: 'origin-kenya',
  muranga: 'origin-kenya',
  "murang'a": 'origin-kenya',
  // Colombia
  col: 'origin-colombia',
  colombia: 'origin-colombia',
  kolumbia: 'origin-colombia',
  co: 'origin-colombia',
  huila: 'origin-colombia',
  narino: 'origin-colombia',
  antioquia: 'origin-colombia',
  cauca: 'origin-colombia',
  tolima: 'origin-colombia',
  pitalito: 'origin-colombia',
  'san agustin': 'origin-colombia',
  'san-agustin': 'origin-colombia',
  sanagustin: 'origin-colombia',
  urrao: 'origin-colombia',
  quindio: 'origin-colombia',
  quindío: 'origin-colombia',
  santander: 'origin-colombia',
  inza: 'origin-colombia',
  // Guatemala
  gtm: 'origin-guatemala',
  guatemala: 'origin-guatemala',
  gwatemala: 'origin-guatemala',
  gt: 'origin-guatemala',
  antigua: 'origin-guatemala',
  huehuetenango: 'origin-guatemala',
  coban: 'origin-guatemala',
  fraijanes: 'origin-guatemala',
  atitlan: 'origin-guatemala',
  acatenango: 'origin-guatemala',
  oriente: 'origin-guatemala',
  // Costa Rica
  cri: 'origin-costa-rica',
  'costa-rica': 'origin-costa-rica',
  'costa rica': 'origin-costa-rica',
  costarica: 'origin-costa-rica',
  kostaryka: 'origin-costa-rica',
  cr: 'origin-costa-rica',
  tarrazu: 'origin-costa-rica',
  'west valley': 'origin-costa-rica',
  'west-valley': 'origin-costa-rica',
  westvalley: 'origin-costa-rica',
  'central valley': 'origin-costa-rica',
  'central-valley': 'origin-costa-rica',
  centralvalley: 'origin-costa-rica',
  'tres rios': 'origin-costa-rica',
  'tres-rios': 'origin-costa-rica',
  tresrios: 'origin-costa-rica',
  dota: 'origin-costa-rica',
  // Brazil
  bra: 'origin-brazil',
  brazil: 'origin-brazil',
  brasil: 'origin-brazil',
  brazylia: 'origin-brazil',
  br: 'origin-brazil',
  cerrado: 'origin-brazil',
  'minas gerais': 'origin-brazil',
  'minas-gerais': 'origin-brazil',
  'sul de minas': 'origin-brazil',
  'sul-de-minas': 'origin-brazil',
  mogiana: 'origin-brazil',
  'espirito santo': 'origin-brazil',
  'espirito-santo': 'origin-brazil',
  espiritosanto: 'origin-brazil',
  'chapada diamantina': 'origin-brazil',
  // Panama
  pan: 'origin-panama',
  panama: 'origin-panama',
  pa: 'origin-panama',
  boquete: 'origin-panama',
  volcan: 'origin-panama',
  renacimiento: 'origin-panama',
  jaramillo: 'origin-panama',
  'los pozos': 'origin-panama',
  'los-pozos': 'origin-panama',
};

export function findCoffeeOriginById(id: string): CoffeeOriginInfo | undefined {
  if (!id || typeof id !== 'string' || !id.trim()) return undefined;
  const cleanId = id.replace(/\uFEFF/g, '').replace(/[\x00-\x1F\x7F]/g, '').trim().toLowerCase();
  const normId = cleanId.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const mappedId = ORIGIN_ALIASES[cleanId] || ORIGIN_ALIASES[normId];
  if (mappedId) {
    const directMatch = COFFEE_ORIGINS.find((o) => o.id === mappedId);
    if (directMatch) return directMatch;
  }

  return COFFEE_ORIGINS.find((o) => {
    if (o.id && typeof o.id === 'string' && o.id.trim().toLowerCase() === cleanId) return true;
    if (o.countryCode && typeof o.countryCode === 'string' && o.countryCode.trim().toLowerCase() === cleanId) return true;
    if (o.country && typeof o.country === 'string') {
      const cClean = o.country.trim().toLowerCase();
      const cNorm = o.country.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      if (cClean === cleanId || cNorm === normId || cClean.includes(cleanId) || cleanId.includes(cClean)) return true;
    }
    if (o.countryEn && typeof o.countryEn === 'string') {
      const cClean = o.countryEn.trim().toLowerCase();
      const cNorm = o.countryEn.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      if (cClean === cleanId || cNorm === normId || cClean.includes(cleanId) || cleanId.includes(cClean)) return true;
    }
    return false;
  });
}

const TEA_ALIASES: Record<string, string> = {
  white: 'tea-white',
  biala: 'tea-white',
  'silver-needle': 'tea-white',
  silverneedle: 'tea-white',
  'bai-mu-dan': 'tea-white',
  baimudan: 'tea-white',
  green: 'tea-green',
  zielona: 'tea-green',
  sencha: 'tea-green',
  gyokuro: 'tea-green',
  matcha: 'tea-green',
  genmaicha: 'tea-green',
  longjing: 'tea-green',
  dragonwell: 'tea-green',
  yellow: 'tea-yellow',
  zolta: 'tea-yellow',
  oolong: 'tea-oolong',
  wulong: 'tea-oolong',
  turkusowa: 'tea-oolong',
  tieguanyin: 'tea-oolong',
  'tie-guan-yin': 'tea-oolong',
  dahongpao: 'tea-oolong',
  'da-hong-pao': 'tea-oolong',
  dancong: 'tea-oolong',
  black: 'tea-black',
  czarna: 'tea-black',
  czerwona: 'tea-black',
  darjeeling: 'tea-black',
  assam: 'tea-black',
  ceylon: 'tea-black',
  earlgrey: 'tea-black',
  'earl-grey': 'tea-black',
  'earl grey': 'tea-black',
  lapsang: 'tea-black',
  'lapsang-souchong': 'tea-black',
  puerh: 'tea-puerh',
  puer: 'tea-puerh',
  ciemna: 'tea-puerh',
  dark: 'tea-puerh',
  sheng: 'tea-puerh',
  shou: 'tea-puerh',
  'sheng-puerh': 'tea-puerh',
  'shou-puerh': 'tea-puerh',
  'pu-erh': 'tea-puerh',
  'pu erh': 'tea-puerh',
  "pu'erh": 'tea-puerh',
  "pu'er": 'tea-puerh',
  hojicha: 'tea-green',
  houjicha: 'tea-green',
  kukicha: 'tea-green',
  fukamushi: 'tea-green',
  jasmine: 'tea-green',
  jasmin: 'tea-green',
  jasminowa: 'tea-green',
  'oriental-beauty': 'tea-oolong',
  'oriental beauty': 'tea-oolong',
  dongfangmeiren: 'tea-oolong',
  'milk-oolong': 'tea-oolong',
  'milk oolong': 'tea-oolong',
  'jin xuan': 'tea-oolong',
  jinxuan: 'tea-oolong',
  yancha: 'tea-oolong',
  'wuyi-rock': 'tea-oolong',
  'wuyi rock': 'tea-oolong',
  wuyirock: 'tea-oolong',
  keemun: 'tea-black',
  qimen: 'tea-black',
  dianhong: 'tea-black',
  'dian-hong': 'tea-black',
  'dian hong': 'tea-black',
  'jin-jun-mei': 'tea-black',
  'jin jun mei': 'tea-black',
  jinjunmei: 'tea-black',
  'silver needle': 'tea-white',
  'bai-hao-yin-zhen': 'tea-white',
  'bai hao yin zhen': 'tea-white',
  baihaoyinzhen: 'tea-white',
  'white-peony': 'tea-white',
  'white peony': 'tea-white',
  whitepeony: 'tea-white',
  'pai-mu-tan': 'tea-white',
  'pai mu tan': 'tea-white',
  paimutan: 'tea-white',
  bancha: 'tea-green',
  'dragon well': 'tea-green',
  'tie guan yin': 'tea-oolong',
  'iron goddess': 'tea-oolong',
  'iron-goddess': 'tea-oolong',
  irongoddess: 'tea-oolong',
  'da hong pao': 'tea-oolong',
  'big red robe': 'tea-oolong',
  'big-red-robe': 'tea-oolong',
  huangcha: 'tea-yellow',
  'yellow tea': 'tea-yellow',
  'yellow-tea': 'tea-yellow',
  yellowtea: 'tea-yellow',
  'junshan yinzhen': 'tea-yellow',
  'junshan-yinzhen': 'tea-yellow',
  junshanyinzhen: 'tea-yellow',
  'huoshan huangya': 'tea-yellow',
  'huoshan-huangya': 'tea-yellow',
  'mengding huangya': 'tea-yellow',
  'mengding-huangya': 'tea-yellow',
  'hei cha': 'tea-puerh',
  'hei-cha': 'tea-puerh',
  heicha: 'tea-puerh',
  'liu bao': 'tea-puerh',
  'liu-bao': 'tea-puerh',
  liubao: 'tea-puerh',
  'bi luo chun': 'tea-green',
  'bi-luo-chun': 'tea-green',
  biluochun: 'tea-green',
  'anji bai cha': 'tea-green',
  'anji-bai-cha': 'tea-green',
  anjibaicha: 'tea-green',
  'shou mei': 'tea-white',
  'shou-mei': 'tea-white',
  shoumei: 'tea-white',
  'gong mei': 'tea-white',
  'gong-mei': 'tea-white',
  gongmei: 'tea-white',
  'rou gui': 'tea-oolong',
  'rou-gui': 'tea-oolong',
  rougui: 'tea-oolong',
  'shui xian': 'tea-oolong',
  'shui-xian': 'tea-oolong',
  shuixian: 'tea-oolong',
  'dan cong': 'tea-oolong',
  'dan-cong': 'tea-oolong',
  'dragon-well': 'tea-green',
  'lapsang souchong': 'tea-black',
};

export function findTeaCategoryById(id: string): TeaCategoryInfo | undefined {
  if (!id || typeof id !== 'string' || !id.trim()) return undefined;
  const cleanId = id.replace(/\uFEFF/g, '').replace(/[\x00-\x1F\x7F]/g, '').trim().toLowerCase();
  const normId = cleanId.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const aliasMatchId = TEA_ALIASES[normId] || TEA_ALIASES[normId.replace(/[\s_-]+/g, '')];
  if (aliasMatchId) {
    const found = TEA_CATEGORIES.find((t) => t.id === aliasMatchId);
    if (found) return found;
  }

  return TEA_CATEGORIES.find((t) => {
    if (t.id && typeof t.id === 'string' && t.id.trim().toLowerCase() === cleanId) return true;
    if (t.namePl && typeof t.namePl === 'string') {
      const plClean = t.namePl.trim().toLowerCase();
      const plNorm = t.namePl.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      if (plClean === cleanId || plNorm === normId) return true;
      const tokens = plNorm.split(/[\s/(),-]+/).filter((tok) => tok && tok !== 'herbata');
      if (tokens.some((tok) => tok === normId)) return true;
    }
    if (t.nameEn && typeof t.nameEn === 'string') {
      const enClean = t.nameEn.trim().toLowerCase();
      const enNorm = t.nameEn.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      if (enClean === cleanId || enNorm === normId) return true;
      const tokens = enNorm.split(/[\s/(),-]+/).filter((tok) => tok && tok !== 'tea');
      if (tokens.some((tok) => tok === normId)) return true;
    }
    if (t.traditionalName && typeof t.traditionalName === 'string') {
      const tradClean = t.traditionalName.trim().toLowerCase();
      const tradNorm = t.traditionalName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      if (tradClean === cleanId || tradClean.includes(cleanId) || tradNorm === normId || tradNorm.includes(normId)) {
        return true;
      }
    }
    return false;
  });
}

export function getKnowledgeDescription(id: string, lang: 'pl' | 'en' | string = 'pl'): string {
  if (!id || typeof id !== 'string') return '';
  const cleanId = id.replace(/\uFEFF/g, '').replace(/[\x00-\x1F\x7F]/g, '').trim().toLowerCase();
  const loc = KNOWLEDGE_LOCALES[cleanId];
  if (!loc) return '';
  const isEn = typeof lang === 'string' && (lang.trim().toLowerCase() === 'en' || lang.trim().toLowerCase().startsWith('en'));
  return isEn ? loc.descriptionEn : loc.descriptionPl;
}

export function getKnowledgeSensoryProfile(id: string, lang: 'pl' | 'en' | string = 'pl'): string {
  if (!id || typeof id !== 'string') return '';
  const cleanId = id.replace(/\uFEFF/g, '').replace(/[\x00-\x1F\x7F]/g, '').trim().toLowerCase();
  const loc = KNOWLEDGE_LOCALES[cleanId];
  if (!loc) return '';
  const isEn = typeof lang === 'string' && (lang.trim().toLowerCase() === 'en' || lang.trim().toLowerCase().startsWith('en'));
  if (loc.sensoryProfilePl || loc.sensoryProfileEn) {
    return (isEn ? loc.sensoryProfileEn : loc.sensoryProfilePl) || '';
  }
  if (loc.sensoryImpactPl || loc.sensoryImpactEn) {
    return (isEn ? loc.sensoryImpactEn : loc.sensoryImpactPl) || '';
  }
  if (loc.flavorProfilePl || loc.flavorProfileEn) {
    return (isEn ? loc.flavorProfileEn : loc.flavorProfilePl) || '';
  }
  return '';
}

export function getKnowledgeKeyNotes(id: string, lang: 'pl' | 'en' | string = 'pl'): string[] {
  if (!id || typeof id !== 'string') return [];
  const cleanId = id.replace(/\uFEFF/g, '').replace(/[\x00-\x1F\x7F]/g, '').trim().toLowerCase();
  const loc = KNOWLEDGE_LOCALES[cleanId];
  if (!loc) return [];
  const isEn = typeof lang === 'string' && (lang.trim().toLowerCase() === 'en' || lang.trim().toLowerCase().startsWith('en'));
  const notes = isEn ? loc.keyNotesEn : loc.keyNotesPl;
  return Array.isArray(notes) ? notes : [];
}

/**
 * Zwraca zlokalizowany tytuł encji wiedzy (odmiany, obróbki, regionu, herbaty).
 */
export function getKnowledgeTitle(id: string, lang: 'pl' | 'en' | string = 'pl'): string {
  if (!id || typeof id !== 'string') return '';
  const cleanId = id.replace(/\uFEFF/g, '').replace(/[\x00-\x1F\x7F]/g, '').trim().toLowerCase();
  if (!cleanId) return '';
  const isEn = typeof lang === 'string' && (lang.trim().toLowerCase() === 'en' || lang.trim().toLowerCase().startsWith('en'));

  const loc = KNOWLEDGE_LOCALES[cleanId];
  if (loc && (loc.namePl || loc.nameEn)) {
    const locName = isEn ? (loc.nameEn || loc.namePl) : (loc.namePl || loc.nameEn);
    if (locName) return locName;
  }

  const tea = findTeaCategoryById(cleanId);
  if (tea) return isEn ? (tea.nameEn || tea.namePl) : (tea.namePl || tea.nameEn);

  const origin = findCoffeeOriginById(cleanId);
  if (origin) return isEn ? (origin.countryEn || origin.country) : origin.country;

  const variety = findCoffeeVarietyById(cleanId);
  if (variety) return variety.name || '';

  const process = findCoffeeProcessById(cleanId);
  if (process) return process.name || '';

  return '';
}

export interface KnowledgeSearchResult {
  id: string;
  category: 'variety' | 'process' | 'origin' | 'tea';
  title: string;
  snippet: string;
  keyNotes: string[];
}

/**
 * Przeszukuje zintegrowaną bazę wiedzy (odmiany, obróbki, kraje i herbaty),
 * zwracając zlokalizowane pozycje dopasowane do zapytania.
 */
export function searchKnowledgeBase(
  query: string | undefined | null,
  lang: 'pl' | 'en' | string = 'pl'
): KnowledgeSearchResult[] {
  if (!query || typeof query !== 'string' || !query.trim()) return [];
  const cleanQuery = query.replace(/\uFEFF/g, '').trim();
  if (!cleanQuery) return [];

  const isEn = typeof lang === 'string' && (lang.trim().toLowerCase() === 'en' || lang.trim().toLowerCase().startsWith('en'));
  const results: KnowledgeSearchResult[] = [];

  // 1. Odmiany kawy
  const varieties = searchCoffeeVarieties(cleanQuery);
  for (const v of varieties) {
    results.push({
      id: v.id,
      category: 'variety',
      title: v.name,
      snippet: isEn ? (v.descriptionEn || v.descriptionPl) : (v.descriptionPl || v.descriptionEn),
      keyNotes: isEn ? (v.keyNotesEn || v.keyNotesPl) : (v.keyNotesPl || v.keyNotesEn),
    });
  }

  // 2. Metody obróbki
  const processes = searchCoffeeProcesses(cleanQuery);
  for (const p of processes) {
    results.push({
      id: p.id,
      category: 'process',
      title: p.name,
      snippet: isEn ? (p.descriptionEn || p.descriptionPl) : (p.descriptionPl || p.descriptionEn),
      keyNotes: isEn ? (p.keyNotesEn || p.keyNotesPl) : (p.keyNotesPl || p.keyNotesEn),
    });
  }

  // 3. Kraje pochodzenia
  const origins = searchCoffeeOrigins(cleanQuery);
  for (const o of origins) {
    results.push({
      id: o.id,
      category: 'origin',
      title: isEn ? (o.countryEn || o.country) : o.country,
      snippet: isEn ? (o.descriptionEn || o.descriptionPl) : (o.descriptionPl || o.descriptionEn),
      keyNotes: isEn ? (o.keyNotesEn || o.keyNotesPl) : (o.keyNotesPl || o.keyNotesEn),
    });
  }

  // 4. Kategorie herbaty
  const teas = searchTeaCategories(cleanQuery);
  for (const t of teas) {
    results.push({
      id: t.id,
      category: 'tea',
      title: isEn ? (t.nameEn || t.namePl) : (t.namePl || t.nameEn),
      snippet: isEn ? (t.descriptionEn || t.descriptionPl) : (t.descriptionPl || t.descriptionEn),
      keyNotes: isEn ? (t.famousVarietiesEn || t.famousVarietiesPl) : (t.famousVarietiesPl || t.famousVarietiesEn),
    });
  }

  return results;
}



export interface KnowledgeItemMatch {
  id: string;
  category: 'variety' | 'process' | 'origin' | 'tea';
  data: CoffeeVarietyInfo | CoffeeProcessInfo | CoffeeOriginInfo | TeaCategoryInfo;
}

/**
 * Przeszukuje wszystkie kolekcje kompendium wiedzy po zadanym identyfikatorze ID.
 */
export function findKnowledgeItemById(id: string | undefined | null): KnowledgeItemMatch | null {
  if (!id || typeof id !== 'string' || !id.trim()) return null;
  const cleanId = id.replace(/\uFEFF/g, '').trim();
  if (!cleanId) return null;

  const variety = findCoffeeVarietyById(cleanId);
  if (variety) {
    return { id: variety.id, category: 'variety', data: variety };
  }

  const process = findCoffeeProcessById(cleanId);
  if (process) {
    return { id: process.id, category: 'process', data: process };
  }

  const origin = findCoffeeOriginById(cleanId);
  if (origin) {
    return { id: origin.id, category: 'origin', data: origin };
  }

  const tea = findTeaCategoryById(cleanId);
  if (tea) {
    return { id: tea.id, category: 'tea', data: tea };
  }

  return null;
}

export interface KnowledgeSummaryCounts {
  varietiesCount: number;
  processesCount: number;
  originsCount: number;
  teaCategoriesCount: number;
  totalEntries: number;
}

/**
 * Zwraca liczbę dostępnych wpisów wiedzy w podziale na kategorie.
 */
export function getKnowledgeSummaryCounts(): KnowledgeSummaryCounts {
  const varietiesCount = Array.isArray(COFFEE_VARIETIES) ? COFFEE_VARIETIES.length : 0;
  const processesCount = Array.isArray(COFFEE_PROCESSES) ? COFFEE_PROCESSES.length : 0;
  const originsCount = Array.isArray(COFFEE_ORIGINS) ? COFFEE_ORIGINS.length : 0;
  const teaCategoriesCount = Array.isArray(TEA_CATEGORIES) ? TEA_CATEGORIES.length : 0;
  const totalEntries = varietiesCount + processesCount + originsCount + teaCategoriesCount;

  return {
    varietiesCount,
    processesCount,
    originsCount,
    teaCategoriesCount,
    totalEntries,
  };
}

export interface TeaBrewingGuide {
  id: string;
  name: string;
  traditionalName: string;
  waterTemperatureCelsius: number;
  recommendedGongfuSteepSeconds: number;
  recommendedWesternSteepSeconds: number;
  recommendedRatioGongfu: number;
  recommendedRatioWestern: number;
  sensoryProfile: string;
}

/**
 * Zwraca zoptymalizowany przewodnik i parametry parzenia (temperatura, czasy infuzji, proporcje)
 * dla wybranej kategorii herbaty.
 */
export function getTeaBrewingGuide(
  idOrQuery: string | undefined | null,
  lang: 'pl' | 'en' | string = 'pl'
): TeaBrewingGuide | null {
  if (!idOrQuery || typeof idOrQuery !== 'string') return null;
  const tea = findTeaCategoryById(idOrQuery);
  if (!tea) return null;

  const isEn =
    typeof lang === 'string' &&
    (lang.trim().toLowerCase() === 'en' || lang.trim().toLowerCase().startsWith('en'));

  let gongfuSec = 20;
  let westernSec = 180;
  let ratioGf = 20;
  let ratioWest = 50;

  switch (tea.id) {
    case 'tea-green':
      gongfuSec = 15;
      westernSec = 120;
      ratioGf = 25;
      ratioWest = 50;
      break;
    case 'tea-white':
      gongfuSec = 20;
      westernSec = 240;
      ratioGf = 20;
      ratioWest = 40;
      break;
    case 'tea-yellow':
      gongfuSec = 20;
      westernSec = 150;
      ratioGf = 22;
      ratioWest = 45;
      break;
    case 'tea-oolong':
      gongfuSec = 25;
      westernSec = 210;
      ratioGf = 15;
      ratioWest = 50;
      break;
    case 'tea-black':
      gongfuSec = 15;
      westernSec = 180;
      ratioGf = 20;
      ratioWest = 50;
      break;
    case 'tea-dark-puerh':
      gongfuSec = 15;
      westernSec = 240;
      ratioGf = 15;
      ratioWest = 50;
      break;
    default:
      gongfuSec = 20;
      westernSec = 180;
      ratioGf = 20;
      ratioWest = 50;
  }

  return {
    id: tea.id,
    name: isEn ? tea.nameEn : tea.namePl,
    traditionalName: tea.traditionalName,
    waterTemperatureCelsius: tea.waterTemperatureCelsius,
    recommendedGongfuSteepSeconds: gongfuSec,
    recommendedWesternSteepSeconds: westernSec,
    recommendedRatioGongfu: ratioGf,
    recommendedRatioWestern: ratioWest,
    sensoryProfile: isEn ? tea.sensoryProfileEn : tea.sensoryProfilePl,
  };
}

export interface CoffeeVarietyGuide {
  id: string;
  name: string;
  geneticLineage: string;
  acidity: string;
  body: string;
  sweetness: string;
  sensoryProfile: string;
  keyNotes: string[];
  recommendedRoast: string;
}

/**
 * Zwraca zoptymalizowany przewodnik i profil sensoryczny dla wybranej odmiany botanicznej kawy.
 */
export function getCoffeeVarietyGuide(
  idOrQuery: string | undefined | null,
  lang: 'pl' | 'en' | string = 'pl'
): CoffeeVarietyGuide | null {
  if (!idOrQuery || typeof idOrQuery !== 'string') return null;
  const variety = findCoffeeVarietyById(idOrQuery);
  if (!variety) return null;

  const isEn =
    typeof lang === 'string' &&
    (lang.trim().toLowerCase() === 'en' || lang.trim().toLowerCase().startsWith('en'));

  return {
    id: variety.id,
    name: variety.name,
    geneticLineage: variety.geneticLineage,
    acidity: variety.cupCharacteristics.acidity,
    body: variety.cupCharacteristics.body,
    sweetness: variety.cupCharacteristics.sweetness,
    sensoryProfile: isEn ? variety.sensoryProfileEn : variety.sensoryProfilePl,
    keyNotes: isEn ? variety.keyNotesEn : variety.keyNotesPl,
    recommendedRoast: variety.recommendedRoast,
  };
}


export interface CoffeeProcessGuide {
  id: string;
  name: string;
  processType: string;
  sensoryImpact: string;
  dryingDurationDays: string;
  waterConsumption: string;
  keyNotes: string[];
  description: string;
}

/**
 * Zwraca zoptymalizowany przewodnik i profil sensoryczny dla wybranej metody obróbki kawy.
 */
export function getCoffeeProcessGuide(
  idOrQuery: string | undefined | null,
  lang: 'pl' | 'en' | string = 'pl'
): CoffeeProcessGuide | null {
  if (!idOrQuery || typeof idOrQuery !== 'string') return null;
  const process = findCoffeeProcessById(idOrQuery);
  if (!process) return null;

  const isEn =
    typeof lang === 'string' &&
    (lang.trim().toLowerCase() === 'en' || lang.trim().toLowerCase().startsWith('en'));

  return {
    id: process.id,
    name: process.name,
    processType: process.processType,
    sensoryImpact: isEn ? process.sensoryImpactEn : process.sensoryImpactPl,
    dryingDurationDays: process.dryingDurationDays,
    waterConsumption: process.waterConsumption,
    keyNotes: isEn ? process.keyNotesEn : process.keyNotesPl,
    description: isEn ? process.descriptionEn : process.descriptionPl,
  };
}


export interface CoffeeOriginGuide {
  id: string;
  country: string;
  countryCode: string;
  primaryRegions: string[];
  typicalAltitudeMeters: string;
  harvestMonths: string;
  mainVarieties: string[];
  flavorProfile: string;
  keyNotes: string[];
  description: string;
}

/**
 * Zwraca zoptymalizowany przewodnik terroir i profil sensoryczny dla wybranego kraju/regionu pochodzenia kawy.
 */
export function getCoffeeOriginGuide(
  countryOrCode: string | undefined | null,
  lang: 'pl' | 'en' | string = 'pl'
): CoffeeOriginGuide | null {
  if (!countryOrCode || typeof countryOrCode !== 'string') return null;
  const origin = findCoffeeOriginById(countryOrCode);
  if (!origin) return null;

  const isEn =
    typeof lang === 'string' &&
    (lang.trim().toLowerCase() === 'en' || lang.trim().toLowerCase().startsWith('en'));

  return {
    id: origin.id,
    country: isEn ? (origin.countryEn || origin.country) : origin.country,
    countryCode: origin.countryCode,
    primaryRegions: origin.primaryRegions,
    typicalAltitudeMeters: origin.typicalAltitudeMeters,
    harvestMonths: origin.harvestMonths,
    mainVarieties: origin.mainVarieties,
    flavorProfile: isEn ? origin.flavorProfileEn : origin.flavorProfilePl,
    keyNotes: isEn ? origin.keyNotesEn : origin.keyNotesPl,
    description: isEn ? origin.descriptionEn : origin.descriptionPl,
  };
}

export type CoffeeRoastLevelKey =
  | 'light'
  | 'medium_light'
  | 'medium'
  | 'medium_dark'
  | 'dark';

export interface CoffeeRoastLevelGuide {
  key: CoffeeRoastLevelKey;
  namePl: string;
  nameEn: string;
  recommendedWaterTempRange: string;
  restingWindowDays: string;
  solubilityLevel: 'low' | 'moderate' | 'high' | 'very_high';
  flavorProfilePl: string;
  flavorProfileEn: string;
  extractionTipsPl: string;
  extractionTipsEn: string;
}

export const COFFEE_ROAST_LEVEL_GUIDES: CoffeeRoastLevelGuide[] = [
  {
    key: 'light',
    namePl: 'Jasne (Light / Filter / Cinnamon)',
    nameEn: 'Light (Filter / Cinnamon)',
    recommendedWaterTempRange: '92–96°C',
    restingWindowDays: '14–30 dni',
    solubilityLevel: 'low',
    flavorProfilePl: 'Wyrazista kwasowość owocowa (cytrusy, owoce pestkowe), nuty kwiatowe i herbaciane, lekkie ciało.',
    flavorProfileEn: 'Vibrant fruit acidity (citrus, stone fruits), floral and tea-like notes, delicate body.',
    extractionTipsPl: 'Niska rozpuszczalność ziaren — stosuj wyższą temperaturę wody (93–96°C) i drobniejszy przemiał.',
    extractionTipsEn: 'Low bean solubility — use higher water temperature (93–96°C) and finer grind.',
  },
  {
    key: 'medium_light',
    namePl: 'Jasno-średnie (Medium-Light / City+)',
    nameEn: 'Medium-Light (City+)',
    recommendedWaterTempRange: '90–94°C',
    restingWindowDays: '10–24 dni',
    solubilityLevel: 'moderate',
    flavorProfilePl: 'Zrównoważona kwasowość owocowa z narastającą słodyczą karmelu, miodu i orzechów.',
    flavorProfileEn: 'Balanced fruit acidity with developing sweetness of caramel, honey, and nuts.',
    extractionTipsPl: 'Uniwersalny profil pod przelewy i nowoczesne espresso — woda ok. 92–94°C.',
    extractionTipsEn: 'Versatile profile for pour over and modern espresso — water around 92–94°C.',
  },
  {
    key: 'medium',
    namePl: 'Średnie (Medium / Omniroast / Full City)',
    nameEn: 'Medium (Omniroast / Full City)',
    recommendedWaterTempRange: '88–92°C',
    restingWindowDays: '7–21 dni',
    solubilityLevel: 'high',
    flavorProfilePl: 'Wysoka słodycz czekolady mlecznej, toffi i prażonych migdałów, niska łagodna kwasowość, kremowe body.',
    flavorProfileEn: 'Rich sweetness of milk chocolate, toffee, and toasted almonds, mild acidity, creamy body.',
    extractionTipsPl: 'Wysoka rozpuszczalność — obniż temperaturę wody do 88–92°C, aby uniknąć nadmiernej goryczy.',
    extractionTipsEn: 'High solubility — lower water temperature to 88–92°C to avoid over-extracting bitterness.',
  },
  {
    key: 'medium_dark',
    namePl: 'Średnio-ciemne (Medium-Dark / Vienna)',
    nameEn: 'Medium-Dark (Vienna)',
    recommendedWaterTempRange: '84–88°C',
    restingWindowDays: '5–14 dni',
    solubilityLevel: 'high',
    flavorProfilePl: 'Gorzka czekolada, kakao, nuty przypraw korzennych i dymne, gęste syropowate body, śladowa kwasowość.',
    flavorProfileEn: 'Dark chocolate, cocoa, spice and subtle smoky notes, heavy syrupy body, minimal acidity.',
    extractionTipsPl: 'Szybka ekstrakcja — grubszy przemiał, niższa temperatura (85–88°C), idealne do kawiarki i tradycyjnego espresso.',
    extractionTipsEn: 'Fast extraction — coarser grind, lower temp (85–88°C), great for Moka pot and traditional espresso.',
  },
  {
    key: 'dark',
    namePl: 'Ciemne (Dark / French / Italian)',
    nameEn: 'Dark (French / Italian)',
    recommendedWaterTempRange: '80–85°C',
    restingWindowDays: '3–10 dni',
    solubilityLevel: 'very_high',
    flavorProfilePl: 'Intensywna gorycz palona, melasa, ciemny karmel, bardzo ciężkie oleiste body, zerowa kwasowość.',
    flavorProfileEn: 'Intense roasty bitterness, molasses, dark caramel, very heavy oily body, zero acidity.',
    extractionTipsPl: 'Bardzo porowate ziarna — woda 80–84°C, skrócony czas kontaktu, doskonałe z mlekiem.',
    extractionTipsEn: 'Highly porous beans — water 80–84°C, shortened contact time, excellent in milk beverages.',
  },
];

/**
 * Zwraca przewodnik po profilu stopnia palenia kawy, rekomendowanych temperaturach wody,
 * oknie leżakowania i charakterystyce sensorycznej.
 */
export function getCoffeeRoastLevelGuide(
  roastLevel: string | undefined | null
): CoffeeRoastLevelGuide | null {
  if (!roastLevel || typeof roastLevel !== 'string' || !roastLevel.trim()) {
    return null;
  }

  const query = roastLevel.trim().toLowerCase();

  // 1. Dokładne dopasowanie klucza
  const exactKey = COFFEE_ROAST_LEVEL_GUIDES.find((g) => g.key === query);
  if (exactKey) return exactKey;

  // 2. Dokładne dopasowanie nazwy
  const exactName = COFFEE_ROAST_LEVEL_GUIDES.find(
    (g) => g.namePl.toLowerCase() === query || g.nameEn.toLowerCase() === query
  );
  if (exactName) return exactName;

  // 3. Dopasowanie podciągu
  return (
    COFFEE_ROAST_LEVEL_GUIDES.find((g) => {
      if (query.includes(g.key)) return true;
      if (g.namePl.toLowerCase().includes(query) || g.nameEn.toLowerCase().includes(query)) return true;
      return false;
    }) || null
  );
}

export type CoffeeAltitudeBand = 'very_high' | 'high' | 'medium' | 'low' | 'unknown';

export interface CoffeeAltitudeGuide {
  altitudeMeters: number | null;
  band: CoffeeAltitudeBand;
  shgClassification: string;
  beanDensity: 'very_high' | 'high' | 'moderate' | 'low' | 'unknown';
  acidityPotential: 'vibrant_complex' | 'bright_balanced' | 'mild_sweet' | 'low_muted' | 'unknown';
  bandLabelPl: string;
  bandLabelEn: string;
  sensoryProfilePl: string;
  sensoryProfileEn: string;
  roastingAndBrewingAdvicePl: string;
  roastingAndBrewingAdviceEn: string;
}

/**
 * Zwraca przewodnik po wysokości upraw kawy, klasyfikacji SHG/HG, gęstości ziaren
 * oraz zaleceniach temperaturowych i sensorycznych.
 */
export function getCoffeeAltitudeGuide(
  altitudeMeters: number | string | undefined | null
): CoffeeAltitudeGuide {
  const parseNum = (v: unknown): number => {
    if (typeof v === 'number') return Number.isFinite(v) && !Object.is(v, -0) && v > 0 ? v : 0;
    if (typeof v === 'string') {
      const clean = v.replace(/\uFEFF/g, '').replace(/[^\d.,]/g, '').replace(',', '.').trim();
      const parsed = parseFloat(clean);
      return Number.isFinite(parsed) && !Object.is(parsed, -0) && parsed > 0 ? parsed : 0;
    }
    return 0;
  };

  const safeAlt = Math.round(parseNum(altitudeMeters));

  if (safeAlt <= 0) {
    return {
      altitudeMeters: null,
      band: 'unknown',
      shgClassification: 'Unspecified',
      beanDensity: 'unknown',
      acidityPotential: 'unknown',
      bandLabelPl: 'Nieznana wysokość',
      bandLabelEn: 'Unknown Altitude',
      sensoryProfilePl: 'Brak danych o wysokości uprawy — standardowy profil zbalansowany.',
      sensoryProfileEn: 'No altitude data — standard balanced profile.',
      roastingAndBrewingAdvicePl: 'Dostosuj parametry parzenia (90–93°C) na podstawie stopnia palenia i metody obróbki.',
      roastingAndBrewingAdviceEn: 'Adjust brewing parameters (90–93°C) based on roast level and processing method.',
    };
  }

  if (safeAlt > 1800) {
    return {
      altitudeMeters: safeAlt,
      band: 'very_high',
      shgClassification: 'Strictly High Grown (SHG / SHB)',
      beanDensity: 'very_high',
      acidityPotential: 'vibrant_complex',
      bandLabelPl: 'Bardzo wysoka (> 1800 m n.p.m.)',
      bandLabelEn: 'Very High (> 1800 m a.s.l.)',
      sensoryProfilePl: 'Wybitna, złożona kwasowość owocowa (cytrusy, owoce pestkowe), intensywne aromaty kwiatowe, duża gęstość ziaren i czysty, elegancki profil.',
      sensoryProfileEn: 'Exceptional, complex fruit acidity (citrus, stone fruits), intense florals, high bean density and elegant clean cup.',
      roastingAndBrewingAdvicePl: 'Gęste ziarna wymagają wyższej temperatury ekstrakcji (93–96°C) oraz drobniejszego przemiału, by wydobyć pełnię słodyczy.',
      roastingAndBrewingAdviceEn: 'Dense beans benefit from higher brew temperature (93–96°C) and finer grind to extract full sweetness.',
    };
  }

  if (safeAlt >= 1400) {
    return {
      altitudeMeters: safeAlt,
      band: 'high',
      shgClassification: 'High Grown (HG / HB)',
      beanDensity: 'high',
      acidityPotential: 'bright_balanced',
      bandLabelPl: 'Wysoka (1400–1800 m n.p.m.)',
      bandLabelEn: 'High (1400–1800 m a.s.l.)',
      sensoryProfilePl: 'Zrównoważona jasna kwasowość, nuty karmelu, czekolady i owoców leśnych, krągłe body.',
      sensoryProfileEn: 'Balanced bright acidity, notes of caramel, chocolate, and berries, round body.',
      roastingAndBrewingAdvicePl: 'Wszechstronny profil parzenia (91–94°C) — doskonałe zarówno do metod przelewowych (V60/Chemex), jak i nowoczesnego espresso.',
      roastingAndBrewingAdviceEn: 'Versatile brewing profile (91–94°C) — excels in both pour over (V60/Chemex) and modern espresso.',
    };
  }

  if (safeAlt >= 1000) {
    return {
      altitudeMeters: safeAlt,
      band: 'medium',
      shgClassification: 'Medium Grown / Standard',
      beanDensity: 'moderate',
      acidityPotential: 'mild_sweet',
      bandLabelPl: 'Średnia (1000–1399 m n.p.m.)',
      bandLabelEn: 'Medium (1000–1399 m a.s.l.)',
      sensoryProfilePl: 'Łagodna, niska kwasowość, dominacja nut orzechowych, kakaowych i melasy, gęstsze body.',
      sensoryProfileEn: 'Mild, sweet low acidity, dominant nutty, cocoa, and molasses notes, fuller body.',
      roastingAndBrewingAdvicePl: 'Podatniejsze na ekstrakcję — woda 88–92°C, świetna baza pod tradycyjne espresso, kawiarkę i kawy mleczne.',
      roastingAndBrewingAdviceEn: 'More soluble beans — water 88–92°C, great base for traditional espresso, Moka pot, and milk drinks.',
    };
  }

  return {
    altitudeMeters: safeAlt,
    band: 'low',
    shgClassification: 'Low Grown / Prime',
    beanDensity: 'low',
    acidityPotential: 'low_muted',
    bandLabelPl: 'Niska (< 1000 m n.p.m.)',
    bandLabelEn: 'Low (< 1000 m a.s.l.)',
    sensoryProfilePl: 'Znikoma kwasowość, nuty ziemiste, przyprawowe i ciemnego karmelu, miękkie i ciężkie body.',
    sensoryProfileEn: 'Low acidity, earthy, spicy, and dark caramel notes, soft and heavy body.',
    roastingAndBrewingAdvicePl: 'Bardzo porowate ziarna — niższa temperatura (84–88°C), grubszy przemiał, by uniknąć goryczy i cierpkości.',
    roastingAndBrewingAdviceEn: 'Porous beans — lower temp (84–88°C), coarser grind to avoid bitterness and astringency.',
  };
}

export interface TeaCategoryGuide {
  id: string;
  name: string;
  traditionalName: string;
  oxidationRangePercent: string;
  killGreenMethod: string;
  waterTemperatureCelsius: number;
  recommendedVessel: string;
  sensoryProfile: string;
  famousVarieties: string[];
  famousRegions: string[];
  healthAttributes: string;
  description: string;
}

const TEA_RECOMMENDED_VESSELS: Record<string, { pl: string; en: string }> = {
  'tea-white': {
    pl: 'Gaiwan porcelanowy lub szklany czajniczek',
    en: 'Porcelain Gaiwan or glass teapot',
  },
  'tea-green': {
    pl: 'Kyusu z bocznym uchwytem, Shiboridashi lub czara szklana',
    en: 'Side-handle Kyusu, Shiboridashi, or glass pitcher',
  },
  'tea-yellow': {
    pl: 'Porcelanowy Gaiwan lub wysoka szklanka',
    en: 'Porcelain Gaiwan or tall glass tumbler',
  },
  'tea-oolong': {
    pl: 'Czajniczek z gliny Yixing (Zisha) lub cienkościenny Gaiwan',
    en: 'Yixing clay teapot (Zisha) or thin-walled Gaiwan',
  },
  'tea-black': {
    pl: 'Czajniczek ceramiczny lub porcelanowy Gaiwan',
    en: 'Ceramic teapot or porcelain Gaiwan',
  },
  'tea-puerh': {
    pl: 'Grubościenny czajniczek Yixing (Zisha / Jianshui)',
    en: 'Thick-walled Yixing clay teapot (Zisha / Jianshui)',
  },
};

/**
 * Zwraca kompendium i rekomendowane naczynie dla wybranej kategorii herbaty rzemieślniczej.
 */
export function getTeaCategoryGuide(
  idOrQuery: string | undefined | null,
  lang: 'pl' | 'en' | string = 'pl'
): TeaCategoryGuide | null {
  if (!idOrQuery || typeof idOrQuery !== 'string') return null;
  const tea = findTeaCategoryById(idOrQuery);
  if (!tea) return null;

  const isEn =
    typeof lang === 'string' &&
    (lang.trim().toLowerCase() === 'en' || lang.trim().toLowerCase().startsWith('en'));

  const vessel = TEA_RECOMMENDED_VESSELS[tea.id] || {
    pl: 'Gaiwan porcelanowy lub czajniczek ceramiczny',
    en: 'Porcelain Gaiwan or ceramic teapot',
  };

  return {
    id: tea.id,
    name: isEn ? (tea.nameEn || tea.namePl) : (tea.namePl || tea.nameEn),
    traditionalName: tea.traditionalName,
    oxidationRangePercent: tea.oxidationRangePercent,
    killGreenMethod: tea.killGreenMethod,
    waterTemperatureCelsius: tea.waterTemperatureCelsius,
    recommendedVessel: isEn ? vessel.en : vessel.pl,
    sensoryProfile: isEn ? tea.sensoryProfileEn : tea.sensoryProfilePl,
    famousVarieties: isEn
      ? tea.famousVarietiesEn && tea.famousVarietiesEn.length > 0
        ? tea.famousVarietiesEn
        : tea.famousVarietiesPl
      : tea.famousVarietiesPl,
    famousRegions: tea.famousRegions,
    healthAttributes: tea.healthAttributesPl,
    description: isEn ? tea.descriptionEn : tea.descriptionPl,
  };
}

export interface CoffeeProcessComparisonItem {
  id: string;
  name: string;
  processType: string;
  sensoryImpact: string;
  waterConsumption: string;
  dryingDurationDays: string;
  keyNotes: string[];
}

export interface CoffeeProcessComparison {
  processA: CoffeeProcessComparisonItem;
  processB: CoffeeProcessComparisonItem;
  sharedNotes: string[];
  distinctNotesA: string[];
  distinctNotesB: string[];
  comparisonSummaryPl: string;
  comparisonSummaryEn: string;
}

/**
 * Porównuje dwie metody obróbki kawy (np. Washed vs Natural, Anaerobic vs Honey)
 * zestawiając ich parametry technologiczne, profile sensoryczne i nuty smakowe.
 */
export function compareCoffeeProcesses(
  processAIdOrQuery: string | undefined | null,
  processBIdOrQuery: string | undefined | null,
  lang: 'pl' | 'en' | string = 'pl'
): CoffeeProcessComparison | null {
  if (!processAIdOrQuery || !processBIdOrQuery) return null;
  const guideA = getCoffeeProcessGuide(processAIdOrQuery, lang);
  const guideB = getCoffeeProcessGuide(processBIdOrQuery, lang);
  if (!guideA || !guideB) return null;

  const notesA = Array.isArray(guideA.keyNotes) ? guideA.keyNotes : [];
  const notesB = Array.isArray(guideB.keyNotes) ? guideB.keyNotes : [];

  const lowerB = new Set(notesB.map((n) => n.toLowerCase().trim()));
  const lowerA = new Set(notesA.map((n) => n.toLowerCase().trim()));

  const sharedNotes = notesA.filter((n) => lowerB.has(n.toLowerCase().trim()));
  const distinctNotesA = notesA.filter((n) => !lowerB.has(n.toLowerCase().trim()));
  const distinctNotesB = notesB.filter((n) => !lowerA.has(n.toLowerCase().trim()));

  const processA: CoffeeProcessComparisonItem = {
    id: guideA.id,
    name: guideA.name,
    processType: guideA.processType,
    sensoryImpact: guideA.sensoryImpact,
    waterConsumption: guideA.waterConsumption,
    dryingDurationDays: guideA.dryingDurationDays,
    keyNotes: notesA,
  };

  const processB: CoffeeProcessComparisonItem = {
    id: guideB.id,
    name: guideB.name,
    processType: guideB.processType,
    sensoryImpact: guideB.sensoryImpact,
    waterConsumption: guideB.waterConsumption,
    dryingDurationDays: guideB.dryingDurationDays,
    keyNotes: notesB,
  };

  const comparisonSummaryPl = `Porównanie obróbki ${guideA.name} i ${guideB.name}: ${guideA.name} (${guideA.sensoryImpact}) vs ${guideB.name} (${guideB.sensoryImpact}).`;
  const comparisonSummaryEn = `Comparison between ${guideA.name} and ${guideB.name}: ${guideA.name} (${guideA.sensoryImpact}) vs ${guideB.name} (${guideB.sensoryImpact}).`;

  return {
    processA,
    processB,
    sharedNotes,
    distinctNotesA,
    distinctNotesB,
    comparisonSummaryPl,
    comparisonSummaryEn,
  };
}

export interface CoffeeVarietyComparisonItem {
  id: string;
  name: string;
  geneticLineage: string;
  acidity: string;
  body: string;
  sweetness: string;
  sensoryProfile: string;
  keyNotes: string[];
}

export interface CoffeeVarietyComparison {
  varietyA: CoffeeVarietyComparisonItem;
  varietyB: CoffeeVarietyComparisonItem;
  sharedNotes: string[];
  distinctNotesA: string[];
  distinctNotesB: string[];
  comparisonSummaryPl: string;
  comparisonSummaryEn: string;
}

/**
 * Porównuje dwie odmiany botaniczne kawy (np. Geisha vs Bourbon, Typica vs SL28)
 * zestawiając ich linie genetyczne, kwasowość, słodycz i profile sensoryczne.
 */
export function compareCoffeeVarieties(
  varietyAIdOrQuery: string | undefined | null,
  varietyBIdOrQuery: string | undefined | null,
  lang: 'pl' | 'en' | string = 'pl'
): CoffeeVarietyComparison | null {
  if (!varietyAIdOrQuery || !varietyBIdOrQuery) return null;
  const guideA = getCoffeeVarietyGuide(varietyAIdOrQuery, lang);
  const guideB = getCoffeeVarietyGuide(varietyBIdOrQuery, lang);
  if (!guideA || !guideB) return null;

  const notesA = Array.isArray(guideA.keyNotes) ? guideA.keyNotes : [];
  const notesB = Array.isArray(guideB.keyNotes) ? guideB.keyNotes : [];

  const lowerB = new Set(notesB.map((n) => n.toLowerCase().trim()));
  const lowerA = new Set(notesA.map((n) => n.toLowerCase().trim()));

  const sharedNotes = notesA.filter((n) => lowerB.has(n.toLowerCase().trim()));
  const distinctNotesA = notesA.filter((n) => !lowerB.has(n.toLowerCase().trim()));
  const distinctNotesB = notesB.filter((n) => !lowerA.has(n.toLowerCase().trim()));

  const varietyA: CoffeeVarietyComparisonItem = {
    id: guideA.id,
    name: guideA.name,
    geneticLineage: guideA.geneticLineage,
    acidity: guideA.acidity,
    body: guideA.body,
    sweetness: guideA.sweetness,
    sensoryProfile: guideA.sensoryProfile,
    keyNotes: notesA,
  };

  const varietyB: CoffeeVarietyComparisonItem = {
    id: guideB.id,
    name: guideB.name,
    geneticLineage: guideB.geneticLineage,
    acidity: guideB.acidity,
    body: guideB.body,
    sweetness: guideB.sweetness,
    sensoryProfile: guideB.sensoryProfile,
    keyNotes: notesB,
  };

  const comparisonSummaryPl = `Porównanie odmian ${guideA.name} i ${guideB.name}: ${guideA.name} (${guideA.acidity} kwasowość, ${guideA.sweetness} słodycz) vs ${guideB.name} (${guideB.acidity} kwasowość, ${guideB.sweetness} słodycz).`;
  const comparisonSummaryEn = `Comparison between ${guideA.name} and ${guideB.name}: ${guideA.name} (${guideA.acidity} acidity, ${guideA.sweetness} sweetness) vs ${guideB.name} (${guideB.acidity} acidity, ${guideB.sweetness} sweetness).`;

  return {
    varietyA,
    varietyB,
    sharedNotes,
    distinctNotesA,
    distinctNotesB,
    comparisonSummaryPl,
    comparisonSummaryEn,
  };
}





export interface CoffeeOriginComparisonItem {
  id: string;
  country: string;
  countryCode: string;
  typicalAltitudeMeters: string;
  mainVarieties: string[];
  flavorProfile: string;
  keyNotes: string[];
}

export interface CoffeeOriginComparison {
  originA: CoffeeOriginComparisonItem;
  originB: CoffeeOriginComparisonItem;
  sharedNotes: string[];
  distinctNotesA: string[];
  distinctNotesB: string[];
  altitudeDeltaMeters: number;
  comparisonSummaryPl: string;
  comparisonSummaryEn: string;
}

function parseOriginAltitudeRange(altStr: unknown): { min: number; max: number; avg: number } {
  if (!altStr || typeof altStr !== 'string') return { min: 0, max: 0, avg: 0 };
  const matches = altStr.match(/\d[\d\s]*\d|\d+/g);
  if (!matches || matches.length === 0) return { min: 0, max: 0, avg: 0 };
  const nums = matches
    .map((m) => parseInt(m.replace(/\s+/g, ''), 10))
    .filter((n) => Number.isFinite(n) && n > 0);
  if (nums.length === 0) return { min: 0, max: 0, avg: 0 };
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  return { min, max, avg: (min + max) / 2 };
}

/**
 * Porównuje dwa kraje pochodzenia kawy (np. Etiopia vs Kolumbia, Kenia vs Brazylia)
 * zestawiając ich terroir, wysokość upraw, odmiany i profile sensoryczne.
 */
export function compareCoffeeOrigins(
  originAIdOrCode: string | undefined | null,
  originBIdOrCode: string | undefined | null,
  lang: 'pl' | 'en' | string = 'pl'
): CoffeeOriginComparison | null {
  if (!originAIdOrCode || !originBIdOrCode) return null;
  const guideA = getCoffeeOriginGuide(originAIdOrCode, lang);
  const guideB = getCoffeeOriginGuide(originBIdOrCode, lang);
  if (!guideA || !guideB) return null;

  const notesA = Array.isArray(guideA.keyNotes) ? guideA.keyNotes : [];
  const notesB = Array.isArray(guideB.keyNotes) ? guideB.keyNotes : [];

  const lowerB = new Set(notesB.map((n) => n.toLowerCase().trim()));
  const lowerA = new Set(notesA.map((n) => n.toLowerCase().trim()));

  const sharedNotes = notesA.filter((n) => lowerB.has(n.toLowerCase().trim()));
  const distinctNotesA = notesA.filter((n) => !lowerB.has(n.toLowerCase().trim()));
  const distinctNotesB = notesB.filter((n) => !lowerA.has(n.toLowerCase().trim()));

  const altA = parseOriginAltitudeRange(guideA.typicalAltitudeMeters);
  const altB = parseOriginAltitudeRange(guideB.typicalAltitudeMeters);
  const altitudeDeltaMeters = Math.round(Math.abs(altA.avg - altB.avg));

  const originA: CoffeeOriginComparisonItem = {
    id: guideA.id,
    country: guideA.country,
    countryCode: guideA.countryCode,
    typicalAltitudeMeters: String(guideA.typicalAltitudeMeters || ''),
    mainVarieties: Array.isArray(guideA.mainVarieties) ? guideA.mainVarieties : [],
    flavorProfile: guideA.flavorProfile,
    keyNotes: notesA,
  };

  const originB: CoffeeOriginComparisonItem = {
    id: guideB.id,
    country: guideB.country,
    countryCode: guideB.countryCode,
    typicalAltitudeMeters: String(guideB.typicalAltitudeMeters || ''),
    mainVarieties: Array.isArray(guideB.mainVarieties) ? guideB.mainVarieties : [],
    flavorProfile: guideB.flavorProfile,
    keyNotes: notesB,
  };

  const comparisonSummaryPl = `Porównanie krajów pochodzenia ${guideA.country} i ${guideB.country}: ${guideA.country} (${guideA.flavorProfile}) vs ${guideB.country} (${guideB.flavorProfile}). Różnica średniej wysokości upraw: ~${altitudeDeltaMeters}m.`;
  const comparisonSummaryEn = `Comparison between origins ${guideA.country} and ${guideB.country}: ${guideA.country} (${guideA.flavorProfile}) vs ${guideB.country} (${guideB.flavorProfile}). Average altitude delta: ~${altitudeDeltaMeters}m.`;

  return {
    originA,
    originB,
    sharedNotes,
    distinctNotesA,
    distinctNotesB,
    altitudeDeltaMeters,
    comparisonSummaryPl,
    comparisonSummaryEn,
  };
}


// ============================================================================
// TASK-P98-06-TRE: Tea Category Comparator (Porównywarka kategorii herbat)
// ============================================================================

export interface TeaCategoryComparisonItem {
  id: string;
  name: string;
  traditionalName: string;
  oxidationRangePercent: string;
  waterTemperatureCelsius: number;
  recommendedVessel: string;
  sensoryProfile: string;
  famousVarieties: string[];
}

export interface TeaCategoryComparison {
  categoryA: TeaCategoryComparisonItem;
  categoryB: TeaCategoryComparisonItem;
  temperatureDeltaCelsius: number;
  sharedVarieties: string[];
  distinctVarietiesA: string[];
  distinctVarietiesB: string[];
  comparisonSummaryPl: string;
  comparisonSummaryEn: string;
}

/**
 * Porównuje dwie kategorie herbaty (np. zielona vs pu-erh, oolong vs biała)
 * zestawiając poziom oksydacji, temperaturę parzenia, rekomendowane naczynie i profil sensoryczny.
 */
export function compareTeaCategories(
  categoryAId: string | undefined | null,
  categoryBId: string | undefined | null,
  lang: 'pl' | 'en' | string = 'pl'
): TeaCategoryComparison | null {
  if (!categoryAId || !categoryBId) return null;
  const guideA = getTeaCategoryGuide(categoryAId, lang);
  const guideB = getTeaCategoryGuide(categoryBId, lang);
  if (!guideA || !guideB) return null;

  const varsA = Array.isArray(guideA.famousVarieties) ? guideA.famousVarieties : [];
  const varsB = Array.isArray(guideB.famousVarieties) ? guideB.famousVarieties : [];

  const lowerB = new Set(varsB.map((v) => v.toLowerCase().trim()));
  const lowerA = new Set(varsA.map((v) => v.toLowerCase().trim()));

  const sharedVarieties = varsA.filter((v) => lowerB.has(v.toLowerCase().trim()));
  const distinctVarietiesA = varsA.filter((v) => !lowerB.has(v.toLowerCase().trim()));
  const distinctVarietiesB = varsB.filter((v) => !lowerA.has(v.toLowerCase().trim()));

  const tempA =
    typeof guideA.waterTemperatureCelsius === 'number' && Number.isFinite(guideA.waterTemperatureCelsius)
      ? guideA.waterTemperatureCelsius
      : 0;
  const tempB =
    typeof guideB.waterTemperatureCelsius === 'number' && Number.isFinite(guideB.waterTemperatureCelsius)
      ? guideB.waterTemperatureCelsius
      : 0;
  const temperatureDeltaCelsius = Math.abs(tempA - tempB);

  const categoryA: TeaCategoryComparisonItem = {
    id: guideA.id,
    name: guideA.name,
    traditionalName: guideA.traditionalName,
    oxidationRangePercent: guideA.oxidationRangePercent,
    waterTemperatureCelsius: guideA.waterTemperatureCelsius,
    recommendedVessel: guideA.recommendedVessel,
    sensoryProfile: guideA.sensoryProfile,
    famousVarieties: varsA,
  };

  const categoryB: TeaCategoryComparisonItem = {
    id: guideB.id,
    name: guideB.name,
    traditionalName: guideB.traditionalName,
    oxidationRangePercent: guideB.oxidationRangePercent,
    waterTemperatureCelsius: guideB.waterTemperatureCelsius,
    recommendedVessel: guideB.recommendedVessel,
    sensoryProfile: guideB.sensoryProfile,
    famousVarieties: varsB,
  };

  const comparisonSummaryPl = `Porównanie kategorii herbat: ${guideA.name} (${guideA.traditionalName}, oksydacja: ${guideA.oxidationRangePercent}, ${guideA.waterTemperatureCelsius}°C) vs ${guideB.name} (${guideB.traditionalName}, oksydacja: ${guideB.oxidationRangePercent}, ${guideB.waterTemperatureCelsius}°C). Różnica zalecanej temperatury: ${temperatureDeltaCelsius}°C.`;
  const comparisonSummaryEn = `Comparison between tea categories: ${guideA.name} (${guideA.traditionalName}, oxidation: ${guideA.oxidationRangePercent}, ${guideA.waterTemperatureCelsius}°C) vs ${guideB.name} (${guideB.traditionalName}, oxidation: ${guideB.oxidationRangePercent}, ${guideB.waterTemperatureCelsius}°C). Water temperature delta: ${temperatureDeltaCelsius}°C.`;

  return {
    categoryA,
    categoryB,
    temperatureDeltaCelsius,
    sharedVarieties,
    distinctVarietiesA,
    distinctVarietiesB,
    comparisonSummaryPl,
    comparisonSummaryEn,
  };
}
