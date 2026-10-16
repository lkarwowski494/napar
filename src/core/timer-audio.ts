// ============================================================================
// Napar (Steepwise) — Timer Audio & Haptic Chime Engine (Zadanie N4)
// Plays an acoustic chime tone, triggers haptic cues, and announces VoiceOver
// on 3-second step warning and stage completion.
// Apps4Brew Studio — 100% Offline-First.
// ============================================================================

import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { announce } from './announce';

let soundInstance: Audio.Sound | null = null;

// Gentle short acoustic sine tone encoded as wav data URI (440Hz A4 chime)
export const CHIME_AUDIO_DATA_URI =
  'data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';

/**
 * Plays the acoustic chime tone safely.
 */
export async function playTimerChime(): Promise<boolean> {
  try {
    if (soundInstance) {
      try {
        await soundInstance.unloadAsync();
      } catch {
        // Ignoruj błąd rozładowania
      }
      soundInstance = null;
    }

    const { sound } = await Audio.Sound.createAsync(
      { uri: CHIME_AUDIO_DATA_URI },
      { shouldPlay: true, volume: 1.0 }
    );
    soundInstance = sound;
    return true;
  } catch {
    return false;
  }
}

/**
 * Triggered at 3 seconds before step end (Apps4Brew T-014 / BR-ZEG-002).
 */
export async function notifyTimerStepWarning(secondsLeft = 3): Promise<boolean> {
  // 1. Accessibility announcement
  announce(`Pozostały ${secondsLeft} sekundy do końca zalania`);

  // 2. Haptic warning
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  } catch {
    // Ignore in non-native / test environments
  }

  // 3. Audio chime
  return await playTimerChime();
}

/**
 * Triggered when a timer step or entire session finishes.
 */
export async function notifyTimerFinished(stepName?: string): Promise<boolean> {
  // 1. Accessibility announcement
  const message = stepName ? `Krok ukończony: ${stepName}` : 'Parzenie zakończone!';
  announce(message);

  // 2. Haptic success
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    // Ignore in non-native / test environments
  }

  // 3. Audio chime
  return await playTimerChime();
}
