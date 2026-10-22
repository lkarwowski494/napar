// ============================================================================
// Napar (Steepwise) — Mapowanie danych sklepu na domenę (czysta logika, bez expo/react)
// Adapter expo-iap przekazuje tu surowe obiekty; tu zapadają decyzje: który produkt
// jest Pro, które transakcje są odwołane i jak błąd StoreKit przekłada się na status.
// Apps4Brew Studio — 100% Offline-First, Zero Telemetry.
// ============================================================================

import type { Entitlement } from './access-policy';
import type { PurchaseStatus, StoreProduct } from './store-port';
import { planForProductId } from './store-products';

/** Kształt produktu z listy sklepu (wystarczający dla mapowania). */
export interface RawProduct {
  id: string;
  displayPrice: string;
}

/** Kształt transakcji z StoreKit (wystarczający dla mapowania). */
export interface RawTransaction {
  productId: string;
  revocationDateIOS?: number | null;
}

/** Kody błędów StoreKit (zgodne z ErrorCode biblioteki expo-iap, wartości tekstowe). */
export const STORE_ERROR_CODES = {
  userCancelled: 'user-cancelled',
  pending: 'pending',
  deferredPayment: 'deferred-payment',
  iapNotAvailable: 'iap-not-available',
  itemUnavailable: 'item-unavailable',
  skuNotFound: 'sku-not-found',
  queryProduct: 'query-product',
} as const;

const PENDING_CODES: readonly string[] = [STORE_ERROR_CODES.pending, STORE_ERROR_CODES.deferredPayment];
const UNAVAILABLE_CODES: readonly string[] = [
  STORE_ERROR_CODES.iapNotAvailable,
  STORE_ERROR_CODES.itemUnavailable,
  STORE_ERROR_CODES.skuNotFound,
  STORE_ERROR_CODES.queryProduct,
];

/** Kod błędu z wyjątku; null, gdy wyjątek nie niesie kodu tekstowego. */
export function errorCodeOf(error: unknown): string | null {
  if (typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string') {
    return error.code;
  }
  return null;
}

/** Status porażki zakupu. Nieznany kod to `error`: nigdy nie daje sukcesu. */
export function mapPurchaseErrorStatus(code: string | null): Exclude<PurchaseStatus, 'success'> {
  if (code === STORE_ERROR_CODES.userCancelled) {
    return 'cancelled';
  }
  if (code !== null && PENDING_CODES.includes(code)) {
    return 'pending';
  }
  if (code !== null && UNAVAILABLE_CODES.includes(code)) {
    return 'unavailable';
  }
  return 'error';
}

/**
 * Transakcja zakupu dla żądanego produktu. Brak transakcji (null, pusta lista,
 * inny produkt) znaczy brak sukcesu: nie pokazujemy zakupu bez transakcji.
 */
export function findPurchasedTransaction<T extends RawTransaction>(
  requestedProductId: string,
  result: T | readonly T[] | null | undefined
): T | null {
  if (result === null || result === undefined) {
    return null;
  }
  const list: readonly T[] = isTransactionList(result) ? result : [result];
  return list.find((transaction) => transaction.productId === requestedProductId) ?? null;
}

function isTransactionList<T>(value: T | readonly T[]): value is readonly T[] {
  return Array.isArray(value);
}

/** Produkty znane aplikacji (nieznane identyfikatory są pomijane). */
export function mapStoreProducts(raw: readonly RawProduct[]): StoreProduct[] {
  const products: StoreProduct[] = [];
  for (const item of raw) {
    const plan = planForProductId(item.id);
    if (plan !== null) {
      products.push({ productId: item.id, plan, displayPrice: item.displayPrice });
    }
  }
  return products;
}

/**
 * Aktywne uprawnienia z listy zakupów. Pomijamy nieznane produkty, odwołane
 * transakcje (revocationDateIOS) i duplikaty tego samego produktu.
 */
export function mapEntitlements(purchases: readonly RawTransaction[]): Entitlement[] {
  const seen = new Set<string>();
  const entitlements: Entitlement[] = [];
  for (const purchase of purchases) {
    if (purchase.revocationDateIOS !== null && purchase.revocationDateIOS !== undefined) {
      continue;
    }
    const plan = planForProductId(purchase.productId);
    if (plan === null || seen.has(purchase.productId)) {
      continue;
    }
    seen.add(purchase.productId);
    entitlements.push({ productId: purchase.productId, plan });
  }
  return entitlements;
}
