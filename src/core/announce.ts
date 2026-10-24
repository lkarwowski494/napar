// ============================================================================
// Napar (Steepwise) — Dostępność i VoiceOver (wzorce Apps4Brew, BR-DOST-001, DEC-13)
// Komunikaty głosowe w treści poprzez natywne announceForAccessibility
// ============================================================================

import { useEffect } from 'react';
import { AccessibilityInfo } from 'react-native';
import { pluralPl } from './i18n';

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
 */
export function formatStepAnnouncement(
  stepNumber: number,
  totalSteps: number,
  stepName: string,
  targetWaterGrams: number,
  durationSeconds: number,
  instruction?: string,
  language: 'pl' | 'en' = 'pl'
): string {
  if (language === 'en') {
    const instr = instruction ? ` ${instruction}` : '';
    return `Step ${stepNumber} of ${totalSteps}: ${stepName}. Target water: ${targetWaterGrams} g. Step duration: ${durationSeconds} seconds.${instr}`;
  }
  const instr = instruction ? ` ${instruction}` : '';
  const secWord = pluralPl(durationSeconds, 'sekunda', 'sekundy', 'sekund');
  return `Krok ${stepNumber} z ${totalSteps}: ${stepName}. Cel wody: ${targetWaterGrams} g. Czas trwania: ${durationSeconds} ${secWord}.${instr}`;
}

/**
 * Formatuje ostrzeżenie przed końcem etapu (np. 3 sekundy).
 */
export function formatCountdownAnnouncement(
  secondsRemaining: number,
  language: 'pl' | 'en' = 'pl'
): string {
  if (language === 'en') {
    return `${secondsRemaining} seconds remaining in this step.`;
  }
  const secWord = pluralPl(secondsRemaining, 'sekunda', 'sekundy', 'sekund');
  return `${secondsRemaining} ${secWord} do końca etapu.`;
}

/**
 * Formatuje komunikat rozpoczęcia sesji.
 */
export function formatStartAnnouncement(
  recipeName: string,
  doseGrams: number,
  waterGrams: number,
  language: 'pl' | 'en' = 'pl'
): string {
  if (language === 'en') {
    return `Started brewing ${recipeName}. Dose: ${doseGrams} g, water: ${waterGrams} g.`;
  }
  return `Rozpoczęto parzenie ${recipeName}. Doza: ${doseGrams} g, woda: ${waterGrams} g.`;
}

/**
 * Formatuje komunikat zakończenia parzenia.
 */
export function formatFinishAnnouncement(
  recipeName: string,
  totalSeconds: number,
  language: 'pl' | 'en' = 'pl'
): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  if (language === 'en') {
    const secWord = secs === 1 ? 'second' : 'seconds';
    const timeStr = mins > 0 ? `${mins} min ${secs} s` : `${secs} ${secWord}`;
    return `Brewing of ${recipeName} finished. Total time: ${timeStr}. Enjoy your cup!`;
  }
  const secWord = pluralPl(secs, 'sekunda', 'sekundy', 'sekund');
  const timeStr = mins > 0 ? `${mins} min ${secs} s` : `${secs} ${secWord}`;
  return `Parzenie ${recipeName} zakończone. Całkowity czas: ${timeStr}. Smacznego!`;
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
  language: 'pl' | 'en' = 'pl'
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
  language: 'pl' | 'en' = 'pl'
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
  language: 'pl' | 'en' = 'pl'
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
  language: 'pl' | 'en' = 'pl'
): void {
  const msg = formatStartAnnouncement(recipeName, doseGrams, waterGrams, language);
  announce(msg);
}
