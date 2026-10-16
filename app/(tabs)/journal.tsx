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
import { getBrewSessions, deleteBrewSession, getRecipes, getInventoryItems } from '../../src/core/database';
import { BrewSession } from '../../src/core/database-schema';
import { theme } from '../../src/core/theme';
import { useTranslation } from '../../src/core/i18n';
import { SensoryRadarChart, SensoryProfile } from '../../src/core/radar-chart';
import { getWaterProfileName } from '../../src/core/water-chemistry';
import { useAppAccess } from '../../src/core/app-access';
import { Apps4BrewPassModal } from '../../src/components/Apps4BrewPassModal';

export default function JournalScreen() {
  const router = useRouter();
  const {
    selectRecipe,
    selectInventoryItem,
    setDoseGrams,
    setWaterGrams,
    setWaterTempCelsius,
    setGrindSetting,
    setWaterProfile,
  } = useBrew();
  const { t, language } = useTranslation();
  const { canCreate, isHistoryReadOnly } = useAppAccess();
  const [sessions, setSessions] = useState<BrewSession[]>([]);
  const [viewMode, setViewMode] = useState<'sessions' | 'analytics'>('sessions');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<'all' | 'coffee' | 'tea' | 'high_rated'>('all');
  const [showPaywall, setShowPaywall] = useState(false);

  const analyticsData = useMemo(() => {
    const totalBrews = sessions.length;
    const totalDoseGrams = sessions.reduce((acc, s) => acc + (s.doseGrams || 0), 0);
    const totalWaterGrams = sessions.reduce((acc, s) => acc + (s.waterGrams || 0), 0);
    const totalWaterLiters = (totalWaterGrams / 1000).toFixed(1);
    const totalCaffeineMg = Math.round(sessions.reduce((acc, s) => acc + (s.caffeineContentMg || 0), 0));
    const ratedSessions = sessions.filter((s) => typeof s.rating === 'number' && s.rating > 0);
    const avgRating =
      ratedSessions.length > 0
        ? (ratedSessions.reduce((acc, s) => acc + s.rating!, 0) / ratedSessions.length).toFixed(1)
        : '—';

    // Rozkład metod
    const methodCounts: Record<string, number> = {};
    for (const s of sessions) {
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
    const sensorySessions = sessions.filter((s) => s.sensory);
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
    for (const s of sessions) {
      if (s.tasteBalance && balanceCounts[s.tasteBalance] !== undefined) {
        balanceCounts[s.tasteBalance]++;
      }
    }

    // Nuty smakowe (Top flavor tags)
    const tagCounts: Record<string, number> = {};
    for (const s of sessions) {
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
  }, [sessions]);

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
    const bean = session.inventoryItemName ? `\n🫘 Ziarno: ${session.inventoryItemName}` : '';
    const ratingStr = session.rating ? `\n⭐ Ocena: ★ ${session.rating.toFixed(1)}/5` : '';
    const balanceStr = session.tasteBalance ? `\n🎯 Balans: ${session.tasteBalance}` : '';
    const eyStr = session.extractionYieldPercentage ? ` (EY: ${session.extractionYieldPercentage.toFixed(1)}%)` : '';
    const tagsStr = session.flavorTags && session.flavorTags.length > 0 ? `\n🌸 Nuty: ${session.flavorTags.join(', ')}` : '';
    const notesStr = session.notes ? `\n📝 Notatki: "${session.notes}"` : '';

    const shareMessage = `☕ ${title} — Napar (Steepwise)
📅 ${formattedDate}${bean}
⚖️ Doza: ${session.doseGrams}g | Woda: ${session.waterGrams}g | Temp: ${session.waterTempCelsius}°C
⏱️ Czas parzenia: ${formatSeconds(session.totalTimeSeconds)}${ratingStr}${balanceStr}${eyStr}${tagsStr}${notesStr}

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

  const filteredSessions = sessions.filter((s) => {
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
          {t.journal.totalBrews}: {sessions.length}
          {filteredSessions.length !== sessions.length ? ` (widoczne: ${filteredSessions.length})` : ''}
        </Text>
      </View>

      {isHistoryReadOnly && (
        <View style={styles.readOnlyBanner} testID="journal-readonly-banner">
          <Text style={styles.readOnlyText}>
            {`🛡️ ${t.paywall.historyNotice}`}
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
            📋 {t.journal.sessionsTab} ({sessions.length})
          </Text>
        </Pressable>
        <Pressable
          style={[styles.viewModeTab, viewMode === 'analytics' && styles.viewModeTabActive]}
          onPress={() => setViewMode('analytics')}
          testID="journal-tab-analytics"
        >
          <Text style={[styles.viewModeTabText, viewMode === 'analytics' && styles.viewModeTabTextActive]}>
            📊 {t.journal.analyticsTab}
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
          { key: 'coffee', label: `☕ ${t.journal.filterCoffee}` },
          { key: 'tea', label: `🍵 ${t.journal.filterTea}` },
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

      {sessions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>☕</Text>
          <Text style={styles.emptyTitle}>{t.journal.emptyTitle}</Text>
          <Text style={styles.emptySub}>{t.journal.emptySub}</Text>
        </View>
      ) : filteredSessions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🔍</Text>
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
          <View key={session.id} style={styles.sessionCard}>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.recipeTitle}>
                  {session.recipeName || session.method}
                </Text>
                <Text style={styles.beanTitle}>
                  {session.inventoryItemName
                    ? `Ziarna: ${session.inventoryItemName}`
                    : `${session.beverageType === 'COFFEE' ? 'Kawa' : 'Herbata'} · ${session.method}`}
                </Text>
              </View>

              {session.rating && (
                <View style={styles.ratingBadge}>
                  <Text style={styles.ratingText}>★ {session.rating.toFixed(1)}</Text>
                </View>
              )}
            </View>

            {/* Metryki parzenia */}
            <View style={styles.metricsRow}>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>CZAS</Text>
                <Text style={styles.metricVal}>{formatSeconds(session.totalTimeSeconds)}</Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>DOZA / WODA</Text>
                <Text style={styles.metricVal}>
                  {session.doseGrams}g / {session.waterGrams}g
                </Text>
              </View>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>TEMP</Text>
                <Text style={styles.metricVal}>{session.waterTempCelsius}°C</Text>
              </View>
              {session.caffeineContentMg && (
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>KOFEINA</Text>
                  <Text style={styles.metricValHighlight}>
                    ~{Math.round(session.caffeineContentMg)} mg
                  </Text>
                </View>
              )}
              {session.waterProfile && (
                <View style={styles.metricItem} testID={`journal-water-${session.id}`}>
                  <Text style={styles.metricLabel}>{t.water.sessionWaterLabel}</Text>
                  <Text style={styles.metricVal}>{getWaterProfileName(session.waterProfile, language)}</Text>
                </View>
              )}
            </View>

            {/* Balans smaku i ekstrakcja */}
            <View style={styles.flavorRow}>
              {session.tasteBalance && (
                <View
                  style={[
                    styles.balanceBadge,
                    session.tasteBalance === 'balanced'
                      ? styles.balanceGood
                      : styles.balanceWarn,
                  ]}
                >
                  <Text style={styles.balanceText}>
                    {session.tasteBalance === 'balanced'
                      ? '✓ Zbalansowana'
                      : session.tasteBalance === 'sour'
                      ? '⚠ Za kwaśna'
                      : session.tasteBalance === 'bitter'
                      ? '⚠ Za gorzka'
                      : session.tasteBalance}
                  </Text>
                </View>
              )}

              {session.extractionYieldPercentage && (
                <View style={styles.eyBadge}>
                  <Text style={styles.eyText}>
                    EY: {session.extractionYieldPercentage.toFixed(1)}%
                    {session.tdsPercentage ? ` (TDS ${session.tdsPercentage}%)` : ''}
                  </Text>
                </View>
              )}
            </View>

            {/* Wykres Sensoryki SCA Spider Graph */}
            {session.sensory && (
              <View style={styles.sensoryChartWrapper}>
                <Text style={styles.sensoryChartTitle}>{t.sensory.title}</Text>
                <SensoryRadarChart
                  profile={session.sensory}
                  size={170}
                  language={language}
                />
              </View>
            )}

            {/* Tagi nut sensorycznych */}
            {session.flavorTags && session.flavorTags.length > 0 && (
              <View style={styles.tagsRow}>
                {session.flavorTags.map((tag, idx) => (
                  <View key={idx} style={styles.tagChip}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Notatki */}
            {session.notes && (
              <Text style={styles.notesText}>„{session.notes}”</Text>
            )}

            <View style={styles.cardFooter}>
              <Text style={styles.dateText}>{formatDateTime(session.brewedAt)}</Text>
              <View style={styles.cardActionsRow}>
                <Pressable
                  testID={`brew-again-btn-${session.id}`}
                  style={styles.cardActionBtn}
                  onPress={() => handleBrewAgain(session)}
                  accessibilityRole="button"
                  accessibilityLabel={`${t.journal.brewAgain}: ${session.recipeName || session.method}`}
                >
                  <Text style={styles.cardActionBtnText}>🔁 {t.journal.brewAgain}</Text>
                </Pressable>

                <Pressable
                  testID={`share-session-btn-${session.id}`}
                  style={[styles.cardActionBtn, styles.cardActionBtnSecondary]}
                  onPress={() => handleShareSession(session)}
                  accessibilityRole="button"
                  accessibilityLabel={`${t.journal.shareSession}: ${session.recipeName || session.method}`}
                >
                  <Text style={styles.cardActionBtnSecondaryText}>📤 {t.journal.shareSession}</Text>
                </Pressable>

                <Pressable
                  testID={`delete-session-btn-${session.id}`}
                  onPress={() => handleDelete(session)}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel={`Usuń sesję: ${session.recipeName || session.method}`}
                >
                  <Text style={styles.deleteText}>Usuń</Text>
                </Pressable>
              </View>
            </View>
          </View>
        ))
      )}
        </>
      )}

      {/* Widok Analityki i Trendów (Brew Analytics) */}
      {viewMode === 'analytics' && (
        <View style={styles.analyticsContainer} testID="journal-analytics-view">
          {/* Karty podsumowania wolumenu */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statIcon}>☕</Text>
              <Text style={styles.statValue}>{`${analyticsData.totalDoseGrams}g`}</Text>
              <Text style={styles.statLabel}>{t.journal.statTotalDose}</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statIcon}>💧</Text>
              <Text style={styles.statValue}>{`${analyticsData.totalWaterLiters} L`}</Text>
              <Text style={styles.statLabel}>{t.journal.statTotalWater}</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statIcon}>⚡</Text>
              <Text style={styles.statValue}>{`${analyticsData.totalCaffeineMg} mg`}</Text>
              <Text style={styles.statLabel}>{t.journal.statTotalCaffeine}</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statIcon}>★</Text>
              <Text style={styles.statValue}>{`${analyticsData.avgRating}`}</Text>
              <Text style={styles.statLabel}>{t.journal.statAvgRating}</Text>
            </View>
          </View>

          {/* Rozkład metod parzenia */}
          <View style={styles.analyticsSection}>
            <Text style={styles.analyticsSectionTitle}>{t.journal.methodDistributionTitle}</Text>
            {analyticsData.methodsList.length === 0 ? (
              <Text style={styles.analyticsEmptyText}>Brak zarejestrowanych sesji</Text>
            ) : (
              analyticsData.methodsList.map((m) => (
                <View key={m.method} style={styles.methodBarRow}>
                  <View style={styles.methodInfoRow}>
                    <Text style={styles.methodName}>{m.method}</Text>
                    <Text style={styles.methodCount}>
                      {m.count} ({m.percent}%)
                    </Text>
                  </View>
                  <View style={styles.barBackground}>
                    <View style={[styles.barFill, { width: `${m.percent}%` }]} />
                  </View>
                </View>
              ))
            )}
          </View>

          {/* Średni radar sensoryczny SCA */}
          <View style={styles.analyticsSection}>
            <Text style={styles.analyticsSectionTitle}>{t.journal.sensoryAverageTitle}</Text>
            <Text style={styles.analyticsSectionSub}>
              {analyticsData.sensoryCount > 0
                ? `${t.journal.sensoryAverageDesc} (${analyticsData.sensoryCount} sesji)`
                : 'Brak sesji z zanotowanym profilem sensorycznym'}
            </Text>

            {analyticsData.avgSensory && (
              <View style={{ alignItems: 'center', marginVertical: 12 }}>
                <SensoryRadarChart profile={analyticsData.avgSensory} size={220} />
                <View style={styles.sensoryScoresSummary}>
                  <Text style={styles.sensoryScorePill}>
                    {`Kwasowość: ${analyticsData.avgSensory.acidity}`}
                  </Text>
                  <Text style={styles.sensoryScorePill}>
                    {`Słodycz: ${analyticsData.avgSensory.sweetness}`}
                  </Text>
                  <Text style={styles.sensoryScorePill}>
                    {`Ciało: ${analyticsData.avgSensory.body}`}
                  </Text>
                  <Text style={styles.sensoryScorePill}>
                    {`Czystość: ${analyticsData.avgSensory.clarity}`}
                  </Text>
                  <Text style={styles.sensoryScorePill}>
                    {`Finisz: ${analyticsData.avgSensory.finish}`}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Dominujące nuty sensoryczne */}
          {analyticsData.topTags.length > 0 && (
            <View style={styles.analyticsSection}>
              <Text style={styles.analyticsSectionTitle}>{t.journal.topFlavorsTitle}</Text>
              <View style={styles.tagsCloud}>
                {analyticsData.topTags.map((tag) => (
                  <View key={tag.tag} style={styles.tagBadge}>
                    <Text style={styles.tagBadgeText}>
                      {`${tag.tag} (${tag.count})`}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Balans smakowy */}
          <View style={styles.analyticsSection}>
            <Text style={styles.analyticsSectionTitle}>{t.journal.balanceDistributionTitle}</Text>
            <View style={styles.balanceGrid}>
              <View style={styles.balanceItem}>
                <Text style={styles.balanceCount}>{analyticsData.balanceCounts.balanced || 0}</Text>
                <Text style={styles.balanceLabel}>Zbalansowana</Text>
              </View>
              <View style={styles.balanceItem}>
                <Text style={styles.balanceCount}>{analyticsData.balanceCounts.sour || 0}</Text>
                <Text style={styles.balanceLabel}>Kwaśna</Text>
              </View>
              <View style={styles.balanceItem}>
                <Text style={styles.balanceCount}>{analyticsData.balanceCounts.bitter || 0}</Text>
                <Text style={styles.balanceLabel}>Gorzka</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Apps4Brew Pass Paywall Modal */}
      <Apps4BrewPassModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
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
  },
  readOnlyText: {
    color: theme.colors.textPrimary,
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 16,
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
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
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
  sessionCard: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  recipeTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  beanTitle: {
    fontSize: 13,
    color: theme.colors.copper,
    fontWeight: '600',
  },
  ratingBadge: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
  },
  ratingText: {
    color: '#FFD700',
    fontWeight: '700',
    fontSize: 14,
  },
  metricsRow: {
    flexDirection: 'row',
    backgroundColor: theme.colors.bgCardSecondary,
    borderRadius: theme.borderRadius.sm,
    padding: 10,
    marginBottom: 10,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: theme.colors.textMuted,
    marginBottom: 2,
  },
  metricVal: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  metricValHighlight: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.copperLight,
  },
  flavorRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  balanceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
  },
  balanceGood: {
    backgroundColor: theme.colors.statusPeakMuted,
  },
  balanceWarn: {
    backgroundColor: theme.colors.copperMuted,
  },
  balanceText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  eyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.bgCardSecondary,
  },
  eyText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  tagChip: {
    backgroundColor: theme.colors.emeraldMuted,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.sm,
  },
  tagText: {
    fontSize: 11,
    color: theme.colors.emeraldLight,
    fontWeight: '600',
  },
  notesText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: 8,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 10,
    marginTop: 4,
  },
  dateText: {
    fontSize: 11,
    color: theme.colors.textMuted,
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardActionBtn: {
    backgroundColor: theme.colors.copperMuted,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.copper,
  },
  cardActionBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.copper,
  },
  cardActionBtnSecondary: {
    backgroundColor: theme.colors.bgCardSecondary,
    borderColor: theme.colors.border,
  },
  cardActionBtnSecondaryText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  deleteText: {
    fontSize: 12,
    color: theme.colors.danger,
    fontWeight: '600',
    marginLeft: 4,
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
  sensoryChartWrapper: {
    alignItems: 'center',
    backgroundColor: theme.colors.bgCardSecondary,
    borderRadius: theme.borderRadius.sm,
    paddingVertical: 10,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sensoryChartTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    marginBottom: 4,
    letterSpacing: 0.5,
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
  analyticsContainer: {
    gap: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  analyticsSection: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  analyticsSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  analyticsSectionSub: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 12,
  },
  analyticsEmptyText: {
    fontSize: 13,
    color: theme.colors.textMuted,
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  methodBarRow: {
    marginBottom: 10,
  },
  methodInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  methodName: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  methodCount: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  barBackground: {
    height: 8,
    backgroundColor: theme.colors.bgCardSecondary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: theme.colors.copper,
    borderRadius: 4,
  },
  sensoryScoresSummary: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
    marginTop: 8,
  },
  sensoryScorePill: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    backgroundColor: theme.colors.bgCardSecondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
  },
  tagsCloud: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  tagBadge: {
    backgroundColor: theme.colors.bgCardSecondary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  tagBadgeText: {
    fontSize: 12,
    color: theme.colors.copper,
    fontWeight: '500',
  },
  balanceGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  balanceItem: {
    flex: 1,
    backgroundColor: theme.colors.bgCardSecondary,
    borderRadius: theme.borderRadius.sm,
    padding: 10,
    alignItems: 'center',
  },
  balanceCount: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  balanceLabel: {
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
});
