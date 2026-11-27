// ============================================================================
// Napar — BeanItemCard Component
// Card displaying an individual coffee bean or tea stash item
// ============================================================================

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { InventoryItem } from '../../core/database-schema';
import { formatDoseWeight } from '../../core/unit-converter';
import { theme, withAlpha } from '../../core/theme';
import { useTranslation, formatTemplate } from '../../core/i18n';

interface BeanItemCardProps {
  item: InventoryItem;
  unitSystem: 'metric' | 'imperial';
  onToggleFavorite: (item: InventoryItem) => void;
  onToggleArchive: (item: InventoryItem) => void;
  onSelectForBrew: (item: InventoryItem) => void;
  onOpenEdit: (item: InventoryItem) => void;
  language?: 'pl' | 'en';
}

export function computeDaysSinceLocalDate(dateStr?: string, nowDate: Date = new Date()): number | null {
  if (!dateStr) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateStr.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(year, month - 1, day);
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }
  const today = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate());
  return Math.round((today.getTime() - parsed.getTime()) / 86_400_000);
}

export const BeanItemCard: React.FC<BeanItemCardProps> = ({
  item,
  unitSystem,
  onToggleFavorite,
  onToggleArchive,
  onSelectForBrew,
  onOpenEdit,
  language: propLanguage,
}) => {
  const { t, language: contextLang } = useTranslation();
  const language = propLanguage || contextLang || 'pl';
  const isEn = language === 'en';
  const rawRem = typeof item.remainingWeightGrams === 'number' ? item.remainingWeightGrams : 0;
  const safeRemainingGrams = Object.is(rawRem, -0) || rawRem < 0 ? 0 : rawRem;
  const rawInit = typeof item.initialWeightGrams === 'number' ? item.initialWeightGrams : 0;
  const safeInitialGrams = Object.is(rawInit, -0) || rawInit < 0 ? 0 : rawInit;

  const trimmedDate = item.roastOrHarvestDate?.trim() || '';
  const daysSince = computeDaysSinceLocalDate(trimmedDate);
  const dateLabel = trimmedDate
    ? formatTemplate(
        item.type === 'tea' ? t.stash.harvestDateLabel : t.stash.roastDateLabel,
        { date: trimmedDate }
      )
    : null;
  const daysAgeLabel =
    daysSince !== null && daysSince >= 0
      ? daysSince === 0
        ? t.stash.today
        : formatTemplate(t.stash.daysAgo, { days: daysSince })
      : null;
  const freshnessStage =
    item.type === 'coffee' && daysSince !== null && daysSince >= 0
      ? daysSince <= 3
        ? 'resting'
        : daysSince <= 35
          ? 'peak'
          : 'aged'
      : null;
  const freshnessLabel =
    freshnessStage === 'resting'
      ? t.stash.freshnessResting
      : freshnessStage === 'peak'
        ? t.stash.freshnessPeak
        : freshnessStage === 'aged'
          ? t.stash.freshnessAged
          : null;
  const hasRating = typeof item.rating === 'number' && Number.isFinite(item.rating) && item.rating > 0;

  return (
    <View style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.itemName}>{item.name}</Text>
          {item.roasterOrProducer ? (
            <Text style={styles.itemSubtitle}>{item.roasterOrProducer}</Text>
          ) : null}
        </View>
        <Pressable
          testID={`bean-fav-btn-${item.id}`}
          onPress={() => onToggleFavorite(item)}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          style={styles.favBtn}
          accessibilityRole="button"
          accessibilityState={{ selected: Boolean(item.isFavorite) }}
          accessibilityLabel={item.isFavorite ? t.stash.favoriteRemove : t.stash.favoriteAdd}
        >
          <Text style={[styles.favIcon, item.isFavorite && styles.favIconActive]}>
            {item.isFavorite ? '★' : '☆'}
          </Text>
        </Pressable>
      </View>

      {/* Szczegóły botaniczne */}
      <View style={styles.detailsRow}>
        {item.origin && <Text style={styles.detailTag}>{item.origin}</Text>}
        {item.variety && <Text style={styles.detailTag}>{item.variety}</Text>}
        {item.process && <Text style={styles.detailTag}>{item.process}</Text>}
        {hasRating && (
          <Text testID={`bean-rating-${item.id}`} style={styles.ratingBadge}>
            {formatTemplate(t.stash.packRatingBadge, { rating: item.rating })}
          </Text>
        )}
      </View>

      {/* Data palenia/zbioru, dni od wypału i odznaka świeżości (DEEP-029) */}
      {dateLabel && (
        <View style={styles.freshnessRow} testID={`bean-freshness-${item.id}`}>
          <Text style={styles.roastDateText}>
            {daysAgeLabel ? `${dateLabel} · ${daysAgeLabel}` : dateLabel}
          </Text>
          {freshnessLabel && (
            <View
              testID={`bean-freshness-badge-${item.id}`}
              style={[
                styles.freshnessBadge,
                freshnessStage === 'resting' && styles.freshnessBadgeResting,
                freshnessStage === 'peak' && styles.freshnessBadgePeak,
                freshnessStage === 'aged' && styles.freshnessBadgeAged,
              ]}
            >
              <Text
                style={[
                  styles.freshnessBadgeText,
                  freshnessStage === 'resting' && styles.freshnessTextResting,
                  freshnessStage === 'peak' && styles.freshnessTextPeak,
                  freshnessStage === 'aged' && styles.freshnessTextAged,
                ]}
              >
                {freshnessLabel}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Nuty sensoryczne */}
      {item.flavorNotes && item.flavorNotes.length > 0 && (
        <View style={styles.flavorRow}>
          {item.flavorNotes.map((note, idx) => (
            <View key={idx} style={styles.flavorChip}>
              <Text style={styles.flavorText}>#{note}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Baner dla wyczerpanej paczki */}
      {safeRemainingGrams === 0 && !item.isArchived && (
        <View style={styles.emptyStashBanner}>
          <Text style={styles.emptyStashText}>
            {t.stash?.archivePrompt || 'Paczka skończona (0 g). Przenieść do archiwum?'}
          </Text>
          <Pressable
            testID={`bean-archive-empty-btn-${item.id}`}
            style={styles.archiveEmptyBtn}
            onPress={() => onToggleArchive(item)}
            hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={isEn ? "Archive now" : "Archiwizuj teraz"}>
            <Text style={styles.archiveEmptyBtnText}>{isEn ? "Archive now" : "Archiwizuj teraz"}</Text>
          </Pressable>
        </View>
      )}

      {/* Dolny pasek karty: Waga i akcje */}
      <View style={styles.itemFooter}>
        <View>
          <Text style={styles.weightLabel}>{t.stash?.remainingGrams || 'Pozostało'}</Text>
          <Text
            testID={`bean-weight-${item.id}`}
            style={styles.weightValue}
            accessibilityRole="text"
            accessibilityLabel={`${isEn ? 'Remaining weight' : 'Pozostała waga'}: ${formatDoseWeight(safeRemainingGrams, unitSystem, language)}, ${isEn ? 'Initial weight' : 'Waga początkowa'}: ${formatDoseWeight(safeInitialGrams, unitSystem, language)}`}
          >
            {formatDoseWeight(safeRemainingGrams, unitSystem, language)} /{' '}
            {formatDoseWeight(safeInitialGrams, unitSystem, language)}
          </Text>
        </View>

        <View style={styles.actionsRow}>
          {!item.isArchived && safeRemainingGrams > 0 && (
            <Pressable
              testID={`bean-brew-btn-${item.id}`}
              style={styles.brewActionBtn}
              onPress={() => onSelectForBrew(item)}
              hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
              accessibilityRole="button"
              accessibilityLabel={isEn ? "Brew with these beans" : "Parz z tych ziaren"}
            >
              <Text style={styles.brewActionText}>{isEn ? "Brew" : "Parz z tych ziaren"}</Text>
            </Pressable>
          )}
          <Pressable
            testID={`bean-edit-btn-${item.id}`}
            style={styles.editActionBtn}
            onPress={() => onOpenEdit(item)}
            hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
            accessibilityRole="button"
            accessibilityLabel={isEn ? "Edit item" : "Edytuj paczkę"}>
            <Text style={styles.editActionText}>{isEn ? "Edit" : "Edytuj"}</Text>
          </Pressable>
          <Pressable
            testID={`bean-archive-btn-${item.id}`}
            style={styles.archiveActionBtn}
            onPress={() => onToggleArchive(item)}
            hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
            accessibilityRole="button"
            accessibilityLabel={item.isArchived ? (isEn ? "Restore item" : "Przywróć z archiwum") : (isEn ? "Archive item" : "Archiwizuj paczkę")}>
            <Text style={styles.archiveActionText}>
              {item.isArchived ? (isEn ? "Restore" : "Przywróć") : (isEn ? "Archive" : "Archiwizuj")}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  itemCard: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.lg,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  itemSubtitle: {
    fontSize: 13,
    color: theme.colors.copper,
    marginTop: 2,
    fontWeight: '500',
  },
  favBtn: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -8,
    marginRight: -8,
  },
  favIcon: {
    fontSize: 20,
    color: theme.colors.textMuted,
  },
  favIconActive: {
    color: theme.colors.favorite,
  },
  detailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  detailTag: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    backgroundColor: theme.colors.bgCardSecondary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  ratingBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.rating,
    backgroundColor: withAlpha(theme.colors.rating, 0.14),
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  freshnessRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  roastDateText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  freshnessBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
  },
  freshnessBadgeResting: {
    backgroundColor: withAlpha(theme.colors.copper, 0.12),
    borderColor: withAlpha(theme.colors.copper, 0.35),
  },
  freshnessBadgePeak: {
    backgroundColor: withAlpha(theme.colors.successBright, 0.12),
    borderColor: withAlpha(theme.colors.successBright, 0.35),
  },
  freshnessBadgeAged: {
    backgroundColor: theme.colors.bgCardSecondary,
    borderColor: theme.colors.borderStrong,
  },
  freshnessBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  freshnessTextResting: {
    color: theme.colors.copperLight,
  },
  freshnessTextPeak: {
    color: theme.colors.successBright,
  },
  freshnessTextAged: {
    color: theme.colors.textMuted,
  },
  flavorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  flavorChip: {
    backgroundColor: withAlpha(theme.colors.copper, 0.08),
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.copper, 0.2),
  },
  flavorText: {
    fontSize: 11,
    color: theme.colors.copper,
    fontWeight: '500',
  },
  emptyStashBanner: {
    backgroundColor: withAlpha(theme.colors.dangerIcon, 0.1),
    borderWidth: 1,
    borderColor: withAlpha(theme.colors.dangerIcon, 0.3),
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  emptyStashText: {
    fontSize: 12,
    color: theme.colors.danger,
    fontWeight: '600',
    flex: 1,
  },
  archiveEmptyBtn: {
    backgroundColor: theme.colors.danger,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: 6,
    marginLeft: 8,
  },
  archiveEmptyBtnText: {
    color: theme.colors.onAccent,
    fontSize: 11,
    fontWeight: '700',
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  weightLabel: {
    fontSize: 11,
    color: theme.colors.textMuted,
  },
  weightValue: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brewActionBtn: {
    backgroundColor: theme.colors.copper,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
    minHeight: 44,
    justifyContent: 'center',
  },
  brewActionText: {
    color: theme.colors.onAccent,
    fontSize: 12,
    fontWeight: '700',
  },
  editActionBtn: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    minHeight: 44,
    justifyContent: 'center',
  },
  editActionText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  archiveActionBtn: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    minHeight: 44,
    justifyContent: 'center',
  },
  archiveActionText: {
    color: theme.colors.textMuted,
    fontSize: 12,
  },
});
