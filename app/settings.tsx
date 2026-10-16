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
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  getIsProUser,
  setIsProUser,
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
import { SUPPORTED_GRINDERS } from '../src/core/grinder-converter';
import { theme } from '../src/core/theme';
import { useTranslation, SupportedLanguage } from '../src/core/i18n';
import { safetyBackup, NaparBackupData } from '../src/core/backup';
import { useAppAccess } from '../src/core/app-access';
import { Apps4BrewPassModal } from '../src/components/Apps4BrewPassModal';
import {
  formatTemperature,
  formatDoseWeight,
  formatWaterWeight,
} from '../src/core/unit-converter';

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
  const [isPro, setIsPro] = useState(() => {
    return getIsProUser();
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
    daysRemaining,
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
      Alert.alert('Błąd eksportu', e?.message || 'Nie udało się wyeksportować danych.');
    }
  };

  const handleExportSessionsCsv = () => {
    try {
      const csv = exportSessionsCsv();
      setExportedCsvText(csv);
      setCsvModalTitle('Eksport Dziennika (CSV)');
      setShowCsvModal(true);
    } catch (e: any) {
      Alert.alert('Błąd eksportu', e?.message || 'Nie udało się wyeksportować danych.');
    }
  };

  const handleExportInventoryCsv = () => {
    try {
      const csv = exportInventoryCsv();
      setExportedCsvText(csv);
      setCsvModalTitle('Eksport Spiżarni (CSV)');
      setShowCsvModal(true);
    } catch (e: any) {
      Alert.alert('Błąd eksportu', e?.message || 'Nie udało się wyeksportować danych.');
    }
  };

  const handleImport = () => {
    try {
      if (!importJsonText.trim()) {
        Alert.alert('Błąd', 'Wklej prawidłowy tekst JSON kopii zapasowej.');
        return;
      }
      // Apps4Brew SEC-09: Tworzenie kopii bezpieczeństwa przed niszczącym importem
      try {
        const currentData: NaparBackupData = {
          inventory: getInventoryItems(true),
          customRecipes: getRecipes(),
          sessions: getBrewSessions(),
          caffeineLogs: getCaffeineLogs(),
        };
        safetyBackup('import', currentData).catch(() => {});
      } catch {
        // Kontynuuj import nawet jeśli system plików napotkał problem
      }
      importDataJson(importJsonText.trim());
      setShowImportModal(false);
      setImportJsonText('');
      refreshAccess();
      Alert.alert('Sukces!', 'Dane zostały pomyślnie zaimportowane do Twojej lokalnej bazy.');
    } catch (e: any) {
      Alert.alert('Błąd importu', e?.message || 'Niepoprawny format danych JSON.');
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
            🇵🇱 Polski (Napar)
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
            🇬🇧 English (Steepwise)
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
              ☕ + 🍵 {t.settings.beverageBoth}
            </Text>
            <Text style={styles.actionSubtitle}>{t.settings.beverageBothDesc}</Text>
          </View>
          {beveragePreference === 'both' && (
            <Text style={styles.checkIcon}>✓</Text>
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
              ☕ {t.settings.beverageCoffeeOnly}
            </Text>
            <Text style={styles.actionSubtitle}>{t.settings.beverageCoffeeOnlyDesc}</Text>
          </View>
          {beveragePreference === 'coffee' && (
            <Text style={styles.checkIcon}>✓</Text>
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
              🍵 {t.settings.beverageTeaOnly}
            </Text>
            <Text style={styles.actionSubtitle}>{t.settings.beverageTeaOnlyDesc}</Text>
          </View>
          {beveragePreference === 'tea' && (
            <Text style={styles.checkIcon}>✓</Text>
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
            <Text style={styles.actionTitle}>📢 {t.settings.voiceAnnounceTitle}</Text>
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
            <Text style={styles.actionTitle}>📳 {t.settings.hapticsTitle}</Text>
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
      <Text style={styles.sectionTitle}>
        {t.settings.caffeineSettingsSection || 'Metabolizm Kofeiny & Sen (D-02)'}
      </Text>
      <View style={styles.cardGroup}>
        <View style={styles.actionRow}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={styles.actionTitle}>
              {t.settings.caffeineHalfLifeTitle || 'Czas Półtrwania Kofeiny (t₁/₂)'}
            </Text>
            <Text style={styles.actionSubtitle}>
              {t.settings.caffeineHalfLifeDesc || 'Wskaźnik klirensu wątrobowego (3.0h–8.0h, domyślnie 5.0h wg EFSA).'}
            </Text>
          </View>
          <View style={styles.stepperContainer}>
            <Pressable
              style={styles.stepperBtn}
              onPress={() => handleHalfLifeChange(halfLifeHours - 0.5)}
              accessibilityLabel="Zmniejsz czas półtrwania"
            >
              <Text style={styles.stepperBtnText}>−</Text>
            </Pressable>
            <Text style={styles.stepperValueText}>{halfLifeHours.toFixed(1)}h</Text>
            <Pressable
              style={styles.stepperBtn}
              onPress={() => handleHalfLifeChange(halfLifeHours + 0.5)}
              accessibilityLabel="Zwiększ czas półtrwania"
            >
              <Text style={styles.stepperBtnText}>+</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.actionRow}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={styles.actionTitle}>
              {t.settings.bedtimeHourTitle || 'Docelowa Godzina Snu'}
            </Text>
            <Text style={styles.actionSubtitle}>
              {t.settings.bedtimeHourDesc || 'Używana do kalkulacji nocnego curfew i progu 25 mg dla fazy NREM.'}
            </Text>
          </View>
          <View style={styles.stepperContainer}>
            <Pressable
              style={styles.stepperBtn}
              onPress={() => handleBedtimeChange(bedtimeHour - 1)}
              accessibilityLabel="Wcześniejsza godzina snu"
            >
              <Text style={styles.stepperBtnText}>−</Text>
            </Pressable>
            <Text style={styles.stepperValueText}>{`${bedtimeHour}:00`}</Text>
            <Pressable
              style={styles.stepperBtn}
              onPress={() => handleBedtimeChange(bedtimeHour + 1)}
              accessibilityLabel="Późniejsza godzina snu"
            >
              <Text style={styles.stepperBtnText}>+</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.divider} />

        {/* BR-KOF-002: Apple HealthKit Integration */}
        <View style={styles.actionRow}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={styles.actionTitle}>
              {t.settings.healthKitTitle || 'Synchronizuj Kofeinę z Apple Health'}
            </Text>
            <Text style={styles.actionSubtitle}>
              {t.settings.healthKitSubtitle || 'Automatycznie zapisuj spożytą kofeinę (Dietary Caffeine) w aplikacji Zdrowie bez wysyłania danych na zewnątrz.'}
            </Text>
          </View>
          <Pressable
            testID="toggle-healthkit-btn"
            style={[
              styles.toggleBtn,
              healthKitSync && styles.toggleBtnActive,
            ]}
            onPress={handleToggleHealthKit}
            accessibilityRole="switch"
            accessibilityLabel={`${t.settings.healthKitTitle}: ${healthKitSync ? t.settings.enabled : t.settings.disabled}`}
          >
            <Text
              style={[
                styles.toggleBtnText,
                healthKitSync && styles.toggleBtnTextActive,
              ]}
            >
              {healthKitSync ? t.settings.enabled : t.settings.disabled}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Młynek Domowy (Domyślny młynek) */}
      <Text style={styles.sectionTitle}>{t.settings.grinderSection}</Text>
      <View style={styles.cardGroup}>
        {SUPPORTED_GRINDERS.map((grinder, idx) => {
          const isSelected = selectedGrinder === grinder.id;
          return (
            <React.Fragment key={grinder.id}>
              {idx > 0 && <View style={styles.divider} />}
              <Pressable
                style={[
                  styles.actionRow,
                  isSelected && { backgroundColor: theme.colors.bgCardSecondary },
                ]}
                onPress={() => handleSelectGrinder(grinder.id)}
                accessibilityRole="button"
                accessibilityLabel={`${grinder.name}, ${isSelected ? 'wybrany' : 'wybierz'}`}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.actionTitle,
                      isSelected && { color: theme.colors.copper, fontWeight: '700' },
                    ]}
                  >
                    {grinder.name}
                  </Text>
                  <Text style={styles.actionSubtitle}>
                    {grinder.stepMicrons} µm/klik · Zakres: {grinder.minSetting}–{grinder.maxSetting}
                  </Text>
                </View>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: '700',
                    color: isSelected ? theme.colors.copper : theme.colors.textMuted,
                  }}
                >
                  {isSelected ? '✓' : '○'}
                </Text>
              </Pressable>
            </React.Fragment>
          );
        })}
      </View>

      {/* Kopia Zapasowa i Własność Danych */}
      <Text style={styles.sectionTitle}>Twoje Dane (ZP-06 & ZP-07)</Text>
      <View style={styles.cardGroup}>
        <Pressable
          testID="export-json-btn"
          style={styles.actionRow}
          onPress={handleExport}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.actionTitle}>Eksportuj Kopię Zapasową (JSON)</Text>
            <Text style={styles.actionSubtitle}>
              Pobierz pełną historię parzeń, spiżarnię i notatki w otwartym formacie
            </Text>
          </View>
          <Text style={styles.actionArrow}>↗</Text>
        </Pressable>

        <View style={styles.divider} />

        <Pressable
          testID="import-json-btn"
          style={styles.actionRow}
          onPress={() => setShowImportModal(true)}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.actionTitle}>Importuj Kopię z Pliku JSON</Text>
            <Text style={styles.actionSubtitle}>
              Przywróć stan spiżarni i sesji z wcześniejszej kopii zapasowej
            </Text>
          </View>
          <Text style={styles.actionArrow}>↙</Text>
        </Pressable>

        <View style={styles.divider} />

        <Pressable
          testID="export-csv-sessions-btn"
          style={styles.actionRow}
          onPress={handleExportSessionsCsv}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.actionTitle}>Eksportuj Dziennik (CSV)</Text>
            <Text style={styles.actionSubtitle}>
              Arkusz kalkulacyjny (Excel, Google Sheets) z historią zaparzeń i sensoryką
            </Text>
          </View>
          <Text style={styles.actionArrow}>📊</Text>
        </Pressable>

        <View style={styles.divider} />

        <Pressable style={styles.actionRow} onPress={handleExportInventoryCsv}>
          <View style={{ flex: 1 }}>
            <Text style={styles.actionTitle}>Eksportuj Spiżarnię (CSV)</Text>
            <Text style={styles.actionSubtitle}>
              Zestawienie paczek ziaren, herbat, palarni, dat palenia i zapasów
            </Text>
          </View>
          <Text style={styles.actionArrow}>🫙</Text>
        </Pressable>
      </View>

      {/* Oferta Apps4Brew Pass ("Cheaper than Espresso") */}
      <Text style={styles.sectionTitle}>{t.settings.proTitle} — Apps4Brew Pass</Text>
      <View style={styles.proCard}>
        <View style={styles.proHeader}>
          <Text style={styles.proTitle}>{t.paywall.title}</Text>
          {isSubscribed ? (
            <View style={styles.proActiveBadge}>
              <Text style={styles.proActiveText}>
                {subscriptionTier.toUpperCase()} PRO
              </Text>
            </View>
          ) : accessStatus === 'trial_active' ? (
            <View style={[styles.proActiveBadge, { backgroundColor: theme.colors.copperMuted }]}>
              <Text style={[styles.proActiveText, { color: theme.colors.copper }]}>
                TRIAL ({brewsRemaining} {brewsRemaining === 1 ? 'parzenie' : 'parzenia'})
              </Text>
            </View>
          ) : (
            <View style={[styles.proActiveBadge, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
              <Text style={[styles.proActiveText, { color: '#ef4444' }]}>
                TRIAL WYGASŁ
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.proDesc}>{t.paywall.tagline}</Text>

        <View style={styles.proPerks}>
          <Text style={styles.proPerkItem}>{t.paywall.perk1}</Text>
          <Text style={styles.proPerkItem}>{t.paywall.perk2}</Text>
          <Text style={styles.proPerkItem}>{t.paywall.perk3}</Text>
          <Text style={styles.proPerkItem}>{t.paywall.perk4}</Text>
        </View>

        <Pressable
          testID="open-apps4brew-pass-btn"
          style={styles.passCtaBtn}
          onPress={() => setShowPassModal(true)}
          accessibilityRole="button"
          accessibilityLabel={isSubscribed ? 'Apps4Brew Pass: Aktywny' : 'Odblokuj Apps4Brew Pass ($0.99 / $4.99 / $14.99)'}
        >
          <Text style={styles.passCtaBtnText}>
            {isSubscribed
              ? '★ Licencja Aktywna — Zarządzaj Planem'
              : '☕ Przejdź do planów ($0.99 / $4.99 / $14.99)'}
          </Text>
        </Pressable>
      </View>

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
      <Modal visible={showExportModal} animationType="slide">
        <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom', 'left', 'right']}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Kopia Zapasowa (JSON)</Text>
            <Pressable
              style={styles.modalCloseBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              onPress={() => setShowExportModal(false)}
              accessibilityRole="button"
              accessibilityLabel="Zamknij"
            >
              <Text style={styles.modalCloseText}>Zamknij</Text>
            </Pressable>
          </View>
          <Text style={styles.modalSub}>
            Poniższy kod JSON zawiera wszystkie Twoje wpisy ze spiżarni, historię parzeń oraz logi kofeiny. Możesz go skopiować i bezpiecznie zapisać:
          </Text>
          <TextInput
            style={styles.jsonTextInput}
            multiline
            editable={false}
            value={exportedJsonText}
          />
        </SafeAreaView>
      </Modal>

      {/* Modal Importu JSON */}
      <Modal visible={showImportModal} animationType="slide">
        <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom', 'left', 'right']}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Importuj Dane JSON</Text>
            <Pressable
              style={styles.modalCloseBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              onPress={() => setShowImportModal(false)}
              accessibilityRole="button"
              accessibilityLabel="Anuluj"
            >
              <Text style={styles.modalCloseText}>Anuluj</Text>
            </Pressable>
          </View>
          <Text style={styles.modalSub}>
            Wklej poniżej treść pliku JSON z kopią zapasową aplikacji Napar:
          </Text>
          <TextInput
            style={styles.jsonTextInput}
            multiline
            placeholder='{"version": 1, ...}'
            placeholderTextColor={theme.colors.textMuted}
            value={importJsonText}
            onChangeText={setImportJsonText}
          />
          <Pressable style={styles.submitImportBtn} onPress={handleImport}>
            <Text style={styles.submitImportBtnText}>Zaimportuj i Zastąp Dane</Text>
          </Pressable>
        </SafeAreaView>
      </Modal>

      {/* Modal Eksportu CSV (Z-152, ZP-07) */}
      <Modal visible={showCsvModal} animationType="slide">
        <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom', 'left', 'right']}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{csvModalTitle}</Text>
            <Pressable
              style={styles.modalCloseBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              onPress={() => setShowCsvModal(false)}
              accessibilityRole="button"
              accessibilityLabel="Zamknij"
            >
              <Text style={styles.modalCloseText}>Zamknij</Text>
            </Pressable>
          </View>
          <Text style={styles.modalSub}>
            Poniższy tekst w formacie CSV możesz skopiować do schowka i otworzyć w Excelu, Numbers lub Arkuszach Google:
          </Text>
          <TextInput
            style={styles.jsonTextInput}
            multiline
            editable={false}
            value={exportedCsvText}
          />
        </SafeAreaView>
      </Modal>

      {/* Modal Apps4Brew Pass ("Cheaper than Espresso") */}
      <Apps4BrewPassModal
        visible={showPassModal}
        onClose={() => setShowPassModal(false)}
        onPurchaseSuccess={refreshAccess}
        onSubscribed={refreshAccess}
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
  manifestoCard: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.md,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.copper,
    marginBottom: 24,
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
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  cardGroup: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 24,
    overflow: 'hidden',
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
  actionSubtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  actionArrow: {
    fontSize: 18,
    color: theme.colors.copper,
    marginLeft: 12,
  },
  actionTitleActive: {
    color: theme.colors.copper,
    fontWeight: '700',
  },
  checkIcon: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.copper,
    marginLeft: 12,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
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
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  proCard: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: theme.colors.copper,
    marginBottom: 24,
  },
  proHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  proTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  proActiveBadge: {
    backgroundColor: theme.colors.statusPeakMuted,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
  },
  proActiveText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.statusPeak,
  },
  proDesc: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  proPerks: {
    gap: 6,
    marginBottom: 18,
  },
  proPerkItem: {
    fontSize: 12,
    color: theme.colors.copperLight,
    fontWeight: '500',
  },
  pricingGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  priceOption: {
    flex: 1,
    backgroundColor: theme.colors.bgCardSecondary,
    borderRadius: theme.borderRadius.md,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  priceOptionBest: {
    borderColor: theme.colors.copper,
    backgroundColor: theme.colors.copperMuted,
  },
  bestBadge: {
    backgroundColor: theme.colors.copper,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  bestBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  priceTerm: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.textMuted,
    marginBottom: 2,
  },
  priceValue: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  priceSub: {
    fontSize: 9,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  restoreBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  restoreBtnText: {
    fontSize: 12,
    color: theme.colors.textMuted,
    textDecorationLine: 'underline',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    padding: theme.spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  modalCloseBtn: {
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.bgCardSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    fontSize: 14,
    color: theme.colors.copper,
    fontWeight: '700',
  },
  modalSub: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginBottom: 12,
    lineHeight: 18,
  },
  jsonTextInput: {
    flex: 1,
    backgroundColor: theme.colors.bgCard,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: 14,
    color: theme.colors.textPrimary,
    fontFamily: 'monospace',
    fontSize: 12,
    marginBottom: 16,
  },
  submitImportBtn: {
    backgroundColor: theme.colors.copper,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginBottom: 20,
  },
  submitImportBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  langSelectorRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  langTab: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  langTabActive: {
    backgroundColor: 'rgba(217, 119, 54, 0.15)',
    borderColor: theme.colors.copper,
  },
  langTabText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  langTabTextActive: {
    color: theme.colors.copper,
    fontWeight: '700',
  },
  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.bgCardSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  toggleBtnActive: {
    backgroundColor: 'rgba(217, 119, 54, 0.15)',
    borderColor: theme.colors.copper,
  },
  toggleBtnText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  toggleBtnTextActive: {
    color: theme.colors.copper,
    fontWeight: '700',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.bgCardSecondary,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: 6,
    paddingVertical: 4,
    gap: 8,
  },
  stepperBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnText: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  stepperValueText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.copperLight,
    minWidth: 44,
    textAlign: 'center',
  },
  unitPreviewRow: {
    backgroundColor: theme.colors.bgCardSecondary,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  unitPreviewText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  passCtaBtn: {
    backgroundColor: theme.colors.copper,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  passCtaBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
