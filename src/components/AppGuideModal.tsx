// ============================================================================
// Napar (Steepwise) — AppGuideModal ([🧭 Jak działa aplikacja?])
// Zero-Clutter Header helper modal explaining the 1->2->3->4 causal process
// and the 5 Bottom Tabs.
// ============================================================================

import type { SupportedLanguage } from '../core/i18n';
import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../core/theme';
import { CompassIcon } from './icons/CraftIcons';
import { getTranslations } from '../core/i18n';

export interface AppGuideModalProps {
  visible: boolean;
  onClose: () => void;
  language?: SupportedLanguage;
}

export function AppGuideModal({
  visible,
  onClose,
  language = 'pl',
}: AppGuideModalProps) {
  const t = getTranslations(language);

  const steps = [
    { num: '1', title: t.appGuide.step1Title, desc: t.appGuide.step1Desc },
    { num: '2', title: t.appGuide.step2Title, desc: t.appGuide.step2Desc },
    { num: '3', title: t.appGuide.step3Title, desc: t.appGuide.step3Desc },
    { num: '4', title: t.appGuide.step4Title, desc: t.appGuide.step4Desc },
  ];

  const tabsInfo = [
    { icon: '☕', name: t.appGuide.tabBrew, desc: t.appGuide.tabBrewDesc },
    { icon: '🫘', name: t.appGuide.tabStash, desc: t.appGuide.tabStashDesc },
    { icon: '📅', name: t.appGuide.tabJournal, desc: t.appGuide.tabJournalDesc },
    { icon: '🧭', name: t.appGuide.tabDialin, desc: t.appGuide.tabDialinDesc },
    { icon: '⚙️', name: t.appGuide.tabSettings, desc: t.appGuide.tabSettingsDesc },
  ];

  if (!visible) {
    return null;
  }

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.overlay} testID="app-guide-modal">
        <SafeAreaView style={styles.sheet} edges={['top', 'bottom', 'left', 'right']}>
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <CompassIcon size={18} color={theme.colors.copper} />
              <Text style={styles.title}>
                {t.appGuide.title}
              </Text>
            </View>
            <Pressable
              testID="app-guide-close-btn"
              style={[styles.closeBtn, styles.touchTarget]}
              onPress={onClose}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={t.appGuide.closeA11y}
            >
              <Text style={styles.closeBtnText}>
                {t.common.close}
              </Text>
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
          >
            <View style={styles.goldenRulesBox}>
              <Text style={styles.goldenRulesEyebrow}>
                {t.appGuide.goldenRulesEyebrow}
              </Text>
              <Text style={styles.goldenRulesText}>
                {t.appGuide.goldenRulesText}
              </Text>
            </View>

            <Text style={styles.sectionTitle}>
              {t.appGuide.mainProcess}
            </Text>
            {steps.map((s) => (
              <View key={s.num} style={styles.stepCard}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>{s.num}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stepTitle}>{s.title}</Text>
                  <Text style={styles.stepDesc}>{s.desc}</Text>
                </View>
              </View>
            ))}

            <Text style={[styles.sectionTitle, { marginTop: 18 }]}>
              {t.appGuide.tabsTitle}
            </Text>
            {tabsInfo.map((tab) => (
              <View key={tab.name} style={styles.tabRow}>
                <Text style={styles.tabEmoji}>{tab.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.tabName}>{tab.name}</Text>
                  <Text style={styles.tabDesc}>{tab.desc}</Text>
                </View>
              </View>
            ))}
          </ScrollView>

          <Pressable
            testID="app-guide-got-it-btn"
            style={[styles.primaryBtn, styles.touchTarget]}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={t.appGuide.gotIt}
          >
            <Text style={styles.primaryBtnText}>
              {t.appGuide.gotIt}
            </Text>
          </Pressable>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  touchTarget: { minWidth: 44, minHeight: 44 },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.82)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: theme.colors.bgCard,
    borderTopLeftRadius: theme.borderRadius.lg,
    borderTopRightRadius: theme.borderRadius.lg,
    borderTopWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 16,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  closeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.bgCardSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  closeBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.copper,
  },
  content: {
    paddingVertical: 14,
  },
  goldenRulesBox: {
    backgroundColor: theme.colors.copperMuted,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.copper,
    padding: 12,
    marginBottom: 16,
  },
  goldenRulesEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.copper,
    letterSpacing: 1,
    marginBottom: 4,
  },
  goldenRulesText: {
    fontSize: 12,
    color: theme.colors.textPrimary,
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.copper,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: theme.colors.bgCardSecondary,
    borderRadius: theme.borderRadius.md,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.copper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  stepDesc: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    lineHeight: 17,
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  tabEmoji: {
    fontSize: 18,
    width: 26,
    textAlign: 'center',
  },
  tabName: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  tabDesc: {
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
  primaryBtn: {
    backgroundColor: theme.colors.copper,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
