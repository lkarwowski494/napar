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
  if (!query || !query.trim()) return COFFEE_VARIETIES;
  const q = query.toLowerCase().trim();
  return COFFEE_VARIETIES.filter((v) =>
    v.name.toLowerCase().includes(q) ||
    v.nativeRegion.toLowerCase().includes(q) ||
    v.keyNotesPl.some((k) => k.toLowerCase().includes(q)) ||
    v.keyNotesEn.some((k) => k.toLowerCase().includes(q)) ||
    v.sensoryProfilePl.toLowerCase().includes(q) ||
    v.sensoryProfileEn.toLowerCase().includes(q)
  );
}

export function searchCoffeeProcesses(query: string): CoffeeProcessInfo[] {
  if (!query || !query.trim()) return COFFEE_PROCESSES;
  const q = query.toLowerCase().trim();
  return COFFEE_PROCESSES.filter((p) =>
    p.name.toLowerCase().includes(q) ||
    p.processType.toLowerCase().includes(q) ||
    p.keyNotesPl.some((k) => k.toLowerCase().includes(q)) ||
    p.keyNotesEn.some((k) => k.toLowerCase().includes(q)) ||
    p.sensoryImpactPl.toLowerCase().includes(q) ||
    p.sensoryImpactEn.toLowerCase().includes(q) ||
    p.descriptionPl.toLowerCase().includes(q) ||
    p.descriptionEn.toLowerCase().includes(q)
  );
}

export function searchCoffeeOrigins(query: string): CoffeeOriginInfo[] {
  if (!query || !query.trim()) return COFFEE_ORIGINS;
  const q = query.toLowerCase().trim();
  return COFFEE_ORIGINS.filter((o) =>
    o.country.toLowerCase().includes(q) ||
    (o.countryEn && o.countryEn.toLowerCase().includes(q)) ||
    o.primaryRegions.some((r) => r.toLowerCase().includes(q)) ||
    o.mainVarieties.some((v) => v.toLowerCase().includes(q)) ||
    o.flavorProfilePl.toLowerCase().includes(q) ||
    o.flavorProfileEn.toLowerCase().includes(q) ||
    o.keyNotesPl.some((k) => k.toLowerCase().includes(q)) ||
    o.keyNotesEn.some((k) => k.toLowerCase().includes(q))
  );
}

export function searchTeaCategories(query: string): TeaCategoryInfo[] {
  if (!query || !query.trim()) return TEA_CATEGORIES;
  const q = query.toLowerCase().trim();
  return TEA_CATEGORIES.filter((t) =>
    t.namePl.toLowerCase().includes(q) ||
    t.nameEn.toLowerCase().includes(q) ||
    t.traditionalName.toLowerCase().includes(q) ||
    t.famousVarietiesPl.some((v) => v.toLowerCase().includes(q)) ||
    (t.famousVarietiesEn && t.famousVarietiesEn.some((v) => v.toLowerCase().includes(q))) ||
    t.famousRegions.some((r) => r.toLowerCase().includes(q)) ||
    t.sensoryProfilePl.toLowerCase().includes(q) ||
    t.sensoryProfileEn.toLowerCase().includes(q)
  );
}

export function findCoffeeVarietyById(id: string): CoffeeVarietyInfo | undefined {
  return COFFEE_VARIETIES.find((v) => v.id === id);
}

export function findCoffeeProcessById(id: string): CoffeeProcessInfo | undefined {
  return COFFEE_PROCESSES.find((p) => p.id === id);
}

export function findCoffeeOriginById(id: string): CoffeeOriginInfo | undefined {
  return COFFEE_ORIGINS.find((o) => o.id === id);
}

export function findTeaCategoryById(id: string): TeaCategoryInfo | undefined {
  return TEA_CATEGORIES.find((t) => t.id === id);
}

export function getKnowledgeDescription(id: string, lang: 'pl' | 'en' = 'pl'): string {
  const loc = getLocale(id);
  return lang === 'en' ? loc.descriptionEn : loc.descriptionPl;
}

export function getKnowledgeSensoryProfile(id: string, lang: 'pl' | 'en' = 'pl'): string {
  const loc = getLocale(id);
  if (loc.sensoryProfilePl || loc.sensoryProfileEn) {
    return (lang === 'en' ? loc.sensoryProfileEn : loc.sensoryProfilePl) || '';
  }
  if (loc.sensoryImpactPl || loc.sensoryImpactEn) {
    return (lang === 'en' ? loc.sensoryImpactEn : loc.sensoryImpactPl) || '';
  }
  if (loc.flavorProfilePl || loc.flavorProfileEn) {
    return (lang === 'en' ? loc.flavorProfileEn : loc.flavorProfilePl) || '';
  }
  return '';
}
