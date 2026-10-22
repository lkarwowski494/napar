// ============================================================================
// Napar (Steepwise) — Unit Tests: dostęp do parzenia (most polityka <-> baza <-> UI)
// Model M5 S1: 7 dni parzenia w miesiącu, Pro znosi limit, brak okresu próbnego.
// Zakup w aplikacji nie istnieje w tym etapie: test pilnuje, że nie ma atrapy sukcesu.
// ============================================================================

import React from 'react';
import renderer, { act } from 'react-test-renderer';
import {
  getBrewAccessState,
  getBrewStartDecision,
  recordTimerBrewCompleted,
  useAppAccess,
} from '../app-access';
import { setAppSetting } from '../database';
import { FREE_BREW_DAYS_SETTING_KEY } from '../repositories/brew-access';
import { exhaustedFreeBrewDaysValue, freeBrewDaysValue } from '../../../tests/helpers/free-brew-days';

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

const MONDAY_7TH = new Date(2026, 9, 7, 10, 0);
const THURSDAY_22ND = new Date(2026, 9, 22, 10, 0);

describe('dostęp do parzenia: stan i decyzje (czysty zegar)', () => {
  beforeEach(() => {
    mockSettings.clear();
  });

  test('stan początkowy: darmowy poziom, pełne 7 dni, brak wliczonego dzisiaj', () => {
    expect(getBrewAccessState(THURSDAY_22ND)).toEqual({
      isPro: false,
      monthDaysUsed: 0,
      todayCounted: false,
      remainingDays: 7,
      freeDaysPerMonth: 7,
    });
  });

  test('bez okresu próbnego: żadne ustawienie triala nie wpływa na dostęp', () => {
    setAppSetting('trial_started_at', '2000-01-01T00:00:00.000Z');
    setAppSetting('trial_brews_count', '0');
    expect(getBrewAccessState(THURSDAY_22ND).remainingDays).toBe(7);
  });

  test('ukończenie parzenia wlicza dzisiejszy dzień i zmniejsza pozostałe dni', () => {
    recordTimerBrewCompleted(THURSDAY_22ND);
    expect(getBrewAccessState(THURSDAY_22ND)).toMatchObject({
      monthDaysUsed: 1,
      todayCounted: true,
      remainingDays: 6,
    });
  });

  test('drugie parzenie tego samego dnia nie zużywa limitu', () => {
    recordTimerBrewCompleted(THURSDAY_22ND);
    recordTimerBrewCompleted(THURSDAY_22ND);
    expect(getBrewAccessState(THURSDAY_22ND).monthDaysUsed).toBe(1);
  });

  test('7. dzień dozwolony, 8. dzień blokowany (start nowego dnia)', () => {
    mockSettings.set(FREE_BREW_DAYS_SETTING_KEY, freeBrewDaysValue(6, THURSDAY_22ND));
    expect(getBrewStartDecision(false, THURSDAY_22ND).allowed).toBe(true);

    recordTimerBrewCompleted(THURSDAY_22ND);
    const nextDay = new Date(2026, 9, 23, 10, 0);
    expect(getBrewStartDecision(false, nextDay)).toEqual({
      allowed: false,
      reason: 'limit_reached',
      remainingDays: 0,
    });
  });

  test('blokada nie przerywa trwającego parzenia (sessionInProgress)', () => {
    mockSettings.set(FREE_BREW_DAYS_SETTING_KEY, exhaustedFreeBrewDaysValue(MONDAY_7TH));
    expect(getBrewStartDecision(true, MONDAY_7TH).allowed).toBe(true);
    expect(getBrewStartDecision(false, MONDAY_7TH).allowed).toBe(false);
  });

  test('Pro omija limit i nie pokazuje pozostałych dni', () => {
    mockSettings.set(FREE_BREW_DAYS_SETTING_KEY, exhaustedFreeBrewDaysValue(MONDAY_7TH));
    setAppSetting('is_pro_active', 'true');
    expect(getBrewAccessState(MONDAY_7TH)).toMatchObject({
      isPro: true,
      remainingDays: Infinity,
    });
    expect(getBrewStartDecision(false, MONDAY_7TH)).toEqual({
      allowed: true,
      reason: 'pro',
      remainingDays: Infinity,
    });
  });

  test('zapis dnia bez podanej daty używa bieżącego zegara', () => {
    recordTimerBrewCompleted();
    expect(getBrewAccessState().monthDaysUsed).toBe(1);
    expect(getBrewStartDecision(false).remainingDays).toBe(6);
  });

  test('pusty stan bez podanej daty działa na bieżącym zegarze', () => {
    expect(getBrewAccessState().freeDaysPerMonth).toBe(7);
  });
});

describe('hook useAppAccess (widok)', () => {
  beforeEach(() => {
    mockSettings.clear();
  });

  test('odświeża stan po ukończeniu parzenia i udostępnia decyzję startu', () => {
    let latest: ReturnType<typeof useAppAccess> | null = null;
    function Probe() {
      latest = useAppAccess();
      return null;
    }

    act(() => {
      renderer.create(React.createElement(Probe));
    });
    expect(latest!.monthDaysUsed).toBe(0);
    expect(latest!.checkBrewStart(false).allowed).toBe(true);

    act(() => {
      latest!.recordTimerBrew();
    });
    expect(latest!.monthDaysUsed).toBe(1);
    expect(latest!.todayCounted).toBe(true);

    act(() => {
      latest!.refresh();
    });
    expect(latest!.remainingDays).toBe(6);
  });

  test('zapis parzenia odświeża wszystkie zamontowane instancje; odmontowana przestaje nasłuchiwać', () => {
    let first: ReturnType<typeof useAppAccess> | null = null;
    let second: ReturnType<typeof useAppAccess> | null = null;
    function ProbeA() {
      first = useAppAccess();
      return null;
    }
    function ProbeB() {
      second = useAppAccess();
      return null;
    }
    let treeA: any;
    let treeB: any;
    act(() => {
      treeA = renderer.create(React.createElement(ProbeA));
      treeB = renderer.create(React.createElement(ProbeB));
    });

    act(() => {
      recordTimerBrewCompleted();
    });
    expect(first!.monthDaysUsed).toBe(1);
    expect(second!.monthDaysUsed).toBe(1);

    // Inny dzień tego samego miesiąca (ten sam dzień nie zwiększa licznika)
    const now = new Date();
    const otherDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() === 1 ? 2 : 1, 12);
    act(() => {
      treeB.unmount();
    });
    act(() => {
      recordTimerBrewCompleted(otherDay);
    });
    expect(first!.monthDaysUsed).toBe(2);
    expect(second!.monthDaysUsed).toBe(1);
    act(() => {
      treeA.unmount();
    });
  });

  test('zwraca decyzję odmowną po wyczerpaniu limitu', () => {
    mockSettings.set(FREE_BREW_DAYS_SETTING_KEY, exhaustedFreeBrewDaysValue());
    let latest: ReturnType<typeof useAppAccess> | null = null;
    function Probe() {
      latest = useAppAccess();
      return null;
    }
    act(() => {
      renderer.create(React.createElement(Probe));
    });
    expect(latest!.checkBrewStart(false).allowed).toBe(false);
    expect(latest!.checkBrewStart(true).allowed).toBe(true);
  });
});
