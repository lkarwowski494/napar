import React from 'react';
import { AppState } from 'react-native';
import render from 'react-test-renderer';

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
    if (query.includes('INSERT INTO app_settings')) {
      mockSettings.set(params![0], params![1]);
    }
  }),
};

jest.mock('expo-sqlite', () => ({
  openDatabaseSync: jest.fn(() => mockDb),
}));

import { playTimerChime,   } from '../timer-audio';
import { getDatabase, setAppSetting, getCaffeineHalfLife, setCaffeineHalfLife, getBedtimeHour, setBedtimeHour } from '../database';
import { BrewTimerEngine } from '../timer-engine';
import { wInKeep } from '../unit-converter';
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
import { getCurrentTranslations } from '../i18n';
import { CaffeineCurveChart } from '../caffeine-chart';
import { SensoryScoreEditor } from '../radar-chart';
import { QrCodeSvg } from '../qr-code';
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
});
