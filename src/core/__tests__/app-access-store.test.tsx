// ============================================================================
// Napar (Steepwise) — Unit Tests: most sklepu i dostępu (app-access, etap 4b)
// Stan Pro wynika z uprawnień sklepu (getAvailablePurchases), nie z własnego paragonu.
// ============================================================================

import React from 'react';
import renderer, { act } from 'react-test-renderer';
import {
  ensureStoreSync,
  listStoreProducts,
  purchaseProduct,
  restoreProPurchases,
  syncProEntitlement,
  useAppAccess,
  useStoreProducts,
  type RestoreOutcome,
  type SyncOutcome,
} from '../app-access';
import { configureStoreAdapter, type StoreAdapter, type StoreProduct, type StoreTransactionListener } from '../store-port';
import { STORE_PRODUCT_IDS } from '../store-products';
import type { Entitlement } from '../access-policy';

const mockSettings = new Map<string, string>();

const mockDb: any = {
  settings: mockSettings,
  execSync: jest.fn(),
  getFirstSync: jest.fn((query: string, params?: any[]) => {
    if (query.includes('FROM app_settings WHERE key = ?')) {
      const val = mockSettings.get(params?.[0]);
      return val !== undefined ? { value: val } : null;
    }
    return null;
  }),
  runSync: jest.fn((query: string, params?: any[]) => {
    if (query.includes('INSERT OR REPLACE INTO app_settings')) {
      mockSettings.set(params![0], params![1]);
    }
  }),
};

jest.mock('expo-sqlite', () => ({
  openDatabaseSync: jest.fn(() => mockDb),
  defaultDatabaseDirectory: '/test/SQLite',
}));

interface StubOptions {
  restore?: () => Promise<Entitlement[]>;
  purchase?: StoreAdapter['purchase'];
  listProducts?: StoreAdapter['listProducts'];
}

function makeStub(options: StubOptions = {}) {
  const listeners = new Set<StoreTransactionListener>();
  const stop = jest.fn();
  const adapter: StoreAdapter = {
    listProducts: options.listProducts ?? (async () => []),
    purchase: options.purchase ?? (async (productId) => ({ status: 'success', productId })),
    restore: options.restore ?? (async () => []),
    observe: jest.fn((listener: StoreTransactionListener) => {
      listeners.add(listener);
      return () => {
        stop();
        listeners.delete(listener);
      };
    }),
  };
  return { adapter, listeners, stop };
}

const PRO: Entitlement[] = [{ productId: STORE_PRODUCT_IDS.yearly, plan: 'yearly' }];

describe('syncProEntitlement: stan Pro z uprawnień sklepu', () => {
  beforeEach(() => {
    mockSettings.clear();
  });

  afterEach(() => {
    configureStoreAdapter(null);
  });

  test('bez sklepu: unavailable, stan Pro bez zmian', async () => {
    const outcome: SyncOutcome = await syncProEntitlement();
    expect(outcome).toBe('unavailable');
    expect(mockSettings.has('is_pro_active')).toBe(false);
  });

  test('aktywne uprawnienie zapisuje Pro i powiadamia widoki', async () => {
    const { adapter } = makeStub({ restore: async () => PRO });
    configureStoreAdapter(adapter);
    expect(await syncProEntitlement()).toBe('pro');
    expect(mockSettings.get('is_pro_active')).toBe('true');
  });

  test('brak uprawnień zdejmuje Pro (np. po wygaśnięciu subskrypcji)', async () => {
    mockSettings.set('is_pro_active', 'true');
    const { adapter } = makeStub({ restore: async () => [] });
    configureStoreAdapter(adapter);
    expect(await syncProEntitlement()).toBe('free');
    expect(mockSettings.get('is_pro_active')).toBe('false');
  });

  test('błąd odczytu nie zmienia stanu Pro', async () => {
    mockSettings.set('is_pro_active', 'true');
    const { adapter } = makeStub({
      restore: async () => {
        throw new Error('StoreKit niedostępny');
      },
    });
    configureStoreAdapter(adapter);
    expect(await syncProEntitlement()).toBe('error');
    expect(mockSettings.get('is_pro_active')).toBe('true');
  });
});

describe('ensureStoreSync: nasłuch transakcji i pierwsze uzgodnienie', () => {
  beforeEach(() => {
    mockSettings.clear();
  });

  afterEach(() => {
    configureStoreAdapter(null);
  });

  test('bez sklepu nie nasłuchuje i nie czyta uprawnień', () => {
    const { adapter } = makeStub();
    ensureStoreSync();
    expect(adapter.observe).not.toHaveBeenCalled();
  });

  test('przy sklepie: nasłuch, uzgodnienie, a powtórne wywołanie nic nie zmienia', async () => {
    const restore = jest.fn(async () => PRO);
    const { adapter } = makeStub({ restore });
    configureStoreAdapter(adapter);
    ensureStoreSync();
    ensureStoreSync();
    expect(adapter.observe).toHaveBeenCalledTimes(1);
    await act(async () => {
      await Promise.resolve();
    });
    expect(restore).toHaveBeenCalledTimes(1);
    expect(mockSettings.get('is_pro_active')).toBe('true');
  });

  test('zmiana transakcji w sklepie uzgadnia stan Pro ponownie', async () => {
    const restore = jest.fn(async () => PRO);
    const { adapter, listeners } = makeStub({ restore });
    configureStoreAdapter(adapter);
    ensureStoreSync();
    await act(async () => {
      for (const listener of listeners) {
        listener({ productId: STORE_PRODUCT_IDS.yearly });
      }
      await Promise.resolve();
    });
    expect(restore).toHaveBeenCalledTimes(2);
  });

  test('nowy adapter zastępuje poprzedni: stary nasłuch zostaje wyrejestrowany', () => {
    const first = makeStub();
    configureStoreAdapter(first.adapter);
    ensureStoreSync();
    const second = makeStub();
    configureStoreAdapter(second.adapter);
    ensureStoreSync();
    expect(first.stop).toHaveBeenCalledTimes(1);
    expect(second.adapter.observe).toHaveBeenCalledTimes(1);
  });
});

describe('purchaseProduct: zakup i uzgodnienie uprawnień', () => {
  beforeEach(() => {
    mockSettings.clear();
  });

  afterEach(() => {
    configureStoreAdapter(null);
  });

  test('bez sklepu: unavailable i brak Pro', async () => {
    expect(await purchaseProduct(STORE_PRODUCT_IDS.monthly)).toBe('unavailable');
    expect(mockSettings.has('is_pro_active')).toBe(false);
  });

  test('wyjątek sklepu przy zakupie: error bez Pro', async () => {
    const { adapter } = makeStub({
      purchase: async () => {
        throw new Error('zerwane połączenie');
      },
    });
    configureStoreAdapter(adapter);
    expect(await purchaseProduct(STORE_PRODUCT_IDS.monthly)).toBe('error');
    expect(mockSettings.has('is_pro_active')).toBe(false);
  });

  test('anulowanie, oczekiwanie i błąd nie aktywują Pro i nie czytają uprawnień', async () => {
    const restore = jest.fn(async () => PRO);
    for (const status of ['cancelled', 'pending', 'error'] as const) {
      const { adapter } = makeStub({
        restore,
        purchase: async (productId) => ({ status, productId }),
      });
      configureStoreAdapter(adapter);
      expect(await purchaseProduct(STORE_PRODUCT_IDS.lifetime)).toBe(status);
    }
    expect(restore).not.toHaveBeenCalled();
    expect(mockSettings.has('is_pro_active')).toBe(false);
  });

  test('sukces: uprawnienia z getAvailablePurchases ustawiają Pro', async () => {
    const restore = jest.fn(async () => PRO);
    const { adapter } = makeStub({ restore });
    configureStoreAdapter(adapter);
    expect(await purchaseProduct(STORE_PRODUCT_IDS.yearly)).toBe('success');
    expect(restore).toHaveBeenCalledTimes(1);
    expect(mockSettings.get('is_pro_active')).toBe('true');
  });

  test('sukces, ale odczyt uprawnień się nie udaje: Pro wynika z transakcji', async () => {
    const { adapter } = makeStub({
      restore: async () => {
        throw new Error('brak odczytu');
      },
    });
    configureStoreAdapter(adapter);
    expect(await purchaseProduct(STORE_PRODUCT_IDS.monthly)).toBe('success');
    expect(mockSettings.get('is_pro_active')).toBe('true');
  });
});

describe('restoreProPurchases i listStoreProducts', () => {
  beforeEach(() => {
    mockSettings.clear();
  });

  afterEach(() => {
    configureStoreAdapter(null);
  });

  test('przywracanie mapuje wynik uzgodnienia na komunikat', async () => {
    const first: RestoreOutcome = await restoreProPurchases();
    expect(first).toBe('unavailable');

    configureStoreAdapter(makeStub({ restore: async () => PRO }).adapter);
    expect(await restoreProPurchases()).toBe('restored');
    expect(mockSettings.get('is_pro_active')).toBe('true');

    configureStoreAdapter(makeStub({ restore: async () => [] }).adapter);
    expect(await restoreProPurchases()).toBe('none');

    configureStoreAdapter(
      makeStub({
        restore: async () => {
          throw new Error('brak odczytu');
        },
      }).adapter
    );
    expect(await restoreProPurchases()).toBe('error');
  });

  test('lista produktów: bez sklepu pusta, z błędem sklepu pusta, z produktami zwraca je', async () => {
    expect(await listStoreProducts()).toEqual([]);

    configureStoreAdapter(
      makeStub({
        listProducts: async () => {
          throw new Error('brak odpowiedzi');
        },
      }).adapter
    );
    expect(await listStoreProducts()).toEqual([]);

    const products = [{ productId: STORE_PRODUCT_IDS.monthly, plan: 'monthly' as const, displayPrice: '$0.99' }];
    configureStoreAdapter(makeStub({ listProducts: async () => products }).adapter);
    expect(await listStoreProducts()).toEqual(products);
  });
});

describe('hook useStoreProducts (ceny ze sklepu)', () => {
  afterEach(() => {
    configureStoreAdapter(null);
  });

  function Probe({ onRender }: { onRender: (products: unknown[]) => void }) {
    const products = useStoreProducts();
    onRender(products);
    return null;
  }

  test('po odpowiedzi sklepu udostępnia produkty do widoku', async () => {
    const products = [{ productId: STORE_PRODUCT_IDS.lifetime, plan: 'lifetime' as const, displayPrice: '$14.99' }];
    configureStoreAdapter(makeStub({ listProducts: async () => products }).adapter);
    const seen: unknown[][] = [];
    await act(async () => {
      renderer.create(<Probe onRender={(list) => seen.push(list)} />);
    });
    expect(seen[seen.length - 1]).toEqual(products);
  });

  test('pusta lista (stan startowy) nie zmienia widoku', async () => {
    configureStoreAdapter(makeStub().adapter);
    const seen: unknown[][] = [];
    await act(async () => {
      renderer.create(<Probe onRender={(list) => seen.push(list)} />);
    });
    expect(seen.every((list) => list.length === 0)).toBe(true);
  });

  test('odmontowany widok nie dostaje późnej odpowiedzi sklepu', async () => {
    let resolveList: (value: StoreProduct[]) => void = () => undefined;
    configureStoreAdapter(
      makeStub({
        listProducts: () =>
          new Promise((resolve) => {
            resolveList = resolve;
          }),
      }).adapter
    );
    const seen: unknown[][] = [];
    let tree: renderer.ReactTestRenderer | undefined;
    await act(async () => {
      tree = renderer.create(<Probe onRender={(list) => seen.push(list)} />);
    });
    act(() => tree!.unmount());
    await act(async () => {
      resolveList([{ productId: STORE_PRODUCT_IDS.monthly, plan: 'monthly' as const, displayPrice: '$0.99' }]);
      await Promise.resolve();
    });
    expect(seen.every((list) => list.length === 0)).toBe(true);
  });
});

describe('useAppAccess uruchamia nasłuch sklepu', () => {
  beforeEach(() => {
    mockSettings.clear();
  });

  afterEach(() => {
    configureStoreAdapter(null);
  });

  test('montowanie widoku rejestruje nasłuch i odświeża stan Pro', async () => {
    const { adapter } = makeStub({ restore: async () => PRO });
    configureStoreAdapter(adapter);
    let latest: { isPro: boolean } | undefined;
    function Probe() {
      latest = useAppAccess();
      return null;
    }
    await act(async () => {
      renderer.create(<Probe />);
    });
    expect(adapter.observe).toHaveBeenCalled();
    expect(latest?.isPro).toBe(true);
  });
});
