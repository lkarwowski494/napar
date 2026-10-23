// ============================================================================
// Napar (Steepwise) — Ekran napojów mlecznych (poz. 32 MVP) i kompletność
// tekstów PL/EN dla napojów mlecznych oraz karty degustacyjnej (poz. 31 MVP).
// ============================================================================

import React from 'react';
import renderer, { act } from 'react-test-renderer';
import MilkDrinksScreen from '../../../app/milk-drinks';
import { LanguageProvider, translations } from '../i18n';
import type { MilkComponentKind, MilkDrinkId, MilkStepKey } from '../milk-drinks';

const mockBack = jest.fn();
const mockReplace = jest.fn();
let mockCanGoBack = true;

jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: mockBack,
    replace: mockReplace,
    canGoBack: () => mockCanGoBack,
  }),
}));

jest.mock('../database', () => ({
  getLanguageSetting: jest.fn(() => 'system'),
  setLanguageSetting: jest.fn(),
  getUnitSystem: jest.fn(() => 'metric'),
}));

const DRINK_IDS: MilkDrinkId[] = ['espresso', 'cappuccino', 'latte', 'flatWhite', 'mocha'];
const INGREDIENT_KINDS: MilkComponentKind[] = ['espresso', 'milk', 'foam', 'syrup'];
const STEP_KEYS: MilkStepKey[] = ['step1', 'step2', 'step3', 'step4', 'step5'];
const MILK_DRINK_IDS: MilkDrinkId[] = ['cappuccino', 'latte', 'flatWhite', 'mocha'];

describe('Ekran napojów mlecznych (poz. 32 MVP)', () => {
  beforeEach(() => {
    mockBack.mockClear();
    mockReplace.mockClear();
    mockCanGoBack = true;
  });

  test('pokazuje pięć kart napojów i zamyka ekran przez wstecz', () => {
    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <LanguageProvider>
          <MilkDrinksScreen />
        </LanguageProvider>
      );
    });
    for (const id of DRINK_IDS) {
      expect(tree.root.findAllByProps({ testID: `milk-drink-${id}` }).length).toBeGreaterThan(0);
    }

    act(() => {
      tree.root.findByProps({ testID: 'milk-drinks-close-btn' }).props.onPress();
    });
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  test('bez historii zamknięcie wraca do zakładek', () => {
    mockCanGoBack = false;
    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <LanguageProvider>
          <MilkDrinksScreen />
        </LanguageProvider>
      );
    });
    act(() => {
      tree.root.findByProps({ testID: 'milk-drinks-close-btn' }).props.onPress();
    });
    expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
  });
});

describe('Teksty napojów mlecznych i karty degustacyjnej w PL i EN', () => {
  test('każdy język ma składniki, kroki i wskazówki dla napojów mlecznych', () => {
    for (const lang of ['pl', 'en'] as const) {
      const copy = translations[lang].milkDrinks;
      for (const kind of INGREDIENT_KINDS) {
        expect(copy.ingredient[kind].length).toBeGreaterThan(0);
      }
      for (const id of MILK_DRINK_IDS) {
        const drink = copy.drinks[id] as Record<string, string>;
        for (const step of STEP_KEYS) {
          expect(drink[step].length).toBeGreaterThan(0);
        }
        expect(drink.tip.length).toBeGreaterThan(0);
      }
      expect(copy.drinks.espresso.step1.length).toBeGreaterThan(0);
      expect(copy.drinks.espresso.step2.length).toBeGreaterThan(0);
    }
  });

  test('karta degustacyjna ma wszystkie etykiety i balans w PL i EN', () => {
    for (const lang of ['pl', 'en'] as const) {
      const card = translations[lang].tastingCard;
      for (const label of [card.dose, card.water, card.temperature, card.time, card.rating, card.balance, card.yield, card.inventory, card.flavorNotes, card.notes]) {
        expect(label.length).toBeGreaterThan(0);
      }
      expect(card.brand.length).toBeGreaterThan(0);
      expect(card.footer.length).toBeGreaterThan(0);
      for (const code of ['balanced', 'sour', 'bitter', 'astringent', 'weak', 'too_strong'] as const) {
        expect(card.balanceLabel[code].length).toBeGreaterThan(0);
      }
    }
  });
});
