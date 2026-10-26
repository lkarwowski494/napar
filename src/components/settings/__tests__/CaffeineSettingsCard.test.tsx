// ============================================================================
// Napar (Steepwise) — Unit Tests: CaffeineSettingsCard
// ============================================================================

import React from 'react';
import renderer from 'react-test-renderer';
import { CaffeineSettingsCard } from '../CaffeineSettingsCard';
import { translations } from '../../../core/i18n';

describe('CaffeineSettingsCard Component', () => {
  const t = translations.pl;
  const mockOnHalfLifeChange = jest.fn();
  const mockOnBedtimeChange = jest.fn();
  const mockOnToggleHealthKit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Renderuje nastawy metabolizmu kofeiny, czas półtrwania, porę snu i przełącznik HealthKit', () => {
    let tree: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(
        <CaffeineSettingsCard
          halfLifeHours={5.0}
          onHalfLifeChange={mockOnHalfLifeChange}
          bedtimeHour={23}
          onBedtimeChange={mockOnBedtimeChange}
          healthKitSync={true}
          onToggleHealthKit={mockOnToggleHealthKit}
          t={t}
        />
      );
    });

    const root = tree!.root;
    expect(root.findByProps({ testID: 'toggle-healthkit-btn' })).toBeDefined();
    expect(root.findByProps({ accessibilityLabel: 'Zmniejsz czas półtrwania' })).toBeDefined();
    expect(root.findByProps({ accessibilityLabel: 'Zwiększ czas półtrwania' })).toBeDefined();
    expect(root.findByProps({ accessibilityLabel: 'Wcześniejsza godzina snu' })).toBeDefined();
    expect(root.findByProps({ accessibilityLabel: 'Późniejsza godzina snu' })).toBeDefined();
  });

  test('Koryguje czas półtrwania kofeiny przyciskami +/-', () => {
    let tree: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(
        <CaffeineSettingsCard
          halfLifeHours={5.0}
          onHalfLifeChange={mockOnHalfLifeChange}
          bedtimeHour={23}
          onBedtimeChange={mockOnBedtimeChange}
          healthKitSync={false}
          onToggleHealthKit={mockOnToggleHealthKit}
          t={t}
        />
      );
    });

    const root = tree!.root;
    const decBtn = root.findByProps({ accessibilityLabel: 'Zmniejsz czas półtrwania' });
    const incBtn = root.findByProps({ accessibilityLabel: 'Zwiększ czas półtrwania' });

    renderer.act(() => {
      decBtn.props.onPress();
    });
    expect(mockOnHalfLifeChange).toHaveBeenCalledWith(4.5);

    renderer.act(() => {
      incBtn.props.onPress();
    });
    expect(mockOnHalfLifeChange).toHaveBeenCalledWith(5.5);
  });

  test('Koryguje docelową godzinę snu przyciskami +/-', () => {
    let tree: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(
        <CaffeineSettingsCard
          halfLifeHours={5.0}
          onHalfLifeChange={mockOnHalfLifeChange}
          bedtimeHour={23}
          onBedtimeChange={mockOnBedtimeChange}
          healthKitSync={false}
          onToggleHealthKit={mockOnToggleHealthKit}
          t={t}
        />
      );
    });

    const root = tree!.root;
    const decBtn = root.findByProps({ accessibilityLabel: 'Wcześniejsza godzina snu' });
    const incBtn = root.findByProps({ accessibilityLabel: 'Późniejsza godzina snu' });

    renderer.act(() => {
      decBtn.props.onPress();
    });
    expect(mockOnBedtimeChange).toHaveBeenCalledWith(22);

    renderer.act(() => {
      incBtn.props.onPress();
    });
    expect(mockOnBedtimeChange).toHaveBeenCalledWith(24);
  });

  test('Przełącza synchronizację Apple HealthKit', () => {
    let tree: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(
        <CaffeineSettingsCard
          halfLifeHours={5.0}
          onHalfLifeChange={mockOnHalfLifeChange}
          bedtimeHour={23}
          onBedtimeChange={mockOnBedtimeChange}
          healthKitSync={false}
          onToggleHealthKit={mockOnToggleHealthKit}
          t={t}
        />
      );
    });

    const root = tree!.root;
    const hkBtn = root.findByProps({ testID: 'toggle-healthkit-btn' });

    renderer.act(() => {
      hkBtn.props.onPress();
    });
    expect(mockOnToggleHealthKit).toHaveBeenCalled();
  });

  test('TASK-P6-04-STU: Renderuje zlokalizowane etykiety accessibilityLabel w trybie angielskim', () => {
    let tree: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(
        <CaffeineSettingsCard
          halfLifeHours={5.0}
          onHalfLifeChange={mockOnHalfLifeChange}
          bedtimeHour={23}
          onBedtimeChange={mockOnBedtimeChange}
          healthKitSync={true}
          onToggleHealthKit={mockOnToggleHealthKit}
          t={translations.en}
        />
      );
    });

    const root = tree!.root;
    expect(root.findByProps({ accessibilityLabel: 'Decrease half-life' })).toBeDefined();
    expect(root.findByProps({ accessibilityLabel: 'Increase half-life' })).toBeDefined();
    expect(root.findByProps({ accessibilityLabel: 'Earlier bedtime' })).toBeDefined();
    expect(root.findByProps({ accessibilityLabel: 'Later bedtime' })).toBeDefined();
  });
  test('TASK-P21-04-STU: Kontenery stepperów posiadają accessibilityHint dla czytników ekranu', () => {
    let tree: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(
        <CaffeineSettingsCard
          halfLifeHours={5.0}
          onHalfLifeChange={mockOnHalfLifeChange}
          bedtimeHour={23}
          onBedtimeChange={mockOnBedtimeChange}
          healthKitSync={true}
          onToggleHealthKit={mockOnToggleHealthKit}
          t={t}
        />
      );
    });

    const root = tree!.root;
    const halfLifeStepper = root.findByProps({ testID: 'caffeine-half-life-stepper' });
    const bedtimeStepper = root.findByProps({ testID: 'caffeine-bedtime-stepper' });
    expect(halfLifeStepper.props.accessibilityRole).toBe('adjustable');
    expect(halfLifeStepper.props.accessibilityHint).toBe(t.settings.caffeineHalfLifeDesc);
    expect(bedtimeStepper.props.accessibilityRole).toBe('adjustable');
    expect(bedtimeStepper.props.accessibilityHint).toBe(t.settings.bedtimeHourDesc);
  });
});
