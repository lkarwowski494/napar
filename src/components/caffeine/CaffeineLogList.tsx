// ============================================================================
// Napar (Steepwise) — CaffeineLogList Component
// Log list of daily caffeine intakes with deletion actions
// ============================================================================

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { CaffeineLog } from '../../core/database-schema';
import { formatDoseWeight } from '../../core/unit-converter';
import { theme } from '../../core/theme';

interface CaffeineLogListProps {
  logs: CaffeineLog[];
  unitSystem: 'metric' | 'imperial';
  onQuickAddPress: () => void;
  onDeleteLog: (log: CaffeineLog) => void;
}

export const CaffeineLogList: React.FC<CaffeineLogListProps> = ({
  logs,
  unitSystem,
  onQuickAddPress,
  onDeleteLog,
}) => {
  return (
    <>
      <View style={styles.listHeaderRow}>
        <Text style={styles.listTitle}>Dzisiejsze Porcje Kofeiny</Text>
        <Pressable
          testID="quick-add-caffeine-btn"
          style={styles.quickAddBtn}
          accessibilityRole="button"
          accessibilityLabel="+ Dodaj porcję kofeiny"
          onPress={onQuickAddPress}
        >
          <Text style={styles.quickAddBtnText}>+ Dodaj</Text>
        </Pressable>
      </View>

      {logs.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Brak zarejestrowanych porcji dzisiaj.</Text>
        </View>
      ) : (
        logs.map((item) => {
          const timeStr = new Date(item.consumedAt).toLocaleTimeString('pl-PL', {
            hour: '2-digit',
            minute: '2-digit',
          });
          return (
            <View key={item.id} style={styles.logItem}>
              <View style={{ flex: 1 }}>
                <Text style={styles.logName}>{item.beverageName}</Text>
                <Text style={styles.logMeta}>
                  {timeStr} · {formatDoseWeight(item.doseGrams, unitSystem)} suszu
                </Text>
              </View>
              <Text style={styles.logMg}>{Math.round(item.caffeineMg)} mg</Text>
              <Pressable
                testID={`delete-caffeine-log-${item.id}`}
                onPress={() => onDeleteLog(item)}
                style={styles.logDeleteBtn}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={`Usuń wpis kofeiny: ${item.beverageName}`}
              >
                <Text style={styles.logDeleteText}>✕</Text>
              </Pressable>
            </View>
          );
        })
      )}
    </>
  );
};

const styles = StyleSheet.create({
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  quickAddBtn: {
    backgroundColor: theme.colors.copper,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    minHeight: 48,
    minWidth: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickAddBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  emptyContainer: {
    padding: 24,
    backgroundColor: theme.colors.bgCard,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  emptyText: {
    color: theme.colors.textMuted,
    fontSize: 14,
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.bgCard,
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  logName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  logMeta: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  logMg: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.copper,
    marginRight: 12,
  },
  logDeleteBtn: {
    padding: 6,
    minHeight: 48,
    minWidth: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logDeleteText: {
    color: theme.colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
  },
});
