// ============================================================================
// Napar — Safe Mode Rescue View (DEC-07 / TASK-R12-02)
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
import * as FileSystem from 'expo-file-system/legacy';
import { crashLoopGuard } from '../core/startup-guard';
import { createRescueExport, resetDatabaseSafely, type RescueCounts } from '../core/rescue';
import { deviceRescueContext, pathToUri } from '../core/rescue-expo';
import { detectSystemLanguage } from '../core/i18n';

export type SafeModeReason = 'crash-loop' | 'database' | 'too-new';

export interface SafeModeViewProps {
  onRetry: () => void;
  language?: 'pl' | 'en';
  reason?: SafeModeReason;
}

const MESSAGES = {
  pl: {
    badge: 'TRYB AWARYJNY / SAFE MODE',
    title: 'Wykryto problem ze startem',
    desc: 'Aplikacja kilka razy z rzędu nie uruchomiła się poprawnie. Zanim spróbujesz czegokolwiek innego, zrób kopię ratunkową bazy.',
    descDatabase: 'Aplikacja nie mogła otworzyć bazy danych. Zanim spróbujesz czegokolwiek innego, zrób kopię ratunkową bazy.',
    descTooNew:
      'Dane zapisała nowsza wersja Napar i ta wersja aplikacji ich nie odczyta. Zaktualizuj aplikację. Do tego czasu nie resetuj bazy, bo usuniesz te dane z aplikacji. Kopię ratunkową bazy możesz zrobić w każdej chwili.',
    prepDb: 'Przygotowywanie bazy danych do eksportu...',
    noDbTitle: 'Brak pliku',
    noDbDesc: 'Nie znaleziono pliku bazy SQLite na dysku.',
    dbShareTitle: 'Eksport ratunkowy bazy SQLite (Napar)',
    dbExported: (c: RescueCounts) =>
      `Sprawdzona kopia bazy jest w aplikacji Pliki, w folderze Napar › kopie-ratunkowe. Sesje: ${c.sessions} · Wpisy kofeiny: ${c.caffeineLogs} · Paczki: ${c.inventory} · Własne receptury: ${c.customRecipes}`,
    rawSaved:
      'Nie udało się zrobić sprawdzonej kopii bazy, więc zapisano surowe pliki bazy w aplikacji Pliki, w folderze Napar › kopie-ratunkowe. Skopiuj ten folder poza urządzenie, zanim zresetujesz bazę albo usuniesz aplikację.',
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
    resetConfirm: 'Dziennik, spiżarnia, wpisy kofeiny, własne receptury i ustawienia zostaną usunięte z aplikacji. Najpierw aplikacja zapisze kopię ratunkową bazy w folderze kopie-ratunkowe. Jeśli kopia się nie uda, nic nie zostanie usunięte.',
    cancel: 'Anuluj',
    deleteAndReset: 'Usuń i zresetuj',
    resetDoneTitle: 'Zresetowano',
    resetDoneDesc: 'Baza została usunięta. Kopia ratunkowa jest w aplikacji Pliki, w folderze Napar › kopie-ratunkowe. Aplikacja uruchomi się od nowa, bez danych.',
    resetBlockedTitle: 'Reset wstrzymany',
    resetBlockedDesc: (reason: string) =>
      `Nie udało się zrobić kopii ratunkowej bazy, więc niczego nie usunięto. Sprawdź, czy na urządzeniu jest wolne miejsce, i spróbuj ponownie. Szczegóły: ${reason}`,
    resetIncompleteTitle: 'Reset nieukończony',
    resetIncompleteDesc: (reason: string) =>
      `Kopia ratunkowa jest w aplikacji Pliki, w folderze Napar › kopie-ratunkowe, ale nie udało się usunąć wszystkich plików bazy. Uruchom aplikację ponownie i powtórz reset. Szczegóły: ${reason}`,
    errTitle: 'Błąd',
    btnExportDb: 'Zrób kopię ratunkową bazy',
    btnExportJson: 'Eksportuj ostatnią kopię JSON',
    btnRetry: 'Spróbuj uruchomić normalnie',
    btnResetDb: 'Zresetuj uszkodzoną bazę',
  },
  en: {
    badge: 'RESCUE MODE / SAFE MODE',
    title: 'Startup Problem Detected',
    desc: 'The app failed to start several times in a row. Before you try anything else, make a rescue copy of the database.',
    descDatabase: 'The app could not open its database. Before you try anything else, make a rescue copy of the database.',
    descTooNew:
      'A newer version of Napar saved this data, and this version of the app cannot read it. Update the app. Until then, do not reset the database, or you will delete this data from the app. You can make a rescue copy of the database at any time.',
    prepDb: 'Preparing database for export...',
    noDbTitle: 'File Not Found',
    noDbDesc: 'SQLite database file was not found on disk.',
    dbShareTitle: 'Rescue export of SQLite database (Napar)',
    dbExported: (c: RescueCounts) =>
      `A verified copy of the database is in the Files app, in the Napar › kopie-ratunkowe folder. Sessions: ${c.sessions} · Caffeine entries: ${c.caffeineLogs} · Packs: ${c.inventory} · Custom recipes: ${c.customRecipes}`,
    rawSaved:
      'A verified copy of the database could not be made, so the raw database files were saved in the Files app, in the Napar › kopie-ratunkowe folder. Copy this folder off the device before you reset the database or delete the app.',
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
    resetConfirm: 'Your journal, pantry, caffeine entries, custom recipes and settings will be deleted from the app. First, the app saves a rescue copy of the database to the kopie-ratunkowe folder. If the copy fails, nothing is deleted.',
    cancel: 'Cancel',
    deleteAndReset: 'Delete and Reset',
    resetDoneTitle: 'Reset Complete',
    resetDoneDesc: 'The database was deleted. A rescue copy is in the Files app, in the Napar › kopie-ratunkowe folder. The app will restart without data.',
    resetBlockedTitle: 'Reset Stopped',
    resetBlockedDesc: (reason: string) =>
      `The rescue copy of the database could not be made, so nothing was deleted. Check that the device has free storage and try again. Details: ${reason}`,
    resetIncompleteTitle: 'Reset Incomplete',
    resetIncompleteDesc: (reason: string) =>
      `The rescue copy is in the Files app, in the Napar › kopie-ratunkowe folder, but not all database files could be deleted. Restart the app and try the reset again. Details: ${reason}`,
    errTitle: 'Error',
    btnExportDb: 'Make Rescue Copy of Database',
    btnExportJson: 'Export Latest JSON Backup',
    btnRetry: 'Try Normal Startup Again',
    btnResetDb: 'Reset Damaged Database',
  },
};

export const SafeModeView: React.FC<SafeModeViewProps> = ({ onRetry, language, reason = 'crash-loop' }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');

  const activeLang = language || detectSystemLanguage();
  const m = activeLang === 'pl' ? MESSAGES.pl : MESSAGES.en;

  const handleExportDb = async () => {
    setLoading(true);
    setStatusMessage(m.prepDb);
    try {
      const ctx = deviceRescueContext();
      if ('error' in ctx) {
        Alert.alert(m.noDbTitle, m.noDbDesc);
        return;
      }
      // M1-audytor-generalny-004: kopia przez VACUUM INTO bez migracji, sprawdzona; nigdy sam plik .db bez -wal.
      const result = await createRescueExport(ctx);
      if (!result.ok) {
        if (result.reason === 'no-database') Alert.alert(m.noDbTitle, m.noDbDesc);
        else Alert.alert(m.exportErrTitle, `${m.exportErrDesc} ${result.reason}`);
        return;
      }
      if (result.kind === 'raw') {
        setStatusMessage(m.rawSaved);
        return;
      }
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(pathToUri(result.file), {
          mimeType: 'application/x-sqlite3',
          dialogTitle: m.dbShareTitle,
        });
        setStatusMessage(m.dbExported(result.counts));
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
              // M1-audytor-generalny-004: najpierw sprawdzona kopia, potem usunięcie .db, -wal, -shm.
              const ctx = deviceRescueContext();
              const result = 'error' in ctx ? { ok: false as const, reason: ctx.error } : await resetDatabaseSafely(ctx);
              if (!result.ok) {
                // Kopia powstała, ale usuwanie zawiodło: „niczego nie usunięto” byłoby nieprawdą (rola 04, fix 2026-11-13).
                if ('backup' in result && result.backup?.ok) {
                  Alert.alert(m.resetIncompleteTitle, m.resetIncompleteDesc(result.reason));
                } else {
                  Alert.alert(m.resetBlockedTitle, m.resetBlockedDesc(result.reason));
                }
                return;
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
        <Text style={styles.desc}>{reason === 'database' ? m.descDatabase : reason === 'too-new' ? m.descTooNew : m.desc}</Text>

        {statusMessage ? <Text style={styles.status}>{statusMessage}</Text> : null}
        {loading ? <ActivityIndicator size="large" color="#D97736" style={styles.loader} /> : null}

        <View style={styles.actions}>
          <Pressable style={styles.btnPrimary} onPress={handleExportDb} disabled={loading} accessibilityRole="button" accessibilityLabel={m.btnExportDb}>
            <Text style={styles.btnPrimaryText}>{m.btnExportDb}</Text>
          </Pressable>

          <Pressable style={styles.btnSecondary} onPress={handleExportLatestJson} disabled={loading} accessibilityRole="button" accessibilityLabel={m.btnExportJson}>
            <Text style={styles.btnSecondaryText}>{m.btnExportJson}</Text>
          </Pressable>

          <Pressable style={styles.btnRetry} onPress={onRetry} disabled={loading} accessibilityRole="button" accessibilityLabel={m.btnRetry}>
            <Text style={styles.btnRetryText}>{m.btnRetry}</Text>
          </Pressable>

          <Pressable style={styles.btnDanger} onPress={handleResetDb} disabled={loading} accessibilityRole="button" accessibilityLabel={m.btnResetDb}>
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
    color: '#121214', // 028: onAccent (bez importu motywu w trybie awaryjnym); biały na #D97736 = 3,16:1
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
