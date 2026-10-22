// ============================================================================
// Napar (Steepwise) — Adapter magazynu kopii zapasowych (expo-file-system, expo-sharing)
// Implementuje port BackupStorage z src/core/backup.ts.
// ============================================================================

import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import type { BackupStorage } from '../core/backup';

export const expoBackupStorage: BackupStorage = {
  documentDirectory: FileSystem.documentDirectory,
  cacheDirectory: FileSystem.cacheDirectory,
  exists: async (path) => (await FileSystem.getInfoAsync(path)).exists,
  makeDirectory: (path) => FileSystem.makeDirectoryAsync(path, { intermediates: true }),
  writeText: (path, text) => FileSystem.writeAsStringAsync(path, text),
  readText: (path) => FileSystem.readAsStringAsync(path),
  listDirectory: (path) => FileSystem.readDirectoryAsync(path),
  remove: (path) => FileSystem.deleteAsync(path, { idempotent: true }),
  share: async (path, options) => {
    if (!(await Sharing.isAvailableAsync())) {
      return false;
    }
    await Sharing.shareAsync(path, options);
    return true;
  },
};
