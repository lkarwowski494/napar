// ============================================================================
// Napar (Steepwise) — Wybór adaptera sklepu (platforma)
// Fałszywy sklep tylko przy EXPO_PUBLIC_STORE_FAKE === '1' (konfiguracja testowa).
// Każda inna wartość, w tym brak zmiennej (build produkcyjny), wybiera expo-iap.
// Apps4Brew Studio — 100% Offline-First, Zero Telemetry.
// ============================================================================

import type { StoreAdapter } from '../core/store-port';
import { createExpoStoreAdapter } from './store-expo';
import { createFakeStoreAdapter } from './store-fake';

export const STORE_FAKE_FLAG_ON = '1';

export function selectStoreAdapter(fakeFlag: string | undefined): StoreAdapter {
  return fakeFlag === STORE_FAKE_FLAG_ON ? createFakeStoreAdapter() : createExpoStoreAdapter();
}
