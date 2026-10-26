import * as Linking from 'expo-linking';
// ============================================================================
// Napar (Steepwise) — Apps4Brew Pass Paywall Modal ("Cheaper than Espresso")
// Pricing: $0.99/mo, $4.99/yr, $14.99 Lifetime.
// Zero feature gating during trial, 100% read-only history guaranteed.
// Apps4Brew Studio — 100% Offline-First, Zero Telemetry.
// ============================================================================

import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../core/theme';
import { useTranslation, pluralPl } from '../core/i18n';
import { useAppAccess } from '../core/app-access';
import { ShieldIcon } from './icons/CraftIcons';

interface Apps4BrewPassModalProps {
  visible: boolean;
  onClose: () => void;
  onPurchaseSuccess?: () => void;
  onSubscribed?: () => void;
}

export function Apps4BrewPassModal({
  visible,
  onClose,
  onPurchaseSuccess,
  onSubscribed,
}: Apps4BrewPassModalProps) {
  const { t, language } = useTranslation();
  const cleanLang = typeof language === 'string' ? language.trim().toLowerCase() : 'pl';
  const isEn = cleanLang === 'en' || cleanLang.startsWith('en');
  const { purchaseWithStoreKit, restore, status, brewsRemaining, daysRemaining } = useAppAccess();
  const [isProcessing, setIsProcessing] = React.useState(false);
  const safeBrewsRemaining = Math.max(0, Object.is(brewsRemaining, -0) ? 0 : (brewsRemaining || 0));
  const safeDaysRemaining = Math.max(0, Object.is(daysRemaining, -0) ? 0 : (daysRemaining || 0));

  const handleSelectPlan = (tier: 'monthly' | 'annual' | 'lifetime') => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      const result = purchaseWithStoreKit(tier);
      if (result && result.success) {
        Alert.alert(
          t.settings.purchaseSuccessTitle,
          tier === 'annual'
            ? t.settings.purchaseAnnualSuccessMsg
            : tier === 'lifetime'
            ? t.settings.purchaseLifetimeSuccessMsg
            : t.settings.purchaseSuccessMsg
        );
        if (onPurchaseSuccess) {
          onPurchaseSuccess();
        }
        if (onSubscribed) {
          onSubscribed();
        }
        onClose();
      } else {
        const errorCode = result ? result.errorCode : undefined;
        const errorMsg =
          errorCode === 'invalid_signature'
            ? (isEn ? 'Invalid StoreKit transaction signature' : 'Nieprawidłowy podpis transakcji StoreKit')
            : errorCode === 'unknown_product'
            ? (isEn ? 'Unknown StoreKit product identifier' : 'Nieznany identyfikator produktu StoreKit')
            : (isEn ? 'StoreKit transaction authorization failed' : 'Błąd autoryzacji transakcji StoreKit');
        Alert.alert(t.settings.restoreNotFoundTitle, errorMsg);
      }
    } catch {
      Alert.alert(
        t.settings.restoreNotFoundTitle,
        isEn ? 'Could not complete StoreKit transaction' : 'Nie udało się zrealizować transakcji StoreKit'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestore = () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      const res = restore();
      const isRestored = typeof res === 'boolean' ? res : Boolean(res && res.restored);
      if (isRestored) {
        Alert.alert(t.settings.restoreSuccessTitle, t.settings.restoreSuccessMsg);
        if (onPurchaseSuccess) {
          onPurchaseSuccess();
        }
        if (onSubscribed) {
          onSubscribed();
        }
        onClose();
      } else {
        Alert.alert(t.settings.restoreNotFoundTitle, t.settings.restoreNotFoundMsg);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable
            testID="close-paywall-btn"
            style={styles.closeBtn}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={t.paywall.close}
            accessibilityHint={t?.common?.closeHint || (isEn ? 'Closes subscription window' : 'Zamyka okno subskrypcji')}
          >
            <Text style={styles.closeBtnText}>✕</Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Nagłówek i Obietnica wartości */}
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>APPS4BREW PASS</Text>
            </View>
          </View>

          <Text style={styles.title}>{t.paywall.title}</Text>
          <Text style={styles.subtitle}>{t.paywall.subtitle}</Text>
          <Text style={styles.tagline}>{t.paywall.tagline}</Text>

          {/* Status Trialu */}
          {status === 'trial_active' ? (
            <View style={styles.trialStatusCard}>
              <Text style={styles.trialStatusText}>
                {language === 'en'
                  ? `You have ${safeBrewsRemaining} brew${safeBrewsRemaining === 1 ? '' : 's'} remaining in your free trial (${safeDaysRemaining} day${safeDaysRemaining === 1 ? '' : 's'}).`
                  : `Pozostało Ci ${safeBrewsRemaining} ${pluralPl(safeBrewsRemaining, 'parzenie', 'parzenia', 'parzeń')} w bezpłatnym okresie próbnym (${safeDaysRemaining} ${pluralPl(safeDaysRemaining, 'dzień', 'dni', 'dni')}).`}
              </Text>
            </View>
          ) : (
            <View style={[styles.trialStatusCard, styles.trialExpiredCard]}>
              <Text style={styles.trialExpiredText}>
                {t.paywall?.trialExpiredNotice ||
                  (language === 'en'
                    ? 'Your free trial has ended. Choose a plan below to continue brewing.'
                    : 'Twój bezpłatny okres próbny dobiegł końca. Wybierz plan poniżej, aby parzyć kolejne filiżanki.')}
              </Text>
            </View>
          )}

          {/* Gwarancja historii Read-Only */}
          <View style={styles.guaranteeCard}>
            <View style={styles.guaranteeIcon}>
              <ShieldIcon size={20} color={theme.colors.statusPeak} />
            </View>
            <Text style={styles.guaranteeText}>
              {t.paywall.historyNotice}
            </Text>
          </View>

          {/* Korzyści */}
          <View style={styles.perksList}>
            <Text style={styles.perkItem}>{t.paywall.perk1}</Text>
            <Text style={styles.perkItem}>{t.paywall.perk2}</Text>
            <Text style={styles.perkItem}>{t.paywall.perk3}</Text>
            <Text style={styles.perkItem}>{t.paywall.perk4}</Text>
          </View>

          {/* Plany subskrypcyjne: Roczny (Polecany) na samej górze */}
          <Pressable
            testID="plan-annual-btn"
            style={[styles.planCard, styles.planCardFeatured, isProcessing && styles.planCardDisabled]}
            disabled={isProcessing}
            accessibilityState={{ disabled: isProcessing }}
            onPress={() => handleSelectPlan('annual')}
            accessibilityRole="button"
            accessibilityLabel={`${t.paywall.planAnnualTitle} ${t.paywall.planAnnualPrice}`}
            accessibilityHint={t?.paywall?.planAnnualHint || (isEn ? 'Purchases annual subscription via StoreKit' : 'Kupuje roczną subskrypcję przez StoreKit')}
          >
            <View style={styles.featuredBadge}>
              <Text style={styles.featuredBadgeText}>{t.paywall.planAnnualBadge}</Text>
            </View>
            <View style={styles.planCardHeader}>
              <Text style={styles.planTitleFeatured}>{t.paywall.planAnnualTitle}</Text>
              <Text style={styles.planPriceFeatured}>{t.paywall.planAnnualPrice}</Text>
            </View>
            <Text style={styles.planDescFeatured}>{t.paywall.planAnnualDesc}</Text>
          </Pressable>

          {/* Plan Lifetime */}
          <Pressable
            testID="plan-lifetime-btn"
            style={[styles.planCard, isProcessing && styles.planCardDisabled]}
            disabled={isProcessing}
            accessibilityState={{ disabled: isProcessing }}
            onPress={() => handleSelectPlan('lifetime')}
            accessibilityRole="button"
            accessibilityLabel={`${t.paywall.planLifetimeTitle} ${t.paywall.planLifetimePrice}`}
            accessibilityHint={t?.paywall?.planLifetimeHint || (isEn ? 'Purchases lifetime access via StoreKit' : 'Kupuje dożywotni dostęp przez StoreKit')}
          >
            <View style={styles.planCardHeader}>
              <Text style={styles.planTitle}>{t.paywall.planLifetimeTitle}</Text>
              <Text style={styles.planPrice}>{t.paywall.planLifetimePrice}</Text>
            </View>
            <Text style={styles.planDesc}>{t.paywall.planLifetimeDesc}</Text>
          </Pressable>

          {/* Plan Miesięczny */}
          <Pressable
            testID="plan-monthly-btn"
            style={[styles.planCard, isProcessing && styles.planCardDisabled]}
            disabled={isProcessing}
            accessibilityState={{ disabled: isProcessing }}
            onPress={() => handleSelectPlan('monthly')}
            accessibilityRole="button"
            accessibilityLabel={`${t.paywall.planMonthlyTitle} ${t.paywall.planMonthlyPrice}`}
            accessibilityHint={t?.paywall?.planMonthlyHint || (isEn ? 'Purchases monthly subscription via StoreKit' : 'Kupuje miesięczną subskrypcję przez StoreKit')}
          >
            <View style={styles.planCardHeader}>
              <Text style={styles.planTitle}>{t.paywall.planMonthlyTitle}</Text>
              <Text style={styles.planPrice}>{t.paywall.planMonthlyPrice}</Text>
            </View>
            <Text style={styles.planDesc}>{t.paywall.planMonthlyDesc}</Text>
          </Pressable>

          {/* Przywróć zakupy i polityka */}
          <Pressable
            testID="restore-purchases-btn"
            style={[styles.restoreBtn, isProcessing && styles.restoreBtnDisabled]}
            disabled={isProcessing}
            accessibilityState={{ disabled: isProcessing }}
            onPress={handleRestore}
            accessibilityRole="button"
            accessibilityLabel={t.paywall.restore}
            accessibilityHint={t?.paywall?.restoreHint || (isEn ? 'Restores previous purchases from Apple ID' : 'Przywraca poprzednie zakupy powiązane z kontem Apple ID')}
          >
            <Text style={styles.restoreBtnText}>{t.paywall.restore}</Text>
          </Pressable>

          {/* Ujawnienia subskrypcyjne App Store 3.1.2(c) */}
          <View style={styles.legalNoticeContainer}>
            <Text style={styles.legalNoticeText}>
              {t.paywall?.legalNotice || 'Subskrypcja roczna i miesięczna odnawia się automatycznie, chyba że zostanie anulowana co najmniej 24 godziny przed końcem bieżącego okresu rozliczeniowego.'}
            </Text>
            <View style={styles.legalLinksRow}>
              <Pressable
                testID="eula-link-btn"
                onPress={() => Linking.openURL('https://lkarwowski494.github.io/napar/terms.html')}
                accessibilityRole="link"
                accessibilityLabel={t.paywall?.eulaLabel || 'Regulamin usługi EULA'}
              >
                <Text style={styles.legalLinkText}>
                  {t.paywall?.eulaLabel ? `${t.paywall.eulaLabel} ↗` : (language === 'en' ? 'Terms of Use (EULA) ↗' : 'Regulamin (EULA) ↗')}
                </Text>
              </Pressable>
              <Text style={styles.legalLinkDivider}>·</Text>
              <Pressable
                testID="privacy-link-btn"
                onPress={() => Linking.openURL('https://lkarwowski494.github.io/napar/privacy.html')}
                accessibilityRole="link"
                accessibilityLabel={t.paywall?.privacyLabel || 'Polityka Prywatności'}
              >
                <Text style={styles.legalLinkText}>
                  {t.paywall?.privacyLabel ? `${t.paywall.privacyLabel} ↗` : (language === 'en' ? 'Privacy Policy ↗' : 'Polityka Prywatności ↗')}
                </Text>
              </Pressable>
            </View>
          </View>

          <Text style={styles.footerNote}>
            {language === 'en'
              ? '100% Offline-First · Zero accounts & login · Apple Family Sharing'
              : '100% Offline-First · Zero kont i logowania · Chmura rodzinna Apple Family Sharing'}
          </Text>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.bgCardSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  closeBtnText: {
    color: theme.colors.textSecondary,
    fontSize: 16,
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  badgeRow: {
    marginBottom: 12,
  },
  badge: {
    backgroundColor: theme.colors.copperMuted,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.copper,
  },
  badgeText: {
    color: theme.colors.copper,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.copper,
    textAlign: 'center',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  trialStatusCard: {
    width: '100%',
    backgroundColor: theme.colors.bgCardSecondary,
    borderRadius: theme.borderRadius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 14,
  },
  trialExpiredCard: {
    borderColor: theme.colors.danger,
    backgroundColor: theme.colors.dangerMuted,
  },
  trialStatusText: {
    fontSize: 13,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    fontWeight: '600',
  },
  trialExpiredText: {
    fontSize: 13,
    color: '#FF6B6B',
    textAlign: 'center',
    fontWeight: '700',
  },
  guaranteeCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(78, 159, 61, 0.12)',
    borderRadius: theme.borderRadius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.statusPeak,
    marginBottom: 16,
    gap: 10,
  },
  guaranteeIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  guaranteeText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    lineHeight: 16,
  },
  perksList: {
    width: '100%',
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 20,
    gap: 10,
  },
  perkItem: {
    fontSize: 13,
    color: theme.colors.textPrimary,
    fontWeight: '500',
  },
  planCard: {
    width: '100%',
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 12,
  },
  planCardFeatured: {
    borderColor: theme.colors.copper,
    borderWidth: 2,
    backgroundColor: theme.colors.bgCardSecondary,
    position: 'relative',
  },
  featuredBadge: {
    position: 'absolute',
    top: -11,
    right: 18,
    backgroundColor: theme.colors.copper,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  featuredBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  planCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  planTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  planTitleFeatured: {
    fontSize: 17,
    fontWeight: '800',
    color: theme.colors.copperLight,
  },
  planPrice: {
    fontSize: 17,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  planPriceFeatured: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.copper,
  },
  planDesc: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  planDescFeatured: {
    fontSize: 12,
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  planCardDisabled: {
    opacity: 0.6,
  },
  restoreBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 12,
  },
  restoreBtnDisabled: {
    opacity: 0.5,
  },
  restoreBtnText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  footerNote: {
    fontSize: 11,
    color: theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
  },
  legalNoticeContainer: {
    width: '100%',
    paddingHorizontal: 8,
    marginVertical: 12,
    alignItems: 'center',
  },
  legalNoticeText: {
    fontSize: 11,
    color: theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 15,
    marginBottom: 8,
  },
  legalLinksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legalLinkText: {
    fontSize: 12,
    color: theme.colors.copper,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  legalLinkDivider: {
    color: theme.colors.textMuted,
    fontSize: 12,
  },
});