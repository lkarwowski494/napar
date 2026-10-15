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
  inventory: new Map(),
  recipes: new Map(),
  sessions: new Map(),
  caffeine: new Map(),
  execSync: jest.fn(),
  getFirstSync: jest.fn((q) => {
    if (q.includes('COUNT(*) as count FROM recipes')) return { count: 12 };
    return null;
  }),
  getAllSync: jest.fn((q) => {
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

    // Sprawdź czy pojawia się tekst domyślnej receptury
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

    // Znajdź przycisk 2 os.
    const buttons = tree.root.findAllByProps({ accessibilityLabel: undefined });
    const twoCupsBtn = tree.root.findAll((node: any) => {
      return node.props && node.props.children === '2 os.';
    })[0];

    expect(twoCupsBtn).toBeDefined();

    // Kliknij przycisk 2 os. (znajdź pressable parent)
    let parent = twoCupsBtn.parent;
    while (parent && !parent.props.onPress) {
      parent = parent.parent;
    }

    act(() => {
      parent.props.onPress();
    });

    const str = JSON.stringify(tree.toJSON());
    expect(str).toContain('+2 kliki grubiej');
    expect(str).toContain('40g'); // 20g * 2
  });
});
