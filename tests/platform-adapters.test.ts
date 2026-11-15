// ============================================================================
// Adaptery platformy wydzielone z src/core — M1-audytor-generalny-045 (05-architekt-012)
// Zachowanie bez zmian względem kodu w src/core/timer-engine.ts i src/core/theme.ts.
// ============================================================================
import * as Haptics from 'expo-haptics';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { AppState, Platform } from 'react-native';
import {
  activateTimerKeepAwake,
  addAppActiveListener,
  deactivateTimerKeepAwake,
  triggerTimerHaptic,
  TimerHapticKind,
} from '../src/platform/timer-platform';
import { MONOSPACE_FONT_FAMILY } from '../src/platform/fonts';
import { theme } from '../src/core/theme';

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

beforeEach(() => jest.clearAllMocks());

describe('timer-platform', () => {
  test.each<[TimerHapticKind, 'impactAsync' | 'notificationAsync', string]>([
    ['start', 'impactAsync', 'medium'],
    ['step', 'impactAsync', 'medium'],
    ['warning', 'impactAsync', 'light'],
    ['finish', 'notificationAsync', 'success'],
  ])('triggerTimerHaptic(%s) → Haptics.%s(%s)', (kind, fn, style) => {
    triggerTimerHaptic(kind);
    expect(Haptics[fn]).toHaveBeenCalledTimes(1);
    expect(Haptics[fn]).toHaveBeenCalledWith(style);
  });

  test('nieznany rodzaj nie wibruje', () => {
    triggerTimerHaptic('inny' as TimerHapticKind);
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
    expect(Haptics.notificationAsync).not.toHaveBeenCalled();
  });

  test('blokada wygaszania: włącz i wyłącz przez expo-keep-awake', () => {
    activateTimerKeepAwake();
    deactivateTimerKeepAwake();
    expect(activateKeepAwakeAsync).toHaveBeenCalledTimes(1);
    expect(deactivateKeepAwake).toHaveBeenCalledTimes(1);
  });

  test('addAppActiveListener woła onActive tylko przy powrocie do stanu active', () => {
    let handler: ((s: string) => void) | undefined;
    const remove = jest.fn();
    const spy = jest.spyOn(AppState, 'addEventListener').mockImplementation(((_: string, h: (s: string) => void) => {
      handler = h;
      return { remove };
    }) as any);
    const onActive = jest.fn();
    const sub = addAppActiveListener(onActive);
    expect(spy).toHaveBeenCalledWith('change', expect.any(Function));
    handler!('background');
    handler!('inactive');
    expect(onActive).not.toHaveBeenCalled();
    handler!('active');
    expect(onActive).toHaveBeenCalledTimes(1);
    sub!.remove!();
    expect(remove).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });

  test('addAppActiveListener zwraca null, gdy AppState nie ma addEventListener', () => {
    const original = AppState.addEventListener;
    (AppState as any).addEventListener = undefined;
    try {
      expect(addAppActiveListener(jest.fn())).toBeNull();
    } finally {
      (AppState as any).addEventListener = original;
    }
  });
});

describe('fonts', () => {
  test('MONOSPACE_FONT_FAMILY: Menlo na iOS i ta sama wartość w tokenach motywu', () => {
    expect(Platform.OS).toBe('ios');
    expect(MONOSPACE_FONT_FAMILY).toBe('Menlo');
    expect(theme.typography.monospace).toBe(MONOSPACE_FONT_FAMILY);
    expect(theme.typography.code.fontFamily).toBe(MONOSPACE_FONT_FAMILY);
  });
});
