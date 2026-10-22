// ============================================================================
// Napar (Steepwise) — Adapter sklepu produkcyjny: StoreKit przez expo-iap (iOS)
// Zasady: wyłącznie StoreKit (bez usług zewnętrznych ani weryfikacji u dostawcy).
// Brak własnej weryfikacji JWS. Uprawnienia tylko z getAvailablePurchases
// (onlyIncludeActiveItemsIOS), nie z zapytań o aktywne subskrypcje.
// Na innych platformach nie wołamy żadnej usługi billingowej: zakup niedostępny.
// Apps4Brew Studio — 100% Offline-First, Zero Telemetry.
// ============================================================================

import { Platform } from 'react-native';
import * as IAP from 'expo-iap';
import type { Purchase } from 'expo-iap';
import {
  errorCodeOf,
  findPurchasedTransaction,
  mapEntitlements,
  mapPurchaseErrorStatus,
  mapStoreProducts,
} from '../core/store-mapping';
import type { PurchaseResult, StoreAdapter, StoreProduct, StoreTransactionListener } from '../core/store-port';
import { STORE_PRODUCT_IDS, isSubscriptionPlan, planForProductId } from '../core/store-products';

/** Fragment API expo-iap używany przez adapter (wstrzykiwany, by test nie wymagał natywnego modułu). */
export type ExpoIapApi = Pick<
  typeof IAP,
  | 'initConnection'
  | 'fetchProducts'
  | 'requestPurchase'
  | 'getAvailablePurchases'
  | 'finishTransaction'
  | 'purchaseUpdatedListener'
>;

const SUBSCRIPTION_SKUS: string[] = [STORE_PRODUCT_IDS.monthly, STORE_PRODUCT_IDS.yearly];
const LIFETIME_SKUS: string[] = [STORE_PRODUCT_IDS.lifetime];

export function createExpoStoreAdapter(api: ExpoIapApi = IAP, os: string = Platform.OS): StoreAdapter {
  const isIos = os === 'ios';
  let connection: Promise<unknown> | null = null;

  // Połączenie z kolejką StoreKit: jedna próba na raz; po błędzie kolejna próba przy następnym wywołaniu.
  const connect = (): Promise<unknown> => {
    if (connection === null) {
      connection = api.initConnection().catch((error: unknown) => {
        connection = null;
        throw error;
      });
    }
    return connection;
  };

  const fetchKnownProducts = async (): Promise<StoreProduct[]> => {
    await connect();
    const subscriptions = await api.fetchProducts({ skus: SUBSCRIPTION_SKUS, type: 'subs' });
    const lifetime = await api.fetchProducts({ skus: LIFETIME_SKUS, type: 'in-app' });
    return mapStoreProducts([...(subscriptions ?? []), ...(lifetime ?? [])]);
  };

  // Brak finishTransaction nie cofa uprawnienia (liczy się getAvailablePurchases), więc błąd tylko się loguje.
  const finish = async (purchase: Purchase): Promise<void> => {
    try {
      await api.finishTransaction({ purchase, isConsumable: false });
    } catch {
      // StoreKit ponowi dostarczenie transakcji przy następnym uruchomieniu.
    }
  };

  return {
    async listProducts(): Promise<StoreProduct[]> {
      if (!isIos) {
        return [];
      }
      try {
        return await fetchKnownProducts();
      } catch {
        return [];
      }
    },

    async purchase(productId: string): Promise<PurchaseResult> {
      const plan = planForProductId(productId);
      if (!isIos || plan === null) {
        return { status: 'unavailable', productId };
      }
      try {
        const products = await fetchKnownProducts();
        if (!products.some((product) => product.productId === productId)) {
          return { status: 'unavailable', productId };
        }
        const request = { apple: { sku: productId } };
        const result = isSubscriptionPlan(plan)
          ? await api.requestPurchase({ request, type: 'subs' })
          : await api.requestPurchase({ request, type: 'in-app' });
        if (result === null || result === undefined) {
          // Brak transakcji bez błędu: zakup czeka na zatwierdzenie (np. Udostępnianie w rodzinie / rodzic).
          return { status: 'pending', productId };
        }
        const transaction = findPurchasedTransaction(productId, result);
        if (transaction === null) {
          return { status: 'error', productId };
        }
        await finish(transaction);
        return { status: 'success', productId };
      } catch (error) {
        return { status: mapPurchaseErrorStatus(errorCodeOf(error)), productId };
      }
    },

    async restore() {
      if (!isIos) {
        return [];
      }
      await connect();
      const purchases = await api.getAvailablePurchases({ onlyIncludeActiveItemsIOS: true });
      return mapEntitlements(purchases);
    },

    observe(listener: StoreTransactionListener): () => void {
      if (!isIos) {
        return () => undefined;
      }
      const subscription = api.purchaseUpdatedListener((purchase) => {
        void finish(purchase).then(() => listener({ productId: purchase.productId }));
      });
      connect().catch(() => undefined);
      return () => subscription.remove();
    },
  };
}
