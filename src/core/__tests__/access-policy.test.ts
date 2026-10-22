// ============================================================================
// Napar (Steepwise) — Unit Tests: polityka dostępu do parzenia (model M5 S1)
// Wartości graniczne: 7. dzień dozwolony, 8. blokowany, drugie parzenie dnia dozwolone,
// blokada nie przerywa trwającego parzenia, Pro omija limit.
// ============================================================================

import {
  BrewStartReason,
  FREE_BREW_DAYS_PER_MONTH,
  addCountedBrewDay,
  canStartBrew,
  describeFreeDays,
  fillTemplate,
  getDayKey,
  getMonthKey,
  hasProEntitlement,
  remainingFreeBrewDays,
} from '../access-policy';

const FREE = { isPro: false, todayCounted: false, sessionInProgress: false } as const;

describe('stała darmowego limitu i klucze dni', () => {
  test('darmowy poziom: 7 dni parzenia w miesiącu (decyzja właściciela D-001)', () => {
    expect(FREE_BREW_DAYS_PER_MONTH).toBe(7);
  });

  test('dzień lokalny z dopełnieniem zerami (nie UTC)', () => {
    expect(getDayKey(new Date(2026, 9, 2, 23, 59))).toBe('2026-10-02');
    expect(getDayKey(new Date(2026, 0, 31, 0, 1))).toBe('2026-01-31');
  });

  test('miesiąc to pierwsze 7 znaków klucza dnia', () => {
    expect(getMonthKey('2026-10-22')).toBe('2026-10');
  });

  test('pozostałe dni nigdy nie spadają poniżej zera', () => {
    expect(remainingFreeBrewDays(0)).toBe(7);
    expect(remainingFreeBrewDays(6)).toBe(1);
    expect(remainingFreeBrewDays(7)).toBe(0);
    expect(remainingFreeBrewDays(9)).toBe(0);
  });
});

describe('canStartBrew: wartości graniczne limitu', () => {
  test('pierwszy dzień miesiąca: parzenie dozwolone', () => {
    expect(canStartBrew({ ...FREE, monthDaysUsed: 0 })).toEqual({
      allowed: true,
      reason: 'within_limit',
      remainingDays: 7,
    });
  });

  test('7. dzień (6 wliczonych, dzień nowy): dozwolony', () => {
    expect(canStartBrew({ ...FREE, monthDaysUsed: 6 })).toEqual({
      allowed: true,
      reason: 'within_limit',
      remainingDays: 1,
    });
  });

  test('8. dzień (7 wliczonych, dzień nowy): blokowany', () => {
    expect(canStartBrew({ ...FREE, monthDaysUsed: 7 })).toEqual({
      allowed: false,
      reason: 'limit_reached',
      remainingDays: 0,
    });
  });

  test('drugie parzenie tego samego dnia dozwolone także po wyczerpaniu limitu', () => {
    expect(canStartBrew({ ...FREE, monthDaysUsed: 7, todayCounted: true })).toEqual({
      allowed: true,
      reason: 'today_counted',
      remainingDays: 0,
    });
  });

  test('blokada nie przerywa trwającego parzenia', () => {
    expect(canStartBrew({ ...FREE, monthDaysUsed: 7, sessionInProgress: true })).toEqual({
      allowed: true,
      reason: 'session_in_progress',
      remainingDays: 0,
    });
  });

  test('Pro omija limit niezależnie od liczby wliczonych dni', () => {
    expect(canStartBrew({ ...FREE, isPro: true, monthDaysUsed: 30 })).toEqual({
      allowed: true,
      reason: 'pro',
      remainingDays: Infinity,
    });
  });

  test('Pro ma pierwszeństwo przed pozostałymi regułami', () => {
    expect(
      canStartBrew({ isPro: true, todayCounted: true, sessionInProgress: true, monthDaysUsed: 7 }).reason
    ).toBe('pro');
  });

  test('więcej dni niż limit (np. po zapisie w dniu ukończenia) nie daje ujemnej liczby', () => {
    const decision = canStartBrew({ ...FREE, monthDaysUsed: 9 });
    expect(decision.allowed).toBe(false);
    expect(decision.remainingDays).toBe(0);
  });
});

describe('BrewStartReason: każdy powód decyzji jest osiągalny', () => {
  test('pięć powodów pokrywa wszystkie gałęzie canStartBrew', () => {
    const reasons = new Set<BrewStartReason>([
      canStartBrew({ ...FREE, isPro: true, monthDaysUsed: 0 }).reason,
      canStartBrew({ ...FREE, monthDaysUsed: 0, sessionInProgress: true }).reason,
      canStartBrew({ ...FREE, monthDaysUsed: 7, todayCounted: true }).reason,
      canStartBrew({ ...FREE, monthDaysUsed: 0 }).reason,
      canStartBrew({ ...FREE, monthDaysUsed: 7 }).reason,
    ]);
    expect([...reasons].sort()).toEqual([
      'limit_reached',
      'pro',
      'session_in_progress',
      'today_counted',
      'within_limit',
    ]);
  });
});

describe('addCountedBrewDay: dopisywanie bez usuwania', () => {
  test('dodaje nowy dzień i zachowuje porządek chronologiczny', () => {
    expect(addCountedBrewDay(['2026-10-05'], '2026-10-02')).toEqual(['2026-10-02', '2026-10-05']);
  });

  test('drugi raz ten sam dzień nie zmienia listy', () => {
    expect(addCountedBrewDay(['2026-10-02'], '2026-10-02')).toEqual(['2026-10-02']);
  });

  test('nie modyfikuje wejściowej tablicy', () => {
    const input = ['2026-10-02'];
    addCountedBrewDay(input, '2026-10-03');
    expect(input).toEqual(['2026-10-02']);
  });
});

describe('fillTemplate i describeFreeDays (teksty banera i modala)', () => {
  test('podstawia znane klucze, nieznane zostawia', () => {
    expect(fillTemplate('{a} i {b} i {c}', { a: 1, b: 'x' })).toBe('1 i x i {c}');
  });

  test('Pro: brak tekstu o limicie', () => {
    const templates = { freeDaysStatus: 'L {used}/{limit}', limitReachedStatus: 'X' };
    expect(
      describeFreeDays(
        { isPro: true, monthDaysUsed: 2, remainingDays: Infinity, freeDaysPerMonth: 7 },
        templates
      )
    ).toBeNull();
  });

  test('darmowy poziom z pozostałymi dniami: tekst stanu', () => {
    const templates = {
      freeDaysStatus: '{used}/{limit}, zostało {remaining}',
      limitReachedStatus: 'LIMIT {used}/{limit}',
    };
    expect(
      describeFreeDays(
        { isPro: false, monthDaysUsed: 3, remainingDays: 4, freeDaysPerMonth: 7 },
        templates
      )
    ).toBe('3/7, zostało 4');
  });

  test('darmowy poziom bez pozostałych dni: tekst limitu', () => {
    const templates = {
      freeDaysStatus: 'stan',
      limitReachedStatus: 'LIMIT {used}/{limit}',
    };
    expect(
      describeFreeDays(
        { isPro: false, monthDaysUsed: 7, remainingDays: 0, freeDaysPerMonth: 7 },
        templates
      )
    ).toBe('LIMIT 7/7');
  });
});

describe('uprawnienia sklepu (Entitlement)', () => {
  test('Pro = co najmniej jedno aktywne uprawnienie', () => {
    expect(hasProEntitlement([])).toBe(false);
    expect(hasProEntitlement([{ productId: 'p', plan: 'monthly' }])).toBe(true);
    expect(hasProEntitlement([{ productId: 'a', plan: 'yearly' }, { productId: 'b', plan: 'lifetime' }])).toBe(true);
  });
});
