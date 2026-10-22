// ============================================================================
// Napar (Steepwise) — Apps4BrewPassModal Component Tests
// Etap 4b: bez sklepu (brak produktów) plany i przywracanie pokazują „zakup niedostępny”.
// Z adapterem sklepu: sukces tylko przy transakcji, ceny z App Store, komunikaty statusów.
// Karta statusu pokazuje dni darmowego poziomu (model M5 S1).
// ============================================================================

import React from 'react';
import { Alert } from 'react-native';
import renderer, { act } from 'react-test-renderer';
import { Apps4BrewPassModal } from '../Apps4BrewPassModal';
import { FREE_BREW_DAYS_SETTING_KEY } from '../../core/repositories/brew-access';
import { exhaustedFreeBrewDaysValue, freeBrewDaysValue } from '../../../tests/helpers/free-brew-days';
import { configureStoreAdapter, type StoreAdapter, type StoreProduct } from '../../core/store-port';
import { STORE_PRODUCT_IDS } from '../../core/store-products';
import type { Entitlement } from '../../core/access-policy';

const mockDb: any = {
  app_settings: new Map(),
  execSync: jest.fn(),
  getFirstSync: jest.fn((q, p) => {
    if (q.includes('FROM app_settings WHERE key = ?')) {
      const val = mockDb.app_settings.get(p?.[0]);
      return val !== undefined ? { value: val } : null;
    }
    return null;
  }),
  getAllSync: jest.fn(() => []),
  runSync: jest.fn((q, p) => {
    if (q.includes('INSERT OR REPLACE INTO app_settings')) {
      mockDb.app_settings.set(p?.[0], p?.[1]);
    }
  }),
};

jest.mock('expo-sqlite', () => ({
  openDatabaseSync: jest.fn(() => mockDb),
}));

const UNAVAILABLE_TITLE = 'Zakup niedostępny';
const UNAVAILABLE_MSG = 'Zakupy w aplikacji nie są jeszcze dostępne w tej wersji. Darmowy poziom działa bez zmian.';

function renderModal(props: Partial<React.ComponentProps<typeof Apps4BrewPassModal>> = {}) {
  let tree: any;
  act(() => {
    tree = renderer.create(
      <Apps4BrewPassModal visible={true} onClose={jest.fn()} {...props} />
    );
  });
  return tree;
}

const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

/** Renderuje modal i czeka na odpowiedź sklepu (ceny i uprawnienia są asynchroniczne). */
async function renderModalAsync(props: Partial<React.ComponentProps<typeof Apps4BrewPassModal>> = {}) {
  let tree: any;
  await act(async () => {
    tree = renderer.create(<Apps4BrewPassModal visible={true} onClose={jest.fn()} {...props} />);
    await flushPromises();
  });
  return tree;
}

/** Naciska przycisk i czeka, aż asynchroniczna obsługa (zakup, przywracanie) się zakończy. */
async function press(tree: any, testID: string) {
  await act(async () => {
    tree.root.findByProps({ testID }).props.onPress();
    await flushPromises();
  });
}

interface StoreStub {
  listProducts?: () => Promise<StoreProduct[]>;
  purchase?: StoreAdapter['purchase'];
  restore?: () => Promise<Entitlement[]>;
}

function useStore(stub: StoreStub = {}): StoreAdapter {
  const adapter: StoreAdapter = {
    listProducts: stub.listProducts ?? (async () => []),
    purchase: stub.purchase ?? (async (productId) => ({ status: 'unavailable', productId })),
    restore: stub.restore ?? (async () => []),
    observe: () => () => undefined,
  };
  configureStoreAdapter(adapter);
  return adapter;
}

describe('Apps4BrewPassModal Component', () => {
  beforeEach(() => {
    mockDb.app_settings.clear();
    jest.restoreAllMocks();
  });

  test('Renderuje plany cenowe ($0.99, $4.99, $14.99) i gwarancję historii', () => {
    const tree = renderModal();
    const str = JSON.stringify(tree.toJSON());
    expect(str).toContain('$0.99');
    expect(str).toContain('$4.99');
    expect(str).toContain('$14.99');
    expect(str).toContain('APPS4BREW PASS');
    expect(str).toContain('Historia parzeń, edycja, eksport i kopia są ZAWSZE bezpłatne.');
  });

  test('darmowy poziom: pokazuje ile dni zostało i co dokładnie się blokuje', () => {
    mockDb.app_settings.set(FREE_BREW_DAYS_SETTING_KEY, freeBrewDaysValue(2));
    const str = JSON.stringify(renderModal().toJSON());
    expect(str).toContain('Darmowy poziom: 2 z 7 dni parzenia w tym miesiącu. Zostało: 5.');
    expect(str).toContain('Po wyczerpaniu limitu blokujemy tylko rozpoczęcie parzenia timerem');
  });

  test('wyczerpany limit: komunikat o blokadzie zamiast zwykłego statusu', () => {
    mockDb.app_settings.set(FREE_BREW_DAYS_SETTING_KEY, exhaustedFreeBrewDaysValue());
    const str = JSON.stringify(renderModal().toJSON());
    expect(str).toContain('Limit darmowego poziomu wykorzystany (7 z 7 dni w tym miesiącu)');
    expect(str).not.toContain('Darmowy poziom:');
  });

  test('Pro: brak karty limitu i bloku zakresu', () => {
    mockDb.app_settings.set('is_pro_active', 'true');
    const str = JSON.stringify(renderModal().toJSON());
    expect(str).not.toContain('Darmowy poziom');
    expect(str).not.toContain('Limit darmowego poziomu');
    expect(str).not.toContain('Po wyczerpaniu limitu');
  });

  test('wybór planu rocznego bez sklepu: pokazuje „zakup niedostępny”, nie aktywuje Pro i nie zamyka modala', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const handleClose = jest.fn();
    const handlePurchaseSuccess = jest.fn();
    const tree = await renderModalAsync({ onClose: handleClose, onPurchaseSuccess: handlePurchaseSuccess });

    await press(tree, 'plan-annual-btn');

    expect(alertSpy).toHaveBeenCalledWith(UNAVAILABLE_TITLE, UNAVAILABLE_MSG);
    expect(handleClose).not.toHaveBeenCalled();
    expect(handlePurchaseSuccess).not.toHaveBeenCalled();
    expect(mockDb.app_settings.has('is_pro_active')).toBe(false);
  });

  test('wybór planu miesięcznego i dożywotniego bez sklepu: ten sam komunikat, bez zapisu Pro', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const tree = await renderModalAsync();

    await press(tree, 'plan-monthly-btn');
    await press(tree, 'plan-lifetime-btn');

    expect(alertSpy).toHaveBeenCalledTimes(2);
    expect(alertSpy).toHaveBeenNthCalledWith(1, UNAVAILABLE_TITLE, UNAVAILABLE_MSG);
    expect(mockDb.app_settings.has('is_pro_active')).toBe(false);
  });

  test('Przywrócenie zakupów bez sklepu: także pokazuje „zakup niedostępny”', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const handleClose = jest.fn();
    const tree = await renderModalAsync({ onClose: handleClose });

    await press(tree, 'restore-purchases-btn');

    expect(alertSpy).toHaveBeenCalledWith(UNAVAILABLE_TITLE, UNAVAILABLE_MSG);
    expect(handleClose).not.toHaveBeenCalled();
  });

  test('Zamknięcie modala przyciskiem Zamknij wywołuje onClose', () => {
    const handleCloseOnly = jest.fn();
    const tree = renderModal({ onClose: handleCloseOnly });
    act(() => tree.root.findByProps({ testID: 'close-paywall-btn' }).props.onPress());
    expect(handleCloseOnly).toHaveBeenCalled();
  });
});

describe('Apps4BrewPassModal ze sklepem (etap 4b)', () => {
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    mockDb.app_settings.clear();
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    configureStoreAdapter(null);
    jest.restoreAllMocks();
  });

  test('ceny pochodzą z App Store (displayPrice), a bez produktów zostaje tekst zastępczy', async () => {
    useStore({
      listProducts: async () => [
        { productId: STORE_PRODUCT_IDS.yearly, plan: 'yearly', displayPrice: '22,99 zł' },
      ],
    });
    const str = JSON.stringify((await renderModalAsync()).toJSON());
    expect(str).toContain('22,99 zł');
    expect(str).not.toContain('$4.99 / rok');
    expect(str).toContain('$0.99 / msc');
  });

  test('zakup w sklepie: plan roczny aktywuje Pro przez onSubscribed (bez zamykania przez onPurchaseSuccess)', async () => {
    useStore({
      purchase: async (productId) => ({ status: 'success', productId }),
      restore: async () => [{ productId: STORE_PRODUCT_IDS.yearly, plan: 'yearly' }],
    });
    const onSubscribed = jest.fn();
    const onPurchaseSuccess = jest.fn();
    const tree = await renderModalAsync({ onSubscribed, onPurchaseSuccess });

    await press(tree, 'plan-annual-btn');

    expect(onSubscribed).toHaveBeenCalledTimes(1);
    expect(onPurchaseSuccess).not.toHaveBeenCalled();
    expect(mockDb.app_settings.get('is_pro_active')).toBe('true');
    expect(alertSpy).not.toHaveBeenCalled();
  });

  test('zakup dożywotni w sklepie wywołuje onPurchaseSuccess', async () => {
    useStore({
      purchase: async (productId) => ({ status: 'success', productId }),
      restore: async () => [{ productId: STORE_PRODUCT_IDS.lifetime, plan: 'lifetime' }],
    });
    const onSubscribed = jest.fn();
    const onPurchaseSuccess = jest.fn();
    const tree = await renderModalAsync({ onSubscribed, onPurchaseSuccess });

    await press(tree, 'plan-lifetime-btn');

    expect(onPurchaseSuccess).toHaveBeenCalledTimes(1);
    expect(onSubscribed).not.toHaveBeenCalled();
  });

  test('anulowanie nie pokazuje alertu i nie aktywuje Pro', async () => {
    useStore({ purchase: async (productId) => ({ status: 'cancelled', productId }) });
    const onSubscribed = jest.fn();
    const tree = await renderModalAsync({ onSubscribed });

    await press(tree, 'plan-monthly-btn');

    expect(alertSpy).not.toHaveBeenCalled();
    expect(onSubscribed).not.toHaveBeenCalled();
    expect(mockDb.app_settings.get('is_pro_active')).not.toBe('true');
  });

  test('zakup oczekujący i błąd pokazują własne komunikaty, bez Pro', async () => {
    useStore({ purchase: async (productId) => ({ status: 'pending', productId }) });
    const tree = await renderModalAsync();
    await press(tree, 'plan-monthly-btn');
    expect(alertSpy).toHaveBeenLastCalledWith(
      'Zakup czeka na zatwierdzenie',
      'App Store potrzebuje zatwierdzenia płatności. Pro włączy się automatycznie po potwierdzeniu zakupu.'
    );

    useStore({ purchase: async (productId) => ({ status: 'error', productId }) });
    const tree2 = await renderModalAsync();
    await press(tree2, 'plan-lifetime-btn');
    expect(alertSpy).toHaveBeenLastCalledWith(
      'Zakup nie powiódł się',
      'Nie udało się sfinalizować zakupu. Spróbuj ponownie później.'
    );
    expect(mockDb.app_settings.get('is_pro_active')).not.toBe('true');
  });

  test('przywrócenie aktywnego zakupu odtwarza Pro i informuje rodzica', async () => {
    useStore({ restore: async () => [{ productId: STORE_PRODUCT_IDS.monthly, plan: 'monthly' }] });
    const onPurchaseSuccess = jest.fn();
    const tree = await renderModalAsync({ onPurchaseSuccess });

    await press(tree, 'restore-purchases-btn');

    expect(alertSpy).toHaveBeenCalledWith('Przywrócono Pro', 'Aktywny zakup Apps4Brew Pro został odtworzony na tym urządzeniu.');
    expect(onPurchaseSuccess).toHaveBeenCalledTimes(1);
    expect(mockDb.app_settings.get('is_pro_active')).toBe('true');
  });

  test('przywrócenie bez zakupów i błąd odczytu mają osobne komunikaty', async () => {
    useStore({ restore: async () => [] });
    const tree = await renderModalAsync();
    await press(tree, 'restore-purchases-btn');
    expect(alertSpy).toHaveBeenLastCalledWith(
      'Brak zakupów do przywrócenia',
      'Nie znaleziono aktywnego zakupu Apps4Brew Pro dla tego Apple ID.'
    );

    useStore({
      restore: async () => {
        throw new Error('brak odczytu');
      },
    });
    const tree2 = await renderModalAsync();
    await press(tree2, 'restore-purchases-btn');
    expect(alertSpy).toHaveBeenLastCalledWith(
      'Przywracanie nie powiodło się',
      'Nie udało się odczytać zakupów z App Store. Spróbuj ponownie później.'
    );
  });
});
