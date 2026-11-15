// M1-audytor-generalny-030 (04-studio-projektowe-006): ustawienia „Dźwięk” i „Wibracje” są jednym źródłem dla obu stoperów.
import fs from 'fs';
import path from 'path';
import React from 'react';
import renderer, { act } from 'react-test-renderer';

jest.mock('expo-audio', () => ({ createAudioPlayer: jest.fn(() => ({ play: jest.fn(), remove: jest.fn() })) }));
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Medium: 'medium', Light: 'light' },
  NotificationFeedbackType: { Success: 'success' },
}));

import * as Audio from 'expo-audio';
import * as Haptics from 'expo-haptics';
import * as db from '../src/core/database';
import { playTimerChime } from '../src/core/timer-audio';
import { signalHaptic, type HapticSignal } from '../src/core/signals';
import SettingsScreen from '../app/settings';

describe('M1-audytor-generalny-030: dźwięk i wibracje według ustawień (04-studio-projektowe-006)', () => {
  afterEach(() => jest.restoreAllMocks());

  test('dzwonek stopera nie gra przy wyłączonym dźwięku, gra przy włączonym', async () => {
    jest.spyOn(db, 'getSoundEnabled').mockReturnValue(false);
    (Audio.createAudioPlayer as jest.Mock).mockClear();
    expect(await playTimerChime()).toBe(false);
    expect(Audio.createAudioPlayer).not.toHaveBeenCalled();
    jest.spyOn(db, 'getSoundEnabled').mockReturnValue(true);
    expect(await playTimerChime()).toBe(true);
    expect(Audio.createAudioPlayer).toHaveBeenCalledTimes(1);
  });

  test('sygnał haptyczny nie wibruje przy wyłączonych wibracjach', () => {
    (Haptics.impactAsync as jest.Mock).mockClear();
    (Haptics.notificationAsync as jest.Mock).mockClear();
    jest.spyOn(db, 'getHapticsEnabled').mockReturnValue(false);
    const all: HapticSignal[] = ['medium', 'light', 'success'];
    all.forEach(signalHaptic);
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
    expect(Haptics.notificationAsync).not.toHaveBeenCalled();
    jest.spyOn(db, 'getHapticsEnabled').mockReturnValue(true);
    signalHaptic('light');
    signalHaptic('success');
    expect(Haptics.impactAsync).toHaveBeenCalledWith('light');
    expect(Haptics.notificationAsync).toHaveBeenCalledWith('success');
  });

  // Zapis i odczyt ustawienia „Dźwięk” na prawdziwym SQLite: tests/data-layer-sqlite.test.ts (blok 030).

  test('Ustawienia mają przełącznik dźwięku (rola switch) zapisujący ustawienie', () => {
    const set = jest.spyOn(db, 'setSoundEnabled').mockImplementation(() => undefined);
    jest.spyOn(db, 'getSoundEnabled').mockReturnValue(true);
    let tree: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<SettingsScreen />);
    });
    const btn = tree!.root.findAll((n) => n.props.testID === 'toggle-sound-btn' && typeof n.props.onPress === 'function');
    expect(btn).toHaveLength(1);
    expect(btn[0].props.accessibilityRole).toBe('switch');
    expect(btn[0].props.accessibilityState).toEqual({ checked: true });
    act(() => {
      btn[0].props.onPress();
    });
    expect(set).toHaveBeenCalledWith(false);
  });

  test('expo-haptics importowany tylko w module sygnałów i w silniku stopera (ma własną flagę z ustawień)', () => {
    const root = path.join(__dirname, '..');
    const walk = (dir: string): string[] =>
      fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) return ['__tests__', 'node_modules'].includes(e.name) ? [] : walk(p);
        return /\.(ts|tsx)$/.test(e.name) ? [p] : [];
      });
    const hits = ['app', 'src', 'lib']
      .map((d) => path.join(root, d))
      .filter((d) => fs.existsSync(d))
      .flatMap(walk)
      .filter((f) => /from 'expo-haptics'|require\('expo-haptics'\)/.test(fs.readFileSync(f, 'utf8')))
      .map((f) => path.relative(root, f))
      .sort();
    expect(hits).toEqual(['src/core/signals.ts', 'src/core/timer-engine.ts']);
  });
});
