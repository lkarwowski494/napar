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
  TextInput,
  Alert,
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
  estimateTotalLeafCaffeineMg,
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

  // Aktualizacja rekomendowanego czasu przy zmianie numeru infuzji lub typu herbaty
  useEffect(() => {
    if (!isSteeping && !steepFinished) {
      const rec = getRecommendedGongfuSteepSeconds(teaType, nextInfusionNum);
      setTargetSeconds(rec);
      setRemainingSeconds(rec);
    }
  }, [nextInfusionNum, teaType, isSteeping, steepFinished]);

  // Cykl timera z keep-awake i haptyką
  useEffect(() => {
    if (isSteeping) {
      activateKeepAwakeAsync();
      timerRef.current = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsSteeping(false);
            setSteepFinished(true);
            deactivateKeepAwake();
            try {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch {
              // fallback
            }
            void playTimerChime();
            announce(t.gongfu.pourNow);
            return 0;
          }
          if (prev <= 4) {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            } catch {
              // fallback
            }
            if (prev === 4) {
              void playTimerChime();
            }
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      deactivateKeepAwake();
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      deactivateKeepAwake();
    };
  }, [isSteeping]);

  const handleStartSteep = () => {
    if (!canCreate) {
      setShowPaywall(true);
      return;
    }
    setIsSteeping(true);
    setSteepFinished(false);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // fallback
    }
    announce(`${t.gongfu.startSteep} — ${remainingSeconds}s`);
  };

  const handleRecordCurrentInfusion = () => {
    const updated = recordGongfuInfusion(session, {
      durationSeconds: targetSeconds,
      tasteRating: currentRating,
      notes: currentNotes.trim() || undefined,
    });
    setSession(updated);
    setSteepFinished(false);
    setCurrentNotes('');

    const nextRec = getRecommendedGongfuSteepSeconds(teaType, updated.infusions.length + 1);
    setTargetSeconds(nextRec);
    setRemainingSeconds(nextRec);

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // fallback
    }
    announce(`${t.gongfu.nextInfusion} ${updated.infusions.length + 1}`);
  };

  const handleAdjustTime = (delta: number) => {
    if (isSteeping) return;
    setTargetSeconds((prev) => {
      const newTarget = Math.max(5, prev + delta);
      setRemainingSeconds(newTarget);
      return newTarget;
    });
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
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.closeBtn}>
          <Text style={styles.closeBtnText}>✕ {t.common.close}</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{t.gongfu.modeTitle}</Text>
        <Pressable onPress={handleFinishAndSaveSession} hitSlop={8} style={styles.finishBtn}>
          <Text style={styles.finishBtnText}>{t.common.save}</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Wybór rodzaju herbaty */}
        <View style={styles.teaTypeRow}>
          {(
            [
              { id: 'wulong_rock', label: 'Wulong Skalny' },
              { id: 'puerh_sheng', label: 'Sheng Puerh' },
              { id: 'puerh_shou', label: 'Shou Puerh' },
              { id: 'white', label: 'Biała' },
              { id: 'black', label: 'Czarna' },
            ] as const
          ).map((item) => (
            <Pressable
              key={item.id}
              style={[styles.teaTypeChip, teaType === item.id && styles.teaTypeChipActive]}
              onPress={() => setTeaType(item.id)}
            >
              <Text
                style={[
                  styles.teaTypeChipText,
                  teaType === item.id && styles.teaTypeChipTextActive,
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Karta Parametrów Liścia */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>{t.gongfu.modeDesc}</Text>
          <TextInput
            style={styles.teaNameInput}
            value={teaName}
            onChangeText={setTeaName}
            placeholder="Nazwa herbaty..."
            placeholderTextColor={theme.colors.textMuted}
          />

          <View style={styles.paramsRow}>
            <View style={styles.paramBox}>
              <Text style={styles.paramSub}>{t.gongfu.leafDose}</Text>
              <TextInput
                style={styles.paramInput}
                value={leafDoseGrams}
                onChangeText={setLeafDoseGrams}
                keyboardType="decimal-pad"
              />
              <Text style={styles.unitText}>{unitSystem === 'imperial' ? 'oz' : 'g'}</Text>
            </View>
            <View style={styles.paramBox}>
              <Text style={styles.paramSub}>{t.gongfu.vesselCapacity}</Text>
              <TextInput
                style={styles.paramInput}
                value={vesselCapacityMl}
                onChangeText={setVesselCapacityMl}
                keyboardType="number-pad"
              />
              <Text style={styles.unitText}>{unitSystem === 'imperial' ? 'fl oz' : 'ml'}</Text>
            </View>
            <View style={styles.paramBox}>
              <Text style={styles.paramSub}>{t.gongfu.waterTemp}</Text>
              <TextInput
                style={styles.paramInput}
                value={waterTempCelsius}
                onChangeText={setWaterTempCelsius}
                keyboardType="number-pad"
              />
              <Text style={styles.unitText}>{unitSystem === 'imperial' ? '°F' : '°C'}</Text>
            </View>
          </View>
        </View>

        {/* Centrum Aktywnej Infuzji */}
        <View style={styles.timerCard}>
          <Text style={styles.infusionBadge}>
            {t.gongfu.infusionNumber} #{nextInfusionNum}
          </Text>

          <Text style={styles.timerCountdown}>
            {remainingSeconds < 10 ? `0${remainingSeconds}` : remainingSeconds}
            <Text style={styles.secondsUnit}>s</Text>
          </Text>

          {/* Przyciski korekty czasu +/- 5s */}
          <View style={styles.adjustRow}>
            <Pressable
              style={styles.adjustBtn}
              onPress={() => handleAdjustTime(-5)}
              disabled={isSteeping}
            >
              <Text style={styles.adjustBtnText}>{t.gongfu.subSeconds}</Text>
            </Pressable>
            <Text style={styles.targetLabel}>
              {isSteeping ? 'Trwa parzenie...' : `Cel: ${targetSeconds}s`}
            </Text>
            <Pressable
              style={styles.adjustBtn}
              onPress={() => handleAdjustTime(5)}
              disabled={isSteeping}
            >
              <Text style={styles.adjustBtnText}>{t.gongfu.addSeconds}</Text>
            </Pressable>
          </View>

          {/* Główny Przycisk Parzenia */}
          {!isSteeping && !steepFinished && (
            <Pressable testID="gongfu-start-btn" style={styles.startBtn} onPress={handleStartSteep}>
              <Text style={styles.startBtnText}>{t.gongfu.startSteep}</Text>
            </Pressable>
          )}

          {isSteeping && (
            <View style={styles.steepingActiveBox}>
              <Text style={styles.steepingActiveText}>PARZENIE W TOKU</Text>
            </View>
          )}

          {/* Panel po zakończeniu zalania */}
          {steepFinished && (
            <View style={styles.finishedInfusionPanel}>
              <Text style={styles.pourAlertText}>{t.gongfu.pourNow}</Text>
              <TextInput
                style={styles.notesInput}
                value={currentNotes}
                onChangeText={setCurrentNotes}
                placeholder={t.gongfu.infusionNotesPlaceholder}
                placeholderTextColor={theme.colors.textMuted}
              />
              <Pressable
                style={styles.recordNextBtn}
                onPress={handleRecordCurrentInfusion}
              >
                <Text style={styles.recordNextBtnText}>{t.gongfu.nextInfusion}</Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Karta Kofeiny Sesji */}
        <View style={styles.caffeineCard}>
          <View style={styles.caffeineRow}>
            <Text style={styles.caffeineTitle}>{t.gongfu.totalCaffeine}</Text>
            <Text style={styles.caffeineValue}>~{session.totalCaffeineMg} mg</Text>
          </View>
          <Text style={styles.caffeineSub}>
            Zalanie #{nextInfusionNum} dostarczy ok.{' '}
            {estimateTotalLeafCaffeineMg(parseFloat(leafDoseGrams) || 7) > 0
              ? (
                  estimateTotalLeafCaffeineMg(parseFloat(leafDoseGrams) || 7) *
                  (nextInfusionNum === 1
                    ? 0.45
                    : nextInfusionNum === 2
                    ? 0.3
                    : nextInfusionNum === 3
                    ? 0.15
                    : 0.05)
                ).toFixed(1)
              : 0}{' '}
            mg (model kinetyki RD-19).
          </Text>
        </View>

        {/* Historia Zalań Sesji */}
        {session.infusions.length > 0 && (
          <View style={styles.historyCard}>
            <Text style={styles.historyTitle}>
              {t.gongfu.sessionHistory} ({session.infusions.length})
            </Text>
            {session.infusions.map((inf) => (
              <View key={inf.infusionNumber} style={styles.historyItem}>
                <View style={styles.historyItemHeader}>
                  <Text style={styles.historyNumber}>#{inf.infusionNumber}</Text>
                  <Text style={styles.historyDuration}>{inf.durationSeconds}s</Text>
                  <Text style={styles.historyCaffeine}>+{inf.caffeineMg} mg</Text>
                </View>
                {inf.notes && <Text style={styles.historyNotes}>{inf.notes}</Text>}
              </View>
            ))}
          </View>
        )}
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
  teaTypeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  teaTypeChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: theme.colors.bgCard,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  teaTypeChipActive: {
    backgroundColor: 'rgba(42, 123, 98, 0.2)',
    borderColor: theme.colors.emerald,
  },
  teaTypeChipText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  teaTypeChipTextActive: {
    color: theme.colors.emeraldLight,
    fontWeight: '700',
  },
  card: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 16,
  },
  cardLabel: {
    fontSize: 11,
    color: theme.colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  teaNameInput: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingVertical: 6,
    marginBottom: 12,
  },
  paramsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  paramBox: {
    flex: 1,
    alignItems: 'center',
  },
  paramSub: {
    fontSize: 10,
    color: theme.colors.textMuted,
    marginBottom: 4,
    textAlign: 'center',
  },
  paramInput: {
    backgroundColor: theme.colors.bgCardSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    width: 60,
    textAlign: 'center',
  },
  unitText: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  timerCard: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 16,
  },
  infusionBadge: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.emeraldLight,
    backgroundColor: 'rgba(42, 123, 98, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 12,
  },
  timerCountdown: {
    fontSize: 72,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    lineHeight: 76,
    fontFamily: 'monospace',
  },
  secondsUnit: {
    fontSize: 24,
    color: theme.colors.textMuted,
  },
  adjustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginVertical: 14,
  },
  adjustBtn: {
    backgroundColor: theme.colors.bgCardSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  adjustBtnText: {
    color: theme.colors.textSecondary,
    fontWeight: '700',
    fontSize: 13,
  },
  targetLabel: {
    fontSize: 13,
    color: theme.colors.textMuted,
    fontWeight: '600',
  },
  startBtn: {
    backgroundColor: theme.colors.emerald,
    borderRadius: 14,
    width: '100%',
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  startBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
  },
  steepingActiveBox: {
    backgroundColor: 'rgba(42, 123, 98, 0.15)',
    borderWidth: 1,
    borderColor: theme.colors.emerald,
    borderRadius: 14,
    width: '100%',
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  steepingActiveText: {
    color: theme.colors.emeraldLight,
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 1,
  },
  finishedInfusionPanel: {
    width: '100%',
    marginTop: 10,
  },
  pourAlertText: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.copper,
    textAlign: 'center',
    marginBottom: 12,
  },
  notesInput: {
    backgroundColor: theme.colors.bgCardSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: theme.colors.textPrimary,
    fontSize: 13,
    marginBottom: 12,
  },
  recordNextBtn: {
    backgroundColor: theme.colors.emerald,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  recordNextBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  caffeineCard: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 16,
  },
  caffeineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  caffeineTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  caffeineValue: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.copper,
  },
  caffeineSub: {
    fontSize: 11,
    color: theme.colors.textMuted,
    lineHeight: 16,
  },
  historyCard: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 10,
  },
  historyItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  historyItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyNumber: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.emeraldLight,
  },
  historyDuration: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  historyCaffeine: {
    fontSize: 12,
    color: theme.colors.copper,
    fontWeight: '600',
  },
  historyNotes: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 2,
  },
});
