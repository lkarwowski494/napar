// ============================================================================
// Napar (Steepwise) — Port sklepu (granica core <-> StoreKit). Czysty TS, bez expo/react.
// Implementacje: src/platform/store-expo.ts (expo-iap, produkcja) oraz
// src/platform/store-fake.ts (wyłącznie testy Jest i E2E, EXPO_PUBLIC_STORE_FAKE=1).
// Stan Pro wyprowadzany jest z getAvailablePurchases (uprawnienia), nigdy z własnego paragonu.
// Apps4Brew Studio — 100% Offline-First, Zero Telemetry.
// ============================================================================

import type { Entitlement, ProPlan } from './access-policy';

/** Produkt z App Store (cena: displayPrice ustawiony przez Apple). */
export interface StoreProduct {
  productId: string;
  plan: ProPlan;
  displayPrice: string;
}

/**
 * Wynik zakupu. `success` wyłącznie przy potwierdzonej transakcji.
 * `unavailable`: produkt nieznany sklepowi (np. nie utworzony w App Store Connect).
 */
export type PurchaseStatus = 'success' | 'cancelled' | 'pending' | 'error' | 'unavailable';

export interface PurchaseResult {
  status: PurchaseStatus;
  productId: string;
}

/** Zmiana transakcji zgłoszona przez sklep (np. odnowienie, zatwierdzenie oczekującego zakupu). */
export interface StoreTransactionEvent {
  productId: string;
}

export type StoreTransactionListener = (event: StoreTransactionEvent) => void;

export interface StoreAdapter {
  /** Produkty znane sklepu; pusta lista, gdy żaden nie istnieje (stan startowy). */
  listProducts(): Promise<StoreProduct[]>;
  purchase(productId: string): Promise<PurchaseResult>;
  /** Aktywne uprawnienia (getAvailablePurchases z onlyIncludeActiveItemsIOS). Rzuca przy błędzie odczytu. */
  restore(): Promise<Entitlement[]>;
  /** Rejestruje nasłuchiwanie transakcji; zwraca funkcję wyrejestrowania. */
  observe(listener: StoreTransactionListener): () => void;
}

let activeAdapter: StoreAdapter | null = null;

/** Podłączenie adaptera przez platformę (bootstrap). Null = brak sklepu: zakup niedostępny. */
export function configureStoreAdapter(adapter: StoreAdapter | null): void {
  activeAdapter = adapter;
}

export function getStoreAdapter(): StoreAdapter | null {
  return activeAdapter;
}
