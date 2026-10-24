// ============================================================================
// Napar (Steepwise) — Safe Mode Rescue View (DEC-07 / TASK-R12-02)
// Rendered when startup crash loop is detected (zero database/brew-context imports)
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

interface SafeModeViewProps {
  onRetry: () => void;
}

export const SafeModeView: React.FC<SafeModeViewProps> = ({ onRetry }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');

  const handleExportDb = async () => {
    setLoading(true);
    setStatusMessage('Przygotowywanie bazy danych do eksportu...');
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
        Alert.alert('Brak pliku', 'Nie znaleziono pliku bazy SQLite na dysku.');
        return;
      }

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(foundPath, {
          mimeType: 'application/x-sqlite3',
          dialogTitle: 'Eksport ratunkowy bazy SQLite (Napar)',
        });
        setStatusMessage('Baza danych została wyeksportowana.');
      } else {
        Alert.alert('Niedostępne', 'Udostępnianie plików nie jest dostępne na tym urządzeniu.');
      }
    } catch (err: any) {
      Alert.alert('Błąd eksportu', err.message || 'Wystąpił błąd podczas eksportu.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportLatestJson = async () => {
    setLoading(true);
    setStatusMessage('Wyszukiwanie kopii JSON...');
    try {
      const docDir = (FileSystem as any).documentDirectory || '';
      const backupDir = `${docDir}Backup/`;
      const dirInfo = await FileSystem.getInfoAsync(backupDir);

      if (!dirInfo.exists) {
        Alert.alert('Brak kopii', 'Nie odnaleziono katalogu kopii zapasowych.');
        return;
      }

      const files = await FileSystem.readDirectoryAsync(backupDir);
      const jsonFiles = files.filter((f) => f.endsWith('.json')).sort().reverse();

      if (jsonFiles.length === 0) {
        Alert.alert('Brak kopii', 'W katalogu Backup nie ma żadnych plików JSON.');
        return;
      }

      const latestFile = `${backupDir}${jsonFiles[0]}`;
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(latestFile, {
          mimeType: 'application/json',
          dialogTitle: 'Eksport ratunkowy ostatniej kopii JSON',
        });
        setStatusMessage(`Wyeksportowano kopię: ${jsonFiles[0]}`);
      } else {
        Alert.alert('Niedostępne', 'Udostępnianie plików nie jest dostępne.');
      }
    } catch (err: any) {
      Alert.alert('Błąd', err.message || 'Nie udało się wyeksportować kopii JSON.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetDb = () => {
    Alert.alert(
      'Reset bazy danych',
      'Czy na pewno chcesz usunąć uszkodzoną bazę SQLite? Upewnij się, że wyeksportowałeś plik bazy lub kopię JSON. Wszystkie lokalne dane zostaną zresetowane.',
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Usuń i zresetuj',
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
              Alert.alert('Zresetowano', 'Baza została usunięta. Aplikacja uruchomi się z czystym stanem.');
              onRetry();
            } catch (err: any) {
              Alert.alert('Błąd', err.message);
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
        <Text style={styles.badge}>TRYB AWARYJNY / SAFE MODE</Text>
        <Text style={styles.title}>Wykryto problem ze startem</Text>
        <Text style={styles.desc}>
          Aplikacja napotkała powtarzające się błędy podczas uruchamiania bazy danych SQLite.
          Twoje dane są bezpieczne na dysku. Skorzystaj z poniższych opcji ratunkowych:
        </Text>

        {statusMessage ? <Text style={styles.status}>{statusMessage}</Text> : null}
        {loading ? <ActivityIndicator size="large" color="#D97736" style={styles.loader} /> : null}

        <View style={styles.actions}>
          <Pressable style={styles.btnPrimary} onPress={handleExportDb} disabled={loading}>
            <Text style={styles.btnPrimaryText}>Eksportuj surową bazę SQLite</Text>
          </Pressable>

          <Pressable style={styles.btnSecondary} onPress={handleExportLatestJson} disabled={loading}>
            <Text style={styles.btnSecondaryText}>Eksportuj ostatnią kopię JSON</Text>
          </Pressable>

          <Pressable style={styles.btnRetry} onPress={onRetry} disabled={loading}>
            <Text style={styles.btnRetryText}>Spróbuj uruchomić normalnie</Text>
          </Pressable>

          <Pressable style={styles.btnDanger} onPress={handleResetDb} disabled={loading}>
            <Text style={styles.btnDangerText}>Zresetuj uszkodzoną bazę</Text>
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
