// ============================================================================
// Napar — Dziennik Degustacji (Brew Journal & History)
// Historia sesji, oceny sensoryczne, balans smaku, TDS i Extraction Yield
// ============================================================================

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Share,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useBrew } from '../../src/core/brew-context';
import { MASTER_RECIPES } from '../../src/core/recipes-data';
import { getBrewSessions, deleteBrewSession, getRecipes, getInventoryItems, getUnitSystem } from '../../src/data/database';
import { BrewSession } from '../../src/core/database-schema';
import { theme } from '../../src/core/theme';
import { useTranslation, formatTemplate } from '../../src/core/i18n';
import { formatTemperature } from '../../src/core/unit-converter';
import { confirmAction } from '../../src/platform/confirm';
import { JournalIcon } from '../../src/components/icons/CraftIcons';
import { JournalSessionCard } from '../../src/components/journal/JournalSessionCard';
import { JournalAnalyticsView } from '../../src/components/journal/JournalAnalyticsView';
import { JournalFilterBar } from '../../src/components/journal/JournalFilterBar';
import { useJournalAnalytics } from '../../src/hooks/useJournalAnalytics';
import { runSave } from '../../lib/save-feedback';

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
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>(() => {
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

  const loadData = useCallback(() => {
    try {
      const data = getBrewSessions();
      setSessions(data);
    } catch {
      // fallback
    }
    try {
      setUnitSystem(getUnitSystem());
    } catch {
      // fallback
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleDelete = (session: BrewSession) => {
    confirmAction({
      title: t.journal.deleteEntryTitle || (language === 'pl' ? 'Usuń wpis' : 'Delete entry'),
      message: (t.journal.deleteEntryMsg || (language === 'pl' ? 'Czy na pewno chcesz usunąć sesję "{name}"?' : 'Are you sure you want to delete session "{name}"?'))
        .replace('{name}', session.recipeName || session.method),
      actionText: t.common.delete,
      destructive: true,
      onConfirm: () => {
        if (!runSave(() => deleteBrewSession(session.id), t.common)) return;
        loadData();
      },
    });
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

  // M1-audytor-generalny-033 (09-lokalizacja-008): tekst udostępniania w języku interfejsu,
  // temperatura wg ustawienia jednostek (formatTemperature).
  const handleShareSession = (session: BrewSession) => {
    const j = t.journal;
    const title = session.recipeName || session.method;
    const lines = [
      `${title} — Napar`,
      formatTemplate(j.shareDate, { date: formatDateTime(session.brewedAt) }),
      session.inventoryItemName ? formatTemplate(j.shareBean, { name: session.inventoryItemName }) : '',
      formatTemplate(j.shareParams, {
        dose: `${session.doseGrams}g`,
        water: `${session.waterGrams}g`,
        temp: formatTemperature(session.waterTempCelsius, unitSystem),
      }),
      formatTemplate(j.shareBrewTime, { time: formatSeconds(session.totalTimeSeconds) }) +
        (session.extractionYieldPercentage ? ` (EY: ${session.extractionYieldPercentage.toFixed(1)}%)` : ''),
    ];
    if (session.rating) lines.push(formatTemplate(j.shareRating, { rating: session.rating.toFixed(1) }));
    if (session.tasteBalance) lines.push(formatTemplate(j.shareBalance, { balance: session.tasteBalance }));
    if (session.flavorTags && session.flavorTags.length > 0) lines.push(formatTemplate(j.shareFlavorTags, { tags: session.flavorTags.join(', ') }));
    if (session.notes) lines.push(formatTemplate(j.shareNotes, { notes: session.notes }));
    const shareMessage = `${lines.filter(Boolean).join('\n')}\n\n${j.shareFooter}`;

    try {
      const sharePromise = Share.share({
        title: formatTemplate(j.shareTitle, { title }),
        message: shareMessage,
      });
      if (sharePromise && typeof sharePromise.catch === 'function') {
        sharePromise.catch(() => {
          Alert.alert(t.common.shareErrorTitle, t.common.shareErrorDesc);
        });
      }
    } catch {
      Alert.alert(t.common.shareErrorTitle, t.common.shareErrorDesc);
    }
  };

  const formatDateTime = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    const locale = language === 'pl' ? 'pl-PL' : 'en-US';
    return formatTemplate(t.journal.shareDateTime, {
      date: d.toLocaleDateString(locale),
      time: d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }),
    });
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
    <ScrollView testID="ekran:(tabs)/journal" style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerBox}>
        <Text style={styles.headerTitle}>{t.journal.title}</Text>
        <Text style={styles.headerSub}>
          {t.journal.totalBrews}: {relevantSessions.length}
          {filteredSessions.length !== relevantSessions.length ? ` (${formatTemplate(t.journal.visibleCount, { count: filteredSessions.length })})` : ''}
        </Text>
      </View>

      {/* Przełącznik Widoku: Sesje vs Analityka */}
      <View style={styles.viewModeRow}>
        <Pressable
          style={[styles.viewModeTab, viewMode === 'sessions' && styles.viewModeTabActive]}
          onPress={() => setViewMode('sessions')}
          testID="journal-tab-sessions"
          accessibilityRole="button"
          accessibilityLabel={t.journal.switchToSessionsA11y}
        >
          <Text style={[styles.viewModeTabText, viewMode === 'sessions' && styles.viewModeTabTextActive]}>
            {`${t.journal.sessionsTab} (${relevantSessions.length})`}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.viewModeTab, viewMode === 'analytics' && styles.viewModeTabActive]}
          onPress={() => setViewMode('analytics')}
          testID="journal-tab-analytics"
          accessibilityRole="button"
          accessibilityLabel={t.journal.switchToAnalyticsA11y}
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
                style={styles.clearSearchBtn}
                onPress={() => {
                  setSearchQuery('');
                  setFilterType('all');
                }}
                accessibilityRole="button"
                accessibilityLabel={t.journal.clearFilters}
              >
                <Text style={styles.clearSearchText}>{t.journal.clearFilters}</Text>
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
    minHeight: 40,
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
    minHeight: 36,
    justifyContent: 'center',
  },
  clearSearchText: {
    color: theme.colors.onAccent,
    fontSize: 12,
    fontWeight: '700',
  },
});
