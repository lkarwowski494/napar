import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { AppPreferencesCard } from '../AppPreferencesCard';
import { translations } from '../../../core/i18n';

describe('AppPreferencesCard Component', () => {
  const defaultProps = {
    t: translations.pl,
    language: 'pl' as const,
    onSetLanguage: jest.fn(),
    beveragePreference: 'both' as const,
    onSelectBeveragePreference: jest.fn(),
    unitSystem: 'metric' as const,
    onSelectUnitSystem: jest.fn(),
    voiceAnnounce: false,
    onToggleVoiceAnnounce: jest.fn(),
    haptics: true,
    onToggleHaptics: jest.fn(),
  };

  test('TASK-P30-04-STU: kontenery wyboru jezyka, naparow i jednostek deklaruja radiogroup, role radio oraz accessibilityState', () => {
    let tree: any;
    act(() => {
      tree = renderer.create(<AppPreferencesCard {...defaultProps} />);
    });

    const langGroup = tree.root.findByProps({ testID: 'language-radiogroup' });
    expect(langGroup.props.accessibilityRole).toBe('radiogroup');
    expect(langGroup.props.accessibilityLabel).toBe(translations.pl.settings.languageSection);

    const bevGroup = tree.root.findByProps({ testID: 'beverage-preference-radiogroup' });
    expect(bevGroup.props.accessibilityRole).toBe('radiogroup');
    expect(bevGroup.props.accessibilityLabel).toBe(translations.pl.settings.beverageSection);

    const unitGroup = tree.root.findByProps({ testID: 'unit-system-radiogroup' });
    expect(unitGroup.props.accessibilityRole).toBe('radiogroup');
    expect(unitGroup.props.accessibilityLabel).toBe(translations.pl.settings.unitSection);

    // 1. Wybór języka
    const langPl = tree.root.findByProps({ accessibilityLabel: 'Polski (Napar)' });
    const langEn = tree.root.findByProps({ accessibilityLabel: 'English (Steepwise)' });
    expect(langPl.props.accessibilityRole).toBe('radio');
    expect(langPl.props.accessibilityState).toEqual({ selected: true });
    expect(langEn.props.accessibilityRole).toBe('radio');
    expect(langEn.props.accessibilityState).toEqual({ selected: false });

    // 2. Preferencje naparów
    const prefBoth = tree.root.findByProps({ testID: 'beverage-pref-both' });
    const prefCoffee = tree.root.findByProps({ testID: 'beverage-pref-coffee' });
    const prefTea = tree.root.findByProps({ testID: 'beverage-pref-tea' });
    expect(prefBoth.props.accessibilityRole).toBe('radio');
    expect(prefBoth.props.accessibilityState).toEqual({ selected: true });
    expect(prefCoffee.props.accessibilityRole).toBe('radio');
    expect(prefCoffee.props.accessibilityState).toEqual({ selected: false });
    expect(prefTea.props.accessibilityRole).toBe('radio');
    expect(prefTea.props.accessibilityState).toEqual({ selected: false });

    // 3. Wybór jednostek miar
    const unitMetric = tree.root.findByProps({ testID: 'unit-metric-btn' });
    const unitImperial = tree.root.findByProps({ testID: 'unit-imperial-btn' });
    expect(unitMetric.props.accessibilityRole).toBe('radio');
    expect(unitMetric.props.accessibilityState).toEqual({ selected: true });
    expect(unitImperial.props.accessibilityRole).toBe('radio');
    expect(unitImperial.props.accessibilityState).toEqual({ selected: false });
  });
});
