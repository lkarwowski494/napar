// ============================================================================
// Napar (Steepwise) — Safe Mode Rescue View (DEC-07 / TASK-R12-02)
// Rendered when startup crash loop is detected (zero database/brew-context imports)
// Fully localized in PL and EN
// ============================================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { crashLoopGuard } from '../core/startup-guard';
import { detectSystemLanguage } from '../core/i18n';

export interface SafeModeViewProps {
  onRetry: () => void;
  language?: 'pl' | 'en';
}

const MESSAGES = {
  pl: {
    badge: 'TRYB AWARYJNY / SAFE MODE',
    title: 'Wykryto problem ze startem',
    desc: 'Aplikacja napotkała powtarzające się błędy podczas uruchamiania bazy danych SQLite. Twoje dane są bezpieczne na dysku. Skorzystaj z poniższych opcji ratunkowych:',
    prepDb: 'Przygotowywanie bazy danych do eksportu...',
    noDbTitle: 'Brak pliku',
    noDbDesc: 'Nie znaleziono pliku bazy SQLite na dysku.',
    dbShareTitle: 'Eksport ratunkowy bazy SQLite (Napar)',
    dbExported: 'Baza danych została wyeksportowana.',
    noShareTitle: 'Niedostępne',
    noShareDesc: 'Udostępnianie plików nie jest dostępne na tym urządzeniu.',
    exportErrTitle: 'Błąd eksportu',
    exportErrDesc: 'Wystąpił błąd podczas eksportu.',
    searchJson: 'Wyszukiwanie kopii JSON...',
    noBackupTitle: 'Brak kopii',
    noBackupDir: 'Nie odnaleziono katalogu kopii zapasowych.',
    noBackupFiles: 'W katalogu Backup nie ma żadnych plików JSON.',
    jsonShareTitle: 'Eksport ratunkowy ostatniej kopii JSON',
    jsonExported: (file: string) => `Wyeksportowano kopię: ${file}`,
    jsonErrDesc: 'Nie udało się wyeksportować kopii JSON.',
    resetTitle: 'Reset bazy danych',
    resetConfirm: 'Czy na pewno chcesz usunąć uszkodzoną bazę SQLite? Upewnij się, że wyeksportowałeś plik bazy lub kopię JSON. Wszystkie lokalne dane zostaną zresetowane.',
    cancel: 'Anuluj',
    deleteAndReset: 'Usuń i zresetuj',
    resetDoneTitle: 'Zresetowano',
    resetDoneDesc: 'Baza została usunięta. Aplikacja uruchomi się z czystym stanem.',
    errTitle: 'Błąd',
    btnExportDb: 'Eksportuj surową bazę SQLite',
    btnExportJson: 'Eksportuj ostatnią kopię JSON',
    btnRetry: 'Spróbuj uruchomić normalnie',
    btnResetDb: 'Zresetuj uszkodzoną bazę',
  },
  en: {
    badge: 'RESCUE MODE / SAFE MODE',
    title: 'Startup Problem Detected',
    desc: 'The app encountered repeated issues while initializing the SQLite database. Your data files are safe on disk. Please choose a recovery option below:',
    prepDb: 'Preparing database for export...',
    noDbTitle: 'File Not Found',
    noDbDesc: 'SQLite database file was not found on disk.',
    dbShareTitle: 'Rescue export of SQLite database (Steepwise)',
    dbExported: 'Database has been exported successfully.',
    noShareTitle: 'Not Available',
    noShareDesc: 'File sharing is not available on this device.',
    exportErrTitle: 'Export Error',
    exportErrDesc: 'An error occurred during export.',
    searchJson: 'Searching for JSON backup...',
    noBackupTitle: 'No Backups',
    noBackupDir: 'Backup folder was not found.',
    noBackupFiles: 'No JSON backup files found in the Backup folder.',
    jsonShareTitle: 'Rescue export of latest JSON backup',
    jsonExported: (file: string) => `Exported backup: ${file}`,
    jsonErrDesc: 'Could not export JSON backup file.',
    resetTitle: 'Reset Database',
    resetConfirm: 'Are you sure you want to delete the damaged SQLite database? Please ensure you have exported a database file or JSON backup first. All local data will be reset.',
    cancel: 'Cancel',
    deleteAndReset: 'Delete and Reset',
    resetDoneTitle: 'Reset Complete',
    resetDoneDesc: 'Database was deleted. The app will restart with a clean state.',
    errTitle: 'Error',
    btnExportDb: 'Export Raw SQLite Database',
    btnExportJson: 'Export Latest JSON Backup',
    btnRetry: 'Try Normal Startup Again',
    btnResetDb: 'Reset Damaged Database',
  },
};

export const SafeModeView: React.FC<SafeModeViewProps> = ({ onRetry, language }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');

  const activeLang = language || detectSystemLanguage();
  const m = activeLang === 'pl' ? MESSAGES.pl : MESSAGES.en;

  const handleExportDb = async () => {
    setLoading(true);
    setStatusMessage(m.prepDb);
    try {
      const docDir = (FileSystem as any).documentDirectory || '';
      // Sprawdź lokalizację bazy w /Library/SQLite lub SQLite/ lub root
      const possiblePaths = [
        `${docDir}SQLite/napar.db`,
        `${docDir}napar.db`,
        docDir.replace('/Documents/', '/Library/') + 'SQLite/napar.db',
      ];

      let foundPath: string | null = null;
      for (const p of possiblePaths) {
        const info = await FileSystem.getInfoAsync(p);
        if (info.exists) {
          foundPath = p;
          break;
        }
      }

      if (!foundPath) {
        Alert.alert(m.noDbTitle, m.noDbDesc);
        return;
      }

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(foundPath, {
          mimeType: 'application/x-sqlite3',
          dialogTitle: m.dbShareTitle,
        });
        setStatusMessage(m.dbExported);
      } else {
        Alert.alert(m.noShareTitle, m.noShareDesc);
      }
    } catch (err: any) {
      Alert.alert(m.exportErrTitle, err.message || m.exportErrDesc);
    } finally {
      setLoading(false);
    }
  };

  const handleExportLatestJson = async () => {
    setLoading(true);
    setStatusMessage(m.searchJson);
    try {
      const docDir = (FileSystem as any).documentDirectory || '';
      const backupDir = `${docDir}Backup/`;
      const dirInfo = await FileSystem.getInfoAsync(backupDir);

      if (!dirInfo.exists) {
        Alert.alert(m.noBackupTitle, m.noBackupDir);
        return;
      }

      const files = await FileSystem.readDirectoryAsync(backupDir);
      const jsonFiles = files.filter((f) => f.endsWith('.json')).sort().reverse();

      if (jsonFiles.length === 0) {
        Alert.alert(m.noBackupTitle, m.noBackupFiles);
        return;
      }

      const latestFile = `${backupDir}${jsonFiles[0]}`;
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(latestFile, {
          mimeType: 'application/json',
          dialogTitle: m.jsonShareTitle,
        });
        setStatusMessage(m.jsonExported(jsonFiles[0]));
      } else {
        Alert.alert(m.noShareTitle, m.noShareDesc);
      }
    } catch (err: any) {
      Alert.alert(m.errTitle, err.message || m.jsonErrDesc);
    } finally {
      setLoading(false);
    }
  };

  const handleResetDb = () => {
    Alert.alert(
      m.resetTitle,
      m.resetConfirm,
      [
        { text: m.cancel, style: 'cancel' },
        {
          text: m.deleteAndReset,
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const docDir = (FileSystem as any).documentDirectory || '';
              const paths = [
                `${docDir}SQLite/napar.db`,
                `${docDir}SQLite/napar.db-wal`,
                `${docDir}SQLite/napar.db-shm`,
                `${docDir}napar.db`,
                docDir.replace('/Documents/', '/Library/') + 'SQLite/napar.db',
              ];
              for (const p of paths) {
                try {
                  await FileSystem.deleteAsync(p, { idempotent: true });
                } catch {
                  // ignore
                }
              }
              await crashLoopGuard.resetCrashCount();
              Alert.alert(m.resetDoneTitle, m.resetDoneDesc);
              onRetry();
            } catch (err: any) {
              Alert.alert(m.errTitle, err.message);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.badge}>{m.badge}</Text>
        <Text style={styles.title}>{m.title}</Text>
        <Text style={styles.desc}>{m.desc}</Text>

        {statusMessage ? <Text style={styles.status}>{statusMessage}</Text> : null}
        {loading ? <ActivityIndicator size="large" color="#D97736" style={styles.loader} /> : null}

        <View style={styles.actions}>
          <Pressable style={styles.btnPrimary} onPress={handleExportDb} disabled={loading}>
            <Text style={styles.btnPrimaryText}>{m.btnExportDb}</Text>
          </Pressable>

          <Pressable style={styles.btnSecondary} onPress={handleExportLatestJson} disabled={loading}>
            <Text style={styles.btnSecondaryText}>{m.btnExportJson}</Text>
          </Pressable>

          <Pressable style={styles.btnRetry} onPress={onRetry} disabled={loading}>
            <Text style={styles.btnRetryText}>{m.btnRetry}</Text>
          </Pressable>

          <Pressable style={styles.btnDanger} onPress={handleResetDb} disabled={loading}>
            <Text style={styles.btnDangerText}>{m.btnResetDb}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#12100E',
    justifyContent: 'center',
  },
  content: {
    padding: 24,
    paddingTop: 60,
  },
  badge: {
    color: '#D97736',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  title: {
    color: '#F5EBE1',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
  },
  desc: {
    color: '#B0A294',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },
  status: {
    color: '#E0A96D',
    fontSize: 14,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  loader: {
    marginVertical: 16,
  },
  actions: {
    gap: 12,
  },
  btnPrimary: {
    backgroundColor: '#D97736',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  btnSecondary: {
    backgroundColor: '#26201B',
    borderWidth: 1,
    borderColor: '#3D332A',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnSecondaryText: {
    color: '#F5EBE1',
    fontSize: 15,
    fontWeight: '500',
  },
  btnRetry: {
    backgroundColor: '#1F1B17',
    borderWidth: 1,
    borderColor: '#D97736',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnRetryText: {
    color: '#D97736',
    fontSize: 15,
    fontWeight: '600',
  },
  btnDanger: {
    marginTop: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnDangerText: {
    color: '#C0392B',
    fontSize: 14,
    fontWeight: '600',
  },
});
