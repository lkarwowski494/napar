// ============================================================================
// Napar (Steepwise) — Dial-in Doctor & Kalkulatory Ekstrakcji
// Deterministyczny kompas sensoryczny, dwukierunkowe Ratio i TDS / EY%
// ============================================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { diagnoseExtractionTaste } from '../../src/core/domain-rules';
import { CaffeineIcon } from '../../src/components/icons/CraftIcons';
import { theme } from '../../src/core/theme';
import { useTranslation } from '../../src/core/i18n';
import { getUnitSystem, getBeveragePreference } from '../../src/core/database';
import { useBrew } from '../../src/core/brew-context';
import { useAppAccess } from '../../src/core/app-access';
import { Apps4BrewPassModal } from '../../src/components/Apps4BrewPassModal';
import { WaterChemistryTab } from '../../src/components/dialin/WaterChemistryTab';
import { ExtractionYieldTab } from '../../src/components/dialin/ExtractionYieldTab';
import { BrewRatioTab } from '../../src/components/dialin/BrewRatioTab';

export default function DialInScreen() {
  const router = useRouter();
  const { t, language } = useTranslation();
  const unitSystem = getUnitSystem();
  let brewCtx: ReturnType<typeof useBrew> | null = null;
  try {
    brewCtx = useBrew();
  } catch {
    brewCtx = null;
  }
  const beveragePreference = brewCtx?.beveragePreference ?? (() => {
    try {
      return getBeveragePreference();
    } catch {
      return 'both';
    }
  })();
  const [activeTab, setActiveTab] = useState<'doctor' | 'ratio' | 'ey' | 'water'>('doctor');
  const [showPaywallModal, setShowPaywallModal] = useState(false);
  const { canCreate, isSubscribed } = useAppAccess();

  const handleSelectTab = (tab: 'doctor' | 'ratio' | 'ey' | 'water') => {
    // Pro Gate WTP-1 (DEC-03): Doctor and Water require active subscription or active trial
    if ((tab === 'doctor' || tab === 'water') && !canCreate && !isSubscribed) {
      setShowPaywallModal(true);
      return;
    }
    setActiveTab(tab);
  };

  // Stan: Dial-in Doctor
  const [selectedIssue, setSelectedIssue] = useState<string>('sour');

  React.useEffect(() => {
    if (beveragePreference === 'coffee' && selectedIssue === 'astringent_tea') {
      setSelectedIssue('sour');
    }
  }, [beveragePreference, selectedIssue]);

  // Diagnoza kompasu
  const diagnosis = React.useMemo(() => {
    let list = [];
    switch (selectedIssue) {
      case 'sour':
        list = diagnoseExtractionTaste({ isSour: true });
        break;
      case 'bitter':
        list = diagnoseExtractionTaste({ isBitter: true });
        break;
      case 'weak':
        list = diagnoseExtractionTaste({ isWatery: true });
        break;
      case 'astringent_tea':
        list = diagnoseExtractionTaste({ isAstringent: true });
        break;
      default:
        list = diagnoseExtractionTaste({});
        break;
    }
    return list[0] || {
      issue: 'Balans w normie',
      recommendationPl: 'Filiżanka mieści się w standardowym oknie ekstrakcji.',
    };
  }, [selectedIssue]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Przełącznik zakładek */}
      <View style={styles.segmentBar}>
        <Pressable
          accessibilityRole="tab"
          accessibilityLabel="Dial-in Doctor"
          accessibilityState={{ selected: activeTab === 'doctor' }}
          style={[styles.segmentBtn, activeTab === 'doctor' && styles.segmentBtnActive]}
          onPress={() => handleSelectTab('doctor')}
        >
          <Text
            style={[
              styles.segmentBtnText,
              activeTab === 'doctor' && styles.segmentBtnTextActive,
            ]}
          >
            Dial-in Doctor
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="tab"
          accessibilityLabel="Ratio"
          accessibilityState={{ selected: activeTab === 'ratio' }}
          style={[styles.segmentBtn, activeTab === 'ratio' && styles.segmentBtnActive]}
          onPress={() => handleSelectTab('ratio')}
        >
          <Text
            style={[
              styles.segmentBtnText,
              activeTab === 'ratio' && styles.segmentBtnTextActive,
            ]}
          >
            Ratio & Uzysk
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="tab"
          accessibilityLabel="Ekstrakcja EY"
          accessibilityState={{ selected: activeTab === 'ey' }}
          style={[styles.segmentBtn, activeTab === 'ey' && styles.segmentBtnActive]}
          onPress={() => handleSelectTab('ey')}
        >
          <Text
            style={[
              styles.segmentBtnText,
              activeTab === 'ey' && styles.segmentBtnTextActive,
            ]}
          >
            TDS & EY%
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="tab"
          accessibilityLabel="Woda SCA"
          accessibilityState={{ selected: activeTab === 'water' }}
          style={[styles.segmentBtn, activeTab === 'water' && styles.segmentBtnActive]}
          onPress={() => handleSelectTab('water')}
        >
          <Text
            style={[
              styles.segmentBtnText,
              activeTab === 'water' && styles.segmentBtnTextActive,
            ]}
          >
            {t.water.tabTitle}
          </Text>
        </Pressable>
      </View>

      {/* 1. DIAL-IN DOCTOR */}
      {activeTab === 'doctor' && (
        <View>
          <Text style={styles.sectionHeader}>{t.dialin?.issueDiagnosisTitle || 'Diagnoza Niepożądanego Smaku'}</Text>
          <Text style={styles.sectionSub}>
            {t.dialin?.issueDiagnosisSubtitle || 'Wybierz dominujący problem w filiżance. Kompas ekstrakcji wskaże precyzyjną korektę mielenia i temperatury.'}
          </Text>

          <View style={styles.issuesList}>
            {[
              {
                id: 'sour',
                title: t.dialin?.issueSourTitle || 'Zbyt kwaśna / ostra / trawiasta',
                desc: t.dialin?.issueSourDesc || 'Brak słodyczy, cierpki finisz, cytrynowa kwasowość.',
              },
              {
                id: 'bitter',
                title: t.dialin?.issueBitterTitle || 'Za gorzka / ściągająca / sucha',
                desc: t.dialin?.issueBitterDesc || 'Wrażenie suchości na języku (ashy), popiołowość, ciemna gorycz.',
              },
              {
                id: 'weak',
                title: t.dialin?.issueWeakTitle || 'Płaska / mdła / wodnista',
                desc: t.dialin?.issueWeakDesc || 'Brak ciała, herbaciana konsystencja bez wyrazistej słodyczy.',
              },
              ...(beveragePreference !== 'coffee'
                ? [
                    {
                      id: 'astringent_tea',
                      title: t.dialin?.issueTeaAstringentTitle || 'Herbata ściągająca gardło',
                      desc: t.dialin?.issueTeaAstringentDesc || 'Zbyt wysoka temperatura zniszczyła subtelne katechiny i l-teaninę.',
                    },
                  ]
                : []),
            ].map((issue) => (
              <Pressable
                key={issue.id}
                style={[
                  styles.issueCard,
                  selectedIssue === issue.id && styles.issueCardActive,
                ]}
                onPress={() => setSelectedIssue(issue.id)}
              >
                <Text style={styles.issueTitle}>{issue.title}</Text>
                <Text style={styles.issueDesc}>{issue.desc}</Text>
              </Pressable>
            ))}
          </View>

          {/* Wynik diagnozy */}
          <View style={styles.diagnosisCard}>
            <View style={styles.diagHeaderRow}>
              <Text style={styles.diagBadge}>{t.dialin?.recipeSensoryBadge || 'RECEPTA SENSORYCZNA'}</Text>
              <Text style={styles.diagProblem}>{language === 'pl' ? diagnosis.issue : (diagnosis.issueEn || diagnosis.issue)}</Text>
            </View>

            <Text style={styles.diagRecommendation}>
              {language === 'pl' ? diagnosis.recommendationPl : (diagnosis.recommendationEn || diagnosis.recommendationPl)}
            </Text>

            <View style={styles.diagActionRow}>
              {diagnosis.grindAdjustment && (
                <View style={styles.diagActionBox}>
                  <Text style={styles.diagActionLabel}>{t.dialin?.grindCorrection || 'KOREKTA MIELENIA'}</Text>
                  <Text style={styles.diagActionVal}>
                    {diagnosis.grindAdjustment === 'finer'
                      ? (t.dialin?.grindFiner || '▼ Zmiel drobniej (o 2–3 kliki)')
                      : (t.dialin?.grindCoarser || '▲ Zmiel grubiej (o 2–4 kliki)')}
                  </Text>
                </View>
              )}

              {diagnosis.tempAdjustment && (
                <View style={styles.diagActionBox}>
                  <Text style={styles.diagActionLabel}>{t.dialin?.waterTemp || 'TEMPERATURA WODY'}</Text>
                  <Text style={styles.diagActionVal}>
                    {diagnosis.tempAdjustment === 'higher'
                      ? (unitSystem === 'imperial' ? (t.dialin?.tempHigherImperial || 'Podnieś o +4°F do 203°F') : (t.dialin?.tempHigherMetric || 'Podnieś o +2°C do 95°C'))
                      : (unitSystem === 'imperial' ? (t.dialin?.tempLowerImperial || 'Obniż o 4–7°F') : (t.dialin?.tempLowerMetric || 'Obniż o 2–4°C'))}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      )}

      {/* 2. KALKULATOR RATIO */}
      {activeTab === 'ratio' && (
        <BrewRatioTab
          language={language}
          t={t}
          unitSystem={unitSystem}
          beveragePreference={beveragePreference}
        />
      )}

      {/* 3. KALKULATOR TDS / EY */}
      {activeTab === 'ey' && (
        <ExtractionYieldTab
          language={language}
          t={t}
        />
      )}

      {/* 4. MINERALIZACJA WODY (SCA WATER CHEMISTRY) */}
      {activeTab === 'water' && (
        <WaterChemistryTab
          language={language}
          t={t}
        />
      )}

      {/* Skrót do Kalkulatora Kofeiny */}
      <Pressable
        testID="open-caffeine-from-workshop"
        style={styles.caffeineWorkshopCard}
        onPress={() => router.push('/caffeine')}
        accessibilityRole="button"
        accessibilityLabel={t.caffeine?.title || 'Kalkulator Kofeiny'}
      >
        <View style={styles.caffeineWorkshopIconBox}>
          <CaffeineIcon size={24} color={theme.colors.copper} />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.caffeineWorkshopTitle}>
            {t.caffeine?.title || 'Kalkulator Kofeiny i Wchłaniania'}
          </Text>
          <Text style={styles.caffeineWorkshopSubtitle}>
            {language === 'pl'
              ? 'Sprawdź dawkę kofeiny, czas półtrwania i optymalne okno snu.'
              : 'Calculate caffeine intake, half-life metabolic decay, and sleep window.'}
          </Text>
        </View>
        <Text style={styles.caffeineWorkshopArrow}>→</Text>
      </Pressable>
      <Apps4BrewPassModal
        visible={showPaywallModal}
        onClose={() => setShowPaywallModal(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  content: {
    padding: theme.spacing.md,
    paddingBottom: 40,
  },
  segmentBar: {
    flexDirection: 'row',
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.md,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: theme.borderRadius.sm,
  },
  segmentBtnActive: {
    backgroundColor: theme.colors.copper,
  },
  segmentBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  segmentBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  sectionSub: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginBottom: 16,
    lineHeight: 18,
  },
  issuesList: {
    gap: 10,
    marginBottom: 16,
  },
  issueCard: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  issueCardActive: {
    borderColor: theme.colors.copper,
    backgroundColor: theme.colors.copperMuted,
  },
  issueTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  issueDesc: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  diagnosisCard: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: theme.colors.copper,
    marginBottom: 20,
  },
  diagHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  diagBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.copper,
    letterSpacing: 0.5,
  },
  diagProblem: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  diagRecommendation: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: 14,
  },
  diagActionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  diagActionBox: {
    flex: 1,
    backgroundColor: theme.colors.bgCardSecondary,
    borderRadius: theme.borderRadius.sm,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  diagActionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  diagActionVal: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.copper,
  },
  caffeineWorkshopCard: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  caffeineWorkshopIconBox: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.bgCardSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  caffeineWorkshopTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  caffeineWorkshopSubtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    lineHeight: 16,
  },
  caffeineWorkshopArrow: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.copper,
    marginLeft: 8,
  },
});
