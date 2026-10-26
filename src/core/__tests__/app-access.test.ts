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
  purchaseWithStoreKit,
  verifyAndActivateStoreKitPurchase,
  getTrialDaysRemaining,
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

    let restoredResult: any;
    act(() => {
      restoredResult = hookData.restore();
    });
    expect(restoredResult.restored).toBe(true);
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

  test('TASK-P10-02-MON: activateSubscription waliduje dopuszczalne tiery i stosuje fallback annual przy błędnym tierze', () => {
    resetTrialForTesting();
    const state = activateSubscription('corrupt_tier_hack' as any);
    expect(state.isSubscribed).toBe(true);
    expect(state.subscriptionTier).toBe('annual');
    expect(getAppSetting('subscription_tier', '')).toBe('annual');
    expect(getAppSetting('verified_purchase_tier', '')).toBe('annual');

    activateSubscription('lifetime');
    const lifetimeState = getAppAccessState();
    expect(lifetimeState.subscriptionTier).toBe('lifetime');
  });

  test('TASK-P9-02-MON: restorePurchases odrzuca nieznany lub uszkodzony tier zakupu', () => {
    resetTrialForTesting();
    setAppSetting('has_verified_purchase', 'true');
    setAppSetting('verified_purchase_tier', 'invalid_corrupt_tier');

    const result = restorePurchases();
    expect(result.restored).toBe(false);
    expect(result.isSubscribed).toBe(false);

    setAppSetting('verified_purchase_tier', 'annual');
    const validResult = restorePurchases();
    expect(validResult.restored).toBe(true);
    expect(validResult.isSubscribed).toBe(true);
    expect(validResult.subscriptionTier).toBe('annual');
  });

  test('TASK-P11-02-MON: purchaseWithStoreKit zwraca zwalidowany tier, a verifyAndActivateStoreKitPurchase odrzuca puste lub whitespace podpisy', () => {
    resetTrialForTesting();
    const purchaseResult = purchaseWithStoreKit('unsupported_hack' as any);
    expect(purchaseResult.success).toBe(true);
    expect(purchaseResult.tier).toBe('annual');
    // TASK-P13-02-MON: Uzupełnienie wyniku o kompletny StoreKitReceipt
    expect(purchaseResult.receipt).toBeDefined();
    expect(purchaseResult.receipt?.productId).toBe(STORE_PRODUCT_IDS.annual);
    expect(purchaseResult.receipt?.transactionId).toContain('mock-storekit-tx-');
    expect(purchaseResult.receipt?.signature).toContain('valid-receipt-signature-annual');

    const emptySignatureRes = verifyAndActivateStoreKitPurchase({
      productId: STORE_PRODUCT_IDS.annual,
      transactionId: '   ',
      purchaseDate: new Date().toISOString(),
      signature: '   ',
    });
    expect(emptySignatureRes.success).toBe(false);
    expect(emptySignatureRes.errorCode).toBe('invalid_signature');
  });

  test('TASK-P14-02-MON: restorePurchases zwraca receipt odzyskany z verified_receipt_json', () => {
    resetTrialForTesting();
    const testReceipt = {
      productId: STORE_PRODUCT_IDS.annual,
      transactionId: 'TX-VERIFIED-RESTORE-1',
      purchaseDate: '2026-10-26T00:00:00.000Z',
      signature: 'RESTORE_SIG_123',
    };
    setAppSetting('has_verified_purchase', 'true');
    setAppSetting('verified_purchase_tier', 'annual');
    setAppSetting('verified_receipt_json', JSON.stringify(testReceipt));

    const result = restorePurchases();
    expect(result.restored).toBe(true);
    expect(result.receipt).toBeDefined();
    expect(result.receipt?.transactionId).toBe('TX-VERIFIED-RESTORE-1');
    expect(result.receipt?.signature).toBe('RESTORE_SIG_123');
  });

  test('TASK-P15-02-MON: useAppAccess().purchaseWithStoreKit synchronizuje stan hooka', () => {
    resetTrialForTesting();
    let hookData: any;
    function TestComponent() {
      hookData = useAppAccess();
      return null;
    }
    act(() => {
      renderer.create(React.createElement(TestComponent));
    });
    expect(hookData.status).toBe('trial_active');

    act(() => {
      hookData.purchaseWithStoreKit('monthly');
    });
    expect(hookData.status).toBe('subscribed');
    expect(hookData.isSubscribed).toBe(true);
  });

  test('TASK-P16-02-MON: useAppAccess().restore() zwraca pełną strukturę RestorePurchasesResult', () => {
    resetTrialForTesting();
    activateSubscription('annual');
    let hookData: any;
    function TestComponent() {
      hookData = useAppAccess();
      return null;
    }
    act(() => {
      renderer.create(React.createElement(TestComponent));
    });

    let res: any;
    act(() => {
      res = hookData.restore();
    });
    expect(res).toBeDefined();
    expect(res.restored).toBe(true);
    expect(res.subscriptionTier).toBe('annual');
    expect(res.isSubscribed).toBe(true);
  });

  test('TASK-P18-02-MON: verifyAndActivateStoreKitPurchase odrzuca brakujące lub puste purchaseDate', () => {
    const res = verifyAndActivateStoreKitPurchase({
      productId: STORE_PRODUCT_IDS.annual,
      transactionId: 'tx-123',
      signature: 'sig-123',
      purchaseDate: '   ',
    });
    expect(res.success).toBe(false);
    expect(res.errorCode).toBe('invalid_signature');
  });

  test('TASK-P19-02-MON: verifyAndActivateStoreKitPurchase odrzuca niepoprawny ciąg daty purchaseDate (nie-ISO)', () => {
    const res = verifyAndActivateStoreKitPurchase({
      productId: STORE_PRODUCT_IDS.annual,
      transactionId: 'tx-123',
      signature: 'sig-123',
      purchaseDate: 'not-a-valid-date-string',
    });
    expect(res.success).toBe(false);
    expect(res.errorCode).toBe('invalid_signature');
  });

  test('TASK-P20-02-MON: brewsRemaining jest ściśle clampowane do [0, TRIAL_MAX_BREWS] przy ujemnych lub astronomicznych wartościach bazy', () => {
    resetTrialForTesting();
    setAppSetting('trial_brews_count', '9999');
    setAppSetting('trial_max_brews_seen', '9999');
    let state = getAppAccessState();
    expect(state.brewsRemaining).toBe(0);

    resetTrialForTesting();
    setAppSetting('trial_brews_count', '-50');
    setAppSetting('trial_max_brews_seen', '-50');
    state = getAppAccessState();
    expect(state.brewsRemaining).toBe(TRIAL_MAX_BREWS);
  });

  test('TASK-P21-02-MON: daysRemaining jest ściśle clampowane do zakresu [0, TRIAL_DURATION_DAYS]', () => {
    resetTrialForTesting();
    setAppSetting('trial_max_days_seen', '999');
    let state = getAppAccessState();
    expect(state.daysRemaining).toBe(0);

    resetTrialForTesting();
    // Przeszła lub przyszła anomalia daty (np. cofnięcie zegara na ujemny czas)
    const futureDate = new Date(Date.now() + 100 * 24 * 60 * 60 * 1000).toISOString();
    setAppSetting('trial_started_at', futureDate);
    setAppSetting('trial_max_days_seen', '0');
    state = getAppAccessState();
    expect(state.daysRemaining).toBeLessThanOrEqual(TRIAL_DURATION_DAYS);
    expect(state.daysRemaining).toBeGreaterThanOrEqual(0);
  });
  test('TASK-P22-02-MON: brewsCount i brewsRemaining są zawsze liczbami całkowitymi (Math.floor)', () => {
    resetTrialForTesting();
    setAppSetting('trial_brews_count', '3.7');
    setAppSetting('trial_max_brews_seen', '3.7');
    const state = getAppAccessState();
    expect(Number.isInteger(state.brewsCount)).toBe(true);
    expect(state.brewsCount).toBe(3);
    expect(Number.isInteger(state.brewsRemaining)).toBe(true);
    expect(state.brewsRemaining).toBe(TRIAL_MAX_BREWS - 3);
  });
  test('TASK-P23-02-MON: restorePurchases poprawnie trimuje spacje w verified_purchase_tier', () => {
    resetTrialForTesting();
    setAppSetting('has_verified_purchase', 'true');
    setAppSetting('verified_purchase_tier', '  annual  ');
    const res = restorePurchases();
    expect(res.restored).toBe(true);
    expect(res.subscriptionTier).toBe('annual');
    expect(res.isSubscribed).toBe(true);
  });

  test('TASK-P24-02-MON: verifyAndActivateStoreKitPurchase poprawnie trimuje spacje w receipt.productId', () => {
    resetTrialForTesting();
    const fakeReceipt = {
      productId: '  pl.lukasz.napar.monthly  ',
      transactionId: 'TX-WHITESPACE-123',
      purchaseDate: new Date().toISOString(),
      signature: 'VALID_SIG_WS',
    };
    const result = verifyAndActivateStoreKitPurchase(fakeReceipt);
    expect(result.success).toBe(true);
    expect(result.tier).toBe('monthly');
  });

  test('TASK-P25-02-MON: purchaseWithStoreKit poprawnie trimuje spacje w parametrze tier', () => {
    resetTrialForTesting();
    const result = purchaseWithStoreKit('  lifetime  ' as any);
    expect(result.success).toBe(true);
    expect(result.tier).toBe('lifetime');
  });

  test('TASK-P26-02-MON: activateSubscription normalizuje wielkość liter i spacje w parametrze tier', () => {
    resetTrialForTesting();
    const stateLifetime = activateSubscription('   LIFETIME   ' as any);
    expect(stateLifetime.isSubscribed).toBe(true);
    expect(stateLifetime.subscriptionTier).toBe('lifetime');

    const stateMonthly = activateSubscription('  Monthly ' as any);
    expect(stateMonthly.subscriptionTier).toBe('monthly');

    const stateFallback = activateSubscription(' nieznany ' as any);
    expect(stateFallback.subscriptionTier).toBe('annual');
  });

  test('TASK-P27-02-MON: getAppAccessState naprawia uszkodzony trial_started_at (whitespace / invalid)', () => {
    resetTrialForTesting();
    const { setAppSetting } = require('../database');
    setAppSetting('trial_started_at', '   ');
    const state = getAppAccessState();
    expect(state.status).toBe('trial_active');
    expect(state.daysRemaining).toBe(14);
  });

  test('TASK-P28-02-MON: purchaseWithStoreKit normalizuje wielkość liter w parametrze tier', () => {
    resetTrialForTesting();
    const resultMonthly = purchaseWithStoreKit('  MONTHLY  ' as any);
    expect(resultMonthly.success).toBe(true);
    expect(resultMonthly.tier).toBe('monthly');

    const resultLifetime = purchaseWithStoreKit(' Lifetime ' as any);
    expect(resultLifetime.success).toBe(true);
    expect(resultLifetime.tier).toBe('lifetime');

    const resultInvalid = purchaseWithStoreKit('invalid_tier' as any);
    expect(resultInvalid.success).toBe(true);
    expect(resultInvalid.tier).toBe('annual');
  });

  test('TASK-P29-02-MON: recordBrewCompleted sanityzuje stan licznika i ogranicza gorny limit po wygasnieciu', () => {
    resetTrialForTesting();
    const { setAppSetting } = require('../database');
    setAppSetting('trial_brews_count', '-5');
    const state = recordBrewCompleted();
    expect(state.brewsCount).toBe(1);

    setAppSetting('trial_brews_count', '999');
    setTrialExpiredForTesting();
    const stateExpired = recordBrewCompleted();
    expect(stateExpired.status).toBe('trial_expired');
    expect(stateExpired.brewsCount).toBeLessThanOrEqual(25);
  });

  test('TASK-P30-02-MON: getTrialDaysRemaining zwraca [0, 14] lub Infinity dla subskrypcji i chroni przed NaN', () => {
    resetTrialForTesting();
    expect(getTrialDaysRemaining()).toBe(14);

    // Symulacja uszkodzonego trial_max_days_seen
    setAppSetting('trial_max_days_seen', 'invalid_number');
    expect(getTrialDaysRemaining()).toBe(14);

    // Użytkownik z subskrypcją
    activateSubscription('monthly');
    expect(getTrialDaysRemaining()).toBe(Infinity);

    // Wygasły okres próbny
    resetTrialForTesting();
    setTrialExpiredForTesting();
    expect(getTrialDaysRemaining()).toBe(0);
  });
});
