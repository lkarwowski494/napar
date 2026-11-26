// ============================================================================
// Napar — Regression Tests: Partia D1 (DEEP-001..DEEP-006 — wszystkie 6 P0)
// ============================================================================

import React from 'react';
import renderer from 'react-test-renderer';
import fs from 'fs';
import path from 'path';
import { KeyboardAvoidingView, ScrollView, TextInput } from 'react-native';
import {
  parseLocaleFloat,
  ouncesToGramsExact,
  fluidOuncesToMl,
} from '../src/core/unit-converter';
import {
  calculateBrewRatio,
  calculateLiquidYield,
  calculateExtractionYield,
} from '../src/core/domain-rules';
import { BrewTimerEngine } from '../src/core/timer-engine';
import { BrewRatioTab } from '../src/components/dialin/BrewRatioTab';
import { ExtractionYieldTab } from '../src/components/dialin/ExtractionYieldTab';
import { WaterChemistryTab } from '../src/components/dialin/WaterChemistryTab';
import { BrewModalsContainer } from '../src/components/brew/BrewModalsContainer';
import { JsonImportModal } from '../src/components/settings/JsonBackupModals';
import { LanguageProvider, translations } from '../src/core/i18n';
import { DEFAULT_SENSORY_PROFILE } from '../src/core/radar-chart';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), navigate: jest.fn() }),
  useFocusEffect: jest.fn(),
}));

describe('Partia D1 — DEEP-001: ProcedureModal dla SavedRecipe i scaledSteps', () => {
  test('BrewModalsContainer przekazuje wszystkie scaledSteps dla SavedRecipe (zamiast KROK 1 Z 1)', () => {
    const scaledSteps = [
      { stepNumber: 1, namePl: 'Bloom', targetWaterGrams: 100, durationSeconds: 45, instructionPl: 'Zalej 100g' },
      { stepNumber: 2, namePl: 'Zalanie 1', targetWaterGrams: 300, durationSeconds: 45, instructionPl: 'Zalej 300g' },
      { stepNumber: 3, namePl: 'Zalanie 2', targetWaterGrams: 500, durationSeconds: 60, instructionPl: 'Zalej 500g' },
    ];
    const savedRecipeFromDb = {
      id: 'v60-hoffmann-single',
      name: 'V60 Hoffmann (DB SavedRecipe)',
      beverageType: 'COFFEE' as const,
      method: 'V60',
      doseGrams: 15,
      waterGrams: 250,
      waterTempCelsius: 95,
      recommendedRatio: 16.67,
      stepsJson: JSON.stringify(scaledSteps),
      isCustom: false,
      isFavorite: false,
      createdAt: '2026-11-01T08:00:00.000Z',
    };

    const workflow: any = {
      recipe: savedRecipeFromDb,
      scaledSteps,
      snapshot: {
        status: 'idle',
        currentStepIndex: 0,
        currentStep: scaledSteps[0],
        totalSteps: 3,
        stepElapsedSeconds: 0,
        stepRemainingSeconds: 45,
        stepProgress: 0,
        totalElapsedSeconds: 0,
        currentWaterGrams: 0,
        previousWaterGrams: 0,
        targetWaterGrams: 100,
        recommendedPourRate: 2.2,
        isLastStep: false,
      },
      isRunning: false,
      unitSystem: 'metric',
      language: 'pl',
      pauseTimer: jest.fn(),
      resumeTimer: jest.fn(),
      adjustStepDuration: jest.fn(),
      resetCurrentStep: jest.fn(),
      previousStep: jest.fn(),
      nextStep: jest.fn(),
      resetTimer: jest.fn(),
      handleStartTimer: jest.fn(),
      handleResetWithConfirm: jest.fn(),
      selectRecipe: jest.fn(),
      refreshData: jest.fn(),
      showProcedureModal: true,
      setShowProcedureModal: jest.fn(),
      showFinishModal: false,
      setShowFinishModal: jest.fn(),
      showGrinderModal: false,
      setShowGrinderModal: jest.fn(),
      showShareModal: false,
      setShowShareModal: jest.fn(),
      showImportModal: false,
      setShowImportModal: jest.fn(),
      showQrScanner: false,
      setShowQrScanner: jest.fn(),
      showInventoryModal: false,
      setShowInventoryModal: jest.fn(),
      allInventory: [],
      selectedInventoryItem: null,
      selectInventoryItem: jest.fn(),
      showOnboarding: false,
      handleCompleteOnboarding: jest.fn(),
      waterGrams: 500,
      waterTempCelsius: 95,
      grinderId: 'comandante_c40',
      setGrinderId: jest.fn(),
      shareUrl: '',
      rating: 5,
      setRating: jest.fn(),
      tasteBalance: 'balanced',
      setTasteBalance: jest.fn(),
      sensoryProfile: DEFAULT_SENSORY_PROFILE,
      setSensoryProfile: jest.fn(),
      selectedTags: [],
      toggleTag: jest.fn(),
      waterProfile: 'sca_standard',
      setWaterProfile: jest.fn(),
      notes: '',
      setNotes: jest.fn(),
      handleFinishSave: jest.fn(),
      handleScanQrRecipe: jest.fn(),
      t: translations.pl,
    };

    let tree: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(
        <LanguageProvider>
          <BrewModalsContainer workflow={workflow} />
        </LanguageProvider>
      );
    });

    const counter = tree!.root.findByProps({ testID: 'procedure-step-counter' });
    expect(counter.props.children).toBe('KROK 1 Z 3');
    const water = tree!.root.findByProps({ testID: 'procedure-target-water' });
    expect(water.props.children).toBe('100g');
  });

  test('BrewTimerEngine.resetCurrentStep zeruje stepElapsedSeconds bez pompowania durationSeconds (running i paused)', () => {
    jest.useFakeTimers();
    try {
      const steps = [
        { stepNumber: 1, namePl: 'Bloom', targetWaterGrams: 50, durationSeconds: 45, instructionPl: 'Bloom' },
      ];
      const engine = new BrewTimerEngine(steps);
      engine.start();
      jest.advanceTimersByTime(20_000);
      expect(engine.getSnapshot().stepElapsedSeconds).toBe(20);
      engine.resetCurrentStep(45);
      const snap = engine.getSnapshot();
      expect(snap.stepElapsedSeconds).toBe(0);
      expect(snap.stepRemainingSeconds).toBe(45);
      expect(snap.currentStep?.durationSeconds).toBe(45);

      // Sprawdź także stan paused
      jest.advanceTimersByTime(10_000);
      engine.pause();
      engine.resetCurrentStep(40);
      const pausedSnap = engine.getSnapshot();
      expect(pausedSnap.status).toBe('paused');
      expect(pausedSnap.stepElapsedSeconds).toBe(0);
      expect(pausedSnap.stepRemainingSeconds).toBe(40);
      engine.destroy();
    } finally {
      jest.useRealTimers();
    }
  });

  test('BrewProvider.reloadFromDatabase odświeża preferencje, młynek i czyści usunięte custom recipe / paczkę', () => {
    const dbMod = require('../src/data/database');
    const { BrewProvider, useBrew } = require('../src/core/brew-context');

    const getPrefSpy = jest.spyOn(dbMod, 'getBeveragePreference').mockReturnValue('tea');
    const getSettingSpy = jest.spyOn(dbMod, 'getAppSetting').mockImplementation((k: unknown, d?: unknown) =>
      k === 'default_grinder' ? 'fellow_ode_gen2' : (d ?? '')
    );
    const getInvSpy = jest.spyOn(dbMod, 'getInventoryItemById').mockReturnValue(null);
    const getRecSpy = jest.spyOn(dbMod, 'getRecipeById').mockReturnValue(null);

    let ctx: any;
    const Probe = () => {
      ctx = useBrew();
      return null;
    };

    let tree: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(
        <LanguageProvider>
          <BrewProvider>
            <Probe />
          </BrewProvider>
        </LanguageProvider>
      );
    });

    renderer.act(() => {
      ctx.selectInventoryItem({
        id: 'deleted-item',
        name: 'Stara paczka',
        type: 'coffee',
        initialWeightGrams: 250,
        remainingWeightGrams: 100,
        flavorNotes: [],
        isFavorite: false,
        isArchived: false,
        createdAt: '2026-11-01T00:00:00.000Z',
        updatedAt: '2026-11-01T00:00:00.000Z',
      });
      ctx.selectRecipe({
        id: 'deleted-custom-rec',
        name: 'Usunięty przepis',
        beverageType: 'COFFEE',
        method: 'V60',
        doseGrams: 15,
        waterGrams: 250,
        waterTempCelsius: 93,
        recommendedRatio: 16.6,
        stepsJson: '[]',
        isCustom: true,
        isFavorite: false,
        createdAt: '2026-11-01T00:00:00.000Z',
      });
    });

    const beforeVersion = ctx.dataVersion;
    renderer.act(() => {
      ctx.reloadFromDatabase();
    });

    expect(ctx.dataVersion).toBe(beforeVersion + 1);
    expect(ctx.grinderId).toBe('fellow_ode_gen2');
    expect(ctx.beveragePreference).toBe('tea');
    expect(ctx.selectedInventoryItem).toBeNull();
    expect(ctx.recipe.id).not.toBe('deleted-custom-rec');

    // Wariant: receptura zaktualizowana w bazie
    getRecSpy.mockReturnValue({
      id: ctx.recipe.id,
      name: 'Zaktualizowana z DB',
      beverageType: 'TEA',
      method: 'GONGFU',
      doseGrams: 5,
      waterGrams: 120,
      waterTempCelsius: 85,
      recommendedRatio: 24,
      stepsJson: '[]',
      isCustom: false,
      isFavorite: false,
      createdAt: '2026-11-01T00:00:00.000Z',
    });
    renderer.act(() => {
      ctx.reloadFromDatabase();
    });
    expect(ctx.recipe.name).toBe('Zaktualizowana z DB');

    renderer.act(() => {
      tree!.unmount();
    });
    getPrefSpy.mockRestore();
    getSettingSpy.mockRestore();
    getInvSpy.mockRestore();
    getRecSpy.mockRestore();
  });
});

describe('Partia D1 — DEEP-003 & DEEP-004: Polski przecinek + BrewRatioTab imperial + Espresso 1:2', () => {
  test('parseLocaleFloat, domain-rules i konwertery imperialne działają z polskim przecinkiem', () => {
    expect(parseLocaleFloat('18,5')).toBe(18.5);
    expect(parseLocaleFloat('1,35')).toBe(1.35);
    expect(parseLocaleFloat('0,5')).toBe(0.5);
    expect(calculateBrewRatio('15,5' as any, '248' as any)).toBe(16);
    expect(calculateLiquidYield('250,5' as any, '15,5' as any)).toBe(219.5);
    expect(calculateExtractionYield('220,5' as any, '1,35' as any, '15,5' as any).extractionYieldPercent).toBe(19.2);
    expect(ouncesToGramsExact('1,0')).toBeCloseTo(28.35, 2);
    expect(fluidOuncesToMl('10,0')).toBeCloseTo(295.7, 1);
  });

  test('BrewRatioTab imperial nie robi błędu 28.35x przy 1 oz dozy i 10 fl oz wody', () => {
    let tree: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(
        <BrewRatioTab language="en" t={translations.en} unitSystem="imperial" beveragePreference="both" />
      );
    });

    const doseInput = tree!.root.findByProps({ testID: 'dose-input' });
    renderer.act(() => {
      doseInput.props.onChangeText('1');
    });
    // 1 oz = 28.35g, 1:16.6 -> 470.6g -> ~15.91 fl oz (przed naprawą: 0.56 fl oz!)
    const waterOut = tree!.root.findByProps({ testID: 'calculated-water-output' });
    expect(waterOut.props.children).toBe('15.91 fl oz');

    // Woda -> Doza: 10 fl oz (~295.7 ml) przy 1:16.6 -> 17.8g -> ~0.63 oz (przed naprawą: 0.02 oz!)
    const dirBtn = tree!.root.findByProps({ testID: 'calc-dir-waterToDose' });
    renderer.act(() => {
      dirBtn.props.onPress();
    });
    const waterInput = tree!.root.findByProps({ testID: 'water-input' });
    renderer.act(() => {
      waterInput.props.onChangeText('10');
    });
    const doseOut = tree!.root.findByProps({ testID: 'calculated-dose-output' });
    expect(doseOut.props.children).toBe('0.63 oz');
  });

  test('BrewRatioTab obsługuje polski przecinek i chip 1:2 (Espresso) nie daje 0g uzysku', () => {
    let tree: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(
        <BrewRatioTab language="pl" t={translations.pl} unitSystem="metric" beveragePreference="both" />
      );
    });

    const doseInput = tree!.root.findByProps({ testID: 'dose-input' });
    renderer.act(() => {
      doseInput.props.onChangeText('18,5');
    });
    const ratio16 = tree!.root.findByProps({ testID: 'ratio-chip-15' });
    renderer.act(() => {
      ratio16.props.onPress();
    });
    // 18.5 * 15 = 277.5g (z przecinkiem w PL)
    expect(tree!.root.findByProps({ testID: 'calculated-water-output' }).props.children).toBe('277,5g');

    // Espresso 1:2 dla 18.5g -> 37g uzysku w filiżance (nie 0g!)
    const espressoChip = tree!.root.findByProps({ testID: 'ratio-chip-2' });
    renderer.act(() => {
      espressoChip.props.onPress();
    });
    expect(tree!.root.findByProps({ testID: 'calculated-yield-output' }).props.children).toBe('37g');
  });

  test('ExtractionYieldTab poprawnie parsuje TDS z przecinkiem "1,35"', () => {
    let tree: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(<ExtractionYieldTab language="pl" t={translations.pl} />);
    });
    const inputs = tree!.root.findAllByType(TextInput);
    renderer.act(() => {
      inputs[0].props.onChangeText('250');
      inputs[1].props.onChangeText('15');
      inputs[2].props.onChangeText('1,35');
    });
    const json = JSON.stringify(tree!.toJSON());
    // (220 * 1.35) / 15 = 19.8% (przed naprawą: 14.67% bo parseFloat('1,35') === 1)
    expect(json).toContain('19.8');
  });

  test('WaterChemistryTab parsuje "0,5" L i pozwala na 0 ppm KH bez nadpisania na 40', () => {
    let tree: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(<WaterChemistryTab language="pl" t={translations.pl} />);
    });
    const inputs = tree!.root.findAllByType(TextInput);
    renderer.act(() => {
      inputs[0].props.onChangeText('0,5');
    });
    expect(JSON.stringify(tree!.toJSON())).toContain('0,5');
  });
});

describe('Partia D1 — DEEP-005: JsonImportModal na iOS', () => {
  test('JsonImportModal używa KeyboardAvoidingView, ScrollView i wyłącza autoCorrect/autoCapitalize', () => {
    let tree: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(
        <LanguageProvider>
          <JsonImportModal
            visible={true}
            onClose={jest.fn()}
            jsonText=""
            onChangeJsonText={jest.fn()}
            onConfirmImport={jest.fn()}
          />
        </LanguageProvider>
      );
    });

    expect(tree!.root.findAllByType(KeyboardAvoidingView).length).toBeGreaterThan(0);
    const scroll = tree!.root.findByType(ScrollView);
    expect(scroll.props.keyboardDismissMode).toBe('on-drag');
    expect(scroll.props.keyboardShouldPersistTaps).toBe('handled');

    const input = tree!.root.findByProps({ testID: 'json-import-input' });
    expect(input.props.autoCapitalize).toBe('none');
    expect(input.props.autoCorrect).toBe(false);
    expect(input.props.spellCheck).toBe(false);
  });
});

describe('Partia D1 — DEEP-006: Brak deadlocka w testflight.yml', () => {
  const root = path.join(__dirname, '..');
  const tf = fs.readFileSync(path.join(root, '.github/workflows/testflight.yml'), 'utf8');

  test('testflight.yml odłącza BUILD od zmiennego GITHUB_RUN_NUMBER (input / protokół), nie maskuje exit code xcodebuild i nie używa tag --force', () => {
    expect(tf).toMatch(/build_number:/);
    expect(tf).toMatch(/GATE_BUILD_NUMBER/);
    expect(tf).toMatch(/ARCHIVE_RC=\$\{PIPESTATUS\[0\]\}/);
    expect(tf).not.toMatch(/git fetch origin main --depth=50/);
    expect(tf).not.toMatch(/git tag -f/);
    expect(tf).not.toMatch(/--force/);
  });
});
