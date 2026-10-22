// ============================================================================
// Napar (Steepwise) — Regresja: pola Gongfu w układzie imperialnym zachowują wartość w gramach/ml/°C
// Wcześniej 15 g wyświetlane jako "15" z etykietą oz i po blur zapisywane jako 425,24 g.
// ============================================================================

import React from 'react';
import renderer from 'react-test-renderer';
import { TextInput } from 'react-native';
import { GongfuSessionSetup } from '../gongfu/GongfuSessionSetup';

const t = {
  gongfu: { modeDesc: 'Parametry', leafDose: 'Liść', vesselCapacity: 'Zaparzacz', waterTemp: 'Woda' },
};

function render(props: Partial<React.ComponentProps<typeof GongfuSessionSetup>>) {
  const onChangeLeafDose = jest.fn();
  const onChangeVesselCapacity = jest.fn();
  const onChangeWaterTemp = jest.fn();
  let tree: any;
  renderer.act(() => {
    tree = renderer.create(
      <GongfuSessionSetup
        teaType="wulong_rock"
        onSelectTeaType={jest.fn()}
        teaName="Test"
        onChangeTeaName={jest.fn()}
        leafDoseGrams="15"
        onChangeLeafDose={onChangeLeafDose}
        vesselCapacityMl="250"
        onChangeVesselCapacity={onChangeVesselCapacity}
        waterTempCelsius="93"
        onChangeWaterTemp={onChangeWaterTemp}
        unitSystem="imperial"
        t={t}
        {...props}
      />
    );
  });
  // inputs[0] to pole nazwy herbaty; pola liczbowe: 1 = liść, 2 = zaparzacz, 3 = temperatura
  const inputs = tree.root.findAllByType(TextInput).slice(1);
  return { inputs, onChangeLeafDose, onChangeVesselCapacity, onChangeWaterTemp };
}

describe('GongfuSessionSetup: układ imperialny nie zmienia wartości bazowych', () => {
  test('15 g wyświetla się jako 0,5 oz (nie jako 15)', () => {
    const { inputs } = render({});
    expect(inputs[0].props.value).toBe('0.5');
  });

  test('250 ml wyświetla się jako 8,5 fl oz, 93 °C jako 199,4 °F', () => {
    const { inputs } = render({});
    expect(inputs[1].props.value).toBe('8.5');
    expect(inputs[2].props.value).toBe('199.4');
  });

  test('zatwierdzenie bez zmiany pola zachowuje 15 g (bez dryfu)', () => {
    const { inputs, onChangeLeafDose } = render({});
    renderer.act(() => {
      inputs[0].props.onFocus();
      inputs[0].props.onBlur({ nativeEvent: {} });
    });
    expect(onChangeLeafDose).toHaveBeenLastCalledWith('15');
  });

  test('wpisanie 1 oz zapisuje 28,35 g (nie 425,24 g)', () => {
    const { inputs, onChangeLeafDose } = render({});
    renderer.act(() => {
      inputs[0].props.onFocus();
      inputs[0].props.onChangeText('1');
      inputs[0].props.onBlur({ nativeEvent: {} });
    });
    expect(onChangeLeafDose).toHaveBeenLastCalledWith('28.35');
  });

  test('wpisanie 10 fl oz zapisuje 295,74 ml', () => {
    const { inputs, onChangeVesselCapacity } = render({});
    renderer.act(() => {
      inputs[1].props.onFocus();
      inputs[1].props.onChangeText('10');
      inputs[1].props.onBlur({ nativeEvent: {} });
    });
    expect(onChangeVesselCapacity).toHaveBeenLastCalledWith('295.74');
  });

  test('układ metryczny: wartości bez przeliczania (15 g, 250 ml, 93 °C)', () => {
    const { inputs, onChangeLeafDose } = render({ unitSystem: 'metric' });
    expect(inputs[0].props.value).toBe('15');
    expect(inputs[1].props.value).toBe('250');
    expect(inputs[2].props.value).toBe('93');
    renderer.act(() => {
      inputs[0].props.onFocus();
      inputs[0].props.onBlur({ nativeEvent: {} });
    });
    expect(onChangeLeafDose).toHaveBeenLastCalledWith('15');
  });
});
