// ============================================================================
// Napar (Steepwise) — Unit Tests: model stanu zegarka i sterowanie z zegarka (poz. 22 MVP)
// ============================================================================

import {
  buildWatchState,
  createWatchSyncController,
  decideWatchCommand,
  decideWatchSend,
  parseWatchCommand,
  serializeWatchState,
  toWatchPayload,
  watchLanguage,
  WATCH_PAYLOAD_VERSION,
  WatchCommandKind,
  WatchLanguage,
  WatchSendCommand,
  WatchState,
  WatchTimerInput,
  WatchTransport,
} from '../watch-state';
import { BrewTimerEngine, TimerSnapshot } from '../timer-engine';
import { RecipeStep } from '../recipes-data';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Medium: 'medium', Light: 'light' },
  NotificationFeedbackType: { Success: 'success' },
}));

jest.mock('expo-keep-awake', () => ({
  activateKeepAwakeAsync: jest.fn(),
  deactivateKeepAwake: jest.fn(),
}));

const NOW = 1_700_000_000_000;

const timerInput = (overrides: Partial<WatchTimerInput> = {}): WatchTimerInput => ({
  status: 'running',
  currentStepIndex: 1,
  totalSteps: 4,
  currentStep: { namePl: 'Główne zalanie', nameEn: 'Main pour' },
  stepRemainingSeconds: 30,
  stepEndAtMs: NOW + 30_000,
  ...overrides,
});

const brewing = (overrides: Partial<WatchState> = {}): WatchState => ({
  phase: 'brewing',
  stepName: 'Główne zalanie',
  endAtMs: NOW + 30_000,
  pausedRemainingMs: 0,
  pourIndex: 2,
  pourTotal: 4,
  language: 'pl',
  ...overrides,
});

describe('język zegarka', () => {
  test('angielski zostaje angielskim, każdy inny język daje polski', () => {
    const english: WatchLanguage = watchLanguage('en');
    expect(english).toBe('en');
    expect(watchLanguage('pl')).toBe('pl');
    expect(watchLanguage('de')).toBe('pl');
  });
});

describe('buildWatchState: mapowanie stanu stopera', () => {
  test('bezczynny stoper nie ma stanu do pokazania', () => {
    expect(buildWatchState(timerInput({ status: 'idle' }), NOW, 'pl')).toBeNull();
  });

  test('brak etapu nie ma stanu do pokazania', () => {
    expect(buildWatchState(timerInput({ currentStep: null }), NOW, 'pl')).toBeNull();
  });

  test('parzenie: koniec etapu z silnika, numer zalania od 1, nazwa w języku aplikacji', () => {
    expect(buildWatchState(timerInput(), NOW, 'pl')).toEqual({
      phase: 'brewing',
      stepName: 'Główne zalanie',
      endAtMs: NOW + 30_000,
      pausedRemainingMs: 0,
      pourIndex: 2,
      pourTotal: 4,
      language: 'pl',
    });
    expect(buildWatchState(timerInput(), NOW, 'en')?.stepName).toBe('Main pour');
  });

  test('bez nazwy angielskiej zostaje polska', () => {
    const input = timerInput({ currentStep: { namePl: 'Zalanie', nameEn: '' } });
    expect(buildWatchState(input, NOW, 'en')?.stepName).toBe('Zalanie');
  });

  test('brak końca etapu w silniku: koniec wyliczony z pozostałego czasu', () => {
    const state = buildWatchState(timerInput({ stepEndAtMs: null, stepRemainingSeconds: 12.34 }), NOW, 'pl');
    expect(state?.endAtMs).toBe(NOW + 12_340);
  });

  test('pauza: stały pozostały czas, koniec etapu wyzerowany', () => {
    const state = buildWatchState(
      timerInput({ status: 'paused', stepRemainingSeconds: 17.2, stepEndAtMs: null }),
      NOW,
      'pl'
    );
    expect(state).toMatchObject({ phase: 'paused', endAtMs: 0, pausedRemainingMs: 17200 });
  });

  test('pauza z ujemnym pozostałym czasem nie pokazuje wartości ujemnej', () => {
    const state = buildWatchState(timerInput({ status: 'paused', stepRemainingSeconds: -1 }), NOW, 'pl');
    expect(state?.pausedRemainingMs).toBe(0);
  });

  test('koniec parzenia: faza finished z ostatnim etapem', () => {
    const state = buildWatchState(
      timerInput({ status: 'finished', currentStepIndex: 3, stepEndAtMs: null, stepRemainingSeconds: 0 }),
      NOW,
      'pl'
    );
    expect(state).toEqual({
      phase: 'finished',
      stepName: 'Główne zalanie',
      endAtMs: 0,
      pausedRemainingMs: 0,
      pourIndex: 4,
      pourTotal: 4,
      language: 'pl',
    });
  });
});

describe('serializacja do wiadomości', () => {
  test('payload ma stałe klucze w stałej kolejności i wersję formatu', () => {
    const payload = toWatchPayload(brewing());
    expect(Object.keys(payload)).toEqual([
      'v',
      'phase',
      'stepName',
      'endAtMs',
      'pausedRemainingMs',
      'pourIndex',
      'pourTotal',
      'language',
    ]);
    expect(payload.v).toBe(WATCH_PAYLOAD_VERSION);
    expect(WATCH_PAYLOAD_VERSION).toBe(1);
    expect(payload.phase).toBe('brewing');
  });

  test('identyczne stany mają identyczny klucz, różne stany różny', () => {
    expect(serializeWatchState(brewing())).toBe(serializeWatchState(brewing()));
    expect(serializeWatchState(brewing())).not.toBe(serializeWatchState(brewing({ pourIndex: 3 })));
  });
});

describe('decideWatchSend: wysyłka tylko przy zmianie stanu', () => {
  test('bezczynny stoper przy pierwszym sprawdzeniu czyści zegarek (stary stan z poprzedniego uruchomienia)', () => {
    const first: WatchSendCommand = decideWatchSend(undefined, null);
    expect(first).toEqual({ kind: 'clear' });
  });

  test('bezczynny stoper po wyczyszczeniu nic nie wysyła', () => {
    expect(decideWatchSend(null, null)).toEqual({ kind: 'none' });
  });

  test('bezczynny stoper po stanie czyści zegarek', () => {
    expect(decideWatchSend(serializeWatchState(brewing()), null)).toEqual({ kind: 'clear' });
  });

  test('nowy stan jest wysyłany z kluczem i ładunkiem', () => {
    const state = brewing();
    expect(decideWatchSend(undefined, state)).toEqual({
      kind: 'send',
      key: serializeWatchState(state),
      payload: toWatchPayload(state),
    });
  });

  test('ten sam stan nie jest wysyłany ponownie', () => {
    expect(decideWatchSend(serializeWatchState(brewing()), brewing())).toEqual({ kind: 'none' });
  });

  test('zmiana etapu, pauza i koniec są wysyłane', () => {
    const last = serializeWatchState(brewing());
    expect(decideWatchSend(last, brewing({ pourIndex: 3 })).kind).toBe('send');
    expect(decideWatchSend(last, brewing({ phase: 'paused', endAtMs: 0, pausedRemainingMs: 9000 })).kind).toBe('send');
    expect(decideWatchSend(last, brewing({ phase: 'finished', endAtMs: 0 })).kind).toBe('send');
  });
});

describe('sekwencja zmian z silnika stopera (bez wysyłki co sekundę)', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  const steps: RecipeStep[] = [
    { stepNumber: 1, namePl: 'Preinfuzja', nameEn: 'Bloom', targetWaterGrams: 40, durationSeconds: 30, instructionPl: '' },
    { stepNumber: 2, namePl: 'Zalanie', nameEn: 'Pour', targetWaterGrams: 200, durationSeconds: 45, instructionPl: '' },
  ];

  test('od startu do końca parzenia: start, zmiana etapu, pauza, wznowienie, koniec, czyszczenie', () => {
    let snap: TimerSnapshot | null = null;
    const engine = new BrewTimerEngine(steps, { onTick: (s) => (snap = s) });
    const sent: string[] = [];
    let last: string | null | undefined = undefined;

    const observe = () => {
      const current = buildWatchState(snap ?? engine.getSnapshot(), Date.now(), 'pl');
      const command = decideWatchSend(last, current);
      if (command.kind === 'send') {
        last = command.key;
        sent.push(command.payload.phase + ':' + command.payload.pourIndex);
      } else if (command.kind === 'clear') {
        last = null;
        sent.push('clear');
      }
    };

    engine.start();
    observe();
    for (let i = 0; i < 40; i++) {
      jest.advanceTimersByTime(1000);
      observe();
    }
    engine.pause();
    observe();
    jest.advanceTimersByTime(5000);
    observe();
    engine.resume();
    observe();
    engine.nextStep();
    observe();
    engine.finish();
    observe();
    engine.reset();
    observe();

    expect(sent).toEqual([
      'brewing:1',
      'brewing:2',
      'paused:2',
      'brewing:2',
      'finished:2',
      'clear',
    ]);
  });

  test('podczas biegu ticki sekundowe nie zmieniają klucza stanu', () => {
    let snap: TimerSnapshot | null = null;
    const engine = new BrewTimerEngine(steps, { onTick: (s) => (snap = s) });
    engine.start();
    const first = decideWatchSend(undefined, buildWatchState(engine.getSnapshot(), Date.now(), 'pl'));
    expect(first.kind).toBe('send');
    const key = first.kind === 'send' ? first.key : null;
    let sendsAfterStart = 0;
    for (let i = 0; i < 20; i++) {
      jest.advanceTimersByTime(1000);
      const state = buildWatchState(snap ?? engine.getSnapshot(), Date.now(), 'pl');
      if (decideWatchSend(key, state).kind !== 'none') sendsAfterStart++;
    }
    expect(sendsAfterStart).toBe(0);
    engine.destroy();
  });
});

describe('polecenia z zegarka', () => {
  test('parseWatchCommand przyjmuje tylko znane polecenia', () => {
    expect(parseWatchCommand({ cmd: 'pause' })).toBe('pause');
    expect(parseWatchCommand({ cmd: 'resume' })).toBe('resume');
    expect(parseWatchCommand({ cmd: 'next' })).toBe('next');
    expect(parseWatchCommand({ cmd: 'reset' })).toBeNull();
    expect(parseWatchCommand({})).toBeNull();
    expect(parseWatchCommand(null)).toBeNull();
    expect(parseWatchCommand('pause')).toBeNull();
  });

  test('każde polecenie ma regułę dla każdego statusu (brak wyjątków)', () => {
    const commands: WatchCommandKind[] = ['pause', 'resume', 'next'];
    for (const cmd of commands) {
      for (const status of ['idle', 'running', 'paused', 'finished'] as const) {
        expect(['pause', 'resume', 'next', null]).toContain(decideWatchCommand(cmd, status));
      }
    }
  });

  test('pauza tylko podczas parzenia, wznowienie tylko w pauzie', () => {
    expect(decideWatchCommand('pause', 'running')).toBe('pause');
    expect(decideWatchCommand('pause', 'paused')).toBeNull();
    expect(decideWatchCommand('pause', 'idle')).toBeNull();
    expect(decideWatchCommand('resume', 'paused')).toBe('resume');
    expect(decideWatchCommand('resume', 'running')).toBeNull();
    expect(decideWatchCommand('resume', 'finished')).toBeNull();
  });

  test('dalej tylko podczas parzenia (w pauzie silnik zostawiłby czas poprzedniego etapu)', () => {
    expect(decideWatchCommand('next', 'running')).toBe('next');
    expect(decideWatchCommand('next', 'paused')).toBeNull();
    expect(decideWatchCommand('next', 'finished')).toBeNull();
    expect(decideWatchCommand('next', 'idle')).toBeNull();
  });
});

describe('createWatchSyncController: kolejka wysyłek i odporność na błędy mostu', () => {
  const makeTransport = (): { sendState: jest.Mock; clearState: jest.Mock } => ({
    sendState: jest.fn(async () => true),
    clearState: jest.fn(async () => true),
  });

  test('wysyła stan, a przy tym samym stanie nie wywołuje mostu ponownie', async () => {
    const transport = makeTransport();
    const controller = createWatchSyncController(transport);
    await controller.sync(brewing());
    await controller.sync(brewing());
    await controller.sync(brewing({ pourIndex: 3 }));
    expect(transport.sendState).toHaveBeenCalledTimes(2);
    expect(transport.sendState).toHaveBeenLastCalledWith(toWatchPayload(brewing({ pourIndex: 3 })));
  });

  test('czyszczenie idzie przez clearState i jest wykonane raz', async () => {
    const transport = makeTransport();
    const controller = createWatchSyncController(transport);
    await controller.sync(null);
    await controller.sync(null);
    expect(transport.clearState).toHaveBeenCalledTimes(1);
    expect(transport.sendState).not.toHaveBeenCalled();
  });

  test('wywołania są w kolejności zleceń (stan, czyszczenie, stan)', async () => {
    const order: string[] = [];
    const transport: WatchTransport = {
      sendState: jest.fn(async () => {
        order.push('send');
        return true;
      }),
      clearState: jest.fn(async () => {
        order.push('clear');
        return true;
      }),
    };
    const controller = createWatchSyncController(transport);
    void controller.sync(brewing());
    void controller.sync(null);
    await controller.sync(brewing());
    expect(order).toEqual(['send', 'clear', 'send']);
  });

  test('błąd mostu nie przerywa kolejki ani nie rzuca wyjątku', async () => {
    const transport: WatchTransport = {
      sendState: jest.fn(async () => {
        throw new Error('WCSession');
      }),
      clearState: jest.fn(async () => true),
    };
    const controller = createWatchSyncController(transport);
    await expect(controller.sync(brewing())).resolves.toBeUndefined();
    await expect(controller.sync(null)).resolves.toBeUndefined();
    expect(transport.clearState).toHaveBeenCalledTimes(1);
  });
});
