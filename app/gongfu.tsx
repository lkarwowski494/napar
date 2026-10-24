// ============================================================================
// Napar (Steepwise) — Gongfu Cha Multi-Infusion Tracker Screen
// Apps4Brew: 100% Offline-first, Zero login, rytuał wielokrotnych ekstrakcji
// ============================================================================

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  AppState,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import {
  GongfuSession,
  GongfuTeaType,
  createGongfuSession,
  recordGongfuInfusion,
  getRecommendedGongfuSteepSeconds,
} from '../src/core/gongfu-session';
import {
  saveBrewSession,
  logCaffeine,
  deductInventoryWeight,
  getInventoryItems,
  getBrewSessions,
  getCaffeineLogs,
  getRecipes,
  getUnitSystem,
} from '../src/core/database';
import { InventoryItem } from '../src/core/database-schema';
import { theme } from '../src/core/theme';
import { confirmAction } from '../src/core/confirm';
import { announce } from '../src/core/announce';
import { useTranslation } from '../src/core/i18n';
import { useAppAccess } from '../src/core/app-access';
import { Apps4BrewPassModal } from '../src/components/Apps4BrewPassModal';
import { autoBackup } from '../src/core/backup';
import { playTimerChime } from '../src/core/timer-audio';
import { GongfuSessionSetup } from '../src/components/gongfu/GongfuSessionSetup';
import { GongfuActiveInfusion } from '../src/components/gongfu/GongfuActiveInfusion';
import { GongfuInfusionHistory } from '../src/components/gongfu/GongfuInfusionHistory';

export default function GongfuScreen() {
  const router = useRouter();
  const { t, language } = useTranslation();
  const { canCreate, recordBrew, refresh } = useAppAccess();
  const [showPaywall, setShowPaywall] = useState(false);
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
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
    if (!canCreate) {
      setShowPaywall(true);
      return;
    }
    targetEndMsRef.current = Date.now() + targetSeconds * 1000;
    setRemainingSeconds(targetSeconds);
    setSteepFinished(false);
    setIsSteeping(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleAdjustTime = (delta: number) => {
    const updated = Math.max(3, targetSeconds + delta);
    setTargetSeconds(updated);
    setRemainingSeconds(updated);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleRecordCurrentInfusion = () => {
    targetEndMsRef.current = null;
    const actualSteep = targetSeconds - remainingSeconds > 0 ? targetSeconds - remainingSeconds : targetSeconds;
    const updated = recordGongfuInfusion(session, {
      durationSeconds: actualSteep,
      waterTempCelsius: parseFloat(waterTempCelsius) || 96,
      tasteRating: currentRating,
      notes: currentNotes.trim() || undefined,
    });
    setSession(updated);
    setCurrentNotes('');
    setSteepFinished(false);

    const nextRec = getRecommendedGongfuSteepSeconds(teaType, updated.infusions.length + 1);
    setTargetSeconds(nextRec);
    setRemainingSeconds(nextRec);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleFinishAndSaveSession = () => {
    if (!canCreate) {
      setShowPaywall(true);
      return;
    }
    if (session.infusions.length === 0) {
      Alert.alert(t.gongfu.modeTitle, 'Przeprowadź przynajmniej jedno zalanie przed zapisem sesji.');
      return;
    }

    confirmAction({
      title: t.gongfu.finishSession,
      message: `Zapisujesz sesję ${teaName} z ${session.infusions.length} zalaniami (łącznie ~${session.totalCaffeineMg} mg kofeiny).`,
      actionText: t.common.save,
      onConfirm: () => {
        const doseNum = parseFloat(leafDoseGrams) || 7;
        const totalDuration = session.infusions.reduce((sum, inf) => sum + inf.durationSeconds, 0);

        // Zapis do brew_sessions
        saveBrewSession({
          id: session.id,
          inventoryItemId: selectedInventoryId || undefined,
          inventoryItemName: teaName,
          beverageType: 'TEA',
          method: 'GONGFU',
          doseGrams: doseNum,
          waterGrams: session.vesselCapacityMl,
          waterTempCelsius: parseFloat(waterTempCelsius) || 96,
          totalTimeSeconds: totalDuration,
          rating: 5,
          flavorTags: ['Gongfu Cha', `${session.infusions.length} infuzji`],
          tasteBalance: 'balanced',
          caffeineContentMg: session.totalCaffeineMg,
          notes: `Sesja Gongfu Cha: ${session.infusions.length} zalań. ${session.infusions
            .map((inf) => `#${inf.infusionNumber}: ${inf.durationSeconds}s${inf.notes ? ` (${inf.notes})` : ''}`)
            .join('; ')}`,
          infusionNumber: session.infusions.length,
          brewedAt: new Date().toISOString(),
        });

        // Log kofeiny
        logCaffeine({
          id: `caff-${Date.now()}`,
          brewSessionId: session.id,
          beverageName: `${teaName} (Gongfu Cha)`,
          beverageType: 'tea',
          consumedAt: new Date().toISOString(),
          doseGrams: doseNum,
          caffeineMg: session.totalCaffeineMg,
        });

        // Odliczenie gramatury ze spiżarni
        if (selectedInventoryId) {
          deductInventoryWeight(selectedInventoryId, doseNum);
        }

        recordBrew();
        try {
          void autoBackup({
            inventory: getInventoryItems(true),
            customRecipes: getRecipes().filter((r) => r.isCustom),
            sessions: getBrewSessions(5000),
            caffeineLogs: getCaffeineLogs(),
          });
        } catch {
          // fallback
        }
        announce(t.gongfu.finishSession);
        router.back();
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={styles.closeBtn}
          accessibilityRole="button"
          accessibilityLabel={t.common.close}
        >
          <Text style={styles.closeBtnText}>{t.common.close}</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{t.gongfu.modeTitle}</Text>
        <Pressable onPress={handleFinishAndSaveSession} hitSlop={8} style={styles.finishBtn}>
          <Text style={styles.finishBtnText}>{t.common.save}</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <GongfuSessionSetup
          teaType={teaType}
          onSelectTeaType={setTeaType}
          teaName={teaName}
          onChangeTeaName={setTeaName}
          leafDoseGrams={leafDoseGrams}
          onChangeLeafDose={setLeafDoseGrams}
          vesselCapacityMl={vesselCapacityMl}
          onChangeVesselCapacity={setVesselCapacityMl}
          waterTempCelsius={waterTempCelsius}
          onChangeWaterTemp={setWaterTempCelsius}
          unitSystem={unitSystem}
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
          currentNotes={currentNotes}
          onChangeCurrentNotes={setCurrentNotes}
          onRecordCurrentInfusion={handleRecordCurrentInfusion}
          t={t}
        />

        <GongfuInfusionHistory
          session={session}
          nextInfusionNum={nextInfusionNum}
          leafDoseGrams={leafDoseGrams}
          t={t}
        />
      </ScrollView>
      <Apps4BrewPassModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        onPurchaseSuccess={refresh}
        onSubscribed={refresh}
      />
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
  closeBtn: {
    padding: 4,
    minHeight: 48,
    minWidth: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  finishBtn: {
    backgroundColor: theme.colors.emerald,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    minHeight: 48,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  finishBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
});
