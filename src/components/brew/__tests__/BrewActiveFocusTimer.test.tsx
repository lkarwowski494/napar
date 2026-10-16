// ============================================================================
// Napar (Steepwise) — BrewActiveFocusTimer Component Tests
// ============================================================================

import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { BrewActiveFocusTimer } from '../BrewActiveFocusTimer';

describe('BrewActiveFocusTimer Component', () => {
  const defaultSnapshot = {
    status: 'idle',
    totalElapsedSeconds: 0,
    stepProgress: 0,
    stepRemainingSeconds: 45,
    currentStepIndex: 0,
    totalSteps: 3,
    targetWaterGrams: 60,
    recommendedPourRate: 2.5,
    isLastStep: false,
    currentStep: {
      namePl: 'Zalanie 1 (Preinfuzja)',
      instructionPl: 'Zalej 60g wody i zamieszaj dripperem.',
    },
  };

  const defaultProps = {
    snapshot: defaultSnapshot,
    onStart: jest.fn(),
    onPause: jest.fn(),
    onResume: jest.fn(),
    onReset: jest.fn(),
    onNextStep: jest.fn(),
    onPreviousStep: jest.fn(),
    onAdjustStepDuration: jest.fn(),
    onFinish: jest.fn(),
  };

  test('W stanie idle renderuje stoper 00:00 i przycisk ROZPOCZNIJ PARZENIE', () => {
    let tree: any;
    act(() => {
      tree = renderer.create(<BrewActiveFocusTimer {...defaultProps} />);
    });

    const str = JSON.stringify(tree.toJSON());
    expect(str).toContain('00:00');
    expect(str).toContain('ROZPOCZNIJ PARZENIE');

    const startBtn = tree.root.findByProps({ testID: 'start-brew-btn' });
    act(() => startBtn.props.onPress());
    expect(defaultProps.onStart).toHaveBeenCalled();
  });

  test('W stanie running renderuje kontrolki PAUZA, Dalej ▶, ◀ Wstecz oraz +/-10s', () => {
    let tree: any;
    const runningSnapshot = {
      ...defaultSnapshot,
      status: 'running',
      totalElapsedSeconds: 45,
      stepRemainingSeconds: 15,
      currentStepIndex: 1,
    };

    act(() => {
      tree = renderer.create(
        <BrewActiveFocusTimer {...defaultProps} snapshot={runningSnapshot} />
      );
    });

    const str = JSON.stringify(tree.toJSON());
    expect(str).toContain('PAUZA');
    expect(str).toContain('Dalej ▶');
    expect(str).toContain('◀ Wstecz');
    expect(str).toContain('~2.5 g/s');

    // Kliknij +10s
    const plus10Btn = tree.root.findByProps({
      accessibilityLabel: 'Dodaj 10 sekund',
    });
    act(() => plus10Btn.props.onPress());
    expect(defaultProps.onAdjustStepDuration).toHaveBeenCalledWith(10);

    // Kliknij -10s
    const minus10Btn = tree.root.findByProps({
      accessibilityLabel: 'Odejmij 10 sekund',
    });
    act(() => minus10Btn.props.onPress());
    expect(defaultProps.onAdjustStepDuration).toHaveBeenCalledWith(-10);

    // Kliknij Pauza
    const pauseBtn = tree.root.findByProps({
      accessibilityLabel: 'Wstrzymaj parzenie',
    });
    act(() => pauseBtn.props.onPress());
    expect(defaultProps.onPause).toHaveBeenCalled();

    // Kliknij Dalej
    const nextBtn = tree.root.findByProps({
      accessibilityLabel: 'Następny krok',
    });
    act(() => nextBtn.props.onPress());
    expect(defaultProps.onNextStep).toHaveBeenCalled();

    // Kliknij Wstecz
    const prevBtn = tree.root.findByProps({
      accessibilityLabel: 'Poprzedni krok',
    });
    act(() => prevBtn.props.onPress());
    expect(defaultProps.onPreviousStep).toHaveBeenCalled();
  });

  test('W stanie paused renderuje WZNÓW, Reset i Zapisz', () => {
    let tree: any;
    const pausedSnapshot = {
      ...defaultSnapshot,
      status: 'paused',
      totalElapsedSeconds: 120,
    };

    act(() => {
      tree = renderer.create(
        <BrewActiveFocusTimer {...defaultProps} snapshot={pausedSnapshot} />
      );
    });

    const str = JSON.stringify(tree.toJSON());
    expect(str).toContain('WZNÓW');
    expect(str).toContain('Reset');
    expect(str).toContain('Zapisz');

    const resumeBtn = tree.root.findByProps({
      accessibilityLabel: 'Wznów parzenie',
    });
    act(() => resumeBtn.props.onPress());
    expect(defaultProps.onResume).toHaveBeenCalled();

    const resetBtn = tree.root.findByProps({
      accessibilityLabel: 'Zresetuj stoper',
    });
    act(() => resetBtn.props.onPress());
    expect(defaultProps.onReset).toHaveBeenCalled();

    const finishBtn = tree.root.findByProps({
      accessibilityLabel: 'Zapisz sesję',
    });
    act(() => finishBtn.props.onPress());
    expect(defaultProps.onFinish).toHaveBeenCalled();
  });
});
