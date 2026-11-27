// ============================================================================
// Napar — Regression Tests: Partia D1 (DEEP-001..DEEP-006 — wszystkie 6 P0)
// ============================================================================

import React from 'react';
import renderer from 'react-test-renderer';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFileSync, spawnSync } from 'child_process';
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

describe('Partia D1 — DEEP-001: ProcedureModal dla SavedRecipe, scaledSteps, resetCurrentStep i servings', () => {
  test('BrewModalsContainer przekazuje wszystkie scaledSteps dla SavedRecipe, nie wznawia pauzy przy zmianie kroku i woła resetCurrentStep', () => {
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

    const resumeTimer = jest.fn();
    const nextStep = jest.fn();
    const previousStep = jest.fn();
    const resetCurrentStep = jest.fn();

    const workflow: any = {
      recipe: savedRecipeFromDb,
      scaledSteps,
      snapshot: {
        status: 'paused',
        currentStepIndex: 1,
        currentStep: scaledSteps[1],
        totalSteps: 3,
        stepElapsedSeconds: 15,
        stepRemainingSeconds: 30,
        stepProgress: 0.33,
        totalElapsedSeconds: 60,
        currentWaterGrams: 166,
        previousWaterGrams: 100,
        targetWaterGrams: 300,
        recommendedPourRate: 4.4,
        isLastStep: false,
      },
      isRunning: false,
      unitSystem: 'metric',
      language: 'pl',
      pauseTimer: jest.fn(),
      resumeTimer,
      adjustStepDuration: jest.fn(),
      resetCurrentStep,
      previousStep,
      nextStep,
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
    expect(counter.props.children).toBe('KROK 2 Z 3');
    const water = tree!.root.findByProps({ testID: 'procedure-target-water' });
    expect(water.props.children).toBe('300g');

    // Nawigacja kroków na pauzie nie wymusza resumeTimer()
    const nextBtn = tree!.root.findByProps({ testID: 'procedure-next-step-btn' });
    const prevBtn = tree!.root.findByProps({ testID: 'procedure-prev-step-btn' });
    const resetStepBtn = tree!.root.findByProps({ testID: 'procedure-reset-step-btn' });
    renderer.act(() => {
      nextBtn.props.onPress();
      prevBtn.props.onPress();
      resetStepBtn.props.onPress();
    });
    expect(nextStep).toHaveBeenCalledTimes(1);
    expect(previousStep).toHaveBeenCalledTimes(1);
    expect(resumeTimer).not.toHaveBeenCalled();
    expect(resetCurrentStep).toHaveBeenCalledWith(45);
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

  test('BrewProvider.reloadFromDatabase zachowuje aktywny stoper przy mutacji innych danych, a aktualizuje zmienioną/usuniętą recepturę', () => {
    jest.useFakeTimers();
    const dbMod = require('../src/data/database');
    const { BrewProvider, useBrew } = require('../src/core/brew-context');

    const getPrefSpy = jest.spyOn(dbMod, 'getBeveragePreference').mockReturnValue('both');
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

      // 1. Aktywny stoper na domyślnej MasterRecipe NIE może zostać zresetowany przez reloadFromDatabase()
      renderer.act(() => {
        ctx.startTimer();
      });
      renderer.act(() => {
        jest.advanceTimersByTime(5_000);
      });
      expect(ctx.snapshot.status).toBe('running');
      expect(ctx.snapshot.totalElapsedSeconds).toBe(5);

      renderer.act(() => {
        ctx.reloadFromDatabase();
      });
      expect(ctx.snapshot.status).toBe('running');
      expect(ctx.snapshot.totalElapsedSeconds).toBe(5);
      expect('steps' in ctx.recipe).toBe(true); // MasterRecipe zachowane (nie zdegradowane do SavedRecipe)

      // 2. Usunięta paczka i usunięta własna receptura są czyszczone/zastępowane
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
      expect(ctx.selectedInventoryItem).toBeNull();
      expect(ctx.recipe.id).not.toBe('deleted-custom-rec');

      // 3. Edytowana SavedRecipe aktualizuje także doseGrams / waterGrams
      const savedV1 = {
        id: 'custom-edit-1',
        name: 'Mój V60 v1',
        beverageType: 'COFFEE' as const,
        method: 'V60',
        doseGrams: 15,
        waterGrams: 250,
        waterTempCelsius: 93,
        recommendedRatio: 16.7,
        stepsJson: JSON.stringify([{ stepNumber: 1, namePl: 'Zalanie', targetWaterGrams: 250, durationSeconds: 60, instructionPl: 'Zalej' }]),
        isCustom: true,
        isFavorite: false,
        createdAt: '2026-11-01T00:00:00.000Z',
      };
      renderer.act(() => {
        ctx.selectRecipe(savedV1);
      });
      getRecSpy.mockReturnValue({ ...savedV1, name: 'Mój V60 v2', doseGrams: 18, waterGrams: 300 });
      renderer.act(() => {
        ctx.reloadFromDatabase();
      });
      expect(ctx.recipe.name).toBe('Mój V60 v2');
      expect(ctx.doseGrams).toBe(18);
      expect(ctx.waterGrams).toBe(300);

      // 4. Zmiana beveragePreference na 'tea' po imporcie przełącza przepis kawowy na herbaciany
      getPrefSpy.mockReturnValue('tea');
      renderer.act(() => {
        ctx.reloadFromDatabase();
      });
      expect(ctx.beveragePreference).toBe('tea');
      const isTeaAfter = 'beverageType' in ctx.recipe ? ctx.recipe.beverageType === 'TEA' : ctx.recipe.type === 'TEA';
      expect(isTeaAfter).toBe(true);

      renderer.act(() => {
        tree!.unmount();
      });
    } finally {
      jest.useRealTimers();
      getPrefSpy.mockRestore();
      getSettingSpy.mockRestore();
      getInvSpy.mockRestore();
      getRecSpy.mockRestore();
    }
  });

  test('useBrewWorkflow.handleServingsChange ustawia dokładną wagę wody (500g dla 2x Hoffmann V60, nie 500.1g)', () => {
    const { BrewProvider } = require('../src/core/brew-context');
    const { useBrewWorkflow } = require('../src/hooks/useBrewWorkflow');
    const { MASTER_RECIPES } = require('../src/core/recipes-data');
    const hoffmann = MASTER_RECIPES.find((r: any) => r.id === 'v60-hoffmann-single');
    expect(hoffmann).toBeTruthy();
    let wf: any;
    const Probe = () => {
      wf = useBrewWorkflow();
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
      wf.selectRecipe(hoffmann);
    });
    renderer.act(() => {
      wf.handleServingsChange(2);
    });
    expect(wf.doseGrams).toBe(30);
    expect(wf.waterGrams).toBe(500);
    renderer.act(() => {
      tree!.unmount();
    });
  });
});

describe('Partia D1 — DEEP-003 & DEEP-004: Polski przecinek + BrewRatioTab imperial + Espresso 1:2', () => {
  test('parseLocaleFloat (w tym wiodący przecinek ",5"), domain-rules i konwertery imperialne działają poprawnie', () => {
    expect(parseLocaleFloat('18,5')).toBe(18.5);
    expect(parseLocaleFloat('1,35')).toBe(1.35);
    expect(parseLocaleFloat('0,5')).toBe(0.5);
    expect(parseLocaleFloat(',5')).toBe(0.5);
    expect(parseLocaleFloat('.25')).toBe(0.25);
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
    expect(tree!.root.findByProps({ testID: 'calculated-water-output' }).props.children).toBe('15.91 fl oz');

    const dirBtn = tree!.root.findByProps({ testID: 'calc-dir-waterToDose' });
    renderer.act(() => {
      dirBtn.props.onPress();
    });
    const waterInput = tree!.root.findByProps({ testID: 'water-input' });
    renderer.act(() => {
      waterInput.props.onChangeText('10');
    });
    expect(tree!.root.findByProps({ testID: 'calculated-dose-output' }).props.children).toBe('0.63 oz');
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
    const ratio15 = tree!.root.findByProps({ testID: 'ratio-chip-15' });
    renderer.act(() => {
      ratio15.props.onPress();
    });
    expect(tree!.root.findByProps({ testID: 'calculated-water-output' }).props.children).toBe('277,5g');

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
    expect(JSON.stringify(tree!.toJSON())).toContain('19,8');
  });

  test('WaterChemistryTab realnie przelicza połowę minerałów dla "0,5" L i pozwala na 0 ppm KH bez nadpisania na 40', () => {
    let tree: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(<WaterChemistryTab language="pl" t={translations.pl} />);
    });
    // Domyślnie Barista Hustle 80/40 dla 1.0 L -> koncentrat buforu 40 g, twardości 80 g
    const initialJson = JSON.stringify(tree!.toJSON());
    expect(initialJson).toContain('"40"," g"');
    expect(initialJson).toContain('"80"," g"');

    // Zmiana objętości na polski przecinek "0,5" L -> połowa: 20 g buforu i 40 g twardości
    const volInput = tree!.root.findAllByType(TextInput)[0];
    renderer.act(() => {
      volInput.props.onChangeText('0,5');
    });
    const halfJson = JSON.stringify(tree!.toJSON());
    expect(halfJson).toContain('"20"," g"');
    expect(halfJson).toContain('"40"," g"');

    // Przełącz na profil własny i wpisz KH = "0" -> bufor = 0 g (przed naprawą: || 40 wymuszało 40 ppm -> 20 g!)
    const customBtn = tree!.root.findByProps({ accessibilityLabel: translations.pl.water.customProfile });
    renderer.act(() => {
      customBtn.props.onPress();
    });
    const inputsAfterCustom = tree!.root.findAllByType(TextInput);
    // [0]=vol, [1]=GH, [2]=KH
    renderer.act(() => {
      inputsAfterCustom[2].props.onChangeText('0');
    });
    const zeroKhJson = JSON.stringify(tree!.toJSON());
    expect(zeroKhJson).toContain('"0"," g"');
    expect(zeroKhJson).toContain('0 ppm');
  });
});

describe('Partia D1 — DEEP-005: JsonImportModal iOS + przeładowanie stanu SettingsScreen po imporcie', () => {
  test('JsonImportModal używa KeyboardAvoidingView, ScrollView, wyłącza autoCorrect/autoCapitalize i przekazuje onDismiss', () => {
    const onDismiss = jest.fn();
    let tree: renderer.ReactTestRenderer;
    renderer.act(() => {
      tree = renderer.create(
        <LanguageProvider>
          <JsonImportModal
            visible={true}
            onClose={jest.fn()}
            onDismiss={onDismiss}
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

describe('Partia D1 — DEEP-006: testflight.yml i uruchomieniowe testy require-green-runs.mjs', () => {
  const root = path.join(__dirname, '..');
  const tf = fs.readFileSync(path.join(root, '.github/workflows/testflight.yml'), 'utf8');
  const gateScript = path.join(root, '.github/scripts/require-green-runs.mjs');
  const CI = '.github/workflows/ci.yml';
  const E2E = '.github/workflows/e2e-ios.yml';

  test('testflight.yml odłącza BUILD od GITHUB_RUN_NUMBER, poprawnie zwraca błąd z Archive i nie nadpisuje tagów --force', () => {
    expect(tf).toMatch(/build_number:/);
    expect(tf).toMatch(/GATE_BUILD_NUMBER/);
    expect(tf).toMatch(/exit \$\(\(ARCHIVE_RC != 0 \? ARCHIVE_RC : 1\)\)/);
    expect(tf).not.toMatch(/git fetch origin main --depth=50/);
    expect(tf).not.toMatch(/git tag -f/);
    expect(tf).not.toMatch(/--force/);
  });

  test('require-green-runs.mjs akceptuje zielone E2E na przodku gdy diff dotyka tylko docs/jakosc/, a odrzuca przy zmianie kodu lub czerwonym E2E', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'deep006-gate-'));
    try {
      const git = (...args: string[]) =>
        execFileSync('git', args, {
          cwd: tmpDir,
          encoding: 'utf8',
          env: {
            ...process.env,
            GIT_AUTHOR_NAME: 'Test',
            GIT_AUTHOR_EMAIL: 'test@example.com',
            GIT_COMMITTER_NAME: 'Test',
            GIT_COMMITTER_EMAIL: 'test@example.com',
          },
        }).trim();

      git('init');
      fs.mkdirSync(path.join(tmpDir, 'src'), { recursive: true });
      fs.mkdirSync(path.join(tmpDir, 'docs', 'jakosc'), { recursive: true });
      fs.writeFileSync(path.join(tmpDir, 'src', 'app.ts'), 'export const a = 1;\n');
      git('add', '.');
      git('commit', '-m', 'base code');
      const codeSha = git('rev-parse', 'HEAD');

      // Commit 2: wyłącznie docs/jakosc/
      fs.writeFileSync(path.join(tmpDir, 'docs', 'jakosc', '1029.md'), '# Protokół 1029\n');
      git('add', '.');
      git('commit', '-m', 'docs protocol');
      const docsSha = git('rev-parse', 'HEAD');

      // Commit 3: zmiana w kodzie src/
      fs.writeFileSync(path.join(tmpDir, 'src', 'app.ts'), 'export const a = 2;\n');
      git('add', '.');
      git('commit', '-m', 'code change');
      const codeChangeSha = git('rev-parse', 'HEAD');

      const runWithFakeGh = (targetSha: string, bySha: Record<string, object[]>) => {
        const binDir = fs.mkdtempSync(path.join(tmpDir, 'gh-'));
        fs.writeFileSync(path.join(binDir, 'runs.json'), JSON.stringify(bySha));
        const ghStub = `#!/usr/bin/env node
const fs = require('fs');
const url = process.argv[3] || '';
const m = url.match(/head_sha=([0-9a-f]{40})/);
const db = JSON.parse(fs.readFileSync(${JSON.stringify(path.join(binDir, 'runs.json'))}, 'utf8'));
const runs = (m && db[m[1]]) || [];
process.stdout.write(JSON.stringify({ total_count: runs.length, workflow_runs: runs }));
`;
        fs.writeFileSync(path.join(binDir, 'gh'), ghStub);
        fs.chmodSync(path.join(binDir, 'gh'), 0o755);
        return spawnSync(process.execPath, [gateScript, 'lkarwowski494/napar', targetSha], {
          cwd: tmpDir,
          encoding: 'utf8',
          env: { PATH: `${binDir}:${process.env.PATH}` },
        });
      };

      const mkRun = (wf: string, sha: string, conclusion: string) => ({
        id: 1,
        path: wf,
        head_sha: sha,
        status: 'completed',
        conclusion,
        created_at: '2026-11-26T10:00:00Z',
        html_url: `run-${wf}-${sha}`,
      });

      // 1) docsSha ma zielone CI, a codeSha (różnica tylko docs/jakosc/) ma zielone E2E -> PASS
      const ok = runWithFakeGh(docsSha, {
        [docsSha]: [mkRun(CI, docsSha, 'success')],
        [codeSha]: [mkRun(E2E, codeSha, 'success')],
      });
      expect(ok.status).toBe(0);

      // 2) docsSha ma zielone CI, ale przodek codeSha ma CZERWONE E2E -> FAIL
      const redAnc = runWithFakeGh(docsSha, {
        [docsSha]: [mkRun(CI, docsSha, 'success')],
        [codeSha]: [mkRun(E2E, codeSha, 'failure')],
      });
      expect(redAnc.status).toBe(1);

      // 3) codeChangeSha zmienił src/app.ts -> NIE może odziedziczyć E2E z codeSha -> FAIL
      const blockedCodeChange = runWithFakeGh(codeChangeSha, {
        [codeChangeSha]: [mkRun(CI, codeChangeSha, 'success')],
        [codeSha]: [mkRun(E2E, codeSha, 'success')],
      });
      expect(blockedCodeChange.status).toBe(1);
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
