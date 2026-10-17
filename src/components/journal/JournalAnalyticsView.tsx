import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../core/theme';
import { SensoryRadarChart, SensoryProfile } from '../../core/radar-chart';
import { StarIcon, BrewIcon, DropletIcon, LightningIcon } from '../icons/CraftIcons';

export interface AnalyticsData {
  totalBrews: number;
  totalDoseGrams: number;
  totalWaterLiters: string;
  totalCaffeineMg: number;
  avgRating: string;
  methodsList: { method: string; count: number; percent: number }[];
  avgSensory: SensoryProfile | null;
  sensoryCount: number;
  balanceCounts: Record<string, number>;
  topTags: { tag: string; count: number }[];
}

export interface JournalAnalyticsViewProps {
  analyticsData: AnalyticsData;
  t: any;
}

export function JournalAnalyticsView({ analyticsData, t }: JournalAnalyticsViewProps) {
  return (
    <View style={styles.analyticsContainer} testID="journal-analytics-view">
      {/* Karty podsumowania wolumenu */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={styles.statIconBox}><BrewIcon size={22} color={theme.colors.copper} /></View>
          <Text style={styles.statValue}>{`${analyticsData.totalDoseGrams}g`}</Text>
          <Text style={styles.statLabel}>{t.journal.statTotalDose}</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIconBox}><DropletIcon size={20} color="#3D84A8" /></View>
          <Text style={styles.statValue}>{`${analyticsData.totalWaterLiters} L`}</Text>
          <Text style={styles.statLabel}>{t.journal.statTotalWater}</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIconBox}><LightningIcon size={20} color="#E5A96A" /></View>
          <Text style={styles.statValue}>{`${analyticsData.totalCaffeineMg} mg`}</Text>
          <Text style={styles.statLabel}>{t.journal.statTotalCaffeine}</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIconBox}><StarIcon size={20} color="#E5A96A" filled /></View>
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
  );
}

const styles = StyleSheet.create({
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
  statIconBox: {
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
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
