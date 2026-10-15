// ============================================================================
// Napar (Steepwise) — Unit Tests: CaffeineScreen (Kinetics, Curfew & EFSA)
// ============================================================================

import React from 'react';
import renderer from 'react-test-renderer';

const mockLogs: any[] = [
  {
    id: 'caff-1',
    beverageName: 'V60 Etiopia Gedeb',
    beverageType: 'coffee',
    consumedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(), // 2h temu
    doseGrams: 18,
    caffeineMg: 140,
  },
  {
    id: 'caff-2',
    beverageName: 'Sencha Fukamushi',
    beverageType: 'tea',
    consumedAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(), // 4h temu
    doseGrams: 5,
    caffeineMg: 45,
  },
];

const mockDb: any = {
  execSync: jest.fn(),
  getFirstSync: jest.fn(),
  getAllSync: jest.fn(() => []),
  runSync: jest.fn(),
};

jest.mock('expo-sqlite', () => ({
  openDatabaseSync: jest.fn(() => mockDb),
}));

// Mock react-native-svg dla CaffeineCurveChart
jest.mock('react-native-svg', () => {
  const React = require('react');
  const createComponent = (name: string) => {
    const Component = (props: any) => React.createElement(name, props, props.children);
    Component.displayName = name;
    return Component;
  };
  return {
    __esModule: true,
    default: createComponent('Svg'),
    Svg: createComponent('Svg'),
    Path: createComponent('Path'),
    Line: createComponent('Line'),
    Text: createComponent('SvgText'),
    Circle: createComponent('Circle'),
    Rect: createComponent('Rect'),
    G: createComponent('G'),
    Defs: createComponent('Defs'),
    LinearGradient: createComponent('LinearGradient'),
    Stop: createComponent('Stop'),
  };
});

import CaffeineScreen from '../../../app/(tabs)/caffeine';
import * as databaseModule from '../database';

const findPressableWithText = (root: any, text: string) => {
  const nodes = root.findAll((n: any) => {
    const c = n.props?.children;
    if (typeof c === 'string' && c.includes(text)) return true;
    if (Array.isArray(c) && c.some((child) => typeof child === 'string' && child.includes(text))) return true;
    return false;
  });
  if (nodes.length === 0) return null;
  let curr = nodes[0];
  while (curr && !curr.props?.onPress) {
    curr = curr.parent;
  }
  return curr;
};

describe('CaffeineScreen Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(databaseModule, 'getCaffeineLogs').mockReturnValue([...mockLogs]);
  });

  test('Renderuje ekran monitora kofeiny z sumą dobową EFSA i aktywnym stężeniem', () => {
    let tree: any;
    renderer.act(() => {
      tree = renderer.create(<CaffeineScreen />);
    });

    const json = tree.toJSON();
    expect(json).toBeTruthy();
    const str = JSON.stringify(json);

    expect(str).toContain('AKTYWNA KOFEINA W KRWIOBIEGU');
    expect(str).toContain('Zalecenie EFSA');
    expect(str).toContain('Predykcja Jakości Snu');
    expect(str).toContain('BEZPIECZNA GODZINA (CURFEW)');
    expect(str).toContain('Dzisiejsze Porcje Kofeiny');
    expect(str).toContain('V60 Etiopia Gedeb');
    expect(str).toContain('Sencha Fukamushi');
  });

  test('Koryguje godzinę snu stepperem (+ / −)', () => {
    let tree: any;
    renderer.act(() => {
      tree = renderer.create(<CaffeineScreen />);
    });

    // Domyślnie 23:00
    let str = JSON.stringify(tree.toJSON());
    expect(str).toContain('23:00');

    // Kliknij '+'
    const plusBtn = findPressableWithText(tree.root, '+');
    expect(plusBtn).toBeTruthy();

    renderer.act(() => {
      plusBtn.props.onPress();
    });

    str = JSON.stringify(tree.toJSON());
    expect(str).toContain('24:00');

    // Kliknij '−' dwa razy
    const minusBtn = findPressableWithText(tree.root, '−');
    expect(minusBtn).toBeTruthy();

    renderer.act(() => {
      minusBtn.props.onPress();
    });
    renderer.act(() => {
      minusBtn.props.onPress();
    });

    str = JSON.stringify(tree.toJSON());
    expect(str).toContain('22:00');
  });

  test('Usuwa wpis kofeiny po kliknięciu ✕', () => {
    const deleteSpy = jest.spyOn(databaseModule, 'deleteCaffeineLog').mockImplementation(jest.fn());

    let tree: any;
    renderer.act(() => {
      tree = renderer.create(<CaffeineScreen />);
    });

    // Znajdź przycisk usuwania '✕'
    const deleteBtns = tree.root.findAll((n: any) => n.props?.children === '✕');
    expect(deleteBtns.length).toBeGreaterThan(0);

    let deletePressable = deleteBtns[0].parent;
    while (deletePressable && !deletePressable.props?.onPress) {
      deletePressable = deletePressable.parent;
    }

    renderer.act(() => {
      deletePressable.props.onPress();
    });

    expect(deleteSpy).toHaveBeenCalledWith('caff-1');
  });

  test('Otwiera modal szybkiego dodawania i loguje nową dawkę kofeiny', () => {
    const logSpy = jest.spyOn(databaseModule, 'logCaffeine').mockImplementation(jest.fn());

    let tree: any;
    renderer.act(() => {
      tree = renderer.create(<CaffeineScreen />);
    });

    // 1. Kliknij '+ Dodaj'
    const addBtn = findPressableWithText(tree.root, '+ Dodaj');
    expect(addBtn).toBeTruthy();

    renderer.act(() => {
      addBtn.props.onPress();
    });

    let str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Szybkie dodanie kofeiny');
    expect(str).toContain('Podwójne Espresso (Doppio)');

    // 2. Kliknij opcję Podwójne Espresso (~130 mg)
    const espressoOption = findPressableWithText(tree.root, 'Podwójne Espresso (Doppio)');
    expect(espressoOption).toBeTruthy();

    renderer.act(() => {
      espressoOption.props.onPress();
    });

    expect(logSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        beverageName: 'Podwójne Espresso',
        beverageType: 'coffee',
        doseGrams: 18,
        caffeineMg: 130,
      })
    );
  });
});
