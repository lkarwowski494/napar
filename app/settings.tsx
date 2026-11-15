// ============================================================================
// Napar — Ustawienia i Kopia Zapasowa (Apps4Brew)
// ZP-02, ZP-06, ZP-07, ZP-08, ZP-10: 100% offline, zero-login, darmowy eksport JSON
// ============================================================================

import React, { useState } from 'react';
import * as Linking from 'expo-linking';

import {
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  View,
  Text,
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
  getSoundEnabled,
  setSoundEnabled,
  getCaffeineHalfLife,
  setCaffeineHalfLife,
  getBedtimeHour,
  setBedtimeHour,
  BeveragePreference,
  getBeveragePreference,
  setBeveragePreference,
  buildBackupState,
} from '../src/data/database';
import { useBrew } from '../src/core/brew-context';
import { theme } from '../src/core/theme';
import { AppGuideModal } from '../src/components/AppGuideModal';
import { clampCaffeineHalfLifeHours } from '../src/core/domain-rules';
import { useTranslation } from '../src/core/i18n';
import { safetyBackup } from '../src/data/backup';
import { JsonExportModal, JsonImportModal } from '../src/components/settings/JsonBackupModals';
import { CsvExportModal } from '../src/components/settings/CsvExportModal';
import { CaffeineSettingsCard } from '../src/components/settings/CaffeineSettingsCard';
import { DataBackupCard } from '../src/components/settings/DataBackupCard';
import { GrinderSelectionCard } from '../src/components/settings/GrinderSelectionCard';
import { AppPreferencesCard } from '../src/components/settings/AppPreferencesCard';
import {
  APP_STORE_ID,
  appStoreReviewUrl,
  privacyPolicyUrl,
  TERMS_URL,
  SUPPORT_URL,
  SUPPORT_EMAIL,
  supportMailtoUrl,
} from '../src/core/app-identity';

export default function SettingsScreen() {
  const storeId = APP_STORE_ID;
  const supportEmail = SUPPORT_EMAIL;
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
  const [sound, setSound] = useState<boolean>(() => getSoundEnabled());
  const [halfLifeHours, setHalfLifeHoursState] = useState(() => {
    return getCaffeineHalfLife();
  });
  const [bedtimeHour, setBedtimeHourState] = useState(() => {
    return getBedtimeHour();
  });
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showCsvModal, setShowCsvModal] = useState(false);
  // M1-audytor-generalny-031 (04-studio-projektowe-008): przewodnik po aplikacji dostępny z Ustawień
  const [showGuide, setShowGuide] = useState(false);
  const [csvModalTitle, setCsvModalTitle] = useState('');
  const [exportedJsonText, setExportedJsonText] = useState('');
  const [importJsonText, setImportJsonText] = useState('');
  const [exportedCsvText, setExportedCsvText] = useState('');

  const handleHalfLifeChange = (newHours: number) => {
    const clamped = clampCaffeineHalfLifeHours(newHours);
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

  const handleToggleSound = () => {
    const next = !sound;
    setSound(next);
    setSoundEnabled(next);
  };

  const handleExport = () => {
    try {
      const json = exportAllDataJson();
      setExportedJsonText(json);
      setShowExportModal(true);
    } catch (e: any) {
      Alert.alert(t.settings.exportErrorTitle, e?.message || t.settings.exportErrorDesc);
    }
  };

  const handleExportSessionsCsv = () => {
    try {
      const csv = exportSessionsCsv();
      setExportedCsvText(csv);
      setCsvModalTitle(language === 'pl' ? 'Eksport Dziennika (CSV)' : 'Journal Export (CSV)');
      setShowCsvModal(true);
    } catch (e: any) {
      Alert.alert(t.settings.exportErrorTitle, e?.message || t.settings.exportErrorDesc);
    }
  };

  const handleExportInventoryCsv = () => {
    try {
      const csv = exportInventoryCsv();
      setExportedCsvText(csv);
      setCsvModalTitle(language === 'pl' ? 'Eksport Spiżarni (CSV)' : 'Stash Export (CSV)');
      setShowCsvModal(true);
    } catch (e: any) {
      Alert.alert(t.settings.exportErrorTitle, e?.message || t.settings.exportErrorDesc);
    }
  };

  const handleImport = async () => {
    try {
      if (!importJsonText.trim()) {
        Alert.alert(
          language === 'pl' ? 'Nie udało się zaimportować' : 'Import failed',
          language === 'pl' ? 'Wklej prawidłowy tekst JSON kopii zapasowej.' : 'Paste valid backup JSON text.'
        );
        return;
      }
      // Apps4Brew SEC-09 & BR-TEST-022: Tworzenie kopii bezpieczeństwa przed niszczącym importem
      await safetyBackup('import', buildBackupState());

      importDataJson(importJsonText.trim());
      setShowImportModal(false);
      setImportJsonText('');
      Alert.alert(
        language === 'pl' ? 'Sukces!' : 'Success!',
        language === 'pl' ? 'Dane zostały pomyślnie zaimportowane do Twojej lokalnej bazy.' : 'Data successfully imported to your local database.'
      );
    } catch (e: any) {
      Alert.alert(
        language === 'pl' ? 'Nie udało się zaimportować' : 'Import failed',
        e?.message || (language === 'pl' ? 'Niepoprawny format danych JSON.' : 'Invalid JSON data format.')
      );
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Preferencje Aplikacji: Język, Rodzaj naparów, Jednostki, Dostępność, Filozofia */}
      <AppPreferencesCard
        t={t}
        language={language}
        onSetLanguage={setLanguage}
        beveragePreference={beveragePreference}
        onSelectBeveragePreference={handleSelectBeveragePreference}
        unitSystem={unitSystem}
        onSelectUnitSystem={handleSelectUnitSystem}
        voiceAnnounce={voiceAnnounce}
        onToggleVoiceAnnounce={handleToggleVoiceAnnounce}
        haptics={haptics}
        onToggleHaptics={handleToggleHaptics}
        sound={sound}
        onToggleSound={handleToggleSound}
      />

      {/* Metabolizm Kofeiny & Sen (D-02 & BR-KOF-003) */}
      <CaffeineSettingsCard
        halfLifeHours={halfLifeHours}
        onHalfLifeChange={handleHalfLifeChange}
        bedtimeHour={bedtimeHour}
        onBedtimeChange={handleBedtimeChange}
        t={t}
      />

      {/* Młynek Domowy (Domyślny młynek) */}
      <GrinderSelectionCard
        selectedGrinder={selectedGrinder}
        onSelectGrinder={handleSelectGrinder}
        title={t.settings.grinderSection}
        language={language}
      />

      {/* Kopia Zapasowa & Eksport (ZP-02, ZP-06, ZP-07, ZP-08, ZP-10) */}
      <DataBackupCard
        onExportJson={handleExport}
        onOpenImportJson={() => setShowImportModal(true)}
        onExportSessionsCsv={handleExportSessionsCsv}
        onExportInventoryCsv={handleExportInventoryCsv}
        t={t}
      />

      {/* Modale Eksportu / Importu */}
      <JsonExportModal
        visible={showExportModal}
        exportedJsonText={exportedJsonText}
        onClose={() => setShowExportModal(false)}
      />

      <JsonImportModal
        visible={showImportModal}
        jsonText={importJsonText}
        onChangeJsonText={setImportJsonText}
        onConfirmImport={handleImport}
        onClose={() => {
          setShowImportModal(false);
          setImportJsonText('');
        }}
      />

      <CsvExportModal
        visible={showCsvModal}
        title={csvModalTitle}
        csvText={exportedCsvText}
        onClose={() => setShowCsvModal(false)}
      />

      {/* O aplikacji */}
      <Text style={styles.sectionTitle}>{language === 'pl' ? 'O Aplikacji' : 'About App'}</Text>
      <View style={styles.cardGroup}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{language === 'pl' ? 'Wersja' : 'Version'}</Text>
          <Text style={styles.infoValue}>1.0.0 (Build 1)</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{language === 'pl' ? 'Ekosystem' : 'Ecosystem'}</Text>
          <Text style={styles.infoValue}>Apps4Brew Specialty Portfolio</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{language === 'pl' ? 'Zgodność licencyjna' : 'License'}</Text>
          <Text style={styles.infoValue}>{t.settings.licenseValue}</Text>
        </View>
        <View style={styles.divider} />
        <Pressable
          style={styles.infoRow}
          onPress={() => Linking.openURL(privacyPolicyUrl(language === 'en' ? 'en' : 'pl'))}
          accessibilityRole="link"
          accessibilityLabel={t.settings.privacyLabel || (language === 'pl' ? 'Polityka Prywatności' : 'Privacy Policy')}
        >
          <Text style={styles.infoLabel}>{t.settings.privacyLabel || (language === 'pl' ? 'Polityka Prywatności' : 'Privacy Policy')}</Text>
          <Text style={[styles.infoValue, { color: theme.colors.copper }]}>{language === 'pl' ? 'Otwórz ↗' : 'Open ↗'}</Text>
        </Pressable>
        <View style={styles.divider} />
        <Pressable
          style={styles.infoRow}
          onPress={() => Linking.openURL(TERMS_URL)}
          accessibilityRole="link"
          accessibilityLabel={t.settings.eulaLabel || (language === 'pl' ? 'Regulamin (EULA)' : 'Terms of Service (EULA)')}
        >
          <Text style={styles.infoLabel}>{t.settings.eulaLabel || (language === 'pl' ? 'Regulamin (EULA)' : 'Terms of Service (EULA)')}</Text>
          <Text style={[styles.infoValue, { color: theme.colors.copper }]}>{language === 'pl' ? 'Otwórz ↗' : 'Open ↗'}</Text>
        </Pressable>
        <View style={styles.divider} />
        <Pressable
          style={styles.infoRow}
          onPress={() => Linking.openURL(supportEmail ? supportMailtoUrl(supportEmail) : SUPPORT_URL)}
          accessibilityRole="link"
          accessibilityLabel={language === 'pl' ? 'Kontakt i Wsparcie' : 'Contact & Support'}
        >
          <Text style={styles.infoLabel}>{language === 'pl' ? 'Kontakt i Wsparcie' : 'Contact & Support'}</Text>
          {/* M1-audytor-generalny-023: adres e-mail tylko z SUPPORT_EMAIL (app-identity.ts); bez niego strona wsparcia. */}
          <Text style={[styles.infoValue, { color: theme.colors.copper }]}>
            {supportEmail ? `${supportEmail} ↗` : language === 'pl' ? 'Otwórz ↗' : 'Open ↗'}
          </Text>
        </Pressable>
        <View style={styles.divider} />
        <Pressable
          testID="settings-open-guide-btn"
          style={styles.infoRow}
          onPress={() => setShowGuide(true)}
          accessibilityRole="button"
          accessibilityLabel={t.common.howItWorks}
        >
          <Text style={styles.infoLabel}>{t.common.howItWorks}</Text>
          <Text style={[styles.infoValue, { color: theme.colors.copper }]}>›</Text>
        </Pressable>
        {/* M1-audytor-generalny-022: link oceny tylko przy prawdziwym Apple ID (app-identity.ts). */}
        {storeId && (
          <>
          <View style={styles.divider} />
          <Pressable
            style={styles.infoRow}
            onPress={() => Linking.openURL(appStoreReviewUrl(storeId))}
            accessibilityRole="link"
            accessibilityLabel={language === 'pl' ? 'Oceń w App Store' : 'Rate in App Store'}
          >
            <Text style={styles.infoLabel}>{language === 'pl' ? 'Oceń w App Store' : 'Rate in App Store'}</Text>
            <Text style={[styles.infoValue, { color: theme.colors.copper }]}>{language === 'pl' ? 'Wystaw ocenę ↗' : 'Write review ↗'}</Text>
          </Pressable>
          </>
        )}
      </View>
      <AppGuideModal visible={showGuide} onClose={() => setShowGuide(false)} language={language} />
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
  cardGroup: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
    marginBottom: 16,
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
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginLeft: 16,
  },
});
