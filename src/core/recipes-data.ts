// ============================================================================
// Napar (Steepwise) — Master Recipes Data (BR-MAG-005)
// 12 verified master recipes for coffee and artisan tea
// ============================================================================

export interface RecipeStep {
  stepNumber: number;
  namePl: string;
  targetWaterGrams: number;
  durationSeconds: number;
  instructionPl: string;
}

export interface MasterRecipe {
  id: string;
  type: 'COFFEE' | 'TEA';
  method: string;
  name: string;
  author: string;
  coffeeOrTeaDoseGrams: number;
  waterWeightGrams: number;
  waterTemperatureCelsius: number;
  grindSettingDescriptionPl: string;
  recommendedRatio: number;
  steps: RecipeStep[];
}

export const MASTER_RECIPES: MasterRecipe[] = [
  {
    id: 'v60-kasuya-4-6',
    type: 'COFFEE',
    method: 'V60',
    name: 'V60 — Metoda 4:6',
    author: 'Tetsu Kasuya (Mistrz Świata Brewers Cup 2016)',
    coffeeOrTeaDoseGrams: 20.0,
    waterWeightGrams: 300.0,
    waterTemperatureCelsius: 92.0,
    grindSettingDescriptionPl: 'Grubo mielona (np. 28-30 klików Comandante)',
    recommendedRatio: 15.0,
    steps: [
      { stepNumber: 1, namePl: 'Zalanie 1 (Preinfuzja)', targetWaterGrams: 50.0, durationSeconds: 45, instructionPl: 'Zalej 50g wody spiralnym ruchem, regulując kwasowość.' },
      { stepNumber: 2, namePl: 'Zalanie 2 (Słodycz)', targetWaterGrams: 120.0, durationSeconds: 45, instructionPl: 'Zalej kolejne 70g wody (do 120g łącznie), budując słodycz.' },
      { stepNumber: 3, namePl: 'Zalanie 3 (Moc / Ciało)', targetWaterGrams: 180.0, durationSeconds: 45, instructionPl: 'Zalej 60g wody (do 180g) w równym tempie.' },
      { stepNumber: 4, namePl: 'Zalanie 4 (Moc / Ciało)', targetWaterGrams: 240.0, durationSeconds: 45, instructionPl: 'Zalej 60g wody (do 240g).' },
      { stepNumber: 5, namePl: 'Zalanie 5 (Finisz)', targetWaterGrams: 300.0, durationSeconds: 45, instructionPl: 'Ostatnie zalanie do 300g, pozwól wodzie spłynąć do końca.' },
    ],
  },
  {
    id: 'v60-hoffmann-single',
    type: 'COFFEE',
    method: 'V60',
    name: 'V60 — Single Cup Technique',
    author: 'James Hoffmann',
    coffeeOrTeaDoseGrams: 15.0,
    waterWeightGrams: 250.0,
    waterTemperatureCelsius: 95.0,
    grindSettingDescriptionPl: 'Średnio-drobno (np. 18-20 klików Comandante)',
    recommendedRatio: 16.67,
    steps: [
      { stepNumber: 1, namePl: 'Preinfuzja (Blooming)', targetWaterGrams: 50.0, durationSeconds: 45, instructionPl: 'Zalej 50g wody i delikatnie zakręć dripperem (swirl).' },
      { stepNumber: 2, namePl: 'Zalanie główne', targetWaterGrams: 150.0, durationSeconds: 30, instructionPl: 'Spokojnym, ciągłym strumieniem dolej wodę do 150g.' },
      { stepNumber: 3, namePl: 'Dopełnienie i spływ', targetWaterGrams: 250.0, durationSeconds: 65, instructionPl: 'Dolej do 250g, delikatny swirl na koniec i czekaj na spływ.' },
    ],
  },
  {
    id: 'aeropress-inverted-championship',
    type: 'COFFEE',
    method: 'AEROPRESS',
    name: 'AeroPress — Odwrócony (Inverted Champion)',
    author: 'World AeroPress Championship',
    coffeeOrTeaDoseGrams: 18.0,
    waterWeightGrams: 200.0,
    waterTemperatureCelsius: 85.0,
    grindSettingDescriptionPl: 'Średnio mielona (np. 22-24 kliki Comandante)',
    recommendedRatio: 11.1,
    steps: [
      { stepNumber: 1, namePl: 'Zalanie i mieszanie', targetWaterGrams: 100.0, durationSeconds: 30, instructionPl: 'Wlej 100g wody, energicznie zamieszaj 10 razy.' },
      { stepNumber: 2, namePl: 'Dopełnienie i infuzja', targetWaterGrams: 200.0, durationSeconds: 60, instructionPl: 'Dopełnij do 200g, załóż sitko z przepłukanym filtrem.' },
      { stepNumber: 3, namePl: 'Obrócenie i przeciskanie', targetWaterGrams: 200.0, durationSeconds: 30, instructionPl: 'Obróć na serwer i powoli przeciskaj przez 30 sekund aż do syknięcia.' },
    ],
  },
  {
    id: 'french-press-hoffmann',
    type: 'COFFEE',
    method: 'FRENCH_PRESS',
    name: 'French Press — Czysty Napar',
    author: 'James Hoffmann',
    coffeeOrTeaDoseGrams: 30.0,
    waterWeightGrams: 500.0,
    waterTemperatureCelsius: 98.0,
    grindSettingDescriptionPl: 'Średnio-grubo (np. 25-27 klików Comandante)',
    recommendedRatio: 16.67,
    steps: [
      { stepNumber: 1, namePl: 'Zalanie całości', targetWaterGrams: 500.0, durationSeconds: 240, instructionPl: 'Zalej 500g wrzątku, nie mieszaj i nie zakładaj tłoka. Odczekaj 4 minuty.' },
      { stepNumber: 2, namePl: 'Przełamanie kożucha', targetWaterGrams: 500.0, durationSeconds: 60, instructionPl: 'Zamieszaj łyżką wierzch, zbierz pianę i pył z powierzchni.' },
      { stepNumber: 3, namePl: 'Sedymentacja cząstek', targetWaterGrams: 500.0, durationSeconds: 300, instructionPl: 'Czekaj minimum 5 minut aż drobinki opadną na dno. Nie dociskaj tłoka do dna!' },
    ],
  },
  {
    id: 'chemex-classic',
    type: 'COFFEE',
    method: 'CHEMEX',
    name: 'Chemex — Czysty i Soczysty',
    author: 'Klasyk Specialty',
    coffeeOrTeaDoseGrams: 30.0,
    waterWeightGrams: 500.0,
    waterTemperatureCelsius: 94.0,
    grindSettingDescriptionPl: 'Grubo mielona (np. 28-30 klików Comandante)',
    recommendedRatio: 16.67,
    steps: [
      { stepNumber: 1, namePl: 'Preinfuzja', targetWaterGrams: 100.0, durationSeconds: 45, instructionPl: 'Zalej 100g wody, upewnij się, że cała kawa jest nawilżona.' },
      { stepNumber: 2, namePl: 'Zalanie 1', targetWaterGrams: 300.0, durationSeconds: 60, instructionPl: 'Spokojnym ruchem spiralnym dolej do 300g.' },
      { stepNumber: 3, namePl: 'Zalanie 2 i spływ', targetWaterGrams: 500.0, durationSeconds: 90, instructionPl: 'Dolej do 500g, pilnuj, by poziom wody nie dotykał krawędzi papieru.' },
    ],
  },
  {
    id: 'gongfu-oolong-da-hong-pao',
    type: 'TEA',
    method: 'GONGFU',
    name: 'Gongfu Cha — Wulong Skalny (Da Hong Pao)',
    author: 'Tradycja Wuyi Shan',
    coffeeOrTeaDoseGrams: 7.0,
    waterWeightGrams: 110.0,
    waterTemperatureCelsius: 96.0,
    grindSettingDescriptionPl: 'Całe zwinięte liście',
    recommendedRatio: 15.7,
    steps: [
      { stepNumber: 1, namePl: 'Budzenie liści (Odpłukanie)', targetWaterGrams: 110.0, durationSeconds: 5, instructionPl: 'Szybkie zalanie i natychmiastowe zlanie do czarki zlewowej.' },
      { stepNumber: 2, namePl: 'Parzenie 1', targetWaterGrams: 110.0, durationSeconds: 15, instructionPl: 'Pierwsza właściwa infuzja — 15 sekund.' },
      { stepNumber: 3, namePl: 'Parzenie 2', targetWaterGrams: 110.0, durationSeconds: 20, instructionPl: 'Druga infuzja — 20 sekund.' },
      { stepNumber: 4, namePl: 'Parzenie 3', targetWaterGrams: 110.0, durationSeconds: 25, instructionPl: 'Trzecia infuzja — 25 sekund.' },
      { stepNumber: 5, namePl: 'Parzenie 4', targetWaterGrams: 110.0, durationSeconds: 35, instructionPl: 'Czwarta infuzja — 35 sekund.' },
    ],
  },
  {
    id: 'gongfu-sheng-puerh',
    type: 'TEA',
    method: 'GONGFU',
    name: 'Gongfu Cha — Sheng Puerh (Młody)',
    author: 'Tradycja Yunnan',
    coffeeOrTeaDoseGrams: 6.0,
    waterWeightGrams: 100.0,
    waterTemperatureCelsius: 95.0,
    grindSettingDescriptionPl: 'Liście prasowane rozkruszone',
    recommendedRatio: 16.67,
    steps: [
      { stepNumber: 1, namePl: 'Przepłukanie', targetWaterGrams: 100.0, durationSeconds: 10, instructionPl: 'Zalej wrzątkiem, otwórz sprasowane liście i zlej.' },
      { stepNumber: 2, namePl: 'Parzenie 1', targetWaterGrams: 100.0, durationSeconds: 12, instructionPl: 'Szybkie zalanie — 12 sekund, czysty aromat ziół i miodu.' },
      { stepNumber: 3, namePl: 'Parzenie 2', targetWaterGrams: 100.0, durationSeconds: 15, instructionPl: 'Druga infuzja — 15 sekund.' },
      { stepNumber: 4, namePl: 'Parzenie 3', targetWaterGrams: 100.0, durationSeconds: 20, instructionPl: 'Trzecia infuzja — 20 sekund.' },
    ],
  },
  {
    id: 'sencha-japan-traditional',
    type: 'TEA',
    method: 'WESTERN',
    name: 'Sencha Japońska — Rytuał Kyusu',
    author: 'Japońska Ceremonia Herbaty',
    coffeeOrTeaDoseGrams: 4.0,
    waterWeightGrams: 200.0,
    waterTemperatureCelsius: 75.0,
    grindSettingDescriptionPl: 'Igłowe liście parowane',
    recommendedRatio: 50.0,
    steps: [
      { stepNumber: 1, namePl: 'Pierwsza infuzja', targetWaterGrams: 200.0, durationSeconds: 60, instructionPl: 'Zalej wodą 75°C, nie wstrząsaj czajniczkiem, parz przez 60 sekund.' },
      { stepNumber: 2, namePl: 'Druga infuzja', targetWaterGrams: 200.0, durationSeconds: 30, instructionPl: 'Woda 80°C, parzenie krótsze — 30 sekund.' },
    ],
  },
  {
    id: 'white-tea-pai-mu-tan',
    type: 'TEA',
    method: 'WESTERN',
    name: 'Biała Herbata — Pai Mu Tan (Biała Piwonia)',
    author: 'Fujian Artisan',
    coffeeOrTeaDoseGrams: 3.5,
    waterWeightGrams: 250.0,
    waterTemperatureCelsius: 80.0,
    grindSettingDescriptionPl: 'Puszyste pąki i liście',
    recommendedRatio: 71.4,
    steps: [
      { stepNumber: 1, namePl: 'Infuzja zachodnia', targetWaterGrams: 250.0, durationSeconds: 180, instructionPl: 'Woda 80°C, powolne uwalnianie nut kwiatowych przez 3 minuty.' },
    ],
  },
  {
    id: 'kalita-wave-185',
    type: 'COFFEE',
    method: 'KALITA',
    name: 'Kalita Wave 185 — Trzy Zalania',
    author: 'George Howell Coffee',
    coffeeOrTeaDoseGrams: 25.0,
    waterWeightGrams: 400.0,
    waterTemperatureCelsius: 94.0,
    grindSettingDescriptionPl: 'Średnio-grubo (np. 24 kliki Comandante)',
    recommendedRatio: 16.0,
    steps: [
      { stepNumber: 1, namePl: 'Blooming (Preinfuzja)', targetWaterGrams: 60.0, durationSeconds: 45, instructionPl: 'Zalej 60g wody, równomiernie nasącz całe złoże kawy z płaskim dnem.' },
      { stepNumber: 2, namePl: 'Drugie zalanie', targetWaterGrams: 230.0, durationSeconds: 45, instructionPl: 'Spokojnym ruchem spiralnym dolej wodę do 230g.' },
      { stepNumber: 3, namePl: 'Trzecie zalanie (Finisz)', targetWaterGrams: 400.0, durationSeconds: 60, instructionPl: 'Uzupełnij do 400g, utrzymując stały poziom wody.' },
    ],
  },
  {
    id: 'espresso-modern-double',
    type: 'COFFEE',
    method: 'ESPRESSO',
    name: 'Espresso — Specialty Double Shot (1:2)',
    author: 'WBC Standard Protocol',
    coffeeOrTeaDoseGrams: 18.0,
    waterWeightGrams: 36.0,
    waterTemperatureCelsius: 93.0,
    grindSettingDescriptionPl: 'Bardzo drobno (espresso dial-in)',
    recommendedRatio: 2.0,
    steps: [
      { stepNumber: 1, namePl: 'Preinfuzja ciśnieniowa', targetWaterGrams: 8.0, durationSeconds: 6, instructionPl: 'Preinfuzja pod niskim ciśnieniem (2-3 bary) dla równomiernej saturacji ciastka.' },
      { stepNumber: 2, namePl: 'Ekstrakcja główna (9 barów)', targetWaterGrams: 36.0, durationSeconds: 22, instructionPl: 'Pełna ekstrakcja do uzyskania 36g w filiżance o gęstej cremie.' },
    ],
  },
  {
    id: 'cupping-sca-protocol',
    type: 'COFFEE',
    method: 'CUPPING',
    name: 'Cupping — Standard SCA Protocol',
    author: 'Specialty Coffee Association',
    coffeeOrTeaDoseGrams: 12.0,
    waterWeightGrams: 200.0,
    waterTemperatureCelsius: 93.5,
    grindSettingDescriptionPl: 'Grubo mielona (70-75% cząstek przechodzi przez sito 850µm)',
    recommendedRatio: 16.67,
    steps: [
      { stepNumber: 1, namePl: 'Zalanie czaszy', targetWaterGrams: 200.0, durationSeconds: 240, instructionPl: 'Zalej 200g wrzątku bezpośrednio na suchą kawę. Pozostaw na 4 minuty bez mieszania.' },
      { stepNumber: 2, namePl: 'Przełamanie kożucha (Break crust)', targetWaterGrams: 200.0, durationSeconds: 60, instructionPl: 'Trzykrotnie przełam kożuch łyżką cuppingową, oceniając aromat.' },
    ],
  },
];

