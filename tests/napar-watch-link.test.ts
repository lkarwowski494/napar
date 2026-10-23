// ============================================================================
// Napar (Steepwise) — Kontrakt Apple Watch: TypeScript <-> Swift, konfiguracja i no-op mostu.
// Kompilacji Swift nie da się wykonać na Linuksie, więc pilnujemy zgodności nazw pól,
// poleceń, faz i napisów. Właściwą kompilację sprawdza workflow ios-unsigned.
// ============================================================================

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildWatchState, toWatchPayload, WatchPhase } from '../src/core/watch-state';

const root = process.cwd();
const read = (rel: string) => readFileSync(join(root, rel), 'utf8');

const phoneModuleRel = 'modules/napar-watch-link/ios/NaparWatchLinkModule.swift';
const phoneSessionRel = 'modules/napar-watch-link/ios/WatchLinkSession.swift';
const watchDir = 'targets/napar-watch';
const watchStateRel = `${watchDir}/WatchState.swift`;
const watchClientRel = `${watchDir}/WatchLinkClient.swift`;
const watchViewsRel = `${watchDir}/WatchRootView.swift`;

const watchSwiftFiles = readdirSync(join(root, watchDir)).filter((f) => f.endsWith('.swift'));
const watchSwiftAll = watchSwiftFiles.map((f) => read(`${watchDir}/${f}`)).join('\n');

/** Nazwy pól rekordu Expo (@Field var nazwa) w kolejności występowania w pliku. */
const recordFields = (swift: string): string[] =>
  [...swift.matchAll(/@Field var (\w+):/g)].map((m) => m[1]).sort();

const payloadKeys = Object.keys(
  toWatchPayload(
    buildWatchState(
      {
        status: 'running',
        currentStepIndex: 0,
        totalSteps: 1,
        currentStep: { namePl: 'x', nameEn: 'x' },
        stepRemainingSeconds: 1,
        stepEndAtMs: 1,
      },
      0,
      'pl'
    )!
  )
).sort();

const COMMANDS = ['pause', 'resume', 'next'];
const PHASES: WatchPhase[] = ['brewing', 'paused', 'finished'];

describe('kontrakt Swift <-> TypeScript (iPhone)', () => {
  const phoneModule = read(phoneModuleRel);

  test('rekord stanu ma dokładnie klucze wiadomości z toWatchPayload (NativeWatchPayload)', () => {
    expect(recordFields(phoneModule)).toEqual(payloadKeys);
  });

  test('moduł Expo rejestruje nazwę używaną przez JS, zdarzenie i wszystkie funkcje mostu', () => {
    expect(phoneModule).toContain('Name("NaparWatchLink")');
    expect(phoneModule).toContain('Events("onWatchCommand")');
    expect(phoneModule).toContain('public class NaparWatchLinkModule: Module');
    for (const fn of ['activate', 'sendState', 'clearState']) {
      expect(phoneModule).toContain(`AsyncFunction("${fn}")`);
    }
    const jsIndex = read('modules/napar-watch-link/index.ts');
    expect(jsIndex).toContain("requireOptionalNativeModule<NativeWatchLinkModule>('NaparWatchLink')");
    expect(jsIndex).toContain("'onWatchCommand'");
  });

  test('wiadomość z zegarka niesie pole cmd, które czyta iPhone i parser w core', () => {
    const session = read(phoneSessionRel);
    expect(session).toContain('message["cmd"]');
    expect(session).toContain('replyHandler: @escaping');
    expect(read('src/core/watch-state.ts')).toContain("cmd === 'pause'");
  });

  test('konfiguracja pluginu: moduł apple i podspec istnieją', () => {
    const config = JSON.parse(read('modules/napar-watch-link/expo-module.config.json'));
    expect(config.platforms).toEqual(['apple']);
    expect(config.apple.modules).toEqual(['NaparWatchLinkModule']);
    expect(existsSync(join(root, 'modules/napar-watch-link', config.apple.podspecPath))).toBe(true);
  });
});

describe('kontrakt Swift <-> TypeScript (zegarek)', () => {
  test('zegarek czyta klucze wiadomości z WatchState.swift zgodnie z toWatchPayload', () => {
    const state = read(watchStateRel);
    const keys = [...state.matchAll(/context\["(\w+)"\]/g)].map((m) => m[1]);
    expect(new Set(keys)).toEqual(new Set(payloadKeys));
    expect(state).toContain('version != 1');
  });

  test('fazy w Swift mają te same wartości co WatchPhase w TypeScript (plus idle jako czyszczenie)', () => {
    const state = read(watchStateRel);
    const enumBody = state.slice(state.indexOf('enum NaparWatchPhase'), state.indexOf('struct NaparWatchState'));
    const cases = [...enumBody.matchAll(/case (\w+)/g)].map((m) => m[1]).sort();
    expect(cases).toEqual([...PHASES].sort());
    expect(read(phoneSessionRel)).toContain('"phase": "idle"');
    expect(read(watchStateRel)).toContain('return nil');
  });

  test('zegarek wysyła dokładnie polecenia z core (pause, resume, next)', () => {
    const views = read(watchViewsRel);
    for (const cmd of COMMANDS) {
      expect(views).toContain(`command: "${cmd}"`);
      expect(read('src/core/watch-state.ts')).toContain(`'${cmd}'`);
    }
    expect(read(watchClientRel)).toContain('["cmd": command]');
  });

  test('zegarek nie pokazuje „Dalej” w pauzie (zgodnie z decideWatchCommand)', () => {
    expect(read(watchViewsRel)).toContain('enabled: state.phase == .brewing');
  });

  test('wibracja przy zmianie etapu i na koniec (WKInterfaceDevice / WKHapticType)', () => {
    const client = read(watchClientRel);
    expect(client).toContain('WKInterfaceDevice.current().play(.notification)');
    expect(client).toContain('WKInterfaceDevice.current().play(.success)');
  });

  test('przyciski zegarka mają minimum 44 pt wysokości', () => {
    expect(read(watchViewsRel)).toContain('minHeight: 44');
  });

  test('odliczanie działa natywnie (Text(timerInterval:))', () => {
    expect(read(watchViewsRel)).toContain('Text(timerInterval:');
  });
});

describe('napisy zegarka PL i EN', () => {
  const keysOf = (rel: string) => [...read(rel).matchAll(/^"([^"]+)"\s*=/gm)].map((m) => m[1]).sort();
  const pl = keysOf(`${watchDir}/pl.lproj/Localizable.strings`);
  const en = keysOf(`${watchDir}/en.lproj/Localizable.strings`);

  test('klucze napisów są identyczne w pl.lproj i en.lproj', () => {
    expect(pl.length).toBeGreaterThan(0);
    expect(pl).toEqual(en);
  });

  test('każdy klucz użyty w kodzie zegarka istnieje w napisach', () => {
    const used = new Set([...watchSwiftAll.matchAll(/"(watch\.[A-Za-z.]+)"/g)].map((m) => m[1]));
    expect(used.size).toBeGreaterThan(0);
    for (const key of used) expect(pl).toContain(key);
  });

  test('napisy zawierają format zalania z dwoma parametrami w obu językach', () => {
    for (const rel of [`${watchDir}/pl.lproj/Localizable.strings`, `${watchDir}/en.lproj/Localizable.strings`]) {
      expect(read(rel)).toMatch(/"watch\.pourOf" = ".*%1\$ld.*%2\$ld.*";/);
    }
  });
});

describe('konfiguracja targetu zegarka i zasady prywatności', () => {
  const target = require(join(root, watchDir, 'expo-target.config.js'));

  test('typ watch, watchOS 10 lub nowszy, ikona i frameworki WatchConnectivity / WatchKit', () => {
    expect(target.type).toBe('watch');
    expect(Number(target.deploymentTarget)).toBeGreaterThanOrEqual(10);
    expect(target.icon).toBe('../../assets/icon.png');
    expect(target.frameworks).toEqual(expect.arrayContaining(['SwiftUI', 'WatchConnectivity', 'WatchKit']));
  });

  test('zegarek nie używa HealthKit ani żadnych uprawnień zdrowia', () => {
    expect(target.frameworks).not.toContain('HealthKit');
    expect(target.entitlements).toBeUndefined();
    const watchCode = watchSwiftAll.replace(/\/\/.*$/gm, '');
    expect(watchCode).not.toMatch(/HealthKit|HKHealthStore/);
    const plist = read(`${watchDir}/Info.plist`);
    expect(plist).not.toMatch(/NSHealth/);
    expect(plist).not.toMatch(/WKBackgroundModes/);
  });

  test('Info.plist deklaruje aplikację zegarka działającą razem z iPhone', () => {
    const plist = read(`${watchDir}/Info.plist`);
    expect(plist).toMatch(/<key>WKApplication<\/key>\s*<true\/>/);
    expect(plist).toMatch(/<key>WKRunsIndependentlyOfCompanionApp<\/key>\s*<false\/>/);
  });

  test('app.json: wtyczka apple-targets jest, a nie dodano kluczy zdrowia ani uprawnień', () => {
    const expo = JSON.parse(read('app.json')).expo;
    expect(expo.plugins).toContain('@bacons/apple-targets');
    const keys = Object.keys(expo.ios.infoPlist);
    expect(keys.filter((k) => k.startsWith('NSHealth'))).toEqual([]);
    expect(expo.android.permissions).toEqual([
      'android.permission.CAMERA',
      'android.permission.VIBRATE',
      'android.permission.WAKE_LOCK',
    ]);
  });

  test('pliki zegarka i iPhone nie wywołują sieci', () => {
    const all = [watchSwiftAll, read(phoneModuleRel), read(phoneSessionRel)].join('\n');
    expect(all).not.toMatch(/URLSession|URLRequest|NSURLConnection/);
  });
});

describe('most natywny bez modułu (Expo Go, Android, bez zegarka): no-op bez błędu', () => {
  afterEach(() => {
    jest.resetModules();
    jest.dontMock('expo-modules-core');
  });

  test('gdy natywnego modułu nie ma, wszystkie wywołania zwracają wartości zastępcze', async () => {
    jest.resetModules();
    jest.doMock('expo-modules-core', () => ({ requireOptionalNativeModule: () => null, EventEmitter: jest.fn() }));
    const bridge = require('../modules/napar-watch-link');
    await expect(bridge.activateWatchLink()).resolves.toBe(false);
    await expect(bridge.sendWatchState({} as never)).resolves.toBe(false);
    await expect(bridge.clearWatchState()).resolves.toBe(false);
    const unsubscribe = bridge.subscribeWatchCommands(() => undefined);
    expect(typeof unsubscribe).toBe('function');
    expect(() => unsubscribe()).not.toThrow();
  });

  test('gdy moduł jest, wywołania idą do natywnej części, a błąd daje wartość zastępczą', async () => {
    const remove = jest.fn();
    const addListener = jest.fn(() => ({ remove }));
    const native = {
      activate: jest.fn(async () => true),
      sendState: jest.fn(async () => true),
      clearState: jest.fn(async () => true),
    };
    jest.resetModules();
    jest.doMock('expo-modules-core', () => ({
      requireOptionalNativeModule: () => native,
      EventEmitter: jest.fn().mockImplementation(() => ({ addListener })),
    }));
    const bridge = require('../modules/napar-watch-link');
    const payload = { v: 1, phase: 'brewing', stepName: 'Zalanie', endAtMs: 1, pausedRemainingMs: 0, pourIndex: 1, pourTotal: 2, language: 'pl' };

    await expect(bridge.activateWatchLink()).resolves.toBe(true);
    await expect(bridge.sendWatchState(payload)).resolves.toBe(true);
    await expect(bridge.clearWatchState()).resolves.toBe(true);
    expect(native.sendState).toHaveBeenCalledWith(payload);

    const listener = jest.fn();
    const unsubscribe = bridge.subscribeWatchCommands(listener);
    expect(addListener).toHaveBeenCalledWith('onWatchCommand', listener);
    unsubscribe();
    expect(remove).toHaveBeenCalledTimes(1);

    native.activate.mockRejectedValueOnce(new Error('WCSession'));
    native.sendState.mockRejectedValueOnce(new Error('WCSession'));
    native.clearState.mockRejectedValueOnce(new Error('WCSession'));
    await expect(bridge.activateWatchLink()).resolves.toBe(false);
    await expect(bridge.sendWatchState(payload)).resolves.toBe(false);
    await expect(bridge.clearWatchState()).resolves.toBe(false);
  });
});
