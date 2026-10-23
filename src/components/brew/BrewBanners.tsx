// ============================================================================
// Napar (Steepwise) — BrewBanners Component
// System notices, crash recovery banners, and golden rules
// ============================================================================

import type { SupportedLanguage } from '../../core/i18n';
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { theme } from '../../core/theme';
import { ShieldIcon } from '../icons/CraftIcons';
import { CorruptStateRecovery } from '../../core/backup';

interface BrewBannersProps {
  corruptState: CorruptStateRecovery | null;
  /** Tekst stanu darmowego limitu dni parzenia; null dla Pro (brak banera). */
  freeDaysText: string | null;
  language: SupportedLanguage;
  onDismissCorrupt: () => void;
}

export const BrewBanners: React.FC<BrewBannersProps> = ({
  corruptState,
  freeDaysText,
  language,
  onDismissCorrupt,
}) => {
  return (
    <>
      {/* Baner odzyskiwania uszkodzonego stanu (BR-TEST-023) */}
      {corruptState && (
        <View style={styles.corruptBanner} testID="corrupt-state-banner">
          <View style={{ flex: 1 }}>
            <Text style={styles.corruptBannerTitle}>
              {language === 'pl'
                ? 'Wykryto uszkodzony stan po awarii'
                : 'Corrupt state detected after crash'}
            </Text>
            <Text style={styles.corruptBannerDesc}>
              {language === 'pl'
                ? `Plik ${corruptState.corruptFile} został zabezpieczony w Backup/. Twoje dane bazowe są nienaruszone.`
                : `File ${corruptState.corruptFile} was secured in Backup/. Your base data is intact.`}
            </Text>
          </View>
          <Pressable
            style={styles.corruptDismissBtn}
            onPress={onDismissCorrupt}
            accessibilityRole="button"
            accessibilityLabel="Odrzuć komunikat awarii"
          >
            <Text style={styles.corruptDismissText}>
              {language === 'pl' ? 'Odrzuć' : 'Dismiss'}
            </Text>
          </Pressable>
        </View>
      )}

      {/* Stan darmowego limitu dni parzenia (model M5 S1) */}
      {freeDaysText !== null && (
        <View style={styles.freeDaysBanner} testID="free-days-banner">
          <ShieldIcon size={16} color={theme.colors.copper} />
          <Text style={styles.freeDaysBannerText}>{freeDaysText}</Text>
        </View>
      )}

      {/* Stały baner "Złote Zasady" domeny (BPR Pillar 2) */}
      <View style={styles.goldenRulesBanner} testID="golden-rules-banner">
        <Text style={styles.goldenRulesBannerText} numberOfLines={2}>
          {language === 'en'
            ? '⚖️ Golden Rules: Sour/thin → grind finer (2 clicks) or raise temp 2°C · Bitter/dry → grind coarser (2 clicks) · Peak: 7–35d.'
            : '⚖️ Złote Zasady: Kwaśna/płaska → drobniej o 2 kliki lub wyższa temp. o 2°C · Gorzka/sucha → grubiej o 2 kliki · Peak: 7–35 dni.'}
        </Text>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  goldenRulesBanner: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.copper,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  goldenRulesBannerText: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    lineHeight: 16,
    fontWeight: '600',
  },
  freeDaysBanner: {
    backgroundColor: 'rgba(217, 119, 54, 0.12)',
    borderRadius: theme.borderRadius.md,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.copper,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  freeDaysBannerText: {
    color: theme.colors.copper,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
    flex: 1,
  },
  corruptBanner: {
    backgroundColor: '#7F1D1D',
    borderRadius: theme.borderRadius.md,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  corruptBannerTitle: {
    color: '#FEE2E2',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  corruptBannerDesc: {
    color: '#FECACA',
    fontSize: 11,
    lineHeight: 15,
  },
  corruptDismissBtn: {
    backgroundColor: '#991B1B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.sm,
    minHeight: 48,
    minWidth: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  corruptDismissText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
