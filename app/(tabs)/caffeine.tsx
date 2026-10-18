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
import { BedtimeCurfewCard } from '../../src/components/caffeine/BedtimeCurfewCard';
import { CaffeineLogList } from '../../src/components/caffeine/CaffeineLogList';
import { CaffeineQuickAddModal } from '../../src/components/caffeine/CaffeineQuickAddModal';

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
      <BedtimeCurfewCard
        bedtimeHour={bedtimeHour}
        onBedtimeChange={handleBedtimeChange}
        halfLifeHours={halfLifeHours}
        onHalfLifeChange={handleHalfLifeChange}
        bedtimeEval={bedtimeEval}
        curfewTimeString={curfewTimeString}
      />

      {/* Historia dzisiejszych dawek */}
      <CaffeineLogList
        logs={logs}
        unitSystem={unitSystem}
        onQuickAddPress={() => {
          if (!canCreate) {
            setShowPaywall(true);
            return;
          }
          setShowQuickAddModal(true);
        }}
        onDeleteLog={handleDeleteLog}
      />

      {/* Modal szybkiego dodania */}
      <CaffeineQuickAddModal
        visible={showQuickAddModal}
        unitSystem={unitSystem}
        onClose={() => setShowQuickAddModal(false)}
        onSelectOption={handleQuickAdd}
      />

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
