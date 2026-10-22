import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { getAppSetting, getGrinderCalibrationStatus, resetGrinderCalibration } from '../../core/database';
import { SUPPORTED_GRINDERS } from '../../core/grinder-converter';
import {
  GRINDER_CALIBRATION_MIN_PAIRS,
  notifyGrinderCalibrationChanged,
  onGrinderCalibrationChanged,
  type GrinderCalibration,
} from '../../core/grinder-calibration';
import { confirm } from '../../core/confirm';
import { theme } from '../../core/theme';

export interface GrinderCalibrationCardProps {
  t: any;
}

const DEFAULT_GRINDER_ID = 'comandante_c40';

function formatSignedClicks(shift: number): string {
  const sign = shift > 0 ? '+' : '';
  return `${sign}${shift.toFixed(2)}`;
}

/**
 * Jawny stan kalibracji młynka (poz. 12): ile parzeń ją stworzyło i przycisk wyzerowania.
 * Dane są z dziennika; wyzerowanie nie kasuje parzeń, tylko liczy je od tej chwili.
 */
export const GrinderCalibrationCard: React.FC<GrinderCalibrationCardProps> = ({ t }) => {
  const [revision, setRevision] = useState<number>(0);
  useEffect(() => onGrinderCalibrationChanged(() => setRevision((rev) => rev + 1)), []);

  const grinderId = getAppSetting('default_grinder', DEFAULT_GRINDER_ID);
  const grinderName = SUPPORTED_GRINDERS.find((g) => g.id === grinderId)?.name ?? grinderId;
  const calibration: GrinderCalibration = useMemo(
    () => getGrinderCalibrationStatus(grinderId),
    // revision odświeża odczyt po zapisie parzenia lub wyzerowaniu kalibracji
    [grinderId, revision]
  );

  const resetCalibration = () => {
    confirm({
      title: t.grinder.calibResetTitle,
      message: t.grinder.calibResetMessage,
      confirmText: t.grinder.calibResetAction,
      destructive: true,
      onConfirm: () => {
        resetGrinderCalibration(grinderId);
        notifyGrinderCalibrationChanged();
      },
    });
  };

  return (
    <View style={styles.card} testID="grinder-calibration-card">
      <Text style={styles.header}>{t.grinder.calibTitle}</Text>
      <Text style={styles.help}>{t.grinder.calibHelp}</Text>
      <Text style={styles.count} testID="grinder-calibration-count">
        {t.grinder.calibCount
          .replace('{grinder}', grinderName)
          .replace('{count}', String(calibration.pairCount))}
      </Text>
      <Text style={styles.status} testID="grinder-calibration-status">
        {calibration.isActive
          ? t.grinder.calibActive.replace('{shift}', formatSignedClicks(calibration.shiftClicks))
          : t.grinder.calibInactive.replace('{min}', String(GRINDER_CALIBRATION_MIN_PAIRS))}
      </Text>
      <Pressable
        testID="grinder-calibration-reset-btn"
        style={styles.resetButton}
        onPress={resetCalibration}
        accessibilityRole="button"
        accessibilityLabel={t.grinder.calibReset}
      >
        <Text style={styles.resetText}>{t.grinder.calibReset}</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.bgCardSecondary,
    borderRadius: theme.borderRadius.sm,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginTop: 12,
  },
  header: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  help: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    lineHeight: 16,
    marginBottom: 8,
  },
  count: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  status: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    lineHeight: 16,
    marginBottom: 10,
  },
  resetButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 12,
  },
  resetText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
});
