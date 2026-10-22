import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { theme } from '../../core/theme';
import { fillTemplate } from '../../core/access-policy';

export interface PassSettingsCardProps {
  isPro: boolean;
  monthDaysUsed: number;
  freeDaysPerMonth: number;
  onOpenPassModal: () => void;
  t: any;
}

export const PassSettingsCard: React.FC<PassSettingsCardProps> = ({
  isPro,
  monthDaysUsed,
  freeDaysPerMonth,
  onOpenPassModal,
  t,
}) => {
  const limitReached = monthDaysUsed >= freeDaysPerMonth;
  return (
    <View>
      <Text style={styles.sectionTitle}>{t.settings.proTitle} — Apps4Brew Pass</Text>
      <View style={styles.proCard}>
        <View style={styles.proHeader}>
          <Text style={styles.proTitle}>{t.paywall.title}</Text>
          {isPro ? (
            <View style={styles.proActiveBadge}>
              <Text style={styles.proActiveText}>PRO</Text>
            </View>
          ) : limitReached ? (
            <View style={[styles.proActiveBadge, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
              <Text style={[styles.proActiveText, { color: '#ef4444' }]}>
                {t.paywall.limitBadge}
              </Text>
            </View>
          ) : (
            <View style={[styles.proActiveBadge, { backgroundColor: theme.colors.copperMuted }]}>
              <Text style={[styles.proActiveText, { color: theme.colors.copper }]}>
                {fillTemplate(t.paywall.freeBadge, { used: monthDaysUsed, limit: freeDaysPerMonth })}
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.proDesc}>{t.paywall.tagline}</Text>

        <View style={styles.proPerks}>
          <Text style={styles.proPerkItem}>{t.paywall.perk1}</Text>
          <Text style={styles.proPerkItem}>{t.paywall.perk2}</Text>
          <Text style={styles.proPerkItem}>{t.paywall.perk3}</Text>
          <Text style={styles.proPerkItem}>{t.paywall.perk4}</Text>
        </View>

        <Pressable
          testID="open-apps4brew-pass-btn"
          style={[styles.passCtaBtn, styles.touchTarget]}
          onPress={onOpenPassModal}
          accessibilityRole="button"
          accessibilityLabel={isPro ? 'Apps4Brew Pass: Aktywny' : 'Odblokuj Apps4Brew Pass ($0.99 / $4.99 / $14.99)'}
        >
          <Text style={styles.passCtaBtnText}>
            {isPro
              ? 'Licencja Aktywna — Zarządzaj Planem'
              : 'Przejdź do planów ($0.99 / $4.99 / $14.99)'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  touchTarget: { minWidth: 44, minHeight: 44 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    marginBottom: 8,
    marginTop: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  proCard: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.copper,
    marginBottom: 16,
  },
  proHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  proTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  proActiveBadge: {
    backgroundColor: 'rgba(78, 159, 61, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.full,
  },
  proActiveText: {
    color: '#4ade80',
    fontSize: 10,
    fontWeight: '700',
  },
  proDesc: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  proPerks: {
    marginBottom: 16,
    gap: 4,
  },
  proPerkItem: {
    fontSize: 12,
    color: theme.colors.textPrimary,
  },
  passCtaBtn: {
    backgroundColor: theme.colors.copper,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
  },
  passCtaBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
