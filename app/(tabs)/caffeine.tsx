// ============================================================================
// Napar — Monitor Kofeiny i Kalkulator Snu (Caffeine & Sleep Curfew)
// Kinetyka eliminacji (t1/2), szacunek kofeiny o porze snu (bez progu, DEC-05 a) i dobowy bilans EFSA
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
} from '../../src/data/database';
import { CaffeineLog } from '../../src/core/database-schema';
import {
  calculateRemainingCaffeineMg,
  estimateBedtimeCaffeineMg,
  clampCaffeineHalfLifeHours,
} from '../../src/core/domain-rules';
import { CaffeineCurveChart } from '../../src/core/caffeine-chart';
import { theme } from '../../src/core/theme';
import { useTranslation } from '../../src/core/i18n';
import { BedtimeCurfewCard } from '../../src/components/caffeine/BedtimeCurfewCard';
import { CaffeineLogList } from '../../src/components/caffeine/CaffeineLogList';
import { CaffeineQuickAddModal } from '../../src/components/caffeine/CaffeineQuickAddModal';
import { runSave } from '../../lib/save-feedback';
import { announce } from '../../src/platform/announce';

export default function CaffeineScreen() {
  const { t, language } = useTranslation();
  const unitSystem = getUnitSystem();
  const [logs, setLogs] = useState<CaffeineLog[]>([]);
  const [bedtimeHour, setBedtimeHourState] = useState(() => {
    try {
      return getBedtimeHour();
    } catch (err) {
      // fallback to default bedtime
      return 23;
    }
  });
  const [halfLifeHours, setHalfLifeHoursState] = useState(() => {
    try {
      return getCaffeineHalfLife();
    } catch (err) {
      // fallback to default half-life
      return 5.0;
    }
  });
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);

  const handleBedtimeChange = (newHour: number) => {
    const prev = bedtimeHour;
    const clamped = Math.max(18, Math.min(28, newHour));
    setBedtimeHourState(clamped);
    try {
      setBedtimeHour(clamped);
    } catch (err) {
      // silent persistence rollback
      setBedtimeHourState(prev);
    }
  };

  const handleHalfLifeChange = (newHours: number) => {
    const prev = halfLifeHours;
    const clamped = clampCaffeineHalfLifeHours(newHours);
    setHalfLifeHoursState(clamped);
    try {
      setCaffeineHalfLife(clamped);
    } catch (err) {
      // silent persistence rollback
      setHalfLifeHoursState(prev);
    }
  };

  const loadLogs = () => {
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const data = getCaffeineLogs(todayStart.toISOString());
      setLogs(data);
    } catch (err) {
      // fallback to empty logs
      setLogs([]);
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

  const bedtimeMg = estimateBedtimeCaffeineMg(intakesForEvaluation, halfLifeHours);

  const handleQuickAdd = (name: string, type: 'coffee' | 'tea', doseG: number, mg: number) => {
    const consumedAt = new Date().toISOString();
    const log: CaffeineLog = {
      id: `caff-${Date.now()}`,
      beverageName: name,
      beverageType: type,
      consumedAt,
      doseGrams: doseG,
      caffeineMg: mg,
    };
    if (!runSave(() => logCaffeine(log), t.common)) return;

    loadLogs();
    setShowQuickAddModal(false);
  };

  const handleDeleteLog = (log: CaffeineLog) => {
    if (!runSave(() => deleteCaffeineLog(log.id), t.common)) return;
    loadLogs();
  };

  const overLimit = totalConsumedTodayMg > 400;
  const [wasOverLimit, setWasOverLimit] = useState(overLimit);
  useEffect(() => {
    // Zapowiedź VoiceOver tylko przy przejściu przez próg (nie przy każdym renderze)
    if (overLimit && !wasOverLimit) announce(t.caffeine.overLimitWarning);
    if (overLimit !== wasOverLimit) setWasOverLimit(overLimit);
  }, [overLimit, wasOverLimit, t.caffeine.overLimitWarning]);

  return (
    <ScrollView testID="ekran:(tabs)/caffeine" style={styles.container} contentContainerStyle={styles.content}>
      {/* Karta Stężenia Kofeiny Teraz */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>
          {t.caffeine.activeCaffeineTitle || (language === 'pl' ? 'AKTYWNA KOFEINA W KRWIOBIEGU' : 'ACTIVE CAFFEINE IN BLOODSTREAM')}
        </Text>
        <Text style={styles.activeCaffeineNumber}>
          {Math.round(currentTotalMg)} mg
        </Text>
        <Text style={styles.summarySub}>
          {(t.caffeine.dailyTotalLabel || (language === 'pl' ? 'Dobowy bilans: {current} mg / {max} mg (EFSA 2015)' : 'Daily total: {current} mg / {max} mg (EFSA 2015)'))
            .replace('{current}', String(Math.round(totalConsumedTodayMg)))
            .replace('{max}', '400')}
        </Text>
        <Text style={styles.efsaNoteText}>
          {t.caffeine.efsaDisclaimer}
        </Text>

        {/* M1-audytor-generalny-031 (04-studio-projektowe-009): przekroczenie nie tylko kolorem paska */}
        {overLimit && (
          <Text
            testID="caffeine-over-limit"
            style={styles.overLimitText}
            accessibilityRole="alert"
            accessibilityLabel={t.caffeine.overLimitWarning}
          >
            {`⚠ ${t.caffeine.overLimitWarning}`}
          </Text>
        )}

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
        halfLifeHours={halfLifeHours}
      />

      {/* Szacunek kofeiny o porze snu (bez progu i oceny) */}
      <BedtimeCurfewCard
        bedtimeHour={bedtimeHour}
        onBedtimeChange={handleBedtimeChange}
        halfLifeHours={halfLifeHours}
        onHalfLifeChange={handleHalfLifeChange}
        bedtimeMg={bedtimeMg}
      />

      {/* Historia dzisiejszych dawek */}
      <CaffeineLogList
        logs={logs}
        unitSystem={unitSystem}
        onQuickAddPress={() => {
          setShowQuickAddModal(true);
        }}
        onDeleteLog={handleDeleteLog}
      />

      {/* Modal szybkiego dodania */}
      <CaffeineQuickAddModal
        visible={showQuickAddModal}
        unitSystem={unitSystem}
        language={language}
        onClose={() => setShowQuickAddModal(false)}
        onSelectOption={handleQuickAdd}
      />

      {/* Zastrzeżenie medyczne i źródła (App Store 1.4.1 / EFSA 2015) */}
      <View style={styles.disclaimerCard}>
        <Text style={styles.disclaimerTitle}>{t.caffeine.disclaimerTitle}</Text>
        <Text style={styles.disclaimerText}>{t.caffeine.disclaimerText}</Text>
      </View>
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
    marginBottom: 6,
  },
  efsaNoteText: {
    color: theme.colors.textMuted,
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 14,
    textAlign: 'center',
  },
  disclaimerCard: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginTop: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  disclaimerTitle: {
    color: theme.colors.copper,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  disclaimerText: {
    color: theme.colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
  },
  overLimitText: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.danger,
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
});
