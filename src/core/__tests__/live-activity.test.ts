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

  test('TASK-P11-12-NIE: formatActivityTimer formatuje czasy wielogodzinne H:MM:SS, a buildDynamicIslandPayload zabezpiecza pusty recipeName', () => {
    // Wielogodzinne infuzje (cold brew)
    expect(formatActivityTimer(3600)).toBe('1:00:00');
    expect(formatActivityTimer(3665)).toBe('1:01:05');
    expect(formatActivityTimer(43200)).toBe('12:00:00');

    // Pusty lub biało-znakowy recipeName
    const payloadBlankTitle = buildDynamicIslandPayload(
      { ...mockAttributesCoffee, recipeName: '   ' },
      mockState,
      'pl'
    );
    expect(payloadBlankTitle.expandedCenterTitle).toBe('Napar');
  });

  test('TASK-P13-12-NIE: formatActivityTimer koercuje ciągi znaków, a update/endLiveActivity walidują activityId', async () => {
    expect(formatActivityTimer('45' as any)).toBe('0:45');
    expect(formatActivityTimer('75' as any)).toBe('1:15');

    const updateEmpty = await updateLiveActivity('', mockState);
    expect(updateEmpty.success).toBe(false);
    expect(updateEmpty.error).toContain('Nieprawidłowy identyfikator');

    const updateWhitespace = await updateLiveActivity('   ', mockState);
    expect(updateWhitespace.success).toBe(false);

    const endEmpty = await endLiveActivity('');
    expect(endEmpty.success).toBe(false);
    expect(endEmpty.error).toContain('Nieprawidłowy identyfikator');
  });

  test('TASK-P14-12-NIE: startLiveActivity waliduje obecność poprawnych obiektów attributes i initialState', async () => {
    const resNullAttr = await startLiveActivity(null as any, mockState);
    expect(resNullAttr.success).toBe(false);
    expect(resNullAttr.error).toContain('Nieprawidłowe atrybuty');

    const resNullState = await startLiveActivity(mockAttributesCoffee, null as any);
    expect(resNullState.success).toBe(false);
    expect(resNullState.error).toContain('Nieprawidłowy stan początkowy');
  });

  test('TASK-P15-12-NIE: buildLiveActivityPayload sanityzuje i ogranicza (clamp/round) ujemne i niefinansowe wartości liczbowe', () => {
    const corruptedState: any = {
      stepIndex: -5,
      totalSteps: 0,
      stepRemainingSeconds: -45,
      stepDurationSeconds: NaN,
      totalElapsedSeconds: -12.7,
      targetWaterGrams: -100,
    };
    const corruptedAttr: any = {
      sessionId: 'sess-bad',
      recipeName: '   Corrupted Brew   ',
      method: 'Aeropress',
      beverageType: 'UNKNOWN',
      totalWaterGrams: -500,
    };

    const payload = buildLiveActivityPayload(corruptedAttr, corruptedState, 'pl');
    expect(payload.contentState.stepIndex).toBe(0);
    expect(payload.contentState.totalSteps).toBe(1);
    expect(payload.contentState.stepRemainingSeconds).toBe(0);
    expect(payload.contentState.stepDurationSeconds).toBe(0);
    expect(payload.contentState.totalElapsedSeconds).toBe(0);
    expect(payload.contentState.targetWaterGrams).toBe(0);

    expect(payload.attributes.recipeName).toBe('Corrupted Brew');
    expect(payload.attributes.beverageType).toBe('COFFEE');
    expect(payload.attributes.totalWaterGrams).toBe(0);
  });

  test('TASK-P16-12-NIE: buildDynamicIslandPayload i buildLiveActivityPayload wykluczają isPaused gdy isFinished===true', () => {
    const finishedPausedState: any = {
      isPaused: true,
      isFinished: true,
    };
    const island = buildDynamicIslandPayload(mockAttributesCoffee, finishedPausedState);
    expect(island.isFinished).toBe(true);
    expect(island.isPaused).toBe(false);

    const fullPayload = buildLiveActivityPayload(mockAttributesCoffee, finishedPausedState);
    expect(fullPayload.contentState.isFinished).toBe(true);
    expect(fullPayload.contentState.isPaused).toBe(false);
  });

  test('TASK-P17-12-NIE: buildDynamicIslandPayload ogranicza safeStepIdx poniżej safeTotalSteps', () => {
    const overflowState: any = {
      stepIndex: 10,
      totalSteps: 3,
      stepNameEn: 'Pour',
    };
    const island = buildDynamicIslandPayload(mockAttributesCoffee, overflowState, 'en');
    // totalSteps = 3, safeStepIdx ograniczone do 2 (krok 3 z 3, a nie 11 z 3)
    expect(island.expandedCenterSubtitle).toBe('Pour · Step 3 of 3');
  });

  test('TASK-P18-12-NIE: formatActivityTimer ogranicza maksymalny czas do 24 godzin (86400s) i chroni przed Infinity', () => {
    expect(formatActivityTimer(Infinity)).toBe('0:00');
    expect(formatActivityTimer(-Infinity)).toBe('0:00');
    expect(formatActivityTimer(1000000)).toBe('24:00:00');
  });

  test('TASK-P19-12-NIE: buildLiveActivityPayload i buildDynamicIslandPayload clampują stepRemainingSeconds <= stepDurationSeconds', () => {
    const overflowRemState: any = {
      stepRemainingSeconds: 120,
      stepDurationSeconds: 45,
    };
    const payload = buildLiveActivityPayload(mockAttributesCoffee, overflowRemState);
    expect(payload.contentState.stepRemainingSeconds).toBe(45);

    const island = buildDynamicIslandPayload(mockAttributesCoffee, overflowRemState);
    expect(island.compactTrailing).toBe('0:45');
  });

  test('TASK-P20-12-NIE: formatActivityTimer ściśle zwraca 0:00 dla ujemnych i zerowych czasów', () => {
    expect(formatActivityTimer(-0)).toBe('0:00');
    expect(formatActivityTimer(0)).toBe('0:00');
    expect(formatActivityTimer(-15)).toBe('0:00');
  });
  test('TASK-P21-12-NIE: buildDynamicIslandPayload i buildLiveActivityPayload ograniczają recipeName do 40 znaków', () => {
    const longNameAttr: BrewActivityAttributes = {
      sessionId: 'sess-long',
      recipeName: 'Very Long Recipe Name That Definitely Exceeds The Maximum Allowed Forty Character Limit For Dynamic Island Banner',
      method: 'V60',
      beverageType: 'COFFEE',
      totalWaterGrams: 300,
    };
    const island = buildDynamicIslandPayload(longNameAttr, mockState);
    expect(island.expandedCenterTitle.length).toBeLessThanOrEqual(40);
    expect(island.expandedCenterTitle).toBe(longNameAttr.recipeName.slice(0, 40));

    const fullPayload = buildLiveActivityPayload(longNameAttr, mockState);
    expect(fullPayload.attributes.recipeName.length).toBeLessThanOrEqual(40);
    expect(fullPayload.attributes.recipeName).toBe(longNameAttr.recipeName.slice(0, 40));
  });
  test('TASK-P22-12-NIE: buildDynamicIslandPayload ogranicza długość stepName do 30 znaków w podtytule', () => {
    const longStepState: any = {
      ...mockState,
      stepNamePl: 'Bardzo Długa Nazwa Kroku Parzenia Przekraczająca Limit Trzydziestu Znaków',
      totalSteps: 3,
      stepIndex: 1,
    };
    const island = buildDynamicIslandPayload(mockAttributesCoffee, longStepState, 'pl');
    expect(island.expandedCenterSubtitle).toContain(longStepState.stepNamePl.slice(0, 30));
    expect(island.expandedCenterSubtitle).toContain('· Krok 2 z 3');
  });
  test('TASK-P23-12-NIE: formatActivityTimer ściśle odrzuca typ boolean, obiekty i nienumeryczne stringi i zwraca 0:00', () => {
    expect(formatActivityTimer(true as any)).toBe('0:00');
    expect(formatActivityTimer(false as any)).toBe('0:00');
    expect(formatActivityTimer('niepoprawny_czas' as any)).toBe('0:00');
    expect(formatActivityTimer({} as any)).toBe('0:00');
    expect(formatActivityTimer(null as any)).toBe('0:00');
    expect(formatActivityTimer(undefined as any)).toBe('0:00');
  });
  test('TASK-P24-12-NIE: buildLiveActivityPayload ogranicza stepIndex ponizej totalSteps', () => {
    const overflowState: any = {
      stepIndex: 10,
      totalSteps: 3,
      stepNamePl: 'Zalewanie',
    };
    const payload = buildLiveActivityPayload(mockAttributesCoffee, overflowState);
    expect(payload.contentState.stepIndex).toBe(2);
    expect(payload.contentState.totalSteps).toBe(3);
  });
  test('TASK-P25-12-NIE: buildDynamicIslandPayload oraz buildLiveActivityPayload zerują czas i odliczanie przy isFinished===true', () => {
    const finishedState: any = {
      stepIndex: 2,
      totalSteps: 3,
      stepDurationSeconds: 60,
      stepRemainingSeconds: 25,
      isFinished: true,
    };
    const dynamicIsland = buildDynamicIslandPayload(mockAttributesCoffee, finishedState);
    expect(dynamicIsland.compactTrailing).toBe('0:00');
    expect(dynamicIsland.expandedTrailingTime).toBe('0:00');
    expect(dynamicIsland.isFinished).toBe(true);

    const livePayload = buildLiveActivityPayload(mockAttributesCoffee, finishedState);
    expect(livePayload.contentState.stepRemainingSeconds).toBe(0);
    expect(livePayload.contentState.isFinished).toBe(true);
  });

  test('TASK-P26-12-NIE: updateLiveActivity waliduje obecność obiektu _state', async () => {
    const resNull = await updateLiveActivity('valid-activity-id', null as any);
    expect(resNull.success).toBe(false);
    expect(resNull.error).toBe('Nieprawidłowy stan aktywności Live Activity.');

    const resUndefined = await updateLiveActivity('valid-activity-id', undefined as any);
    expect(resUndefined.success).toBe(false);
    expect(resUndefined.error).toBe('Nieprawidłowy stan aktywności Live Activity.');
  });

  test('TASK-P27-12-NIE: endLiveActivity waliduje dismissalPolicy oraz activityId', async () => {
    const resBadPolicy = await endLiveActivity('valid-id', 'invalid_policy' as any);
    expect(resBadPolicy.success).toBe(false);
    expect(resBadPolicy.error).toContain('Nieprawidłowa polityka zakończenia');

    const resEmptyId = await endLiveActivity('   ');
    expect(resEmptyId.success).toBe(false);
    expect(resEmptyId.error).toContain('Nieprawidłowy identyfikator');

    const resAfterDelay = await endLiveActivity('valid-id', 'after_delay');
    expect(resAfterDelay.success).toBe(false);
    expect(resAfterDelay.error).toContain('DEC-01');
  });

  test('TASK-P28-12-NIE: startLiveActivity waliduje recipeName oraz totalWaterGrams', async () => {
    const invalidNameAttr: any = {
      recipeId: '1',
      recipeName: '   ',
      beverageType: 'coffee',
      totalWaterGrams: 250,
    };
    const resName = await startLiveActivity(invalidNameAttr, mockState);
    expect(resName.success).toBe(false);
    expect(resName.error).toContain('Nieprawidłowa nazwa receptury');

    const invalidWaterAttr: any = {
      recipeId: '1',
      recipeName: 'Valid Recipe',
      beverageType: 'coffee',
      totalWaterGrams: -10,
    };
    const resWater = await startLiveActivity(invalidWaterAttr, mockState);
    expect(resWater.success).toBe(false);
    expect(resWater.error).toContain('Nieprawidłowa gramatura wody');
  });

  test('TASK-P29-12-NIE: updateLiveActivity waliduje stepIndex w przekazanym stanie', async () => {
    const invalidIndexState: any = {
      ...mockState,
      stepIndex: -1,
    };
    const resNegative = await updateLiveActivity('valid-id', invalidIndexState);
    expect(resNegative.success).toBe(false);
    expect(resNegative.error).toContain('Nieprawidłowy indeks kroku');

    const nanIndexState: any = {
      ...mockState,
      stepIndex: NaN,
    };
    const resNan = await updateLiveActivity('valid-id', nanIndexState);
    expect(resNan.success).toBe(false);
    expect(resNan.error).toContain('Nieprawidłowy indeks kroku');

    const validState: any = {
      ...mockState,
      stepIndex: 2,
    };
    const resValid = await updateLiveActivity('valid-id', validState);
    expect(resValid.success).toBe(false);
    expect(resValid.error).toContain('DEC-01');
  });

  test('TASK-P30-12-NIE: formatActivityTimer zaokragla w dol ulamkowe sekundy i zabezpiecza -0 oraz stringi', () => {
    expect(formatActivityTimer(-0)).toBe('0:00');
    expect(formatActivityTimer(0.9)).toBe('0:00');
    expect(formatActivityTimer(65.8)).toBe('1:05');
    expect(formatActivityTimer('125.7' as any)).toBe('2:05');
    expect(formatActivityTimer(3665.3)).toBe('1:01:05');
    expect(formatActivityTimer('invalid' as any)).toBe('0:00');
    expect(formatActivityTimer(false as any)).toBe('0:00');
    expect(formatActivityTimer(true as any)).toBe('0:00');
  });

  test('TASK-P31-12-NIE: startLiveActivity waliduje stepIndex oraz totalSteps w initialState', async () => {
    const badStepIndexState: any = {
      ...mockState,
      stepIndex: -1,
    };
    const resBadIdx = await startLiveActivity(mockAttributesCoffee, badStepIndexState);
    expect(resBadIdx.success).toBe(false);
    expect(resBadIdx.error).toContain('Nieprawidłowy indeks kroku');

    const badTotalStepsState: any = {
      ...mockState,
      totalSteps: 0,
    };
    const resBadTotal = await startLiveActivity(mockAttributesCoffee, badTotalStepsState);
    expect(resBadTotal.success).toBe(false);
    expect(resBadTotal.error).toContain('Nieprawidłowa łączna liczba kroków');
  });

  test('TASK-P32-12-NIE: updateLiveActivity waliduje totalSteps w parametrze _state', async () => {
    const badTotalZero: any = {
      ...mockState,
      totalSteps: 0,
    };
    const resZero = await updateLiveActivity('valid-act-id', badTotalZero);
    expect(resZero.success).toBe(false);
    expect(resZero.error).toContain('Nieprawidłowa łączna liczba kroków');

    const badTotalNegative: any = {
      ...mockState,
      totalSteps: -3,
    };
    const resNeg = await updateLiveActivity('valid-act-id', badTotalNegative);
    expect(resNeg.success).toBe(false);
    expect(resNeg.error).toContain('Nieprawidłowa łączna liczba kroków');

    const badTotalNaN: any = {
      ...mockState,
      totalSteps: NaN,
    };
    const resNaN = await updateLiveActivity('valid-act-id', badTotalNaN);
    expect(resNaN.success).toBe(false);
    expect(resNaN.error).toContain('Nieprawidłowa łączna liczba kroków');
  });

  test('TASK-P33-12-NIE: buildLiveActivityPayload oraz buildDynamicIslandPayload parsują numeryczne stringi wody i chronią przed -0', () => {
    const attrWithStrings: any = {
      ...mockAttributesCoffee,
      totalWaterGrams: '350.0',
    };
    const stateWithStrings: any = {
      ...mockState,
      targetWaterGrams: '120.0',
    };
    const payload = buildLiveActivityPayload(attrWithStrings, stateWithStrings, 'pl');
    expect(payload.attributes.totalWaterGrams).toBe(350);
    expect(payload.contentState.targetWaterGrams).toBe(120);
    expect(payload.dynamicIsland.expandedBottomTarget).toContain('120 g (z 350 g)');
    expect(Object.is(payload.attributes.totalWaterGrams, -0)).toBe(false);
    expect(Object.is(payload.contentState.targetWaterGrams, -0)).toBe(false);
  });

  test('TASK-P34-12-NIE: startLiveActivity waliduje maksymalną długość nazwy receptury (100) i maksymalną wagę wody (50000)', async () => {
    const longNameAttr: any = {
      ...mockAttributesCoffee,
      recipeName: 'A'.repeat(105),
    };
    const resLongName = await startLiveActivity(longNameAttr, mockState);
    expect(resLongName.success).toBe(false);
    expect(resLongName.error).toContain('Nieprawidłowa nazwa receptury');

    const hugeWaterAttr: any = {
      ...mockAttributesCoffee,
      totalWaterGrams: 999999,
    };
    const resHugeWater = await startLiveActivity(hugeWaterAttr, mockState);
    expect(resHugeWater.success).toBe(false);
    expect(resHugeWater.error).toContain('Nieprawidłowa gramatura wody');

    const minusZeroWaterAttr: any = {
      ...mockAttributesCoffee,
      totalWaterGrams: -0,
    };
    const resMinusZero = await startLiveActivity(minusZeroWaterAttr, mockState);
    expect(resMinusZero.success).toBe(false);
    expect(resMinusZero.error).toContain('Nieprawidłowa gramatura wody');
  });

  test('TASK-P35-12-NIE: updateLiveActivity waliduje stepRemainingSeconds clampując do [0, 86400] i chroniąc przed -0', async () => {
    const badRemainingNegative: any = {
      ...mockState,
      stepRemainingSeconds: -5,
    };
    const resNegative = await updateLiveActivity('valid-act-id', badRemainingNegative);
    expect(resNegative.success).toBe(false);
    expect(resNegative.error).toContain('Nieprawidłowy pozostały czas kroku');

    const badRemainingMinusZero: any = {
      ...mockState,
      stepRemainingSeconds: -0,
    };
    const resMinusZero = await updateLiveActivity('valid-act-id', badRemainingMinusZero);
    expect(resMinusZero.success).toBe(false);
    expect(resMinusZero.error).toContain('Nieprawidłowy pozostały czas kroku');

    const badRemainingHuge: any = {
      ...mockState,
      stepRemainingSeconds: 999999,
    };
    const resHuge = await updateLiveActivity('valid-act-id', badRemainingHuge);
    expect(resHuge.success).toBe(false);
    expect(resHuge.error).toContain('Nieprawidłowy pozostały czas kroku');

    const validRemaining: any = {
      ...mockState,
      stepRemainingSeconds: 45,
    };
    const resValid = await updateLiveActivity('valid-act-id', validRemaining);
    expect(resValid.success).toBe(false);
    expect(resValid.error).toContain('DEC-01');
  });

  test('TASK-P36-12-NIE: updateLiveActivity waliduje targetWaterGrams w zakresie [0, 50000] i chroni przed -0', async () => {
    const badWaterNegative: any = {
      ...mockState,
      targetWaterGrams: -10,
    };
    const resNegative = await updateLiveActivity('valid-act-id', badWaterNegative);
    expect(resNegative.success).toBe(false);
    expect(resNegative.error).toContain('Nieprawidłowa docelowa waga wody');

    const badWaterMinusZero: any = {
      ...mockState,
      targetWaterGrams: -0,
    };
    const resMinusZero = await updateLiveActivity('valid-act-id', badWaterMinusZero);
    expect(resMinusZero.success).toBe(false);
    expect(resMinusZero.error).toContain('Nieprawidłowa docelowa waga wody');

    const badWaterHuge: any = {
      ...mockState,
      targetWaterGrams: 999999,
    };
    const resHuge = await updateLiveActivity('valid-act-id', badWaterHuge);
    expect(resHuge.success).toBe(false);
    expect(resHuge.error).toContain('Nieprawidłowa docelowa waga wody');

    const validWater: any = {
      ...mockState,
      targetWaterGrams: 250,
    };
    const resValid = await updateLiveActivity('valid-act-id', validWater);
    expect(resValid.success).toBe(false);
    expect(resValid.error).toContain('DEC-01');
  });

  test('TASK-P37-12-NIE: buildLiveActivityPayload parsuje stringi dla czasów i chroni przed -0', () => {
    const stateWithStringTimes: any = {
      stepIndex: '1',
      totalSteps: '4',
      stepNamePl: 'Zalanie 2',
      stepNameEn: 'Pour 2',
      stepRemainingSeconds: '25.0',
      stepDurationSeconds: '45.0',
      totalElapsedSeconds: '60.0',
      targetWaterGrams: '150.0',
      isPaused: false,
      isFinished: false,
    };

    const payload = buildLiveActivityPayload(mockAttributesCoffee, stateWithStringTimes, 'pl');
    expect(payload.contentState.stepRemainingSeconds).toBe(25);
    expect(payload.contentState.stepDurationSeconds).toBe(45);
    expect(payload.contentState.totalElapsedSeconds).toBe(60);
    expect(payload.contentState.targetWaterGrams).toBe(150);
    expect(Object.is(payload.contentState.stepRemainingSeconds, -0)).toBe(false);
    expect(Object.is(payload.contentState.stepDurationSeconds, -0)).toBe(false);
    expect(Object.is(payload.contentState.totalElapsedSeconds, -0)).toBe(false);

    // Test z ujemnym zerem
    const stateWithNegativeZero: any = {
      ...mockState,
      stepRemainingSeconds: -0,
      stepDurationSeconds: -0,
      totalElapsedSeconds: -0,
    };
    const payloadNegZero = buildLiveActivityPayload(mockAttributesCoffee, stateWithNegativeZero, 'pl');
    expect(payloadNegZero.contentState.stepRemainingSeconds).toBe(0);
    expect(payloadNegZero.contentState.stepDurationSeconds).toBe(0);
    expect(payloadNegZero.contentState.totalElapsedSeconds).toBe(0);
    expect(Object.is(payloadNegZero.contentState.stepRemainingSeconds, -0)).toBe(false);
    expect(Object.is(payloadNegZero.contentState.stepDurationSeconds, -0)).toBe(false);
    expect(Object.is(payloadNegZero.contentState.totalElapsedSeconds, -0)).toBe(false);
  });

  test('TASK-P38-12-NIE: formatActivityTimer scisle odrzuca symbole, obiekty, tablice, pusty string oraz -0', () => {
    expect(formatActivityTimer(Symbol('sec') as any)).toBe('0:00');
    expect(formatActivityTimer({} as any)).toBe('0:00');
    expect(formatActivityTimer([] as any)).toBe('0:00');
    expect(formatActivityTimer('' as any)).toBe('0:00');
    expect(formatActivityTimer('   ' as any)).toBe('0:00');
    expect(formatActivityTimer('-0' as any)).toBe('0:00');
    expect(formatActivityTimer(-0)).toBe('0:00');
  });
});
