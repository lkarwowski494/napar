// ============================================================================
// Napar — adapter platformy timera parzenia (M1-audytor-generalny-045, 05-architekt-012)
// Wibracje (expo-haptics), blokada wygaszania (expo-keep-awake) i powrót aplikacji
// z tła (AppState) wydzielone z src/core/timer-engine.ts bez zmiany zachowania:
// logika timera w src/core nie importuje frameworka (CLAUDE.md §2.1).
// ============================================================================

import * as Haptics from 'expo-haptics';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { AppState, AppStateStatus } from 'react-native';

export type TimerHapticKind = 'start' | 'step' | 'warning' | 'finish';

export interface TimerAppStateSubscription {
  remove?: () => void;
}

/** Start i zmiana etapu: uderzenie średnie; ostrzeżenie: lekkie; koniec: powiadomienie sukcesu. */
export function triggerTimerHaptic(type: TimerHapticKind): void {
  if (type === 'start' || type === 'step') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } else if (type === 'warning') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } else if (type === 'finish') {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }
}

export function activateTimerKeepAwake(): void {
  activateKeepAwakeAsync();
}

export function deactivateTimerKeepAwake(): void {
  deactivateKeepAwake();
}

/** Woła `onActive`, gdy aplikacja wraca na pierwszy plan; `null`, gdy AppState jest niedostępny. */
export function addAppActiveListener(onActive: () => void): TimerAppStateSubscription | null {
  if (typeof AppState?.addEventListener !== 'function') return null;
  return AppState.addEventListener('change', (nextState: AppStateStatus) => {
    if (nextState === 'active') onActive();
  });
}
