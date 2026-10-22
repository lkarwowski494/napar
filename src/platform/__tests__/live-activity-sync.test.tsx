// ============================================================================
// Napar (Steepwise) — Unit Tests: LiveActivitySync (stoper -> Live Activity)
// Natywny most i kontekst parzenia są atrapami: test sprawdza tylko wywołania.
// ============================================================================

import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { useBrew } from '../../core/brew-context';
import { useTranslation } from '../../core/i18n';
import { MASTER_RECIPES } from '../../core/recipes-data';
import { TimerSnapshot } from '../../core/timer-engine';
import {
  endAllLiveActivities,
  endLiveActivity,
  startLiveActivity,
  updateLiveActivity,
} from '../../../modules/napar-live-activity';
import { LiveActivitySync } from '../live-activity-sync';

jest.mock('../../core/brew-context', () => ({ useBrew: jest.fn() }));
jest.mock('../../core/i18n', () => ({ useTranslation: jest.fn() }));
jest.mock('../../../modules/napar-live-activity', () => ({
  startLiveActivity: jest.fn(async () => 'act-1'),
  updateLiveActivity: jest.fn(async () => true),
  endLiveActivity: jest.fn(async () => true),
  endAllLiveActivities: jest.fn(async () => true),
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

const snapshotOf = (overrides: Partial<TimerSnapshot>): TimerSnapshot => ({ ...baseSnapshot, ...overrides });

const coffeeRecipe = MASTER_RECIPES.find((r) => r.type === 'COFFEE') ?? MASTER_RECIPES[0];

function setBrew(snapshot: TimerSnapshot, recipe: object = coffeeRecipe) {
  (useBrew as jest.Mock).mockReturnValue({ snapshot, recipe });
}

async function render(snapshot: TimerSnapshot, recipe?: object) {
  setBrew(snapshot, recipe);
  let renderer!: TestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = TestRenderer.create(<LiveActivitySync />);
  });
  return renderer;
}

async function rerender(renderer: TestRenderer.ReactTestRenderer, snapshot: TimerSnapshot, recipe?: object) {
  setBrew(snapshot, recipe);
  await act(async () => {
    renderer.update(<LiveActivitySync />);
  });
}

describe('LiveActivitySync: podłączenie stopera do Live Activity', () => {
  let nowSpy: jest.SpyInstance<number, []>;

  beforeEach(() => {
    jest.clearAllMocks();
    nowSpy = jest.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000);
    (useTranslation as jest.Mock).mockReturnValue({ language: 'pl' });
  });

  afterEach(() => {
    nowSpy.mockRestore();
  });

  test('przy montażu sprząta aktywności po poprzednim uruchomieniu aplikacji', async () => {
    await render(snapshotOf({ status: 'idle', currentStep: null, stepEndAtMs: null }));
    expect(endAllLiveActivities).toHaveBeenCalledTimes(1);
    expect(startLiveActivity).not.toHaveBeenCalled();
  });

  test('start parzenia w języku polskim przekazuje przepis, typ napoju i stan etapu', async () => {
    await render(snapshotOf({}));
    expect(startLiveActivity).toHaveBeenCalledWith({
      recipeName: coffeeRecipe.name,
      beverageType: 'COFFEE',
      language: 'pl',
      stepName: 'Główne zalanie',
      endAtMs: 1_700_000_030_000,
      pourIndex: 2,
      pourTotal: 4,
      isPaused: false,
      pausedRemainingMs: 0,
    });
  });

  test('w języku angielskim nazwa etapu i język widżetu są angielskie', async () => {
    (useTranslation as jest.Mock).mockReturnValue({ language: 'en' });
    await render(snapshotOf({}));
    expect(startLiveActivity).toHaveBeenCalledWith(
      expect.objectContaining({ language: 'en', stepName: 'Main pour' })
    );
  });

  test('zapisany przepis podaje typ napoju z własnego pola beverageType', async () => {
    const saved = { ...coffeeRecipe, beverageType: 'TEA', name: 'Gongfu' };
    await render(snapshotOf({}), saved);
    expect(startLiveActivity).toHaveBeenCalledWith(
      expect.objectContaining({ recipeName: 'Gongfu', beverageType: 'TEA' })
    );
  });

  test('pauza aktualizuje aktywność, a kolejne ticki bez zmian nie wysyłają nic', async () => {
    const renderer = await render(snapshotOf({}));
    await rerender(renderer, snapshotOf({ status: 'paused', stepEndAtMs: null, stepRemainingSeconds: 30 }));
    expect(updateLiveActivity).toHaveBeenCalledWith('act-1', expect.objectContaining({ isPaused: true, pausedRemainingMs: 30_000, endAtMs: 0 }));

    await rerender(renderer, snapshotOf({ status: 'paused', stepEndAtMs: null, stepRemainingSeconds: 30, totalElapsedSeconds: 61 }));
    expect(updateLiveActivity).toHaveBeenCalledTimes(1);
  });

  test('zmiana kroku aktualizuje numer zalania i koniec etapu', async () => {
    const renderer = await render(snapshotOf({}));
    await rerender(renderer, snapshotOf({ currentStepIndex: 2, currentStep: { stepNumber: 3, namePl: 'Dolanie', targetWaterGrams: 250, durationSeconds: 30, instructionPl: '' }, stepEndAtMs: 1_700_000_060_000 }));
    expect(updateLiveActivity).toHaveBeenCalledWith('act-1', expect.objectContaining({ pourIndex: 3, endAtMs: 1_700_000_060_000, stepName: 'Dolanie' }));
  });

  test('zakończenie parzenia kończy aktywność', async () => {
    const renderer = await render(snapshotOf({}));
    await rerender(renderer, snapshotOf({ status: 'finished', stepEndAtMs: null }));
    expect(endLiveActivity).toHaveBeenCalledWith('act-1');
  });

  test('zerowanie stopera (idle) kończy aktywność, a bez niej nic się nie dzieje', async () => {
    const renderer = await render(snapshotOf({ status: 'idle', currentStep: null, stepEndAtMs: null }));
    await rerender(renderer, snapshotOf({ status: 'idle', currentStep: null, stepEndAtMs: null, totalElapsedSeconds: 0 }));
    expect(startLiveActivity).not.toHaveBeenCalled();
    expect(endLiveActivity).not.toHaveBeenCalled();
  });
});
