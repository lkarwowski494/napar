// ============================================================================
// Napar (Steepwise) — Testy: zapamiętany tryb parzenia w kontekście i w hooku (poz. 20 MVP)
// Ustawienia w pamięci (mock app_settings): odczyt przy starcie i zapis przy zmianie.
// ============================================================================

import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { View } from 'react-native';
import { BrewProvider, useBrew } from '../brew-context';
import { useBrewWorkflow } from '../useBrewWorkflow';
import { MASTER_RECIPES } from '../recipes-data';

const settingsStore = new Map<string, string>();

const mockDb: any = {
  execSync: jest.fn(),
  getFirstSync: jest.fn((sql: string, params: any[] = []) => {
    if (sql.includes('FROM app_settings WHERE key = ?')) {
      return settingsStore.has(params[0]) ? { value: settingsStore.get(params[0]) } : null;
    }
    return null;
  }),
  getAllSync: jest.fn(() => []),
  runSync: jest.fn((sql: string, params: any[] = []) => {
    if (sql.includes('INSERT OR REPLACE INTO app_settings')) {
      settingsStore.set(params[0], params[1]);
    }
  }),
};

jest.mock('expo-sqlite', () => ({
  openDatabaseSync: jest.fn(() => mockDb),
  defaultDatabaseDirectory: '/test/SQLite',
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
}));

const CHEMEX = MASTER_RECIPES.find((r) => r.id === 'chemex-classic')!;
const TEA = MASTER_RECIPES.find((r) => r.type === 'TEA')!;
const COFFEE_DEFAULT = MASTER_RECIPES.find((r) => r.type === 'COFFEE')!;

function mountBrew() {
  const view: { current: any } = { current: null };
  const Consumer = () => {
    view.current = useBrew();
    return null;
  };
  act(() => {
    renderer.create(
      <BrewProvider>
        <Consumer />
      </BrewProvider>
    );
  });
  return view;
}

describe('Zapamiętana receptura w kontekście parzenia (poz. 20 MVP)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    settingsStore.clear();
  });

  test('po ponownym otwarciu wraca ostatnio wybrana receptura (bez przełączania)', () => {
    settingsStore.set('beverage_preference', 'both');
    settingsStore.set('last_recipe_id', CHEMEX.id);
    const view = mountBrew();
    expect(view.current.recipe.id).toBe(CHEMEX.id);
  });

  test('wybór receptury zapisuje jej identyfikator w ustawieniach', () => {
    settingsStore.set('beverage_preference', 'both');
    const view = mountBrew();
    act(() => {
      view.current.selectRecipe(CHEMEX);
    });
    expect(settingsStore.get('last_recipe_id')).toBe(CHEMEX.id);
  });

  test('zapamiętana herbata nie otwiera się w trybie tylko kawa (wraca przepis kawowy)', () => {
    settingsStore.set('beverage_preference', 'coffee');
    settingsStore.set('last_recipe_id', TEA.id);
    const view = mountBrew();
    expect(view.current.recipe.id).toBe(COFFEE_DEFAULT.id);
  });

  test('nieznany identyfikator w ustawieniach daje domyślny przepis trybu', () => {
    settingsStore.set('beverage_preference', 'tea');
    settingsStore.set('last_recipe_id', 'nie-istnieje');
    const view = mountBrew();
    expect(view.current.recipe.type).toBe('TEA');
  });

  test('bez zapamiętanej receptury tryb „oba” otwiera przepis kawowy', () => {
    const view = mountBrew();
    expect(view.current.recipe.id).toBe(COFFEE_DEFAULT.id);
  });
});

describe('Zapamiętana liczba porcji w hooku parzenia (poz. 20 MVP)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    settingsStore.clear();
  });

  function mountWorkflow() {
    const view: { current: any } = { current: null };
    const Consumer = () => {
      view.current = useBrewWorkflow();
      return <View />;
    };
    act(() => {
      renderer.create(
        <BrewProvider>
          <Consumer />
        </BrewProvider>
      );
    });
    return view;
  }

  test('zmiana porcji zapisuje się w ustawieniach i wraca po ponownym otwarciu', () => {
    const first = mountWorkflow();
    expect(first.current.servings).toBe(1);

    act(() => {
      first.current.handleServingsChange(3);
    });
    expect(first.current.servings).toBe(3);
    expect(settingsStore.get('last_servings')).toBe('3');

    const reopened = mountWorkflow();
    expect(reopened.current.servings).toBe(3);
  });

  test('porcje spoza zakresu 1–4 w ustawieniach nie trafiają do stanu (domyślnie 1)', () => {
    settingsStore.set('last_servings', '9');
    const view = mountWorkflow();
    expect(view.current.servings).toBe(1);
  });
});
