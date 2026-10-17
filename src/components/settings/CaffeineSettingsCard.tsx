import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { theme } from '../../core/theme';

export interface CaffeineSettingsCardProps {
  halfLifeHours: number;
  onHalfLifeChange: (newHours: number) => void;
  bedtimeHour: number;
  onBedtimeChange: (newHour: number) => void;
  healthKitSync: boolean;
  onToggleHealthKit: () => void;
  t: any;
}

export const CaffeineSettingsCard: React.FC<CaffeineSettingsCardProps> = ({
  halfLifeHours,
  onHalfLifeChange,
  bedtimeHour,
  onBedtimeChange,
  healthKitSync,
  onToggleHealthKit,
  t,
}) => {
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
              {t.settings.caffeineHalfLifeDesc || 'Wskaźnik klirensu wątrobowego (3.0h–8.0h, domyślnie 5.0h wg EFSA).'}
            </Text>
          </View>
          <View style={styles.stepperContainer}>
            <Pressable
              style={styles.stepperBtn}
              hitSlop={8}
              accessibilityRole="button"
              onPress={() => onHalfLifeChange(halfLifeHours - 0.5)}
              accessibilityLabel="Zmniejsz czas półtrwania"
            >
              <Text style={styles.stepperBtnText}>−</Text>
            </Pressable>
            <Text style={styles.stepperValueText}>{halfLifeHours.toFixed(1)}h</Text>
            <Pressable
              style={styles.stepperBtn}
              hitSlop={8}
              accessibilityRole="button"
              onPress={() => onHalfLifeChange(halfLifeHours + 0.5)}
              accessibilityLabel="Zwiększ czas półtrwania"
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
              {t.settings.bedtimeHourDesc || 'Używana do kalkulacji nocnego curfew i progu 25 mg dla fazy NREM.'}
            </Text>
          </View>
          <View style={styles.stepperContainer}>
            <Pressable
              style={styles.stepperBtn}
              hitSlop={8}
              accessibilityRole="button"
              onPress={() => onBedtimeChange(bedtimeHour - 1)}
              accessibilityLabel="Wcześniejsza godzina snu"
            >
              <Text style={styles.stepperBtnText}>−</Text>
            </Pressable>
            <Text style={styles.stepperValueText}>{`${bedtimeHour}:00`}</Text>
            <Pressable
              style={styles.stepperBtn}
              hitSlop={8}
              accessibilityRole="button"
              onPress={() => onBedtimeChange(bedtimeHour + 1)}
              accessibilityLabel="Późniejsza godzina snu"
            >
              <Text style={styles.stepperBtnText}>+</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.divider} />

        {/* BR-KOF-002: Apple HealthKit Integration */}
        <View style={styles.actionRow}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={styles.actionTitle}>
              {t.settings.healthKitTitle || 'Synchronizuj Kofeinę z Apple Health'}
            </Text>
            <Text style={styles.actionSubtitle}>
              {t.settings.healthKitSubtitle || 'Automatycznie zapisuj spożytą kofeinę (Dietary Caffeine) w aplikacji Zdrowie bez wysyłania danych na zewnątrz.'}
            </Text>
          </View>
          <Pressable
            testID="toggle-healthkit-btn"
            style={[
              styles.toggleBtn,
              healthKitSync && styles.toggleBtnActive,
            ]}
            onPress={onToggleHealthKit}
            accessibilityRole="switch"
            accessibilityLabel={`${t.settings.healthKitTitle}: ${healthKitSync ? t.settings.enabled : t.settings.disabled}`}
          >
            <Text
              style={[
                styles.toggleBtnText,
                healthKitSync && styles.toggleBtnTextActive,
              ]}
            >
              {healthKitSync ? t.settings.enabled : t.settings.disabled}
            </Text>
          </Pressable>
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
  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.bgCardSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  toggleBtnActive: {
    backgroundColor: theme.colors.copperMuted,
    borderColor: theme.colors.copper,
  },
  toggleBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  toggleBtnTextActive: {
    color: theme.colors.copperLight,
    fontWeight: '700',
  },
});
