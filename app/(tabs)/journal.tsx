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
  Share,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useBrew } from '../../src/core/brew-context';
import { MASTER_RECIPES } from '../../src/core/recipes-data';
import { getBrewSessions, deleteBrewSession, getRecipes, getInventoryItems, getUnitSystem } from '../../src/core/database';
import { BrewSession, InventoryItem } from '../../src/core/database-schema';
import { theme } from '../../src/core/theme';
import { useTranslation } from '../../src/core/i18n';
import { confirmAction } from '../../src/core/confirm';
import { JournalIcon } from '../../src/components/icons/CraftIcons';
import { JournalSessionCard } from '../../src/components/journal/JournalSessionCard';
import { JournalAnalyticsView } from '../../src/components/journal/JournalAnalyticsView';
import { ProactiveCalendarCard } from '../../src/components/journal/ProactiveCalendarCard';
import { JournalFilterBar } from '../../src/components/journal/JournalFilterBar';
import { TastingCardExport } from '../../src/components/journal/TastingCardExport';
import { useJournalAnalytics } from '../../src/core/useJournalAnalytics';
import { ProactiveActionItem } from '../../src/core/bpr-engine';

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
  const [unitSystem] = useState<'metric' | 'imperial'>(() => {
    try {
      return getUnitSystem();
    } catch {
      return 'metric';
    }
  });
  const [sessions, setSessions] = useState<BrewSession[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [viewMode, setViewMode] = useState<'sessions' | 'analytics'>('sessions');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<'all' | 'coffee' | 'tea' | 'high_rated'>('all');
  // Karta degustacyjna (poz. 31 MVP): sesja, dla której renderujemy obraz do udostępnienia
  const [cardSession, setCardSession] = useState<BrewSession | null>(null);

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

  const analyticsData = useJournalAnalytics(relevantSessions);

  const loadData = () => {
    try {
      const data = getBrewSessions();
      setSessions(data);
      const inv = getInventoryItems(true);
      setInventoryItems(inv);
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = (session: BrewSession) => {
    confirmAction({
      title: 'Usuń wpis',
      message: `Czy na pewno chcesz usunąć sesję "${session.recipeName || session.method}"?`,
      actionText: t.common.delete,
      destructive: true,
      onConfirm: () => {
        deleteBrewSession(session.id);
        loadData();
      },
    });
  };

  const handleExecuteProactiveAction = (action: ProactiveActionItem) => {
    try {
      const userRecipes = getRecipes();
      const allRecipes = [...userRecipes, ...MASTER_RECIPES];
      let targetRecipe = allRecipes.find((r) => r.id === action.recipeId);
      if (!targetRecipe && action.recommendedMethod) {
        targetRecipe = allRecipes.find(
          (r) => r.method.toLowerCase() === action.recommendedMethod!.toLowerCase()
        );
      }
      if (!targetRecipe) {
        targetRecipe = MASTER_RECIPES[0];
      }
      selectRecipe(targetRecipe);

      if (action.inventoryItemId) {
        const inventory = getInventoryItems(true);
        const item = inventory.find((i) => i.id === action.inventoryItemId);
        selectInventoryItem(item || null);
      }

      if (action.doseGrams) setDoseGrams(action.doseGrams);
      if (action.waterGrams) setWaterGrams(action.waterGrams);
      if (action.waterTempCelsius) setWaterTempCelsius(action.waterTempCelsius);

      router.navigate('/');
      Alert.alert('Załadowano parametry parzenia', action.titlePl);
    } catch {
      router.navigate('/');
    }
  };

  const handleBrewAgain = (session: BrewSession) => {
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
    setCardSession(session);
  };

  // Zapasowa notatka tekstowa, gdy zapis karty do PNG się nie udaje
  const shareSessionAsText = (session: BrewSession) => {
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

      {/* 14-dniowy Proaktywny Kalendarz i Harmonogram Akcji 1-Tap (BPR Pillar 5) */}
      <ProactiveCalendarCard
        inventory={inventoryItems}
        sessions={relevantSessions}
        language={language}
        onExecuteAction={handleExecuteProactiveAction}
      />

      {/* Przełącznik Widoku: Sesje vs Analityka */}
      <View style={styles.viewModeRow}>
        <Pressable
          style={[styles.viewModeTab, viewMode === 'sessions' && styles.viewModeTabActive, styles.touchTarget]}
          onPress={() => setViewMode('sessions')}
          testID="journal-tab-sessions"
          accessibilityRole="button"
          accessibilityLabel="Przełącz na listę sesji"
        >
          <Text style={[styles.viewModeTabText, viewMode === 'sessions' && styles.viewModeTabTextActive]}>
            {`${t.journal.sessionsTab} (${relevantSessions.length})`}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.viewModeTab, viewMode === 'analytics' && styles.viewModeTabActive, styles.touchTarget]}
          onPress={() => setViewMode('analytics')}
          testID="journal-tab-analytics"
          accessibilityRole="button"
          accessibilityLabel="Przełącz na analitykę i trendy"
        >
          <Text style={[styles.viewModeTabText, viewMode === 'analytics' && styles.viewModeTabTextActive]}>
            {t.journal.analyticsTab}
          </Text>
        </Pressable>
      </View>

      {viewMode === 'sessions' && (
        <>
          {/* Wyszukiwarka sesji i filtry korygujące */}
          <JournalFilterBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filterType={filterType}
            onFilterChange={setFilterType}
            beveragePreference={beveragePreference}
            t={t}
          />

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
                style={[styles.clearSearchBtn, styles.touchTarget]}
                onPress={() => {
                  setSearchQuery('');
                  setFilterType('all');
                }}
                accessibilityRole="button"
                accessibilityLabel="Wyczyść filtry"
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

      {cardSession && (
        <TastingCardExport
          session={cardSession}
          unitSystem={unitSystem}
          dialogTitle={t.tastingCard.title}
          onFinished={() => setCardSession(null)}
          onFailed={(failed) => {
            setCardSession(null);
            shareSessionAsText(failed);
          }}
        />
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  touchTarget: { minWidth: 44, minHeight: 44 },
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  content: {
    padding: theme.spacing.md,
    paddingBottom: 40,
  },
  headerBox: {
    marginBottom: theme.spacing.md,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  headerSub: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  viewModeRow: {
    flexDirection: 'row',
    backgroundColor: theme.colors.bgCardSecondary,
    borderRadius: theme.borderRadius.md,
    padding: 3,
    marginBottom: theme.spacing.md,
  },
  viewModeTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: theme.borderRadius.sm,
    minHeight: 44,
    justifyContent: 'center',
  },
  viewModeTabActive: {
    backgroundColor: theme.colors.bgCard,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  viewModeTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
  viewModeTabTextActive: {
    color: theme.colors.textPrimary,
    fontWeight: '700',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginTop: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginTop: 12,
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  clearSearchBtn: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: theme.colors.copper,
    borderRadius: theme.borderRadius.sm,
    minHeight: 44,
    justifyContent: 'center',
  },
  clearSearchText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
