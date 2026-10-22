// ============================================================================
// Napar (Steepwise) — Fałszywy sklep: WYŁĄCZNIE testy Jest i E2E (EXPO_PUBLIC_STORE_FAKE=1)
// Domyślnie nie zna żadnego produktu, tak jak sklep przed utworzeniem produktów w App Store Connect:
// zakup kończy się „unavailable”. Sukces zakupu trzeba zaplanować jawnie (setNextOutcome).
// Nie jest wybierany w buildzie produkcyjnym (patrz src/platform/store.ts).
// Apps4Brew Studio — 100% Offline-First, Zero Telemetry.
// ============================================================================

import type { Entitlement } from '../core/access-policy';
import type { PurchaseStatus, PurchaseResult, StoreAdapter, StoreProduct, StoreTransactionListener } from '../core/store-port';

export interface FakeStoreOptions {
  products?: StoreProduct[];
  entitlements?: Entitlement[];
}

export interface FakeStore extends StoreAdapter {
  setProducts(products: StoreProduct[]): void;
  setEntitlements(entitlements: Entitlement[]): void;
  /** Wynik kolejnego zakupu produktu znanego (domyślnie success). */
  setNextOutcome(status: PurchaseStatus): void;
}

export function createFakeStoreAdapter(options: FakeStoreOptions = {}): FakeStore {
  let products: StoreProduct[] = [...(options.products ?? [])];
  let entitlements: Entitlement[] = [...(options.entitlements ?? [])];
  let nextOutcome: PurchaseStatus = 'success';
  const listeners = new Set<StoreTransactionListener>();

  const notify = (productId: string): void => {
    listeners.forEach((listener) => listener({ productId }));
  };

  return {
    async listProducts() {
      return [...products];
    },

    async purchase(productId: string): Promise<PurchaseResult> {
      const product = products.find((item) => item.productId === productId);
      if (product === undefined) {
        return { status: 'unavailable', productId };
      }
      const status = nextOutcome;
      nextOutcome = 'success';
      if (status === 'success') {
        entitlements = [...entitlements.filter((item) => item.productId !== productId), { productId, plan: product.plan }];
        notify(productId);
      }
      return { status, productId };
    },

    async restore() {
      return [...entitlements];
    },

    observe(listener: StoreTransactionListener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    setProducts(next: StoreProduct[]) {
      products = [...next];
    },

    setEntitlements(next: Entitlement[]) {
      entitlements = [...next];
    },

    setNextOutcome(status: PurchaseStatus) {
      nextOutcome = status;
    },
  };
}
