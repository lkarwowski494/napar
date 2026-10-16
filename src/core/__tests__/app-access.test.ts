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
import { initDatabase, setAppSetting } from '../database';

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
    resetTrialForTesting();
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
    expect(state.brewsRemaining).toBe(1);
    expect(state.status).toBe('trial_active');
  });

  test('Osiągnięcie limitu 3 parzeń wygasza trial i blokuje tworzenie, zachowując historię read-only', () => {
    recordBrewCompleted(); // 1
    recordBrewCompleted(); // 2
    recordBrewCompleted(); // 3

    const state = getAppAccessState();
    expect(state.status).toBe('trial_expired');
    expect(state.brewsCount).toBe(3);
    expect(state.brewsRemaining).toBe(0);
    expect(state.canCreate).toBe(false);
    expect(state.isHistoryReadOnly).toBe(true);
  });

  test('Upływ 7 dni wygasza trial nawet przy mniejszej liczbie parzeń', () => {
    // Ustaw datę rozpoczęcia trialu na 8 dni temu
    const pastDate = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
    setAppSetting('trial_started_at', pastDate);

    const state = getAppAccessState();
    expect(state.status).toBe('trial_expired');
    expect(state.canCreate).toBe(false);
    expect(state.isHistoryReadOnly).toBe(true);
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
});
