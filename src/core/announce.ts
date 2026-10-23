// ============================================================================
// Napar (Steepwise) — Dostępność i VoiceOver (wzorce Apps4Brew, BR-DOST-001, DEC-13)
// Komunikaty głosowe w treści poprzez natywne announceForAccessibility
// ============================================================================

import { useEffect } from 'react';
import { AccessibilityInfo } from 'react-native';
import { messagesFor, LangCode } from './i18n-loader';
import { fillTemplate } from './access-policy';

export const announce = (text: string): void => {
  try {
    AccessibilityInfo.announceForAccessibility(text);
  } catch {
    // brak VoiceOver lub środowisko testowe
  }
};

export function useAnnounce(text: string | null | undefined): void {
  useEffect(() => {
    if (text) announce(text);
  }, [text]);
}

/**
 * Formatuje komunikat zapowiedzi etapu parzenia dla czytnika ekranu (VoiceOver / TalkBack).
 * Teksty z sekcji `voice` słownika języka (te same słowniki co UI).
 */
export function formatStepAnnouncement(
  stepNumber: number,
  totalSteps: number,
  stepName: string,
  targetWaterGrams: number,
  durationSeconds: number,
  instruction?: string,
  language: LangCode = 'pl'
): string {
  return fillTemplate(messagesFor(language).voice.stepAnnouncement, {
    stepNumber,
    totalSteps,
    stepName,
    water: targetWaterGrams,
    seconds: durationSeconds,
    instruction: instruction ? ` ${instruction}` : '',
  });
}

/**
 * Formatuje ostrzeżenie przed końcem etapu (np. 3 sekundy).
 */
export function formatCountdownAnnouncement(secondsRemaining: number, language: LangCode = 'pl'): string {
  return fillTemplate(messagesFor(language).voice.countdownAnnouncement, { seconds: secondsRemaining });
}

/**
 * Formatuje komunikat rozpoczęcia sesji.
 */
export function formatStartAnnouncement(
  recipeName: string,
  doseGrams: number,
  waterGrams: number,
  language: LangCode = 'pl'
): string {
  return fillTemplate(messagesFor(language).voice.startAnnouncement, {
    recipe: recipeName,
    dose: doseGrams,
    water: waterGrams,
  });
}

/**
 * Formatuje komunikat zakończenia parzenia.
 */
export function formatFinishAnnouncement(recipeName: string, totalSeconds: number, language: LangCode = 'pl'): string {
  const voice = messagesFor(language).voice;
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  const timeStr =
    mins > 0
      ? fillTemplate(voice.minutesSeconds, { minutes: mins, seconds: secs })
      : fillTemplate(voice.secondsOnly, { seconds: secs });
  return fillTemplate(voice.finishAnnouncement, { recipe: recipeName, time: timeStr });
}

/**
 * Natychmiastowa zapowiedź nowego etapu parzenia.
 */
export function announceStep(
  stepNumber: number,
  totalSteps: number,
  stepName: string,
  targetWaterGrams: number,
  durationSeconds: number,
  instruction?: string,
  language: LangCode = 'pl'
): void {
  const msg = formatStepAnnouncement(
    stepNumber,
    totalSteps,
    stepName,
    targetWaterGrams,
    durationSeconds,
    instruction,
    language
  );
  announce(msg);
}

/**
 * Natychmiastowa zapowiedź odliczania.
 */
export function announceCountdown(
  secondsRemaining: number,
  language: LangCode = 'pl'
): void {
  const msg = formatCountdownAnnouncement(secondsRemaining, language);
  announce(msg);
}

/**
 * Natychmiastowa zapowiedź zakończenia.
 */
export function announceFinish(
  recipeName: string,
  totalSeconds: number,
  language: LangCode = 'pl'
): void {
  const msg = formatFinishAnnouncement(recipeName, totalSeconds, language);
  announce(msg);
}

/**
 * Natychmiastowa zapowiedź rozpoczęcia parzenia.
 */
export function announceStart(
  recipeName: string,
  doseGrams: number,
  waterGrams: number,
  language: LangCode = 'pl'
): void {
  const msg = formatStartAnnouncement(recipeName, doseGrams, waterGrams, language);
  announce(msg);
}
