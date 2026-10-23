// ============================================================================
// Napar (Steepwise) — Unit Tests: WatchSync (stoper -> zegarek i polecenia z zegarka)
// Natywny most i kontekst parzenia są atrapami: test sprawdza wywołania i obsługę poleceń.
// ============================================================================

import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { useBrew } from '../../core/brew-context';
import { useTranslation } from '../../core/i18n';
import { TimerSnapshot } from '../../core/timer-engine';
import {
  activateWatchLink,
  clearWatchState,
  sendWatchState,
  subscribeWatchCommands,
} from '../../../modules/napar-watch-link';
import { WatchSync } from '../watch-sync';

jest.mock('../../core/brew-context', () => ({ useBrew: jest.fn() }));
jest.mock('../../core/i18n', () => ({ useTranslation: jest.fn() }));
jest.mock('../../../modules/napar-watch-link', () => ({
  activateWatchLink: jest.fn(async () => true),
  sendWatchState: jest.fn(async () => true),
  clearWatchState: jest.fn(async () => true),
  subscribeWatchCommands: jest.fn(() => jest.fn()),
}));

const baseSnapshot: TimerSnapshot = {
  status: 'running',
  currentStepIndex: 1,
  currentStep: { stepNumber: 2, namePl: 'Główne zalanie', nameEn: 'Main pour', targetWaterGrams: 150, durationSeconds: 45, instructionPl: '' },
  totalSteps: 4,
  stepElapsedSeconds: 15,
  stepRemainingSeconds: 30,
  stepProgress: 0.33,
  totalElapsedSeconds: 60,
  currentWaterGrams: 80,
  previousWaterGrams: 50,
  targetWaterGrams: 150,
  recommendedPourRate: 3,
  isLastStep: false,
  stepEndAtMs: 1_700_000_030_000,
};

type Actions = { pauseTimer: jest.Mock; resumeTimer: jest.Mock; nextStep: jest.Mock };

let actions: Actions;

function setBrew(snapshot: TimerSnapshot) {
  (useBrew as jest.Mock).mockReturnValue({ snapshot, ...actions });
}

function setLanguage(language: string) {
  (useTranslation as jest.Mock).mockReturnValue({ language });
}

/** Zwraca ostatnio zarejestrowany nasłuch poleceń z zegarka. */
function commandListener(): (event: unknown) => void {
  const calls = (subscribeWatchCommands as jest.Mock).mock.calls;
  return calls[calls.length - 1][0];
}

async function render(snapshot: TimerSnapshot, language = 'pl') {
  setBrew(snapshot);
  setLanguage(language);
  let renderer!: TestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = TestRenderer.create(<WatchSync />);
  });
  return renderer;
}

describe('WatchSync (stoper -> zegarek)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    actions = { pauseTimer: jest.fn(), resumeTimer: jest.fn(), nextStep: jest.fn() };
    (subscribeWatchCommands as jest.Mock).mockImplementation(() => jest.fn());
  });

  test('po montażu aktywuje most i nasłuch poleceń', async () => {
    await render(baseSnapshot);
    expect(activateWatchLink).toHaveBeenCalledTimes(1);
    expect(subscribeWatchCommands).toHaveBeenCalledTimes(1);
  });

  test('przy starcie wysyła stan parzenia z nazwą etapu w języku aplikacji', async () => {
    await render(baseSnapshot, 'en');
    expect(sendWatchState).toHaveBeenCalledWith(
      expect.objectContaining({
        v: 1,
        phase: 'brewing',
        stepName: 'Main pour',
        endAtMs: 1_700_000_030_000,
        pourIndex: 2,
        pourTotal: 4,
        language: 'en',
      })
    );
  });

  test('bezczynny stoper czyści stan na zegarku (nie wysyła stanu)', async () => {
    await render({ ...baseSnapshot, status: 'idle', currentStep: null });
    expect(clearWatchState).toHaveBeenCalledTimes(1);
    expect(sendWatchState).not.toHaveBeenCalled();
  });

  test('zmiana stanu stopera wysyła kolejny stan; ten sam stan już nie', async () => {
    const renderer = await render(baseSnapshot);
    expect(sendWatchState).toHaveBeenCalledTimes(1);

    await act(async () => {
      renderer.update(<WatchSync />);
    });
    expect(sendWatchState).toHaveBeenCalledTimes(1);

    setBrew({ ...baseSnapshot, status: 'paused', stepEndAtMs: null });
    await act(async () => {
      renderer.update(<WatchSync />);
    });
    expect(sendWatchState).toHaveBeenCalledTimes(2);
    expect(sendWatchState).toHaveBeenLastCalledWith(expect.objectContaining({ phase: 'paused' }));
  });

  test('zmiana języka aplikacji wysyła stan ponownie', async () => {
    const renderer = await render(baseSnapshot, 'pl');
    setLanguage('en');
    await act(async () => {
      renderer.update(<WatchSync />);
    });
    expect(sendWatchState).toHaveBeenLastCalledWith(expect.objectContaining({ language: 'en' }));
  });

  test('odmontowanie wyrejestrowuje nasłuch poleceń', async () => {
    const unsubscribe = jest.fn();
    (subscribeWatchCommands as jest.Mock).mockImplementation(() => unsubscribe);
    const renderer = await render(baseSnapshot);
    act(() => renderer.unmount());
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });
});

describe('WatchSync (polecenia z zegarka)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    actions = { pauseTimer: jest.fn(), resumeTimer: jest.fn(), nextStep: jest.fn() };
    (subscribeWatchCommands as jest.Mock).mockImplementation(() => jest.fn());
  });

  test('pauza z zegarka wstrzymuje parzenie', async () => {
    await render(baseSnapshot);
    commandListener()({ cmd: 'pause' });
    expect(actions.pauseTimer).toHaveBeenCalledTimes(1);
    expect(actions.resumeTimer).not.toHaveBeenCalled();
    expect(actions.nextStep).not.toHaveBeenCalled();
  });

  test('dalej z zegarka przechodzi do kolejnego etapu', async () => {
    await render(baseSnapshot);
    commandListener()({ cmd: 'next' });
    expect(actions.nextStep).toHaveBeenCalledTimes(1);
  });

  test('wznowienie z zegarka działa tylko w pauzie', async () => {
    const renderer = await render({ ...baseSnapshot, status: 'paused', stepEndAtMs: null });
    commandListener()({ cmd: 'resume' });
    expect(actions.resumeTimer).toHaveBeenCalledTimes(1);

    setBrew(baseSnapshot);
    await act(async () => {
      renderer.update(<WatchSync />);
    });
    commandListener()({ cmd: 'resume' });
    expect(actions.resumeTimer).toHaveBeenCalledTimes(1);
  });

  test('polecenie z zegarka działa na bieżącym stanie, nie na tym sprzed chwili', async () => {
    const renderer = await render(baseSnapshot);
    const listener = commandListener();
    setBrew({ ...baseSnapshot, status: 'paused', stepEndAtMs: null });
    await act(async () => {
      renderer.update(<WatchSync />);
    });
    listener({ cmd: 'pause' });
    expect(actions.pauseTimer).not.toHaveBeenCalled();
    listener({ cmd: 'next' });
    expect(actions.nextStep).not.toHaveBeenCalled();
  });

  test('nieznane lub zniekształcone polecenie jest ignorowane', async () => {
    await render(baseSnapshot);
    const listener = commandListener();
    listener({ cmd: 'reset' });
    listener({});
    listener(null);
    listener('pause');
    expect(actions.pauseTimer).not.toHaveBeenCalled();
    expect(actions.resumeTimer).not.toHaveBeenCalled();
    expect(actions.nextStep).not.toHaveBeenCalled();
  });
});
