// ============================================================================
// Napar (Steepwise) — Unit Tests: CaffeineScreen (app/(tabs)/caffeine.tsx)
// ============================================================================

import React from 'react';
import renderer from 'react-test-renderer';
import CaffeineScreen from '../../../app/(tabs)/caffeine';
import * as database from '../database';
import { CaffeineLog } from '../database-schema';

jest.mock('../database', () => ({
  getCaffeineLogs: jest.fn(),
  logCaffeine: jest.fn(),
  deleteCaffeineLog: jest.fn(),
  getBedtimeHour: jest.fn(() => 23),
  setBedtimeHour: jest.fn(),
  getCaffeineHalfLife: jest.fn(() => 5.0),
  setCaffeineHalfLife: jest.fn(),
  getUnitSystem: jest.fn(() => 'metric'),
}));

jest.mock('../healthkit', () => ({
  getHealthKitSyncEnabled: jest.fn(() => false),
  saveDietaryCaffeineSample: jest.fn().mockResolvedValue({ success: true }),
}));

describe('CaffeineScreen (Caffeine & Sleep Curfew)', () => {
  const mockLogs: CaffeineLog[] = [
    {
      id: 'log-1',
      beverageName: 'V60 Kenia Nyeri',
      beverageType: 'coffee',
      consumedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(), // 2h temu
      doseGrams: 15,
      caffeineMg: 120,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (database.getCaffeineLogs as jest.Mock).mockReturnValue(mockLogs);
  });

  test('Renderuje ekran kofeiny z aktywną dawką, wykresem kinetyki i historią', () => {
    let tree: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(<CaffeineScreen />);
    });

    const root = tree!.root;
    expect(root.findByProps({ testID: 'bedtime-dec-btn' })).toBeDefined();
    expect(root.findByProps({ testID: 'bedtime-inc-btn' })).toBeDefined();
    expect(root.findByProps({ testID: 'halflife-dec-btn' })).toBeDefined();
    expect(root.findByProps({ testID: 'halflife-inc-btn' })).toBeDefined();
    expect(root.findByProps({ testID: 'quick-add-caffeine-btn' })).toBeDefined();
    expect(root.findByProps({ testID: 'delete-caffeine-log-log-1' })).toBeDefined();
  });

  test('Koryguje docelową godzinę snu i zapisuje w bazie', () => {
    let tree: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(<CaffeineScreen />);
    });

    const root = tree!.root;
    const decBtn = root.findByProps({ testID: 'bedtime-dec-btn' });
    const incBtn = root.findByProps({ testID: 'bedtime-inc-btn' });

    renderer.act(() => {
      decBtn.props.onPress();
    });
    expect(database.setBedtimeHour).toHaveBeenCalledWith(22);

    renderer.act(() => {
      incBtn.props.onPress();
    });
    expect(database.setBedtimeHour).toHaveBeenCalledWith(23);
  });

  test('Koryguje czas półtrwania kofeiny (t1/2) i zapisuje w bazie', () => {
    let tree: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(<CaffeineScreen />);
    });

    const root = tree!.root;
    const decBtn = root.findByProps({ testID: 'halflife-dec-btn' });
    const incBtn = root.findByProps({ testID: 'halflife-inc-btn' });

    renderer.act(() => {
      decBtn.props.onPress();
    });
    expect(database.setCaffeineHalfLife).toHaveBeenCalledWith(4.5);

    renderer.act(() => {
      incBtn.props.onPress();
    });
    expect(database.setCaffeineHalfLife).toHaveBeenCalledWith(5.0);
  });

  test('Usuwa wpis kofeiny z historii i odświeża listę', () => {
    let tree: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(<CaffeineScreen />);
    });

    const root = tree!.root;
    const deleteBtn = root.findByProps({ testID: 'delete-caffeine-log-log-1' });

    renderer.act(() => {
      deleteBtn.props.onPress();
    });

    expect(database.deleteCaffeineLog).toHaveBeenCalledWith('log-1');
  });

  test('Renderuje stan pusty gdy brak wpisów w danym dniu', () => {
    (database.getCaffeineLogs as jest.Mock).mockReturnValue([]);

    let tree: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(<CaffeineScreen />);
    });

    expect(tree!.toJSON()).toBeDefined();
  });
});
