import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { theme } from '../../core/theme';

export interface DataBackupCardProps {
  onExportJson: () => void;
  onOpenImportJson: () => void;
  onExportSessionsCsv: () => void;
  onExportInventoryCsv: () => void;
}

export const DataBackupCard: React.FC<DataBackupCardProps> = ({
  onExportJson,
  onOpenImportJson,
  onExportSessionsCsv,
  onExportInventoryCsv,
}) => {
  return (
    <View>
      <Text style={styles.sectionTitle}>Twoje Dane (ZP-06 & ZP-07)</Text>
      <View style={styles.cardGroup}>
        <Pressable
          testID="export-json-btn"
          style={styles.actionRow}
          onPress={onExportJson}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.actionTitle}>Eksportuj Kopię Zapasową (JSON)</Text>
            <Text style={styles.actionSubtitle}>
              Pobierz pełną historię parzeń, spiżarnię i notatki w otwartym formacie
            </Text>
          </View>
          <Text style={styles.actionArrow}>↗</Text>
        </Pressable>

        <View style={styles.divider} />

        <Pressable
          testID="import-json-btn"
          style={styles.actionRow}
          onPress={onOpenImportJson}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.actionTitle}>Importuj Kopię z Pliku JSON</Text>
            <Text style={styles.actionSubtitle}>
              Przywróć stan spiżarni i sesji z wcześniejszej kopii zapasowej
            </Text>
          </View>
          <Text style={styles.actionArrow}>↙</Text>
        </Pressable>

        <View style={styles.divider} />

        <Pressable
          testID="export-csv-sessions-btn"
          style={styles.actionRow}
          onPress={onExportSessionsCsv}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.actionTitle}>Eksportuj Dziennik (CSV)</Text>
            <Text style={styles.actionSubtitle}>
              Arkusz kalkulacyjny (Excel, Google Sheets) z historią zaparzeń i sensoryką
            </Text>
          </View>
          <Text style={styles.actionArrow}>CSV</Text>
        </Pressable>

        <View style={styles.divider} />

        <Pressable style={styles.actionRow} onPress={onExportInventoryCsv}>
          <View style={{ flex: 1 }}>
            <Text style={styles.actionTitle}>Eksportuj Spiżarnię (CSV)</Text>
            <Text style={styles.actionSubtitle}>
              Zestawienie paczek ziaren, herbat, palarni, dat palenia i zapasów
            </Text>
          </View>
          <Text style={styles.actionArrow}>CSV</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    marginBottom: 8,
    marginTop: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardGroup: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
    marginBottom: 16,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    lineHeight: 16,
  },
  actionArrow: {
    fontSize: 16,
    color: theme.colors.textMuted,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginLeft: 16,
  },
});
