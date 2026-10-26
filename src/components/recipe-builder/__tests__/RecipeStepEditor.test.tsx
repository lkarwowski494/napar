import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { RecipeStepEditor } from '../RecipeStepEditor';
import { translations } from '../../../core/i18n';

describe('RecipeStepEditor Component (TASK-P32-01-ODK)', () => {
  const sampleSteps = [
    {
      stepNumber: 1,
      namePl: 'Preinfuzja',
      durationSeconds: 45,
      targetWaterGrams: 50,
      instructionPl: 'Zalej 50g wody',
    },
    {
      stepNumber: 2,
      namePl: 'Drugie zalanie',
      durationSeconds: 60,
      targetWaterGrams: 150,
      instructionPl: 'Zalewaj spiralnie',
    },
  ];

  test('posiada accessibilityLabel z numerem kroku oraz accessibilityHint dla usuniecia kroku', () => {
    const onAddStep = jest.fn();
    const onRemoveStep = jest.fn();
    const onUpdateStep = jest.fn();

    let tree: any;
    act(() => {
      tree = renderer.create(
        <RecipeStepEditor
          steps={sampleSteps}
          onAddStep={onAddStep}
          onRemoveStep={onRemoveStep}
          onUpdateStep={onUpdateStep}
          t={translations.pl}
        />
      );
    });

    const removeBtn1 = tree.root.findByProps({ testID: 'remove-step-1' });
    expect(removeBtn1.props.accessibilityRole).toBe('button');
    expect(removeBtn1.props.accessibilityLabel).toContain('1');
    expect(removeBtn1.props.accessibilityHint).toContain('krok 1');

    const removeBtn2 = tree.root.findByProps({ testID: 'remove-step-2' });
    expect(removeBtn2.props.accessibilityLabel).toContain('2');

    act(() => {
      removeBtn2.props.onPress();
    });
    expect(onRemoveStep).toHaveBeenCalledWith(1);
  });
});
