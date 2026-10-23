import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../core/theme';
import {
  NaparAppIcon,
  PiekarzAppIcon,
  SloikAppIcon,
  MasazAppIcon,
  FermentAppIcon,
} from '../icons/CraftIcons';
import { CRAFT_APPS } from '../../core/craft-suite-theme';
import { getTranslations } from '../../core/i18n';
import type { SupportedLanguage } from '../../core/i18n';

export interface CraftFamilyShowcaseProps {
  language: SupportedLanguage;
}

export const CraftFamilyShowcase: React.FC<CraftFamilyShowcaseProps> = ({ language }) => {
  const t = getTranslations(language);
  return (
    <View>
      <Text style={styles.sectionTitle}>
        {t.craftFamily.title}
      </Text>
      <View style={styles.cardGroup}>
        {/* Napar */}
        <View style={styles.craftAppRow}>
          <View style={[styles.craftAppIconBox, { backgroundColor: 'rgba(200, 106, 40, 0.15)' }]}>
            <NaparAppIcon size={24} color={CRAFT_APPS.napar.accent} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.actionTitle}>Napar</Text>
              <View style={styles.currentAppPill}>
                <Text style={styles.currentAppPillText}>{t.craftFamily.installed}</Text>
              </View>
            </View>
            <Text style={styles.actionSubtitle}>
              {t.craftFamily.napar}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Piekarz */}
        <View style={styles.craftAppRow}>
          <View style={[styles.craftAppIconBox, { backgroundColor: 'rgba(212, 155, 66, 0.15)' }]}>
            <PiekarzAppIcon size={24} color={CRAFT_APPS.piekarz.accent} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.actionTitle}>Piekarz</Text>
              <View style={styles.upcomingAppPill}>
                <Text style={styles.upcomingAppPillText}>{t.craftFamily.upcoming}</Text>
              </View>
            </View>
            <Text style={styles.actionSubtitle}>
              {t.craftFamily.piekarz}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Słoik */}
        <View style={styles.craftAppRow}>
          <View style={[styles.craftAppIconBox, { backgroundColor: 'rgba(91, 138, 97, 0.15)' }]}>
            <SloikAppIcon size={24} color={CRAFT_APPS.sloik.accent} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.actionTitle}>Słoik</Text>
              <View style={styles.upcomingAppPill}>
                <Text style={styles.upcomingAppPillText}>{t.craftFamily.upcoming}</Text>
              </View>
            </View>
            <Text style={styles.actionSubtitle}>
              {t.craftFamily.sloik}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Masaż */}
        <View style={styles.craftAppRow}>
          <View style={[styles.craftAppIconBox, { backgroundColor: 'rgba(164, 62, 56, 0.15)' }]}>
            <MasazAppIcon size={24} color={CRAFT_APPS.masaz.accent} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.actionTitle}>Masaż</Text>
              <View style={styles.upcomingAppPill}>
                <Text style={styles.upcomingAppPillText}>{t.craftFamily.upcoming}</Text>
              </View>
            </View>
            <Text style={styles.actionSubtitle}>
              {t.craftFamily.masaz}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Ferment */}
        <View style={styles.craftAppRow}>
          <View style={[styles.craftAppIconBox, { backgroundColor: 'rgba(224, 168, 56, 0.15)' }]}>
            <FermentAppIcon size={24} color={CRAFT_APPS.ferment.accent} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.actionTitle}>Ferment</Text>
              <View style={styles.upcomingAppPill}>
                <Text style={styles.upcomingAppPillText}>{t.craftFamily.upcoming}</Text>
              </View>
            </View>
            <Text style={styles.actionSubtitle}>
              {t.craftFamily.ferment}
            </Text>
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
  craftAppRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  craftAppIconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  currentAppPill: {
    backgroundColor: 'rgba(78, 159, 61, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.full,
  },
  currentAppPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4ade80',
  },
  upcomingAppPill: {
    backgroundColor: theme.colors.bgCardSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.full,
  },
  upcomingAppPillText: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
});
