// ============================================================================
// Napar (Steepwise) — Unit Tests: fałszywy sklep (wyłącznie testy i E2E)
// ============================================================================

import { createFakeStoreAdapter } from '../store-fake';
import { STORE_PRODUCT_IDS } from '../../core/store-products';

const MONTHLY = { productId: STORE_PRODUCT_IDS.monthly, plan: 'monthly' as const, displayPrice: '$0.99' };

describe('fałszywy sklep: stan startowy jak sklep bez produktów', () => {
  test('nie zna produktów, zakup kończy się unavailable, brak uprawnień', async () => {
    const store = createFakeStoreAdapter();
    expect(await store.listProducts()).toEqual([]);
    expect(await store.purchase(STORE_PRODUCT_IDS.monthly)).toEqual({
      status: 'unavailable',
      productId: STORE_PRODUCT_IDS.monthly,
    });
    expect(await store.restore()).toEqual([]);
  });
});

describe('fałszywy sklep: scenariusze testowe', () => {
  test('zakup znanego produktu daje uprawnienie i powiadamia nasłuch', async () => {
    const store = createFakeStoreAdapter({ products: [MONTHLY] });
    const events: string[] = [];
    store.observe((event) => events.push(event.productId));
    expect((await store.purchase(STORE_PRODUCT_IDS.monthly)).status).toBe('success');
    expect(await store.restore()).toEqual([{ productId: STORE_PRODUCT_IDS.monthly, plan: 'monthly' }]);
    expect(events).toEqual([STORE_PRODUCT_IDS.monthly]);
  });

  test('ponowny zakup tego samego produktu nie dubluje uprawnienia', async () => {
    const store = createFakeStoreAdapter({ products: [MONTHLY] });
    await store.purchase(STORE_PRODUCT_IDS.monthly);
    await store.purchase(STORE_PRODUCT_IDS.monthly);
    expect(await store.restore()).toHaveLength(1);
  });

  test('zaplanowany wynik (anulowanie, oczekiwanie) jest jednorazowy i nie daje uprawnienia', async () => {
    const store = createFakeStoreAdapter({ products: [MONTHLY] });
    store.setNextOutcome('cancelled');
    expect((await store.purchase(STORE_PRODUCT_IDS.monthly)).status).toBe('cancelled');
    expect(await store.restore()).toEqual([]);
    expect((await store.purchase(STORE_PRODUCT_IDS.monthly)).status).toBe('success');
  });

  test('przypisanie produktów i uprawnień zastępuje poprzednie; odczyt zwraca kopię', async () => {
    const store = createFakeStoreAdapter({ entitlements: [{ productId: 'x', plan: 'lifetime' }] });
    store.setProducts([MONTHLY]);
    store.setEntitlements([{ productId: STORE_PRODUCT_IDS.lifetime, plan: 'lifetime' }]);
    const list = await store.listProducts();
    list.pop();
    expect(await store.listProducts()).toEqual([MONTHLY]);
    expect(await store.restore()).toEqual([{ productId: STORE_PRODUCT_IDS.lifetime, plan: 'lifetime' }]);
  });

  test('odłączony nasłuch nie dostaje zdarzeń', async () => {
    const store = createFakeStoreAdapter({ products: [MONTHLY] });
    const events: string[] = [];
    const stop = store.observe((event) => events.push(event.productId));
    stop();
    await store.purchase(STORE_PRODUCT_IDS.monthly);
    expect(events).toEqual([]);
  });
});
