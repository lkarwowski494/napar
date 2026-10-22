// ============================================================================
// Napar (Steepwise) — Napoje mleczne i latte art (poz. 32 MVP)
// Czysta logika: domyślne proporcje, zakres temperatury mleka i skalowanie
// objętości filiżanki. Teksty (nazwy, kroki, wskazówki) są w src/core/i18n.tsx
// (klucz milkDrinks). Wszystkie liczby mają wpis w docs/research/rejestr-twierdzen.json
// (NM-01..NM-07). Proporcje to wartości domyślne [OCENA], nie standard SCA.
// ============================================================================

export type MilkDrinkId = 'espresso' | 'cappuccino' | 'latte' | 'flatWhite' | 'mocha';
export type MilkComponentKind = 'espresso' | 'milk' | 'foam' | 'syrup';
export type MilkStepKey = 'step1' | 'step2' | 'step3' | 'step4' | 'step5';

export interface MilkComponent {
  kind: MilkComponentKind;
  volumeMl: number;
}

export interface MilkTemperatureRangeC {
  minC: number;
  maxC: number;
}

export interface MilkDrinkRecipe {
  id: MilkDrinkId;
  /** Domyślna objętość filiżanki; równa sumie składników. */
  cupVolumeMl: number;
  components: readonly MilkComponent[];
  /** Temperatura spienionego mleka (NM-06, do sprawdzenia); null bez mleka. */
  milkTemperatureC: MilkTemperatureRangeC | null;
  /** Kolejność kroków; teksty w milkDrinks.drinks.<id>.<krok>. */
  stepKeys: readonly MilkStepKey[];
  /** Czy użytkownik może zmienić objętość filiżanki (napój z mlekiem). */
  scalable: boolean;
  /** Identyfikatory wpisów w rejestrze twierdzeń. */
  registerIds: readonly string[];
}

/** NM-06 (zakres z M-01 w docs/research/napoje-mleczne-2026-10-22.md): do sprawdzenia źródłem pierwotnym. */
export const MILK_TEMPERATURE_RANGE_C: MilkTemperatureRangeC = { minC: 60, maxC: 68 };

/** NM-07: krok i granice zmiany objętości filiżanki (decyzja techniczna). */
export const MILK_CUP_STEP_ML = 30;
export const MILK_CUP_MIN_ML = 120;
export const MILK_CUP_MAX_ML = 360;

export const MILK_DRINKS: readonly MilkDrinkRecipe[] = [
  {
    id: 'espresso',
    cupVolumeMl: 60,
    components: [{ kind: 'espresso', volumeMl: 60 }],
    milkTemperatureC: null,
    stepKeys: ['step1', 'step2'],
    scalable: false,
    registerIds: ['NM-01'],
  },
  {
    id: 'cappuccino',
    cupVolumeMl: 180,
    components: [
      { kind: 'espresso', volumeMl: 60 },
      { kind: 'milk', volumeMl: 60 },
      { kind: 'foam', volumeMl: 60 },
    ],
    milkTemperatureC: MILK_TEMPERATURE_RANGE_C,
    stepKeys: ['step1', 'step2', 'step3', 'step4', 'step5'],
    scalable: true,
    registerIds: ['NM-02', 'NM-06', 'NM-07'],
  },
  {
    id: 'latte',
    cupVolumeMl: 240,
    components: [
      { kind: 'espresso', volumeMl: 60 },
      { kind: 'milk', volumeMl: 180 },
    ],
    milkTemperatureC: MILK_TEMPERATURE_RANGE_C,
    stepKeys: ['step1', 'step2', 'step3', 'step4', 'step5'],
    scalable: true,
    registerIds: ['NM-03', 'NM-06', 'NM-07'],
  },
  {
    id: 'flatWhite',
    cupVolumeMl: 180,
    components: [
      { kind: 'espresso', volumeMl: 60 },
      { kind: 'milk', volumeMl: 120 },
    ],
    milkTemperatureC: MILK_TEMPERATURE_RANGE_C,
    stepKeys: ['step1', 'step2', 'step3', 'step4', 'step5'],
    scalable: true,
    registerIds: ['NM-04', 'NM-06', 'NM-07'],
  },
  {
    id: 'mocha',
    cupVolumeMl: 240,
    components: [
      { kind: 'espresso', volumeMl: 60 },
      { kind: 'syrup', volumeMl: 20 },
      { kind: 'milk', volumeMl: 160 },
    ],
    milkTemperatureC: MILK_TEMPERATURE_RANGE_C,
    stepKeys: ['step1', 'step2', 'step3', 'step4', 'step5'],
    scalable: true,
    registerIds: ['NM-05', 'NM-06', 'NM-07'],
  },
];

export function getMilkDrink(id: MilkDrinkId): MilkDrinkRecipe {
  const drink = MILK_DRINKS.find((d) => d.id === id);
  if (!drink) {
    throw new Error(`Nieznany napój mleczny: ${id}`);
  }
  return drink;
}

export function sumComponentVolumesMl(components: readonly MilkComponent[]): number {
  return components.reduce((sum, c) => sum + c.volumeMl, 0);
}

/** Zaokrągla do pełnego mililitra i trzyma w granicach MILK_CUP_MIN_ML..MILK_CUP_MAX_ML. */
export function clampMilkCupVolumeMl(volumeMl: number): number {
  if (!Number.isFinite(volumeMl)) {
    return MILK_CUP_MIN_ML;
  }
  return Math.min(MILK_CUP_MAX_ML, Math.max(MILK_CUP_MIN_ML, Math.round(volumeMl)));
}

/** Zmiana objętości filiżanki o jeden krok; wynik zawsze w granicach. */
export function stepMilkCupVolumeMl(currentMl: number, direction: 1 | -1): number {
  return clampMilkCupVolumeMl(currentMl + direction * MILK_CUP_STEP_ML);
}

/**
 * Składniki przeliczone na zadaną objętość filiżanki. Proporcje zachowane,
 * zaokrąglenie do pełnego mililitra; resztę dokłada największy składnik,
 * więc suma zawsze równa się objętości filiżanki. Napój nieskalowalny
 * (espresso) zwraca domyślne składniki.
 */
export function scaleMilkDrinkComponents(
  drink: MilkDrinkRecipe,
  targetCupMl: number
): MilkComponent[] {
  if (!drink.scalable) {
    return drink.components.map((c) => ({ ...c }));
  }
  const target = clampMilkCupVolumeMl(targetCupMl);
  const base = sumComponentVolumesMl(drink.components);
  const scaled = drink.components.map((c) => ({
    kind: c.kind,
    volumeMl: Math.round((c.volumeMl * target) / base),
  }));
  let largest = 0;
  scaled.forEach((c, i) => {
    if (c.volumeMl > scaled[largest].volumeMl) largest = i;
  });
  scaled[largest].volumeMl += target - sumComponentVolumesMl(scaled);
  return scaled;
}
