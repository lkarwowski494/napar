// ============================================================================
// Napar — sygnały haptyczne zależne od ustawień (M1-audytor-generalny-030; 04-studio-projektowe-006)
// Jedno miejsce, przez które ekrany wywołują wibracje: ustawienie „Wibracje” (haptics_enabled) jest
// sprawdzane tutaj. Dźwięk sprawdza playTimerChime (timer-audio.ts) według ustawienia „Dźwięk”.
// Silnik stopera (timer-engine.ts) ma własną flagę hapticsEnabled synchronizowaną z tym samym ustawieniem.
// ============================================================================

import * as Haptics from 'expo-haptics';
import { getHapticsEnabled } from './database';

export type HapticSignal = 'light' | 'medium' | 'success';

export function signalHaptic(kind: HapticSignal): void {
  if (!getHapticsEnabled()) return;
  try {
    if (kind === 'success') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      void Haptics.impactAsync(kind === 'medium' ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light);
    }
  } catch {
    // Brak modułu haptyki (np. symulator) — sygnał pomijany
  }
}
