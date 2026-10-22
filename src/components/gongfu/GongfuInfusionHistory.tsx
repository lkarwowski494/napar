// ============================================================================
// Napar (Steepwise) — GongfuInfusionHistory Component
// Caffeine Estimation and Session Infusions List
// ============================================================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GongfuSession, estimateTotalLeafCaffeineMg } from '../../core/gongfu-session';
import { theme } from '../../core/theme';
import { parseDecimal } from '../../core/parse-decimal';

interface GongfuInfusionHistoryProps {
  session: GongfuSession;
  nextInfusionNum: number;
  leafDoseGrams: string;
  t: any;
}

export const GongfuInfusionHistory: React.FC<GongfuInfusionHistoryProps> = ({
  session,
  nextInfusionNum,
  leafDoseGrams,
  t,
}) => {
  const leafDose = parseDecimal(leafDoseGrams) || 7;
  const totalLeafCaffeine = estimateTotalLeafCaffeineMg(leafDose);

  return (
    <>
      {/* Karta Kofeiny Sesji */}
      <View style={styles.caffeineCard}>
        <View style={styles.caffeineRow}>
          <Text style={styles.caffeineTitle}>{t.gongfu.totalCaffeine}</Text>
          <Text style={styles.caffeineValue}>~{session.totalCaffeineMg} mg</Text>
        </View>
        <Text style={styles.caffeineSub}>
          Zalanie #{nextInfusionNum} dostarczy ok.{' '}
          {totalLeafCaffeine > 0
            ? (
                totalLeafCaffeine *
                (nextInfusionNum === 1
                  ? 0.45
                  : nextInfusionNum === 2
                  ? 0.3
                  : nextInfusionNum === 3
                  ? 0.15
                  : 0.05)
              ).toFixed(1)
            : 0}{' '}
          mg (model kinetyki RD-19).
        </Text>
      </View>

      {/* Historia Zalań Sesji */}
      {session.infusions.length > 0 && (
        <View style={styles.historyCard}>
          <Text style={styles.historyTitle}>
            {t.gongfu.sessionHistory} ({session.infusions.length})
          </Text>
          {session.infusions.map((inf) => (
            <View key={inf.infusionNumber} style={styles.historyItem}>
              <View style={styles.historyItemHeader}>
                <Text style={styles.historyNumber}>#{inf.infusionNumber}</Text>
                <Text style={styles.historyDuration}>{inf.durationSeconds}s</Text>
                <Text style={styles.historyCaffeine}>+{inf.caffeineMg} mg</Text>
              </View>
              {inf.notes && <Text style={styles.historyNotes}>{inf.notes}</Text>}
            </View>
          ))}
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  caffeineCard: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 16,
  },
  caffeineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  caffeineTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  caffeineValue: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.emeraldLight,
  },
  caffeineSub: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    lineHeight: 16,
  },
  historyCard: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  historyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  historyItem: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingVertical: 10,
  },
  historyItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyNumber: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  historyDuration: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.copper,
  },
  historyCaffeine: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.emeraldLight,
  },
  historyNotes: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
    fontStyle: 'italic',
  },
});
