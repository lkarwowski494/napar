// ============================================================================
// Napar (Steepwise) — Unit Tests: Live Activity & Dynamic Island Bridge
// BR-ZEG-003 & BR-ZEG-004 & DEC-01
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

describe('ActivityKit Live Activity & Dynamic Island Bridge (BR-ZEG-003, BR-ZEG-004 & DEC-01)', () => {
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

  test('isLiveActivitySupported zwraca false w v1.0 per DEC-01', () => {
    Platform.OS = 'ios';
    expect(isLiveActivitySupported()).toBe(false);

    Platform.OS = 'android';
    expect(isLiveActivitySupported()).toBe(false);
  });

  test('Pobiera i zapisuje preferencję włączenia Live Activity w bazie', () => {
    expect(getLiveActivityEnabled()).toBe(false);

    setLiveActivityEnabled(true);
    expect(getLiveActivityEnabled()).toBe(true);

    setLiveActivityEnabled(false);
    expect(getLiveActivityEnabled()).toBe(false);
  });

  test('formatActivityTimer poprawnie formatuje sekundy do M:SS', () => {
    expect(formatActivityTimer(0)).toBe('0:00');
    expect(formatActivityTimer(5)).toBe('0:05');
    expect(formatActivityTimer(45)).toBe('0:45');
    expect(formatActivityTimer(75)).toBe('1:15');
    expect(formatActivityTimer(300)).toBe('5:00');
    expect(formatActivityTimer(-10)).toBe('0:00');
    expect(formatActivityTimer(NaN)).toBe('0:00');
    expect(formatActivityTimer(Infinity)).toBe('0:00');
    expect(formatActivityTimer(-Infinity)).toBe('0:00');
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

  test('startLiveActivity, updateLiveActivity oraz endLiveActivity są bezpiecznymi no-op w v1.0 (DEC-01)', async () => {
    const res = await startLiveActivity(mockAttributesCoffee, mockState);
    expect(res.success).toBe(false);
    expect(res.activityId).toBeUndefined();
    expect(res.error).toContain('DEC-01');

    const updateRes = await updateLiveActivity('test-id', mockState);
    expect(updateRes.success).toBe(false);
    expect(updateRes.error).toContain('DEC-01');

    const endRes = await endLiveActivity('test-id');
    expect(endRes.success).toBe(false);
    expect(endRes.error).toContain('DEC-01');

    expect(getActiveLiveActivityId()).toBeNull();
  });

  test('TASK-P8-12-NIE: buildDynamicIslandPayload zabezpiecza targetWaterGrams przed NaN i stosuje fallback nazwy kroku', () => {
    const corruptState: any = {
      ...mockState,
      stepNameEn: '',
      stepNamePl: '',
      targetWaterGrams: NaN,
      stepIndex: -5,
      totalSteps: 0,
    };
    const corruptAttr: any = {
      ...mockAttributesCoffee,
      totalWaterGrams: Infinity,
    };

    const payload = buildDynamicIslandPayload(corruptAttr, corruptState, 'en');
    expect(payload.expandedBottomTarget).toBe('Target: 0 g (of 0 g)');
    expect(payload.expandedCenterSubtitle).toContain('Step · Step 1 of 1');
  });

  test('TASK-P9-12-NIE: buildDynamicIslandPayload i buildLiveActivityPayload są odporne na null/undefined', () => {
    const payloadDiNull = buildDynamicIslandPayload(null, null, 'pl');
    expect(payloadDiNull).toBeDefined();
    expect(payloadDiNull.compactLeading).toBe('☕');
    expect(payloadDiNull.expandedCenterTitle).toBe('Napar');
    expect(payloadDiNull.expandedCenterSubtitle).toContain('Parzenie · Krok 1 z 1');
    expect(payloadDiNull.expandedBottomTarget).toContain('Docelowo: 0 g (z 0 g)');

    const payloadLiveUndefined = buildLiveActivityPayload(undefined, undefined, 'en');
    expect(payloadLiveUndefined).toBeDefined();
    expect(payloadLiveUndefined.attributes.recipeName).toBe('Napar');
    expect(payloadLiveUndefined.contentState.stepNameEn).toBe('Brewing');
    expect(payloadLiveUndefined.dynamicIsland.compactLeading).toBe('☕');
    expect(payloadLiveUndefined.dynamicIsland.expandedCenterSubtitle).toContain('Brewing · Step 1 of 1');
  });
});
