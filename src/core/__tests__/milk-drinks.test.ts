// ============================================================================
// Napar (Steepwise) — Testy napojów mlecznych i latte art (poz. 32 MVP)
// Wartości: suma składników = objętość filiżanki, zakres temperatury mleka,
// skalowanie bez utraty mililitra, teksty PL/EN dla każdego kroku.
// ============================================================================

import fs from 'fs';
import path from 'path';
import {
  MILK_DRINKS,
  MILK_CUP_MAX_ML,
  MILK_CUP_MIN_ML,
  MILK_CUP_STEP_ML,
  MILK_TEMPERATURE_RANGE_C,
  clampMilkCupVolumeMl,
  getMilkDrink,
  scaleMilkDrinkComponents,
  stepMilkCupVolumeMl,
  sumComponentVolumesMl,
} from '../milk-drinks';
import { translations } from '../i18n';

const REGISTER_PATH = path.resolve(__dirname, '../../../docs/research/rejestr-twierdzen.json');

describe('Napoje mleczne: domyślne proporcje (poz. 32 MVP)', () => {
  test('są dokładnie pięć napojów w ustalonej kolejności', () => {
    expect(MILK_DRINKS.map((d) => d.id)).toEqual([
      'espresso',
      'cappuccino',
      'latte',
      'flatWhite',
      'mocha',
    ]);
  });

  test('suma składników równa się objętości filiżanki dla każdego napoju', () => {
    for (const drink of MILK_DRINKS) {
      expect(sumComponentVolumesMl(drink.components)).toBe(drink.cupVolumeMl);
    }
  });

  test('każdy składnik ma dodatnią, całkowitą objętość w mililitrach', () => {
    for (const drink of MILK_DRINKS) {
      for (const component of drink.components) {
        expect(Number.isInteger(component.volumeMl)).toBe(true);
        expect(component.volumeMl).toBeGreaterThan(0);
      }
    }
  });

  test('cappuccino: trzy równe części (espresso, mleko, pianka) w 150–180 ml', () => {
    const cappuccino = getMilkDrink('cappuccino');
    expect(cappuccino.components.map((c) => c.volumeMl)).toEqual([60, 60, 60]);
    expect(cappuccino.cupVolumeMl).toBeGreaterThanOrEqual(150);
    expect(cappuccino.cupVolumeMl).toBeLessThanOrEqual(180);
  });

  test('latte: espresso do mleka 1:3 (wybór z dwóch rozbieżnych źródeł, NM-03)', () => {
    const latte = getMilkDrink('latte');
    const espresso = latte.components.find((c) => c.kind === 'espresso')!.volumeMl;
    const milk = latte.components.find((c) => c.kind === 'milk')!.volumeMl;
    expect(milk / espresso).toBe(3);
    expect(latte.cupVolumeMl).toBeGreaterThanOrEqual(240);
    expect(latte.cupVolumeMl).toBeLessThanOrEqual(350);
  });

  test('espresso nie ma mleka ani temperatury mleka; napoje z mlekiem mają zakres 60–68 °C', () => {
    expect(getMilkDrink('espresso').milkTemperatureC).toBeNull();
    expect(getMilkDrink('espresso').scalable).toBe(false);
    for (const drink of MILK_DRINKS.filter((d) => d.id !== 'espresso')) {
      expect(drink.milkTemperatureC).toEqual({ minC: 60, maxC: 68 });
      expect(drink.milkTemperatureC).toBe(MILK_TEMPERATURE_RANGE_C);
      expect(drink.components.some((c) => c.kind === 'milk')).toBe(true);
      expect(drink.scalable).toBe(true);
    }
  });

  test('kroki: 2 dla espresso, 5 dla napojów z mlekiem, bez powtórzeń', () => {
    for (const drink of MILK_DRINKS) {
      const expected = drink.id === 'espresso' ? 2 : 5;
      expect(drink.stepKeys).toHaveLength(expected);
      expect(new Set(drink.stepKeys).size).toBe(expected);
    }
  });

  test('każdy wpis rejestru istnieje w rejestrze twierdzeń i ma status', () => {
    const register = JSON.parse(fs.readFileSync(REGISTER_PATH, 'utf8')) as {
      wpisy: { id: string; status: string }[];
    };
    const byId = new Map(register.wpisy.map((e) => [e.id, e]));
    const used = new Set(MILK_DRINKS.flatMap((d) => [...d.registerIds]));
    for (const id of ['NM-01', 'NM-02', 'NM-03', 'NM-04', 'NM-05', 'NM-06', 'NM-07']) {
      expect(used.has(id)).toBe(true);
    }
    for (const id of used) {
      const entry = byId.get(id);
      expect(entry).toBeDefined();
      expect(['[OCENA]', 'do sprawdzenia']).toContain(entry!.status);
    }
  });

  test('teksty PL i EN istnieją dla każdego napoju, kroku i wskazówki', () => {
    for (const lang of ['pl', 'en'] as const) {
      const texts = translations[lang].milkDrinks;
      expect(texts.title.length).toBeGreaterThan(0);
      expect(texts.intro.length).toBeGreaterThan(0);
      for (const drink of MILK_DRINKS) {
        const drinkTexts = texts.drinks[drink.id] as Record<string, string>;
        expect(drinkTexts.name.length).toBeGreaterThan(0);
        expect(drinkTexts.description.length).toBeGreaterThan(0);
        expect(drinkTexts.tip.length).toBeGreaterThan(0);
        for (const key of drink.stepKeys) {
          expect(drinkTexts[key].length).toBeGreaterThan(0);
        }
      }
    }
  });

  test('getMilkDrink zwraca napój albo zgłasza nieznany identyfikator', () => {
    expect(getMilkDrink('mocha').id).toBe('mocha');
    expect(() => getMilkDrink('ristretto' as never)).toThrow('Nieznany napój mleczny: ristretto');
  });
});

describe('Napoje mleczne: skalowanie filiżanki', () => {
  test('objętość filiżanki jest zaokrąglana i trzymana w granicach', () => {
    expect(clampMilkCupVolumeMl(150.4)).toBe(150);
    expect(clampMilkCupVolumeMl(150.6)).toBe(151);
    expect(clampMilkCupVolumeMl(50)).toBe(MILK_CUP_MIN_ML);
    expect(clampMilkCupVolumeMl(500)).toBe(MILK_CUP_MAX_ML);
    expect(clampMilkCupVolumeMl(Number.NaN)).toBe(MILK_CUP_MIN_ML);
    expect(clampMilkCupVolumeMl(Number.POSITIVE_INFINITY)).toBe(MILK_CUP_MIN_ML);
  });

  test('krok zmienia objętość o stały skok i nie wychodzi poza granice', () => {
    expect(stepMilkCupVolumeMl(180, 1)).toBe(180 + MILK_CUP_STEP_ML);
    expect(stepMilkCupVolumeMl(180, -1)).toBe(180 - MILK_CUP_STEP_ML);
    expect(stepMilkCupVolumeMl(MILK_CUP_MIN_ML, -1)).toBe(MILK_CUP_MIN_ML);
    expect(stepMilkCupVolumeMl(MILK_CUP_MAX_ML, 1)).toBe(MILK_CUP_MAX_ML);
  });

  test('przy domyślnej objętości składniki się nie zmieniają', () => {
    for (const drink of MILK_DRINKS.filter((d) => d.scalable)) {
      expect(scaleMilkDrinkComponents(drink, drink.cupVolumeMl)).toEqual([...drink.components]);
    }
  });

  test('suma po skalowaniu zawsze równa się zadanej objętości (bez utraty mililitra)', () => {
    for (const drink of MILK_DRINKS.filter((d) => d.scalable)) {
      for (let target = MILK_CUP_MIN_ML; target <= MILK_CUP_MAX_ML; target += 7) {
        const scaled = scaleMilkDrinkComponents(drink, target);
        expect(sumComponentVolumesMl(scaled)).toBe(target);
        expect(scaled.every((c) => c.volumeMl > 0)).toBe(true);
      }
    }
  });

  test('proporcje zachowane: cappuccino w 120 ml to po 40 ml każdego składnika', () => {
    const scaled = scaleMilkDrinkComponents(getMilkDrink('cappuccino'), 120);
    expect(scaled.map((c) => c.volumeMl)).toEqual([40, 40, 40]);
  });

  test('korekta zaokrągleń trafia w największy składnik (cappuccino w 121 ml: 41/40/40)', () => {
    const scaled = scaleMilkDrinkComponents(getMilkDrink('cappuccino'), 121);
    expect(scaled.map((c) => c.volumeMl)).toEqual([41, 40, 40]);
  });

  test('latte w 151 ml: espresso 38 ml, mleko 113 ml, bez korekty', () => {
    const scaled = scaleMilkDrinkComponents(getMilkDrink('latte'), 151);
    expect(scaled.find((c) => c.kind === 'espresso')!.volumeMl).toBe(38);
    expect(scaled.find((c) => c.kind === 'milk')!.volumeMl).toBe(113);
  });

  test('napój nieskalowalny (espresso) zwraca kopię składników bez zmian', () => {
    const espresso = getMilkDrink('espresso');
    const result = scaleMilkDrinkComponents(espresso, 300);
    expect(result).toEqual(espresso.components);
    expect(result[0]).not.toBe(espresso.components[0]);
  });
});
