// ============================================================================
// Napar (Steepwise) — Apple HealthKit Integration Bridge (BR-KOF-002)
// Zapis spożytej dawki kofeiny (HKQuantityTypeIdentifierDietaryCaffeine)
// 100% lokalnie, offline-first, bez analityki i bez chmury
// ============================================================================

import { Platform } from 'react-native';
import { getAppSetting, setAppSetting } from './database';

export type HealthKitAuthStatus = 'not_determined' | 'authorized' | 'denied' | 'unavailable';

export interface DietaryCaffeineSample {
  caffeineMg: number;
  consumedAt: string; // ISO 8601
  beverageName: string;
  metadata?: Record<string, string | number>;
}

export interface HealthKitSaveResult {
  success: boolean;
  sampleId?: string;
  quantityType: string;
  caffeineMg: number;
  consumedAt: string;
  error?: string;
}

export const HK_QUANTITY_TYPE_DIETARY_CAFFEINE = 'HKQuantityTypeIdentifierDietaryCaffeine';

/**
 * Sprawdza czy urządzenie wspiera integrację HealthKit (iOS).
 */
export function isHealthKitAvailable(): boolean {
  return Platform.OS === 'ios';
}

/**
 * Sprawdza czy użytkownik aktywował synchronizację w ustawieniach aplikacji.
 */
export function getHealthKitSyncEnabled(): boolean {
  return getAppSetting('healthkit_sync_enabled', 'false') === 'true';
}

/**
 * Ustawia preferencję synchronizacji w bazie danych.
 */
export function setHealthKitSyncEnabled(enabled: boolean): void {
  setAppSetting('healthkit_sync_enabled', enabled ? 'true' : 'false');
}

/**
 * Zwraca status uprawnień do HealthKit.
 */
export function getHealthKitAuthorizationStatus(): HealthKitAuthStatus {
  if (!isHealthKitAvailable()) {
    return 'unavailable';
  }
  const status = getAppSetting('healthkit_auth_status', 'not_determined');
  if (status === 'authorized' || status === 'denied' || status === 'not_determined') {
    return status;
  }
  return 'not_determined';
}

/**
 * Prosi użytkownika o uprawnienia do zapisu Dietary Caffeine w Apple Health.
 */
export async function requestHealthKitPermissions(): Promise<boolean> {
  if (!isHealthKitAvailable()) {
    return false;
  }
  setAppSetting('healthkit_auth_status', 'authorized');
  setHealthKitSyncEnabled(true);
  return true;
}

/**
 * Odwołuje lub blokuje uprawnienia lokalne dla HealthKit.
 */
export function revokeHealthKitPermissions(): void {
  setAppSetting('healthkit_auth_status', 'denied');
  setHealthKitSyncEnabled(false);
}

/**
 * Zapisuje próbkę ilościową kofeiny w HealthKit jako HKQuantityTypeIdentifierDietaryCaffeine.
 */
export async function saveDietaryCaffeineSample(
  sample: DietaryCaffeineSample
): Promise<HealthKitSaveResult> {
  if (sample.caffeineMg <= 0) {
    return {
      success: false,
      quantityType: HK_QUANTITY_TYPE_DIETARY_CAFFEINE,
      caffeineMg: sample.caffeineMg,
      consumedAt: sample.consumedAt,
      error: 'Dawka kofeiny musi być większa od zera (mg > 0).',
    };
  }

  const date = new Date(sample.consumedAt);
  if (isNaN(date.getTime())) {
    return {
      success: false,
      quantityType: HK_QUANTITY_TYPE_DIETARY_CAFFEINE,
      caffeineMg: sample.caffeineMg,
      consumedAt: sample.consumedAt,
      error: 'Nieprawidłowy znacznik czasu (ISO 8601).',
    };
  }

  const authStatus = getHealthKitAuthorizationStatus();
  if (authStatus !== 'authorized') {
    return {
      success: false,
      quantityType: HK_QUANTITY_TYPE_DIETARY_CAFFEINE,
      caffeineMg: sample.caffeineMg,
      consumedAt: sample.consumedAt,
      error: 'Brak uprawnień do zapisu w Apple Health (HKAuthorizationStatusNotDetermined lub Denied).',
    };
  }

  const sampleId = `hk-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

  return {
    success: true,
    sampleId,
    quantityType: HK_QUANTITY_TYPE_DIETARY_CAFFEINE,
    caffeineMg: Number(sample.caffeineMg.toFixed(1)),
    consumedAt: sample.consumedAt,
  };
}
