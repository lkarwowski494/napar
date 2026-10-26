// ============================================================================
// Napar (Steepwise) — AppPreferencesCard Component
// Language, Beverage preferences, Unit system, and Accessibility toggles
// ============================================================================

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { theme } from '../../core/theme';
import { BeveragePreference } from '../../core/database';
import { CheckIcon } from '../icons/CraftIcons';
import {
  formatTemperature,
  formatDoseWeight,
  formatWaterWeight,
} from '../../core/unit-converter';

interface AppPreferencesCardProps {
  t: any;
  language: string;
  onSetLanguage: (lang: 'pl' | 'en') => void;
  beveragePreference: BeveragePreference;
  onSelectBeveragePreference: (pref: BeveragePreference) => void;
  unitSystem: 'metric' | 'imperial';
  onSelectUnitSystem: (unit: 'metric' | 'imperial') => void;
  voiceAnnounce: boolean;
  onToggleVoiceAnnounce: () => void;
  haptics: boolean;
  onToggleHaptics: () => void;
}

export const AppPreferencesCard: React.FC<AppPreferencesCardProps> = ({
  t,
  language,
  onSetLanguage,
  beveragePreference,
  onSelectBeveragePreference,
  unitSystem,
  onSelectUnitSystem,
  voiceAnnounce,
  onToggleVoiceAnnounce,
  haptics,
  onToggleHaptics,
}) => {
  return (
    <>
      {/* Przełącznik Języka (PL / EN) */}
      <Text style={styles.sectionTitle}>{t.settings.languageSection}</Text>
      <View
        testID="language-radiogroup"
        style={styles.langSelectorRow}
        accessibilityRole="radiogroup"
        accessibilityLabel={t.settings.languageSection || 'Wybór języka'}
      >
        <Pressable
          style={[styles.langTab, language === 'pl' && styles.langTabActive]}
          onPress={() => onSetLanguage('pl')}
          accessibilityRole="radio"
          accessibilityState={{ selected: language === 'pl' }}
          accessibilityLabel="Polski (Napar)"
          accessibilityHint="Ustawia język interfejsu na polski"
        >
          <Text style={[styles.langTabText, language === 'pl' && styles.langTabTextActive]}>
            Polski (Napar)
          </Text>
        </Pressable>
        <Pressable
          style={[styles.langTab, language === 'en' && styles.langTabActive]}
          onPress={() => onSetLanguage('en')}
          accessibilityRole="radio"
          accessibilityState={{ selected: language === 'en' }}
          accessibilityLabel="English (Steepwise)"
          accessibilityHint="Sets interface language to English"
        >
          <Text style={[styles.langTabText, language === 'en' && styles.langTabTextActive]}>
            English (Steepwise)
          </Text>
        </Pressable>
      </View>

      {/* Preferencje Naparów (Kawa / Herbata / Kawa i herbata) */}
      <Text style={styles.sectionTitle}>{t.settings.beverageSection}</Text>
      <View
        testID="beverage-preference-radiogroup"
        style={styles.cardGroup}
        accessibilityRole="radiogroup"
        accessibilityLabel={t.settings.beverageSection || 'Preferencje naparów'}
      >
        <Pressable
          testID="beverage-pref-both"
          style={styles.actionRow}
          onPress={() => onSelectBeveragePreference('both')}
          accessibilityRole="radio"
          accessibilityState={{ selected: beveragePreference === 'both' }}
          accessibilityLabel={t.settings.beverageBoth}
          accessibilityHint={t.settings.beverageBothDesc}
        >
          <View style={{ flex: 1, paddingRight: theme.spacing.sm }}>
            <Text style={[styles.actionTitle, beveragePreference === 'both' && styles.actionTitleActive]}>
              {t.settings.beverageBoth}
            </Text>
            <Text style={styles.actionSubtitle}>{t.settings.beverageBothDesc}</Text>
          </View>
          {beveragePreference === 'both' && (
            <CheckIcon size={18} color={theme.colors.copper} />
          )}
        </Pressable>

        <View style={styles.divider} />

        <Pressable
          testID="beverage-pref-coffee"
          style={styles.actionRow}
          onPress={() => onSelectBeveragePreference('coffee')}
          accessibilityRole="radio"
          accessibilityState={{ selected: beveragePreference === 'coffee' }}
          accessibilityLabel={t.settings.beverageCoffeeOnly}
          accessibilityHint={t.settings.beverageCoffeeOnlyDesc}
        >
          <View style={{ flex: 1, paddingRight: theme.spacing.sm }}>
            <Text style={[styles.actionTitle, beveragePreference === 'coffee' && styles.actionTitleActive]}>
              {t.settings.beverageCoffeeOnly}
            </Text>
            <Text style={styles.actionSubtitle}>{t.settings.beverageCoffeeOnlyDesc}</Text>
          </View>
          {beveragePreference === 'coffee' && (
            <CheckIcon size={18} color={theme.colors.copper} />
          )}
        </Pressable>

        <View style={styles.divider} />

        <Pressable
          testID="beverage-pref-tea"
          style={styles.actionRow}
          onPress={() => onSelectBeveragePreference('tea')}
          accessibilityRole="radio"
          accessibilityState={{ selected: beveragePreference === 'tea' }}
          accessibilityLabel={t.settings.beverageTeaOnly}
          accessibilityHint={t.settings.beverageTeaOnlyDesc}
        >
          <View style={{ flex: 1, paddingRight: theme.spacing.sm }}>
            <Text style={[styles.actionTitle, beveragePreference === 'tea' && styles.actionTitleActive]}>
              {t.settings.beverageTeaOnly}
            </Text>
            <Text style={styles.actionSubtitle}>{t.settings.beverageTeaOnlyDesc}</Text>
          </View>
          {beveragePreference === 'tea' && (
            <CheckIcon size={18} color={theme.colors.emerald} />
          )}
        </Pressable>
      </View>

      {/* Przełącznik Jednostek Miar (Metric / Imperial) */}
      <Text style={styles.sectionTitle}>{t.settings.unitSection}</Text>
      <View
        testID="unit-system-radiogroup"
        style={styles.langSelectorRow}
        accessibilityRole="radiogroup"
        accessibilityLabel={t.settings.unitSection || 'Wybór jednostek miar'}
      >
        <Pressable
          testID="unit-metric-btn"
          style={[styles.langTab, unitSystem === 'metric' && styles.langTabActive]}
          onPress={() => onSelectUnitSystem('metric')}
          accessibilityRole="radio"
          accessibilityState={{ selected: unitSystem === 'metric' }}
          accessibilityLabel={t.settings.unitMetric}
          accessibilityHint="Ustawia jednostki metryczne (gramy, mililitry, stopnie Celsjusza)"
        >
          <Text style={[styles.langTabText, unitSystem === 'metric' && styles.langTabTextActive]}>
            {t.settings.unitMetric}
          </Text>
        </Pressable>
        <Pressable
          testID="unit-imperial-btn"
          style={[styles.langTab, unitSystem === 'imperial' && styles.langTabActive]}
          onPress={() => onSelectUnitSystem('imperial')}
          accessibilityRole="radio"
          accessibilityState={{ selected: unitSystem === 'imperial' }}
          accessibilityLabel={t.settings.unitImperial}
          accessibilityHint="Sets imperial units (ounces, fluid ounces, degrees Fahrenheit)"
        >
          <Text style={[styles.langTabText, unitSystem === 'imperial' && styles.langTabTextActive]}>
            {t.settings.unitImperial}
          </Text>
        </Pressable>
      </View>
      <View style={styles.unitPreviewRow}>
        <Text style={styles.unitPreviewText}>
          {language === 'en' ? 'Standard recipe preview:' : 'Podgląd jednostek w przepisach:'}{' '}
          <Text style={{ color: theme.colors.copper, fontWeight: '700' }}>
            {formatDoseWeight(15, unitSystem)}
          </Text>{' '}
          /{' '}
          <Text style={{ color: theme.colors.copper, fontWeight: '700' }}>
            {formatWaterWeight(250, unitSystem)}
          </Text>{' '}
          ·{' '}
          <Text style={{ color: theme.colors.copper, fontWeight: '700' }}>
            {formatTemperature(93, unitSystem)}
          </Text>
        </Text>
      </View>

      {/* Dostępność i Sygnały (VoiceOver / Audio & Haptyka - BR-DOST-001, DEC-13) */}
      <Text style={styles.sectionTitle}>{t.settings.accessibilitySection}</Text>
      <View style={styles.cardGroup}>
        <View style={styles.actionRow}>
          <View style={{ flex: 1, paddingRight: theme.spacing.sm }}>
            <Text style={styles.actionTitle}>{t.settings.voiceAnnounceTitle}</Text>
            <Text style={styles.actionSubtitle}>{t.settings.voiceAnnounceDesc}</Text>
          </View>
          <Pressable
            testID="toggle-voice-btn"
            style={[styles.toggleBtn, voiceAnnounce && styles.toggleBtnActive]}
            onPress={onToggleVoiceAnnounce}
            accessibilityRole="switch"
            accessibilityLabel={t.settings.voiceAnnounceTitle}
            accessibilityState={{ checked: voiceAnnounce }}
          >
            <Text style={[styles.toggleBtnText, voiceAnnounce && styles.toggleBtnTextActive]}>
              {voiceAnnounce ? t.settings.enabled : t.settings.disabled}
            </Text>
          </Pressable>
        </View>

        <View style={styles.divider} />

        <View style={styles.actionRow}>
          <View style={{ flex: 1, paddingRight: theme.spacing.sm }}>
            <Text style={styles.actionTitle}>{t.settings.hapticsTitle}</Text>
            <Text style={styles.actionSubtitle}>{t.settings.hapticsDesc}</Text>
          </View>
          <Pressable
            testID="toggle-haptics-btn"
            style={[styles.toggleBtn, haptics && styles.toggleBtnActive]}
            onPress={onToggleHaptics}
            accessibilityRole="switch"
            accessibilityLabel={t.settings.hapticsTitle}
            accessibilityState={{ checked: haptics }}
          >
            <Text style={[styles.toggleBtnText, haptics && styles.toggleBtnTextActive]}>
              {haptics ? t.settings.enabled : t.settings.disabled}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Karta Filozofii Apps4Brew */}
      <View style={styles.manifestoCard}>
        <Text style={styles.manifestoBadge}>FILOZOFIA APPS4BREW</Text>
        <Text style={styles.manifestoTitle}>Prywatność i Rzemiosło</Text>
        <Text style={styles.manifestoBody}>
          {language === 'pl'
            ? 'Napar nie wymaga logowania, nie łączy się z żadnym zewnętrznym serwerem i nie zbiera Twoich danych (etykieta „Data Not Collected”). Cała spiżarnia, dziennik i kalkulatory działają w 100% lokalnie na Twoim urządzeniu.'
            : 'Steepwise requires no login, connects to no external servers, and collects zero data (Apple "Data Not Collected" badge). Your stash, journal, and calculators run 100% locally on your device.'}
        </Text>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  langSelectorRow: {
    flexDirection: 'row',
    backgroundColor: theme.colors.bgCardSecondary,
    borderRadius: theme.borderRadius.md,
    padding: 3,
    marginBottom: theme.spacing.sm,
  },
  langTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: theme.borderRadius.sm,
    minHeight: 48,
    justifyContent: 'center',
  },
  langTabActive: {
    backgroundColor: theme.colors.bgCard,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  langTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
  langTabTextActive: {
    color: theme.colors.textPrimary,
    fontWeight: '700',
  },
  cardGroup: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
    marginBottom: theme.spacing.md,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    minHeight: 48,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  actionTitleActive: {
    color: theme.colors.copper,
    fontWeight: '700',
  },
  actionSubtitle: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
  },
  unitPreviewRow: {
    backgroundColor: theme.colors.bgCardSecondary,
    borderRadius: theme.borderRadius.sm,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  unitPreviewText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.bgCardSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minHeight: 36,
    minWidth: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleBtnActive: {
    backgroundColor: 'rgba(217, 119, 54, 0.15)',
    borderColor: theme.colors.copper,
  },
  toggleBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
  toggleBtnTextActive: {
    color: theme.colors.copper,
    fontWeight: '700',
  },
  manifestoCard: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.lg,
  },
  manifestoBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  manifestoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 8,
  },
  manifestoBody: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 19,
  },
});
