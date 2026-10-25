import * as Linking from 'expo-linking';
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { theme } from '../../core/theme';

export interface PassSettingsCardProps {
  isSubscribed: boolean;
  subscriptionTier: string;
  accessStatus: string;
  brewsRemaining: number;
  onOpenPassModal: () => void;
  t: any;
}

export const PassSettingsCard: React.FC<PassSettingsCardProps> = ({
  isSubscribed,
  subscriptionTier,
  accessStatus,
  brewsRemaining,
  onOpenPassModal,
  t,
}) => {
  return (
    <View>
      <Text style={styles.sectionTitle}>{t.settings.proTitle} — Apps4Brew Pass</Text>
      <View style={styles.proCard}>
        <View style={styles.proHeader}>
          <Text style={styles.proTitle}>{t.paywall.title}</Text>
          {isSubscribed ? (
            <View style={styles.proActiveBadge}>
              <Text style={styles.proActiveText}>
                {subscriptionTier.toUpperCase()} PRO
              </Text>
            </View>
          ) : accessStatus === 'trial_active' ? (
            <View style={[styles.proActiveBadge, { backgroundColor: theme.colors.copperMuted }]}>
              <Text style={[styles.proActiveText, { color: theme.colors.copper }]}>
                TRIAL ({brewsRemaining} {brewsRemaining === 1 ? 'parzenie' : 'parzenia'})
              </Text>
            </View>
          ) : (
            <View style={[styles.proActiveBadge, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
              <Text style={[styles.proActiveText, { color: '#ef4444' }]}>
                TRIAL WYGASŁ
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
          style={styles.passCtaBtn}
          onPress={onOpenPassModal}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={isSubscribed ? 'Apps4Brew Pass: Aktywny' : 'Odblokuj Apps4Brew Pass ($0.99 / $4.99 / $14.99)'}
        >
          <Text style={styles.passCtaBtnText}>
            {isSubscribed
              ? 'Szczegóły licencji / Przywróć zakupy'
              : 'Przejdź do planów ($0.99 / $4.99 / $14.99)'}
          </Text>
        </Pressable>

        {isSubscribed && (
          <Pressable
            testID="manage-plan-btn"
            style={[styles.passCtaBtn, { marginTop: 8, backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.colors.border }]}
            onPress={() => void Linking.openURL('https://apps.apple.com/account/subscriptions')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="link"
            accessibilityLabel="Zarządzaj subskrypcją w App Store"
          >
            <Text style={[styles.passCtaBtnText, { color: theme.colors.copper }]}>
              Zarządzaj Planem w App Store ↗
            </Text>
          </Pressable>
        )}
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
