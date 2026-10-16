// ============================================================================
// Napar (Steepwise) — Unit Tests: Apple HealthKit Bridge (BR-KOF-002)
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
} from '../healthkit';
import * as databaseModule from '../database';

describe('Apple HealthKit Dietary Caffeine Bridge (BR-KOF-002)', () => {
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

  test('isHealthKitAvailable zwraca true na iOS i false na Androidzie', () => {
    Platform.OS = 'ios';
    expect(isHealthKitAvailable()).toBe(true);

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

  test('Zwraca status uprawnień: unavailable na innej platformie, not_determined, authorized, denied', () => {
    Platform.OS = 'android';
    expect(getHealthKitAuthorizationStatus()).toBe('unavailable');

    Platform.OS = 'ios';
    expect(getHealthKitAuthorizationStatus()).toBe('not_determined');

    store.set('healthkit_auth_status', 'authorized');
    expect(getHealthKitAuthorizationStatus()).toBe('authorized');

    store.set('healthkit_auth_status', 'denied');
    expect(getHealthKitAuthorizationStatus()).toBe('denied');

    // Nieznana wartość cofa do not_determined
    store.set('healthkit_auth_status', 'something_invalid');
    expect(getHealthKitAuthorizationStatus()).toBe('not_determined');
  });

  test('requestHealthKitPermissions prosi o uprawnienia i ustawia status authorized na iOS', async () => {
    Platform.OS = 'ios';
    const granted = await requestHealthKitPermissions();
    expect(granted).toBe(true);
    expect(getHealthKitAuthorizationStatus()).toBe('authorized');
    expect(getHealthKitSyncEnabled()).toBe(true);
  });

  test('requestHealthKitPermissions zwraca false na platformie bez HealthKit', async () => {
    Platform.OS = 'android';
    const granted = await requestHealthKitPermissions();
    expect(granted).toBe(false);
  });

  test('revokeHealthKitPermissions odwołuje uprawnienia i wyłącza synchronizację', () => {
    Platform.OS = 'ios';
    requestHealthKitPermissions();
    expect(getHealthKitAuthorizationStatus()).toBe('authorized');

    revokeHealthKitPermissions();
    expect(getHealthKitAuthorizationStatus()).toBe('denied');
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

  test('saveDietaryCaffeineSample zwraca błąd gdy brak uprawnień HealthKit', async () => {
    Platform.OS = 'ios';
    revokeHealthKitPermissions();

    const res = await saveDietaryCaffeineSample({
      caffeineMg: 120,
      consumedAt: new Date().toISOString(),
      beverageName: 'V60',
    });
    expect(res.success).toBe(false);
    expect(res.error).toContain('Brak uprawnień do zapisu w Apple Health');
  });

  test('saveDietaryCaffeineSample pomyślnie zapisuje próbkę ilościową gdy autoryzowany', async () => {
    Platform.OS = 'ios';
    await requestHealthKitPermissions();

    const nowIso = new Date().toISOString();
    const res = await saveDietaryCaffeineSample({
      caffeineMg: 135.5,
      consumedAt: nowIso,
      beverageName: 'V60 Etiopia Gedeb',
    });

    expect(res.success).toBe(true);
    expect(res.quantityType).toBe(HK_QUANTITY_TYPE_DIETARY_CAFFEINE);
    expect(res.caffeineMg).toBe(135.5);
    expect(res.consumedAt).toBe(nowIso);
    expect(res.sampleId).toMatch(/^hk-/);
  });
});
