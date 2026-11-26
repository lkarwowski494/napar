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
import * as timerAudio from '../src/platform/timer-audio';
import * as expoAudio from 'expo-audio';
import * as database from '../src/data/database';

describe('Partia D2: wInKeep & NumInput', () => {
  test('wInKeep nie tłumi drobnych korekt metrycznych, 2-cyfrowych oz ani całkowitych °F', () => {
    // Metryczne: 15.04 g przy prevBase=15.0 nie może cofać się do 15.0
    expect(wInKeep('15.04', 'g', 15.0)).toBe(15.04);
    expect(wInKeep('15,04', 'g', 15.0)).toBe(15.04);

    // °F: zaokrąglone całkowite 199°F dla 93°C (199.4°F) zachowuje 93°C bez dryfu
    expect(wInKeep('199', '°F', 93)).toBe(93);
    expect(wInKeep('199.4', '°F', 93)).toBe(93);
    expect(wInKeep('200', '°F', 93)).toBe(93.33);

    // oz z 2 miejscami po przecinku: 0.54 oz przy prevBase=15g (0.53 oz) przelicza się na 15.31g
    expect(wInKeep('0.53', 'oz', 15.0)).toBe(15.0);
    expect(wInKeep('0.54', 'oz', 15.0)).toBe(15.31);
    expect(wInKeep('0.5', 'oz', 15.0)).toBe(15.0);
  });

  test('NumInput po blur w jednostkach imperialnych nie nadpisuje pola wartością metryczną i respektuje min przy pustym polu', () => {
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
      input.props.onChangeText('0.53');
      input.props.onBlur({ nativeEvent: {} });
    });
    expect(onChangeNumber).toHaveBeenCalledWith(15);
    // Pole musi nadal pokazywać 0.53 (oz), nie 15 (gramy!)
    expect(input.props.value).toBe('0.53');

    // Puste pole przy min=5 musi zacisnąć wynik do 5g (i wyświetlić w oz)
    renderer.act(() => {
      input.props.onFocus();
      input.props.onChangeText('');
      input.props.onBlur({ nativeEvent: {} });
    });
    expect(onChangeNumber).toHaveBeenLastCalledWith(5);
    expect(input.props.value).toBe('0.18');
  });
});

describe('Partia D2: Audio (duckOthers) i BrewTimerEngine', () => {
  test('playTimerChime konfiguruje tryb audio duckOthers (bez pauzowania muzyki w tle) i czyści subskrypcję', async () => {
    const soundSpy = jest.spyOn(database, 'getSoundEnabled').mockReturnValue(true);
    const setModeMock = (expoAudio as any).setAudioModeAsync as jest.Mock;
    setModeMock.mockClear();

    const ok = await timerAudio.playTimerChime();
    expect(ok).toBe(true);
    expect(setModeMock).toHaveBeenCalledWith(
      expect.objectContaining({
        playsInSilentMode: true,
        interruptionMode: 'duckOthers',
        shouldPlayInBackground: false,
      })
    );
    timerAudio.stopTimerChime();
    soundSpy.mockRestore();
  });

  test('BrewTimerEngine: deduplikuje ostrzeżenie 3-2-1 przy taktowaniu 250ms, wznawia z finished i scala przeskoki w tle', () => {
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

      // Przejście przez ostatnie 3 sekundy pierwszego kroku (7s..10s) — każde ostrzeżenie 3, 2, 1 dokładnie raz!
      jest.advanceTimersByTime(9500);
      expect(warnings).toEqual([3, 2, 1]);
      expect(chimeSpy).toHaveBeenCalledTimes(1);

      // Skok z uśpienia w tle o 15s (przeskakuje resztę kroku 1 i cały krok 2 -> ląduje w kroku 3)
      const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 15000);
      engine.syncWithRealTime();
      nowSpy.mockRestore();
      expect(engine.getSnapshot().currentStepIndex).toBe(2);
      // Powiadomienie tylko o kroku docelowym (2), bez pośredniego (1)
      expect(stepChanges).toEqual([0, 2]);

      // Zakończenie i ponowny start() bezpośrednio ze stanu finished
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
});

describe('Partia D2: Kofeina (00:00..23:00, DST, okno 48h, post-midnight)', () => {
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
  });

  test('CaffeineCurveChart normalizuje etykietę snu i nie rysuje kropki wczorajszej dawki na dzisiejszej osi', () => {
    const yesterdayAfternoon = new Date();
    yesterdayAfternoon.setDate(yesterdayAfternoon.getDate() - 1);
    yesterdayAfternoon.setHours(15, 0, 0, 0);

    const todayNoon = new Date();
    todayNoon.setHours(12, 0, 0, 0);

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
                consumedAt: yesterdayAfternoon.toISOString(),
                doseGrams: 15,
                caffeineMg: 120,
              },
              {
                id: 'today-log',
                beverageName: 'Dzisiejsze V60',
                beverageType: 'coffee',
                consumedAt: todayNoon.toISOString(),
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
    // Tylko 1 kropka (<RNSVGCircle>) dla dzisiejszego wpisu — wczorajszy nie może pojawiać się jako kropka dzisiaj
    const circles = tree!.root.findAll((node) => node.type === 'RNSVGCircle');
    expect(circles.length).toBe(1);
  });
});

describe('Partia D2: Espresso EY%, kofeina wg metody i młynki', () => {
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
    // (36 * 9.5) / 18 = 19.0% -> PL: 19,0%
    expect(JSON.stringify(tree!.toJSON())).toContain('19,0');
  });

  test('BrewProvider.finishAndSaveSession liczy EY% dla ESPRESSO bez retencji 2x i różnicuje kofeinę wg metody', () => {
    const dbMod = require('../src/data/database');
    const { BrewProvider, useBrew } = require('../src/core/brew-context');
    const recordSpy = jest.spyOn(dbMod, 'recordBrewSessionTransaction').mockImplementation(() => {});

    let ctx: any;
    const Probe = () => {
      ctx = useBrew();
      return null;
    };

    renderer.act(() => {
      renderer.create(
        <LanguageProvider>
          <BrewProvider>
            <Probe />
          </BrewProvider>
        </LanguageProvider>
      );
    });

    renderer.act(() => {
      ctx.selectRecipe({
        id: 'esp-1',
        name: 'Modern Espresso',
        beverageType: 'COFFEE',
        method: 'ESPRESSO',
        doseGrams: 18,
        waterGrams: 36,
        waterTempCelsius: 93,
        recommendedRatio: 2,
        grindSizeDescription: 'Bardzo drobno',
        stepsJson: '[{"stepNumber":1,"namePl":"Ekstrakcja","targetWaterGrams":36,"durationSeconds":28,"instructionPl":"Extract"}]',
        isCustom: false,
        isFavorite: false,
        createdAt: '2026-11-01T00:00:00.000Z',
        updatedAt: '2026-11-01T00:00:00.000Z',
      });
    });

    let espSession: any;
    renderer.act(() => {
      espSession = ctx.finishAndSaveSession({ tdsPercentage: 9.5, logToCaffeineTracker: false });
    });

    // Bez błędnej retencji 2x: (36 * 9.5) / 18 = 19.0% (z błędną retencją 36 - 36 = 0g -> undefined/0!)
    expect(espSession.extractionYieldPercentage).toBe(19);
    // Espresso extraction efficiency (0.75) vs filter (0.88): 18 * 12 * 0.75 = 162.0 mg (nie 190.1 mg!)
    expect(espSession.caffeineContentMg).toBeCloseTo(162.0, 1);
    recordSpy.mockRestore();
  });

  test('Młynki: Kinu M47 rozróżnia V60/Chemex/FP, Ode parsuje "4 1/3", J-Max/ZP6 parsują rot.sub.click, V60 wygrywa przed "drobno"', () => {
    // Kinu M47 (50 klików/obrót, maxSetting 250) — V60, Chemex, FP muszą dawać różne nastawy!
    const kinuV60 = convertMicronsToGrinder(720, 'kinu_m47');
    const kinuChemex = convertMicronsToGrinder(880, 'kinu_m47');
    const kinuFp = convertMicronsToGrinder(1150, 'kinu_m47');
    expect(kinuV60.rawValue).toBe(72);
    expect(kinuChemex.rawValue).toBe(88);
    expect(kinuFp.rawValue).toBe(115);
    expect(kinuV60.formatted).toBe('1.4 obrotu (72 klików)');

    // Fellow Ode Gen 2: "4 1/3" -> 4 (nie 413!)
    const ode = SUPPORTED_GRINDERS.find((g) => g.id === 'fellow_ode_gen2')!;
    expect(ode.parseSetting('4 1/3')).toBe(ode.parseSetting('4⅓'));
    expect(ode.parseSetting('4 1/3')).toBe(640);

    // 1Zpresso J-Max & ZP6: rot.sub.click round-trip
    const jmax = SUPPORTED_GRINDERS.find((g) => g.id === '1zpresso_j_max')!;
    expect(jmax.parseSetting('1.1.5 (105 klików)')).toBeCloseTo(105 * 8.4, 2);

    const zp6 = SUPPORTED_GRINDERS.find((g) => g.id === '1zpresso_zp6')!;
    expect(zp6.parseSetting('1.0.5 (65 klików)')).toBeCloseTo(65 * 12.2, 2);

    // SavedRecipe camelCase grindSizeDescription + kolejność V60 przed ogólnym "drobno"
    expect(getRecipeMicrons({ method: 'V60', grindSizeDescription: 'Średnio-drobno (20 klików)' })).toBe(600);
    expect(getRecipeMicrons({ method: 'V60', grindSizeDescription: 'Średnio-drobno' })).toBe(720);
    expect(getRecipeMicrons({ method: 'CUSTOM', grindSizeDescription: 'Grubo pod French Press' })).toBe(1150);

    // GrinderSelectModal lokalizacja EN
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
  });
});
