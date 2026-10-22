import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput } from 'react-native';
import {
  getOwnWaterProfile,
  saveOwnWaterProfile,
  deleteOwnWaterProfile,
} from '../../core/database';
import {
  validateOwnWaterForm,
  type HardnessUnit,
  type OwnWaterFormField,
  type OwnWaterProfile,
  type WaterFieldError,
} from '../../core/own-water';
import { calculateTopUpFromSource } from '../../core/water-chemistry';
import { confirm } from '../../core/confirm';
import { theme } from '../../core/theme';

export interface OwnWaterCardProps {
  language: string;
  t: any;
  /** Profil docelowy z kalkulatora (GH/KH w ppm CaCO₃). */
  target: { ghPpm: number; khPpm: number };
  volumeLiters: number;
}

/**
 * Własna woda z raportu wodociągów (poz. 9): zapis lokalny, edycja, usunięcie
 * oraz dolewka koncentratów z tego profilu do wybranego celu.
 */
export const OwnWaterCard: React.FC<OwnWaterCardProps> = ({ t, target, volumeLiters }) => {
  const [profile, setProfile] = useState<OwnWaterProfile | null>(() => getOwnWaterProfile());
  const [editing, setEditing] = useState<boolean>(false);
  const [sourceName, setSourceName] = useState<string>('');
  const [ghInput, setGhInput] = useState<string>('');
  const [khInput, setKhInput] = useState<string>('');
  const [ghUnit, setGhUnit] = useState<HardnessUnit>('mgCaCO3');
  const [khUnit, setKhUnit] = useState<HardnessUnit>('mgCaCO3');
  const [errors, setErrors] = useState<Partial<Record<OwnWaterFormField, WaterFieldError>>>({});
  const [saveFailed, setSaveFailed] = useState<boolean>(false);

  const topUp = useMemo(
    () =>
      profile
        ? calculateTopUpFromSource(volumeLiters, profile, { ghPpm: target.ghPpm, khPpm: target.khPpm })
        : null,
    [profile, target.ghPpm, target.khPpm, volumeLiters]
  );

  const startEditing = () => {
    setSourceName(profile ? profile.sourceName : '');
    setGhInput(profile ? String(profile.ghPpm) : '');
    setKhInput(profile ? String(profile.khPpm) : '');
    setGhUnit('mgCaCO3');
    setKhUnit('mgCaCO3');
    setErrors({});
    setSaveFailed(false);
    setEditing(true);
  };

  const cancelEditing = () => {
    setErrors({});
    setSaveFailed(false);
    setEditing(false);
  };

  const save = () => {
    const result = validateOwnWaterForm(
      { sourceName, gh: ghInput, kh: khInput, ghUnit, khUnit },
      new Date().toISOString()
    );
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    try {
      saveOwnWaterProfile(result.profile);
      setProfile(result.profile);
      setErrors({});
      setSaveFailed(false);
      setEditing(false);
    } catch {
      setSaveFailed(true);
    }
  };

  const removeProfile = () => {
    confirm({
      title: t.water.ownDeleteTitle,
      message: t.water.ownDeleteMessage,
      confirmText: t.common.delete,
      destructive: true,
      onConfirm: () => {
        deleteOwnWaterProfile();
        setProfile(null);
      },
    });
  };

  const errorText = (field: OwnWaterFormField): string | null => {
    const error = errors[field];
    if (!error) return null;
    if (error === 'negative') return t.water.ownErrNegative;
    if (error === 'invalid') return t.water.ownErrInvalid;
    return t.water.ownErrEmpty;
  };

  const renderUnitChips = (value: HardnessUnit, onChange: (unit: HardnessUnit) => void, prefix: string) => (
    <View style={styles.unitRow}>
      {(['mgCaCO3', 'dH'] as HardnessUnit[]).map((unit) => {
        const selected = value === unit;
        return (
          <Pressable
            key={unit}
            testID={`${prefix}-unit-${unit}`}
            style={[styles.unitChip, selected && styles.unitChipActive]}
            onPress={() => onChange(unit)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={unit === 'dH' ? t.water.ownUnitDh : t.water.ownUnitMg}
          >
            <Text style={[styles.unitChipText, selected && styles.unitChipTextActive]}>
              {unit === 'dH' ? t.water.ownUnitDh : t.water.ownUnitMg}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  return (
    <View style={styles.card} testID="own-water-card">
      <Text style={styles.header}>{t.water.ownTitle}</Text>
      <Text style={styles.intro}>{t.water.ownIntro}</Text>

      {editing ? (
        <View>
          <Text style={styles.label}>{t.water.ownSourceLabel}</Text>
          <TextInput
            testID="own-water-source-input"
            style={styles.input}
            value={sourceName}
            onChangeText={setSourceName}
            accessibilityLabel={t.water.ownSourceLabel}
          />
          {errorText('sourceName') && <Text style={styles.error}>{errorText('sourceName')}</Text>}

          <Text style={styles.label}>{t.water.targetGhLabel}</Text>
          <TextInput
            testID="own-water-gh-input"
            style={styles.input}
            keyboardType="decimal-pad"
            value={ghInput}
            onChangeText={setGhInput}
            accessibilityLabel={t.water.targetGhLabel}
          />
          {renderUnitChips(ghUnit, setGhUnit, 'own-water-gh')}
          {errorText('gh') && <Text style={styles.error}>{errorText('gh')}</Text>}

          <Text style={styles.label}>{t.water.targetKhLabel}</Text>
          <TextInput
            testID="own-water-kh-input"
            style={styles.input}
            keyboardType="decimal-pad"
            value={khInput}
            onChangeText={setKhInput}
            accessibilityLabel={t.water.targetKhLabel}
          />
          {renderUnitChips(khUnit, setKhUnit, 'own-water-kh')}
          {errorText('kh') && <Text style={styles.error}>{errorText('kh')}</Text>}

          {saveFailed && <Text style={styles.error}>{t.water.ownSaveFailed}</Text>}

          <View style={styles.buttonRow}>
            <Pressable
              testID="own-water-cancel-btn"
              style={[styles.secondaryButton, styles.touchTarget]}
              onPress={cancelEditing}
              accessibilityRole="button"
              accessibilityLabel={t.common.cancel}
            >
              <Text style={styles.secondaryButtonText}>{t.common.cancel}</Text>
            </Pressable>
            <Pressable
              testID="own-water-save-btn"
              style={[styles.primaryButton, styles.touchTarget]}
              onPress={save}
              accessibilityRole="button"
              accessibilityLabel={t.common.save}
            >
              <Text style={styles.primaryButtonText}>{t.common.save}</Text>
            </Pressable>
          </View>
        </View>
      ) : profile ? (
        <View>
          <Text style={styles.sourceName}>{profile.sourceName}</Text>
          <Text style={styles.values} testID="own-water-values">
            {t.water.ownGhKhLine.replace('{gh}', String(profile.ghPpm)).replace('{kh}', String(profile.khPpm))}
          </Text>
          <View style={styles.buttonRow}>
            <Pressable
              testID="own-water-edit-btn"
              style={[styles.secondaryButton, styles.touchTarget]}
              onPress={startEditing}
              accessibilityRole="button"
              accessibilityLabel={t.common.edit}
            >
              <Text style={styles.secondaryButtonText}>{t.common.edit}</Text>
            </Pressable>
            <Pressable
              testID="own-water-delete-btn"
              style={[styles.secondaryButton, styles.touchTarget]}
              onPress={removeProfile}
              accessibilityRole="button"
              accessibilityLabel={t.common.delete}
            >
              <Text style={styles.deleteButtonText}>{t.common.delete}</Text>
            </Pressable>
          </View>

          <View style={styles.topUpBox} testID="own-water-topup">
            <Text style={styles.topUpTitle}>{t.water.ownTopUpTitle}</Text>
            <Text style={styles.topUpHelp}>
              {t.water.ownTopUpFor.replace('{gh}', String(target.ghPpm)).replace('{kh}', String(target.khPpm))}
            </Text>
            <View style={styles.doseRow}>
              <View style={styles.doseBox}>
                <Text style={styles.doseLabel}>{t.water.bufferGrams}</Text>
                <Text style={styles.doseValue}>{`${topUp ? topUp.bufferGrams : 0} g`}</Text>
              </View>
              <View style={styles.doseBox}>
                <Text style={styles.doseLabel}>{t.water.hardnessGrams}</Text>
                <Text style={styles.doseValue}>{`${topUp ? topUp.hardnessGrams : 0} g`}</Text>
              </View>
            </View>
            {topUp && (topUp.khAtOrAboveTarget || topUp.ghAtOrAboveTarget) && (
              <Text style={styles.topUpWarning}>{t.water.ownTopUpAboveTarget}</Text>
            )}
          </View>
        </View>
      ) : (
        <Pressable
          testID="own-water-add-btn"
          style={[styles.primaryButton, styles.touchTarget]}
          onPress={startEditing}
          accessibilityRole="button"
          accessibilityLabel={t.water.ownAdd}
        >
          <Text style={styles.primaryButtonText}>{t.water.ownAdd}</Text>
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  touchTarget: { minWidth: 44, minHeight: 44 },
  card: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.md,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  header: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 6,
  },
  intro: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    lineHeight: 17,
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginTop: 8,
    marginBottom: 4,
  },
  input: {
    backgroundColor: theme.colors.bgCardSecondary,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 12,
    minHeight: 44,
    color: theme.colors.textPrimary,
    fontSize: 14,
  },
  unitRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  unitChip: {
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: 12,
    justifyContent: 'center',
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.bgCardSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  unitChipActive: {
    backgroundColor: theme.colors.copperMuted,
    borderColor: theme.colors.copper,
  },
  unitChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  unitChipTextActive: {
    color: theme.colors.copperLight,
    fontWeight: '700',
  },
  error: {
    fontSize: 12,
    color: theme.colors.textPrimary,
    marginTop: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  primaryButton: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.copper,
    paddingHorizontal: 12,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.bgCard,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 12,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  sourceName: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  values: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  topUpBox: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  topUpTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  topUpHelp: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    lineHeight: 16,
    marginTop: 4,
    marginBottom: 8,
  },
  doseRow: {
    flexDirection: 'row',
    gap: 10,
  },
  doseBox: {
    flex: 1,
    backgroundColor: theme.colors.bgCardSecondary,
    borderRadius: theme.borderRadius.sm,
    padding: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  doseLabel: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  doseValue: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.copper,
  },
  topUpWarning: {
    fontSize: 12,
    color: theme.colors.textPrimary,
    lineHeight: 16,
    marginTop: 8,
  },
});
