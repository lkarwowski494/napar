// ============================================================================
// Napar (Steepwise) — Dziennik Degustacji (Brew Journal & History)
// Historia sesji, oceny sensoryczne, balans smaku, TDS i Extraction Yield
// ============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  TextInput,
  Share,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useBrew } from '../../src/core/brew-context';
import { MASTER_RECIPES } from '../../src/core/recipes-data';
import { getBrewSessions, deleteBrewSession, getRecipes, getInventoryItems, getUnitSystem } from '../../src/core/database';
import { BrewSession } from '../../src/core/database-schema';
import { theme } from '../../src/core/theme';
import { useTranslation } from '../../src/core/i18n';
import { SensoryProfile } from '../../src/core/radar-chart';
import { useAppAccess } from '../../src/core/app-access';
import { Apps4BrewPassModal } from '../../src/components/Apps4BrewPassModal';
import { JournalIcon, ShieldIcon } from '../../src/components/icons/CraftIcons';
import { JournalSessionCard } from '../../src/components/journal/JournalSessionCard';
import { JournalAnalyticsView } from '../../src/components/journal/JournalAnalyticsView';

export default function JournalScreen() {
  const router = useRouter();
  let brewCtx: ReturnType<typeof useBrew> | null = null;
  try {
    brewCtx = useBrew();
  } catch {
    brewCtx = null;
  }
  const selectRecipe = brewCtx?.selectRecipe ?? (() => {});
  const selectInventoryItem = brewCtx?.selectInventoryItem ?? (() => {});
  const setDoseGrams = brewCtx?.setDoseGrams ?? (() => {});
  const setWaterGrams = brewCtx?.setWaterGrams ?? (() => {});
  const setWaterTempCelsius = brewCtx?.setWaterTempCelsius ?? (() => {});
  const setGrindSetting = brewCtx?.setGrindSetting ?? (() => {});
  const setWaterProfile = brewCtx?.setWaterProfile ?? (() => {});
  const beveragePreference = brewCtx?.beveragePreference ?? 'both';
  const { t, language } = useTranslation();
  const { canCreate, isHistoryReadOnly, refresh } = useAppAccess();
  const [unitSystem] = useState<'metric' | 'imperial'>(() => {
    try {
      return getUnitSystem();
    } catch {
      return 'metric';
    }
  });
  const [sessions, setSessions] = useState<BrewSession[]>([]);
  const [viewMode, setViewMode] = useState<'sessions' | 'analytics'>('sessions');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<'all' | 'coffee' | 'tea' | 'high_rated'>('all');
  const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => {
    if (beveragePreference === 'coffee' && filterType === 'tea') {
      setFilterType('all');
    } else if (beveragePreference === 'tea' && filterType === 'coffee') {
      setFilterType('all');
    }
  }, [beveragePreference, filterType]);

  const relevantSessions = useMemo(() => {
    return sessions.filter((s) => {
      if (beveragePreference === 'coffee' && s.beverageType === 'TEA') return false;
      if (beveragePreference === 'tea' && s.beverageType === 'COFFEE') return false;
      return true;
    });
  }, [sessions, beveragePreference]);

  const analyticsData = useMemo(() => {
    const totalBrews = relevantSessions.length;
    const totalDoseGrams = relevantSessions.reduce((acc, s) => acc + (s.doseGrams || 0), 0);
    const totalWaterGrams = relevantSessions.reduce((acc, s) => acc + (s.waterGrams || 0), 0);
    const totalWaterLiters = (totalWaterGrams / 1000).toFixed(1);
    const totalCaffeineMg = Math.round(relevantSessions.reduce((acc, s) => acc + (s.caffeineContentMg || 0), 0));
    const ratedSessions = relevantSessions.filter((s) => typeof s.rating === 'number' && s.rating > 0);
    const avgRating =
      ratedSessions.length > 0
        ? (ratedSessions.reduce((acc, s) => acc + s.rating!, 0) / ratedSessions.length).toFixed(1)
        : '—';

    // Rozkład metod
    const methodCounts: Record<string, number> = {};
    for (const s of relevantSessions) {
      const m = s.method || 'Inna';
      methodCounts[m] = (methodCounts[m] || 0) + 1;
    }
    const methodsList = Object.entries(methodCounts)
      .map(([method, count]) => ({
        method,
        count,
        percent: totalBrews > 0 ? Math.round((count / totalBrews) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // Średni radar sensoryczny
    const sensorySessions = relevantSessions.filter((s) => s.sensory);
    let avgSensory: SensoryProfile | null = null;
    if (sensorySessions.length > 0) {
      const sumSensory = sensorySessions.reduce(
        (acc, s) => {
          const sc = s.sensory!;
          return {
            acidity: acc.acidity + (sc.acidity || 0),
            sweetness: acc.sweetness + (sc.sweetness || 0),
            body: acc.body + (sc.body || 0),
            clarity: acc.clarity + (sc.clarity || 0),
            finish: acc.finish + (sc.finish || 0),
          };
        },
        { acidity: 0, sweetness: 0, body: 0, clarity: 0, finish: 0 }
      );
      const n = sensorySessions.length;
      avgSensory = {
        acidity: Number((sumSensory.acidity / n).toFixed(1)),
        sweetness: Number((sumSensory.sweetness / n).toFixed(1)),
        body: Number((sumSensory.body / n).toFixed(1)),
        clarity: Number((sumSensory.clarity / n).toFixed(1)),
        finish: Number((sumSensory.finish / n).toFixed(1)),
      };
    }

    // Rozkład balansu smaku
    const balanceCounts: Record<string, number> = {
      balanced: 0,
      sour: 0,
      bitter: 0,
      astringent: 0,
      weak: 0,
      too_strong: 0,
    };
    for (const s of relevantSessions) {
      if (s.tasteBalance && balanceCounts[s.tasteBalance] !== undefined) {
        balanceCounts[s.tasteBalance]++;
      }
    }

    // Nuty smakowe (Top flavor tags)
    const tagCounts: Record<string, number> = {};
    for (const s of relevantSessions) {
      if (Array.isArray(s.flavorTags)) {
        for (const tg of s.flavorTags) {
          tagCounts[tg] = (tagCounts[tg] || 0) + 1;
        }
      }
    }
    const topTags = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalBrews,
      totalDoseGrams,
      totalWaterLiters,
      totalCaffeineMg,
      avgRating,
      methodsList,
      avgSensory,
      sensoryCount: sensorySessions.length,
      balanceCounts,
      topTags,
    };
  }, [relevantSessions]);

  const loadSessions = () => {
    try {
      const data = getBrewSessions(200);
      setSessions(data);
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const handleDelete = (session: BrewSession) => {
    if (!canCreate) {
      setShowPaywall(true);
      return;
    }
    Alert.alert(
      'Usuń wpis',
      `Czy na pewno chcesz usunąć sesję "${session.recipeName || session.method}"?`,
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Usuń',
          style: 'destructive',
          onPress: () => {
            deleteBrewSession(session.id);
            loadSessions();
          },
        },
      ]
    );
  };

  const handleBrewAgain = (session: BrewSession) => {
    if (!canCreate) {
      setShowPaywall(true);
      return;
    }
    try {
      const userRecipes = getRecipes();
      const allRecipes = [...userRecipes, ...MASTER_RECIPES];
      let foundRecipe = session.recipeId
        ? allRecipes.find((r) => r.id === session.recipeId)
        : undefined;

      if (!foundRecipe && session.recipeName) {
        foundRecipe = allRecipes.find(
          (r) => r.name.toLowerCase() === session.recipeName!.toLowerCase()
        );
      }

      if (!foundRecipe) {
        foundRecipe =
          allRecipes.find((r) => r.method.toLowerCase() === session.method.toLowerCase()) ||
          MASTER_RECIPES[0];
      }

      selectRecipe(foundRecipe);

      if (session.inventoryItemId || session.inventoryItemName) {
        const inventory = getInventoryItems(true);
        const foundItem = session.inventoryItemId
          ? inventory.find((i) => i.id === session.inventoryItemId)
          : inventory.find((i) => i.name.toLowerCase() === session.inventoryItemName!.toLowerCase());
        selectInventoryItem(foundItem || null);
      } else {
        selectInventoryItem(null);
      }

      if (session.doseGrams) setDoseGrams(session.doseGrams);
      if (session.waterGrams) setWaterGrams(session.waterGrams);
      if (session.waterTempCelsius) setWaterTempCelsius(session.waterTempCelsius);
      if (session.grindSetting) setGrindSetting(session.grindSetting);
      if (session.waterProfile) setWaterProfile(session.waterProfile);

      router.navigate('/');
      Alert.alert(t.journal.sessionLoadedTitle, t.journal.sessionLoadedMsg);
    } catch {
      router.navigate('/');
    }
  };

  const handleShareSession = (session: BrewSession) => {
    const formattedDate = formatDateTime(session.brewedAt);
    const title = session.recipeName || session.method;
    const bean = session.inventoryItemName ? `\nZiarno: ${session.inventoryItemName}` : '';
    const ratingStr = session.rating ? `\nOcena: ${session.rating.toFixed(1)}/5` : '';
    const balanceStr = session.tasteBalance ? `\nBalans: ${session.tasteBalance}` : '';
    const eyStr = session.extractionYieldPercentage ? ` (EY: ${session.extractionYieldPercentage.toFixed(1)}%)` : '';
    const tagsStr = session.flavorTags && session.flavorTags.length > 0 ? `\nNuty: ${session.flavorTags.join(', ')}` : '';
    const notesStr = session.notes ? `\nNotatki: "${session.notes}"` : '';

    const shareMessage = `${title} — Napar (Steepwise)
Data: ${formattedDate}${bean}
Doza: ${session.doseGrams}g | Woda: ${session.waterGrams}g | Temp: ${session.waterTempCelsius}°C
Czas parzenia: ${formatSeconds(session.totalTimeSeconds)}${ratingStr}${balanceStr}${eyStr}${tagsStr}${notesStr}

Parz uważnie, smakuj głęboko — 100% offline craft coffee.`;

    Share.share({
      title: `${title} · Notatka degustacyjna`,
      message: shareMessage,
    });
  };

  const formatDateTime = (iso: string) => {
    const d = new Date(iso);
    return `${d.toLocaleDateString(language === 'pl' ? 'pl-PL' : 'en-US')} o ${d.toLocaleTimeString(language === 'pl' ? 'pl-PL' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}:${s.toString().padStart(2, '0')}`;
  };

  const filteredSessions = relevantSessions.filter((s) => {
    if (filterType === 'coffee' && s.beverageType !== 'COFFEE') return false;
    if (filterType === 'tea' && s.beverageType !== 'TEA') return false;
    if (filterType === 'high_rated' && (!s.rating || s.rating < 4.5)) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchRecipe = s.recipeName?.toLowerCase().includes(q) ?? false;
      const matchMethod = s.method.toLowerCase().includes(q);
      const matchBean = s.inventoryItemName?.toLowerCase().includes(q) ?? false;
      const matchNotes = s.notes?.toLowerCase().includes(q) ?? false;
      const matchTags = s.flavorTags.some((tag) => tag.toLowerCase().includes(q));
      return matchRecipe || matchMethod || matchBean || matchNotes || matchTags;
    }

    return true;
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerBox}>
        <Text style={styles.headerTitle}>{t.journal.title}</Text>
        <Text style={styles.headerSub}>
          {t.journal.totalBrews}: {relevantSessions.length}
          {filteredSessions.length !== relevantSessions.length ? ` (widoczne: ${filteredSessions.length})` : ''}
        </Text>
      </View>

      {isHistoryReadOnly && (
        <View style={styles.readOnlyBanner} testID="journal-readonly-banner">
          <ShieldIcon size={14} color="#D49B42" />
          <Text style={[styles.readOnlyText, { marginLeft: 8 }]}>
            {t.paywall.historyNotice}
          </Text>
        </View>
      )}

      {/* Przełącznik Widoku: Sesje vs Analityka */}
      <View style={styles.viewModeRow}>
        <Pressable
          style={[styles.viewModeTab, viewMode === 'sessions' && styles.viewModeTabActive]}
          onPress={() => setViewMode('sessions')}
          testID="journal-tab-sessions"
        >
          <Text style={[styles.viewModeTabText, viewMode === 'sessions' && styles.viewModeTabTextActive]}>
            {`${t.journal.sessionsTab} (${relevantSessions.length})`}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.viewModeTab, viewMode === 'analytics' && styles.viewModeTabActive]}
          onPress={() => setViewMode('analytics')}
          testID="journal-tab-analytics"
        >
          <Text style={[styles.viewModeTabText, viewMode === 'analytics' && styles.viewModeTabTextActive]}>
            {t.journal.analyticsTab}
          </Text>
        </Pressable>
      </View>

      {viewMode === 'sessions' && (
        <>
          {/* Wyszukiwarka sesji (search bar) */}
          <View style={styles.searchBarContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder={t.journal.searchPlaceholder}
              placeholderTextColor={theme.colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              clearButtonMode="while-editing"
            />
          </View>

          {/* Szybkie filtry */}
          <View style={styles.filterChipsRow}>
            {[
              { key: 'all', label: t.journal.filterAll },
              ...(beveragePreference !== 'tea' ? [{ key: 'coffee', label: t.journal.filterCoffee }] : []),
              ...(beveragePreference !== 'coffee' ? [{ key: 'tea', label: t.journal.filterTea }] : []),
              { key: 'high_rated', label: t.journal.filterHighRated },
            ].map((f) => (
              <Pressable
                key={f.key}
                style={[
                  styles.filterChip,
                  filterType === f.key && styles.filterChipActive,
                ]}
                onPress={() => setFilterType(f.key as any)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    filterType === f.key && styles.filterChipTextActive,
                  ]}
                >
                  {f.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {relevantSessions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <JournalIcon size={44} color={theme.colors.copper} />
              <Text style={styles.emptyTitle}>{t.journal.emptyTitle}</Text>
              <Text style={styles.emptySub}>{t.journal.emptySub}</Text>
            </View>
          ) : filteredSessions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <JournalIcon size={36} color={theme.colors.textMuted} />
              <Text style={styles.emptyTitle}>{t.journal.noResults}</Text>
              <Pressable
                style={styles.clearSearchBtn}
                onPress={() => {
                  setSearchQuery('');
                  setFilterType('all');
                }}
              >
                <Text style={styles.clearSearchText}>Wyczyść filtry</Text>
              </Pressable>
            </View>
          ) : (
            filteredSessions.map((session) => (
              <JournalSessionCard
                key={session.id}
                session={session}
                unitSystem={unitSystem}
                language={language}
                t={t}
                onBrewAgain={handleBrewAgain}
                onShareSession={handleShareSession}
                onDelete={handleDelete}
                formatDateTime={formatDateTime}
                formatSeconds={formatSeconds}
              />
            ))
          )}
        </>
      )}

      {/* Widok Analityki i Trendów (Brew Analytics) */}
      {viewMode === 'analytics' && (
        <JournalAnalyticsView analyticsData={analyticsData} t={t} />
      )}

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
  readOnlyBanner: {
    backgroundColor: 'rgba(78, 159, 61, 0.12)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.statusPeak,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  readOnlyText: {
    color: theme.colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    flex: 1,
  },
  content: {
    padding: theme.spacing.md,
    paddingBottom: 40,
  },
  headerBox: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  headerSub: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  searchBarContainer: {
    marginBottom: 10,
  },
  searchInput: {
    backgroundColor: theme.colors.bgCard,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: theme.colors.textPrimary,
    fontSize: 13,
  },
  filterChipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterChip: {
    backgroundColor: theme.colors.bgCardSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  filterChipActive: {
    backgroundColor: 'rgba(217, 119, 54, 0.2)',
    borderColor: theme.colors.copper,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  filterChipTextActive: {
    color: theme.colors.copper,
    fontWeight: '800',
  },
  clearSearchBtn: {
    marginTop: 12,
    backgroundColor: 'rgba(217, 119, 54, 0.15)',
    borderWidth: 1,
    borderColor: theme.colors.copper,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  clearSearchText: {
    color: theme.colors.copper,
    fontWeight: '700',
    fontSize: 13,
  },
  viewModeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  viewModeTab: {
    flex: 1,
    backgroundColor: theme.colors.bgCard,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  viewModeTabActive: {
    borderColor: theme.colors.copper,
    backgroundColor: theme.colors.bgCardSecondary,
  },
  viewModeTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  viewModeTabTextActive: {
    color: theme.colors.copper,
    fontWeight: '700',
  },
});
