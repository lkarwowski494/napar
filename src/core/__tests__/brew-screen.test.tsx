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
  });
});
