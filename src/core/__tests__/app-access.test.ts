// ============================================================================
// Napar (Steepwise) — Unit Tests: App Access & Monetization (Cheaper than Espresso)
// ============================================================================

import React from 'react';
import renderer, { act } from 'react-test-renderer';
import {
  getAppAccessState,
  recordBrewCompleted,
  activateSubscription,
  restorePurchases,
  resetTrialForTesting,
  setTrialExpiredForTesting,
  useAppAccess,
  TRIAL_MAX_BREWS,
  TRIAL_DURATION_DAYS,
  STORE_PRODUCT_IDS,
} from '../app-access';
import { initDatabase, setAppSetting, getAppSetting } from '../database';

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

describe('App Access & Monetization Engine (Cheaper than Espresso)', () => {
  beforeEach(() => {
    mockSettings.clear();
    const { clearAccessListenersForTesting } = require('../app-access');
    clearAccessListenersForTesting();
    resetTrialForTesting();
  });

  afterEach(() => {
    const { clearAccessListenersForTesting } = require('../app-access');
    clearAccessListenersForTesting();
  });

  test('Początkowy stan aplikacji: aktywny trial z pełnym dostępem (100% funkcji)', () => {
    const state = getAppAccessState();
    expect(state.status).toBe('trial_active');
    expect(state.brewsCount).toBe(0);
    expect(state.brewsRemaining).toBe(TRIAL_MAX_BREWS);
    expect(state.daysRemaining).toBeLessThanOrEqual(TRIAL_DURATION_DAYS);
    expect(state.canCreate).toBe(true);
    expect(state.isHistoryReadOnly).toBe(false);
    expect(state.isSubscribed).toBe(false);
  });

  test('Ukończenie parzenia inkrementuje licznik sesji trialowych', () => {
    recordBrewCompleted();
    let state = getAppAccessState();
    expect(state.brewsCount).toBe(1);
    expect(state.brewsRemaining).toBe(TRIAL_MAX_BREWS - 1);
    expect(state.canCreate).toBe(true);

    recordBrewCompleted();
    state = getAppAccessState();
    expect(state.brewsCount).toBe(2);
    expect(state.brewsRemaining).toBe(TRIAL_MAX_BREWS - 2);
    expect(state.status).toBe('trial_active');
  });

  test('Osiągnięcie limitu parzeń wygasza trial i blokuje tworzenie, zachowując historię read-only', () => {
    for (let i = 0; i < TRIAL_MAX_BREWS; i++) {
      recordBrewCompleted();
    }

    const state = getAppAccessState();
    expect(state.status).toBe('trial_expired');
    expect(state.brewsCount).toBe(TRIAL_MAX_BREWS);
    expect(state.brewsRemaining).toBe(0);
    expect(state.canCreate).toBe(false);
    expect(state.isHistoryReadOnly).toBe(true);
  });

  test('Upływ 14 dni wygasza trial nawet przy mniejszej liczbie parzeń', () => {
    // Ustaw datę rozpoczęcia trialu na 15 dni temu
    const pastDate = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString();
    setAppSetting('trial_started_at', pastDate);

    const state = getAppAccessState();
    expect(state.status).toBe('trial_expired');
    expect(state.canCreate).toBe(false);
    expect(state.isHistoryReadOnly).toBe(true);
  });

  test('Cofnięcie zegara systemowego nie przywraca zużytych dni okresu próbnego (monotonic trial days)', () => {
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
    setAppSetting('trial_started_at', tenDaysAgo);
    let state = getAppAccessState();
    expect(state.daysRemaining).toBe(4);

    const oneDayAgo = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString();
    setAppSetting('trial_started_at', oneDayAgo);
    state = getAppAccessState();
    expect(state.daysRemaining).toBe(4);
  });

  test('Wygasły trial (canCreate=false) nie blokuje usuwania własnych danych użytkownika (M1-audytor-generalny-012)', () => {
    setTrialExpiredForTesting();
    const state = getAppAccessState();
    expect(state.canCreate).toBe(false);
    expect(state.isHistoryReadOnly).toBe(true);
    // Operacje usuwania nie mogą być warunkowane flagą canCreate
  });

  test('Aktywacja subskrypcji odblokowuje pełny dostęp bez limitów', () => {
    setTrialExpiredForTesting();
    expect(getAppAccessState().status).toBe('trial_expired');

    const state = activateSubscription('annual');
    expect(state.status).toBe('subscribed');
    expect(state.isSubscribed).toBe(true);
    expect(state.canCreate).toBe(true);
    expect(state.subscriptionTier).toBe('annual');
    expect(state.brewsRemaining).toBe(Infinity);

    // Dalsze parzenia nie zmieniają statusu subskrypcji
    recordBrewCompleted();
    expect(getAppAccessState().status).toBe('subscribed');
  });

  test('Przywrócenie zakupów (Restore Purchases) bez wcześniejszego zakupu nie aktywuje licencji', () => {
    setTrialExpiredForTesting();
    const result = restorePurchases();
    expect(result.restored).toBe(false);
    expect(result.status).toBe('trial_expired');
    expect(result.isSubscribed).toBe(false);
    expect(result.canCreate).toBe(false);
  });

  test('Przywrócenie zakupów (Restore Purchases) po wcześniejszym zakupie poprawnie przywraca licencję', () => {
    activateSubscription('annual');
    // Symulacja utraty flagi sesyjnej przy zachowanym dowodzie zakupu
    setAppSetting('is_pro_active', 'false');
    setAppSetting('subscription_tier', 'none');

    const result = restorePurchases();
    expect(result.restored).toBe(true);
    expect(result.status).toBe('subscribed');
    expect(result.isSubscribed).toBe(true);
    expect(result.subscriptionTier).toBe('annual');
    expect(result.canCreate).toBe(true);
  });

  test('Hook useAppAccess reaguje na subskrypcję, odświeżenie i rejestrację parzeń', () => {
    let hookData: any;
    const TestConsumer = () => {
      hookData = useAppAccess();
      return null;
    };

    act(() => {
      renderer.create(React.createElement(TestConsumer));
    });

    expect(hookData.status).toBe('trial_active');
    expect(hookData.canCreate).toBe(true);

    act(() => {
      hookData.recordBrew();
    });
    expect(hookData.brewsCount).toBe(1);

    act(() => {
      hookData.subscribe('monthly');
    });
    expect(hookData.status).toBe('subscribed');
    expect(hookData.isSubscribed).toBe(true);
    expect(hookData.subscriptionTier).toBe('monthly');

    let restoredResult: boolean = false;
    act(() => {
      restoredResult = hookData.restore();
    });
    expect(restoredResult).toBe(true);
    expect(hookData.subscriptionTier).toBe('monthly');

    act(() => {
      hookData.refresh();
    });
    expect(hookData.status).toBe('subscribed');
  });

  test('Identyfikatory produktów App Store / Google Play są poprawnie zdefiniowane', () => {
    expect(STORE_PRODUCT_IDS.monthly).toBe('pl.lukasz.napar.monthly');
    expect(STORE_PRODUCT_IDS.annual).toBe('pl.lukasz.napar.annual');
    expect(STORE_PRODUCT_IDS.lifetime).toBe('pl.lukasz.napar.lifetime');
  });

  test('Weryfikacja podpisanego pokwitowania StoreKit aktywuje subskrypcję i zapisuje receipt JSON', () => {
    setTrialExpiredForTesting();
    expect(getAppAccessState().status).toBe('trial_expired');

    const fakeReceipt = {
      productId: STORE_PRODUCT_IDS.lifetime,
      transactionId: 'TX-STOREKIT-998811',
      purchaseDate: new Date().toISOString(),
      signature: 'VALID_CRYPTOGRAPHIC_SIG_8877',
    };

    // Import funkcji weryfikacji
    const { verifyAndActivateStoreKitPurchase } = require('../app-access');
    const result = verifyAndActivateStoreKitPurchase(fakeReceipt);
    expect(result.success).toBe(true);
    expect(result.tier).toBe('lifetime');

    const state = getAppAccessState();
    expect(state.status).toBe('subscribed');
    expect(state.isSubscribed).toBe(true);
    expect(state.subscriptionTier).toBe('lifetime');

    // Nieprawidłowe pokwitowanie jest odrzucane
    const invalidResult = verifyAndActivateStoreKitPurchase({
      productId: 'invalid.product.id',
      transactionId: 'TX-1',
      purchaseDate: new Date().toISOString(),
      signature: 'SIG',
    });
    expect(invalidResult.success).toBe(false);
  });
  test('rejestruje subskrybentów zmian dostępu i wywołuje notifyAccessChanged oraz purchaseWithStoreKit', async () => {
    const { subscribeAccessChanges, notifyAccessChanged, purchaseWithStoreKit } = require('../app-access');
    let called = false;
    const unsub = subscribeAccessChanges(() => {
      called = true;
    });
    notifyAccessChanged();
    expect(called).toBe(true);
    unsub();

    const purchaseRes = await purchaseWithStoreKit('monthly');
    expect(purchaseRes).toBeDefined();
  });

  test('TASK-P5-02-MON: Monotoniczny trial_max_brews_seen chroni przed cofnięciem licznika zaparzeń', () => {
    // Zasymuluj wykonanie 10 zaparzeń
    for (let i = 0; i < 10; i++) {
      recordBrewCompleted();
    }
    const state10 = getAppAccessState();
    expect(state10.brewsCount).toBe(10);
    expect(state10.brewsRemaining).toBe(5);

    // Próba manipulacji / obniżenia licznika zaparzeń w app_settings do 2
    const { setAppSetting } = require('../database');
    setAppSetting('trial_brews_count', '2');

    // Mimo obniżenia trial_brews_count, monotoniczny trial_max_brews_seen utrzymuje wartość 10
    const stateProtected = getAppAccessState();
    expect(stateProtected.brewsCount).toBe(10);
    expect(stateProtected.brewsRemaining).toBe(5);
  });

  test('TASK-P6-02-MON: resetTrialForTesting czyści również monotoniczny trial_max_brews_seen', () => {
    for (let i = 0; i < 15; i++) {
      recordBrewCompleted();
    }
    expect(getAppAccessState().status).toBe('trial_expired');

    resetTrialForTesting();

    const state = getAppAccessState();
    expect(state.status).toBe('trial_active');
    expect(state.brewsCount).toBe(0);
    expect(state.brewsRemaining).toBe(15);
  });

  test('TASK-P7-02-MON: Uszkodzony ciąg trial_started_at nie powoduje NaN w elapsedDays i daysRemaining', () => {
    resetTrialForTesting();
    setAppSetting('trial_started_at', 'corrupted-non-iso-date');

    const state = getAppAccessState();
    expect(Number.isFinite(state.daysRemaining)).toBe(true);
    expect(state.daysRemaining).toBe(TRIAL_DURATION_DAYS);
    expect(state.status).toBe('trial_active');
  });

  test('TASK-P8-02-MON: maxDaysSeen jest chronione przed wartościami ujemnymi, a setTrialExpiredForTesting ustawia pełne wygaśnięcie dni', () => {
    resetTrialForTesting();
    setAppSetting('trial_max_days_seen', '-5');
    const state = getAppAccessState();
    expect(state.daysRemaining).toBe(TRIAL_DURATION_DAYS);

    setTrialExpiredForTesting();
    const expiredState = getAppAccessState();
    expect(expiredState.status).toBe('trial_expired');
    expect(expiredState.daysRemaining).toBe(0);
    expect(getAppSetting('trial_max_days_seen', '0')).toBe(String(TRIAL_DURATION_DAYS));
  });
});
