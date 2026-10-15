// ============================================================================
// Napar (Steepwise) — Unit Tests: GongfuScreen UI & Multi-Infusion Tracker
// ============================================================================

import React from 'react';
import renderer from 'react-test-renderer';

// Mock in-memory DB for SQLite
const mockDb: any = {
  inventory: new Map<string, any>(),
  sessions: new Map<string, any>(),
  caffeine: new Map<string, any>(),
  execSync: jest.fn(),
  getFirstSync: jest.fn(),
  getAllSync: jest.fn((query: string) => {
    if (query.includes('FROM inventory_items')) {
      return [
        {
          id: 'tea-1',
          name: 'Da Hong Pao Reserve',
          type: 'tea',
          initial_weight_g: 50,
          remaining_weight_g: 43,
          flavor_notes_json: JSON.stringify(['Orchidea', 'Dym']),
          is_favorite: 1,
          is_archived: 0,
        },
      ];
    }
    return [];
  }),
  runSync: jest.fn(),
};

jest.mock('expo-sqlite', () => ({
  openDatabaseSync: jest.fn(() => mockDb),
}));

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
    back: jest.fn(),
  }),
}));

import GongfuScreen from '../../../app/gongfu';

describe('GongfuScreen Component', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('Renderuje ekran GongfuScreen z licznikiem infuzji i domyślnym czasem', () => {
    let tree: any;
    renderer.act(() => {
      tree = renderer.create(<GongfuScreen />);
    });

    const json = tree.toJSON();
    expect(json).toBeTruthy();
    const str = JSON.stringify(json);

    expect(str).toContain('Gongfu Cha');
    expect(str).toContain('Wulong Skalny');
    expect(str).toContain('Infuzja');
    expect(str).toContain('#1');
    expect(str).toContain('START INFUZJI');
    expect(str).toContain('Łączna kofeina sesji');
  });
});
