// ============================================================================
// Napar (Steepwise) — Unit Tests: adapter StoreKit (expo-iap) z wstrzykniętym API
// Moduł natywny nie działa w Jest, więc biblioteka jest zastąpiona atrapą (jest.mock).
// ============================================================================

import { createExpoStoreAdapter, type ExpoIapApi } from '../store-expo';
import { STORE_PRODUCT_IDS } from '../../core/store-products';

jest.mock('expo-iap', () => ({
  initConnection: jest.fn(async () => true),
  fetchProducts: jest.fn(async () => []),
  requestPurchase: jest.fn(async () => null),
  getAvailablePurchases: jest.fn(async () => []),
  finishTransaction: jest.fn(async () => undefined),
  purchaseUpdatedListener: jest.fn(() => ({ remove: jest.fn() })),
}));

const SUB_PRODUCT = { id: STORE_PRODUCT_IDS.monthly, displayPrice: '$0.99', type: 'subs' };
const LIFE_PRODUCT = { id: STORE_PRODUCT_IDS.lifetime, displayPrice: '$14.99', type: 'in-app' };

function makeApi(overrides: Partial<Record<keyof ExpoIapApi, jest.Mock>> = {}) {
  const api = {
    initConnection: jest.fn(async () => true),
    fetchProducts: jest.fn(async (request: { skus: string[]; type: string }) => {
      if (request.type === 'subs') {
        return [SUB_PRODUCT];
      }
      return [LIFE_PRODUCT];
    }),
    requestPurchase: jest.fn(async () => null),
    getAvailablePurchases: jest.fn(async () => []),
    finishTransaction: jest.fn(async () => undefined),
    purchaseUpdatedListener: jest.fn(() => ({ remove: jest.fn() })),
    ...overrides,
  };
  return api;
}

function asApi(api: ReturnType<typeof makeApi>): ExpoIapApi {
  return api as unknown as ExpoIapApi;
}

describe('listProducts: tylko produkty znane aplikacji, ceny ze sklepu', () => {
  test('pyta o subskrypcje i dożywotni osobno i mapuje displayPrice', async () => {
    const api = makeApi();
    const adapter = createExpoStoreAdapter(asApi(api), 'ios');
    expect(await adapter.listProducts()).toEqual([
      { productId: STORE_PRODUCT_IDS.monthly, plan: 'monthly', displayPrice: '$0.99' },
      { productId: STORE_PRODUCT_IDS.lifetime, plan: 'lifetime', displayPrice: '$14.99' },
    ]);
    expect(api.fetchProducts).toHaveBeenCalledWith({
      skus: [STORE_PRODUCT_IDS.monthly, STORE_PRODUCT_IDS.yearly],
      type: 'subs',
    });
    expect(api.fetchProducts).toHaveBeenCalledWith({ skus: [STORE_PRODUCT_IDS.lifetime], type: 'in-app' });
  });

  test('brak produktów w App Store Connect (null lub pusta lista) daje pustą listę', async () => {
    const api = makeApi({ fetchProducts: jest.fn(async () => null) });
    expect(await createExpoStoreAdapter(asApi(api), 'ios').listProducts()).toEqual([]);
  });

  test('błąd biblioteki daje pustą listę, a połączenie próbuje się ponownie', async () => {
    const initConnection = jest
      .fn()
      .mockRejectedValueOnce(new Error('brak połączenia z kolejką'))
      .mockResolvedValue(true);
    const api = makeApi({ initConnection });
    const adapter = createExpoStoreAdapter(asApi(api), 'ios');
    expect(await adapter.listProducts()).toEqual([]);
    expect((await adapter.listProducts()).length).toBe(2);
    expect(initConnection).toHaveBeenCalledTimes(2);
  });

  test('poza iOS nie wywołuje żadnej usługi i zwraca pustą listę', async () => {
    const api = makeApi();
    expect(await createExpoStoreAdapter(asApi(api), 'android').listProducts()).toEqual([]);
    expect(api.initConnection).not.toHaveBeenCalled();
    expect(api.fetchProducts).not.toHaveBeenCalled();
  });
});

describe('połączenie z kolejką StoreKit', () => {
  test('nawiązane raz połączenie jest współdzielone przez kolejne operacje', async () => {
    const api = makeApi();
    const adapter = createExpoStoreAdapter(asApi(api), 'ios');
    await adapter.listProducts();
    await adapter.restore();
    expect(api.initConnection).toHaveBeenCalledTimes(1);
  });
});

describe('purchase: sukces tylko przy transakcji sklepu', () => {
  test('zakup subskrypcji idzie jako typ subs i kończy się sukcesem po transakcji', async () => {
    const transaction = { productId: STORE_PRODUCT_IDS.monthly, id: 'tx-1' };
    const api = makeApi({ requestPurchase: jest.fn(async () => transaction) });
    const result = await createExpoStoreAdapter(asApi(api), 'ios').purchase(STORE_PRODUCT_IDS.monthly);
    expect(result).toEqual({ status: 'success', productId: STORE_PRODUCT_IDS.monthly });
    expect(api.requestPurchase).toHaveBeenCalledWith({
      request: { apple: { sku: STORE_PRODUCT_IDS.monthly } },
      type: 'subs',
    });
    expect(api.finishTransaction).toHaveBeenCalledWith({ purchase: transaction, isConsumable: false });
  });

  test('zakup dożywotni idzie jako typ in-app', async () => {
    const transaction = { productId: STORE_PRODUCT_IDS.lifetime, id: 'tx-2' };
    const api = makeApi({ requestPurchase: jest.fn(async () => [transaction]) });
    const result = await createExpoStoreAdapter(asApi(api), 'ios').purchase(STORE_PRODUCT_IDS.lifetime);
    expect(result.status).toBe('success');
    expect(api.requestPurchase).toHaveBeenCalledWith({
      request: { apple: { sku: STORE_PRODUCT_IDS.lifetime } },
      type: 'in-app',
    });
  });

  test('brak wyniku bez błędu oznacza zakup oczekujący, nie sukces', async () => {
    const api = makeApi({ requestPurchase: jest.fn(async () => null) });
    expect((await createExpoStoreAdapter(asApi(api), 'ios').purchase(STORE_PRODUCT_IDS.monthly)).status).toBe(
      'pending'
    );
  });

  test('transakcja innego produktu nie jest sukcesem', async () => {
    const api = makeApi({
      requestPurchase: jest.fn(async () => ({ productId: STORE_PRODUCT_IDS.lifetime, id: 'x' })),
    });
    expect((await createExpoStoreAdapter(asApi(api), 'ios').purchase(STORE_PRODUCT_IDS.monthly)).status).toBe(
      'error'
    );
    expect(api.finishTransaction).not.toHaveBeenCalled();
  });

  test('błąd dokończenia transakcji nie cofa sukcesu zakupu', async () => {
    const transaction = { productId: STORE_PRODUCT_IDS.monthly, id: 'tx-3' };
    const api = makeApi({
      requestPurchase: jest.fn(async () => transaction),
      finishTransaction: jest.fn(async () => {
        throw new Error('już zakończona');
      }),
    });
    expect((await createExpoStoreAdapter(asApi(api), 'ios').purchase(STORE_PRODUCT_IDS.monthly)).status).toBe(
      'success'
    );
  });

  test('anulowanie przez użytkownika -> cancelled; błąd bez kodu -> error', async () => {
    const cancelled = makeApi({
      requestPurchase: jest.fn(async () => {
        throw { code: 'user-cancelled', message: 'anulowano' };
      }),
    });
    expect((await createExpoStoreAdapter(asApi(cancelled), 'ios').purchase(STORE_PRODUCT_IDS.monthly)).status).toBe(
      'cancelled'
    );
    const broken = makeApi({
      requestPurchase: jest.fn(async () => {
        throw new Error('nieznany');
      }),
    });
    expect((await createExpoStoreAdapter(asApi(broken), 'ios').purchase(STORE_PRODUCT_IDS.monthly)).status).toBe(
      'error'
    );
  });

  test('produkt nieobecny w sklepie (brak w App Store Connect) -> unavailable, bez zakupu', async () => {
    const api = makeApi({ fetchProducts: jest.fn(async () => []) });
    expect((await createExpoStoreAdapter(asApi(api), 'ios').purchase(STORE_PRODUCT_IDS.monthly)).status).toBe(
      'unavailable'
    );
    expect(api.requestPurchase).not.toHaveBeenCalled();
  });

  test('obcy identyfikator i inna platforma -> unavailable bez wywołań', async () => {
    const api = makeApi();
    const ios = createExpoStoreAdapter(asApi(api), 'ios');
    expect(await ios.purchase('com.obcy.produkt')).toEqual({ status: 'unavailable', productId: 'com.obcy.produkt' });
    const android = createExpoStoreAdapter(asApi(api), 'android');
    expect((await android.purchase(STORE_PRODUCT_IDS.monthly)).status).toBe('unavailable');
    expect(api.initConnection).not.toHaveBeenCalled();
  });
});

describe('restore: uprawnienia z getAvailablePurchases (bez hasActiveSubscriptions)', () => {
  test('pyta wyłącznie o aktywne pozycje i mapuje je na uprawnienia', async () => {
    const api = makeApi({
      getAvailablePurchases: jest.fn(async () => [{ productId: STORE_PRODUCT_IDS.yearly }]),
    });
    expect(await createExpoStoreAdapter(asApi(api), 'ios').restore()).toEqual([
      { productId: STORE_PRODUCT_IDS.yearly, plan: 'yearly' },
    ]);
    expect(api.getAvailablePurchases).toHaveBeenCalledWith({ onlyIncludeActiveItemsIOS: true });
  });

  test('poza iOS brak uprawnień bez wywołań', async () => {
    const api = makeApi();
    expect(await createExpoStoreAdapter(asApi(api), 'android').restore()).toEqual([]);
    expect(api.getAvailablePurchases).not.toHaveBeenCalled();
  });

  test('błąd odczytu jest przekazywany wyżej (aplikacja zostawia stan bez zmian)', async () => {
    const api = makeApi({
      getAvailablePurchases: jest.fn(async () => {
        throw new Error('brak odczytu');
      }),
    });
    await expect(createExpoStoreAdapter(asApi(api), 'ios').restore()).rejects.toThrow('brak odczytu');
  });
});

describe('observe: zmiany transakcji z sklepu', () => {
  test('dokańcza transakcję i informuje słuchacza; wyrejestrowanie usuwa nasłuch', async () => {
    let emit: (purchase: { productId: string }) => void = () => undefined;
    const remove = jest.fn();
    const api = makeApi({
      purchaseUpdatedListener: jest.fn((listener) => {
        emit = listener;
        return { remove };
      }),
    });
    const events: string[] = [];
    const stop = createExpoStoreAdapter(asApi(api), 'ios').observe((event) => events.push(event.productId));
    emit({ productId: STORE_PRODUCT_IDS.monthly });
    await new Promise((resolve) => setImmediate(resolve));
    expect(api.finishTransaction).toHaveBeenCalledWith({
      purchase: { productId: STORE_PRODUCT_IDS.monthly },
      isConsumable: false,
    });
    expect(events).toEqual([STORE_PRODUCT_IDS.monthly]);
    stop();
    expect(remove).toHaveBeenCalledTimes(1);
  });

  test('słuchacz dostaje zdarzenie nawet, gdy dokończenie transakcji się nie uda', async () => {
    let emit: (purchase: { productId: string }) => void = () => undefined;
    const api = makeApi({
      purchaseUpdatedListener: jest.fn((listener) => {
        emit = listener;
        return { remove: jest.fn() };
      }),
      finishTransaction: jest.fn(async () => {
        throw new Error('błąd');
      }),
    });
    const events: string[] = [];
    createExpoStoreAdapter(asApi(api), 'ios').observe((event) => events.push(event.productId));
    emit({ productId: STORE_PRODUCT_IDS.lifetime });
    await new Promise((resolve) => setImmediate(resolve));
    expect(events).toEqual([STORE_PRODUCT_IDS.lifetime]);
  });

  test('błąd połączenia przy nasłuchu jest pochłaniany (zostanie ponowiony przy odczycie)', async () => {
    const api = makeApi({
      initConnection: jest.fn(async () => {
        throw new Error('brak połączenia');
      }),
    });
    const stop = createExpoStoreAdapter(asApi(api), 'ios').observe(() => undefined);
    await new Promise((resolve) => setImmediate(resolve));
    expect(api.initConnection).toHaveBeenCalledTimes(1);
    stop();
  });

  test('poza iOS nie rejestruje nasłuchu, a zwrócona funkcja jest pusta', () => {
    const api = makeApi();
    const stop = createExpoStoreAdapter(asApi(api), 'android').observe(() => undefined);
    expect(api.purchaseUpdatedListener).not.toHaveBeenCalled();
    expect(stop()).toBeUndefined();
  });
});

describe('domyślne zależności (biblioteka expo-iap i platforma)', () => {
  test('bez argumentów adapter używa biblioteki i platformy urządzenia (iOS w Jest)', async () => {
    const adapter = createExpoStoreAdapter();
    expect(await adapter.restore()).toEqual([]);
    const iap = jest.requireMock('expo-iap') as { getAvailablePurchases: jest.Mock };
    expect(iap.getAvailablePurchases).toHaveBeenCalledWith({ onlyIncludeActiveItemsIOS: true });
  });
});
