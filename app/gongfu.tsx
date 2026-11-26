// ============================================================================
// Napar — Gongfu Cha Multi-Infusion Tracker Screen
// Apps4Brew: 100% Offline-first, Zero login, rytuał wielokrotnych ekstrakcji
// ============================================================================

import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  ScrollView,
  Alert,
  AppState,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import {
  GongfuSession,
  GongfuTeaType,
  createGongfuSession,
  recordGongfuInfusion,
  getRecommendedGongfuSteepSeconds,
  estimateTotalLeafCaffeineMg,
} from '../src/core/gongfu-session';
import { estimateTeaInfusionCaffeineMg } from '../src/core/domain-rules';
import {
  recordBrewSessionTransaction,
  getInventoryItems,
  getUnitSystem,
  buildBackupState,
} from '../src/data/database';
import { InventoryItem, BrewSession, CaffeineLog } from '../src/core/database-schema';
import { theme } from '../src/core/theme';
import { confirmAction } from '../src/platform/confirm';
import { announce } from '../src/platform/announce';
import { useTranslation, formatTemplate } from '../src/core/i18n';
import { autoBackup } from '../src/data/backup';
import { playTimerChime } from '../src/platform/timer-audio';
import { signalHaptic } from '../src/platform/signals';
import { GongfuSessionSetup } from '../src/components/gongfu/GongfuSessionSetup';
import { GongfuActiveInfusion } from '../src/components/gongfu/GongfuActiveInfusion';
import { GongfuInfusionHistory } from '../src/components/gongfu/GongfuInfusionHistory';
import { runSave } from '../lib/save-feedback';
import { ModalHeader } from '../src/components/ui';

export default function GongfuScreen() {
  const router = useRouter();
  const { t, language } = useTranslation();
  const unitSystem = getUnitSystem();

  // Stan sesji
  const [teaType, setTeaType] = useState<GongfuTeaType>('wulong_rock');
  const [teaName, setTeaName] = useState('Da Hong Pao (Wulong)');
  const [leafDoseGrams, setLeafDoseGrams] = useState('7.0');
  const [vesselCapacityMl, setVesselCapacityMl] = useState('110');
  const [waterTempCelsius, setWaterTempCelsius] = useState('96');
  const [inventoryList, setInventoryList] = useState<InventoryItem[]>([]);
  const [selectedInventoryId, setSelectedInventoryId] = useState<string | null>(null);

  const [session, setSession] = useState<GongfuSession>(() =>
    createGongfuSession({
      teaName: 'Da Hong Pao (Wulong)',
      teaType: 'wulong_rock',
      leafDoseGrams: 7.0,
      vesselCapacityMl: 110,
      waterTempCelsius: 96,
    })
  );

  // Stan aktywnego odliczania
  const nextInfusionNum = session.infusions.length + 1;
  const recommendedTime = getRecommendedGongfuSteepSeconds(teaType, nextInfusionNum);
  const [targetSeconds, setTargetSeconds] = useState<number>(recommendedTime);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(recommendedTime);
  const [isSteeping, setIsSteeping] = useState<boolean>(false);
  const [steepFinished, setSteepFinished] = useState<boolean>(false);
  const [currentNotes, setCurrentNotes] = useState<string>('');
  const [currentRating, setCurrentRating] = useState<number>(5);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const pausedLeftMsRef = useRef<number | null>(null);
  const endedEarlySecondsRef = useRef<number | null>(null);
  const targetEndMsRef = useRef<number | null>(null);

  // Wczytanie spiżarni herbat
  useEffect(() => {
    try {
      const items = getInventoryItems();
      const teas = items.filter((i) => i.type === 'tea');
      setInventoryList(teas);
      if (teas.length > 0 && !selectedInventoryId) {
        setSelectedInventoryId(teas[0].id);
        setTeaName(teas[0].name);
      }
    } catch {
      // fallback
    }
  }, []);

  // Aktualizacja domyślnego czasu przy zmianie typu herbaty lub zalania
  useEffect(() => {
    const rec = getRecommendedGongfuSteepSeconds(teaType, nextInfusionNum);
    setTargetSeconds(rec);
    setRemainingSeconds(rec);
  }, [teaType, nextInfusionNum]);

  // Keep Awake w trakcie aktywnego parzenia
  useEffect(() => {
    if (isSteeping) {
      void activateKeepAwakeAsync();
    } else {
      void deactivateKeepAwake();
    }
    return () => {
      void deactivateKeepAwake();
    };
  }, [isSteeping]);

  // Odliczanie stopera z zegarem delta Date.now() i nasłuchem AppState (M1-audytor-generalny-025)
  useEffect(() => {
    if (!isSteeping) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const updateTimer = () => {
      if (!targetEndMsRef.current) return;
      const left = Math.max(0, Math.ceil((targetEndMsRef.current - Date.now()) / 1000));
      setRemainingSeconds(left);
      if (left <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        targetEndMsRef.current = null;
        setIsSteeping(false);
        setSteepFinished(true);
        signalHaptic('success');
        void playTimerChime();
        announce(t.gongfu.pourNow);
      }
    };

    updateTimer();
    timerRef.current = setInterval(updateTimer, 250);

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        updateTimer();
      }
    });

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      subscription.remove();
    };
  }, [isSteeping, t.gongfu.pourNow]);

  const handleStartSteep = () => {
    targetEndMsRef.current = Date.now() + targetSeconds * 1000;
    setRemainingSeconds(targetSeconds);
    setSteepFinished(false);
    setIsSteeping(true);
    signalHaptic('medium');
  };

  // M1-audytor-generalny-026: wstrzymanie, wznowienie i zakończenie trwającej infuzji (test planu: wstrzymać i wznowić).
  // Czas liczony w ms z zegara delta; zakończenie przed czasem zapisuje rzeczywisty czas (min. 1 s), nie pełny cel.
  const handlePauseSteep = () => {
    const end = targetEndMsRef.current;
    const leftMs = end ? Math.max(0, end - Date.now()) : remainingSeconds * 1000;
    pausedLeftMsRef.current = leftMs;
    targetEndMsRef.current = null;
    if (timerRef.current) clearInterval(timerRef.current);
    setRemainingSeconds(Math.ceil(leftMs / 1000));
    setIsSteeping(false);
    setIsPaused(true);
  };

  const handleResumeSteep = () => {
    const leftMs = pausedLeftMsRef.current ?? remainingSeconds * 1000;
    pausedLeftMsRef.current = null;
    targetEndMsRef.current = Date.now() + leftMs;
    setIsPaused(false);
    setIsSteeping(true);
  };

  const handleEndSteep = () => {
    const leftMs = pausedLeftMsRef.current ?? remainingSeconds * 1000;
    pausedLeftMsRef.current = null;
    endedEarlySecondsRef.current = Math.max(1, Math.round((targetSeconds * 1000 - leftMs) / 1000));
    setIsPaused(false);
    setSteepFinished(true);
  };

  const handleAdjustTime = (delta: number) => {
    const updated = Math.max(3, targetSeconds + delta);
    setTargetSeconds(updated);
    if (isPaused) {
      const baseLeftMs = pausedLeftMsRef.current ?? remainingSeconds * 1000;
      const nextLeftMs = Math.max(1000, baseLeftMs + delta * 1000);
      pausedLeftMsRef.current = nextLeftMs;
      setRemainingSeconds(Math.ceil(nextLeftMs / 1000));
    } else if (isSteeping && targetEndMsRef.current) {
      targetEndMsRef.current = Math.max(Date.now() + 1000, targetEndMsRef.current + delta * 1000);
      setRemainingSeconds(Math.max(1, Math.ceil((targetEndMsRef.current - Date.now()) / 1000)));
    } else {
      setRemainingSeconds(updated);
    }
    signalHaptic('light');
  };

  const parsePositiveNumber = (raw: string): number => {
    const n = parseFloat(raw.replace(',', '.'));
    return Number.isFinite(n) && n > 0 ? n : NaN;
  };

  // M1-audytor-generalny-005: edycja parametrów w GongfuSessionSetup synchronizuje obiekt session
  // (w tym przeliczenie kofeiny dla już zapisanych infuzji), żeby podgląd i zapis do SQLite były spójne.
  const handleSelectTeaType = (nextType: GongfuTeaType) => {
    setTeaType(nextType);
    setSession((prev) => ({ ...prev, teaType: nextType, updatedAt: new Date().toISOString() }));
  };

  const handleChangeTeaName = (nextName: string) => {
    setTeaName(nextName);
    setSession((prev) => ({ ...prev, teaName: nextName, updatedAt: new Date().toISOString() }));
  };

  const handleChangeLeafDose = (nextDose: string) => {
    setLeafDoseGrams(nextDose);
    const parsed = parsePositiveNumber(nextDose);
    if (!Number.isNaN(parsed)) {
      setSession((prev) => {
        const totalLeafCaffeine = estimateTotalLeafCaffeineMg(parsed);
        const recalculatedInfusions = prev.infusions.map((inf) => ({
          ...inf,
          caffeineMg: estimateTeaInfusionCaffeineMg(totalLeafCaffeine, inf.infusionNumber),
        }));
        const totalCaffeineMg = Number(
          recalculatedInfusions.reduce((sum, inf) => sum + inf.caffeineMg, 0).toFixed(1)
        );
        return {
          ...prev,
          leafDoseGrams: parsed,
          infusions: recalculatedInfusions,
          totalCaffeineMg,
          updatedAt: new Date().toISOString(),
        };
      });
    }
  };

  const handleChangeVesselCapacity = (nextVessel: string) => {
    setVesselCapacityMl(nextVessel);
    const parsed = parsePositiveNumber(nextVessel);
    if (!Number.isNaN(parsed)) {
      setSession((prev) => ({
        ...prev,
        vesselCapacityMl: parsed,
        infusions: prev.infusions.map((inf) => ({ ...inf, waterGrams: parsed })),
        updatedAt: new Date().toISOString(),
      }));
    }
  };

  const handleChangeWaterTemp = (nextTemp: string) => {
    setWaterTempCelsius(nextTemp);
    const parsed = parsePositiveNumber(nextTemp);
    if (!Number.isNaN(parsed)) {
      setSession((prev) => ({ ...prev, waterTempCelsius: parsed, updatedAt: new Date().toISOString() }));
    }
  };

  const handleRecordCurrentInfusion = () => {
    targetEndMsRef.current = null;
    const early = endedEarlySecondsRef.current;
    endedEarlySecondsRef.current = null;
    const actualSteep = early ?? (targetSeconds - remainingSeconds > 0 ? targetSeconds - remainingSeconds : targetSeconds);
    const parsedDose = parsePositiveNumber(leafDoseGrams);
    const parsedVessel = parsePositiveNumber(vesselCapacityMl);
    const parsedTemp = parsePositiveNumber(waterTempCelsius);
    const syncedSession: GongfuSession = {
      ...session,
      leafDoseGrams: Number.isNaN(parsedDose) ? session.leafDoseGrams : parsedDose,
      vesselCapacityMl: Number.isNaN(parsedVessel) ? session.vesselCapacityMl : parsedVessel,
      waterTempCelsius: Number.isNaN(parsedTemp) ? session.waterTempCelsius : parsedTemp,
    };
    const updated = recordGongfuInfusion(syncedSession, {
      durationSeconds: actualSteep,
      waterTempCelsius: Number.isNaN(parsedTemp) ? syncedSession.waterTempCelsius : parsedTemp,
      tasteRating: currentRating,
      notes: currentNotes.trim() || undefined,
    });
    setSession(updated);
    setCurrentNotes('');
    setSteepFinished(false);

    const nextRec = getRecommendedGongfuSteepSeconds(teaType, updated.infusions.length + 1);
    setTargetSeconds(nextRec);
    setRemainingSeconds(nextRec);
    signalHaptic('light');
  };

  const handleFinishAndSaveSession = () => {
    if (session.infusions.length === 0) {
      Alert.alert(t.gongfu.modeTitle, t.gongfu.minOneInfusionMsg);
      return;
    }

    confirmAction({
      title: t.gongfu.finishSession,
      message: formatTemplate(t.gongfu.finishSessionMsg, { tea: teaName, count: session.infusions.length, mg: session.totalCaffeineMg }),
      actionText: t.common.save,
      onConfirm: () => {
        // M1-audytor-generalny-008: zła liczba blokuje zapis (DataValidationError → komunikat w runSave), bez 7 g / 96 °C.
        const doseNum = parseFloat(leafDoseGrams.replace(',', '.'));
        const vesselNum = parseFloat(vesselCapacityMl.replace(',', '.'));
        const totalDuration = session.infusions.reduce((sum, inf) => sum + inf.durationSeconds, 0);

        // M1-audytor-generalny-007: sesja, log kofeiny i odliczenie wagi w jednej transakcji; błąd = komunikat, ekran zostaje.
        const gongfuSession: BrewSession = {
          id: session.id,
          inventoryItemId: selectedInventoryId || undefined,
          inventoryItemName: teaName,
          beverageType: 'TEA',
          method: 'GONGFU',
          doseGrams: doseNum,
          waterGrams: vesselNum,
          waterTempCelsius: parseFloat(waterTempCelsius.replace(',', '.')),
          totalTimeSeconds: totalDuration,
          flavorTags: ['Gongfu Cha', formatTemplate(t.gongfu.infusionCountTag, { count: session.infusions.length })],
          caffeineContentMg: session.totalCaffeineMg,
          notes: formatTemplate(t.gongfu.sessionNotes, {
            count: session.infusions.length,
            details: session.infusions
              .map((inf) => `#${inf.infusionNumber}: ${inf.durationSeconds}s${inf.notes ? ` (${inf.notes})` : ''}`)
              .join('; '),
          }),
          infusionNumber: session.infusions.length,
          brewedAt: new Date().toISOString(),
        };
        const gongfuCaffeineLog: CaffeineLog = {
          id: `caff-${Date.now()}`,
          brewSessionId: session.id,
          beverageName: `${teaName} (Gongfu Cha)`,
          beverageType: 'tea',
          consumedAt: new Date().toISOString(),
          doseGrams: doseNum,
          caffeineMg: session.totalCaffeineMg,
        };
        const saved = runSave(
          () =>
            recordBrewSessionTransaction(
              gongfuSession,
              selectedInventoryId ? { itemId: selectedInventoryId, doseGrams: doseNum } : undefined,
              gongfuCaffeineLog
            ),
          t.common
        );
        if (!saved) return;

        try {
          void autoBackup(buildBackupState());
        } catch {
          // fallback
        }
        announce(t.gongfu.finishSession);
        router.back();
      },
    });
  };

  return (
    <SafeAreaView testID="ekran:gongfu" style={styles.safeArea}>
      <ModalHeader
        onClose={() => router.back()}
        closeLabel={t.common.close}
        title={t.gongfu.modeTitle}
        onSave={handleFinishAndSaveSession}
        saveLabel={t.common.save}
        style={styles.header}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <GongfuSessionSetup
          teaType={teaType}
          onSelectTeaType={handleSelectTeaType}
          teaName={teaName}
          onChangeTeaName={handleChangeTeaName}
          leafDoseGrams={leafDoseGrams}
          onChangeLeafDose={handleChangeLeafDose}
          vesselCapacityMl={vesselCapacityMl}
          onChangeVesselCapacity={handleChangeVesselCapacity}
          waterTempCelsius={waterTempCelsius}
          onChangeWaterTemp={handleChangeWaterTemp}
          unitSystem={unitSystem}
          language={language}
          t={t}
        />

        <GongfuActiveInfusion
          nextInfusionNum={nextInfusionNum}
          remainingSeconds={remainingSeconds}
          targetSeconds={targetSeconds}
          isSteeping={isSteeping}
          steepFinished={steepFinished}
          onAdjustTime={handleAdjustTime}
          onStartSteep={handleStartSteep}
          isPaused={isPaused}
          onPauseSteep={handlePauseSteep}
          onResumeSteep={handleResumeSteep}
          onEndSteep={handleEndSteep}
          currentNotes={currentNotes}
          onChangeCurrentNotes={setCurrentNotes}
          onRecordCurrentInfusion={handleRecordCurrentInfusion}
          t={t}
        />

        <GongfuInfusionHistory
          session={session}
          nextInfusionNum={nextInfusionNum}
          leafDoseGrams={leafDoseGrams}
          language={language}
          t={t}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.bgCard,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
});
