// ============================================================================
// Napar (Steepwise) — BrewActiveFocusTimer Component Tests
// ============================================================================

import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { BrewActiveFocusTimer, DripperExtractionGauge } from '../BrewActiveFocusTimer';

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

  test('TASK-P35-01-ODK: timer-display, step-countdown i hero-target-text posiadają accessibilityRole text oraz zlokalizowane etykiety a11y', () => {
    let treePl: any;
    const runningSnapshot = {
      ...defaultSnapshot,
      status: 'running',
      totalElapsedSeconds: 65,
      stepRemainingSeconds: 25,
      targetWaterGrams: 120,
    };

    act(() => {
      treePl = renderer.create(
        <BrewActiveFocusTimer {...defaultProps} snapshot={runningSnapshot} />
      );
    });

    const timerDisplayPl = treePl.root.findByProps({ testID: 'timer-display' });
    expect(timerDisplayPl.props.accessibilityRole).toBe('text');
    expect(timerDisplayPl.props.accessibilityLabel).toBe('Czas parzenia: 01:05');

    const countdownPl = treePl.root.findByProps({ testID: 'step-countdown' });
    expect(countdownPl.props.accessibilityRole).toBe('text');
    expect(countdownPl.props.accessibilityLabel).toBe('Pozostały czas kroku: 25s');

    const targetPl = treePl.root.findByProps({ testID: 'hero-target-text' });
    expect(targetPl.props.accessibilityRole).toBe('text');
    expect(targetPl.props.accessibilityLabel).toBe('Zalej do: 120 g');
  });

  test('TASK-P38-01-ODK: previous-step-btn posiada accessibilityState disabled na pierwszym kroku i testID kontrolek', () => {
    let tree: any;
    const runningFirstStep = {
      ...defaultSnapshot,
      status: 'running',
      currentStepIndex: 0,
    };

    act(() => {
      tree = renderer.create(
        <BrewActiveFocusTimer {...defaultProps} snapshot={runningFirstStep} />
      );
    });

    const prevBtn = tree.root.findByProps({ testID: 'previous-step-btn' });
    expect(prevBtn.props.accessibilityState).toEqual({ disabled: true });
    expect(prevBtn.props.disabled).toBe(true);

    const pauseBtn = tree.root.findByProps({ testID: 'pause-brew-btn' });
    expect(pauseBtn).toBeTruthy();

    const nextBtn = tree.root.findByProps({ testID: 'next-step-btn' });
    expect(nextBtn).toBeTruthy();

    const sub10Btn = tree.root.findByProps({ testID: 'adjust-time-sub10-btn' });
    expect(sub10Btn.props.accessibilityHint).toContain('10');

    const add10Btn = tree.root.findByProps({ testID: 'adjust-time-add10-btn' });
    expect(add10Btn.props.accessibilityHint).toContain('10');
  });

  test('TASK-P42-01-ODK: DripperExtractionGauge posiada accessibilityRole progressbar i chroni przed NaN oraz -0', () => {
    let tree: any;
    act(() => {
      tree = renderer.create(
        <DripperExtractionGauge
          stepProgress={0.45}
          targetWaterGrams={150}
          currentStepIndex={1}
          totalSteps={3}
        />
      );
    });

    const gauge = tree.root.findByProps({ testID: 'dripper-extraction-gauge' });
    expect(gauge.props.accessible).toBe(true);
    expect(gauge.props.accessibilityRole).toBe('progressbar');
    expect(gauge.props.accessibilityValue).toEqual({ min: 0, max: 100, now: 45 });
    expect(gauge.props.accessibilityLabel).toBe('Postęp ekstrakcji: 45%, docelowo 150 g');

    // Edge case: NaN / -0
    let treeEdge: any;
    act(() => {
      treeEdge = renderer.create(
        <DripperExtractionGauge
          stepProgress={-0 as any}
          targetWaterGrams={-0 as any}
          currentStepIndex={0}
          totalSteps={1}
        />
      );
    });

    const gaugeEdge = treeEdge.root.findByProps({ testID: 'dripper-extraction-gauge' });
    expect(gaugeEdge.props.accessibilityValue).toEqual({ min: 0, max: 100, now: 0 });
    expect(gaugeEdge.props.accessibilityLabel).toBe('Postęp ekstrakcji: 0%, docelowo 0 g');
  });

  test('TASK-P45-01-ODK: DripperExtractionGauge wspiera tryb angielski isEn oraz BrewActiveFocusTimer wspiera formatTime z stringami', () => {
    let tree: any;
    act(() => {
      tree = renderer.create(
        <DripperExtractionGauge
          stepProgress={0.6}
          targetWaterGrams={200}
          currentStepIndex={1}
          totalSteps={2}
          isEn={true}
        />
      );
    });

    const str = JSON.stringify(tree.toJSON());
    expect(str).toContain('EXTRACTION & FLOW');
    const gauge = tree.root.findByProps({ testID: 'dripper-extraction-gauge' });
    expect(gauge.props.accessibilityLabel).toBe('Extraction progress: 60%, target 200 g');

    // String totalElapsedSeconds w BrewActiveFocusTimer
    let treeTimer: any;
    act(() => {
      treeTimer = renderer.create(
        <BrewActiveFocusTimer
          {...defaultProps}
          snapshot={{
            ...defaultSnapshot,
            totalElapsedSeconds: '75' as any,
          }}
        />
      );
    });
    const timerDisplay = treeTimer.root.findByProps({ testID: 'timer-display' });
    expect(timerDisplay.props.children).toBe('01:15');
  });

  test('TASK-P52-01-ODK: BrewActiveFocusTimer wspiera opcjonalne propsy t i language oraz lokalizuje etykiety i podpowiedzi a11y w trybie EN', () => {
    let tree: any;
    act(() => {
      tree = renderer.create(
        <BrewActiveFocusTimer
          {...defaultProps}
          snapshot={{
            ...defaultSnapshot,
            status: 'paused',
          }}
          language="en"
        />
      );
    });

    const root = tree.root;
    const resetBtn = root.findByProps({ testID: 'reset-brew-btn' });
    expect(resetBtn.props.accessibilityLabel).toBe('Reset timer');
    expect(resetBtn.props.accessibilityHint).toBe('Resets time and returns to initial state');

    const resumeBtn = root.findByProps({ testID: 'resume-brew-btn' });
    expect(resumeBtn.props.accessibilityLabel).toBe('Resume brewing');
    expect(resumeBtn.props.accessibilityHint).toBe('Resumes brew time countdown');

    const saveBtn = root.findByProps({ testID: 'save-brew-btn' });
    expect(saveBtn.props.accessibilityLabel).toBe('Save session');
    expect(saveBtn.props.accessibilityHint).toBe('Opens tasting sheet to save notes');
  });
});
