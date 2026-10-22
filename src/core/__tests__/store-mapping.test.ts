// ============================================================================
// Napar (Steepwise) — Unit Tests: mapowanie sklepu (produkty, uprawnienia, błędy zakupu)
// ============================================================================

import {
  STORE_ERROR_CODES,
  errorCodeOf,
  findPurchasedTransaction,
  mapEntitlements,
  mapPurchaseErrorStatus,
  mapStoreProducts,
} from '../store-mapping';
import { STORE_PRODUCT_IDS } from '../store-products';
import type { PurchaseStatus } from '../store-port';

describe('errorCodeOf: kod błędu z wyjątku', () => {
  test('zwraca tekstowy kod z obiektu błędu', () => {
    expect(errorCodeOf({ code: 'user-cancelled', message: 'x' })).toBe('user-cancelled');
  });

  test('null dla wartości, która nie jest obiektem', () => {
    expect(errorCodeOf('user-cancelled')).toBeNull();
    expect(errorCodeOf(undefined)).toBeNull();
  });

  test('null dla null, obiektu bez pola code i obiektu z nietekstowym code', () => {
    expect(errorCodeOf(null)).toBeNull();
    expect(errorCodeOf(new Error('brak kodu'))).toBeNull();
    expect(errorCodeOf({ code: 42 })).toBeNull();
  });
});

describe('mapPurchaseErrorStatus: błąd StoreKit -> status zakupu', () => {
  test('anulowanie przez użytkownika nie jest błędem', () => {
    expect(mapPurchaseErrorStatus(STORE_ERROR_CODES.userCancelled)).toBe('cancelled');
  });

  test('statusy wynikające z kodów są jednym z pięciu statusów zakupu', () => {
    const codes = ['user-cancelled', 'pending', 'item-unavailable', 'nieznany'];
    const statuses: PurchaseStatus[] = codes.map(mapPurchaseErrorStatus);
    expect(statuses).toEqual(['cancelled', 'pending', 'unavailable', 'error']);
  });

  test('zakup oczekujący (pending i deferred-payment)', () => {
    expect(mapPurchaseErrorStatus('pending')).toBe('pending');
    expect(mapPurchaseErrorStatus('deferred-payment')).toBe('pending');
  });

  test('brak produktu lub sklepu po stronie Apple -> unavailable', () => {
    expect(mapPurchaseErrorStatus('iap-not-available')).toBe('unavailable');
    expect(mapPurchaseErrorStatus('item-unavailable')).toBe('unavailable');
    expect(mapPurchaseErrorStatus('sku-not-found')).toBe('unavailable');
    expect(mapPurchaseErrorStatus('query-product')).toBe('unavailable');
  });

  test('nieznany kod i brak kodu -> error (nigdy sukces)', () => {
    expect(mapPurchaseErrorStatus('cokolwiek')).toBe('error');
    expect(mapPurchaseErrorStatus(null)).toBe('error');
  });
});

describe('findPurchasedTransaction: transakcja zakupu tylko przy dopasowaniu produktu', () => {
  const monthly = { productId: STORE_PRODUCT_IDS.monthly };
  const lifetime = { productId: STORE_PRODUCT_IDS.lifetime };

  test('brak wyniku (null lub undefined) -> null', () => {
    expect(findPurchasedTransaction(STORE_PRODUCT_IDS.monthly, null)).toBeNull();
    expect(findPurchasedTransaction(STORE_PRODUCT_IDS.monthly, undefined)).toBeNull();
  });

  test('pojedyncza transakcja tego samego produktu', () => {
    expect(findPurchasedTransaction(STORE_PRODUCT_IDS.monthly, monthly)).toBe(monthly);
  });

  test('pojedyncza transakcja innego produktu -> null', () => {
    expect(findPurchasedTransaction(STORE_PRODUCT_IDS.yearly, monthly)).toBeNull();
  });

  test('lista transakcji: wybiera żądany produkt', () => {
    expect(findPurchasedTransaction(STORE_PRODUCT_IDS.lifetime, [monthly, lifetime])).toBe(lifetime);
    expect(findPurchasedTransaction(STORE_PRODUCT_IDS.yearly, [monthly, lifetime])).toBeNull();
  });
});

describe('mapStoreProducts: tylko produkty znane aplikacji, cena ze sklepu', () => {
  test('mapuje plan i displayPrice, pomija obce identyfikatory', () => {
    expect(
      mapStoreProducts([
        { id: STORE_PRODUCT_IDS.monthly, displayPrice: '$0.99' },
        { id: 'com.obcy.produkt', displayPrice: '$9.99' },
        { id: STORE_PRODUCT_IDS.lifetime, displayPrice: '$14.99' },
      ])
    ).toEqual([
      { productId: STORE_PRODUCT_IDS.monthly, plan: 'monthly', displayPrice: '$0.99' },
      { productId: STORE_PRODUCT_IDS.lifetime, plan: 'lifetime', displayPrice: '$14.99' },
    ]);
  });

  test('pusta lista dla sklepu bez produktów (stan przed App Store Connect)', () => {
    expect(mapStoreProducts([])).toEqual([]);
  });
});

describe('mapEntitlements: aktywne uprawnienia z getAvailablePurchases', () => {
  test('mapuje znane produkty na plany', () => {
    expect(
      mapEntitlements([{ productId: STORE_PRODUCT_IDS.yearly }, { productId: STORE_PRODUCT_IDS.lifetime }])
    ).toEqual([
      { productId: STORE_PRODUCT_IDS.yearly, plan: 'yearly' },
      { productId: STORE_PRODUCT_IDS.lifetime, plan: 'lifetime' },
    ]);
  });

  test('pomija odwołane transakcje (revocationDateIOS ustawione), zachowuje nieodwołane', () => {
    expect(
      mapEntitlements([
        { productId: STORE_PRODUCT_IDS.monthly, revocationDateIOS: 1_700_000_000_000 },
        { productId: STORE_PRODUCT_IDS.yearly, revocationDateIOS: null },
        { productId: STORE_PRODUCT_IDS.lifetime },
      ])
    ).toEqual([
      { productId: STORE_PRODUCT_IDS.yearly, plan: 'yearly' },
      { productId: STORE_PRODUCT_IDS.lifetime, plan: 'lifetime' },
    ]);
  });

  test('pomija obce produkty i duplikaty tego samego produktu', () => {
    expect(
      mapEntitlements([
        { productId: 'com.obcy.produkt' },
        { productId: STORE_PRODUCT_IDS.monthly },
        { productId: STORE_PRODUCT_IDS.monthly },
      ])
    ).toEqual([{ productId: STORE_PRODUCT_IDS.monthly, plan: 'monthly' }]);
  });

  test('brak zakupów -> brak uprawnień', () => {
    expect(mapEntitlements([])).toEqual([]);
  });
});
