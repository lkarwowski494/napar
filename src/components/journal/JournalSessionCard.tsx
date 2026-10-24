import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { BrewSession } from '../../core/database-schema';
import { theme } from '../../core/theme';
import { SensoryRadarChart } from '../../core/radar-chart';
import { getWaterProfileName } from '../../core/water-chemistry';
import { formatDoseWeight, formatWaterWeight, formatTemperature } from '../../core/unit-converter';
import { StarIcon } from '../icons/CraftIcons';

export interface JournalSessionCardProps {
  session: BrewSession;
  unitSystem: 'metric' | 'imperial';
  language: 'pl' | 'en';
  t: any;
  onBrewAgain: (session: BrewSession) => void;
  onShareSession: (session: BrewSession) => void;
  onDelete: (session: BrewSession) => void;
  formatDateTime: (iso: string) => string;
  formatSeconds: (sec: number) => string;
}

export function JournalSessionCard({
  session,
  unitSystem,
  language,
  t,
  onBrewAgain,
  onShareSession,
  onDelete,
  formatDateTime,
  formatSeconds,
}: JournalSessionCardProps) {
  const isEn = language === 'en';

  return (
    <View style={styles.sessionCard}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.recipeTitle}>
            {session.recipeName || session.method}
          </Text>
          <Text style={styles.beanTitle}>
            {session.inventoryItemName
              ? `${isEn ? 'Beans' : 'Ziarna'}: ${session.inventoryItemName}`
              : `${session.beverageType === 'COFFEE' ? (isEn ? 'Coffee' : 'Kawa') : (isEn ? 'Tea' : 'Herbata')} · ${session.method}`}
          </Text>
        </View>

        {session.rating && (
          <View style={styles.ratingBadge}>
            <StarIcon size={12} color={theme.colors.copper} filled={true} />
            <Text style={styles.ratingText}>{session.rating.toFixed(1)}</Text>
          </View>
        )}
      </View>

      {/* Metryki parzenia */}
      <View style={styles.metricsRow}>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>{isEn ? 'TIME' : 'CZAS'}</Text>
          <Text style={styles.metricVal}>{formatSeconds(session.totalTimeSeconds)}</Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>{isEn ? 'DOSE / WATER' : 'DOZA / WODA'}</Text>
          <Text style={styles.metricVal}>
            {formatDoseWeight(session.doseGrams, unitSystem)} / {formatWaterWeight(session.waterGrams, unitSystem)}
          </Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>TEMP</Text>
          <Text style={styles.metricVal}>{formatTemperature(session.waterTempCelsius, unitSystem)}</Text>
        </View>
        {session.caffeineContentMg && (
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>{isEn ? 'CAFFEINE' : 'KOFEINA'}</Text>
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
                ? (isEn ? 'Balanced' : 'Zbalansowana')
                : session.tasteBalance === 'sour'
                ? (isEn ? 'Too sour' : 'Za kwaśna')
                : session.tasteBalance === 'bitter'
                ? (isEn ? 'Too bitter' : 'Za gorzka')
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
            onPress={() => onBrewAgain(session)}
            hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            accessibilityRole="button"
            accessibilityLabel={`${t.journal.brewAgain}: ${session.recipeName || session.method}`}
          >
            <Text style={styles.cardActionBtnText}>{t.journal.brewAgain}</Text>
          </Pressable>

          <Pressable
            testID={`share-session-btn-${session.id}`}
            style={[styles.cardActionBtn, styles.cardActionBtnSecondary]}
            onPress={() => onShareSession(session)}
            hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            accessibilityRole="button"
            accessibilityLabel={`${t.journal.shareSession}: ${session.recipeName || session.method}`}
          >
            <Text style={styles.cardActionBtnSecondaryText}>{t.journal.shareSession}</Text>
          </Pressable>

          <Pressable
            testID={`delete-session-btn-${session.id}`}
            onPress={() => onDelete(session)}
            hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={`${isEn ? 'Delete session' : 'Usuń sesję'}: ${session.recipeName || session.method}`}
          >
            <Text style={styles.deleteText}>{isEn ? 'Delete' : 'Usuń'}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
    paddingHorizontal: 10,
    paddingVertical: 6,
    minHeight: 36,
    justifyContent: 'center',
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
});
