// ============================================================================
// Napar (Steepwise) — Unit Tests: adapter magazynu kopii (expo-file-system/legacy, expo-sharing)
// ============================================================================

jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(),
  shareAsync: jest.fn(),
}));

import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { expoBackupStorage } from '../backup-storage';

describe('expoBackupStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('udostępnia katalogi aplikacji z systemu plików', () => {
    expect(expoBackupStorage.documentDirectory).toBe(FileSystem.documentDirectory);
    expect(expoBackupStorage.cacheDirectory).toBe(FileSystem.cacheDirectory);
  });

  test('exists sprawdza istnienie przez getInfoAsync', async () => {
    await FileSystem.writeAsStringAsync('file:///x/a.json', '{}');
    await expect(expoBackupStorage.exists('file:///x/a.json')).resolves.toBe(true);
    await expect(expoBackupStorage.exists('file:///x/brak.json')).resolves.toBe(false);
  });

  test('zapis, odczyt, lista i usunięcie plików', async () => {
    await expoBackupStorage.writeText('file:///y/b.json', 'treść');
    await expect(expoBackupStorage.readText('file:///y/b.json')).resolves.toBe('treść');
    await expect(expoBackupStorage.listDirectory('file:///y/')).resolves.toContain('b.json');
    await expoBackupStorage.remove('file:///y/b.json');
    await expect(expoBackupStorage.exists('file:///y/b.json')).resolves.toBe(false);
  });

  test('tworzenie katalogu z intermediates', async () => {
    await expoBackupStorage.makeDirectory('file:///z/Backup/');
    expect(FileSystem.makeDirectoryAsync).toHaveBeenCalledWith('file:///z/Backup/', { intermediates: true });
  });

  test('udostępnianie zwraca false, gdy niedostępne, i true po wywołaniu arkusza', async () => {
    (Sharing.isAvailableAsync as jest.Mock).mockResolvedValueOnce(false);
    await expect(expoBackupStorage.share('file:///c/k.json', { mimeType: 'application/json', dialogTitle: 'T' })).resolves.toBe(false);
    expect(Sharing.shareAsync).not.toHaveBeenCalled();

    (Sharing.isAvailableAsync as jest.Mock).mockResolvedValueOnce(true);
    await expect(expoBackupStorage.share('file:///c/k.json', { mimeType: 'application/json', dialogTitle: 'T' })).resolves.toBe(true);
    expect(Sharing.shareAsync).toHaveBeenCalledWith('file:///c/k.json', { mimeType: 'application/json', dialogTitle: 'T' });
  });
});
