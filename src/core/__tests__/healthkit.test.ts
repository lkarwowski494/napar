// ============================================================================
// Napar (Steepwise) — Unit Tests: Apple HealthKit Bridge (BR-KOF-002)
// Aligned with Architectural Decision DEC-01 (Deferred to v1.2, zero fake IDs)
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
  isHealthKitAvailable,
  getHealthKitSyncEnabled,
  setHealthKitSyncEnabled,
  getHealthKitAuthorizationStatus,
  requestHealthKitPermissions,
  revokeHealthKitPermissions,
  saveDietaryCaffeineSample,
  HK_QUANTITY_TYPE_DIETARY_CAFFEINE,
  HealthKitAuthorizationStatus,
} from '../healthkit';
import * as databaseModule from '../database';

describe('Apple HealthKit Dietary Caffeine Bridge (BR-KOF-002 & DEC-01)', () => {
  const store = new Map<string, string>();

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

  test('isHealthKitAvailable zwraca false w v1.0 zgodnie z DEC-01', () => {
    Platform.OS = 'ios';
    expect(isHealthKitAvailable()).toBe(false);

    Platform.OS = 'android';
    expect(isHealthKitAvailable()).toBe(false);
  });

  test('Pobiera i zapisuje preferencję synchronizacji HealthKit', () => {
    expect(getHealthKitSyncEnabled()).toBe(false);

    setHealthKitSyncEnabled(true);
    expect(getHealthKitSyncEnabled()).toBe(true);

    setHealthKitSyncEnabled(false);
    expect(getHealthKitSyncEnabled()).toBe(false);
  });

  test('Zwraca status uprawnień: unavailable w v1.0 bez natywnego mostka', () => {
    Platform.OS = 'android';
    expect(getHealthKitAuthorizationStatus()).toBe('unavailable');

    Platform.OS = 'ios';
    expect(getHealthKitAuthorizationStatus()).toBe('unavailable');
  });

  test('requestHealthKitPermissions zwraca false w v1.0 bez natywnego modułu', async () => {
    Platform.OS = 'ios';
    const granted = await requestHealthKitPermissions();
    expect(granted).toBe(false);
  });

  test('revokeHealthKitPermissions wyłącza synchronizację', () => {
    setHealthKitSyncEnabled(true);
    expect(getHealthKitSyncEnabled()).toBe(true);

    revokeHealthKitPermissions();
    expect(getHealthKitSyncEnabled()).toBe(false);
  });

  test('saveDietaryCaffeineSample waliduje dawkę kofeiny (mg > 0)', async () => {
    const res = await saveDietaryCaffeineSample({
      caffeineMg: 0,
      consumedAt: new Date().toISOString(),
      beverageName: 'Decaf',
    });
    expect(res.success).toBe(false);
    expect(res.error).toContain('musi być większa od zera');
  });

  test('saveDietaryCaffeineSample waliduje niepoprawny znacznik czasu', async () => {
    const res = await saveDietaryCaffeineSample({
      caffeineMg: 120,
      consumedAt: 'not-a-valid-date',
      beverageName: 'V60',
    });
    expect(res.success).toBe(false);
    expect(res.error).toContain('Nieprawidłowy znacznik czasu');
  });

  test('saveDietaryCaffeineSample bezpiecznie odrzuca zapis bez generowania fikcyjnych próbek (DEC-01)', async () => {
    Platform.OS = 'ios';
    const res = await saveDietaryCaffeineSample({
      caffeineMg: 135.5,
      consumedAt: new Date().toISOString(),
      beverageName: 'V60 Etiopia Gedeb',
    });
    expect(res.success).toBe(false);
    expect(res.quantityType).toBe(HK_QUANTITY_TYPE_DIETARY_CAFFEINE);
    expect(res.sampleId).toBeUndefined();
    expect(res.error).toContain('DEC-01');
  });

  test('HealthKitAuthorizationStatus typ definiuje stany autoryzacji', () => {
    const status: HealthKitAuthorizationStatus = getHealthKitAuthorizationStatus();
    expect(['not_determined', 'authorized', 'denied', 'unavailable']).toContain(status);
  });
});
