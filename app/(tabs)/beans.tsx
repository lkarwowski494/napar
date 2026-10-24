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
import { theme } from '../../src/core/theme';
import { useAppAccess } from '../../src/core/app-access';
import { Apps4BrewPassModal } from '../../src/components/Apps4BrewPassModal';
import { BeansIcon, ShieldIcon } from '../../src/components/icons/CraftIcons';
import { BeanCompendiumModal, KnowledgeTemplate } from '../../src/components/beans/BeanCompendiumModal';
import { BeanAddModal } from '../../src/components/beans/BeanAddModal';
import { BeanEditModal } from '../../src/components/beans/BeanEditModal';
import { BeanTopBar } from '../../src/components/beans/BeanTopBar';
import { BeanItemCard } from '../../src/components/beans/BeanItemCard';

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
      <BeanTopBar
        items={items}
        filter={filter}
        onFilterChange={setFilter}
        onOpenCompendium={() => setShowCompendium(true)}
        onOpenAdd={handleOpenAdd}
      />

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
            <Pressable
              style={styles.emptyBtn}
              onPress={handleOpenAdd}
              accessibilityRole="button"
              accessibilityLabel="+ Dodaj pierwszą paczkę"
            >
              <Text style={styles.emptyBtnText}>+ Dodaj pierwszą paczkę</Text>
            </Pressable>
          </View>
        ) : (
          filteredItems.map((item) => (
            <BeanItemCard
              key={item.id}
              item={item}
              unitSystem={unitSystem}
              onToggleFavorite={handleToggleFavorite}
              onToggleArchive={handleToggleArchive}
              onSelectForBrew={handleSelectForBrew}
              onOpenEdit={handleOpenEdit}
            />
          ))
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
  listContent: {
    padding: theme.spacing.md,
    paddingBottom: 40,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
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
    marginBottom: 24,
  },
  emptyBtn: {
    backgroundColor: theme.colors.copper,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.full,
    minHeight: 48,
    justifyContent: 'center',
  },
  emptyBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
