// ============================================================================
// Napar (Steepwise) — Unit Tests: Live Activity (model stanu, serializacja, przejścia)
// Czysta logika: bez React i bez natywnego mostu (most jest wstrzykiwany jako atrapa).
// ============================================================================

import {
  buildLiveActivityContentState,
  createLiveActivityController,
  decideLiveActivityCommand,
  liveActivityLanguage,
  serializeLiveActivityState,
  LiveActivityAttributes,
  LiveActivityBridge,
  LiveActivityCommand,
  LiveActivityContentState,
  LiveActivityLanguage,
  LiveBeverageType,
  LiveTimerInput,
} from '../live-activity';

const beverage: LiveBeverageType = 'COFFEE';
const polish: LiveActivityLanguage = 'pl';

const attributes: LiveActivityAttributes = {
  recipeName: 'V60 Single Pour',
  beverageType: beverage,
  language: polish,
};

const pourState = (overrides: Partial<LiveActivityContentState> = {}): LiveActivityContentState => ({
  stepName: 'Główne zalanie',
  endAtMs: 1_700_000_045_000,
  pourIndex: 2,
  pourTotal: 4,
  isPaused: false,
  pausedRemainingMs: 0,
  ...overrides,
});

const runningTimer: LiveTimerInput = {
  status: 'running',
  currentStepIndex: 1,
  totalSteps: 4,
  currentStep: { namePl: 'Główne zalanie', nameEn: 'Main pour' },
  stepRemainingSeconds: 45,
  stepEndAtMs: 1_700_000_045_000,
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

describe('liveActivityLanguage', () => {
  test('mapuje angielski na en, a każdy inny język na pl (PL/EN jak w etapie 3)', () => {
    const english: LiveActivityLanguage = liveActivityLanguage('en');
    expect(english).toBe('en');
    expect(liveActivityLanguage('pl')).toBe('pl');
    expect(liveActivityLanguage('de')).toBe('pl');
  });
});

describe('buildLiveActivityContentState: mapowanie stanu stopera', () => {
  test('bezczynny, zakończony timer lub brak etapu nie tworzy stanu (aktywność się kończy)', () => {
    expect(buildLiveActivityContentState({ ...runningTimer, status: 'idle' }, 0, 'pl')).toBeNull();
    expect(buildLiveActivityContentState({ ...runningTimer, status: 'finished' }, 0, 'pl')).toBeNull();
    expect(buildLiveActivityContentState({ ...runningTimer, currentStep: null }, 0, 'pl')).toBeNull();
  });

  test('bieg: koniec etapu z silnika, numer zalania od 1, nazwa w języku polskim', () => {
    expect(buildLiveActivityContentState(runningTimer, 1_700_000_000_000, 'pl')).toEqual({
      stepName: 'Główne zalanie',
      endAtMs: 1_700_000_045_000,
      pourIndex: 2,
      pourTotal: 4,
      isPaused: false,
      pausedRemainingMs: 0,
    });
  });

  test('bieg w języku angielskim używa nameEn, a przy braku nameEn wraca do nazwy polskiej', () => {
    expect(buildLiveActivityContentState(runningTimer, 0, 'en')?.stepName).toBe('Main pour');
    const noEnglish: LiveTimerInput = { ...runningTimer, currentStep: { namePl: 'Preinfuzja' } };
    expect(buildLiveActivityContentState(noEnglish, 0, 'en')?.stepName).toBe('Preinfuzja');
  });

  test('bez końca etapu z silnika koniec wylicza się z chwili i pozostałego czasu', () => {
    const timer: LiveTimerInput = { ...runningTimer, stepEndAtMs: null, stepRemainingSeconds: 12.3456 };
    expect(buildLiveActivityContentState(timer, 1_000_000, 'pl')?.endAtMs).toBe(1_012_346);
  });

  test('pauza: endAtMs = 0 (stała wartość), pozostały czas w milisekundach, bez biegu', () => {
    const paused: LiveTimerInput = { ...runningTimer, status: 'paused', stepRemainingSeconds: 20 };
    expect(buildLiveActivityContentState(paused, 999, 'pl')).toEqual({
      stepName: 'Główne zalanie',
      endAtMs: 0,
      pourIndex: 2,
      pourTotal: 4,
      isPaused: true,
      pausedRemainingMs: 20_000,
    });
  });

  test('pauza nie zależy od chwili odczytu, więc kolejne ticki dają ten sam stan', () => {
    const paused: LiveTimerInput = { ...runningTimer, status: 'paused', stepRemainingSeconds: 20 };
    const first = buildLiveActivityContentState(paused, 1_000, 'pl');
    const later = buildLiveActivityContentState(paused, 5_000_000, 'pl');
    expect(serializeLiveActivityState(later!)).toBe(serializeLiveActivityState(first!));
  });

  test('ujemny pozostały czas w pauzie jest obcinany do zera', () => {
    const paused: LiveTimerInput = { ...runningTimer, status: 'paused', stepRemainingSeconds: -0.5 };
    expect(buildLiveActivityContentState(paused, 0, 'pl')?.pausedRemainingMs).toBe(0);
  });

  test('wartości ułamkowe końca etapu zaokrąglane są do pełnych milisekund', () => {
    const timer: LiveTimerInput = { ...runningTimer, stepEndAtMs: 1000.4 };
    expect(buildLiveActivityContentState(timer, 0, 'pl')?.endAtMs).toBe(1000);
  });
});

describe('serializeLiveActivityState', () => {
  test('zawiera wszystkie pola stanu w stałej kolejności', () => {
    const raw = serializeLiveActivityState(pourState());
    expect(Object.keys(JSON.parse(raw))).toEqual([
      'stepName',
      'endAtMs',
      'pourIndex',
      'pourTotal',
      'isPaused',
      'pausedRemainingMs',
    ]);
    expect(JSON.parse(raw)).toEqual(pourState());
  });

  test('ten sam stan daje ten sam ciąg, a różny stan inny ciąg', () => {
    expect(serializeLiveActivityState(pourState())).toBe(serializeLiveActivityState(pourState()));
    expect(serializeLiveActivityState(pourState())).not.toBe(
      serializeLiveActivityState(pourState({ pourIndex: 3 }))
    );
    expect(serializeLiveActivityState(pourState())).not.toBe(
      serializeLiveActivityState(pourState({ isPaused: true }))
    );
  });
});

describe('decideLiveActivityCommand: przejścia', () => {
  test('brak aktywności i brak stanu: nic nie robimy', () => {
    const command: LiveActivityCommand = decideLiveActivityCommand(null, null);
    expect(command).toEqual({ kind: 'none' });
  });

  test('aktywność istnieje, a stan zniknął (koniec parzenia lub reset): koniec', () => {
    expect(decideLiveActivityCommand('klucz', null)).toEqual({ kind: 'end' });
  });

  test('brak aktywności, pojawia się stan: start z kluczem i treścią', () => {
    const state = pourState();
    expect(decideLiveActivityCommand(null, state)).toEqual({
      kind: 'start',
      key: serializeLiveActivityState(state),
      content: state,
    });
  });

  test('ten sam stan co ostatnio zlecony: nic (tick bez zmian)', () => {
    const state = pourState();
    expect(decideLiveActivityCommand(serializeLiveActivityState(state), state)).toEqual({ kind: 'none' });
  });

  test('zmieniony stan przy istniejącej aktywności: aktualizacja', () => {
    const state = pourState({ pourIndex: 3 });
    expect(decideLiveActivityCommand('inny-klucz', state)).toEqual({
      kind: 'update',
      key: serializeLiveActivityState(state),
      content: state,
    });
  });
});

describe('createLiveActivityController: kolejka wywołań mostu', () => {
  function fakeBridge(overrides: Partial<LiveActivityBridge> = {}) {
    const bridge: LiveActivityBridge = {
      start: jest.fn(async () => 'act-1'),
      update: jest.fn(async () => true),
      end: jest.fn(async () => true),
      ...overrides,
    };
    return bridge;
  }

  test('pełny cykl start, pauza, wznowienie, koniec: wywołania w tej kolejności', async () => {
    const bridge = fakeBridge();
    const controller = createLiveActivityController(bridge);

    await controller.sync(pourState(), attributes);
    expect(bridge.start).toHaveBeenCalledWith(attributes, pourState());

    await controller.sync(pourState({ isPaused: true, endAtMs: 0, pausedRemainingMs: 30_000 }), attributes);
    expect(bridge.update).toHaveBeenLastCalledWith('act-1', pourState({ isPaused: true, endAtMs: 0, pausedRemainingMs: 30_000 }));

    await controller.sync(pourState({ endAtMs: 1_700_000_090_000 }), attributes);
    expect(bridge.update).toHaveBeenCalledTimes(2);

    await controller.sync(null, attributes);
    expect(bridge.end).toHaveBeenCalledWith('act-1');
    expect(bridge.start).toHaveBeenCalledTimes(1);
  });

  test('ten sam stan wielokrotnie nie generuje kolejnych wywołań', async () => {
    const bridge = fakeBridge();
    const controller = createLiveActivityController(bridge);
    await controller.sync(pourState(), attributes);
    await controller.sync(pourState(), attributes);
    await controller.sync(pourState(), attributes);
    expect(bridge.start).toHaveBeenCalledTimes(1);
    expect(bridge.update).not.toHaveBeenCalled();
  });

  test('bezczynny timer od początku: brak jakichkolwiek wywołań', async () => {
    const bridge = fakeBridge();
    const controller = createLiveActivityController(bridge);
    await controller.sync(null, attributes);
    expect(bridge.start).not.toHaveBeenCalled();
    expect(bridge.end).not.toHaveBeenCalled();
  });

  test('gdy start nie powstał (null), aktualizacje i koniec są pomijane', async () => {
    const bridge = fakeBridge({ start: jest.fn(async () => null) });
    const controller = createLiveActivityController(bridge);
    await controller.sync(pourState(), attributes);
    await controller.sync(pourState({ pourIndex: 3 }), attributes);
    await controller.sync(null, attributes);
    expect(bridge.start).toHaveBeenCalledTimes(1);
    expect(bridge.update).not.toHaveBeenCalled();
    expect(bridge.end).not.toHaveBeenCalled();
  });

  test('wyjątek mostu przy starcie nie przerywa kolejki i nie ponawia startu w tym samym stanie', async () => {
    const bridge = fakeBridge({ start: jest.fn(async () => Promise.reject(new Error('native'))) });
    const controller = createLiveActivityController(bridge);
    await expect(controller.sync(pourState(), attributes)).resolves.toBeUndefined();
    await controller.sync(pourState(), attributes);
    expect(bridge.start).toHaveBeenCalledTimes(1);
  });

  test('wyjątek przy aktualizacji nie blokuje późniejszego końca aktywności', async () => {
    const bridge = fakeBridge({ update: jest.fn(async () => Promise.reject(new Error('update'))) });
    const controller = createLiveActivityController(bridge);
    await controller.sync(pourState(), attributes);
    await controller.sync(pourState({ pourIndex: 3 }), attributes);
    await controller.sync(null, attributes);
    expect(bridge.end).toHaveBeenCalledWith('act-1');
  });

  test('wyjątek przy końcu nie psuje kolejki kolejnych sesji', async () => {
    const bridge = fakeBridge({
      end: jest.fn(async () => Promise.reject(new Error('end'))),
    });
    const controller = createLiveActivityController(bridge);
    await controller.sync(pourState(), attributes);
    await controller.sync(null, attributes);
    await controller.sync(pourState(), attributes);
    expect(bridge.start).toHaveBeenCalledTimes(2);
  });

  test('aktualizacja czeka na zakończenie startu, nawet gdy zleca ją drugi tick', async () => {
    const started = deferred<string | null>();
    const bridge = fakeBridge({ start: jest.fn(() => started.promise) });
    const controller = createLiveActivityController(bridge);

    const startDone = controller.sync(pourState(), attributes);
    const updateDone = controller.sync(pourState({ pourIndex: 3 }), attributes);
    expect(bridge.update).not.toHaveBeenCalled();

    started.resolve('act-late');
    await Promise.all([startDone, updateDone]);
    expect(bridge.update).toHaveBeenCalledWith('act-late', pourState({ pourIndex: 3 }));
  });

  test('koniec przed zakończeniem startu kończy właśnie utworzoną aktywność', async () => {
    const started = deferred<string | null>();
    const bridge = fakeBridge({ start: jest.fn(() => started.promise) });
    const controller = createLiveActivityController(bridge);

    const startDone = controller.sync(pourState(), attributes);
    const endDone = controller.sync(null, attributes);
    started.resolve('act-fast');
    await Promise.all([startDone, endDone]);
    expect(bridge.end).toHaveBeenCalledWith('act-fast');
  });

  test('nowa sesja po zakończeniu tworzy nową aktywność z nowym identyfikatorem', async () => {
    const start = jest.fn().mockResolvedValueOnce('act-1').mockResolvedValueOnce('act-2');
    const bridge = fakeBridge({ start });
    const controller = createLiveActivityController(bridge);

    await controller.sync(pourState(), attributes);
    await controller.sync(null, attributes);
    await controller.sync(pourState({ pourIndex: 1 }), attributes);
    await controller.sync(pourState({ pourIndex: 2 }), attributes);

    expect(start).toHaveBeenCalledTimes(2);
    expect(bridge.end).toHaveBeenCalledWith('act-1');
    expect(bridge.update).toHaveBeenCalledWith('act-2', pourState({ pourIndex: 2 }));
  });
});
