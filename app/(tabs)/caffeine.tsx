// ============================================================================
// Napar (Steepwise) — Monitor Kofeiny i Kalkulator Snu (Caffeine & Sleep Curfew)
// Kinetyka eliminacji (t1/2 = 5.0h), próg bezpiecznego snu i dobowy bilans EFSA
// ============================================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  Alert,
} from 'react-native';
import {
  getCaffeineLogs,
  logCaffeine,
  deleteCaffeineLog,
  getBedtimeHour,
  setBedtimeHour,
  getCaffeineHalfLife,
  setCaffeineHalfLife,
  getUnitSystem,
} from '../../src/core/database';
import { formatDoseWeight } from '../../src/core/unit-converter';
import { CaffeineLog } from '../../src/core/database-schema';
import {
  calculateRemainingCaffeineMg,
  evaluateBedtimeCaffeine,
  calculateHoursUntilSafeCaffeine,
} from '../../src/core/domain-rules';
import { CaffeineCurveChart } from '../../src/core/caffeine-chart';
import { theme } from '../../src/core/theme';
import { getHealthKitSyncEnabled, saveDietaryCaffeineSample } from '../../src/core/healthkit';
import { useAppAccess } from '../../src/core/app-access';
import { Apps4BrewPassModal } from '../../src/components/Apps4BrewPassModal';

export default function CaffeineScreen() {
  const { canCreate, isHistoryReadOnly, refresh } = useAppAccess();
  const [showPaywall, setShowPaywall] = useState(false);
  const unitSystem = getUnitSystem();
  const [logs, setLogs] = useState<CaffeineLog[]>([]);
  const [bedtimeHour, setBedtimeHourState] = useState(() => {
    try {
      return getBedtimeHour();
    } catch {
      return 23;
    }
  });
  const [halfLifeHours, setHalfLifeHoursState] = useState(() => {
    try {
      return getCaffeineHalfLife();
    } catch {
      return 5.0;
    }
  });
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);

  const handleBedtimeChange = (newHour: number) => {
    const clamped = Math.max(18, Math.min(28, newHour));
    setBedtimeHourState(clamped);
    try {
      setBedtimeHour(clamped);
    } catch {}
  };

  const handleHalfLifeChange = (newHours: number) => {
    const clamped = Number(Math.max(3.0, Math.min(8.0, newHours)).toFixed(1));
    setHalfLifeHoursState(clamped);
    try {
      setCaffeineHalfLife(clamped);
    } catch {}
  };

  const loadLogs = () => {
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const data = getCaffeineLogs(todayStart.toISOString());
      setLogs(data);
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const now = new Date();

  // Obliczenie aktualnej ilości kofeiny w organizmie
  const currentTotalMg = logs.reduce((sum, item) => {
    const intakeTime = new Date(item.consumedAt).getTime();
    const hoursPassed = Math.max(0, (now.getTime() - intakeTime) / (1000 * 3600));
    return sum + calculateRemainingCaffeineMg(item.caffeineMg, hoursPassed, halfLifeHours);
  }, 0);

  // Całkowita spożyta dzisiaj kofeina
  const totalConsumedTodayMg = logs.reduce((sum, item) => sum + item.caffeineMg, 0);

  // Predykcja na godzinę snu (np. 23:00)
  const targetBedtime = new Date();
  targetBedtime.setHours(bedtimeHour, 0, 0, 0);
  if (targetBedtime.getTime() < now.getTime()) {
    targetBedtime.setDate(targetBedtime.getDate() + 1);
  }

  const intakesForEvaluation = logs.map((item) => {
    const intakeTime = new Date(item.consumedAt).getTime();
    const hoursUntilBedtime = (targetBedtime.getTime() - intakeTime) / (1000 * 3600);
    return {
      doseMg: item.caffeineMg,
      hoursUntilBedtime: Math.max(0, hoursUntilBedtime),
    };
  });

  const bedtimeEval = evaluateBedtimeCaffeine(intakesForEvaluation, 25.0, halfLifeHours);

  // Curfew (godzina graniczna dla nowej filiżanki 140mg)
  const hoursUntilSafe = calculateHoursUntilSafeCaffeine(140, 25.0, halfLifeHours);
  const curfewDate = new Date(targetBedtime.getTime() - hoursUntilSafe * 3600 * 1000);
  const curfewTimeString = `${curfewDate.getHours().toString().padStart(2, '0')}:${curfewDate
    .getMinutes()
    .toString()
    .padStart(2, '0')}`;

  const handleQuickAdd = (name: string, type: 'coffee' | 'tea', doseG: number, mg: number) => {
    if (!canCreate) {
      setShowQuickAddModal(false);
      setShowPaywall(true);
      return;
    }
    const consumedAt = new Date().toISOString();
    const log: CaffeineLog = {
      id: `caff-${Date.now()}`,
      beverageName: name,
      beverageType: type,
      consumedAt,
      doseGrams: doseG,
      caffeineMg: mg,
    };
    logCaffeine(log);

    // BR-KOF-002: Apple HealthKit sync
    if (getHealthKitSyncEnabled()) {
      saveDietaryCaffeineSample({
        caffeineMg: mg,
        consumedAt,
        beverageName: name,
      }).catch(() => {});
    }

    loadLogs();
    setShowQuickAddModal(false);
  };

  const handleDeleteLog = (log: CaffeineLog) => {
    if (!canCreate) {
      setShowPaywall(true);
      return;
    }
    deleteCaffeineLog(log.id);
    loadLogs();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Read-Only Status Banner when trial expired */}
      {isHistoryReadOnly && (
        <View style={styles.readOnlyBanner}>
          <Text style={styles.readOnlyBannerText}>
            Tryb Tylko do Odczytu — Twoja historia kofeiny jest bezpieczna. Nowe wpisy wymagają Apps4Brew Pass.
          </Text>
        </View>
      )}

      {/* Karta Stężenia Kofeiny Teraz */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>AKTYWNA KOFEINA W KRWIOBIEGU</Text>
        <Text style={styles.activeCaffeineNumber}>
          {Math.round(currentTotalMg)} mg
        </Text>
        <Text style={styles.summarySub}>
          Dobowy bilans: {Math.round(totalConsumedTodayMg)} mg / 400 mg (Zalecenie EFSA)
        </Text>

        <View style={styles.efsaProgressBar}>
          <View
            style={[
              styles.efsaProgressFill,
              {
                width: `${Math.min(100, Math.round((totalConsumedTodayMg / 400) * 100))}%`,
                backgroundColor:
                  totalConsumedTodayMg > 400 ? theme.colors.danger : theme.colors.copper,
              },
            ]}
          />
        </View>
      </View>

      {/* Wykres Kinetyki Kofeiny i Snu (SVG) */}
      <CaffeineCurveChart
        logs={logs}
        bedtimeHour={bedtimeHour}
        thresholdMg={25.0}
        halfLifeHours={halfLifeHours}
      />

      {/* Kalkulator Godziny Snu (Bedtime Curfew) */}
      <View style={styles.curfewCard}>
        <View style={styles.curfewHeader}>
          <Text style={styles.curfewTitle}>Predykcja Jakości Snu</Text>
          <View style={styles.bedtimeStepper}>
            <Pressable
              testID="bedtime-dec-btn"
              style={styles.hourBtn}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Wcześniejsza godzina snu"
              onPress={() => handleBedtimeChange(bedtimeHour - 1)}
            >
              <Text style={styles.hourBtnText}>−</Text>
            </Pressable>
            <Text style={styles.bedtimeHourText}>{`${bedtimeHour}:00`}</Text>
            <Pressable
              testID="bedtime-inc-btn"
              style={styles.hourBtn}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Późniejsza godzina snu"
              onPress={() => handleBedtimeChange(bedtimeHour + 1)}
            >
              <Text style={styles.hourBtnText}>+</Text>
            </Pressable>
          </View>
        </View>

        {/* Metabolizm Kofeiny (t1/2) D-02 */}
        <View style={styles.metabolismRow}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text style={styles.metabolismTitle}>Metabolizm kofeiny (t₁/₂)</Text>
            <Text style={styles.metabolismSubtitle}>
              {halfLifeHours <= 3.5
                ? 'Szybki klirens (CYP1A2 *1A)'
                : halfLifeHours >= 6.5
                ? 'Wolny klirens wątrobowy'
                : 'Standardowy klirens (EFSA)'}
            </Text>
          </View>
          <View style={styles.bedtimeStepper}>
            <Pressable
              testID="halflife-dec-btn"
              style={styles.hourBtn}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Krótszy czas półtrwania kofeiny"
              onPress={() => handleHalfLifeChange(halfLifeHours - 0.5)}
            >
              <Text style={styles.hourBtnText}>−</Text>
            </Pressable>
            <Text style={styles.bedtimeHourText}>{halfLifeHours.toFixed(1)}h</Text>
            <Pressable
              testID="halflife-inc-btn"
              style={styles.hourBtn}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Dłuższy czas półtrwania kofeiny"
              onPress={() => handleHalfLifeChange(halfLifeHours + 0.5)}
            >
              <Text style={styles.hourBtnText}>+</Text>
            </Pressable>
          </View>
        </View>

        <View
          style={[
            styles.curfewVerdictBadge,
            bedtimeEval.isSafeForSleep
              ? styles.curfewVerdictSafe
              : styles.curfewVerdictDanger,
          ]}
        >
          <Text style={styles.curfewVerdictText}>
            Poziom kofeiny o {bedtimeHour}:00: {bedtimeEval.totalRemainingMg} mg
          </Text>
        </View>

        <Text style={styles.curfewDescription}>
          {bedtimeEval.messagePl} Próg bezpieczeństwa dla fazy NREM wynosi 25 mg.
        </Text>

        <View style={styles.curfewAdviceBox}>
          <Text style={styles.curfewAdviceLabel}>BEZPIECZNA GODZINA (CURFEW)</Text>
          <Text style={styles.curfewAdviceVal}>
            Ostatni przelew (140 mg) wypij do {curfewTimeString}
          </Text>
        </View>
      </View>

      {/* Historia dzisiejszych dawek */}
      <View style={styles.listHeaderRow}>
        <Text style={styles.listTitle}>Dzisiejsze Porcje Kofeiny</Text>
        <Pressable
          testID="quick-add-caffeine-btn"
          style={styles.quickAddBtn}
          accessibilityRole="button"
          accessibilityLabel="+ Dodaj porcję kofeiny"
          onPress={() => {
            if (!canCreate) {
              setShowPaywall(true);
              return;
            }
            setShowQuickAddModal(true);
          }}
        >
          <Text style={styles.quickAddBtnText}>+ Dodaj</Text>
        </Pressable>
      </View>

      {logs.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Brak zarejestrowanych porcji dzisiaj.</Text>
        </View>
      ) : (
        logs.map((item) => {
          const timeStr = new Date(item.consumedAt).toLocaleTimeString('pl-PL', {
            hour: '2-digit',
            minute: '2-digit',
          });
          return (
            <View key={item.id} style={styles.logItem}>
              <View style={{ flex: 1 }}>
                <Text style={styles.logName}>{item.beverageName}</Text>
                <Text style={styles.logMeta}>
                  {timeStr} · {formatDoseWeight(item.doseGrams, unitSystem)} suszu
                </Text>
              </View>
              <Text style={styles.logMg}>{Math.round(item.caffeineMg)} mg</Text>
              <Pressable
                testID={`delete-caffeine-log-${item.id}`}
                onPress={() => handleDeleteLog(item)}
                style={styles.logDeleteBtn}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={`Usuń wpis kofeiny: ${item.beverageName}`}
              >
                <Text style={styles.logDeleteText}>✕</Text>
              </Pressable>
            </View>
          );
        })
      )}

      {/* Modal szybkiego dodania */}
      <Modal visible={showQuickAddModal} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalCardTitle}>Szybkie dodanie kofeiny</Text>

            <Pressable
              style={styles.quickOption}
              onPress={() => handleQuickAdd('Kawa przelewowa (V60 / Drip)', 'coffee', 18, 140)}
            >
              <Text style={styles.quickOptionName}>Przelew / Drip (V60, Chemex)</Text>
              <Text style={styles.quickOptionMg}>~140 mg ({formatDoseWeight(18, unitSystem)})</Text>
            </Pressable>

            <Pressable
              style={styles.quickOption}
              onPress={() => handleQuickAdd('Podwójne Espresso', 'coffee', 18, 130)}
            >
              <Text style={styles.quickOptionName}>Podwójne Espresso (Doppio)</Text>
              <Text style={styles.quickOptionMg}>~130 mg ({formatDoseWeight(18, unitSystem)})</Text>
            </Pressable>

            <Pressable
              style={styles.quickOption}
              onPress={() => handleQuickAdd('Pojedyncze Espresso', 'coffee', 9, 65)}
            >
              <Text style={styles.quickOptionName}>Pojedyncze Espresso</Text>
              <Text style={styles.quickOptionMg}>~65 mg ({formatDoseWeight(9, unitSystem)})</Text>
            </Pressable>

            <Pressable
              style={styles.quickOption}
              onPress={() => handleQuickAdd('AeroPress', 'coffee', 15, 110)}
            >
              <Text style={styles.quickOptionName}>AeroPress</Text>
              <Text style={styles.quickOptionMg}>~110 mg ({formatDoseWeight(15, unitSystem)})</Text>
            </Pressable>

            <Pressable
              style={styles.quickOption}
              onPress={() => handleQuickAdd('Herbata Gongfu / Liściasta', 'tea', 5, 45)}
            >
              <Text style={styles.quickOptionName}>Herbata liściasta (infuzja)</Text>
              <Text style={styles.quickOptionMg}>~45 mg ({formatDoseWeight(5, unitSystem)})</Text>
            </Pressable>

            <Pressable
              style={styles.modalCancelBtn}
              onPress={() => setShowQuickAddModal(false)}
            >
              <Text style={styles.modalCancelText}>Anuluj</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Apps4Brew Pass Paywall Modal */}
      <Apps4BrewPassModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        onPurchaseSuccess={refresh}
        onSubscribed={refresh}
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
  summaryCard: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.lg,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 16,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textMuted,
    letterSpacing: 0.5,
  },
  activeCaffeineNumber: {
    fontSize: 54,
    fontWeight: '800',
    color: theme.colors.copper,
    marginVertical: 4,
    fontVariant: ['tabular-nums'],
  },
  summarySub: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginBottom: 14,
  },
  efsaProgressBar: {
    width: '100%',
    height: 6,
    backgroundColor: theme.colors.bgCardSecondary,
    borderRadius: 3,
    overflow: 'hidden',
  },
  efsaProgressFill: {
    height: '100%',
  },
  curfewCard: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 20,
  },
  curfewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  curfewTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  bedtimeStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.bgCardSecondary,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  hourBtn: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hourBtnText: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  bedtimeHourText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.copperLight,
  },
  metabolismRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    marginBottom: 10,
  },
  metabolismTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  metabolismSubtitle: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  curfewVerdictBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.sm,
    marginBottom: 10,
  },
  curfewVerdictSafe: {
    backgroundColor: theme.colors.statusPeakMuted,
  },
  curfewVerdictDanger: {
    backgroundColor: theme.colors.dangerMuted,
  },
  curfewVerdictText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  curfewDescription: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  curfewAdviceBox: {
    backgroundColor: theme.colors.bgCardSecondary,
    padding: 12,
    borderRadius: theme.borderRadius.sm,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.copper,
  },
  curfewAdviceLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.textMuted,
    marginBottom: 2,
  },
  curfewAdviceVal: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  quickAddBtn: {
    backgroundColor: theme.colors.copperMuted,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.copper,
  },
  quickAddBtnText: {
    color: theme.colors.copperLight,
    fontWeight: '700',
    fontSize: 12,
  },
  emptyContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: theme.colors.textMuted,
    fontSize: 13,
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.bgCard,
    padding: 14,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 8,
  },
  logName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  logMeta: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  logMg: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.copper,
    marginRight: 12,
  },
  logDeleteBtn: {
    padding: 6,
  },
  logDeleteText: {
    color: theme.colors.textMuted,
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modalCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
  },
  quickOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  quickOptionName: {
    fontSize: 14,
    color: theme.colors.textPrimary,
    fontWeight: '500',
  },
  quickOptionMg: {
    fontSize: 14,
    color: theme.colors.copper,
    fontWeight: '700',
  },
  modalCancelBtn: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCancelText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  readOnlyBanner: {
    backgroundColor: 'rgba(78, 159, 61, 0.12)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.md,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(78, 159, 61, 0.3)',
  },
  readOnlyBannerText: {
    fontSize: 12,
    color: '#2e7d32',
    fontWeight: '600',
    lineHeight: 16,
    textAlign: 'center',
  },
});
