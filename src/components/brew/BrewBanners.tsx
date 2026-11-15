// ============================================================================
// Napar — BrewBanners Component
// System notices, crash recovery banners, and golden rules
// ============================================================================

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { theme } from '../../core/theme';
import { CorruptStateRecovery } from '../../core/backup';
import { formatTemperatureDelta, UnitSystem } from '../../core/unit-converter';

interface BrewBannersProps {
  corruptState: CorruptStateRecovery | null;
  language: 'pl' | 'en';
  /** M1-audytor-generalny-034 */
  unitSystem?: UnitSystem;
  onDismissCorrupt: () => void;
}

export const BrewBanners: React.FC<BrewBannersProps> = ({
  corruptState,
  language,
  unitSystem = 'metric',
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
            accessibilityLabel={
              language === 'pl' ? 'Odrzuć komunikat awarii' : 'Dismiss crash message'
            }
          >
            <Text style={styles.corruptDismissText}>
              {language === 'pl' ? 'Odrzuć' : 'Dismiss'}
            </Text>
          </Pressable>
        </View>
      )}


      {/* Stały baner "Złote Zasady" domeny (BPR Pillar 2) */}
      <View style={styles.goldenRulesBanner} testID="golden-rules-banner">
        <Text style={styles.goldenRulesBannerText} numberOfLines={2}>
          {language === 'en'
            ? `Golden Rules: Sour/thin → grind finer (2 clicks) or raise temp ${formatTemperatureDelta(2, unitSystem)} · Bitter/dry → grind coarser (2 clicks) · Peak: 7–35d.`
            : `Złote Zasady: Kwaśna/płaska → drobniej o 2 kliki lub wyższa temp. o ${formatTemperatureDelta(2, unitSystem)} · Gorzka/sucha → grubiej o 2 kliki · Peak: 7–35 dni.`}
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
