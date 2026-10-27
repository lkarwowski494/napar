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

  test('TASK-P32-04-STU: tytul sekcji kroków posiada role header a etykiety pól sa zlokalizowane', () => {
    let tree: any;
    act(() => {
      tree = renderer.create(
        <RecipeStepEditor
          steps={sampleSteps}
          onAddStep={jest.fn()}
          onRemoveStep={jest.fn()}
          onUpdateStep={jest.fn()}
          t={translations.pl}
        />
      );
    });

    const header = tree.root.findByProps({ accessibilityRole: 'header' });
    expect(header.props.children).toBe('Kroki parzenia');

    const str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Krok 1');
    expect(str).toContain('Docelowa waga zalań (g)');
    expect(str).toContain('Czas trwania kroku (s)');
  });

  test('TASK-P45-04-STU: add-step-btn posiada testID i callback a brak t.recipeBuilder nie rzuca TypeError', () => {
    const onAddStep = jest.fn();
    const minimalT: any = {
      recipeBuilder: {
        stepNumberPrefix: 'Step',
      },
    };

    let tree: any;
    act(() => {
      tree = renderer.create(
        <RecipeStepEditor
          steps={sampleSteps}
          onAddStep={onAddStep}
          onRemoveStep={jest.fn()}
          onUpdateStep={jest.fn()}
          t={minimalT}
        />
      );
    });

    const addBtn = tree.root.findByProps({ testID: 'add-step-btn' });
    expect(addBtn).toBeDefined();
    act(() => {
      addBtn.props.onPress();
    });
    expect(onAddStep).toHaveBeenCalledTimes(1);

    const str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Step 1');
  });

  test('TASK-P46-04-STU: sanityzacja wprowadzania wody i czasu kroków oraz limity długości instrukcji', () => {
    const onUpdateStep = jest.fn();
    let tree: any;
    act(() => {
      tree = renderer.create(
        <RecipeStepEditor
          steps={sampleSteps}
          onAddStep={jest.fn()}
          onRemoveStep={jest.fn()}
          onUpdateStep={onUpdateStep}
          t={translations.pl}
        />
      );
    });

    const waterInput = tree.root.findByProps({ testID: 'step-water-1' });
    act(() => {
      waterInput.props.onChangeNumber(-10);
    });
    expect(onUpdateStep).toHaveBeenCalledWith(0, 'targetWaterGrams', 0);

    const durInput = tree.root.findByProps({ testID: 'step-duration-1' });
    act(() => {
      durInput.props.onChangeNumber(999999);
    });
    expect(onUpdateStep).toHaveBeenCalledWith(0, 'durationSeconds', 86400);

    const instrInput = tree.root.findByProps({ testID: 'step-instruction-1' });
    act(() => {
      instrInput.props.onChangeText('A'.repeat(2500));
    });
    expect(onUpdateStep).toHaveBeenCalledWith(0, 'instructionPl', 'A'.repeat(2000));
  });

  test('TASK-P49-04-STU: RecipeStepEditor jest odporny na null/undefined w steps oraz deklaruje etykiety i podpowiedzi a11y dla pol', () => {
    let tree: any;
    act(() => {
      tree = renderer.create(
        <RecipeStepEditor
          steps={[null, undefined, sampleSteps[0]] as any}
          onAddStep={jest.fn()}
          onRemoveStep={jest.fn()}
          onUpdateStep={jest.fn()}
          t={translations.pl}
        />
      );
    });

    const stepName = tree.root.findByProps({ testID: 'step-name-1' });
    expect(stepName.props.accessibilityHint).toBeDefined();

    const stepWater = tree.root.findByProps({ testID: 'step-water-1' });
    expect(stepWater.props.accessibilityHint).toBeDefined();

    const stepDuration = tree.root.findByProps({ testID: 'step-duration-1' });
    expect(stepDuration.props.accessibilityHint).toBeDefined();

    const stepInstr = tree.root.findByProps({ testID: 'step-instruction-1' });
    expect(stepInstr.props.accessibilityHint).toBeDefined();

    expect(() => {
      act(() => {
        renderer.create(
          <RecipeStepEditor
            steps={null as any}
            onAddStep={jest.fn()}
            onRemoveStep={jest.fn()}
            onUpdateStep={jest.fn()}
            t={translations.pl}
          />
        );
      });
    }).not.toThrow();
  });

  test('TASK-P52-04-STU: onChangeNumber bezpiecznie parsuje stringi z przecinkami oraz ujemne wartosci i -0', () => {
    const onUpdateStep = jest.fn();
    let tree: any;
    act(() => {
      tree = renderer.create(
        <RecipeStepEditor
          steps={sampleSteps}
          onAddStep={jest.fn()}
          onRemoveStep={jest.fn()}
          onUpdateStep={onUpdateStep}
          t={translations.pl}
        />
      );
    });

    // 1. Przecinek w wodzie
    const waterInput = tree.root.findByProps({ testID: 'step-water-1' });
    act(() => {
      waterInput.props.onChangeNumber('120,5');
    });
    expect(onUpdateStep).toHaveBeenCalledWith(0, 'targetWaterGrams', 121);

    // 2. Przecinek w czasie trwania
    const durInput = tree.root.findByProps({ testID: 'step-duration-1' });
    act(() => {
      durInput.props.onChangeNumber('45,4');
    });
    expect(onUpdateStep).toHaveBeenCalledWith(0, 'durationSeconds', 45);

    // 3. -0 i ujemne wartosci
    act(() => {
      durInput.props.onChangeNumber(-0);
    });
    expect(onUpdateStep).toHaveBeenCalledWith(0, 'durationSeconds', 0);
  });

  test('TASK-P54-04-STU: onChangeNumber parsuje wejścia z jednostkami (250g, 45s) a onChangeText sanityzuje znaki kontrolne w nazwach i instrukcjach', () => {
    const onUpdateStep = jest.fn();
    let tree: any;
    act(() => {
      tree = renderer.create(
        <RecipeStepEditor
          steps={sampleSteps}
          onAddStep={jest.fn()}
          onRemoveStep={jest.fn()}
          onUpdateStep={onUpdateStep}
          t={translations.pl}
        />
      );
    });

    // 1. Parsowanie z jednostkami w wodzie i czasie
    const waterInput = tree.root.findByProps({ testID: 'step-water-1' });
    act(() => {
      waterInput.props.onChangeNumber(' 250,5 g ');
    });
    expect(onUpdateStep).toHaveBeenCalledWith(0, 'targetWaterGrams', 251);

    const durInput = tree.root.findByProps({ testID: 'step-duration-1' });
    act(() => {
      durInput.props.onChangeNumber(' 90,4 s ');
    });
    expect(onUpdateStep).toHaveBeenCalledWith(0, 'durationSeconds', 90);

    // 2. Sanityzacja znaków kontrolnych w nazwie kroku
    const nameInput = tree.root.findByProps({ testID: 'step-name-1' });
    act(() => {
      nameInput.props.onChangeText('Infuzja\x00 wstępna\x1F');
    });
    expect(onUpdateStep).toHaveBeenCalledWith(0, 'namePl', 'Infuzja wstępna');

    // 3. Sanityzacja znaków kontrolnych w instrukcji kroku
    const instrInput = tree.root.findByProps({ testID: 'step-instruction-1' });
    act(() => {
      instrInput.props.onChangeText('Zalej spiralnie\x00 i zamieszaj\x07');
    });
    expect(onUpdateStep).toHaveBeenCalledWith(0, 'instructionPl', 'Zalej spiralnie i zamieszaj');
  });
});
