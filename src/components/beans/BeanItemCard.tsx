// ============================================================================
// Napar (Steepwise) — BeanItemCard Component
// Card displaying an individual coffee bean or tea stash item
// ============================================================================

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { InventoryItem } from '../../core/database-schema';
import { evaluateRestingWindow } from '../../core/domain-rules';
import { formatDoseWeight } from '../../core/unit-converter';
import { theme } from '../../core/theme';
import { useTranslation } from '../../core/i18n';

interface BeanItemCardProps {
  item: InventoryItem;
  unitSystem: 'metric' | 'imperial';
  onToggleFavorite: (item: InventoryItem) => void;
  onToggleArchive: (item: InventoryItem) => void;
  onSelectForBrew: (item: InventoryItem) => void;
  onOpenEdit: (item: InventoryItem) => void;
  language?: 'pl' | 'en';
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
  const resting =
    item.type === 'coffee' && item.roastOrHarvestDate
      ? evaluateRestingWindow(item.roastOrHarvestDate)
      : null;

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
          onPress={() => onToggleFavorite(item)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={{ padding: 4 }}
          accessibilityRole="button"
          accessibilityLabel={item.isFavorite ? (t.stash?.favoriteRemove || 'Usuń z ulubionych') : (t.stash?.favoriteAdd || 'Dodaj do ulubionych')}
        >
          <Text style={[styles.favIcon, item.isFavorite && styles.favIconActive]}>
            {item.isFavorite ? '★' : '☆'}
          </Text>
        </Pressable>
      </View>

      {/* Świeżość (Resting Window) */}
      {resting && (
        <View
          testID={`resting-badge-${item.id}`}
          style={[
            styles.restingBadge,
            resting.stage === 'peak' && styles.restingOptimal,
            resting.stage === 'degassing' && styles.restingFresh,
            resting.stage === 'aging' && styles.restingPast,
          ]}
          accessibilityRole="text"
          accessibilityLabel={`${isEn ? 'Resting stage' : 'Etap świeżości'}: ${isEn ? (resting.messageEn || resting.messagePl) : resting.messagePl}`}
        >
          <Text
            style={[
              styles.restingText,
              resting.stage === 'peak' && styles.restingOptimalText,
              resting.stage === 'degassing' && styles.restingFreshText,
              resting.stage === 'aging' && styles.restingPastText,
            ]}
          >
            {language === 'en' ? (resting.messageEn || resting.messagePl) : resting.messagePl}
          </Text>
        </View>
      )}

      {/* Szczegóły botaniczne */}
      <View style={styles.detailsRow}>
        {item.origin && <Text style={styles.detailTag}>{item.origin}</Text>}
        {item.variety && <Text style={styles.detailTag}>{item.variety}</Text>}
        {item.process && <Text style={styles.detailTag}>{item.process}</Text>}
      </View>

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
      {item.remainingWeightGrams === 0 && !item.isArchived && (
        <View style={styles.emptyStashBanner}>
          <Text style={styles.emptyStashText}>
            {t.stash?.archivePrompt || 'Paczka skończona (0 g). Przenieść do archiwum?'}
          </Text>
          <Pressable
            style={styles.archiveEmptyBtn}
            onPress={() => onToggleArchive(item)}
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
            accessibilityLabel={`${isEn ? 'Remaining weight' : 'Pozostała waga'}: ${formatDoseWeight(item.remainingWeightGrams, unitSystem)}, ${isEn ? 'Initial weight' : 'Waga początkowa'}: ${formatDoseWeight(item.initialWeightGrams, unitSystem)}`}
          >
            {formatDoseWeight(item.remainingWeightGrams, unitSystem)} /{' '}
            {formatDoseWeight(item.initialWeightGrams, unitSystem)}
          </Text>
        </View>

        <View style={styles.actionsRow}>
          {!item.isArchived && item.remainingWeightGrams > 0 && (
            <Pressable
              style={styles.brewActionBtn}
              onPress={() => onSelectForBrew(item)}
              hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
              accessibilityRole="button"
              accessibilityLabel={isEn ? "Brew with these beans" : "Parz z tych ziaren"}
            >
              <Text style={styles.brewActionText}>{isEn ? "Brew" : "Parz z tych ziaren"}</Text>
            </Pressable>
          )}
          <Pressable
            style={styles.editActionBtn}
            onPress={() => onOpenEdit(item)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={isEn ? "Edit item" : "Edytuj paczkę"}>
            <Text style={styles.editActionText}>{isEn ? "Edit" : "Edytuj"}</Text>
          </Pressable>
          <Pressable
            style={styles.archiveActionBtn}
            onPress={() => onToggleArchive(item)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
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
  favIcon: {
    fontSize: 20,
    color: theme.colors.textMuted,
  },
  favIconActive: {
    color: '#E5A93C',
  },
  restingBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  restingOptimal: {
    backgroundColor: 'rgba(42, 123, 98, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(42, 123, 98, 0.3)',
  },
  restingFresh: {
    backgroundColor: 'rgba(217, 119, 54, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 54, 0.3)',
  },
  restingPast: {
    backgroundColor: 'rgba(100, 100, 100, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(100, 100, 100, 0.3)',
  },
  restingText: {
    fontSize: 11,
    fontWeight: '600',
  },
  restingOptimalText: {
    color: theme.colors.emerald,
  },
  restingFreshText: {
    color: theme.colors.copper,
  },
  restingPastText: {
    color: theme.colors.textMuted,
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
  flavorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  flavorChip: {
    backgroundColor: 'rgba(217, 119, 54, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 54, 0.2)',
  },
  flavorText: {
    fontSize: 11,
    color: theme.colors.copper,
    fontWeight: '500',
  },
  emptyStashBanner: {
    backgroundColor: 'rgba(217, 83, 79, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(217, 83, 79, 0.3)',
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
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
  },
  archiveEmptyBtnText: {
    color: '#FFFFFF',
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
    paddingVertical: 6,
    borderRadius: 6,
    minHeight: 36,
    justifyContent: 'center',
  },
  brewActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  editActionBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  editActionText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  archiveActionBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  archiveActionText: {
    color: theme.colors.textMuted,
    fontSize: 12,
  },
});
