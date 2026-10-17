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

export interface CraftFamilyShowcaseProps {
  language: string;
}

export const CraftFamilyShowcase: React.FC<CraftFamilyShowcaseProps> = ({ language }) => {
  return (
    <View>
      <Text style={styles.sectionTitle}>
        {language === 'pl' ? 'Rodzina Apps4Craft Studio' : 'Apps4Craft Studio Family'}
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
                <Text style={styles.currentAppPillText}>{language === 'pl' ? 'Zainstalowano' : 'Installed'}</Text>
              </View>
            </View>
            <Text style={styles.actionSubtitle}>
              {language === 'pl' ? 'Kawa Specialty & Herbata Rzemieślnicza' : 'Specialty Coffee & Artisan Tea'}
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
                <Text style={styles.upcomingAppPillText}>{language === 'pl' ? 'Wkrótce' : 'Upcoming'}</Text>
              </View>
            </View>
            <Text style={styles.actionSubtitle}>
              {language === 'pl' ? 'Chleb na Zakwasie, Hydratacja & Fermentacja' : 'Sourdough Bread, Hydration & Schedule'}
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
                <Text style={styles.upcomingAppPillText}>{language === 'pl' ? 'Wkrótce' : 'Upcoming'}</Text>
              </View>
            </View>
            <Text style={styles.actionSubtitle}>
              {language === 'pl' ? 'Kiszonki, Solanki & Wekowanie Warzyw' : 'Fermented Pickles, Brine % & Canning'}
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
                <Text style={styles.upcomingAppPillText}>{language === 'pl' ? 'Wkrótce' : 'Upcoming'}</Text>
              </View>
            </View>
            <Text style={styles.actionSubtitle}>
              {language === 'pl' ? 'Wędliny, Peklosól, Sezonowanie & Ubytek Masy' : 'Charcuterie, Curing Salt & Weight Loss'}
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
                <Text style={styles.upcomingAppPillText}>{language === 'pl' ? 'Wkrótce' : 'Upcoming'}</Text>
              </View>
            </View>
            <Text style={styles.actionSubtitle}>
              {language === 'pl' ? 'Sery Rzemieślnicze, Podpuszczka & Dojrzewalnia' : 'Artisan Cheeses, Rennet & Aging Cellar'}
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
