// ============================================================================
// Napar (Steepwise) — Apple HealthKit Dietary Caffeine Bridge (BR-KOF-002)
// Status v1.0: Deferred to v1.2 per Architectural Decision DEC-01 (Scope Contract).
// Safe stub with zero fake samples, 100% type-safe, zero mock IDs.
// Apps4Brew Studio — 100% Offline-First, Zero Telemetry.
// ============================================================================

import { Platform } from 'react-native';
import { getAppSetting, setAppSetting } from './database';

export const HK_QUANTITY_TYPE_DIETARY_CAFFEINE = 'HKQuantityTypeIdentifierDietaryCaffeine';

export interface DietaryCaffeineSample {
  caffeineMg: number;
  consumedAt: string; // ISO 8601
  beverageName?: string;
}

export interface HealthKitSaveResult {
  success: boolean;
  sampleId?: string;
  quantityType: string;
  caffeineMg: number;
  consumedAt: string;
  error?: string;
}

export type HealthKitAuthorizationStatus =
  | 'not_determined'
  | 'authorized'
  | 'denied'
  | 'unavailable';

/**
 * Sprawdza czy HealthKit jest dostępny w bieżącym wydaniu aplikacji.
 * Zgodnie z decyzją architektoniczną DEC-01 (opcja a) natywny mostek
 * HealthKit został odłożony do wydania v1.2.
 */
export function isHealthKitAvailable(): boolean {
  return false;
}

/**
 * Zwraca preferencję synchronizacji HealthKit zapisaną w SQLite.
 */
export function getHealthKitSyncEnabled(): boolean {
  return getAppSetting('healthkit_sync_enabled', 'false') === 'true';
}

/**
 * Zapisuje preferencję synchronizacji HealthKit w SQLite.
 */
export function setHealthKitSyncEnabled(enabled: boolean): void {
  setAppSetting('healthkit_sync_enabled', enabled ? 'true' : 'false');
}

/**
 * Zwraca status autoryzacji HealthKit.
 */
export function getHealthKitAuthorizationStatus(): HealthKitAuthorizationStatus {
  if (!isHealthKitAvailable()) {
    return 'unavailable';
  }
  return 'not_determined';
}

/**
 * Prosi użytkownika o uprawnienia do zapisu Dietary Caffeine w Apple Health.
 */
export async function requestHealthKitPermissions(): Promise<boolean> {
  return false;
}

/**
 * Odwołuje lub blokuje uprawnienia lokalne dla HealthKit.
 */
export function revokeHealthKitPermissions(): void {
  setAppSetting('healthkit_auth_status', 'denied');
  setHealthKitSyncEnabled(false);
}

/**
 * Bezpieczny punkt wejścia do zapisu próbki kofeiny (odłożony do v1.2).
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

  return {
    success: false,
    quantityType: HK_QUANTITY_TYPE_DIETARY_CAFFEINE,
    caffeineMg: sample.caffeineMg,
    consumedAt: sample.consumedAt,
    error: 'Synchronizacja z Apple HealthKit została odłożona do wydania v1.2 (DEC-01).',
  };
}
