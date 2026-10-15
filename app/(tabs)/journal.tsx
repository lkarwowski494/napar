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
} from 'react-native';
import { getBrewSessions, deleteBrewSession } from '../../src/core/database';
import { BrewSession } from '../../src/core/database-schema';
import { theme } from '../../src/core/theme';

export default function JournalScreen() {
  const [sessions, setSessions] = useState<BrewSession[]>([]);

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
    return `${d.toLocaleDateString('pl-PL')} o ${d.toLocaleTimeString('pl-PL', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerBox}>
        <Text style={styles.headerTitle}>Twoje Sesje Parzenia</Text>
        <Text style={styles.headerSub}>
          Łącznie zapisanych sesji: {sessions.length}
        </Text>
      </View>

      {sessions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>☕</Text>
          <Text style={styles.emptyTitle}>Brak wpisów w Dzienniku</Text>
          <Text style={styles.emptySub}>
            Zaparz swoją pierwszą kawę lub herbatę w zakładce Parzenie i zapisz swoje wrażenia sensoryczne.
          </Text>
        </View>
      ) : (
        sessions.map((session) => (
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
});
