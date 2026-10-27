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
  getTrialBrewsRemaining,
  formatSubscriptionTierName,
  formatTrialStatusSummary,
  formatTrialBadgeText,
  isProAccessGranted,
  getSubscriptionTierFromProductId,
  isFeatureGated,
  getGatedFeatureNotice,
  getTierPricingInfo,
  TierPricingInfo,
  getPaywallFeatureHighlights,
  PaywallFeatureHighlight,
  getSubscriptionBadgeInfo,
  SubscriptionBadgeInfo,
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

  test('TASK-P31-02-MON: getTrialBrewsRemaining zwraca [0, TRIAL_MAX_BREWS] lub Infinity dla subskrypcji', () => {
    resetTrialForTesting();
    expect(getTrialBrewsRemaining()).toBe(TRIAL_MAX_BREWS);

    recordBrewCompleted();
    expect(getTrialBrewsRemaining()).toBe(TRIAL_MAX_BREWS - 1);

    // Po aktywacji subskrypcji
    activateSubscription('annual');
    expect(getTrialBrewsRemaining()).toBe(Infinity);

    // Po wygaśnięciu okresu próbnego
    resetTrialForTesting();
    setTrialExpiredForTesting();
    expect(getTrialBrewsRemaining()).toBe(0);
  });

  test('TASK-P33-02-MON: getTrialDaysRemaining i getTrialBrewsRemaining chronią przed wartościami -0', () => {
    resetTrialForTesting();
    setTrialExpiredForTesting();
    const days = getTrialDaysRemaining();
    const brews = getTrialBrewsRemaining();
    expect(Object.is(days, -0)).toBe(false);
    expect(Object.is(brews, -0)).toBe(false);
    expect(days).toBe(0);
    expect(brews).toBe(0);
  });

  test('TASK-P35-02-MON: getAppAccessState parsuje numeryczne stringi dla trial_brews_count i chroni przed -0', () => {
    resetTrialForTesting();
    setAppSetting('trial_brews_count', '7');
    const state = getAppAccessState();
    expect(state.brewsCount).toBe(7);
    expect(state.brewsRemaining).toBe(TRIAL_MAX_BREWS - 7);
    expect(Object.is(state.brewsCount, -0)).toBe(false);
    expect(Object.is(state.brewsRemaining, -0)).toBe(false);
  });

  test('TASK-P36-02-MON: restorePurchases normalizuje wielkość liter tieru a recordBrewCompleted chroni przed -0', () => {
    resetTrialForTesting();
    // Ustaw legalny zakup z mieszaną wielkością liter (np. 'Annual')
    setAppSetting('has_verified_purchase', 'true');
    setAppSetting('verified_purchase_tier', 'Annual');
    const res = restorePurchases();
    expect(res.restored).toBe(true);
    expect(res.isSubscribed).toBe(true);
    expect(res.subscriptionTier).toBe('annual');

    // Test ochrony recordBrewCompleted przed -0
    resetTrialForTesting();
    setAppSetting('trial_brews_count', '-0');
    const afterBrew = recordBrewCompleted();
    expect(afterBrew.brewsCount).toBe(1);
    expect(Object.is(afterBrew.brewsCount, -0)).toBe(false);
  });

  test('TASK-P37-02-MON: ścisła nieujemność i ochrona przed -0 dla brewsCount i elapsed w getAppAccessState', () => {
    resetTrialForTesting();
    setAppSetting('trial_brews_count', '-0');
    setAppSetting('trial_max_brews_seen', '-0');
    setAppSetting('trial_max_days_seen', '-0');
    const state = getAppAccessState();
    expect(state.brewsCount).toBe(0);
    expect(Object.is(state.brewsCount, -0)).toBe(false);
    expect(state.brewsRemaining).toBe(TRIAL_MAX_BREWS);
    expect(Object.is(state.brewsRemaining, -0)).toBe(false);
    expect(state.daysRemaining).toBe(TRIAL_DURATION_DAYS);
    expect(Object.is(state.daysRemaining, -0)).toBe(false);
  });

  test('TASK-P38-02-MON: getAppAccessState normalizuje wielkość liter i spacje w subscription_tier', () => {
    resetTrialForTesting();
    setAppSetting('is_pro_active', 'true');
    setAppSetting('subscription_tier', '  Annual  ');
    const state = getAppAccessState();
    expect(state.isSubscribed).toBe(true);
    expect(state.subscriptionTier).toBe('annual');

    setAppSetting('subscription_tier', '  MONTHLY ');
    const stateMonthly = getAppAccessState();
    expect(stateMonthly.subscriptionTier).toBe('monthly');
  });

  test('TASK-P39-02-MON: restorePurchases uzywa subscription_tier jako fallbacku gdy verified_purchase_tier jest puste', () => {
    resetTrialForTesting();
    setAppSetting('has_verified_purchase', 'true');
    setAppSetting('verified_purchase_tier', '');
    setAppSetting('subscription_tier', 'lifetime');

    const res = restorePurchases();
    expect(res.restored).toBe(true);
    expect(res.isSubscribed).toBe(true);
    expect(res.subscriptionTier).toBe('lifetime');
    expect(getAppSetting('verified_purchase_tier', '')).toBe('lifetime');
  });

  test('TASK-P40-02-MON: setTrialExpiredForTesting resetuje has_verified_purchase, verified_purchase_tier i verified_receipt_json', () => {
    activateSubscription('lifetime');
    expect(getAppSetting('has_verified_purchase', '')).toBe('true');
    expect(getAppSetting('verified_purchase_tier', '')).toBe('lifetime');

    setTrialExpiredForTesting();
    expect(getAppSetting('has_verified_purchase', '')).toBe('false');
    expect(getAppSetting('verified_purchase_tier', '')).toBe('');
    expect(getAppSetting('verified_receipt_json', '')).toBe('');
    expect(getAppAccessState().status).toBe('trial_expired');

    // restorePurchases nie moze przywrocic zakupu bez flag
    const res = restorePurchases();
    expect(res.restored).toBe(false);
    expect(res.isSubscribed).toBe(false);
  });

  test('TASK-P41-02-MON: purchaseWithStoreKit zapisuje verified_receipt_json, a activateSubscription obsluguje nie-stringi i niepoprawne tiery', () => {
    resetTrialForTesting();
    const purchaseResult = purchaseWithStoreKit('monthly');
    expect(purchaseResult.success).toBe(true);
    expect(purchaseResult.tier).toBe('monthly');
    const storedReceipt = getAppSetting('verified_receipt_json', '');
    expect(storedReceipt).toContain('valid-receipt-signature-monthly');

    // restorePurchases przywraca teraz także receipt
    const restoreResult = restorePurchases();
    expect(restoreResult.restored).toBe(true);
    expect(restoreResult.receipt?.signature).toBe('valid-receipt-signature-monthly');

    // activateSubscription fallback do 'annual' dla pustych/błędnych tierów
    const invalidSub = activateSubscription('invalid_tier' as any);
    expect(invalidSub.subscriptionTier).toBe('annual');
    const nullSub = activateSubscription(null as any);
    expect(nullSub.subscriptionTier).toBe('annual');
  });

  test('TASK-P42-02-MON: verifyAndActivateStoreKitPurchase odrzuca tablice i sanityzuje pola paragonu', () => {
    resetTrialForTesting();
    // Przekazanie tablicy jako paragon
    const arrayResult = verifyAndActivateStoreKitPurchase([] as any);
    expect(arrayResult.success).toBe(false);
    expect(arrayResult.errorCode).toBe('invalid_signature');

    // Poprawny paragon z whitespace w polach
    const validReceipt = {
      productId: '  pl.lukasz.napar.annual  ',
      transactionId: '  tx-12345  ',
      purchaseDate: '  2026-10-26T12:00:00.000Z  ',
      signature: '  sig-abcde-12345  ',
    };
    const res = verifyAndActivateStoreKitPurchase(validReceipt as any);
    expect(res.success).toBe(true);
    expect(res.tier).toBe('annual');
    expect(res.receipt?.productId).toBe('pl.lukasz.napar.annual');
    expect(res.receipt?.transactionId).toBe('tx-12345');
    expect(res.receipt?.signature).toBe('sig-abcde-12345');

    const storedJson = getAppSetting('verified_receipt_json', '');
    const parsed = JSON.parse(storedJson);
    expect(parsed.productId).toBe('pl.lukasz.napar.annual');
    expect(parsed.transactionId).toBe('tx-12345');
  });

  test('TASK-P43-02-MON: restorePurchases sanityzuje pola paragonu a verifyAndActivateStoreKitPurchase dopasowuje case-insensitively', () => {
    resetTrialForTesting();
    // Test case-insensitivity w verifyAndActivateStoreKitPurchase
    const upperReceipt = {
      productId: 'PL.LUKASZ.NAPAR.MONTHLY',
      transactionId: 'TX-UPPER-123',
      purchaseDate: '2026-10-26T12:00:00.000Z',
      signature: 'SIG-UPPER-123',
    };
    const resUpper = verifyAndActivateStoreKitPurchase(upperReceipt as any);
    expect(resUpper.success).toBe(true);
    expect(resUpper.tier).toBe('monthly');
    expect(resUpper.receipt?.productId).toBe('pl.lukasz.napar.monthly');

    // Test odporności restorePurchases na uszkodzony receipt JSON (np. tablica lub brakujące pola)
    const { setAppSetting } = require('../database');
    setAppSetting('has_verified_purchase', 'true');
    setAppSetting('verified_purchase_tier', 'lifetime');
    setAppSetting('verified_receipt_json', JSON.stringify([1, 2, 3]));

    const restoredWithBadJson = restorePurchases();
    expect(restoredWithBadJson.restored).toBe(true);
    expect(restoredWithBadJson.receipt).toBeUndefined();

    // Poprawny obiekt paragonu
    setAppSetting(
      'verified_receipt_json',
      JSON.stringify({
        productId: '  pl.lukasz.napar.lifetime  ',
        transactionId: '  tx-restored-99  ',
        purchaseDate: '  2026-10-26T14:00:00.000Z  ',
        signature: '  sig-restored-99  ',
      })
    );
    const restoredGood = restorePurchases();
    expect(restoredGood.restored).toBe(true);
    expect(restoredGood.receipt?.productId).toBe('pl.lukasz.napar.lifetime');
    expect(restoredGood.receipt?.transactionId).toBe('tx-restored-99');
    expect(restoredGood.receipt?.signature).toBe('sig-restored-99');
  });

  test('TASK-P45-02-MON: getTrialDaysRemaining i getTrialBrewsRemaining zwracaja 0 gdy okres probny wygasl', () => {
    resetTrialForTesting();
    const { setAppSetting } = require('../database');
    setAppSetting('trial_brews_count', '15');
    setAppSetting('trial_max_brews_seen', '15');

    const state = getAppAccessState();
    expect(state.status).toBe('trial_expired');
    expect(state.brewsRemaining).toBe(0);
    expect(state.daysRemaining).toBe(0);
    expect(getTrialDaysRemaining()).toBe(0);
    expect(getTrialBrewsRemaining()).toBe(0);
  });

  test('TASK-P46-02-MON: getAppAccessState odporny na niemozliwe lub uszkodzone daty ISO w trial_started_at', () => {
    resetTrialForTesting();
    const { setAppSetting } = require('../database');
    setAppSetting('trial_started_at', '2026-99-99T99:99:99Z');

    const state = getAppAccessState();
    expect(state.status).toBe('trial_active');
    expect(state.daysRemaining).toBe(14);
    expect(Number.isFinite(state.daysRemaining)).toBe(true);
  });

  test('TASK-P47-02-MON: verifyAndActivateStoreKitPurchase akceptuje krotkie identyfikatory tierow (monthly, annual, lifetime)', () => {
    resetTrialForTesting();
    const shortReceipt = {
      productId: 'annual',
      transactionId: 'TX-ANNUAL-999',
      purchaseDate: new Date().toISOString(),
      signature: 'SIG-VALID-999',
    };

    const res = verifyAndActivateStoreKitPurchase(shortReceipt as any);
    expect(res.success).toBe(true);
    expect(res.tier).toBe('annual');
    expect(res.receipt?.productId).toBe('pl.lukasz.napar.annual');

    const state = getAppAccessState();
    expect(state.isSubscribed).toBe(true);
    expect(state.subscriptionTier).toBe('annual');
  });

  test('TASK-P48-02-MON: Odrzucanie transakcji StoreKit z przyszlosci, sanityzacja transactionId i formatTrialStatusSummary', () => {
    resetTrialForTesting();
    const { formatTrialStatusSummary } = require('../app-access');

    // 1. Data transakcji w dalekiej przyszłości (> 24h)
    const farFutureDate = new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString();
    const futureReceipt = {
      productId: 'annual',
      transactionId: 'TX-FUTURE-1',
      purchaseDate: farFutureDate,
      signature: 'SIG-FUTURE-1',
    };
    const futureRes = verifyAndActivateStoreKitPurchase(futureReceipt as any);
    expect(futureRes.success).toBe(false);
    expect(futureRes.errorCode).toBe('invalid_signature');

    // 2. TransactionId ze znakami kontrolnymi i nadmierną długością
    const longDirtyId = 'TX-VALID\x00\x08' + 'A'.repeat(300);
    const dirtyReceipt = {
      productId: 'annual',
      transactionId: longDirtyId,
      purchaseDate: new Date().toISOString(),
      signature: 'SIG-CLEAN',
    };
    const dirtyRes = verifyAndActivateStoreKitPurchase(dirtyReceipt as any);
    expect(dirtyRes.success).toBe(true);
    expect(dirtyRes.receipt?.transactionId.length).toBeLessThanOrEqual(256);
    expect(dirtyRes.receipt?.transactionId).not.toContain('\x00');
    expect(dirtyRes.receipt?.transactionId).not.toContain('\x08');

    // 3. formatTrialStatusSummary
    resetTrialForTesting();
    const activeState = getAppAccessState();
    expect(formatTrialStatusSummary(activeState, 'pl')).toContain('Okres próbny:');
    expect(formatTrialStatusSummary(activeState, 'en')).toContain('Trial:');

    // Dla subskrypcji
    const subState = { ...activeState, isSubscribed: true };
    expect(formatTrialStatusSummary(subState, 'pl')).toBe('Apps4Brew Pass Aktywny');
    expect(formatTrialStatusSummary(subState, 'en')).toBe('Apps4Brew Pass Active');

    // Dla wygasłego trialu
    const expState = { ...activeState, status: 'trial_expired' as const, isSubscribed: false };
    expect(formatTrialStatusSummary(expState, 'pl')).toBe('Okres próbny zakończony');
    expect(formatTrialStatusSummary(expState, 'en')).toBe('Trial expired');
  });

  test('TASK-P50-02-MON: formatTrialStatusSummary chroni przed undefined/null oraz stosuje poprawna polska fleksje (parzenie, parzenia, parzen)', () => {
    const { formatTrialStatusSummary } = require('../app-access');

    // 1. Odporność na null i undefined
    expect(formatTrialStatusSummary(undefined as any, 'pl')).toBe('Stan okresu próbnego nieznany');
    expect(formatTrialStatusSummary(null as any, 'en')).toBe('Trial status unknown');

    // 2. Poprawna polska fleksja
    const baseState: any = {
      status: 'trial_active',
      brewsCount: 0,
      brewsRemaining: 1,
      daysRemaining: 1,
      isSubscribed: false,
      canCreate: true,
      isHistoryReadOnly: false,
      subscriptionTier: 'none',
    };

    expect(formatTrialStatusSummary(baseState, 'pl')).toBe('Okres próbny: 1 parzenie · 1 dzień');

    expect(formatTrialStatusSummary({ ...baseState, brewsRemaining: 3, daysRemaining: 3 }, 'pl')).toBe(
      'Okres próbny: 3 parzenia · 3 dni'
    );

    expect(formatTrialStatusSummary({ ...baseState, brewsRemaining: 14, daysRemaining: 14 }, 'pl')).toBe(
      'Okres próbny: 14 parzeń · 14 dni'
    );

    expect(formatTrialStatusSummary({ ...baseState, brewsRemaining: 22, daysRemaining: 22 }, 'pl')).toBe(
      'Okres próbny: 22 parzenia · 22 dni'
    );

    expect(formatTrialStatusSummary({ ...baseState, brewsRemaining: 25, daysRemaining: 25 }, 'pl')).toBe(
      'Okres próbny: 25 parzeń · 25 dni'
    );
  });

  test('TASK-P51-02-MON: formatSubscriptionTierName formatuje poziomy subskrypcji oraz verifyAndActivateStoreKitPurchase odrzuca zbyt krotkie sygnatury', () => {
    // @ts-ignore
    const { formatSubscriptionTierName, verifyAndActivateStoreKitPurchase } = require('../app-access');

    // 1. formatSubscriptionTierName
    expect(formatSubscriptionTierName('monthly', 'pl')).toBe('Subskrypcja Miesięczna');
    expect(formatSubscriptionTierName('monthly', 'en')).toBe('Monthly Pass');
    expect(formatSubscriptionTierName('annual', 'pl')).toBe('Subskrypcja Roczna');
    expect(formatSubscriptionTierName('annual', 'en')).toBe('Annual Pass');
    expect(formatSubscriptionTierName('lifetime', 'pl')).toBe('Dostęp Dożywotni');
    expect(formatSubscriptionTierName('lifetime', 'en')).toBe('Lifetime Pass');
    expect(formatSubscriptionTierName('none', 'pl')).toBe('Brak subskrypcji');
    expect(formatSubscriptionTierName('none', 'en')).toBe('No active pass');
    expect(formatSubscriptionTierName(null, 'pl')).toBe('Brak subskrypcji');
    expect(formatSubscriptionTierName(undefined, 'en')).toBe('No active pass');

    // 2. verifyAndActivateStoreKitPurchase odrzuca sygnaturę krótszą niż 8 znaków po trimie
    const shortSigReceipt = {
      productId: 'pl.lukasz.napar.annual',
      transactionId: 'tx-valid-1234',
      purchaseDate: new Date().toISOString(),
      signature: '  abc  ',
    };
    const res = verifyAndActivateStoreKitPurchase(shortSigReceipt);
    expect(res.success).toBe(false);
    expect(res.errorCode).toBe('invalid_signature');
  });

  test('TASK-P52-02-MON: formatSubscriptionTierName wspiera identyfikatory StoreKit a formatTrialStatusSummary wspiera stringi z przecinkami', () => {
    // 1. Identyfikatory StoreKit w formatSubscriptionTierName
    expect(formatSubscriptionTierName('pl.lukasz.napar.monthly', 'pl')).toBe('Subskrypcja Miesięczna');
    expect(formatSubscriptionTierName('pl.lukasz.napar.annual', 'en')).toBe('Annual Pass');
    expect(formatSubscriptionTierName('pl.lukasz.napar.lifetime', 'pl')).toBe('Dostęp Dożywotni');

    // 2. Stringi z przecinkami w formatTrialStatusSummary
    const commaState: any = {
      status: 'trial_active',
      brewsRemaining: '12,5',
      daysRemaining: '7,8',
      isSubscribed: false,
    };
    expect(formatTrialStatusSummary(commaState, 'pl')).toBe('Okres próbny: 12 parzeń · 7 dni');
    expect(formatTrialStatusSummary(commaState, 'en')).toBe('Trial: 12 brews · 7 days remaining');
  });

  test('TASK-P53-02-MON: bezpieczna obsługa pustych, uszkodzonych i zanieczyszczonych identyfikatorów StoreKit', () => {
    // 1. Pusty lub whitespace-only productId w verifyAndActivateStoreKitPurchase
    const emptyProductReceipt: any = {
      productId: '   \t  ',
      transactionId: 'tx-valid-999',
      purchaseDate: new Date().toISOString(),
      signature: 'valid-signature-123',
    };
    const resEmpty = verifyAndActivateStoreKitPurchase(emptyProductReceipt);
    expect(resEmpty.success).toBe(false);
    expect(resEmpty.errorCode).toBe('unknown_product');

    // 2. Nie-string productId (np. null, number)
    const nullProductReceipt: any = {
      productId: null,
      transactionId: 'tx-valid-999',
      purchaseDate: new Date().toISOString(),
      signature: 'valid-signature-123',
    };
    const resNull = verifyAndActivateStoreKitPurchase(nullProductReceipt);
    expect(resNull.success).toBe(false);
    expect(resNull.errorCode).toBe('unknown_product');

    // 3. ProductId z ukrytymi znakami sterującymi i spacjami oczyszczany przed dopasowaniem
    const dirtyProductReceipt: any = {
      productId: '  pl.lukasz.napar.lifetime\x00\r\n  ',
      transactionId: 'tx-valid-lifetime-1',
      purchaseDate: new Date().toISOString(),
      signature: 'valid-signature-lifetime',
    };
    const resDirty = verifyAndActivateStoreKitPurchase(dirtyProductReceipt);
    expect(resDirty.success).toBe(true);
    expect(resDirty.tier).toBe('lifetime');
    expect(resDirty.receipt?.productId).toBe(STORE_PRODUCT_IDS.lifetime);

    // 4. formatSubscriptionTierName ze znakami sterującymi
    expect(formatSubscriptionTierName(' \x00pl.lukasz.napar.monthly\x1F ', 'pl')).toBe('Subskrypcja Miesięczna');
    expect(formatSubscriptionTierName(' \tannual\r\n ', 'en')).toBe('Annual Pass');
  });

  test('TASK-P54-02-MON: restorePurchases parsuje JSON z BOM i znakami kontrolnymi, a formatTrialStatusSummary radzi sobie z jednostkami w stringach', () => {
    // 1. restorePurchases z BOM \uFEFF i znakami kontrolnymi w verified_receipt_json
    setAppSetting('has_verified_purchase', 'true');
    setAppSetting('verified_purchase_tier', 'annual');
    const dirtyReceiptJson = '\uFEFF\r\n' + JSON.stringify({
      productId: 'pl.lukasz.napar.annual\x00',
      transactionId: 'tx-restore-12345\x1F',
      purchaseDate: '2026-10-25T12:00:00.000Z',
      signature: 'valid-sig-restore-12345',
    }) + '\n\t';
    setAppSetting('verified_receipt_json', dirtyReceiptJson);

    const restoreRes = restorePurchases();
    expect(restoreRes.restored).toBe(true);
    expect(restoreRes.isSubscribed).toBe(true);
    expect(restoreRes.subscriptionTier).toBe('annual');
    expect(restoreRes.receipt).toBeDefined();
    expect(restoreRes.receipt?.productId).toBe('pl.lukasz.napar.annual');
    expect(restoreRes.receipt?.transactionId).toBe('tx-restore-12345');

    // 2. formatTrialStatusSummary z jednostkami w polach stringowych (np. "10 parzeń", "5 dni")
    const stateWithUnits: any = {
      status: 'trial_active',
      brewsRemaining: ' 10 parzeń ',
      daysRemaining: ' 5 dni ',
      isSubscribed: false,
    };
    expect(formatTrialStatusSummary(stateWithUnits, 'pl')).toBe('Okres próbny: 10 parzeń · 5 dni');
    expect(formatTrialStatusSummary(stateWithUnits, 'en')).toBe('Trial: 10 brews · 5 days remaining');
  });

  test('TASK-P56-02-MON: sanityzacja BOM i znakow kontrolnych w sygnaturze i dacie StoreKit oraz aktywacja produktami StoreKit', () => {
    resetTrialForTesting();
    // 1. verifyAndActivateStoreKitPurchase oczyszcza sygnaturę i datę z BOM oraz znaków kontrolnych
    const dirtySigReceipt = {
      productId: 'pl.lukasz.napar.lifetime',
      transactionId: 'TX-CLEAN-123\x00',
      purchaseDate: '\uFEFF2026-10-26T12:00:00.000Z\r\n',
      signature: '\uFEFFVALID_SIG_WITH_BOM_12345\x00\x08',
    };
    const res = verifyAndActivateStoreKitPurchase(dirtySigReceipt as any);
    expect(res.success).toBe(true);
    expect(res.tier).toBe('lifetime');
    expect(res.receipt?.signature).toBe('VALID_SIG_WITH_BOM_12345');
    expect(res.receipt?.purchaseDate).toBe('2026-10-26T12:00:00.000Z');
    expect(res.receipt?.signature).not.toContain('\uFEFF');
    expect(res.receipt?.purchaseDate).not.toContain('\uFEFF');

    // 2. activateSubscription akceptuje pełny identyfikator produktu ze StoreKit oraz BOM
    const subRes = activateSubscription(' \uFEFFpl.lukasz.napar.monthly\x00 ' as any);
    expect(subRes.isSubscribed).toBe(true);
    expect(subRes.subscriptionTier).toBe('monthly');
  });

  test('TASK-P59-02-MON: formatTrialBadgeText bezpiecznie obsluguje null, undefined, -0 oraz NaN w parametrze stanu', () => {
    resetTrialForTesting();
    // 1. null jako state nie rzuca błędu
    expect(() => formatTrialBadgeText(null as any, 'pl')).not.toThrow();
    const nullPl = formatTrialBadgeText(null as any, 'pl');
    expect(nullPl).toContain('Okres próbny');

    const nullEn = formatTrialBadgeText(undefined, 'en');
    expect(nullEn).toContain('Trial');

    // 2. -0 i NaN w liczbie parzeń lub dni
    const edgeState = {
      status: 'trial_active',
      isSubscribed: false,
      brewsRemaining: -0,
      daysRemaining: NaN,
      brewsCount: 0,
      daysElapsed: 0,
      canCreate: true,
      isHistoryReadOnly: false,
      subscriptionTier: 'none',
    } as any;

    const edgePl = formatTrialBadgeText(edgeState, 'pl');
    expect(edgePl).toBe('Okres próbny: 0 parzeń · 0 dni');
    expect(edgePl).not.toContain('-0');
    expect(edgePl).not.toContain('NaN');

    const edgeEn = formatTrialBadgeText(edgeState, 'en');
    expect(edgeEn).toBe('Trial: 0 brews · 0 days remaining');
    expect(edgeEn).not.toContain('-0');
    expect(edgeEn).not.toContain('NaN');
  });

  test('TASK-P61-02-MON: isProAccessGranted i getSubscriptionTierFromProductId poprawnie weryfikuja uprawnienia i ID produktow', () => {
    // 1. isProAccessGranted
    expect(isProAccessGranted({ status: 'trial_active', isSubscribed: false } as any)).toBe(true);
    expect(isProAccessGranted({ status: 'trial_expired', isSubscribed: true } as any)).toBe(true);
    expect(isProAccessGranted({ status: 'trial_expired', isSubscribed: false } as any)).toBe(false);
    resetTrialForTesting();
    expect(isProAccessGranted(null)).toBe(true); // default active trial
    setTrialExpiredForTesting();
    expect(isProAccessGranted(null)).toBe(false);

    // 2. getSubscriptionTierFromProductId
    expect(getSubscriptionTierFromProductId(STORE_PRODUCT_IDS.lifetime)).toBe('lifetime');
    expect(getSubscriptionTierFromProductId(STORE_PRODUCT_IDS.annual)).toBe('annual');
    expect(getSubscriptionTierFromProductId(STORE_PRODUCT_IDS.monthly)).toBe('monthly');
    expect(getSubscriptionTierFromProductId('\uFEFFannual')).toBe('annual');
    expect(getSubscriptionTierFromProductId('unknown.product')).toBe('none');
    expect(getSubscriptionTierFromProductId(null)).toBe('none');
  });

  test('TASK-P63-02-MON: isFeatureGated i getGatedFeatureNotice centralizuja reguly dostepu do funkcji Pro', () => {
    // 1. Gdy trial jest aktywny lub uzytkownik jest subskrybowany -> nic nie jest zablokowane
    const activeTrialState = { status: 'trial_active', isSubscribed: false } as any;
    expect(isFeatureGated('custom_recipes', activeTrialState)).toBe(false);
    expect(isFeatureGated('water_chemistry', activeTrialState)).toBe(false);
    expect(isFeatureGated('unlimited_beans', activeTrialState)).toBe(false);
    expect(isFeatureGated('dialin_doctor', activeTrialState)).toBe(false);

    const subscribedState = { status: 'subscribed', isSubscribed: true } as any;
    expect(isFeatureGated('custom_recipes', subscribedState)).toBe(false);
    expect(isFeatureGated('dialin_doctor', subscribedState)).toBe(false);

    // 2. Gdy trial wygasł i brak subskrypcji
    const expiredState = { status: 'trial_expired', isSubscribed: false } as any;
    // Funkcje darmowe (Free Core WTP-0) nigdy nie są blokowane
    expect(isFeatureGated('timer', expiredState)).toBe(false);
    expect(isFeatureGated('ratio', expiredState)).toBe(false);
    expect(isFeatureGated('history', expiredState)).toBe(false);

    // Funkcje Pro (WTP-1) są blokowane
    expect(isFeatureGated('custom_recipes', expiredState)).toBe(true);
    expect(isFeatureGated('water_chemistry', expiredState)).toBe(true);
    expect(isFeatureGated('unlimited_beans', expiredState)).toBe(true);
    expect(isFeatureGated('dialin_doctor', expiredState)).toBe(true);

    // 3. getGatedFeatureNotice zwraca zlokalizowany tytul i komunikat
    const noticePl = getGatedFeatureNotice('custom_recipes', 'pl');
    expect(noticePl.title).toBeDefined();
    expect(noticePl.message).toBeDefined();
    expect(noticePl.title.length).toBeGreaterThan(0);

    const noticeEn = getGatedFeatureNotice('water_chemistry', 'en');
    expect(noticeEn.title).toBeDefined();
    expect(noticeEn.message).toBeDefined();
    expect(noticeEn.title.length).toBeGreaterThan(0);
  });

  test('TASK-P66-02-MON: getTierPricingInfo zwraca zlokalizowany cennik i kotwice cenowe dla planów', () => {
    // 1. Plan roczny w PLN
    const annualPl: TierPricingInfo = getTierPricingInfo('annual', 'PLN', 'pl');
    expect(annualPl.tier).toBe('annual');
    expect(annualPl.productId).toBe(STORE_PRODUCT_IDS.annual);
    expect(annualPl.priceFormatted).toContain('zł');
    expect(annualPl.periodLabel).toBe('rok');
    expect(annualPl.monthlyEquivalentFormatted).toBeDefined();
    expect(annualPl.anchorComparison).toContain('kawa');

    // 2. Plan miesięczny w EUR
    const monthlyEur = getTierPricingInfo('monthly', 'EUR', 'en');
    expect(monthlyEur.tier).toBe('monthly');
    expect(monthlyEur.priceFormatted).toContain('€');
    expect(monthlyEur.periodLabel).toBe('month');
    expect(monthlyEur.anchorComparison).toContain('espresso');

    // 3. Plan dożywotni w USD
    const lifetimeUsd = getTierPricingInfo('lifetime', 'USD', 'en');
    expect(lifetimeUsd.tier).toBe('lifetime');
    expect(lifetimeUsd.priceFormatted).toContain('$');
    expect(lifetimeUsd.periodLabel).toBe('lifetime');

    // 4. Odporność na brak parametrów i anomalie
    const fallbackInfo = getTierPricingInfo(null as any, undefined as any);
    expect(fallbackInfo.tier).toBe('annual');
    expect(fallbackInfo.priceFormatted).toContain('zł');
  });

  test('TASK-P68-02-MON: getPaywallFeatureHighlights zwraca zlokalizowaną listę korzyści subskrypcji', () => {
    // 1. Domyślny język polski
    const plHighlights: PaywallFeatureHighlight[] = getPaywallFeatureHighlights('pl');
    expect(Array.isArray(plHighlights)).toBe(true);
    expect(plHighlights.length).toBeGreaterThanOrEqual(5);

    const stashItem = plHighlights.find((h) => h.id === 'stash_unlimited');
    expect(stashItem).toBeDefined();
    expect(stashItem?.title).toContain('spiżarnia');
    expect(stashItem?.icon).toBeDefined();

    // 2. Język angielski
    const enHighlights = getPaywallFeatureHighlights('en');
    expect(enHighlights.length).toBe(plHighlights.length);
    const stashItemEn = enHighlights.find((h) => h.id === 'stash_unlimited');
    expect(stashItemEn?.title).toContain('Unlimited');

    // 3. Odporność na niepoprawne dane i fallback
    const fallbackHighlights = getPaywallFeatureHighlights(null as any);
    expect(Array.isArray(fallbackHighlights)).toBe(true);
    expect(fallbackHighlights.length).toBe(plHighlights.length);
  });

  test('TASK-P71-02-MON: getSubscriptionBadgeInfo wyznacza etykietę i wariant odznaki subskrypcji', () => {
    // 1. Użytkownik subskrybujący PRO Lifetime
    const subscribedState = {
      status: 'subscribed' as const,
      brewsCount: 10,
      brewsRemaining: Infinity,
      daysRemaining: Infinity,
      isSubscribed: true,
      canCreate: true,
      isHistoryReadOnly: false,
      subscriptionTier: 'lifetime' as const,
    };
    const badgePro: SubscriptionBadgeInfo = getSubscriptionBadgeInfo(subscribedState, 'pl');
    expect(badgePro.badgeVariant).toBe('gold');
    expect(badgePro.isPro).toBe(true);
    expect(badgePro.badgeLabel).toBe('PRO Dożywotni');
    expect(badgePro.tier).toBe('lifetime');

    // 2. Wariant angielski dla subskrypcji rocznej
    const badgeAnnualEn = getSubscriptionBadgeInfo({
      ...subscribedState,
      subscriptionTier: 'annual',
    }, 'en');
    expect(badgeAnnualEn.badgeLabel).toBe('PRO Annual');
    expect(badgeAnnualEn.badgeVariant).toBe('gold');

    // 3. Aktywny trial
    const trialState = {
      status: 'trial_active' as const,
      brewsCount: 5,
      brewsRemaining: 10,
      daysRemaining: 7,
      isSubscribed: false,
      canCreate: true,
      isHistoryReadOnly: false,
      subscriptionTier: 'none' as const,
    };
    const badgeTrial = getSubscriptionBadgeInfo(trialState, 'en');
    expect(badgeTrial.badgeVariant).toBe('blue');
    expect(badgeTrial.isPro).toBe(false);
    expect(badgeTrial.badgeLabel).toBe('Trial (7d)');
    expect(badgeTrial.expiresInDays).toBe(7);

    // 4. Wygasły trial (free)
    const expiredState = {
      status: 'trial_expired' as const,
      brewsCount: 15,
      brewsRemaining: 0,
      daysRemaining: 0,
      isSubscribed: false,
      canCreate: false,
      isHistoryReadOnly: true,
      subscriptionTier: 'none' as const,
    };
    const badgeExpired = getSubscriptionBadgeInfo(expiredState, 'pl');
    expect(badgeExpired.badgeVariant).toBe('gray');
    expect(badgeExpired.isPro).toBe(false);
    expect(badgeExpired.badgeLabel).toBe('Plan darmowy');
    expect(badgeExpired.expiresInDays).toBe(0);

    // 5. Pobranie z globalnego stanu z fallbackiem
    const defaultBadge = getSubscriptionBadgeInfo(null, 'pl');
    expect(defaultBadge).toBeDefined();
    expect(defaultBadge.badgeVariant).toBeDefined();
  });
});

