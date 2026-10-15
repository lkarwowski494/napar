// ============================================================================
// Napar (Steepwise) — Dziennik Degustacji (Brew Journal & History)
// Historia sesji, oceny sensoryczne, balans smaku, TDS i Extraction Yield
// ============================================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  TextInput,
} from 'react-native';
import { getBrewSessions, deleteBrewSession } from '../../src/core/database';
import { BrewSession } from '../../src/core/database-schema';
import { theme } from '../../src/core/theme';
import { useTranslation } from '../../src/core/i18n';
import { SensoryRadarChart } from '../../src/core/radar-chart';
import { getWaterProfileName } from '../../src/core/water-chemistry';

export default function JournalScreen() {
  const { t, language } = useTranslation();
  const [sessions, setSessions] = useState<BrewSession[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<'all' | 'coffee' | 'tea' | 'high_rated'>('all');

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
              <Pressable onPress={() => handleDelete(session)} hitSlop={10}>
                <Text style={styles.deleteText}>Usuń</Text>
              </Pressable>
            </View>
          </View>
        ))
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
  deleteText: {
    fontSize: 12,
    color: theme.colors.danger,
    fontWeight: '600',
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
});
