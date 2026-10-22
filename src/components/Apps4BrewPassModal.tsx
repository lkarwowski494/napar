// ============================================================================
// Napar (Steepwise) — Apps4Brew Pass Paywall Modal ("Cheaper than Espresso")
// Pricing: $0.99/mo, $4.99/yr, $14.99 Lifetime.
// Model M5 S1: darmowy poziom = 7 dni parzenia w miesiącu; historia i dane zawsze dostępne.
// Zakup i przywracanie przez StoreAdapter (etap 4b). Bez produktów w sklepie: „zakup niedostępny”.
// Ceny: displayPrice ze sklepu, a gdy sklep nie zna produktów, tekst zastępczy z tłumaczeń.
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
import { useTranslation } from '../core/i18n';
import { purchaseProduct, restoreProPurchases, useAppAccess, useStoreProducts } from '../core/app-access';
import { describeFreeDays, type ProPlan } from '../core/access-policy';
import { STORE_PRODUCT_IDS, isSubscriptionPlan } from '../core/store-products';
import type { PurchaseStatus } from '../core/store-port';
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
  const { t } = useTranslation();
  const { isPro, monthDaysUsed, freeDaysPerMonth, remainingDays } = useAppAccess();
  const products = useStoreProducts();

  const priceOf = (plan: ProPlan, fallback: string): string =>
    products.find((product) => product.plan === plan)?.displayPrice ?? fallback;

  // Sukces wyłącznie przy potwierdzonej transakcji (purchaseProduct); pozostałe statusy nie aktywują Pro.
  const handlePurchase = async (plan: ProPlan) => {
    const status: PurchaseStatus = await purchaseProduct(STORE_PRODUCT_IDS[plan]);
    switch (status) {
      case 'success':
        if (isSubscriptionPlan(plan)) {
          onSubscribed?.();
        } else {
          onPurchaseSuccess?.();
        }
        return;
      case 'cancelled':
        return;
      case 'pending':
        Alert.alert(t.paywall.purchasePendingTitle, t.paywall.purchasePendingMsg);
        return;
      case 'error':
        Alert.alert(t.paywall.purchaseErrorTitle, t.paywall.purchaseErrorMsg);
        return;
      case 'unavailable':
        Alert.alert(t.paywall.purchaseUnavailableTitle, t.paywall.purchaseUnavailableMsg);
        return;
    }
  };

  const handleRestore = async () => {
    const outcome = await restoreProPurchases();
    switch (outcome) {
      case 'restored':
        Alert.alert(t.paywall.restoredTitle, t.paywall.restoredMsg);
        onPurchaseSuccess?.();
        return;
      case 'none':
        Alert.alert(t.paywall.restoreNoneTitle, t.paywall.restoreNoneMsg);
        return;
      case 'error':
        Alert.alert(t.paywall.restoreErrorTitle, t.paywall.restoreErrorMsg);
        return;
      case 'unavailable':
        Alert.alert(t.paywall.purchaseUnavailableTitle, t.paywall.purchaseUnavailableMsg);
        return;
    }
  };

  const freeDaysText = describeFreeDays(
    { isPro, monthDaysUsed, remainingDays, freeDaysPerMonth },
    t.paywall
  );
  const limitReached = !isPro && remainingDays === 0;

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

          {/* Status darmowego limitu dni parzenia (Pro: bez karty) */}
          {freeDaysText !== null && (
            <View style={[styles.statusCard, limitReached && styles.limitCard]}>
              <Text style={limitReached ? styles.limitText : styles.statusText}>{freeDaysText}</Text>
            </View>
          )}

          {freeDaysText !== null && (
            <Text style={styles.scopeText}>{t.paywall.blockedScope}</Text>
          )}

          {/* Gwarancja: historia i dane zawsze dostępne */}
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
            style={[styles.planCard, styles.planCardFeatured]}
            onPress={() => void handlePurchase('yearly')}
            accessibilityRole="button"
            accessibilityLabel={`${t.paywall.planAnnualTitle} ${priceOf('yearly', t.paywall.planAnnualPrice)}`}
          >
            <View style={styles.featuredBadge}>
              <Text style={styles.featuredBadgeText}>{t.paywall.planAnnualBadge}</Text>
            </View>
            <View style={styles.planCardHeader}>
              <Text style={styles.planTitleFeatured}>{t.paywall.planAnnualTitle}</Text>
              <Text style={styles.planPriceFeatured}>{priceOf('yearly', t.paywall.planAnnualPrice)}</Text>
            </View>
            <Text style={styles.planDescFeatured}>{t.paywall.planAnnualDesc}</Text>
          </Pressable>

          {/* Plan Lifetime */}
          <Pressable
            testID="plan-lifetime-btn"
            style={styles.planCard}
            onPress={() => void handlePurchase('lifetime')}
            accessibilityRole="button"
            accessibilityLabel={`${t.paywall.planLifetimeTitle} ${priceOf('lifetime', t.paywall.planLifetimePrice)}`}
          >
            <View style={styles.planCardHeader}>
              <Text style={styles.planTitle}>{t.paywall.planLifetimeTitle}</Text>
              <Text style={styles.planPrice}>{priceOf('lifetime', t.paywall.planLifetimePrice)}</Text>
            </View>
            <Text style={styles.planDesc}>{t.paywall.planLifetimeDesc}</Text>
          </Pressable>

          {/* Plan Miesięczny */}
          <Pressable
            testID="plan-monthly-btn"
            style={styles.planCard}
            onPress={() => void handlePurchase('monthly')}
            accessibilityRole="button"
            accessibilityLabel={`${t.paywall.planMonthlyTitle} ${priceOf('monthly', t.paywall.planMonthlyPrice)}`}
          >
            <View style={styles.planCardHeader}>
              <Text style={styles.planTitle}>{t.paywall.planMonthlyTitle}</Text>
              <Text style={styles.planPrice}>{priceOf('monthly', t.paywall.planMonthlyPrice)}</Text>
            </View>
            <Text style={styles.planDesc}>{t.paywall.planMonthlyDesc}</Text>
          </Pressable>

          {/* Przywróć zakupy i polityka */}
          <Pressable
            testID="restore-purchases-btn"
            style={styles.restoreBtn}
            onPress={() => void handleRestore()}
            accessibilityRole="button"
            accessibilityLabel={t.paywall.restore}
          >
            <Text style={styles.restoreBtnText}>{t.paywall.restore}</Text>
          </Pressable>

          <Text style={styles.footerNote}>
            100% Offline-First · Zero kont i logowania · Chmura rodzinna Apple/Google Family Sharing
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
    width: 44,
    height: 44,
    borderRadius: 22,
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
  statusCard: {
    width: '100%',
    backgroundColor: theme.colors.bgCardSecondary,
    borderRadius: theme.borderRadius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 14,
  },
  limitCard: {
    borderColor: theme.colors.danger,
    backgroundColor: theme.colors.dangerMuted,
  },
  statusText: {
    fontSize: 13,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    fontWeight: '600',
  },
  limitText: {
    fontSize: 13,
    color: '#FF6B6B',
    textAlign: 'center',
    fontWeight: '700',
  },
  scopeText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 17,
    marginBottom: 16,
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
  restoreBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 12,
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
});
