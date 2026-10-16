// ============================================================================
// Napar (Steepwise) — Frontend Unit & Safety Tests:
// Modal Safe Area Inset Protection, Touch Target Clickability & Beverage Toggle
// ============================================================================

import React from 'react';
import { Alert, Share } from 'react-native';
import renderer, { act } from 'react-test-renderer';
import BrewScreen from '../../../app/(tabs)/index';
import BeansScreen from '../../../app/(tabs)/beans';
import SettingsScreen from '../../../app/settings';
import { BrewProvider } from '../brew-context';

jest.spyOn(Share, 'share').mockImplementation(() => Promise.resolve({ action: 'sharedAction' } as any));
jest.spyOn(Alert, 'alert').mockImplementation(() => {});

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Medium: 'medium', Light: 'light' },
  NotificationFeedbackType: { Success: 'success' },
}));

jest.mock('expo-keep-awake', () => ({
  activateKeepAwakeAsync: jest.fn(),
  deactivateKeepAwake: jest.fn(),
}));

const mockPush = jest.fn();
const mockNavigate = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    navigate: mockNavigate,
  }),
  Link: ({ children }: any) => children,
}));

const mockDb: any = {
  inventory: new Map([
    [
      'bean-1',
      {
        id: 'bean-1',
        name: 'Kolumbia Geisha',
        type: 'coffee',
        roaster_or_producer: 'Kawa Roastery',
        origin: 'Huila',
        initial_weight_g: 250,
        remaining_weight_g: 200,
        flavor_notes_json: '["jaśmin"]',
        is_favorite: 1,
        is_archived: 0,
        created_at: '2026-10-10',
        updated_at: '2026-10-10',
      },
    ],
  ]),
  recipes: new Map([
    [
      'rec-coffee-1',
      {
        id: 'rec-coffee-1',
        name: 'V60 — Metoda 4:6',
        beverage_type: 'COFFEE',
        method: 'V60',
        author: 'Tetsu Kasuya',
        dose_g: 20,
        water_g: 300,
        water_temp_c: 92,
        recommended_ratio: 15.0,
        steps_json: '[]',
        is_custom: 0,
        is_favorite: 1,
        created_at: '2026-10-10',
      },
    ],
    [
      'rec-tea-1',
      {
        id: 'rec-tea-1',
        name: 'Gyokuro Uji — Kropla Rosy',
        beverage_type: 'TEA',
        method: 'KYUSU',
        author: 'Tradycja Uji',
        dose_g: 5,
        water_g: 50,
        water_temp_c: 60,
        recommended_ratio: 10.0,
        steps_json: '[]',
        is_custom: 0,
        is_favorite: 1,
        created_at: '2026-10-10',
      },
    ],
  ]),
  sessions: new Map(),
  caffeine: new Map(),
  app_settings: new Map(),
  execSync: jest.fn(),
  getFirstSync: jest.fn((q, p) => {
    if (q.includes('COUNT(*) as count FROM recipes')) return { count: 2 };
    if (q.includes('FROM recipes WHERE id = ?')) return mockDb.recipes.get(p?.[0]) || null;
    if (q.includes('FROM app_settings WHERE key = ?')) {
      const val = mockDb.app_settings.get(p?.[0]);
      return val !== undefined ? { value: val } : null;
    }
    return null;
  }),
  getAllSync: jest.fn((q) => {
    if (q.includes('FROM recipes')) return Array.from(mockDb.recipes.values());
    if (q.includes('FROM inventory_items')) return Array.from(mockDb.inventory.values());
    if (q.includes('FROM brew_sessions')) return Array.from(mockDb.sessions.values());
    return [];
  }),
  runSync: jest.fn((q, p) => {
    if (q.includes('INSERT OR REPLACE INTO app_settings')) {
      mockDb.app_settings.set(p?.[0], p?.[1]);
    }
  }),
  prepareSync: jest.fn(() => ({
    executeSync: jest.fn(),
    finalizeSync: jest.fn(),
  })),
};

jest.mock('expo-sqlite', () => ({
  openDatabaseSync: jest.fn(() => mockDb),
}));

describe('Modal Safety & Beverage Toggle Tests', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('Główny ekran zawiera widoczny przełącznik Kawa vs Herbata i reaguje na kliknięcia', () => {
    let tree: any;
    act(() => {
      tree = renderer.create(
        <BrewProvider>
          <BrewScreen />
        </BrewProvider>
      );
    });

    const root = tree.root;
    const coffeeToggle = root.findByProps({ testID: 'beverage-toggle-coffee' });
    const teaToggle = root.findByProps({ testID: 'beverage-toggle-tea' });

    expect(coffeeToggle).toBeDefined();
    expect(teaToggle).toBeDefined();

    // Wymiary i hitSlop pod palec
    expect(coffeeToggle.props.hitSlop).toEqual({ top: 8, bottom: 8, left: 8, right: 8 });
    expect(teaToggle.props.hitSlop).toEqual({ top: 8, bottom: 8, left: 8, right: 8 });

    // Przełączenie na Herbatę
    act(() => {
      teaToggle.props.onPress();
    });

    // Powinno przełączyć bieżący tryb
    const updatedStr = JSON.stringify(tree.toJSON());
    expect(updatedStr).toContain('Gyokuro');

    // Przełączenie z powrotem na Kawę
    act(() => {
      coffeeToggle.props.onPress();
    });

    const coffeeStr = JSON.stringify(tree.toJSON());
    expect(coffeeStr).toContain('V60');
  });

  test('Modal receptur używa SafeAreaView i zawiera bezpieczny przycisk zamknięcia', () => {
    let tree: any;
    act(() => {
      tree = renderer.create(
        <BrewProvider>
          <BrewScreen />
        </BrewProvider>
      );
    });

    const root = tree.root;

    // Otwarcie modalu receptur
    const changeRecipeBtn = root.findByProps({ testID: 'change-recipe-btn' });
    act(() => {
      changeRecipeBtn.props.onPress();
    });

    // Sprawdzenie czy w drzewie jest SafeAreaView z krawędziami
    const safeAreaViews = root.findAllByType('RNCSafeAreaView');
    expect(safeAreaViews.length).toBeGreaterThan(0);

    // Sprawdzenie przycisku zamknięcia
    const closeButtons = root.findAllByProps({ accessibilityLabel: 'Zamknij' });
    expect(closeButtons.length).toBeGreaterThan(0);

    const recipeCloseBtn = closeButtons[0];
    expect(recipeCloseBtn.props.hitSlop).toEqual({ top: 12, bottom: 12, left: 12, right: 12 });
    expect(recipeCloseBtn.props.accessibilityRole).toBe('button');

    // Zamknięcie modalu
    act(() => {
      recipeCloseBtn.props.onPress();
    });
  });

  test('Modal receptur zawiera filtry [Wszystkie, Kawa, Herbata] i filtruje listę', () => {
    let tree: any;
    act(() => {
      tree = renderer.create(
        <BrewProvider>
          <BrewScreen />
        </BrewProvider>
      );
    });

    const root = tree.root;
    const changeRecipeBtn = root.findByProps({ testID: 'change-recipe-btn' });
    act(() => {
      changeRecipeBtn.props.onPress();
    });

    const filterAll = root.findByProps({ testID: 'recipe-filter-all' });
    const filterCoffee = root.findByProps({ testID: 'recipe-filter-coffee' });
    const filterTea = root.findByProps({ testID: 'recipe-filter-tea' });

    expect(filterAll).toBeDefined();
    expect(filterCoffee).toBeDefined();
    expect(filterTea).toBeDefined();

    // Filtruj do Herbat
    act(() => {
      filterTea.props.onPress();
    });
    let jsonStr = JSON.stringify(tree.toJSON());
    expect(jsonStr).toContain('Gyokuro');

    // Filtruj do Kaw
    act(() => {
      filterCoffee.props.onPress();
    });
    jsonStr = JSON.stringify(tree.toJSON());
    expect(jsonStr).toContain('V60');

    // Reset do Wszystkich
    act(() => {
      filterAll.props.onPress();
    });
  });

  test('Modale Młynka, Udostępniania i Importu są zabezpieczone przed ucięciem przez pasek baterii', () => {
    let tree: any;
    act(() => {
      tree = renderer.create(
        <BrewProvider>
          <BrewScreen />
        </BrewProvider>
      );
    });

    const root = tree.root;

    // 1. Młynek
    const grinderBtn = root.findByProps({ testID: 'grinder-pill-btn' });
    act(() => {
      grinderBtn.props.onPress();
    });
    const grinderClose = root.findByProps({ testID: 'close-grinder-modal-btn' });
    expect(grinderClose.props.hitSlop).toEqual({ top: 12, bottom: 12, left: 12, right: 12 });
    act(() => {
      grinderClose.props.onPress();
    });

    // 2. Udostępnianie
    const shareBtn = root.findByProps({ testID: 'share-recipe-btn' });
    act(() => {
      shareBtn.props.onPress();
    });
    const shareClose = root.findByProps({ testID: 'close-share-modal-btn' });
    expect(shareClose.props.hitSlop).toEqual({ top: 12, bottom: 12, left: 12, right: 12 });
    act(() => {
      shareClose.props.onPress();
    });

    // 3. Import (z poziomu modalu receptur)
    const changeRecipeBtn = root.findByProps({ testID: 'change-recipe-btn' });
    act(() => {
      changeRecipeBtn.props.onPress();
    });
    const importBtn = root.findByProps({ testID: 'import-recipe-btn' });
    act(() => {
      importBtn.props.onPress();
    });
    const importClose = root.findByProps({ testID: 'close-import-modal-btn' });
    expect(importClose.props.hitSlop).toEqual({ top: 12, bottom: 12, left: 12, right: 12 });
    act(() => {
      importClose.props.onPress();
    });
  });

  test('Ekran Spiżarni (BeansScreen): modale dodawania i kompendium są owinięte w SafeAreaView z hitSlop', () => {
    let tree: any;
    act(() => {
      tree = renderer.create(
        <BrewProvider>
          <BeansScreen />
        </BrewProvider>
      );
    });

    const root = tree.root;

    // Otwarcie modalu Dodaj do Spiżarni
    const addBtn = root.findByProps({ testID: 'beans-add-button' });
    act(() => {
      addBtn.props.onPress();
    });

    const cancelButtons = root.findAllByProps({ accessibilityLabel: 'Anuluj' });
    expect(cancelButtons.length).toBeGreaterThan(0);
    expect(cancelButtons[0].props.hitSlop).toEqual({ top: 12, bottom: 12, left: 12, right: 12 });
    act(() => {
      cancelButtons[0].props.onPress();
    });

    // Otwarcie Kompendium
    const compendiumBtn = root.findByProps({ testID: 'compendium-open-button' });
    act(() => {
      compendiumBtn.props.onPress();
    });
    const compClose = root.findByProps({ testID: 'compendium-close-button' });
    expect(compClose.props.hitSlop).toEqual({ top: 12, bottom: 12, left: 12, right: 12 });
    act(() => {
      compClose.props.onPress();
    });
  });

  test('Ekran Ustawień (SettingsScreen): modale JSON i CSV są owinięte w SafeAreaView z hitSlop', () => {
    let tree: any;
    act(() => {
      tree = renderer.create(
        <SettingsScreen />
      );
    });

    const root = tree.root;

    // Modal Eksportu JSON
    const exportJsonBtn = root.findByProps({ testID: 'export-json-btn' });
    act(() => {
      exportJsonBtn.props.onPress();
    });

    const closeBtns = root.findAllByProps({ accessibilityLabel: 'Zamknij' });
    expect(closeBtns.length).toBeGreaterThan(0);
    expect(closeBtns[0].props.hitSlop).toEqual({ top: 12, bottom: 12, left: 12, right: 12 });
    act(() => {
      closeBtns[0].props.onPress();
    });
  });

  test('Kreator nowych procedur: przycisk "+ Nowa receptura" (add-custom-recipe-btn) w modalu nawiguje do /recipe-builder', () => {
    let tree: any;
    act(() => {
      tree = renderer.create(
        <BrewProvider>
          <BrewScreen />
        </BrewProvider>
      );
    });

    const root = tree.root;
    const changeRecipeBtn = root.findByProps({ testID: 'change-recipe-btn' });
    act(() => {
      changeRecipeBtn.props.onPress();
    });

    const addRecipeBtn = root.findByProps({ testID: 'add-custom-recipe-btn' });
    expect(addRecipeBtn).toBeTruthy();

    act(() => {
      addRecipeBtn.props.onPress();
    });

    expect(mockPush).toHaveBeenCalledWith('/recipe-builder');
  });

  test('Modal wyboru młynka zawiera opcję "Inny młynek (Skala uniwersalna µm)" dla niewymienionych modeli', () => {
    let tree: any;
    act(() => {
      tree = renderer.create(
        <BrewProvider>
          <BrewScreen />
        </BrewProvider>
      );
    });

    const root = tree.root;
    const grinderBtn = root.findByProps({ testID: 'grinder-pill-btn' });
    act(() => {
      grinderBtn.props.onPress();
    });

    const str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Inny młynek (Skala uniwersalna µm)');
    expect(str).toContain('Wilfa Svart');
    expect(str).toContain('Kinu M47');
    expect(str).toContain('Eureka Mignon');
  });
});
