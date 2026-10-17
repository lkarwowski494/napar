// ============================================================================
// Napar (Steepwise) — Ustawienia, Kopia Zapasowa i Pro (Apps4Brew)
// ZP-02, ZP-06, ZP-07, ZP-08, ZP-10: 100% offline, zero-login, darmowy eksport JSON
// ============================================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import {
  exportAllDataJson,
  importDataJson,
  exportSessionsCsv,
  exportInventoryCsv,
  getAppSetting,
  setAppSetting,
  getUnitSystem,
  setUnitSystem,
  getVoiceAnnounceEnabled,
  setVoiceAnnounceEnabled,
  getHapticsEnabled,
  setHapticsEnabled,
  getCaffeineHalfLife,
  setCaffeineHalfLife,
  getBedtimeHour,
  setBedtimeHour,
  getInventoryItems,
  getRecipes,
  getBrewSessions,
  getCaffeineLogs,
  BeveragePreference,
  getBeveragePreference,
  setBeveragePreference,
} from '../src/core/database';
import { useBrew } from '../src/core/brew-context';
import {
  getHealthKitSyncEnabled,
  setHealthKitSyncEnabled,
  requestHealthKitPermissions,
  revokeHealthKitPermissions,
} from '../src/core/healthkit';
import { theme } from '../src/core/theme';
import { useTranslation } from '../src/core/i18n';
import { safetyBackup, NaparBackupData } from '../src/core/backup';
import { useAppAccess } from '../src/core/app-access';
import { Apps4BrewPassModal } from '../src/components/Apps4BrewPassModal';
import {
  formatTemperature,
  formatDoseWeight,
  formatWaterWeight,
} from '../src/core/unit-converter';
import { CheckIcon } from '../src/components/icons/CraftIcons';
import { JsonExportModal, JsonImportModal } from '../src/components/settings/JsonBackupModals';
import { CsvExportModal } from '../src/components/settings/CsvExportModal';
import { CraftFamilyShowcase } from '../src/components/settings/CraftFamilyShowcase';
import { CaffeineSettingsCard } from '../src/components/settings/CaffeineSettingsCard';
import { DataBackupCard } from '../src/components/settings/DataBackupCard';
import { GrinderSelectionCard } from '../src/components/settings/GrinderSelectionCard';
import { PassSettingsCard } from '../src/components/settings/PassSettingsCard';

export default function SettingsScreen() {
  const { t, language, setLanguage } = useTranslation();

  let brewCtx: any = null;
  try {
    brewCtx = useBrew();
  } catch {
    // isolated test environment without BrewProvider
  }

  const [beveragePreference, setBeveragePreferenceState] = useState<BeveragePreference>(() => {
    return brewCtx?.beveragePreference || getBeveragePreference();
  });

  const handleSelectBeveragePreference = (pref: BeveragePreference) => {
    setBeveragePreferenceState(pref);
    setBeveragePreference(pref);
    if (brewCtx?.setBeveragePreference) {
      brewCtx.setBeveragePreference(pref);
    }
  };

  const [selectedGrinder, setSelectedGrinder] = useState<string>(() => {
    return getAppSetting('default_grinder', 'comandante_c40');
  });
  const [unitSystem, setUnitSystemState] = useState<'metric' | 'imperial'>(() => {
    return getUnitSystem();
  });
  const [voiceAnnounce, setVoiceAnnounce] = useState<boolean>(() => {
    return getVoiceAnnounceEnabled();
  });
  const [haptics, setHaptics] = useState<boolean>(() => {
    return getHapticsEnabled();
  });
  const [halfLifeHours, setHalfLifeHoursState] = useState(() => {
    return getCaffeineHalfLife();
  });
  const [bedtimeHour, setBedtimeHourState] = useState(() => {
    return getBedtimeHour();
  });
  const [healthKitSync, setHealthKitSync] = useState(() => {
    return getHealthKitSyncEnabled();
  });
  const {
    status: accessStatus,
    isSubscribed,
    subscriptionTier,
    brewsRemaining,
    refresh: refreshAccess,
  } = useAppAccess();
  const [showPassModal, setShowPassModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  const handleToggleHealthKit = async () => {
    const next = !healthKitSync;
    setHealthKitSync(next);
    if (next) {
      await requestHealthKitPermissions();
    } else {
      revokeHealthKitPermissions();
    }
  };

  const handleHalfLifeChange = (newHours: number) => {
    const clamped = Number(Math.max(3.0, Math.min(8.0, newHours)).toFixed(1));
    setHalfLifeHoursState(clamped);
    setCaffeineHalfLife(clamped);
  };

  const handleBedtimeChange = (newHour: number) => {
    const clamped = Math.max(18, Math.min(28, newHour));
    setBedtimeHourState(clamped);
    setBedtimeHour(clamped);
  };

  const handleSelectGrinder = (id: string) => {
    setSelectedGrinder(id);
    setAppSetting('default_grinder', id);
  };

  const handleSelectUnitSystem = (unit: 'metric' | 'imperial') => {
    setUnitSystemState(unit);
    setUnitSystem(unit);
  };

  const handleToggleVoiceAnnounce = () => {
    const next = !voiceAnnounce;
    setVoiceAnnounce(next);
    setVoiceAnnounceEnabled(next);
  };

  const handleToggleHaptics = () => {
    const next = !haptics;
    setHaptics(next);
    setHapticsEnabled(next);
  };
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvModalTitle, setCsvModalTitle] = useState('');
  const [exportedJsonText, setExportedJsonText] = useState('');
  const [importJsonText, setImportJsonText] = useState('');
  const [exportedCsvText, setExportedCsvText] = useState('');

  const handleExport = () => {
    try {
      const json = exportAllDataJson();
      setExportedJsonText(json);
      setShowExportModal(true);
    } catch (e: any) {
      Alert.alert('Nie udało się wyeksportować', e?.message || 'Nie udało się wyeksportować danych.');
    }
  };

  const handleExportSessionsCsv = () => {
    try {
      const csv = exportSessionsCsv();
      setExportedCsvText(csv);
      setCsvModalTitle('Eksport Dziennika (CSV)');
      setShowCsvModal(true);
    } catch (e: any) {
      Alert.alert('Nie udało się wyeksportować', e?.message || 'Nie udało się wyeksportować danych.');
    }
  };

  const handleExportInventoryCsv = () => {
    try {
      const csv = exportInventoryCsv();
      setExportedCsvText(csv);
      setCsvModalTitle('Eksport Spiżarni (CSV)');
      setShowCsvModal(true);
    } catch (e: any) {
      Alert.alert('Nie udało się wyeksportować', e?.message || 'Nie udało się wyeksportować danych.');
    }
  };

  const handleImport = async () => {
    try {
      if (!importJsonText.trim()) {
        Alert.alert('Nie udało się zaimportować', 'Wklej prawidłowy tekst JSON kopii zapasowej.');
        return;
      }
      // Apps4Brew SEC-09 & BR-TEST-022: Tworzenie kopii bezpieczeństwa przed niszczącym importem
      // Natychmiastowe przerwanie importu w razie błędu zapisu kopii (RD-ENG-12)
      const currentData: NaparBackupData = {
        inventory: getInventoryItems(true),
        customRecipes: getRecipes(),
        sessions: getBrewSessions(),
        caffeineLogs: getCaffeineLogs(),
      };
      await safetyBackup('import', currentData);

      importDataJson(importJsonText.trim());
      setShowImportModal(false);
      setImportJsonText('');
      refreshAccess();
      Alert.alert('Sukces!', 'Dane zostały pomyślnie zaimportowane do Twojej lokalnej bazy.');
    } catch (e: any) {
      Alert.alert('Nie udało się zaimportować', e?.message || 'Niepoprawny format danych JSON.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Przełącznik Języka (PL / EN) */}
      <Text style={styles.sectionTitle}>{t.settings.languageSection}</Text>
      <View style={styles.langSelectorRow}>
        <Pressable
          style={[
            styles.langTab,
            language === 'pl' && styles.langTabActive,
          ]}
          onPress={() => setLanguage('pl')}
        >
          <Text style={[styles.langTabText, language === 'pl' && styles.langTabTextActive]}>
            Polski (Napar)
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.langTab,
            language === 'en' && styles.langTabActive,
          ]}
          onPress={() => setLanguage('en')}
        >
          <Text style={[styles.langTabText, language === 'en' && styles.langTabTextActive]}>
            English (Steepwise)
          </Text>
        </Pressable>
      </View>

      {/* Preferencje Naparów (Kawa / Herbata / Kawa i herbata) */}
      <Text style={styles.sectionTitle}>{t.settings.beverageSection}</Text>
      <View style={styles.cardGroup}>
        <Pressable
          testID="beverage-pref-both"
          style={styles.actionRow}
          onPress={() => handleSelectBeveragePreference('both')}
          accessibilityRole="button"
          accessibilityLabel={t.settings.beverageBoth}
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
          onPress={() => handleSelectBeveragePreference('coffee')}
          accessibilityRole="button"
          accessibilityLabel={t.settings.beverageCoffeeOnly}
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
          onPress={() => handleSelectBeveragePreference('tea')}
          accessibilityRole="button"
          accessibilityLabel={t.settings.beverageTeaOnly}
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
      <View style={styles.langSelectorRow}>
        <Pressable
          testID="unit-metric-btn"
          style={[
            styles.langTab,
            unitSystem === 'metric' && styles.langTabActive,
          ]}
          onPress={() => handleSelectUnitSystem('metric')}
          accessibilityRole="button"
          accessibilityLabel={t.settings.unitMetric}
        >
          <Text style={[styles.langTabText, unitSystem === 'metric' && styles.langTabTextActive]}>
            {t.settings.unitMetric}
          </Text>
        </Pressable>
        <Pressable
          testID="unit-imperial-btn"
          style={[
            styles.langTab,
            unitSystem === 'imperial' && styles.langTabActive,
          ]}
          onPress={() => handleSelectUnitSystem('imperial')}
          accessibilityRole="button"
          accessibilityLabel={t.settings.unitImperial}
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
            style={[
              styles.toggleBtn,
              voiceAnnounce && styles.toggleBtnActive,
            ]}
            onPress={handleToggleVoiceAnnounce}
            accessibilityRole="switch"
            accessibilityLabel={t.settings.voiceAnnounceTitle}
            accessibilityState={{ checked: voiceAnnounce }}
          >
            <Text
              style={[
                styles.toggleBtnText,
                voiceAnnounce && styles.toggleBtnTextActive,
              ]}
            >
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
            style={[
              styles.toggleBtn,
              haptics && styles.toggleBtnActive,
            ]}
            onPress={handleToggleHaptics}
            accessibilityRole="switch"
            accessibilityLabel={t.settings.hapticsTitle}
            accessibilityState={{ checked: haptics }}
          >
            <Text
              style={[
                styles.toggleBtnText,
                haptics && styles.toggleBtnTextActive,
              ]}
            >
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

      {/* Metabolizm Kofeiny & Sen (D-02 & BR-KOF-003) */}
      <CaffeineSettingsCard
        halfLifeHours={halfLifeHours}
        onHalfLifeChange={handleHalfLifeChange}
        bedtimeHour={bedtimeHour}
        onBedtimeChange={handleBedtimeChange}
        healthKitSync={healthKitSync}
        onToggleHealthKit={handleToggleHealthKit}
        t={t}
      />

      {/* Młynek Domowy (Domyślny młynek) */}
      <GrinderSelectionCard
        selectedGrinder={selectedGrinder}
        onSelectGrinder={handleSelectGrinder}
        title={t.settings.grinderSection}
      />

      {/* Kopia Zapasowa i Własność Danych */}
      <DataBackupCard
        onExportJson={handleExport}
        onOpenImportJson={() => setShowImportModal(true)}
        onExportSessionsCsv={handleExportSessionsCsv}
        onExportInventoryCsv={handleExportInventoryCsv}
      />

      {/* Oferta Apps4Brew Pass ("Cheaper than Espresso") */}
      <PassSettingsCard
        isSubscribed={isSubscribed}
        subscriptionTier={subscriptionTier}
        accessStatus={accessStatus}
        brewsRemaining={brewsRemaining}
        onOpenPassModal={() => setShowPassModal(true)}
        t={t}
      />

      {/* Rodzina Apps4Craft Studio (Kuchenne Rzemiosło) */}
      <CraftFamilyShowcase language={language} />

      {/* O aplikacji */}
      <Text style={styles.sectionTitle}>O Aplikacji</Text>
      <View style={styles.cardGroup}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Wersja</Text>
          <Text style={styles.infoValue}>1.0.0 (Build 1)</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Ekosystem</Text>
          <Text style={styles.infoValue}>Apps4Brew Specialty Portfolio</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Zgodność licencyjna</Text>
          <Text style={styles.infoValue}>GPLv3 / Open Core</Text>
        </View>
      </View>

      {/* Modal Eksportu JSON */}
      <JsonExportModal
        visible={showExportModal}
        onClose={() => setShowExportModal(false)}
        exportedJsonText={exportedJsonText}
      />

      {/* Modal Importu JSON */}
      <JsonImportModal
        visible={showImportModal}
        onClose={() => setShowImportModal(false)}
        importJsonText={importJsonText}
        onChangeImportJsonText={setImportJsonText}
        onImport={handleImport}
      />

      {/* Modal Eksportu CSV */}
      <CsvExportModal
        visible={showCsvModal}
        onClose={() => setShowCsvModal(false)}
        title={csvModalTitle}
        csvText={exportedCsvText}
      />

      {/* Apps4Brew Pass Paywall Modal ($0.99 / $4.99 / $14.99) */}
      <Apps4BrewPassModal
        visible={showPassModal}
        onClose={() => setShowPassModal(false)}
        onPurchaseSuccess={() => {
          setShowPassModal(false);
          refreshAccess();
        }}
        onSubscribed={() => {
          setShowPassModal(false);
          refreshAccess();
        }}
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
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    marginBottom: 8,
    marginTop: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  langSelectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  langTab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.bgCard,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  langTabActive: {
    borderColor: theme.colors.copper,
    backgroundColor: theme.colors.copperMuted,
  },
  langTabText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  langTabTextActive: {
    color: theme.colors.copperLight,
    fontWeight: '700',
  },
  cardGroup: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
    marginBottom: 16,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  actionTitleActive: {
    color: theme.colors.copper,
    fontWeight: '700',
  },
  actionSubtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    lineHeight: 16,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginLeft: 16,
  },
  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.bgCardSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  toggleBtnActive: {
    backgroundColor: theme.colors.copperMuted,
    borderColor: theme.colors.copper,
  },
  toggleBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  toggleBtnTextActive: {
    color: theme.colors.copperLight,
    fontWeight: '700',
  },
  unitPreviewRow: {
    paddingHorizontal: 4,
    paddingVertical: 4,
    marginBottom: 8,
  },
  unitPreviewText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  manifestoCard: {
    backgroundColor: 'rgba(200, 106, 40, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(200, 106, 40, 0.3)',
    borderRadius: theme.borderRadius.md,
    padding: 16,
    marginBottom: 16,
    marginTop: 8,
  },
  manifestoBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.copper,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  manifestoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 6,
  },
  manifestoBody: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 14,
  },
  infoLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
});
