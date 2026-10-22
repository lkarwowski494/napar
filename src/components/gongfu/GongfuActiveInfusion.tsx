// ============================================================================
// Napar (Steepwise) — GongfuActiveInfusion Component
// Active Countdown Timer and Infusion Capture Card
// ============================================================================

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Field } from '../ui';
import { theme } from '../../core/theme';

interface GongfuActiveInfusionProps {
  nextInfusionNum: number;
  remainingSeconds: number;
  targetSeconds: number;
  isSteeping: boolean;
  steepFinished: boolean;
  onAdjustTime: (delta: number) => void;
  onStartSteep: () => void;
  currentNotes: string;
  onChangeCurrentNotes: (text: string) => void;
  onRecordCurrentInfusion: () => void;
  t: any;
}

export const GongfuActiveInfusion: React.FC<GongfuActiveInfusionProps> = ({
  nextInfusionNum,
  remainingSeconds,
  targetSeconds,
  isSteeping,
  steepFinished,
  onAdjustTime,
  onStartSteep,
  currentNotes,
  onChangeCurrentNotes,
  onRecordCurrentInfusion,
  t,
}) => {
  return (
    <View style={styles.timerCard}>
      <Text style={styles.infusionBadge}>
        {t.gongfu.infusionNumber} #{nextInfusionNum}
      </Text>

      <Text style={styles.timerCountdown}>
        {remainingSeconds < 10 ? `0${remainingSeconds}` : remainingSeconds}
        <Text style={styles.secondsUnit}>s</Text>
      </Text>

      {/* Przyciski korekty czasu +/- 5s */}
      <View style={styles.adjustRow}>
        <Pressable
          style={styles.adjustBtn}
          onPress={() => onAdjustTime(-5)}
          disabled={isSteeping}
        >
          <Text style={styles.adjustBtnText}>{t.gongfu.subSeconds}</Text>
        </Pressable>
        <Text style={styles.targetLabel}>
          {isSteeping ? 'Trwa parzenie...' : `Cel: ${targetSeconds}s`}
        </Text>
        <Pressable
          style={styles.adjustBtn}
          onPress={() => onAdjustTime(5)}
          disabled={isSteeping}
        >
          <Text style={styles.adjustBtnText}>{t.gongfu.addSeconds}</Text>
        </Pressable>
      </View>

      {/* Główny Przycisk Parzenia */}
      {!isSteeping && !steepFinished && (
        <Pressable testID="gongfu-start-btn" style={styles.startBtn} onPress={onStartSteep}>
          <Text style={styles.startBtnText}>{t.gongfu.startSteep}</Text>
        </Pressable>
      )}

      {isSteeping && (
        <View style={styles.steepingActiveBox}>
          <Text style={styles.steepingActiveText}>PARZENIE W TOKU</Text>
        </View>
      )}

      {/* Panel po zakończeniu zalania */}
      {steepFinished && (
        <View style={styles.finishedInfusionPanel}>
          <Text style={styles.pourAlertText}>{t.gongfu.pourNow}</Text>
          <Field
            value={currentNotes}
            onChangeText={onChangeCurrentNotes}
            placeholder={t.gongfu.infusionNotesPlaceholder}
          />
          <Pressable
            style={[styles.recordNextBtn, styles.touchTarget]}
            onPress={onRecordCurrentInfusion}
          >
            <Text style={styles.recordNextBtnText}>{t.gongfu.nextInfusion}</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  touchTarget: { minWidth: 44, minHeight: 44 },
  timerCard: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1.5,
    borderColor: theme.colors.emerald,
    alignItems: 'center',
    marginBottom: 16,
  },
  infusionBadge: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.emeraldLight,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  timerCountdown: {
    fontSize: 72,
    fontWeight: '900',
    color: theme.colors.textPrimary,
    fontVariant: ['tabular-nums'],
    marginVertical: 4,
  },
  secondsUnit: {
    fontSize: 24,
    color: theme.colors.textMuted,
    fontWeight: '600',
  },
  adjustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 10,
  },
  adjustBtn: {
    backgroundColor: theme.colors.bgCardSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    minHeight: 48,
    minWidth: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adjustBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  targetLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    minWidth: 80,
    textAlign: 'center',
  },
  startBtn: {
    backgroundColor: theme.colors.emerald,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 28,
    marginTop: 10,
    minHeight: 48,
    minWidth: 180,
    alignItems: 'center',
  },
  startBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  steepingActiveBox: {
    backgroundColor: 'rgba(42, 123, 98, 0.15)',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 18,
    marginTop: 10,
    borderWidth: 1,
    borderColor: theme.colors.emerald,
  },
  steepingActiveText: {
    color: theme.colors.emeraldLight,
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 1,
  },
  finishedInfusionPanel: {
    width: '100%',
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 12,
  },
  pourAlertText: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.copper,
    textAlign: 'center',
    marginBottom: 8,
  },
  recordNextBtn: {
    backgroundColor: theme.colors.copper,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
    minHeight: 48,
  },
  recordNextBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
});
