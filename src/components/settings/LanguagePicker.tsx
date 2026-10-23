// ============================================================================
// Napar (Steepwise) — Wybór języka interfejsu (Ustawienia)
// „Język systemu” + 35 języków z LANGS, każdy pod nazwą własną. Dostępność: rola radio,
// nazwa języka w VoiceOver, cel dotyku min. 44 pt (NFR-A11Y).
// ============================================================================

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { theme } from '../../core/theme';
import { CheckIcon } from '../icons/CraftIcons';
import { LANGS, LanguageSetting, SYSTEM_LANGUAGE, Translations } from '../../core/i18n';
import { nativeLanguageName } from '../../core/language-names';

/** Kolejność pozycji: najpierw język systemu (domyślny), potem języki z LANGS. */
export const LANGUAGE_OPTIONS: readonly LanguageSetting[] = [SYSTEM_LANGUAGE, ...LANGS];

interface LanguagePickerProps {
  t: Translations;
  setting: LanguageSetting;
  onSelect: (setting: LanguageSetting) => void;
}

export const LanguagePicker: React.FC<LanguagePickerProps> = ({ t, setting, onSelect }) => {
  return (
    <View
      style={styles.cardGroup}
      accessibilityRole="radiogroup"
      accessibilityLabel={t.settings.languageSection}
    >
      {LANGUAGE_OPTIONS.map((option, index) => {
        const selected = option === setting;
        const label = option === SYSTEM_LANGUAGE ? t.settings.languageSystem : nativeLanguageName(option);
        return (
          <React.Fragment key={option}>
            {index > 0 && <View style={styles.divider} />}
            <Pressable
              testID={`language-option-${option}`}
              style={[styles.row, styles.touchTarget]}
              onPress={() => onSelect(option)}
              accessibilityRole="radio"
              accessibilityLabel={label}
              accessibilityState={{ checked: selected, selected }}
            >
              <Text style={[styles.label, selected && styles.labelActive]}>{label}</Text>
              {selected && <CheckIcon size={18} color={theme.colors.copper} />}
            </Pressable>
          </React.Fragment>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  touchTarget: { minWidth: 44, minHeight: 44 },
  cardGroup: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
    marginBottom: theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
    minHeight: 48,
  },
  label: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    paddingRight: theme.spacing.sm,
  },
  labelActive: {
    color: theme.colors.copper,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
  },
});
