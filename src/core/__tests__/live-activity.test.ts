// ============================================================================
// Napar (Steepwise) — Unit Tests: Live Activity & Dynamic Island Bridge
// BR-ZEG-003 & BR-ZEG-004
// ============================================================================

jest.mock('expo-sqlite', () => ({
  openDatabaseSync: jest.fn(() => ({
    execSync: jest.fn(),
    getFirstSync: jest.fn(),
    getAllSync: jest.fn(() => []),
    runSync: jest.fn(),
  })),
}));

import { Platform } from 'react-native';
import {
  isLiveActivitySupported,
  getLiveActivityEnabled,
  setLiveActivityEnabled,
  formatActivityTimer,
  buildDynamicIslandPayload,
  buildLiveActivityPayload,
  startLiveActivity,
  updateLiveActivity,
  endLiveActivity,
  getActiveLiveActivityId,
  BrewActivityAttributes,
  BrewActivityContentState,
} from '../live-activity';
import * as databaseModule from '../database';

describe('ActivityKit Live Activity & Dynamic Island Bridge (BR-ZEG-003, BR-ZEG-004)', () => {
  const store = new Map<string, string>();

  const mockAttributesCoffee: BrewActivityAttributes = {
    sessionId: 'session-v60-123',
    recipeName: 'V60 Master Single Pour',
    method: 'V60',
    beverageType: 'COFFEE',
    totalWaterGrams: 300,
  };

  const mockAttributesTea: BrewActivityAttributes = {
    sessionId: 'session-gongfu-456',
    recipeName: 'Da Hong Pao Gongfu',
    method: 'Gongfu Cha',
    beverageType: 'TEA',
    totalWaterGrams: 100,
  };

  const mockState: BrewActivityContentState = {
    stepIndex: 1,
    totalSteps: 3,
    stepNamePl: 'Główne zalanie',
    stepNameEn: 'Main Pour',
    stepRemainingSeconds: 45,
    stepDurationSeconds: 60,
    totalElapsedSeconds: 75,
    targetWaterGrams: 200,
    isPaused: false,
    isFinished: false,
  };

  beforeEach(() => {
    store.clear();
    Platform.OS = 'ios';
    jest.spyOn(databaseModule, 'getAppSetting').mockImplementation((key: string, def = '') => {
      return store.get(key) ?? def;
    });
    jest.spyOn(databaseModule, 'setAppSetting').mockImplementation((key: string, val: string) => {
      store.set(key, val);
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('isLiveActivitySupported zwraca true na iOS i false na Androidzie', () => {
    Platform.OS = 'ios';
    expect(isLiveActivitySupported()).toBe(true);

    Platform.OS = 'android';
    expect(isLiveActivitySupported()).toBe(false);
  });

  test('Pobiera i zapisuje preferencję włączenia Live Activity w bazie', () => {
    expect(getLiveActivityEnabled()).toBe(true);

    setLiveActivityEnabled(false);
    expect(getLiveActivityEnabled()).toBe(false);

    setLiveActivityEnabled(true);
    expect(getLiveActivityEnabled()).toBe(true);
  });

  test('formatActivityTimer poprawnie formatuje sekundy do M:SS', () => {
    expect(formatActivityTimer(0)).toBe('0:00');
    expect(formatActivityTimer(5)).toBe('0:05');
    expect(formatActivityTimer(45)).toBe('0:45');
    expect(formatActivityTimer(75)).toBe('1:15');
    expect(formatActivityTimer(300)).toBe('5:00');
    expect(formatActivityTimer(-10)).toBe('0:00');
  });

  test('buildDynamicIslandPayload generuje poprawny payload dla kawy i herbaty (PL & EN)', () => {
    // Kawa PL
    const diCoffeePl = buildDynamicIslandPayload(mockAttributesCoffee, mockState, 'pl');
    expect(diCoffeePl.compactLeading).toBe('☕');
    expect(diCoffeePl.compactTrailing).toBe('0:45');
    expect(diCoffeePl.expandedCenterTitle).toBe('V60 Master Single Pour');
    expect(diCoffeePl.expandedCenterSubtitle).toContain('Główne zalanie · Krok 2 z 3');
    expect(diCoffeePl.expandedBottomTarget).toContain('Docelowo: 200 g (z 300 g)');

    // Herbata EN
    const diTeaEn = buildDynamicIslandPayload(mockAttributesTea, mockState, 'en');
    expect(diTeaEn.compactLeading).toBe('🍵');
    expect(diTeaEn.compactTrailing).toBe('0:45');
    expect(diTeaEn.expandedCenterTitle).toBe('Da Hong Pao Gongfu');
    expect(diTeaEn.expandedCenterSubtitle).toContain('Main Pour · Step 2 of 3');
    expect(diTeaEn.expandedBottomTarget).toContain('Target: 200 g (of 100 g)');
  });

  test('buildLiveActivityPayload zwraca pełną strukturę dla widżetu Lock Screen', () => {
    const payload = buildLiveActivityPayload(mockAttributesCoffee, mockState, 'pl');
    expect(payload.attributes).toEqual(mockAttributesCoffee);
    expect(payload.contentState).toEqual(mockState);
    expect(payload.dynamicIsland.compactLeading).toBe('☕');
  });

  test('startLiveActivity obsługuje brak wsparcia platformy i wyłączenie w ustawieniach', async () => {
    // 1. Android
    Platform.OS = 'android';
    const resAndroid = await startLiveActivity(mockAttributesCoffee, mockState);
    expect(resAndroid.success).toBe(false);
    expect(resAndroid.error).toContain('iOS 16.1+');

    // 2. iOS z wyłączoną funkcją
    Platform.OS = 'ios';
    setLiveActivityEnabled(false);
    const resDisabled = await startLiveActivity(mockAttributesCoffee, mockState);
    expect(resDisabled.success).toBe(false);
    expect(resDisabled.error).toContain('wyłączone w ustawieniach');
  });

  test('Cykl życia Live Activity: start, update oraz end', async () => {
    Platform.OS = 'ios';
    setLiveActivityEnabled(true);

    // 1. Start
    const startRes = await startLiveActivity(mockAttributesCoffee, mockState);
    expect(startRes.success).toBe(true);
    expect(startRes.activityId).toBeTruthy();
    expect(getActiveLiveActivityId()).toBe(startRes.activityId);

    const activityId = startRes.activityId!;

    // 2. Update z poprawnym ID
    const updatedState: BrewActivityContentState = {
      ...mockState,
      stepRemainingSeconds: 20,
      totalElapsedSeconds: 100,
    };
    const updateRes = await updateLiveActivity(activityId, updatedState);
    expect(updateRes.success).toBe(true);

    // 3. Update z nieistniejącym ID
    const updateBadRes = await updateLiveActivity('invalid-id', updatedState);
    expect(updateBadRes.success).toBe(false);
    expect(updateBadRes.error).toContain('Nie znaleziono aktywnej sesji');

    // 4. Update na Androidzie
    Platform.OS = 'android';
    const updateAndroid = await updateLiveActivity(activityId, updatedState);
    expect(updateAndroid.success).toBe(false);
    Platform.OS = 'ios';

    // 5. End na Androidzie
    Platform.OS = 'android';
    const endAndroid = await endLiveActivity(activityId);
    expect(endAndroid.success).toBe(false);
    Platform.OS = 'ios';

    // 6. End pomyślny
    const endRes = await endLiveActivity(activityId);
    expect(endRes.success).toBe(true);
    expect(getActiveLiveActivityId()).toBeNull();
  });
});
