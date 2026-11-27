// ============================================================================
// Napar — Native File Export via System Share Sheet (DEEP-030)
// Writes JSON/CSV export to a temporary file and opens iOS/Android Share Sheet
// via expo-sharing so users can save to Files, iCloud Drive, Mail, or AirDrop.
// ============================================================================

import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

export interface ShareFileResult {
  ok: boolean;
  reason?: 'no_directory' | 'unavailable';
  fileUri?: string;
}

/**
 * Zapisuje eksport tekstowy (JSON / CSV) do pliku tymczasowego i wywołuje systemowy Share Sheet.
 * Zwraca `{ ok: true, fileUri }` po udostępnieniu lub `{ ok: false, reason }` gdy udostępnianie nie jest dostępne.
 */
export async function shareTextAsFile(
  filename: string,
  content: string,
  mimeType: string,
  uti: string
): Promise<ShareFileResult> {
  const baseDir = FileSystem.cacheDirectory || FileSystem.documentDirectory;
  if (!baseDir) {
    return { ok: false, reason: 'no_directory' };
  }
  const safeName = (filename || 'napar-export.txt').replace(/[^a-zA-Z0-9._-]/g, '_');
  const fileUri = `${baseDir}${safeName}`;
  await FileSystem.writeAsStringAsync(fileUri, content);

  const available = await Sharing.isAvailableAsync();
  if (!available) {
    return { ok: false, reason: 'unavailable', fileUri };
  }

  await Sharing.shareAsync(fileUri, {
    mimeType,
    UTI: uti,
    dialogTitle: safeName,
  });
  return { ok: true, fileUri };
}
