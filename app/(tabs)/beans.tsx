// ============================================================================
// Napar (Steepwise) — Spiżarnia Ziaren i Liści (Inventory / Stash)
// Śledzenie świeżości (Resting Window), wagi w paczce i nut sensorycznych
// ============================================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useBrew } from '../../src/core/brew-context';
import {
  getInventoryItems,
  saveInventoryItem,
  getUnitSystem,
} from '../../src/core/database';
import { InventoryItem } from '../../src/core/database-schema';
import { evaluateRestingWindow } from '../../src/core/domain-rules';
import { theme } from '../../src/core/theme';
import { useAppAccess } from '../../src/core/app-access';
import { Apps4BrewPassModal } from '../../src/components/Apps4BrewPassModal';
import { formatDoseWeight } from '../../src/core/unit-converter';
import { BeansIcon, BookIcon, ShieldIcon } from '../../src/components/icons/CraftIcons';
import { BeanCompendiumModal, KnowledgeTemplate } from '../../src/components/beans/BeanCompendiumModal';
import { BeanAddModal } from '../../src/components/beans/BeanAddModal';
import { BeanEditModal } from '../../src/components/beans/BeanEditModal';

export default function BeansScreen() {
  const router = useRouter();
  const { selectInventoryItem, beveragePreference } = useBrew();
  const { canCreate, isHistoryReadOnly, refresh } = useAppAccess();
  const [unitSystem] = useState<'metric' | 'imperial'>(() => {
    try {
      return getUnitSystem();
    } catch {
      return 'metric';
    }
  });

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'coffee' | 'tea' | 'archived'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showCompendium, setShowCompendium] = useState(false);
  const [presetTemplate, setPresetTemplate] = useState<KnowledgeTemplate | null>(null);

  // Stan edycji paczki (BR-MAG-001 & BR-MAG-004)
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  useEffect(() => {
    if (beveragePreference === 'tea') {
      if (filter === 'coffee') setFilter('all');
    } else if (beveragePreference === 'coffee') {
      if (filter === 'tea') setFilter('all');
    }
  }, [beveragePreference]);

  const loadData = () => {
    try {
      const all = getInventoryItems(true);
      setItems(all);
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdd = () => {
    if (!canCreate) {
      setShowPaywall(true);
      return;
    }
    setPresetTemplate(null);
    setShowAddModal(true);
  };

  const handleUseKnowledgeTemplate = (template: KnowledgeTemplate) => {
    if (!canCreate) {
      setShowCompendium(false);
      setShowPaywall(true);
      return;
    }
    setPresetTemplate({ ...template });
    setShowCompendium(false);
    setShowAddModal(true);
  };

  const handleOpenEdit = (item: InventoryItem) => {
    if (!canCreate) {
      setShowPaywall(true);
      return;
    }
    setEditingItem(item);
    setShowEditModal(true);
  };

  const handleToggleFavorite = (item: InventoryItem) => {
    const updated: InventoryItem = {
      ...item,
      isFavorite: !item.isFavorite,
      updatedAt: new Date().toISOString(),
    };
    saveInventoryItem(updated);
    loadData();
  };

  const handleToggleArchive = (item: InventoryItem) => {
    const updated: InventoryItem = {
      ...item,
      isArchived: !item.isArchived,
      updatedAt: new Date().toISOString(),
    };
    saveInventoryItem(updated);
    loadData();
  };

  const handleSelectForBrew = (item: InventoryItem) => {
    selectInventoryItem(item);
    router.navigate('/(tabs)');
  };

  // Filtrowanie listy
  const filteredItems = items.filter((item) => {
    if (filter === 'archived') return item.isArchived;
    if (item.isArchived) return false;
    if (filter === 'coffee') return item.type === 'coffee';
    if (filter === 'tea') return item.type === 'tea';
    return true;
  });

  return (
    <View style={styles.container}>
      {/* Baner informacyjny w trybie tylko do odczytu */}
      {isHistoryReadOnly && (
        <View style={styles.readOnlyBanner}>
          <ShieldIcon size={14} color={theme.colors.copper} />
          <Text style={styles.readOnlyText}>
            Tryb tylko do odczytu (wygasła subskrypcja)
          </Text>
        </View>
      )}

      {/* Pasek filtrowania i akcji */}
      <View style={styles.topBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <Pressable
            style={[styles.filterChip, filter === 'all' && styles.filterChipActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterChipText, filter === 'all' && styles.filterChipTextActive]}>
              Wszystkie ({items.filter((i) => !i.isArchived).length})
            </Text>
          </Pressable>
          <Pressable
            style={[styles.filterChip, filter === 'coffee' && styles.filterChipActive]}
            onPress={() => setFilter('coffee')}
          >
            <Text style={[styles.filterChipText, filter === 'coffee' && styles.filterChipTextActive]}>
              Kawa ({items.filter((i) => !i.isArchived && i.type === 'coffee').length})
            </Text>
          </Pressable>
          <Pressable
            style={[styles.filterChip, filter === 'tea' && styles.filterChipActive]}
            onPress={() => setFilter('tea')}
          >
            <Text style={[styles.filterChipText, filter === 'tea' && styles.filterChipTextActive]}>
              Herbata ({items.filter((i) => !i.isArchived && i.type === 'tea').length})
            </Text>
          </Pressable>
          <Pressable
            style={[styles.filterChip, filter === 'archived' && styles.filterChipActive]}
            onPress={() => setFilter('archived')}
          >
            <Text style={[styles.filterChipText, filter === 'archived' && styles.filterChipTextActive]}>
              Archiwum ({items.filter((i) => i.isArchived).length})
            </Text>
          </Pressable>
        </ScrollView>

        {/* Przycisk Bazy Wiedzy */}
        <Pressable
          testID="compendium-open-button"
          style={styles.compendiumButton}
          onPress={() => setShowCompendium(true)}
          accessibilityRole="button"
          accessibilityLabel="Otwórz kompendium wiedzy"
        >
          <BookIcon size={14} color={theme.colors.copper} />
          <Text style={styles.compendiumButtonText}>Kompendium</Text>
        </Pressable>

        {/* Przycisk dodawania nowej paczki */}
        <Pressable
          testID="beans-add-button"
          style={styles.addButton}
          onPress={handleOpenAdd}
          accessibilityRole="button"
          accessibilityLabel="+ Dodaj"
        >
          <Text style={styles.addButtonText}>+ Dodaj</Text>
        </Pressable>
      </View>

      {/* Lista paczek w spiżarni */}
      <ScrollView contentContainerStyle={styles.listContent}>
        {filteredItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={{ marginBottom: 16 }}>
              <BeansIcon size={48} color={theme.colors.copper} />
            </View>
            <Text style={styles.emptyTitle}>Twoja spiżarnia jest pusta</Text>
            <Text style={styles.emptySub}>
              Dodaj swoją pierwszą kawę ziarnistą lub herbatę liściastą, aby śledzić świeżość,
              odmiany botaniczne i wagę.
            </Text>
            <Pressable style={styles.emptyBtn} onPress={handleOpenAdd}>
              <Text style={styles.emptyBtnText}>+ Dodaj pierwszą paczkę</Text>
            </Pressable>
          </View>
        ) : (
          filteredItems.map((item) => {
            const resting =
              item.type === 'coffee' && item.roastOrHarvestDate
                ? evaluateRestingWindow(item.roastOrHarvestDate)
                : null;

            return (
              <View key={item.id} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    {item.roasterOrProducer ? (
                      <Text style={styles.itemSubtitle}>{item.roasterOrProducer}</Text>
                    ) : null}
                  </View>
                  <Pressable
                    onPress={() => handleToggleFavorite(item)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={{ padding: 4 }}
                  >
                    <Text style={[styles.favIcon, item.isFavorite && styles.favIconActive]}>
                      {item.isFavorite ? '★' : '☆'}
                    </Text>
                  </Pressable>
                </View>

                {/* Świeżość (Resting Window) */}
                {resting && (
                  <View
                    style={[
                      styles.restingBadge,
                      resting.stage === 'peak' && styles.restingOptimal,
                      resting.stage === 'degassing' && styles.restingFresh,
                      resting.stage === 'aging' && styles.restingPast,
                    ]}
                  >
                    <Text
                      style={[
                        styles.restingText,
                        resting.stage === 'peak' && styles.restingOptimalText,
                        resting.stage === 'degassing' && styles.restingFreshText,
                        resting.stage === 'aging' && styles.restingPastText,
                      ]}
                    >
                      {resting.messagePl}
                    </Text>
                  </View>
                )}

                {/* Szczegóły botaniczne */}
                <View style={styles.detailsRow}>
                  {item.origin && (
                    <Text style={styles.detailTag}>{item.origin}</Text>
                  )}
                  {item.variety && (
                    <Text style={styles.detailTag}>{item.variety}</Text>
                  )}
                  {item.process && (
                    <Text style={styles.detailTag}>{item.process}</Text>
                  )}
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
                      Paczka skończona (0 g). Przenieść do archiwum?
                    </Text>
                    <Pressable
                      style={styles.archiveEmptyBtn}
                      onPress={() => handleToggleArchive(item)}
                    >
                      <Text style={styles.archiveEmptyBtnText}>Archiwizuj teraz</Text>
                    </Pressable>
                  </View>
                )}

                {/* Dolny pasek karty: Waga i akcje */}
                <View style={styles.itemFooter}>
                  <View>
                    <Text style={styles.weightLabel}>Pozostało</Text>
                    <Text style={styles.weightValue}>
                      {formatDoseWeight(item.remainingWeightGrams, unitSystem)} / {formatDoseWeight(item.initialWeightGrams, unitSystem)}
                    </Text>
                  </View>

                  <View style={styles.actionsRow}>
                    {!item.isArchived && item.remainingWeightGrams > 0 && (
                      <Pressable
                        style={styles.brewActionBtn}
                        onPress={() => handleSelectForBrew(item)}
                      >
                        <Text style={styles.brewActionText}>Parz z tych ziaren</Text>
                      </Pressable>
                    )}
                    <Pressable
                      style={styles.editActionBtn}
                      onPress={() => handleOpenEdit(item)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={styles.editActionText}>Edytuj</Text>
                    </Pressable>
                    <Pressable
                      style={styles.archiveActionBtn}
                      onPress={() => handleToggleArchive(item)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={styles.archiveActionText}>
                        {item.isArchived ? 'Przywróć' : 'Archiwizuj'}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Modal dodawania nowej paczki */}
      <BeanAddModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        beveragePreference={beveragePreference}
        canCreate={canCreate}
        onRequirePaywall={() => setShowPaywall(true)}
        onOpenCompendium={() => {
          setShowAddModal(false);
          setShowCompendium(true);
        }}
        presetTemplate={presetTemplate}
        onSaved={loadData}
      />

      {/* Modal edycji paczki (BR-MAG-001 & BR-MAG-004) */}
      <BeanEditModal
        visible={showEditModal}
        item={editingItem}
        onClose={() => {
          setShowEditModal(false);
          setEditingItem(null);
        }}
        beveragePreference={beveragePreference}
        canCreate={canCreate}
        onRequirePaywall={() => setShowPaywall(true)}
        onSaved={loadData}
        onDeleted={loadData}
      />

      {/* Modal: Kompendium Wiedzy (BR-WIEDZA-001 & BR-WIEDZA-002) */}
      <BeanCompendiumModal
        visible={showCompendium}
        onClose={() => setShowCompendium(false)}
        beveragePreference={beveragePreference}
        onUseTemplate={handleUseKnowledgeTemplate}
      />

      {/* Apps4Brew Pass Paywall Modal */}
      <Apps4BrewPassModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        onPurchaseSuccess={refresh}
        onSubscribed={refresh}
      />
    </View>
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
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  readOnlyText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.bgCard,
  },
  filterScroll: {
    flex: 1,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.bgCardSecondary,
    marginRight: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  filterChipActive: {
    backgroundColor: theme.colors.copperMuted,
    borderColor: theme.colors.copper,
  },
  filterChipText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: theme.colors.copper,
  },
  compendiumButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.bgCardSecondary,
    borderWidth: 1,
    borderColor: theme.colors.copper,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
    marginLeft: 8,
  },
  compendiumButtonText: {
    color: theme.colors.copper,
    fontSize: 12,
    fontWeight: '700',
  },
  addButton: {
    backgroundColor: theme.colors.copper,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
    marginLeft: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  listContent: {
    padding: theme.spacing.md,
    paddingBottom: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyBtn: {
    backgroundColor: theme.colors.copper,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.md,
  },
  emptyBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  itemCard: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 14,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  itemSubtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  favIcon: {
    fontSize: 22,
    color: theme.colors.border,
  },
  favIconActive: {
    color: '#FFD700',
  },
  restingBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  restingOptimal: {
    backgroundColor: 'rgba(78, 159, 61, 0.15)',
  },
  restingFresh: {
    backgroundColor: 'rgba(217, 119, 6, 0.15)',
  },
  restingPast: {
    backgroundColor: 'rgba(156, 163, 175, 0.15)',
  },
  restingText: {
    fontSize: 11,
    fontWeight: '700',
  },
  restingOptimalText: {
    color: '#4ade80',
  },
  restingFreshText: {
    color: '#fbbf24',
  },
  restingPastText: {
    color: '#9ca3af',
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
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  flavorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  flavorChip: {
    backgroundColor: theme.colors.copperMuted,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  flavorText: {
    fontSize: 11,
    color: theme.colors.copperLight,
    fontWeight: '600',
  },
  emptyStashBanner: {
    backgroundColor: 'rgba(217, 119, 6, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.3)',
    borderRadius: theme.borderRadius.sm,
    padding: 10,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  emptyStashText: {
    fontSize: 12,
    color: theme.colors.copperLight,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  archiveEmptyBtn: {
    backgroundColor: theme.colors.copper,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.borderRadius.sm,
  },
  archiveEmptyBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 12,
    marginTop: 4,
  },
  weightLabel: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginBottom: 2,
  },
  weightValue: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brewActionBtn: {
    backgroundColor: theme.colors.copper,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.sm,
  },
  brewActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  editActionBtn: {
    paddingVertical: 4,
  },
  editActionText: {
    color: theme.colors.copper,
    fontSize: 13,
    fontWeight: '600',
  },
  archiveActionBtn: {
    paddingVertical: 4,
  },
  archiveActionText: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
});
