import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { theme } from '../../core/theme';
import { CAFFEINE_HALF_LIFE_MIN_H, CAFFEINE_HALF_LIFE_MAX_H } from '../../core/domain-rules';
import { formatDecimal, formatBedtimeHour } from '../../core/unit-converter';

export interface CaffeineSettingsCardProps {
  halfLifeHours: number;
  onHalfLifeChange: (newHours: number) => void;
  bedtimeHour: number;
  onBedtimeChange: (newHour: number) => void;
  t: any;
  language?: 'pl' | 'en';
}

export const CaffeineSettingsCard: React.FC<CaffeineSettingsCardProps> = ({
  halfLifeHours,
  onHalfLifeChange,
  bedtimeHour,
  onBedtimeChange,
  t,
  language = 'pl',
}) => {
  const formattedHalfLife = formatDecimal(halfLifeHours, 1, language);
  const formattedBedtime = formatBedtimeHour(bedtimeHour);
  return (
    <View>
      <Text style={styles.sectionTitle}>
        {t.settings.caffeineSettingsSection || 'Metabolizm Kofeiny & Sen (D-02)'}
      </Text>
      <View style={styles.cardGroup}>
        <View style={styles.actionRow}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={styles.actionTitle}>
              {t.settings.caffeineHalfLifeTitle || 'Czas Półtrwania Kofeiny (t₁/₂)'}
            </Text>
            <Text style={styles.actionSubtitle}>
              {t.settings.caffeineHalfLifeDesc || 'Zakres 2.0–8.0 h (zdrowi dorośli, wg EFSA). Domyślnie: 4.0 h.'}
            </Text>
          </View>
          <View
            testID="caffeine-half-life-stepper"
            style={styles.stepperContainer}
            accessibilityRole="adjustable"
            accessibilityLabel={t.settings.caffeineHalfLifeTitle || 'Czas Półtrwania Kofeiny'}
            accessibilityValue={{ min: CAFFEINE_HALF_LIFE_MIN_H, max: CAFFEINE_HALF_LIFE_MAX_H, now: halfLifeHours, text: `${formattedHalfLife} h` }}
            accessibilityHint={t.settings.caffeineHalfLifeDesc || 'Dostosuj czas półtrwania kofeiny'}
          >
            <Pressable
              style={styles.stepperBtn}
              hitSlop={8}
              accessibilityRole="button"
              onPress={() => onHalfLifeChange(halfLifeHours - 0.5)}
              accessibilityLabel={t.settings.decreaseHalfLife || 'Zmniejsz czas półtrwania'}
              accessibilityHint={t.settings.decreaseHalfLifeHint || 'Zmniejsza czas półtrwania kofeiny o 0.5 godziny'}
            >
              <Text style={styles.stepperBtnText}>−</Text>
            </Pressable>
            <Text style={styles.stepperValueText}>{formattedHalfLife}h</Text>
            <Pressable
              style={styles.stepperBtn}
              hitSlop={8}
              accessibilityRole="button"
              onPress={() => onHalfLifeChange(halfLifeHours + 0.5)}
              accessibilityLabel={t.settings.increaseHalfLife || 'Zwiększ czas półtrwania'}
              accessibilityHint={t.settings.increaseHalfLifeHint || 'Zwiększa czas półtrwania kofeiny o 0.5 godziny'}
            >
              <Text style={styles.stepperBtnText}>+</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.actionRow}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={styles.actionTitle}>
              {t.settings.bedtimeHourTitle || 'Docelowa Godzina Snu'}
            </Text>
            <Text style={styles.actionSubtitle}>
              {t.settings.bedtimeHourDesc || 'Używana do szacunku kofeiny w organizmie o porze snu.'}
            </Text>
          </View>
          <View
            testID="caffeine-bedtime-stepper"
            style={styles.stepperContainer}
            accessibilityRole="adjustable"
            accessibilityLabel={t.settings.bedtimeHourTitle || 'Docelowa Godzina Snu'}
            accessibilityValue={{ min: 18, max: 28, now: bedtimeHour, text: formattedBedtime }}
            accessibilityHint={t.settings.bedtimeHourDesc || 'Dostosuj docelową godzinę snu'}
          >
            <Pressable
              style={styles.stepperBtn}
              hitSlop={8}
              accessibilityRole="button"
              onPress={() => onBedtimeChange(bedtimeHour - 1)}
              accessibilityLabel={t.settings.earlierBedtime || 'Wcześniejsza godzina snu'}
              accessibilityHint={t.settings.earlierBedtimeHint || 'Ustawia wcześniejszą docelową godzinę snu'}
            >
              <Text style={styles.stepperBtnText}>−</Text>
            </Pressable>
            <Text style={styles.stepperValueText}>{formattedBedtime}</Text>
            <Pressable
              style={styles.stepperBtn}
              hitSlop={8}
              accessibilityRole="button"
              onPress={() => onBedtimeChange(bedtimeHour + 1)}
              accessibilityLabel={t.settings.laterBedtime || 'Późniejsza godzina snu'}
              accessibilityHint={t.settings.laterBedtimeHint || 'Ustawia późniejszą docelową godzinę snu'}
            >
              <Text style={styles.stepperBtnText}>+</Text>
            </Pressable>
          </View>
        </View>
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
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginLeft: 16,
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
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.bgCardSecondary,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  stepperBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnText: {
    fontSize: 18,
    color: theme.colors.copper,
    fontWeight: '700',
  },
  stepperValueText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    minWidth: 46,
    textAlign: 'center',
  },
});
