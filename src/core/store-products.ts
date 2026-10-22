// ============================================================================
// Napar (Steepwise) — Identyfikatory produktów Apple (StoreKit, czysta logika)
// Produkty MUSZĄ istnieć w App Store Connect. Tworzy je właściciel (zadanie K-CENA).
// Ceny ustawia Apple: w aplikacji pokazujemy `displayPrice` ze sklepu, nie stałe z kodu.
// Identyfikatory są zgodne z NaparStoreKit.storekit (testy lokalne w Xcode).
// Plan `yearly` ma identyfikator `.annual` (jak w pliku .storekit i w poprzedniej wersji).
// Apps4Brew Studio — 100% Offline-First, Zero Telemetry.
// ============================================================================

import type { ProPlan } from './access-policy';

export const STORE_PRODUCT_IDS = {
  monthly: 'pl.lukasz.napar.monthly',
  yearly: 'pl.lukasz.napar.annual',
  lifetime: 'pl.lukasz.napar.lifetime',
} as const;

const PLAN_BY_PRODUCT_ID: Readonly<Record<string, ProPlan>> = {
  [STORE_PRODUCT_IDS.monthly]: 'monthly',
  [STORE_PRODUCT_IDS.yearly]: 'yearly',
  [STORE_PRODUCT_IDS.lifetime]: 'lifetime',
};

/** Wszystkie produkty, o które pytamy sklep (przy listowaniu i zakupie). */
export const ALL_STORE_PRODUCT_IDS: readonly string[] = [
  STORE_PRODUCT_IDS.monthly,
  STORE_PRODUCT_IDS.yearly,
  STORE_PRODUCT_IDS.lifetime,
];

/** Plany subskrypcyjne (jedna grupa); dożywotni jest zakupem jednorazowym (non-consumable). */
export function isSubscriptionPlan(plan: ProPlan): boolean {
  return plan !== 'lifetime';
}

/** Plan dla identyfikatora produktu; null dla obcych identyfikatorów. */
export function planForProductId(productId: string): ProPlan | null {
  return Object.prototype.hasOwnProperty.call(PLAN_BY_PRODUCT_ID, productId)
    ? PLAN_BY_PRODUCT_ID[productId]
    : null;
}
