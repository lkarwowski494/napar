// ============================================================================
// Apps4Brew Studio — Unit Tests: ProcedureModal (Step-by-Step Procedure Assistant)
// TASK-P11-04-STU
// ============================================================================

import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { ProcedureModal, ProcedureModalProps } from '../ProcedureModal';
import { RecipeStep } from '../../../core/recipes-data';

const mockSteps: RecipeStep[] = [
  {
    stepNumber: 1,
    namePl: 'Preinfuzja (Bloom)',
    nameEn: 'Bloom',
    durationSeconds: 45,
    targetWaterGrams: 50,
    instructionPl: 'Zalej 50g wody i odczekaj 45 sekund.',
    instructionEn: 'Pour 50g of water and wait 45 seconds.',
  },
  {
    stepNumber: 2,
    namePl: 'Główne zalanie',
    nameEn: 'Main Pour',
    durationSeconds: 60,
    targetWaterGrams: 200,
    instructionPl: 'Dolej do 200g ruchem spiralnym przez 1 minutę.',
    instructionEn: 'Pour up to 200g in spiral motion over 1 minute.',
  },
  {
    stepNumber: 3,
    namePl: 'Dopełnienie i spływ',
    nameEn: 'Final Pour & Drawdown',
    durationSeconds: 30,
    targetWaterGrams: 250,
    instructionPl: 'Dolej do 250g i poczekaj na całkowity spływ.',
    instructionEn: 'Pour to 250g and allow to drain completely.',
  },
];

describe('ProcedureModal Component', () => {
  const defaultProps: ProcedureModalProps = {
    visible: true,
    recipeName: 'V60 Hoffman Standard',
    steps: mockSteps,
    currentStepIndex: 0,
    isRunning: true,
    stepRemainingSeconds: 45,
    totalElapsedSeconds: 0,
    unitSystem: 'metric',
    language: 'pl',
    onPauseResume: jest.fn(),
    onAdjustTimeSeconds: jest.fn(),
    onResetCurrentStep: jest.fn(),
    onPrevStep: jest.fn(),
    onNextStep: jest.fn(),
    onFinishAndSave: jest.fn(),
    onClose: jest.fn(),
  };

  it('returns null when visible is false', async () => {
    let tree: any;
    await act(async () => {
      tree = renderer.create(
        <ProcedureModal {...defaultProps} visible={false} />
      );
    });
    expect(tree.toJSON()).toBeNull();
  });

  it('renders Step 1 with correct counters, titles, water target and countdown', async () => {
    let tree: any;
    await act(async () => {
      tree = renderer.create(<ProcedureModal {...defaultProps} />);
    });

    const root = tree.root;
    const counter = root.findByProps({ testID: 'procedure-step-counter' });
    const name = root.findByProps({ testID: 'procedure-step-name' });
    const water = root.findByProps({ testID: 'procedure-target-water' });
    const countdown = root.findByProps({ testID: 'procedure-countdown-display' });

    expect(counter.props.children).toBe('KROK 1 Z 3');
    expect(name.props.children).toBe('Preinfuzja (Bloom)');
    expect(water.props.children).toBe('50g');
    expect(countdown.props.children).toBe('00:45');

    // Prev button should be disabled on first step
    const prevBtn = root.findByProps({ testID: 'procedure-prev-step-btn' });
    expect(prevBtn.props.disabled).toBe(true);

    // Next button should be present
    const nextBtn = root.findByProps({ testID: 'procedure-next-step-btn' });
    expect(nextBtn).toBeTruthy();
  });

  it('dispatches pause/resume and quick time adjustments', async () => {
    const onPauseResume = jest.fn();
    const onAdjustTimeSeconds = jest.fn();
    const onResetCurrentStep = jest.fn();

    let tree: any;
    await act(async () => {
      tree = renderer.create(
        <ProcedureModal
          {...defaultProps}
          onPauseResume={onPauseResume}
          onAdjustTimeSeconds={onAdjustTimeSeconds}
          onResetCurrentStep={onResetCurrentStep}
        />
      );
    });

    const root = tree.root;
    const pauseBtn = root.findByProps({ testID: 'procedure-pause-resume-btn' });
    const sub60 = root.findByProps({ testID: 'procedure-sub-60-btn' });
    const sub10 = root.findByProps({ testID: 'procedure-sub-10-btn' });
    const add10 = root.findByProps({ testID: 'procedure-add-10-btn' });
    const add60 = root.findByProps({ testID: 'procedure-add-60-btn' });
    const resetBtn = root.findByProps({ testID: 'procedure-reset-step-btn' });

    await act(async () => {
      pauseBtn.props.onPress();
      sub60.props.onPress();
      sub10.props.onPress();
      add10.props.onPress();
      add60.props.onPress();
      resetBtn.props.onPress();
    });

    expect(onPauseResume).toHaveBeenCalledTimes(1);
    expect(onAdjustTimeSeconds).toHaveBeenCalledWith(-60);
    expect(onAdjustTimeSeconds).toHaveBeenCalledWith(-10);
    expect(onAdjustTimeSeconds).toHaveBeenCalledWith(10);
    expect(onAdjustTimeSeconds).toHaveBeenCalledWith(60);
    expect(onResetCurrentStep).toHaveBeenCalledTimes(1);
  });

  it('renders Finish & Save button on the final step and triggers callback', async () => {
    const onFinishAndSave = jest.fn();
    let tree: any;
    await act(async () => {
      tree = renderer.create(
        <ProcedureModal
          {...defaultProps}
          currentStepIndex={2}
          stepRemainingSeconds={0}
          onFinishAndSave={onFinishAndSave}
        />
      );
    });

    const root = tree.root;
    const finishBtn = root.findByProps({ testID: 'procedure-finish-save-btn' });
    expect(finishBtn).toBeTruthy();

    await act(async () => {
      finishBtn.props.onPress();
    });
    expect(onFinishAndSave).toHaveBeenCalledTimes(1);
  });

  it('supports English mode and fallback on empty steps array', async () => {
    let tree: any;
    await act(async () => {
      tree = renderer.create(
        <ProcedureModal
          {...defaultProps}
          language="en"
          steps={[]}
          currentStepIndex={0}
        />
      );
    });

    const root = tree.root;
    const counter = root.findByProps({ testID: 'procedure-step-counter' });
    const name = root.findByProps({ testID: 'procedure-step-name' });

    expect(counter.props.children).toBe('STEP 1 OF 1');
    expect(name.props.children).toBe('Main Extraction');
  });

  it('TASK-P16-01-ODK: formatClock bezpiecznie radzi sobie z NaN i ujemnymi sekundami', async () => {
    let tree: any;
    await act(async () => {
      tree = renderer.create(
        <ProcedureModal
          {...defaultProps}
          totalElapsedSeconds={NaN}
        />
      );
    });

    const str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Całkowity czas parzenia: 00:00');
    expect(str).not.toContain('NaN');
  });

  it('TASK-P16-09-LOK: ProcedureModal renderuje zlokalizowany nagłówek i czas całkowity z przekazanego słownika t', async () => {
    const customT = {
      brew: {
        procedureAssistantTitle: 'PRZEWODNIK KROK PO KROKU',
        totalBrewTime: 'Czas łączny ekstrakcji: {time}',
      },
    };

    let tree: any;
    await act(async () => {
      tree = renderer.create(
        <ProcedureModal
          {...defaultProps}
          totalElapsedSeconds={125}
          t={customT}
        />
      );
    });

    const str = JSON.stringify(tree.toJSON());
    expect(str).toContain('PRZEWODNIK KROK PO KROKU');
    expect(str).toContain('Czas łączny ekstrakcji: 02:05');
  });
  it('TASK-P25-01-ODK: przyciski korekty czasu posiadają zdefiniowane accessibilityHint', async () => {
    let tree: any;
    await act(async () => {
      tree = renderer.create(<ProcedureModal {...defaultProps} />);
    });

    const root = tree.root;
    const sub60 = root.findByProps({ testID: 'procedure-sub-60-btn' });
    const sub10 = root.findByProps({ testID: 'procedure-sub-10-btn' });
    const add10 = root.findByProps({ testID: 'procedure-add-10-btn' });
    const add60 = root.findByProps({ testID: 'procedure-add-60-btn' });

    expect(sub60.props.accessibilityHint).toBeDefined();
    expect(sub10.props.accessibilityHint).toBeDefined();
    expect(add10.props.accessibilityHint).toBeDefined();
    expect(add60.props.accessibilityHint).toBeDefined();
  });
});