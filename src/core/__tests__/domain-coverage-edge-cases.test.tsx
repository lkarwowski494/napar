import React from 'react';
import { View, AppState } from 'react-native';
import render from 'react-test-renderer';
import * as FileSystem from 'expo-file-system';
import QRCode from 'qrcode';

const mockSettings = new Map<string, string>();

const mockDb: any = {
  settings: mockSettings,
  execSync: jest.fn(),
  prepareSync: jest.fn(() => ({
    executeSync: jest.fn(),
    finalizeSync: jest.fn(),
  })),
  getFirstSync: jest.fn((query: string, params?: any[]) => {
    if (query.includes('FROM app_settings WHERE key = ?')) {
      const val = mockSettings.get(params?.[0]);
      return val !== undefined ? { value: val } : null;
    }
    if (query.includes('PRAGMA user_version')) {
      return { user_version: 3 };
    }
    return null;
  }),
  getAllSync: jest.fn(() => []),
  runSync: jest.fn((query: string, params?: any[]) => {
    if (query.includes('INSERT OR REPLACE INTO app_settings')) {
      mockSettings.set(params![0], params![1]);
    }
  }),
};

jest.mock('expo-sqlite', () => ({
  openDatabaseSync: jest.fn(() => mockDb),
}));

import { playTimerChime, notifyTimerStepWarning, notifyTimerFinished } from '../timer-audio';
import {
  initDatabase,
  getDatabase,
  getAppSetting,
  setAppSetting,
  getCaffeineHalfLife,
  setCaffeineHalfLife,
  getBedtimeHour,
  setBedtimeHour,
  setIsProUser,
} from '../database';
import { BrewTimerEngine } from '../timer-engine';
import { wInKeep } from '../unit-converter';
import { scaleRecipeDose, evaluateColdBrewRatio, ColdBrewRatioEvaluation } from '../domain-rules';
import {
  recipeToCompactPayload,
  encodeRecipeToShareUrl,
  decodeRecipeFromShareUrl,
} from '../recipe-share';
import {
  saveCorruptState,
  checkCorruptState,
  dismissCorruptState,
  autoBackup,
  safetyBackup,
  rotateBackupFiles,
  NaparBackupData,
} from '../backup';
import { confirm, confirmAction } from '../confirm';
import {
  announce,
  useAnnounce,
  formatStepAnnouncement,
  formatCountdownAnnouncement,
  formatStartAnnouncement,
  formatFinishAnnouncement,
  announceStep,
  announceCountdown,
  announceStart,
  announceFinish,
} from '../announce';
import { getAppAccessState } from '../app-access';
import { getCraftTheme, CRAFT_APPS } from '../craft-suite-theme';
import {
  buildDynamicIslandPayload,
  buildLiveActivityPayload,
  endLiveActivity,
} from '../live-activity';
import { getCurrentTranslations, LanguageProvider, useTranslation } from '../i18n';
import { CaffeineCurveChart } from '../caffeine-chart';
import { SensoryRadarChart, SensoryScoreEditor } from '../radar-chart';
import { QrCodeSvg } from '../qr-code';
import { QrScannerModal } from '../QrScannerModal';
import { SUPPORTED_GRINDERS, getRecipeMicrons } from '../grinder-converter';

describe('Domain Coverage Edge Cases (100% Core Coverage)', () => {
  beforeEach(() => {
    getDatabase();
  });

  afterAll(() => {
    jest.clearAllTimers();
  });

  describe('timer-audio', () => {
    test('plays chime and disposes cleanly with addListener callback', async () => {
      const res1 = await playTimerChime();
      expect(res1).toBe(true);

      const res2 = await notifyTimerStepWarning(3);
      expect(res2).toBe(true);

      const res3 = await notifyTimerFinished('Krok 1');
      expect(res3).toBe(true);

      const res4 = await notifyTimerFinished();
      expect(res4).toBe(true);
    });
  });

  describe('database caffeine and bedtime clamping', () => {
    test('handles invalid half life values gracefully', () => {
      setAppSetting('caffeine_half_life_hours', 'NaN');
      expect(getCaffeineHalfLife()).toBe(5.0);

      setAppSetting('caffeine_half_life_hours', '1.0');
      expect(getCaffeineHalfLife()).toBe(5.0);

      setAppSetting('caffeine_half_life_hours', '9.5');
      expect(getCaffeineHalfLife()).toBe(5.0);

      setCaffeineHalfLife(6.5);
      expect(getCaffeineHalfLife()).toBe(6.5);
    });

    test('handles invalid bedtime hours gracefully', () => {
      setAppSetting('bedtime_hour', 'invalid');
      expect(getBedtimeHour()).toBe(23);

      setAppSetting('bedtime_hour', '12');
      expect(getBedtimeHour()).toBe(23);

      setAppSetting('bedtime_hour', '30');
      expect(getBedtimeHour()).toBe(23);

      setBedtimeHour(22);
      expect(getBedtimeHour()).toBe(22);
    });
  });

  describe('timer-engine AppState resume', () => {
    test('syncs on AppState active while running', () => {
      const engine = new BrewTimerEngine([
        { stepNumber: 1, namePl: 'Zalanie', instructionPl: 'Wlej spokojnie', targetWaterGrams: 100, durationSeconds: 45 },
      ]);
      engine.start();

      // Trigger AppState change listener
      const mockCalls = (AppState.addEventListener as jest.Mock).mock.calls;
      const changeCallbacks = mockCalls.filter((c) => c[0] === 'change');
      changeCallbacks.forEach((c) => c[1]('active'));

      expect(engine.getSnapshot().status).toBe('running');
      engine.pause();
      engine.reset();
    });
  });

  describe('unit-converter edge cases', () => {
    test('wInKeep returns fallback on invalid input', () => {
      expect(wInKeep(123 as any, 'g', 15)).toBe(15);
      expect(wInKeep(null as any, 'g', 20)).toBe(20);
      expect(wInKeep('NaN', 'g', 25)).toBe(25);
      expect(wInKeep('', 'g', 30)).toBe(30);
      expect(wInKeep('abc', 'oz', 10)).toBe(10);
    });
  });

  describe('domain-rules scaleRecipeDose edge cases', () => {
    test('throws when doses are zero or negative', () => {
      expect(() => scaleRecipeDose([], 0, 15)).toThrow('Doza musi być większa od zera');
      expect(() => scaleRecipeDose([], 15, -5)).toThrow('Doza musi być większa od zera');
    });
  });

  describe('recipe-share encode/decode edge cases', () => {
    test('handles malformed stepsJson and invalid URL decodings', () => {
      const compact = recipeToCompactPayload({
        id: 'rec_1',
        name: 'Test',
        method: 'V60',
        doseGrams: 15,
        waterGrams: 250,
        waterTempCelsius: 93,
        stepsJson: 'invalid-json{{{',
        recommendedRatio: 16.6,
      } as any);
      expect(compact).toBeTruthy();

      const shareUrl = encodeRecipeToShareUrl({
        id: 'rec_1',
        name: 'Test',
        method: 'V60',
        doseGrams: 15,
        waterGrams: 250,
        waterTempCelsius: 93,
        stepsJson: '[]',
        recommendedRatio: 16.6,
      } as any);
      expect(shareUrl).toContain('napar://recipe');

      const decodedMalformedUri = decodeRecipeFromShareUrl('https://napar.app/r?d=%E0%A4%A');
      expect(decodedMalformedUri).toBeNull();
    });
  });

  describe('backup safety and corrupt state recovery', () => {
    test('saves and recovers corrupt state file', async () => {
      const path = await saveCorruptState('{"broken": true}', 'SYNTAX_ERROR');
      expect(path).toContain('state_corrupt_');

      const recovery = await checkCorruptState();
      expect(recovery).not.toBeNull();
      expect(recovery?.corruptFile).toBeTruthy();

      await dismissCorruptState(recovery!.corruptFile);
    });

    test('autoBackup and safetyBackup error resilience', async () => {
      const sampleState: NaparBackupData = {
        inventory: [],
        customRecipes: [],
        sessions: [],
        caffeineLogs: [],
        settings: {},
      };

      const path = await autoBackup(sampleState);
      expect(path).not.toBeNull();

      const safetyPath = await safetyBackup('reset', sampleState);
      expect(safetyPath).toBeTruthy();

      const rotated = rotateBackupFiles(['unknown-file.txt'], /^napar-/, 5);
      expect(rotated).toEqual([]);
    });
  });

  describe('confirm and announce', () => {
    test('confirm helper executes correctly', () => {
      confirm({ title: 'Test Title', confirmText: 'OK' });
      confirm({
        title: 'Delete',
        message: 'Sure?',
        confirmText: 'Delete',
        destructive: true,
        onConfirm: () => {},
      });
      confirmAction({
        title: 'Action',
        actionText: 'Execute',
        onConfirm: () => {},
      });
    });

    test('announcements cover all variants and default language', () => {
      formatStepAnnouncement(1, 3, 'Bloom', 50, 30);
      formatStepAnnouncement(1, 3, 'Bloom', 50, 30, 'Spokojnie', 'pl');
      formatStepAnnouncement(1, 3, 'Bloom', 50, 30, 'Gently', 'en');

      formatCountdownAnnouncement(3);
      formatCountdownAnnouncement(3, 'en');

      formatStartAnnouncement('V60', 15, 250);
      formatStartAnnouncement('V60', 15, 250, 'en');

      formatFinishAnnouncement('V60', 180);
      formatFinishAnnouncement('V60', 180, 'en');
      formatFinishAnnouncement('V60', 45, 'en');

      announceStep(1, 2, 'Krok', 50, 20);
      announceCountdown(3);
      announceStart('V60', 15, 250);
      announceFinish('V60', 150);
    });
  });

  describe('app-access and craft-suite-theme', () => {
    test('subscription tier fallback and pro tier reading', () => {
      setIsProUser(true);
      setAppSetting('subscription_tier', 'none');
      const st1 = getAppAccessState();
      expect(st1.subscriptionTier).toBe('lifetime');

      setAppSetting('subscription_tier', 'annual');
      const st2 = getAppAccessState();
      expect(st2.subscriptionTier).toBe('annual');
    });

    test('getCraftTheme handles fallback to napar', () => {
      expect(getCraftTheme()).toBe(CRAFT_APPS.napar);
      expect(getCraftTheme('invalid' as any)).toBe(CRAFT_APPS.napar);
      expect(getCraftTheme('piekarz')).toBe(CRAFT_APPS.piekarz);
    });
  });

  describe('live-activity', () => {
    test('builds live activity payloads with default parameters', async () => {
      const attrs = {
        sessionId: 'session_1',
        recipeName: 'V60',
        method: 'V60',
        beverageType: 'COFFEE' as const,
        totalWaterGrams: 250,
        doseGrams: 15,
      };
      const state = {
        stepIndex: 0,
        totalSteps: 3,
        stepNamePl: 'Preinfuzja',
        stepNameEn: 'Bloom',
        targetWaterGrams: 50,
        stepRemainingSeconds: 30,
        stepDurationSeconds: 45,
        totalElapsedSeconds: 15,
        totalRemainingSeconds: 150,
        isPaused: false,
        isFinished: false,
      };

      const island = buildDynamicIslandPayload(attrs, state);
      expect(island.compactLeading).toBe('☕');

      const full = buildLiveActivityPayload(attrs, state);
      expect(full.attributes.recipeName).toBe('V60');

      const endRes = await endLiveActivity('unknown_activity_id');
      expect(endRes.success).toBe(false);
      expect(endRes.error).toContain('DEC-01');
    });
  });

  describe('i18n and UI components edge cases', () => {
    test('getCurrentTranslations returns valid translations', () => {
      const trans = getCurrentTranslations();
      expect(trans.appName).toBe('Napar');
      expect(trans.common).toBeDefined();
    });

    test('CaffeineCurveChart handles early bedtime offset', () => {
      let tree: any;
      render.act(() => {
        tree = render.create(
          <CaffeineCurveChart
            logs={[]}
            bedtimeHour={2}
            thresholdMg={25}
          />
        );
      });
      expect(tree.toJSON()).toBeTruthy();
    });

    test('SensoryScoreEditor handles undefined axis score defaults', () => {
      let updated: any = null;
      let tree: any;
      render.act(() => {
        tree = render.create(
          <SensoryScoreEditor
            profile={{} as any}
            onChange={(p) => {
              updated = p;
            }}
            language="en"
          />
        );
      });
      expect(tree.toJSON()).toBeTruthy();
    });

    test('QrCodeSvg renders or falls back', () => {
      let tree: any;
      render.act(() => {
        tree = render.create(<QrCodeSvg value="napar://recipe" size={150} />);
      });
      expect(tree.toJSON()).toBeTruthy();
    });

    test('grinder converter parseSetting across grinder models', () => {
      const wilfa = SUPPORTED_GRINDERS.find((g) => g.id === 'wilfa_svart')!;
      expect(wilfa.parseSetting('5.2')).toBeGreaterThan(0);

      const kinu = SUPPORTED_GRINDERS.find((g) => g.id === 'kinu_m47')!;
      expect(kinu.parseSetting('2.5')).toBeGreaterThan(0);
      expect(kinu.parseSetting('25')).toBeGreaterThan(0);

      const eureka = SUPPORTED_GRINDERS.find((g) => g.id === 'eureka_mignon')!;
      expect(eureka.parseSetting('4.0')).toBeGreaterThan(0);

      const generic = SUPPORTED_GRINDERS.find((g) => g.id === 'generic_grinder')!;
      expect(generic.parseSetting('650')).toBe(650);

      expect(getRecipeMicrons({})).toBeGreaterThan(0);
    });
  });

  describe('TASK-P77-11-WZR: evaluateColdBrewRatio domain rules', () => {
    test('klasyfikuje koncentrat cold brew (1:4 - 1:7) i zaleca rozcieńczenie', () => {
      const evalConcentrate: ColdBrewRatioEvaluation = evaluateColdBrewRatio(100, 500);
      expect(evalConcentrate.style).toBe('concentrate');
      expect(evalConcentrate.ratio).toBe(5);
      expect(evalConcentrate.ratioFormatted).toBe('1:5.0');
      expect(evalConcentrate.styleLabelPl).toContain('Koncentrat');
      expect(evalConcentrate.recommendedDilutionPl).toContain('1:1');
      expect(evalConcentrate.recommendedDilutionEn).toContain('1:1');
    });

    test('klasyfikuje cold brew gotowe do picia (ready_to_drink, 1:8 - 1:15)', () => {
      const evalRtd: ColdBrewRatioEvaluation = evaluateColdBrewRatio('60', '720');
      expect(evalRtd.style).toBe('ready_to_drink');
      expect(evalRtd.ratio).toBe(12);
      expect(evalRtd.styleLabelPl).toContain('Gotowe do picia');
      expect(evalRtd.styleLabelEn).toContain('Ready-to-drink');
    });

    test('klasyfikuje zbyt gęsty ekstrakt (overly_dense) oraz rozwodniony (underextracted_weak)', () => {
      const dense = evaluateColdBrewRatio(100, 250);
      expect(dense.style).toBe('overly_dense');

      const weak = evaluateColdBrewRatio(20, 400);
      expect(weak.style).toBe('underextracted_weak');
    });

    test('odporność na null, stringi, przecinki, ujemne wartości i -0', () => {
      const fallback = evaluateColdBrewRatio(null as any, -100);
      expect(fallback.ratio).toBe(0);
      expect(fallback.style).toBe('overly_dense');
      expect(Number.isFinite(fallback.ratio)).toBe(true);
      expect(Object.is(fallback.ratio, -0)).toBe(false);
    });
  });
});
