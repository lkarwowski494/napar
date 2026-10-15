// ============================================================================
// Napar (Steepwise) — Unit Tests: Custom Recipe Builder & Database Persistence
// ============================================================================

import React from 'react';
import renderer from 'react-test-renderer';
import { Alert } from 'react-native';

const mockPush = jest.fn();
const mockBack = jest.fn();

// Mock in-memory DB for SQLite
const mockDb: any = {
  recipes: new Map<string, any>(),
  execSync: jest.fn(),
  getFirstSync: jest.fn((query: string, params?: any[]) => {
    if (query.includes('FROM recipes WHERE id = ?')) {
      return mockDb.recipes.get(params?.[0]) || null;
    }
    if (query.includes('COUNT(*) as count FROM recipes')) {
      return { count: mockDb.recipes.size };
    }
    return null;
  }),
  getAllSync: jest.fn((query: string) => {
    if (query.includes('FROM recipes')) {
      return Array.from(mockDb.recipes.values());
    }
    return [];
  }),
  prepareSync: jest.fn(() => ({
    executeSync: jest.fn(),
    finalizeSync: jest.fn(),
  })),
  runSync: jest.fn((query: string, params?: any[]) => {
    if (query.includes('INSERT OR REPLACE INTO recipes')) {
      const [id, name, type, method, author, desc, dose, water, temp, grind, ratio, steps, custom, fav, created] = params!;
      mockDb.recipes.set(id, {
        id,
        name,
        beverage_type: type,
        method,
        author,
        description: desc,
        dose_g: dose,
        water_g: water,
        water_temp_c: temp,
        grind_size_description: grind,
        recommended_ratio: ratio,
        steps_json: steps,
        is_custom: custom,
        is_favorite: fav,
        created_at: created,
      });
    } else if (query.includes('DELETE FROM recipes WHERE id = ?')) {
      mockDb.recipes.delete(params![0]);
    }
  }),
};

jest.mock('expo-sqlite', () => ({
  openDatabaseSync: jest.fn(() => mockDb),
}));

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
  }),
  useLocalSearchParams: () => ({}),
}));

import RecipeBuilderScreen from '../../../app/recipe-builder';
import { saveRecipe, deleteRecipe, getRecipeById } from '../database';
import { SavedRecipe } from '../database-schema';
import { calculateBrewRatio } from '../domain-rules';

describe('Custom Recipe Builder & Persistence', () => {
  const testRecipeId = 'custom-test-recipe-1';

  beforeEach(() => {
    jest.spyOn(Alert, 'alert');
    mockDb.recipes.clear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('Prawidłowo wylicza proporcję RD-01 dla parametrów receptury', () => {
    // 15g kawy, 250g wody -> 1:16.7
    const ratio = calculateBrewRatio(15, 250);
    expect(ratio).toBe(16.7);

    // 20g kawy, 300g wody -> 1:15.0
    const ratio2 = calculateBrewRatio(20, 300);
    expect(ratio2).toBe(15.0);
  });

  test('Zapisuje i pobiera autorską recepturę z bazy SQLite', () => {
    const customRecipe: SavedRecipe = {
      id: testRecipeId,
      name: 'Autorski Drip Geisha',
      beverageType: 'COFFEE',
      method: 'Origami Dripper',
      author: 'Tester',
      description: 'Preinfuzja 60s, dwa równe zalania',
      doseGrams: 14.5,
      waterGrams: 240.0,
      waterTempCelsius: 91.0,
      grindSizeDescription: '22 kliki Comandante',
      recommendedRatio: 16.6,
      stepsJson: JSON.stringify([
        {
          stepNumber: 1,
          namePl: 'Bloom',
          targetWaterGrams: 50,
          durationSeconds: 45,
          instructionPl: 'Preinfuzja',
        },
        {
          stepNumber: 2,
          namePl: 'Zalanie główne',
          targetWaterGrams: 240,
          durationSeconds: 90,
          instructionPl: 'Zalanie spiralne',
        },
      ]),
      isCustom: true,
      isFavorite: false,
      createdAt: new Date().toISOString(),
    };

    saveRecipe(customRecipe);

    const retrieved = getRecipeById(testRecipeId);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.name).toBe('Autorski Drip Geisha');
    expect(retrieved?.isCustom).toBe(true);
    expect(retrieved?.doseGrams).toBe(14.5);
    expect(retrieved?.waterGrams).toBe(240.0);
    expect(retrieved?.stepsJson).toContain('Bloom');

    // Usunięcie
    deleteRecipe(testRecipeId);
    const afterDelete = getRecipeById(testRecipeId);
    expect(afterDelete).toBeNull();
  });

  test('Renderuje ekran RecipeBuilder bez błędów', () => {
    let tree: any;
    renderer.act(() => {
      tree = renderer.create(<RecipeBuilderScreen />);
    });

    const json = tree.toJSON();
    expect(json).toBeTruthy();
    const str = JSON.stringify(json);
    expect(str).toContain('Nowa Receptura');
    expect(str).toContain('Kawa');
    expect(str).toContain('Herbata');
    expect(str).toContain('Zapisz');
  });

  test('Waliduje brakujące pola i wyświetla Alert', () => {
    let tree: any;
    renderer.act(() => {
      tree = renderer.create(<RecipeBuilderScreen />);
    });

    // Kliknij przycisk Zapisz w nagłówku (z pustą nazwą)
    const saveText = tree.root.findAll((node: any) => {
      return node.props && node.props.children === 'Zapisz';
    })[0];

    let saveBtn = saveText.parent;
    while (saveBtn && !saveBtn.props.onPress) {
      saveBtn = saveBtn.parent;
    }

    renderer.act(() => {
      saveBtn.props.onPress();
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      'Nowa Receptura',
      'Wypełnij nazwę i dodaj przynajmniej jeden krok parzenia.'
    );
  });

  test('Dodaje i usuwa krok parzenia w kreatorze', () => {
    let tree: any;
    renderer.act(() => {
      tree = renderer.create(<RecipeBuilderScreen />);
    });

    const getStepCount = () =>
      tree.root.findAll((n: any) => typeof n.type !== 'string' && n.props && n.props.children === 'Nazwa kroku').length;

    // Domyślnie kreator startuje z 2 krokami (Bloom + Główne zalanie)
    expect(getStepCount()).toBe(2);

    // Kliknij '+ Dodaj kolejny krok'
    const addStepText = tree.root.findAll((node: any) => {
      return node.props && node.props.children === '+ Dodaj kolejny krok';
    })[0];

    let addStepBtn = addStepText.parent;
    while (addStepBtn && !addStepBtn.props.onPress) {
      addStepBtn = addStepBtn.parent;
    }

    renderer.act(() => {
      addStepBtn.props.onPress();
    });

    // Po dodaniu są 3 kroki
    expect(getStepCount()).toBe(3);

    // Usuń krok 3 (ostatni przycisk z akcją usuwania)
    const removeCrosses = tree.root.findAll((node: any) => {
      return node.props && node.props.children === '✕';
    });
    let removeBtn = removeCrosses[removeCrosses.length - 1].parent;
    while (removeBtn && !removeBtn.props.onPress) {
      removeBtn = removeBtn.parent;
    }

    renderer.act(() => {
      removeBtn.props.onPress();
    });

    expect(getStepCount()).toBe(2);
  });

  test('Wpisanie nazwy receptury i pomyślny zapis do bazy', () => {
    let tree: any;
    renderer.act(() => {
      tree = renderer.create(<RecipeBuilderScreen />);
    });

    // Znajdź input nazwy receptury
    const nameInput = tree.root.findByProps({
      placeholder: 'np. Mój Ulubiony V60 3-Pour',
    });

    renderer.act(() => {
      nameInput.props.onChangeText('Mój Kalita Wave');
    });

    // Kliknij Zapisz w nagłówku
    const saveText = tree.root.findAll((node: any) => {
      return node.props && node.props.children === 'Zapisz';
    })[0];

    let saveBtn = saveText.parent;
    while (saveBtn && !saveBtn.props.onPress) {
      saveBtn = saveBtn.parent;
    }

    renderer.act(() => {
      saveBtn.props.onPress();
    });

    expect(mockDb.runSync).toHaveBeenCalled();
    expect(mockBack).toHaveBeenCalled();
  });
});
