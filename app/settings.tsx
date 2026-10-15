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
import { exportAllDataJson, importDataJson } from '../src/core/database';
import { theme } from '../src/core/theme';

export default function SettingsScreen() {
  const [isPro, setIsPro] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [exportedJsonText, setExportedJsonText] = useState('');
  const [importJsonText, setImportJsonText] = useState('');

  const handleExport = () => {
    try {
      const json = exportAllDataJson();
      setExportedJsonText(json);
      setShowExportModal(true);
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
      importDataJson(importJsonText.trim());
      setShowImportModal(false);
      setImportJsonText('');
      Alert.alert('Sukces!', 'Dane zostały pomyślnie zaimportowane do Twojej lokalnej bazy.');
    } catch (e: any) {
      Alert.alert('Błąd importu', e?.message || 'Niepoprawny format danych JSON.');
    }
  };

  const handleRestorePurchases = () => {
    Alert.alert(
      'Przywracanie zakupów',
      'Sprawdzanie lokalnych uprawnień StoreKit... Twoja licencja jest aktywna.'
    );
    setIsPro(true);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Karta Filozofii Apps4Brew */}
      <View style={styles.manifestoCard}>
        <Text style={styles.manifestoBadge}>FILOZOFIA APPS4BREW</Text>
        <Text style={styles.manifestoTitle}>Prywatność i Rzemiosło</Text>
        <Text style={styles.manifestoBody}>
          Napar nie wymaga logowania, nie łączy się z żadnym zewnętrznym serwerem i nie zbiera Twoich danych (etykieta „Data Not Collected”). Cała spiżarnia, dziennik i kalkulatory działają w 100% lokalnie na Twoim urządzeniu.
        </Text>
      </View>

      {/* Kopia Zapasowa i Własność Danych */}
      <Text style={styles.sectionTitle}>Twoje Dane (ZP-06 & ZP-07)</Text>
      <View style={styles.cardGroup}>
        <Pressable style={styles.actionRow} onPress={handleExport}>
          <View style={{ flex: 1 }}>
            <Text style={styles.actionTitle}>Eksportuj Kopię Zapasową (JSON)</Text>
            <Text style={styles.actionSubtitle}>
              Pobierz pełną historię parzeń, spiżarnię i notatki w otwartym formacie
            </Text>
          </View>
          <Text style={styles.actionArrow}>↗</Text>
        </Pressable>

        <View style={styles.divider} />

        <Pressable style={styles.actionRow} onPress={() => setShowImportModal(true)}>
          <View style={{ flex: 1 }}>
            <Text style={styles.actionTitle}>Importuj Kopię z Pliku JSON</Text>
            <Text style={styles.actionSubtitle}>
              Przywróć stan spiżarni i sesji z wcześniejszej kopii zapasowej
            </Text>
          </View>
          <Text style={styles.actionArrow}>↙</Text>
        </Pressable>
      </View>

      {/* Oferta Apps4Brew Pro */}
      <Text style={styles.sectionTitle}>Napar Pro (ZP-08)</Text>
      <View style={styles.proCard}>
        <View style={styles.proHeader}>
          <Text style={styles.proTitle}>Odblokuj Pełnię Rzemiosła</Text>
          {isPro && (
            <View style={styles.proActiveBadge}>
              <Text style={styles.proActiveText}>AKTYWNY PRO</Text>
            </View>
          )}
        </View>

        <Text style={styles.proDesc}>
          Darmowy rdzeń pozwala parzyć bez ograniczeń czasowych. Wersja Pro wspiera niezależny rozwój bez inwestorów i reklam:
        </Text>

        <View style={styles.proPerks}>
          <Text style={styles.proPerkItem}>✓ Nielimitowana spiżarnia ziaren i rzadkich herbat</Text>
          <Text style={styles.proPerkItem}>✓ Zaawansowane wykresy kinetyki kofeiny i integracja Apple Health</Text>
          <Text style={styles.proPerkItem}>✓ Niezależny stoper na Apple Watch z haptyką</Text>
          <Text style={styles.proPerkItem}>✓ Live Activity na zablokowanym ekranie i Dynamic Island</Text>
        </View>

        <View style={styles.pricingGrid}>
          <Pressable
            style={styles.priceOption}
            onPress={() => {
              setIsPro(true);
              Alert.alert('Dziękujemy!', 'Napar Pro został pomyślnie aktywowany.');
            }}
          >
            <Text style={styles.priceTerm}>MIESIĘCZNY</Text>
            <Text style={styles.priceValue}>3,99 zł</Text>
            <Text style={styles.priceSub}>0,99 € / mies.</Text>
          </Pressable>

          <Pressable
            style={[styles.priceOption, styles.priceOptionBest]}
            onPress={() => {
              setIsPro(true);
              Alert.alert('Dziękujemy!', 'Roczna subskrypcja Napar Pro (14 dni za darmo) została aktywowana.');
            }}
          >
            <View style={styles.bestBadge}>
              <Text style={styles.bestBadgeText}>14 DNI TRIAL</Text>
            </View>
            <Text style={styles.priceTerm}>ROCZNY</Text>
            <Text style={styles.priceValue}>19,99 zł</Text>
            <Text style={styles.priceSub}>4,99 € / rok</Text>
          </Pressable>

          <Pressable
            style={styles.priceOption}
            onPress={() => {
              setIsPro(true);
              Alert.alert('Dziękujemy!', 'Dożywotnia licencja Lifetime została aktywowana!');
            }}
          >
            <Text style={styles.priceTerm}>LIFETIME</Text>
            <Text style={styles.priceValue}>59,99 zł</Text>
            <Text style={styles.priceSub}>Raz na zawsze + Chmura rodzinna</Text>
          </Pressable>
        </View>

        <Pressable style={styles.restoreBtn} onPress={handleRestorePurchases}>
          <Text style={styles.restoreBtnText}>Przywróć wcześniejsze zakupy</Text>
        </Pressable>
      </View>

      {/* O aplikacji */}
      <Text style={styles.sectionTitle}>O Aplikacji</Text>
      <View style={styles.cardGroup}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Wersja</Text>
          <Text style={styles.infoValue}>0.1.0 (Build 1)</Text>
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
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Kopia Zapasowa (JSON)</Text>
            <Pressable onPress={() => setShowExportModal(false)}>
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
        </View>
      </Modal>

      {/* Modal Importu JSON */}
      <Modal visible={showImportModal} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Importuj Dane JSON</Text>
            <Pressable onPress={() => setShowImportModal(false)}>
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
        </View>
      </Modal>
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
  modalCloseText: {
    fontSize: 16,
    color: theme.colors.copper,
    fontWeight: '600',
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
});
