// ============================================================================
// Napar (Steepwise) — Kontrakt Live Activity: TypeScript <-> Swift, konfiguracja i no-op mostu.
// Kompilacji Swift nie da się wykonać na Linuksie, więc pilnujemy zgodności nazw pól i plików.
// ============================================================================

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  buildLiveActivityContentState,
  LiveActivityContentState,
} from '../src/core/live-activity';

const root = process.cwd();
const read = (rel: string) => readFileSync(join(root, rel), 'utf8');

const moduleSwiftRel = 'modules/napar-live-activity/ios/NaparLiveActivityModule.swift';
const attributesModuleRel = 'modules/napar-live-activity/ios/NaparTimerAttributes.swift';
const attributesWidgetRel = 'targets/napar-widget/NaparTimerAttributes.swift';

/** Nazwy pól rekordu Expo (@Field var nazwa) w kolejności występowania w fragmencie pliku. */
const recordFields = (swiftFragment: string): string[] =>
  [...swiftFragment.matchAll(/@Field var (\w+):/g)].map((m) => m[1]).sort();

const contentKeys = Object.keys(
  buildLiveActivityContentState(
    { status: 'paused', currentStepIndex: 0, totalSteps: 1, currentStep: { namePl: 'x' }, stepRemainingSeconds: 1, stepEndAtMs: null },
    0,
    'pl'
  ) as LiveActivityContentState
).sort();

const attributeKeys = ['beverageType', 'language', 'recipeName'];

describe('kontrakt Swift <-> TypeScript', () => {
  const moduleSwift = read(moduleSwiftRel);
  const [startPart, contentPart] = moduleSwift.split('struct ContentRecord: Record');

  test('rekord startu zawiera atrybuty i pola stanu, w nazwach zgodnych z NativeStartPayload', () => {
    expect(recordFields(startPart)).toEqual([...attributeKeys, ...contentKeys].sort());
  });

  test('rekord stanu ma dokładnie pola ContentState używane przez JS (update)', () => {
    expect(recordFields(contentPart)).toEqual(contentKeys);
  });

  test('atrybuty ActivityKit są identyczne w module i w widżecie (wiązanie po nazwie typu)', () => {
    expect(read(attributesWidgetRel)).toBe(read(attributesModuleRel));
  });

  test('pola ContentState w atrybutach Swift odpowiadają polom stanu w TypeScript', () => {
    const attrs = read(attributesModuleRel);
    const stateFields = [...attrs.matchAll(/^\s{4}var (\w+):/gm)].map((m) => m[1]).sort();
    expect(stateFields).toEqual(contentKeys);
  });

  test('moduł Expo rejestruje nazwę używaną przez JS i klasę wpisaną w expo-module.config.json', () => {
    expect(moduleSwift).toContain('Name("NaparLiveActivity")');
    expect(moduleSwift).toContain('public class NaparLiveActivityModule: Module');
    const config = JSON.parse(read('modules/napar-live-activity/expo-module.config.json'));
    expect(config.platforms).toEqual(['apple']);
    expect(config.apple.modules).toEqual(['NaparLiveActivityModule']);
    expect(existsSync(join(root, 'modules/napar-live-activity', config.apple.podspecPath))).toBe(true);
  });

  test('wszystkie funkcje mostu z interfejsu JS mają odpowiednik w module Swift', () => {
    for (const fn of ['start', 'update', 'end', 'endAll']) {
      expect(moduleSwift).toContain(`AsyncFunction("${fn}")`);
    }
  });
});

describe('konfiguracja widżetu i napisów PL/EN', () => {
  test('target widżetu: typ widget, iOS 16.2+, frameworki ActivityKit i WidgetKit', () => {
    const target = require(join(root, 'targets/napar-widget/expo-target.config.js'));
    expect(target.type).toBe('widget');
    expect(target.deploymentTarget).toBe('16.2');
    expect(target.frameworks).toEqual(expect.arrayContaining(['ActivityKit', 'WidgetKit', 'SwiftUI']));
  });

  test('klucze napisów widżetu są identyczne w pl.lproj i en.lproj', () => {
    const keysOf = (rel: string) =>
      [...read(rel).matchAll(/^"([^"]+)"\s*=/gm)].map((m) => m[1]).sort();
    const pl = keysOf('targets/napar-widget/pl.lproj/Localizable.strings');
    const en = keysOf('targets/napar-widget/en.lproj/Localizable.strings');
    expect(pl.length).toBeGreaterThan(0);
    expect(pl).toEqual(en);
  });

  test('widżet używa tylko kluczy, które istnieją w napisach', () => {
    const views = read('targets/napar-widget/NaparLiveActivityWidget.swift');
    const used = [...views.matchAll(/"(live\.[A-Za-z]+)"/g)].map((m) => m[1]);
    const defined = [...read('targets/napar-widget/pl.lproj/Localizable.strings').matchAll(/^"([^"]+)"/gm)].map((m) => m[1]);
    expect(used.length).toBeGreaterThan(0);
    for (const key of used) expect(defined).toContain(key);
  });
});

describe('konfiguracja app.json (Live Activity bez zbędnych uprawnień)', () => {
  const expo = JSON.parse(read('app.json')).expo;

  test('NSSupportsLiveActivities = true i wtyczka apple-targets są włączone', () => {
    expect(expo.ios.infoPlist.NSSupportsLiveActivities).toBe(true);
    expect(expo.plugins).toContain('@bacons/apple-targets');
  });

  test('nie dodano kluczy zdrowia, lokalizacji ani śledzenia', () => {
    const keys = Object.keys(expo.ios.infoPlist);
    expect(keys.filter((k) => k.startsWith('NSHealth'))).toEqual([]);
    expect(keys).not.toContain('NSUserTrackingUsageDescription');
    expect(keys).not.toContain('NSLocationWhenInUseUsageDescription');
    expect(keys).not.toContain('NSMicrophoneUsageDescription');
  });

  test('zmiana nie dodaje uprawnień Android', () => {
    expect(expo.android.permissions).toEqual([
      'android.permission.CAMERA',
      'android.permission.VIBRATE',
      'android.permission.WAKE_LOCK',
    ]);
  });
});

describe('most natywny bez modułu (Expo Go, Android, starszy iOS): no-op bez błędu', () => {
  afterEach(() => {
    jest.resetModules();
    jest.dontMock('expo-modules-core');
  });

  test('gdy natywnego modułu nie ma, wszystkie wywołania zwracają wartości zastępcze', async () => {
    jest.resetModules();
    jest.doMock('expo-modules-core', () => ({ requireOptionalNativeModule: () => null }));
    const bridge = require('../modules/napar-live-activity');
    await expect(bridge.startLiveActivity({} as never)).resolves.toBeNull();
    await expect(bridge.updateLiveActivity('id', {} as never)).resolves.toBe(false);
    await expect(bridge.endLiveActivity('id')).resolves.toBe(false);
    await expect(bridge.endAllLiveActivities()).resolves.toBe(false);
  });

  test('gdy moduł jest, wywołania przechodzą do natywnej części, a wyjątek daje wartość zastępczą', async () => {
    const native = {
      start: jest.fn(async () => 'act-9'),
      update: jest.fn(async () => true),
      end: jest.fn(async () => true),
      endAll: jest.fn(async () => true),
    };
    jest.resetModules();
    jest.doMock('expo-modules-core', () => ({ requireOptionalNativeModule: () => native }));
    const bridge = require('../modules/napar-live-activity');
    const payload = {
      recipeName: 'V60',
      beverageType: 'COFFEE',
      language: 'pl',
      stepName: 'Zalanie',
      endAtMs: 1,
      pourIndex: 1,
      pourTotal: 2,
      isPaused: false,
      pausedRemainingMs: 0,
    };
    await expect(bridge.startLiveActivity(payload)).resolves.toBe('act-9');
    await expect(bridge.updateLiveActivity('act-9', payload)).resolves.toBe(true);
    await expect(bridge.endLiveActivity('act-9')).resolves.toBe(true);
    await expect(bridge.endAllLiveActivities()).resolves.toBe(true);
    expect(native.start).toHaveBeenCalledWith(payload);

    native.start.mockRejectedValueOnce(new Error('ActivityKit'));
    native.end.mockRejectedValueOnce(new Error('ActivityKit'));
    native.update.mockRejectedValueOnce(new Error('ActivityKit'));
    native.endAll.mockRejectedValueOnce(new Error('ActivityKit'));
    await expect(bridge.startLiveActivity(payload)).resolves.toBeNull();
    await expect(bridge.updateLiveActivity('act-9', payload)).resolves.toBe(false);
    await expect(bridge.endLiveActivity('act-9')).resolves.toBe(false);
    await expect(bridge.endAllLiveActivities()).resolves.toBe(false);
  });
});
