// ============================================================================
// Napar (Steepwise) — Component Integration Tests: BrewScreen & Screens
// ============================================================================

import React from 'react';
import renderer, { act } from 'react-test-renderer';
import BrewScreen from '../../../app/(tabs)/index';
import { BrewProvider } from '../brew-context';

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

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    navigate: jest.fn(),
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
      'rec-1',
      {
        id: 'rec-1',
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
  ]),
  sessions: new Map(),
  caffeine: new Map(),
  execSync: jest.fn(),
  getFirstSync: jest.fn((q, p) => {
    if (q.includes('COUNT(*) as count FROM recipes')) return { count: 1 };
    if (q.includes('FROM recipes WHERE id = ?')) return mockDb.recipes.get(p?.[0]) || null;
    return null;
  }),
  getAllSync: jest.fn((q) => {
    if (q.includes('FROM recipes')) return Array.from(mockDb.recipes.values());
    if (q.includes('FROM inventory_items')) return Array.from(mockDb.inventory.values());
    return [];
  }),
  runSync: jest.fn(),
  prepareSync: jest.fn(() => ({
    executeSync: jest.fn(),
    finalizeSync: jest.fn(),
  })),
};

jest.mock('expo-sqlite', () => ({
  openDatabaseSync: jest.fn(() => mockDb),
}));

describe('BrewScreen UI Integration', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('Renderuje ekran parzenia z domyślną recepturą Kasuya 4:6', () => {
    let tree: any;
    act(() => {
      tree = renderer.create(
        <BrewProvider>
          <BrewScreen />
        </BrewProvider>
      );
    });

    const json = tree.toJSON();
    expect(json).toBeTruthy();

    const str = JSON.stringify(json);
    expect(str).toContain('V60 — Metoda 4:6');
    expect(str).toContain('ROZPOCZNIJ PARZENIE');
    expect(str).toContain('00:00');
    expect(str).toContain('Porcje');
    expect(str).toContain('1 os.');
    expect(str).toContain('2 os.');
  });

  test('Przełączenie skalowania porcji (2 os.) podwaja dozę i wyświetla rekomendację mielenia', () => {
    let tree: any;
    act(() => {
      tree = renderer.create(
        <BrewProvider>
          <BrewScreen />
        </BrewProvider>
      );
    });

    const twoCupsBtn = tree.root.findAll((node: any) => {
      return node.props && node.props.children === '2 os.';
    })[0];

    expect(twoCupsBtn).toBeDefined();

    let parent = twoCupsBtn.parent;
    while (parent && !parent.props.onPress) {
      parent = parent.parent;
    }

    act(() => {
      parent.props.onPress();
    });

    const str = JSON.stringify(tree.toJSON());
    expect(str).toContain('+2 kliki grubiej');
    expect(str).toContain('40g');
  });

  test('Cykl kontroli stopera: START, PAUZA, WZNÓW i Zakończenie parzenia', () => {
    let tree: any;
    act(() => {
      tree = renderer.create(
        <BrewProvider>
          <BrewScreen />
        </BrewProvider>
      );
    });

    // 1. Kliknij START (ROZPOCZNIJ PARZENIE)
    const startText = tree.root.findAll((node: any) => {
      return node.props && node.props.children === 'ROZPOCZNIJ PARZENIE';
    })[0];
    expect(startText).toBeDefined();

    let startBtn = startText.parent;
    while (startBtn && !startBtn.props.onPress) {
      startBtn = startBtn.parent;
    }

    act(() => {
      startBtn.props.onPress();
    });

    // Po starcie pojawia się przycisk PAUZA
    let str = JSON.stringify(tree.toJSON());
    expect(str).toContain('PAUZA');

    // 2. Kliknij PAUZA
    const pauseText = tree.root.findAll((node: any) => {
      return node.props && node.props.children === 'PAUZA';
    })[0];
    let pauseBtn = pauseText.parent;
    while (pauseBtn && !pauseBtn.props.onPress) {
      pauseBtn = pauseBtn.parent;
    }

    act(() => {
      pauseBtn.props.onPress();
    });

    // Po pauzie pojawia się WZNÓW
    str = JSON.stringify(tree.toJSON());
    expect(str).toContain('WZNÓW');
    expect(str).toContain('Zapisz');

    // 3. Kliknij Zapisz (otwiera modal karty degustacyjnej)
    const saveText = tree.root.findAll((node: any) => {
      return node.props && node.props.children === 'Zapisz';
    })[0];
    let saveBtn = saveText.parent;
    while (saveBtn && !saveBtn.props.onPress) {
      saveBtn = saveBtn.parent;
    }

    act(() => {
      saveBtn.props.onPress();
    });

    // Modal podsumowania parzenia otwarty
    str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Zakończono Parzenie!');
    expect(str).toContain('Wykres Sensoryki SCA (Spider Graph)');
    expect(str).toContain('Zapisz w Dzienniku');

    // 4. Kliknij Zapisz w Dzienniku
    const finishSaveText = tree.root.findAll((node: any) => {
      return node.props && node.props.children === 'Zapisz w Dzienniku';
    })[0];
    let finishSaveBtn = finishSaveText.parent;
    while (finishSaveBtn && !finishSaveBtn.props.onPress) {
      finishSaveBtn = finishSaveBtn.parent;
    }

    act(() => {
      finishSaveBtn.props.onPress();
    });

    expect(mockDb.runSync).toHaveBeenCalled();
  });

  test('Otwarcie modala wyboru receptury i spiżarni', () => {
    let tree: any;
    act(() => {
      tree = renderer.create(
        <BrewProvider>
          <BrewScreen />
        </BrewProvider>
      );
    });

    // Kliknij kafel RECEPTURA
    const recipeCard = tree.root.findByProps({
      accessibilityLabel: 'Wybrany przepis: V60 — Metoda 4:6',
    });

    act(() => {
      recipeCard.props.onPress();
    });

    let str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Wybierz Recepturę');

    // Kliknij kafel SPIŻARNIA
    const pantryCard = tree.root.findByProps({
      accessibilityLabel: 'Wybierz ziarna ze spiżarni',
    });

    act(() => {
      pantryCard.props.onPress();
    });

    str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Wybierz ze Spiżarni');
    expect(str).toContain('Brak przypisania (ogólne)');
  });

  test('Przełącza ulubione receptury (gwiazdka) w modalu wyboru receptury', () => {
    let tree: any;
    act(() => {
      tree = renderer.create(
        <BrewProvider>
          <BrewScreen />
        </BrewProvider>
      );
    });

    // Otwórz modal receptury
    const recipeCard = tree.root.findByProps({
      accessibilityLabel: 'Wybrany przepis: V60 — Metoda 4:6',
    });
    act(() => {
      recipeCard.props.onPress();
    });

    // Znajdź przycisk ulubionych dla receptury
    const favBtn = tree.root.findByProps({
      accessibilityLabel: 'Ulubione: V60 — Metoda 4:6',
    });

    act(() => {
      favBtn.props.onPress({ stopPropagation: jest.fn() });
    });

    expect(mockDb.runSync).toHaveBeenCalled();
  });
});
