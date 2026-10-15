// ============================================================================
// Napar (Steepwise) — Dostępność i VoiceOver (wzorce Apps4Brew)
// Komunikaty głosowe w treści poprzez natywne announceForAccessibility
// ============================================================================

import { useEffect } from 'react';
import { AccessibilityInfo } from 'react-native';

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
