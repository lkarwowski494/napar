// ============================================================================
// Napar (Steepwise) — Zapis karty degustacyjnej do PNG i udostępnienie
// (react-native-view-shot + expo-sharing). Bez sieci: plik trafia do cache.
// ============================================================================

import type { RefObject } from 'react';
import type { View } from 'react-native';
import { captureRef, releaseCapture } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

export async function shareTastingCardImage(
  ref: RefObject<View | null>,
  dialogTitle: string
): Promise<void> {
  if (!ref.current) {
    throw new Error('Karta degustacyjna nie jest wyrenderowana');
  }
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Udostępnianie niedostępne na tym urządzeniu');
  }
  const uri = await captureRef(ref, { format: 'png', quality: 1, result: 'tmpfile' });
  try {
    await Sharing.shareAsync(uri, { mimeType: 'image/png', UTI: 'public.png', dialogTitle });
  } finally {
    releaseCapture(uri);
  }
}
