// ============================================================================
// Napar — Unit Tests: GongfuScreen UI & Multi-Infusion Tracker
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
  // initDatabase wstawia receptury wzorcowe przez prepareSync; bez tej metody getDatabase rzuca (M1-audytor-generalny-005).
  prepareSync: jest.fn(() => ({ executeSync: jest.fn(), finalizeSync: jest.fn() })),
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

const mockRouterBack = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: mockRouterBack,
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

    // M1-audytor-generalny-007: sesja i log kofeiny zapisują się razem przez recordBrewSessionTransaction.
    const txSpy = jest.spyOn(databaseModule, 'recordBrewSessionTransaction');

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
    expect(txSpy).toHaveBeenCalledTimes(1);
    expect(txSpy.mock.calls[0][0].method).toBe('GONGFU');
    expect(txSpy.mock.calls[0][2]?.brewSessionId).toBe(txSpy.mock.calls[0][0].id);
  });

  test('02-monetyzacja-004/006 (DEC-01 a): po 15 parzeniach i 15 dniach start Gongfu uruchamia stoper, bez ekranu zakupu', () => {
    mockDb.settings.set('trial_brews_count', '15');
    mockDb.settings.set('trial_started_at', new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString());
    mockDb.settings.set('is_pro_active', 'false');

    let tree: any;
    renderer.act(() => {
      tree = renderer.create(<GongfuScreen />);
    });

    renderer.act(() => {
      tree.root.findByProps({ testID: 'gongfu-start-btn' }).props.onPress();
    });

    expect(tree.root.findAllByProps({ testID: 'plan-annual-btn' })).toHaveLength(0);
    // Stoper ruszył: przycisk startu zniknął (w trakcie parzenia jest licznik zamiast startu).
    expect(tree.root.findAllByProps({ testID: 'gongfu-start-btn' })).toHaveLength(0);

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


// M1-audytor-generalny-007 (05-architekt-007, 08-programista-007, 05-architekt-011)
describe('GongfuScreen — zapis sesji jedną transakcją i komunikat przy błędzie (M1-audytor-generalny-007)', () => {
  function runInfusionAndSave() {
    let tree: any;
    renderer.act(() => {
      tree = renderer.create(<GongfuScreen />);
    });
    const press = (label: string) => {
      const txt = tree.root.findAll((n: any) => n.props && n.props.children === label)[0];
      let btn = txt.parent;
      while (btn && !btn.props.onPress) btn = btn.parent;
      renderer.act(() => {
        btn.props.onPress();
      });
    };
    press('START INFUZJI');
    renderer.act(() => {
      for (let i = 0; i < 25; i++) jest.advanceTimersByTime(1000);
    });
    press('+ Kolejna Infuzja');
    press('Zapisz');
    return tree;
  }

  beforeEach(() => {
    jest.useFakeTimers();
    mockRouterBack.mockClear();
    jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => {
      const confirmBtn = buttons?.find((b: any) => b.text === 'Zapisz');
      confirmBtn?.onPress?.();
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('sesja, log kofeiny i odliczenie wagi idą jednym recordBrewSessionTransaction', () => {
    const txSpy = jest.spyOn(databaseModule, 'recordBrewSessionTransaction');
    const directSave = jest.spyOn(databaseModule, 'saveBrewSession');
    const directLog = jest.spyOn(databaseModule, 'logCaffeine');
    runInfusionAndSave();
    expect(txSpy).toHaveBeenCalledTimes(1);
    const [session, , log] = txSpy.mock.calls[0];
    expect(session.method).toBe('GONGFU');
    expect(log?.brewSessionId).toBe(session.id);
    expect(directSave).not.toHaveBeenCalled();
    expect(directLog).not.toHaveBeenCalled();
  });

  test('M1-audytor-generalny-008: sesja Gongfu bez oceny i balansu, których użytkownik nie podał', () => {
    const txSpy = jest.spyOn(databaseModule, 'recordBrewSessionTransaction');
    runInfusionAndSave();
    const [session] = txSpy.mock.calls[0];
    expect(session.rating).toBeUndefined();
    expect(session.tasteBalance).toBeUndefined();
  });

  test('błąd zapisu: komunikat „Nie udało się zapisać zmian”, ekran zostaje otwarty', () => {
    jest.spyOn(databaseModule, 'recordBrewSessionTransaction').mockImplementation(() => {
      throw new Error('database or disk is full');
    });
    runInfusionAndSave();
    const titles = (Alert.alert as jest.Mock).mock.calls.map((c) => c[0]);
    expect(titles).toContain(translations.pl.common.saveErrorTitle);
    expect(mockRouterBack).not.toHaveBeenCalled();
  });
});
