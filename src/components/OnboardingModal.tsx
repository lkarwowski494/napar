// ============================================================================
// Napar (Steepwise) — First Launch Onboarding Modal (Ritual Personalization)
// Allows third-wave coffee purists and artisan tea masters to personalize their UI
// ============================================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BeveragePreference } from '../core/database';
import { useTranslation } from '../core/i18n';
import { theme } from '../core/theme';
import {
  NaparAppIcon,
  BrewIcon,
  BeansIcon,
  StarIcon,
} from './icons/CraftIcons';

interface OnboardingModalProps {
  visible: boolean;
  onComplete: (preference: BeveragePreference) => void;
}

export function OnboardingModal({ visible, onComplete }: OnboardingModalProps) {
  const { t, language } = useTranslation();
  const [selectedPref, setSelectedPref] = useState<BeveragePreference>('both');

  const handleStart = () => {
    onComplete(selectedPref);
  };

  return (
    <Modal visible={visible} animationType="fade" transparent={false}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Top Brand Header */}
          <View style={styles.header}>
            <View style={styles.iconStage}>
              <View style={styles.iconSquircle}>
                <NaparAppIcon size={48} color={theme.colors.copper} />
              </View>
            </View>
            <Text style={styles.eyebrow}>{t.onboarding.welcomeEyebrow}</Text>
            <Text style={styles.title}>{t.onboarding.welcomeTitle}</Text>
            <Text style={styles.subtitle}>{t.onboarding.welcomeSubtitle}</Text>
          </View>

          {/* Section: Choose Prompt */}
          <Text style={styles.choosePrompt}>{t.onboarding.choosePrompt}</Text>

          {/* 3 Preference Cards */}
          <View style={styles.cardsContainer}>
            {/* 1. Tylko Kawa Specialty */}
            <Pressable
              testID="onboarding-pref-coffee"
              accessibilityRole="radio"
              accessibilityState={{ selected: selectedPref === 'coffee' }}
              style={[
                styles.prefCard,
                selectedPref === 'coffee' && styles.prefCardActiveCoffee,
              ]}
              onPress={() => setSelectedPref('coffee')}
            >
              <View style={[styles.cardIconBox, selectedPref === 'coffee' && styles.cardIconBoxActiveCoffee]}>
                <BrewIcon size={22} color={selectedPref === 'coffee' ? theme.colors.copper : theme.colors.textMuted} />
              </View>
              <View style={styles.cardContent}>
                <View style={styles.cardHeaderRow}>
                  <Text style={[styles.cardTitle, selectedPref === 'coffee' && styles.cardTitleActive]}>
                    {t.onboarding.coffeeOnlyTitle}
                  </Text>
                  {selectedPref === 'coffee' && (
                    <View style={styles.checkIndicator}>
                      <Text style={styles.checkIndicatorText}>✓</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.cardDesc}>{t.onboarding.coffeeOnlyDesc}</Text>
              </View>
            </Pressable>

            {/* 2. Tylko Herbata Rzemieślnicza */}
            <Pressable
              testID="onboarding-pref-tea"
              accessibilityRole="radio"
              accessibilityState={{ selected: selectedPref === 'tea' }}
              style={[
                styles.prefCard,
                selectedPref === 'tea' && styles.prefCardActiveTea,
              ]}
              onPress={() => setSelectedPref('tea')}
            >
              <View style={[styles.cardIconBox, selectedPref === 'tea' && styles.cardIconBoxActiveTea]}>
                <Text style={{ fontSize: 20 }}>🍃</Text>
              </View>
              <View style={styles.cardContent}>
                <View style={styles.cardHeaderRow}>
                  <Text style={[styles.cardTitle, selectedPref === 'tea' && styles.cardTitleActiveTea]}>
                    {t.onboarding.teaOnlyTitle}
                  </Text>
                  {selectedPref === 'tea' && (
                    <View style={[styles.checkIndicator, { backgroundColor: theme.colors.emerald }]}>
                      <Text style={styles.checkIndicatorText}>✓</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.cardDesc}>{t.onboarding.teaOnlyDesc}</Text>
              </View>
            </Pressable>

            {/* 3. Kawa i Herbata (Both) */}
            <Pressable
              testID="onboarding-pref-both"
              accessibilityRole="radio"
              accessibilityState={{ selected: selectedPref === 'both' }}
              style={[
                styles.prefCard,
                selectedPref === 'both' && styles.prefCardActiveBoth,
              ]}
              onPress={() => setSelectedPref('both')}
            >
              <View style={[styles.cardIconBox, selectedPref === 'both' && styles.cardIconBoxActiveBoth]}>
                <Text style={{ fontSize: 20 }}>☕🍵</Text>
              </View>
              <View style={styles.cardContent}>
                <View style={styles.cardHeaderRow}>
                  <Text style={[styles.cardTitle, selectedPref === 'both' && styles.cardTitleActive]}>
                    {t.onboarding.bothTitle}
                  </Text>
                  {selectedPref === 'both' && (
                    <View style={styles.checkIndicator}>
                      <Text style={styles.checkIndicatorText}>✓</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.cardDesc}>{t.onboarding.bothDesc}</Text>
              </View>
            </Pressable>
          </View>

          {/* Action CTA Button */}
          <View style={styles.footer}>
            <Pressable
              testID="onboarding-submit-btn"
              style={styles.submitBtn}
              onPress={handleStart}
              accessibilityRole="button"
              accessibilityLabel={t.onboarding.startBtn}
            >
              <Text style={styles.submitBtnText}>{t.onboarding.startBtn} →</Text>
            </Pressable>
            <Text style={styles.footnote}>
              {language === 'pl'
                ? 'Wybór możesz zmienić w każdej chwili w Ustawieniach.'
                : 'You can change this anytime in Settings.'}
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  scroll: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 36,
  },
  header: {
    alignItems: 'center',
    textAlign: 'center',
    marginBottom: 28,
  },
  iconStage: {
    marginBottom: 16,
  },
  iconSquircle: {
    width: 84,
    height: 84,
    borderRadius: 20,
    backgroundColor: theme.colors.bgCard,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: '700',
    color: theme.colors.copper,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 340,
  },
  choosePrompt: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 14,
  },
  cardsContainer: {
    gap: 12,
    marginBottom: 32,
  },
  prefCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.bgCard,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    padding: 16,
  },
  prefCardActiveCoffee: {
    borderColor: theme.colors.copper,
    backgroundColor: 'rgba(200, 106, 40, 0.08)',
  },
  prefCardActiveTea: {
    borderColor: theme.colors.emerald,
    backgroundColor: 'rgba(42, 123, 98, 0.08)',
  },
  prefCardActiveBoth: {
    borderColor: theme.colors.copper,
    backgroundColor: 'rgba(200, 106, 40, 0.08)',
  },
  cardIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: theme.colors.bgCardSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  cardIconBoxActiveCoffee: {
    backgroundColor: 'rgba(200, 106, 40, 0.18)',
  },
  cardIconBoxActiveTea: {
    backgroundColor: 'rgba(42, 123, 98, 0.18)',
  },
  cardIconBoxActiveBoth: {
    backgroundColor: 'rgba(200, 106, 40, 0.18)',
  },
  cardContent: {
    flex: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  cardTitleActive: {
    color: theme.colors.copperLight,
  },
  cardTitleActiveTea: {
    color: theme.colors.emeraldLight,
  },
  checkIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.copper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIndicatorText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  cardDesc: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    lineHeight: 16,
  },
  footer: {
    alignItems: 'center',
  },
  submitBtn: {
    width: '100%',
    backgroundColor: theme.colors.copper,
    paddingVertical: 16,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: theme.colors.copper,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  footnote: {
    fontSize: 12,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
});
