// ============================================================================
// Napar (Steepwise) — AppGuideModal ([🧭 Jak działa aplikacja?])
// Zero-Clutter Header helper modal explaining the 1->2->3->4 causal process
// and the 5 Bottom Tabs.
// ============================================================================

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
import {
  CompassIcon,
  BrewIcon,
  BeansIcon,
  JournalIcon,
  LabIcon,
  SettingsIcon,
} from './icons/CraftIcons';

export interface AppGuideModalProps {
  visible: boolean;
  onClose: () => void;
  language?: 'pl' | 'en';
}

export function AppGuideModal({
  visible,
  onClose,
  language = 'pl',
}: AppGuideModalProps) {
  const isEn = language === 'en';

  const steps = isEn
    ? [
        {
          num: '1',
          title: 'Step 1: What are we brewing?',
          desc: 'Pick a master or custom recipe (with Classics/Favorites filter and search) and link beans or tea leaves from your Stash.',
        },
        {
          num: '2',
          title: 'Step 2: Input Parameters',
          desc: 'Set servings (1x–3x), dry dose weight (g), water volume (g/ml), and water temperature (°C/°F).',
        },
        {
          num: '3',
          title: 'Step 3: Live Ratio & Proportions',
          desc: 'Review real-time Brew Ratio, exact grinder clicks for your model, and scaled pour schedule.',
        },
        {
          num: '4',
          title: 'Step 4: Step-by-Step Procedure Assistant',
          desc: 'Open ProcedureModal — the timer automatically parses step time and starts counting down upon entering each step.',
        },
      ]
    : [
        {
          num: '1',
          title: 'Krok 1: Co parzymy?',
          desc: 'Wybierz recepturę z katalogu (z filtrem Klasyki/Ulubione, wyszukiwarką i zwijanymi kategoriami) oraz przypisz paczkę ze Spiżarni.',
        },
        {
          num: '2',
          title: 'Krok 2: Parametry wejściowe',
          desc: 'Ustaw liczbę porcji (1x–3x), dozę suchego surowca (g), ilość wody (g/ml) oraz temperaturę parzenia.',
        },
        {
          num: '3',
          title: 'Krok 3: Przeliczone wyniki na żywo',
          desc: 'Sprawdź wyliczone na żywo Ratio (np. 1:16.7), dokładne kliki Twojego młynka oraz harmonogram zalań.',
        },
        {
          num: '4',
          title: 'Krok 4: Asystent Procedury Krok po Kroku',
          desc: 'Otwórz pełnoekranowy ProcedureModal — stoper sam parsuje czas z opisu kroku i automatycznie rusza po wejściu w krok.',
        },
      ];

  const tabsInfo = isEn
    ? [
        { Icon: BrewIcon, name: 'Brew', desc: 'Causal 1 → 2 → 3 → 4 brewing flow & Procedure Assistant.' },
        { Icon: BeansIcon, name: 'Stash', desc: 'Coffee & tea freshness tracker (Resting & Peak Window).' },
        { Icon: JournalIcon, name: 'Journal', desc: '14-day Proactive Calendar, 1-Tap Action Feed & tasting history.' },
        { Icon: LabIcon, name: 'Dial-in', desc: 'Taste defect compass, Ratio, TDS/EY% & SCA Water Chemistry.' },
        { Icon: SettingsIcon, name: 'Settings', desc: 'Units, grinder model, language, and 100% offline JSON/CSV backup.' },
      ]
    : [
        { Icon: BrewIcon, name: 'Parzenie', desc: 'Główny proces przyczynowo-skutkowy 1 → 2 → 3 → 4 i Asystent Procedury.' },
        { Icon: BeansIcon, name: 'Spiżarnia', desc: 'Śledzenie świeżości ziaren po wypale (Resting & Peak Window) oraz herbat.' },
        { Icon: JournalIcon, name: 'Dziennik', desc: '14-dniowy Kalendarz, Harmonogram Akcji 1-Tap oraz historia i analityka.' },
        { Icon: LabIcon, name: 'Warsztat', desc: 'Kompas korekty smaku Dial-in Doctor, Ratio, TDS/EY% i Woda SCA.' },
        { Icon: SettingsIcon, name: 'Ustawienia', desc: 'Jednostki, młynek domowy, język oraz lokalna kopia zapasowa JSON/CSV.' },
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
                {isEn ? 'How Steepwise Works' : 'Jak działa aplikacja?'}
              </Text>
            </View>
            <Pressable
              testID="app-guide-close-btn"
              style={styles.closeBtn}
              onPress={onClose}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={isEn ? 'Close guide' : 'Zamknij przewodnik'}
            >
              <Text style={styles.closeBtnText}>
                {isEn ? 'Close' : 'Zamknij'}
              </Text>
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
          >
            <View style={styles.goldenRulesBox}>
              <Text style={styles.goldenRulesEyebrow}>
                {isEn ? 'GOLDEN RULES OF EXTRACTION' : 'ZŁOTE ZASADY EKSTRAKCJI'}
              </Text>
              <Text style={styles.goldenRulesText}>
                {isEn
                  ? '• Sour / thin cup → Grind finer (-2 clicks) or raise water temp (+2°C).\n• Bitter / dry cup → Grind coarser (+2 clicks) or lower water temp (-2°C).\n• Always use freshly roasted beans in their Peak Window (7–35 days post-roast).'
                  : '• Napar za kwaśny / wodnisty → Zmiel drobniej (-2 kliki) lub podnieś temp. (+2°C).\n• Napar za gorzki / ściągający → Zmiel grubiej (+2 kliki) lub obniż temp. (-2°C).\n• Parz ziarna w oknie szczytu świeżości Peak (7–35 dni po wypale).'}
              </Text>
            </View>

            <Text style={styles.sectionTitle}>
              {isEn ? 'MAIN PROCESS (1 → 2 → 3 → 4)' : 'PROCES GŁÓWNY (1 → 2 → 3 → 4)'}
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
              {isEn ? 'BOTTOM NAVIGATION TABS' : 'EKRANY DOLNEGO PASKA NAWIGACJI'}
            </Text>
            {tabsInfo.map((tab) => (
              <View key={tab.name} style={styles.tabRow}>
                <View style={styles.tabIconBox}><tab.Icon size={20} color={theme.colors.copper} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.tabName}>{tab.name}</Text>
                  <Text style={styles.tabDesc}>{tab.desc}</Text>
                </View>
              </View>
            ))}
          </ScrollView>

          <Pressable
            testID="app-guide-got-it-btn"
            style={styles.primaryBtn}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={isEn ? 'Got it' : 'Rozumiem, zaczynamy'}
          >
            <Text style={styles.primaryBtnText}>
              {isEn ? 'Got it' : 'Rozumiem, zaczynamy'}
            </Text>
          </Pressable>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
  tabIconBox: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: theme.colors.bgCardSecondary,
    borderRadius: theme.borderRadius.sm,
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
