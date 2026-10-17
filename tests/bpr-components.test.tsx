import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Share } from 'react-native';
import { AppGuideModal } from '../src/components/AppGuideModal';
import { ProcedureModal } from '../src/components/brew/ProcedureModal';
import { ProactiveCalendarCard } from '../src/components/journal/ProactiveCalendarCard';
import SettingsTabScreen from '../app/(tabs)/settings';

describe('BPR To-Be Components & Screens Coverage', () => {
  it('renders AppGuideModal in PL and EN and handles close actions', () => {
    const onClose = jest.fn();
    let tree: renderer.ReactTestRenderer;

    act(() => {
      tree = renderer.create(
        <AppGuideModal visible={false} onClose={onClose} language="pl" />
      );
    });
    expect(tree!.toJSON()).toBeNull();

    act(() => {
      tree!.update(
        <AppGuideModal visible={true} onClose={onClose} language="pl" />
      );
    });
    expect(JSON.stringify(tree!.toJSON())).toContain('Jak działa aplikacja?');
    expect(JSON.stringify(tree!.toJSON())).toContain('ZŁOTE ZASADY EKSTRAKCJI');

    const closeBtn = tree!.root.findByProps({ testID: 'app-guide-close-btn' });
    act(() => {
      closeBtn.props.onPress();
    });
    expect(onClose).toHaveBeenCalledTimes(1);

    const gotItBtn = tree!.root.findByProps({ testID: 'app-guide-got-it-btn' });
    act(() => {
      gotItBtn.props.onPress();
    });
    expect(onClose).toHaveBeenCalledTimes(2);

    act(() => {
      tree!.update(
        <AppGuideModal visible={true} onClose={onClose} language="en" />
      );
    });
    expect(JSON.stringify(tree!.toJSON())).toContain('How Steepwise Works');
  });

  it('renders ProcedureModal with auto-parsed duration, step navigation, and Finish & Save CTA', () => {
    const onPauseResume = jest.fn();
    const onAdjustTimeSeconds = jest.fn();
    const onResetCurrentStep = jest.fn();
    const onPrevStep = jest.fn();
    const onNextStep = jest.fn();
    const onFinishAndSave = jest.fn();
    const onClose = jest.fn();

    const steps = [
      {
        stepNumber: 1,
        namePl: 'Preinfuzja (Bloom)',
        targetWaterGrams: 50,
        durationSeconds: 30,
        instructionPl: 'Zalej i odczekaj 45 sekund na odgazowanie.',
      },
      {
        stepNumber: 2,
        namePl: 'Zalanie główne',
        targetWaterGrams: 250,
        durationSeconds: 90,
        instructionPl: 'Zalewaj spokojnie przez 2 minuty.',
      },
    ];

    let tree: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <ProcedureModal
          visible={true}
          recipeName="Wzorcowy V60"
          steps={steps}
          currentStepIndex={0}
          isRunning={true}
          stepRemainingSeconds={45}
          totalElapsedSeconds={10}
          unitSystem="metric"
          language="pl"
          onPauseResume={onPauseResume}
          onAdjustTimeSeconds={onAdjustTimeSeconds}
          onResetCurrentStep={onResetCurrentStep}
          onPrevStep={onPrevStep}
          onNextStep={onNextStep}
          onFinishAndSave={onFinishAndSave}
          onClose={onClose}
        />
      );
    });

    act(() => {
      tree!.root.findByProps({ testID: 'procedure-sub-60-btn' }).props.onPress();
      tree!.root.findByProps({ testID: 'procedure-sub-10-btn' }).props.onPress();
      tree!.root.findByProps({ testID: 'procedure-add-10-btn' }).props.onPress();
      tree!.root.findByProps({ testID: 'procedure-add-60-btn' }).props.onPress();
      tree!.root.findByProps({ testID: 'procedure-pause-resume-btn' }).props.onPress();
      tree!.root.findByProps({ testID: 'procedure-reset-step-btn' }).props.onPress();
      tree!.root.findByProps({ testID: 'procedure-next-step-btn' }).props.onPress();
    });

    expect(onAdjustTimeSeconds).toHaveBeenCalledWith(-60);
    expect(onAdjustTimeSeconds).toHaveBeenCalledWith(-10);
    expect(onAdjustTimeSeconds).toHaveBeenCalledWith(10);
    expect(onAdjustTimeSeconds).toHaveBeenCalledWith(60);
    expect(onPauseResume).toHaveBeenCalled();
    expect(onResetCurrentStep).toHaveBeenCalledWith(45);
    expect(onNextStep).toHaveBeenCalled();

    // Render on last step -> shows Finish & Save CTA
    act(() => {
      tree!.update(
        <ProcedureModal
          visible={true}
          recipeName="Wzorcowy V60"
          steps={steps}
          currentStepIndex={1}
          isRunning={false}
          stepRemainingSeconds={120}
          totalElapsedSeconds={55}
          unitSystem="imperial"
          language="en"
          onPauseResume={onPauseResume}
          onAdjustTimeSeconds={onAdjustTimeSeconds}
          onResetCurrentStep={onResetCurrentStep}
          onPrevStep={onPrevStep}
          onNextStep={onNextStep}
          onFinishAndSave={onFinishAndSave}
          onClose={onClose}
        />
      );
    });

    act(() => {
      tree!.root.findByProps({ testID: 'procedure-prev-step-btn' }).props.onPress();
      tree!.root.findByProps({ testID: 'procedure-finish-save-btn' }).props.onPress();
      tree!.root.findByProps({ testID: 'procedure-close-btn' }).props.onPress();
    });

    expect(onPrevStep).toHaveBeenCalled();
    expect(onFinishAndSave).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('renders ProactiveCalendarCard, filters schedule, exports .ics, and executes 1-Tap action', () => {
    const shareSpy = jest
      .spyOn(Share, 'share')
      .mockResolvedValue({ action: 'sharedAction' } as any);
    const onExecuteAction = jest.fn();

    let tree: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(
        <ProactiveCalendarCard
          inventory={[
            {
              id: 'inv-1',
              name: 'Ethiopia Peak',
              type: 'coffee',
              roastOrHarvestDate: '2026-10-05',
              initialWeightGrams: 250,
              remainingWeightGrams: 200,
              flavorNotes: [],
              isFavorite: true,
              isArchived: false,
              createdAt: '2026-10-05',
              updatedAt: '2026-10-05',
            },
          ]}
          sessions={[]}
          referenceDateIso="2026-10-17T10:00:00.000Z"
          language="pl"
          onExecuteAction={onExecuteAction}
        />
      );
    });

    act(() => {
      tree!.root.findByProps({ testID: 'schedule-filter-all' }).props.onPress();
      tree!.root.findByProps({ testID: 'schedule-filter-upcoming' }).props.onPress();
      tree!.root.findByProps({ testID: 'calendar-day-2026-10-17' }).props.onPress();
    });

    act(() => {
      tree!.root.findByProps({ testID: 'calendar-clear-date-btn' }).props.onPress();
      tree!.root
        .findByProps({ testID: 'execute-action-btn-action-peak-now-inv-1' })
        .props.onPress();
      tree!.root
        .findByProps({ testID: 'ics-export-btn-action-peak-now-inv-1' })
        .props.onPress();
    });

    expect(onExecuteAction).toHaveBeenCalled();
    expect(shareSpy).toHaveBeenCalled();
    shareSpy.mockRestore();
  });

  it('renders SettingsTabScreen re-exported route from app/(tabs)/settings', () => {
    let tree: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<SettingsTabScreen />);
    });
    expect(tree!.toJSON()).toBeTruthy();
  });
});
