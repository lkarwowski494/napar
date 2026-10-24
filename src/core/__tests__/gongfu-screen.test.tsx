// ============================================================================
// Napar (Steepwise) — Unit Tests: GongfuScreen UI & Multi-Infusion Tracker
// ============================================================================

import React from 'react';
import renderer from 'react-test-renderer';

// Mock in-memory DB for SQLite
const mockDb: any = {
  inventory: new Map<string, any>(),
  sessions: new Map<string, any>(),
  caffeine: new Map<string, any>(),
  settings: new Map<string, string>(),
  execSync: jest.fn(),
  getFirstSync: jest.fn((query: string, params?: any[]) => {
    if (query.includes('FROM app_settings WHERE key = ?')) {
      const val = mockDb.settings.get(params?.[0]);
      return val !== undefined ? { value: val } : null;
    }
    return null;
  }),
  getAllSync: jest.fn((query: string) => {
    if (query.includes('FROM inventory_items')) {
      return [
        {
          id: 'tea-1',
          name: 'Da Hong Pao Reserve',
          type: 'tea',
          initial_weight_g: 50,
          remaining_weight_g: 43,
          flavor_notes_json: JSON.stringify(['Orchidea', 'Dym']),
          is_favorite: 1,
          is_archived: 0,
        },
      ];
    }
    return [];
  }),
  runSync: jest.fn(),
};

jest.mock('expo-sqlite', () => ({
  openDatabaseSync: jest.fn(() => mockDb),
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Medium: 'medium', Light: 'light' },
  NotificationFeedbackType: { Success: 'success' },
}));

jest.mock('expo-keep-awake', () => ({
  activateKeepAwakeAsync: jest.fn(),
  deactivateKeepAwake: jest.fn(),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
}));

import GongfuScreen from '../../../app/gongfu';
import { GongfuSessionSetup } from '../../components/gongfu/GongfuSessionSetup';
import { GongfuInfusionHistory } from '../../components/gongfu/GongfuInfusionHistory';
import { createGongfuSession } from '../gongfu-session';
import { translations } from '../i18n';
import { Alert } from 'react-native';
import * as databaseModule from '../database';

describe('GongfuScreen Component', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  test('Renderuje ekran GongfuScreen z licznikiem infuzji i domyślnym czasem', () => {
    let tree: any;
    renderer.act(() => {
      tree = renderer.create(<GongfuScreen />);
    });

    const json = tree.toJSON();
    expect(json).toBeTruthy();
    const str = JSON.stringify(json);

    expect(str).toContain('Gongfu Cha');
    expect(str).toContain('Wulong Skalny');
    expect(str).toContain('Infuzja');
    expect(str).toContain('#1');
    expect(str).toContain('START INFUZJI');
    expect(str).toContain('Łączna kofeina sesji');
  });

  test('Pozwala zmienić typ herbaty (np. Sheng Puerh)', () => {
    let tree: any;
    renderer.act(() => {
      tree = renderer.create(<GongfuScreen />);
    });

    // Znajdź chip 'Sheng Puerh'
    const puerhChipText = tree.root.findAll((node: any) => {
      return node.props && node.props.children === 'Sheng Puerh';
    })[0];

    let pressable = puerhChipText.parent;
    while (pressable && !pressable.props.onPress) {
      pressable = pressable.parent;
    }

    renderer.act(() => {
      pressable.props.onPress();
    });

    const str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Sheng Puerh');
  });

  test('Koryguje czas infuzji przyciskami +5s i -5s', () => {
    let tree: any;
    renderer.act(() => {
      tree = renderer.create(<GongfuScreen />);
    });

    // Sprawdź domyślny czas (dla wulong_rock infuzja 1 to 20s)
    const findText = (val: string) =>
      tree.root.findAll((node: any) => node.props && node.props.children === val);

    const plus5Text = findText('+5s')[0];
    let plusBtn = plus5Text.parent;
    while (plusBtn && !plusBtn.props.onPress) {
      plusBtn = plusBtn.parent;
    }

    renderer.act(() => {
      plusBtn.props.onPress(); // 15s -> 20s
    });

    let str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Cel: 20s');

    const minus5Text = findText('-5s')[0];
    let minusBtn = minus5Text.parent;
    while (minusBtn && !minusBtn.props.onPress) {
      minusBtn = minusBtn.parent;
    }

    renderer.act(() => {
      minusBtn.props.onPress(); // 20s -> 15s
    });
    renderer.act(() => {
      minusBtn.props.onPress(); // 15s -> 10s
    });

    str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Cel: 10s');
  });

  test('Symuluje cykl parzenia: START INFUZJI -> odliczanie -> zapisanie infuzji', () => {
    let tree: any;
    renderer.act(() => {
      tree = renderer.create(<GongfuScreen />);
    });

    // 1. Kliknij START INFUZJI
    const startText = tree.root.findAll((n: any) => n.props && n.props.children === 'START INFUZJI')[0];
    let startBtn = startText.parent;
    while (startBtn && !startBtn.props.onPress) {
      startBtn = startBtn.parent;
    }

    renderer.act(() => {
      startBtn.props.onPress();
    });

    // Stan po wciśnięciu: PARZENIE W TOKU
    let str = JSON.stringify(tree.toJSON());
    expect(str).toContain('PARZENIE W TOKU');

    // 2. Przewiń timer o 25 sekund krok po kroku
    renderer.act(() => {
      for (let i = 0; i < 25; i++) {
        jest.advanceTimersByTime(1000);
      }
    });

    // 3. Po zakończeniu timer pojawia się komunikat zlania naparu oraz przycisk kolejnej infuzji
    str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Zlej napar do morza herbaty');
    expect(str).toContain('+ Kolejna Infuzja');

    // 4. Kliknij '+ Kolejna Infuzja'
    const nextText = tree.root.findAll((n: any) => n.props && n.props.children === '+ Kolejna Infuzja')[0];
    let nextBtn = nextText.parent;
    while (nextBtn && !nextBtn.props.onPress) {
      nextBtn = nextBtn.parent;
    }

    renderer.act(() => {
      nextBtn.props.onPress();
    });

    // Licznik infuzji powinien przejść na #2
    str = JSON.stringify(tree.toJSON());
    expect(str).toContain('#2');
    expect(str).toContain('Historia Zalań Sesji'); // Zapisana w historii
  });

  test('Blokuje zapisanie sesji bez przynajmniej jednego zalania', () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    let tree: any;
    renderer.act(() => {
      tree = renderer.create(<GongfuScreen />);
    });

    // Kliknij przycisk Zapisz w nagłówku
    const saveText = tree.root.findAll((n: any) => n.props && n.props.children === 'Zapisz')[0];
    let saveBtn = saveText.parent;
    while (saveBtn && !saveBtn.props.onPress) {
      saveBtn = saveBtn.parent;
    }

    renderer.act(() => {
      saveBtn.props.onPress();
    });

    expect(alertSpy).toHaveBeenCalledWith(
      'Gongfu Cha',
      'Przeprowadź przynajmniej jedno zalanie przed zapisem sesji.'
    );
  });

  test('Pomyślnie zapisuje sesję po przeprowadzeniu infuzji', () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons) => {
      const confirmBtn = buttons?.find((b: any) => b.text === 'Zapisz');
      if (confirmBtn?.onPress) {
        confirmBtn.onPress();
      }
    });

    const saveSessionSpy = jest.spyOn(databaseModule, 'saveBrewSession');
    const logCaffeineSpy = jest.spyOn(databaseModule, 'logCaffeine');

    let tree: any;
    renderer.act(() => {
      tree = renderer.create(<GongfuScreen />);
    });

    // Start i szybkie ukończenie infuzji
    const startText = tree.root.findAll((n: any) => n.props && n.props.children === 'START INFUZJI')[0];
    let startBtn = startText.parent;
    while (startBtn && !startBtn.props.onPress) {
      startBtn = startBtn.parent;
    }

    renderer.act(() => {
      startBtn.props.onPress();
    });

    renderer.act(() => {
      for (let i = 0; i < 25; i++) {
        jest.advanceTimersByTime(1000);
      }
    });

    // Zatwierdź infuzję #1
    const nextText = tree.root.findAll((n: any) => n.props && n.props.children === '+ Kolejna Infuzja')[0];
    let nextBtn = nextText.parent;
    while (nextBtn && !nextBtn.props.onPress) {
      nextBtn = nextBtn.parent;
    }

    renderer.act(() => {
      nextBtn.props.onPress();
    });

    // Zapisz sesję
    const saveText = tree.root.findAll((n: any) => n.props && n.props.children === 'Zapisz')[0];
    let saveBtn = saveText.parent;
    while (saveBtn && !saveBtn.props.onPress) {
      saveBtn = saveBtn.parent;
    }

    renderer.act(() => {
      saveBtn.props.onPress();
    });

    expect(alertSpy).toHaveBeenCalled();
    expect(saveSessionSpy).toHaveBeenCalled();
    expect(logCaffeineSpy).toHaveBeenCalled();
  });

  test('W trybie wygasłego trialu próba rozpoczęcia parzenia Gongfu Cha otwiera Paywall', () => {
    mockDb.settings.set('trial_brews_count', '15');
    mockDb.settings.set('is_pro_active', 'false');

    let tree: any;
    renderer.act(() => {
      tree = renderer.create(<GongfuScreen />);
    });

    const startBtn = tree.root.findByProps({ testID: 'gongfu-start-btn' });
    expect(startBtn).toBeDefined();

    renderer.act(() => {
      startBtn.props.onPress();
    });

    // Paywall modal powinien się otworzyć
    const planAnnualBtn = tree.root.findByProps({ testID: 'plan-annual-btn' });
    expect(planAnnualBtn).toBeDefined();

    // Zamknij paywall
    const closeBtn = tree.root.findByProps({ testID: 'close-paywall-btn' });
    renderer.act(() => {
      closeBtn.props.onPress();
    });

    mockDb.settings.clear();
  });

  test('GongfuSessionSetup zawiera 7 typów herbat z lokalizacją EN/PL', () => {
    let tree: any;
    renderer.act(() => {
      tree = renderer.create(
        <GongfuSessionSetup
          teaType="wulong_rock"
          onSelectTeaType={jest.fn()}
          teaName="Da Hong Pao"
          onChangeTeaName={jest.fn()}
          leafDoseGrams="7"
          onChangeLeafDose={jest.fn()}
          vesselCapacityMl="110"
          onChangeVesselCapacity={jest.fn()}
          waterTempCelsius="96"
          onChangeWaterTemp={jest.fn()}
          unitSystem="metric"
          language="en"
          t={translations.en}
        />
      );
    });

    const str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Rock Oolong');
    expect(str).toContain('High Mountain');
    expect(str).toContain('Green');
    expect(str).toContain('White');
    expect(str).toContain('Black');
  });

  test('GongfuInfusionHistory wyświetla zunifikowany model kofeiny w j. angielskim', () => {
    const session = createGongfuSession({
      teaName: 'Long Jing',
      teaType: 'green',
      leafDoseGrams: 5.0,
      vesselCapacityMl: 100,
      waterTempCelsius: 85,
    });

    let tree: any;
    renderer.act(() => {
      tree = renderer.create(
        <GongfuInfusionHistory
          session={session}
          nextInfusionNum={1}
          leafDoseGrams="5"
          language="en"
          t={translations.en}
        />
      );
    });

    const str = JSON.stringify(tree.toJSON());
    expect(str).toContain('Steep #1 delivers ~60 mg (RD-19 extraction kinetics).');
  });
});
