// ============================================================================
// Napar — Regression Tests: Partia D2 (Domena, Audio, Stopery, Kofeina, Młynki)
// ============================================================================

import React from 'react';
import renderer from 'react-test-renderer';
import { TextInput } from 'react-native';
import {
  wInKeep,
  formatBedtimeHour,
  normalizeBedtimeHourNumber,
} from '../src/core/unit-converter';
import { NumInput } from '../src/components/ui/NumInput';
import { BrewTimerEngine } from '../src/core/timer-engine';
import {
  SUPPORTED_GRINDERS,
  convertMicronsToGrinder,
  getRecipeMicrons,
} from '../src/core/grinder-converter';
import { ExtractionYieldTab } from '../src/components/dialin/ExtractionYieldTab';
import { BedtimeCurfewCard } from '../src/components/caffeine/BedtimeCurfewCard';
import { CaffeineSettingsCard } from '../src/components/settings/CaffeineSettingsCard';
import { CaffeineCurveChart } from '../src/core/caffeine-chart';
import { GrinderSelectModal } from '../src/components/brew/GrinderSelectModal';
import { LanguageProvider, translations } from '../src/core/i18n';
import CaffeineScreen from '../app/(tabs)/caffeine';
import GongfuScreen from '../app/gongfu';
import * as timerAudio from '../src/platform/timer-audio';
import * as expoAudio from 'expo-audio';
import * as database from '../src/data/database';

describe('Partia D2: wInKeep & NumInput', () => {
  test('wInKeep nie tłumi drobnych korekt metrycznych, 2-cyfrowych oz ani całkowitych °F', () => {
    expect(wInKeep('15.04', 'g', 15.0)).toBe(15.04);
    expect(wInKeep('15,04', 'g', 15.0)).toBe(15.04);

    expect(wInKeep('199', '°F', 93)).toBe(93);
    expect(wInKeep('199.4', '°F', 93)).toBe(93);
    expect(wInKeep('200', '°F', 93)).toBe(93.33);

    expect(wInKeep('0.53', 'oz', 15.0)).toBe(15.0);
    expect(wInKeep('0.54', 'oz', 15.0)).toBe(15.31);
    expect(wInKeep('0.5', 'oz', 15.0)).toBe(15.0);
  });

  test('NumInput po osobnym focus -> change -> blur w oz nie nadpisuje pola gramami i respektuje min przy pustym polu', () => {
    const onChangeNumber = jest.fn();
    let tree: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(
        <NumInput value="0.53" stored={15} unit="oz" min={5} max={100} onChangeNumber={onChangeNumber} />
      );
    });
    const input = tree!.root.findByType(TextInput);

    renderer.act(() => {
      input.props.onFocus();
    });
    renderer.act(() => {
      input.props.onChangeText('0.53');
    });
    renderer.act(() => {
      input.props.onBlur({ nativeEvent: {} });
    });
    expect(onChangeNumber).toHaveBeenCalledWith(15);
    expect(input.props.value).toBe('0.53');

    // Niekontrolowany NumInput (bez statycznego prop value): pusty blur przy min=5 zaciska do 5g i wyświetla 0.18 oz (nie 5!)
    let uncontrolledTree: renderer.ReactTestRenderer;
    renderer.act(() => {
      uncontrolledTree = renderer.create(
        <NumInput stored={15} unit="oz" min={5} max={100} onChangeNumber={onChangeNumber} />
      );
    });
    const uInput = uncontrolledTree!.root.findByType(TextInput);
    renderer.act(() => {
      uInput.props.onFocus();
    });
    renderer.act(() => {
      uInput.props.onChangeText('');
    });
    renderer.act(() => {
      uInput.props.onBlur({ nativeEvent: {} });
    });
    expect(onChangeNumber).toHaveBeenLastCalledWith(5);
    expect(uInput.props.value).toBe('0.18');
    renderer.act(() => {
      tree!.unmount();
      uncontrolledTree!.unmount();
    });
  });
});

describe('Partia D2: Audio (duckOthers, wyścig async) i BrewTimerEngine', () => {
  test('playTimerChime konfiguruje duckOthers, nie odpala zombie-dźwięku po stopTimerChime() podczas await i czyści subskrypcję', async () => {
    const soundSpy = jest.spyOn(database, 'getSoundEnabled').mockReturnValue(true);
    const setModeMock = (expoAudio as any).setAudioModeAsync as jest.Mock;
    const createPlayerMock = (expoAudio as any).createAudioPlayer as jest.Mock;
    setModeMock.mockClear();
    createPlayerMock.mockClear();

    const subRemove = jest.fn();
    const playerRemove = jest.fn();
    createPlayerMock.mockImplementationOnce(() => ({
      play: jest.fn(),
      pause: jest.fn(),
      remove: playerRemove,
      addListener: jest.fn((_ev: string, cb: (s: any) => void) => {
        cb({ didJustFinish: true });
        return { remove: subRemove };
      }),
    }));

    const ok = await timerAudio.playTimerChime();
    expect(ok).toBe(true);
    // Przy synchronicznym didJustFinish subskrypcja i player muszą być posprzątane dokładnie raz
    expect(subRemove).toHaveBeenCalledTimes(1);
    expect(playerRemove).toHaveBeenCalledTimes(1);

    // Test wyścigu: stopTimerChime() w trakcie oczekiwania na setAudioModeAsync blokuje uruchomienie playera
    await jest.isolateModulesAsync(async () => {
      const freshAudio = require('../src/platform/timer-audio');
      let resolveMode!: () => void;
      setModeMock.mockImplementationOnce(
        () => new Promise<void>((resolve) => { resolveMode = resolve; })
      );
      const callsBefore = createPlayerMock.mock.calls.length;
      const pending = freshAudio.playTimerChime();
      freshAudio.stopTimerChime();
      resolveMode();
      const result = await pending;
      expect(result).toBe(false);
      expect(createPlayerMock.mock.calls.length).toBe(callsBefore);
    });

    timerAudio.stopTimerChime();
    soundSpy.mockRestore();
  });

  test('BrewTimerEngine: deduplikuje 3-2-1 przy 250ms, ponownie uzbraja chime po adjustStepDuration(+10s), wznawia z finished i scala przeskoki', () => {
    jest.useFakeTimers();
    const chimeSpy = jest.spyOn(timerAudio, 'playTimerChime').mockResolvedValue(true);
    try {
      const steps = [
        { stepNumber: 1, namePl: 'Bloom', targetWaterGrams: 50, durationSeconds: 10, instructionPl: 'Bloom' },
        { stepNumber: 2, namePl: 'Pour 1', targetWaterGrams: 150, durationSeconds: 10, instructionPl: 'Pour 1' },
        { stepNumber: 3, namePl: 'Pour 2', targetWaterGrams: 250, durationSeconds: 10, instructionPl: 'Pour 2' },
      ];
      const warnings: number[] = [];
      const stepChanges: number[] = [];
      const onFinish = jest.fn();

      const engine = new BrewTimerEngine(steps, {
        onWarning: (rem) => warnings.push(rem),
        onStepChange: (idx) => stepChanges.push(idx),
        onFinish,
      });

      engine.start();
      expect(stepChanges).toEqual([0]);

      // Wejście w ostatnie 3s (t=8s -> pozostało 2s): zagra chime raz i warning [3, 2]
      jest.advanceTimersByTime(8000);
      expect(warnings).toEqual([3, 2]);
      expect(chimeSpy).toHaveBeenCalledTimes(1);

      // Wydłużenie kroku o +10s musi ponownie uzbroić chime i warning na kolejne zejście do 3s!
      engine.adjustStepDuration(10);
      jest.advanceTimersByTime(10000);
      expect(chimeSpy).toHaveBeenCalledTimes(2);
      expect(warnings).toEqual([3, 2, 3, 2]);

      // Skok z uśpienia w tle o 15s (przeskakuje resztę kroku 1 i cały krok 2 -> ląduje w kroku 3)
      const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 15000);
      engine.syncWithRealTime();
      nowSpy.mockRestore();
      expect(engine.getSnapshot().currentStepIndex).toBe(2);
      expect(stepChanges).toEqual([0, 2]);

      // Ponowny start() ze stanu finished
      engine.finish();
      expect(engine.getSnapshot().status).toBe('finished');
      expect(onFinish).toHaveBeenCalledTimes(1);

      engine.start();
      const restarted = engine.getSnapshot();
      expect(restarted.status).toBe('running');
      expect(restarted.currentStepIndex).toBe(0);
      expect(restarted.stepElapsedSeconds).toBe(0);
      expect(restarted.totalElapsedSeconds).toBe(0);

      engine.destroy();
    } finally {
      chimeSpy.mockRestore();
      jest.useRealTimers();
    }
  });

  test('GongfuScreen: korekta czasu +/-5s na pauzie zachowuje rzeczywisty czas upływu przy zakończeniu przed czasem', () => {
    jest.useFakeTimers();
    const invSpy = jest.spyOn(database, 'getInventoryItems').mockReturnValue([]);
    const unitSpy = jest.spyOn(database, 'getUnitSystem').mockReturnValue('metric');
    const recSpy = jest.spyOn(database, 'recordBrewSessionTransaction').mockImplementation(() => {});
    let tree: renderer.ReactTestRenderer;
    try {
      renderer.act(() => {
        tree = renderer.create(
          <LanguageProvider>
            <GongfuScreen />
          </LanguageProvider>
        );
      });

      // Domyślny 1. wlew wulong_rock = 15s
      renderer.act(() => {
        tree!.root.findByProps({ testID: 'gongfu-start-btn' }).props.onPress();
      });
      // Upłynęło 12s -> pozostało 3s
      renderer.act(() => {
        jest.advanceTimersByTime(12_000);
      });
      renderer.act(() => {
        tree!.root.findByProps({ testID: 'gongfu-pause-btn' }).props.onPress();
      });
      // Kliknięcie -5s na pauzie: nie może sfałszować upływu 12s (zaciśnie pozostały czas do 1s i cel do 13s)
      renderer.act(() => {
        tree!.root.findByProps({ testID: 'gongfu-adjust-minus-btn' }).props.onPress();
      });
      const countdownAfterMinus = tree!.root.findByProps({ testID: 'gongfu-countdown-display' });
      expect(countdownAfterMinus.props.children[0]).toBe('01');

      // Zakończenie przed czasem -> przyciski +/-5s muszą być wyłączone po steepFinished
      renderer.act(() => {
        tree!.root.findByProps({ testID: 'gongfu-end-btn' }).props.onPress();
      });
      expect(tree!.root.findByProps({ testID: 'gongfu-adjust-minus-btn' }).props.disabled).toBe(true);
      expect(tree!.root.findByProps({ testID: 'gongfu-adjust-plus-btn' }).props.disabled).toBe(true);

      // Zapis infuzji -> w historii musi pojawić się dokładne 12s (nie 9s ani 4s!)
      renderer.act(() => {
        tree!.root.findByProps({ testID: 'gongfu-record-btn' }).props.onPress();
      });
      expect(JSON.stringify(tree!.toJSON())).toContain('"12","s"');

      renderer.act(() => {
        tree!.unmount();
      });
    } finally {
      invSpy.mockRestore();
      unitSpy.mockRestore();
      recSpy.mockRestore();
      jest.useRealTimers();
    }
  });
});

describe('Partia D2: Kofeina (00:00..23:00, okno 48h, post-midnight 00:30)', () => {
  test('formatBedtimeHour i normalizeBedtimeHourNumber nigdy nie pokazują 24:00..28:00', () => {
    expect(formatBedtimeHour(23)).toBe('23:00');
    expect(formatBedtimeHour(24)).toBe('00:00');
    expect(formatBedtimeHour(25)).toBe('01:00');
    expect(formatBedtimeHour(28)).toBe('04:00');
    expect(normalizeBedtimeHourNumber(24)).toBe('00');
    expect(normalizeBedtimeHourNumber(25)).toBe('01');

    let curfewTree: renderer.ReactTestRenderer;
    renderer.act(() => {
      curfewTree = renderer.create(
        <LanguageProvider>
          <BedtimeCurfewCard
            bedtimeHour={25}
            onBedtimeChange={jest.fn()}
            halfLifeHours={4}
            onHalfLifeChange={jest.fn()}
            bedtimeMg={35}
          />
        </LanguageProvider>
      );
    });
    const curfewJson = JSON.stringify(curfewTree!.toJSON());
    expect(curfewJson).toContain('01:00');
    expect(curfewJson).not.toContain('25:00');
    renderer.act(() => curfewTree!.unmount());

    let settingsTree: renderer.ReactTestRenderer;
    renderer.act(() => {
      settingsTree = renderer.create(
        <CaffeineSettingsCard
          bedtimeHour={24}
          onBedtimeChange={jest.fn()}
          halfLifeHours={4}
          onHalfLifeChange={jest.fn()}
          t={translations.pl}
          language="pl"
        />
      );
    });
    const settingsJson = JSON.stringify(settingsTree!.toJSON());
    expect(settingsJson).toContain('00:00');
    expect(settingsJson).not.toContain('24:00');
    renderer.act(() => settingsTree!.unmount());
  });

  test('CaffeineScreen po północy (00:30, bedtime=25) liczy okno 48h, filtruje dzisiejszą listę i rysuje kropkę na wykresie', () => {
    jest.useFakeTimers();
    // Zamrożony zegar lokalny: 2026-11-26 00:30:00
    const frozenNow = new Date(2026, 10, 26, 0, 30, 0, 0);
    jest.setSystemTime(frozenNow);

    const yesterdayLate = new Date(2026, 10, 25, 20, 30, 0, 0); // 4h temu (dokładnie 1 okres półtrwania przy t1/2=4h)
    const afterMidnight = new Date(2026, 10, 26, 0, 15, 0, 0); // 15 min temu (dzisiaj po północy)

    const logsSpy = jest.spyOn(database, 'getCaffeineLogs').mockReturnValue([
      {
        id: 'yest-late',
        beverageName: 'Wczorajsze Espresso',
        beverageType: 'coffee',
        consumedAt: yesterdayLate.toISOString(),
        doseGrams: 18,
        caffeineMg: 100,
      },
      {
        id: 'today-early',
        beverageName: 'Nocna Herbata',
        beverageType: 'tea',
        consumedAt: afterMidnight.toISOString(),
        doseGrams: 5,
        caffeineMg: 45,
      },
    ]);
    const bedSpy = jest.spyOn(database, 'getBedtimeHour').mockReturnValue(25); // 01:00
    const hlSpy = jest.spyOn(database, 'getCaffeineHalfLife').mockReturnValue(4);
    const unitSpy = jest.spyOn(database, 'getUnitSystem').mockReturnValue('metric');

    let tree: renderer.ReactTestRenderer;
    try {
      renderer.act(() => {
        tree = renderer.create(
          <LanguageProvider>
            <CaffeineScreen />
          </LanguageProvider>
        );
      });

      const json = JSON.stringify(tree!.toJSON());
      // Dobowy bilans zlicza TYLKO dzisiejszy wpis (45 mg), NIE wczorajsze 100 mg!
      expect(json).toContain('45 mg / 400 mg');
      // Lista historii zawiera tylko dzisiejszy wpis
      expect(tree!.root.findAllByProps({ testID: 'delete-caffeine-log-today-early' }).length).toBeGreaterThan(0);
      expect(tree!.root.findAllByProps({ testID: 'delete-caffeine-log-yest-late' }).length).toBe(0);
      // Aktywna kofeina uwzględnia wczorajsze 100mg po 4h (=50mg) + 45mg po 15min (~43mg) = 93 mg
      expect(json).toContain('"93"," mg"');
      // Godzina snu o 00:30 dla bedtime=25 to 01:00 tej samej nocy (0.5h później -> 85.4 mg, nie 24.5h później!)
      expect(json).toContain('01:00');
      expect(json).not.toContain('25:00');
      expect(json).toContain('85.4 mg');

      // Wykres po północy (00:30) kotwiczy oś 06:00 wczoraj – 06:00 dziś -> OBIE dawki (20:30 wczoraj i 00:15 dziś) mają kropki!
      const circles = tree!.root.findAll((node) => node.type === 'RNSVGCircle');
      expect(circles.length).toBe(2);

      renderer.act(() => tree!.unmount());
    } finally {
      logsSpy.mockRestore();
      bedSpy.mockRestore();
      hlSpy.mockRestore();
      unitSpy.mockRestore();
      jest.useRealTimers();
    }
  });

  test('CaffeineCurveChart w dzień (14:00) nie rysuje kropki wczorajszej dawki na dzisiejszej osi', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 10, 26, 14, 0, 0, 0));
    try {
      let tree: renderer.ReactTestRenderer;
      renderer.act(() => {
        tree = renderer.create(
          <LanguageProvider>
            <CaffeineCurveChart
              logs={[
                {
                  id: 'yesterday-log',
                  beverageName: 'Wczorajsze V60',
                  beverageType: 'coffee',
                  consumedAt: new Date(2026, 10, 25, 15, 0, 0, 0).toISOString(),
                  doseGrams: 15,
                  caffeineMg: 120,
                },
                {
                  id: 'today-log',
                  beverageName: 'Dzisiejsze V60',
                  beverageType: 'coffee',
                  consumedAt: new Date(2026, 10, 26, 12, 0, 0, 0).toISOString(),
                  doseGrams: 15,
                  caffeineMg: 120,
                },
              ]}
              bedtimeHour={25}
              halfLifeHours={4}
            />
          </LanguageProvider>
        );
      });

      const json = JSON.stringify(tree!.toJSON());
      expect(json).toContain('01:00');
      expect(json).not.toContain('25:00');
      const circles = tree!.root.findAll((node) => node.type === 'RNSVGCircle');
      expect(circles.length).toBe(1);
      renderer.act(() => tree!.unmount());
    } finally {
      jest.useRealTimers();
    }
  });
});

describe('Partia D2: Espresso EY%, kofeina wg metody (CLEVER vs ESPRESSO vs COLD_BREW) i młynki', () => {
  test('ExtractionYieldTab przełącza nietknięte domyślne wartości między Przelewem a Espresso i formatuje EY%', () => {
    let tree: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(<ExtractionYieldTab language="pl" t={translations.pl} />);
    });

    const espressoBtn = tree!.root.findByProps({ testID: 'ey-mode-espresso' });
    renderer.act(() => {
      espressoBtn.props.onPress();
    });

    const inputs = tree!.root.findAllByType(TextInput);
    expect(inputs[0].props.value).toBe('36');
    expect(inputs[1].props.value).toBe('18');
    expect(inputs[2].props.value).toBe('9.5');
    expect(JSON.stringify(tree!.toJSON())).toContain('19,0');
    renderer.act(() => tree!.unmount());
  });

  test('BrewProvider.finishAndSaveSession: ESPRESSO (0.75, bez retencji 2x), CLEVER_DRIPPER (immersion 0.85, NIE espresso!) i COLD_BREW (0.92)', () => {
    const dbMod = require('../src/data/database');
    const { BrewProvider, useBrew } = require('../src/core/brew-context');
    const recordSpy = jest.spyOn(dbMod, 'recordBrewSessionTransaction').mockImplementation(() => {});

    let ctx: any;
    const Probe = () => {
      ctx = useBrew();
      return null;
    };

    let tree: renderer.ReactTestRenderer;
    try {
      renderer.act(() => {
        tree = renderer.create(
          <LanguageProvider>
            <BrewProvider>
              <Probe />
            </BrewProvider>
          </LanguageProvider>
        );
      });

      const baseRecipe = {
        beverageType: 'COFFEE' as const,
        doseGrams: 18,
        waterGrams: 36,
        waterTempCelsius: 93,
        recommendedRatio: 2,
        grindSizeDescription: 'Średnio',
        stepsJson: '[{"stepNumber":1,"namePl":"Parzenie","targetWaterGrams":36,"durationSeconds":28,"instructionPl":"Brew"}]',
        isCustom: false,
        isFavorite: false,
        createdAt: '2026-11-01T00:00:00.000Z',
        updatedAt: '2026-11-01T00:00:00.000Z',
      };

      // 1. ESPRESSO: EY bez retencji 2x = 19.0%, kofeina = 18 * 12 * 0.75 = 162.0 mg
      renderer.act(() => {
        ctx.selectRecipe({ ...baseRecipe, id: 'esp-1', name: 'Modern Espresso', method: 'ESPRESSO' });
      });
      let espSession: any;
      renderer.act(() => {
        espSession = ctx.finishAndSaveSession({ tdsPercentage: 9.5, logToCaffeineTracker: false });
      });
      expect(espSession.extractionYieldPercentage).toBe(19);
      expect(espSession.caffeineContentMg).toBeCloseTo(162.0, 1);

      // 2. CLEVER_DRIPPER: NIE może wpaść w "LEVER" -> espresso! Musi użyć immersion (0.85): 18 * 12 * 0.85 = 183.6 mg
      renderer.act(() => {
        ctx.selectRecipe({ ...baseRecipe, id: 'clever-1', name: 'Clever Dripper', method: 'CLEVER_DRIPPER', waterGrams: 280 });
      });
      let cleverSession: any;
      renderer.act(() => {
        cleverSession = ctx.finishAndSaveSession({ logToCaffeineTracker: false });
      });
      expect(cleverSession.caffeineContentMg).toBeCloseTo(183.6, 1);

      // 3. COLD_BREW: 0.92 -> 18 * 12 * 0.92 = 198.7 mg
      renderer.act(() => {
        ctx.selectRecipe({ ...baseRecipe, id: 'cb-1', name: 'Cold Brew', method: 'COLD_BREW', waterGrams: 200 });
      });
      let cbSession: any;
      renderer.act(() => {
        cbSession = ctx.finishAndSaveSession({ logToCaffeineTracker: false });
      });
      expect(cbSession.caffeineContentMg).toBeCloseTo(198.7, 1);

      renderer.act(() => tree!.unmount());
    } finally {
      recordSpy.mockRestore();
    }
  });

  test('Młynki: Kinu M47 (dokładny round-trip 2 miejsc po przecinku), Ode "4 1/3", J-Max/ZP6 rot.sub.click, V60 przed "drobno"', () => {
    const kinu = SUPPORTED_GRINDERS.find((g) => g.id === 'kinu_m47')!;
    const kinuV60 = convertMicronsToGrinder(720, 'kinu_m47');
    const kinuChemex = convertMicronsToGrinder(880, 'kinu_m47');
    const kinuFp = convertMicronsToGrinder(1150, 'kinu_m47');
    expect(kinuV60.rawValue).toBe(72);
    expect(kinuChemex.rawValue).toBe(88);
    expect(kinuFp.rawValue).toBe(115);
    expect(kinuV60.formatted).toBe('1.44 obrotu (72 klików)');
    expect(kinu.parseSetting(kinuV60.formatted)).toBe(720);

    const ode = SUPPORTED_GRINDERS.find((g) => g.id === 'fellow_ode_gen2')!;
    expect(ode.parseSetting('4 1/3')).toBe(ode.parseSetting('4⅓'));
    expect(ode.parseSetting('4 1/3')).toBe(640);

    const jmax = SUPPORTED_GRINDERS.find((g) => g.id === '1zpresso_j_max')!;
    expect(jmax.parseSetting('1.1.5 (105 klików)')).toBeCloseTo(105 * 8.4, 2);

    const zp6 = SUPPORTED_GRINDERS.find((g) => g.id === '1zpresso_zp6')!;
    expect(zp6.parseSetting('1.0.5 (65 klików)')).toBeCloseTo(65 * 12.2, 2);

    expect(getRecipeMicrons({ method: 'V60', grindSizeDescription: 'Średnio-drobno (20 klików)' })).toBe(600);
    expect(getRecipeMicrons({ method: 'V60', grindSizeDescription: 'Średnio-drobno' })).toBe(720);
    expect(getRecipeMicrons({ method: 'CUSTOM', grindSizeDescription: 'Grubo pod French Press' })).toBe(1150);

    let modalTree: renderer.ReactTestRenderer;
    renderer.act(() => {
      modalTree = renderer.create(
        <GrinderSelectModal
          visible={true}
          onClose={jest.fn()}
          grinderId="comandante_c40"
          onSelectGrinder={jest.fn()}
          recipe={{ method: 'V60' } as any}
          t={translations.en}
          language="en"
        />
      );
    });
    const modalJson = JSON.stringify(modalTree!.toJSON());
    expect(modalJson).toContain('24 clicks');
    expect(modalJson).toContain('Other grinder (Universal');
    expect(modalJson).not.toContain('klików');
    renderer.act(() => modalTree!.unmount());
  });
});
