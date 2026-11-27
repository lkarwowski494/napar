// ============================================================================
// Napar — Spiżarnia Ziaren i Liści (Inventory / Stash)
// Śledzenie świeżości (Resting Window), wagi w paczce i nut sensorycznych
// ============================================================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useBrew } from '../../src/core/brew-context';
import { useTranslation } from '../../src/core/i18n';
import {
  getInventoryItems,
  saveInventoryItem,
  getUnitSystem,
} from '../../src/data/database';
import { InventoryItem } from '../../src/core/database-schema';
import { theme } from '../../src/core/theme';
import { BeansIcon } from '../../src/components/icons/CraftIcons';
import { BeanCompendiumModal, KnowledgeTemplate } from '../../src/components/beans/BeanCompendiumModal';
import { BeanAddModal } from '../../src/components/beans/BeanAddModal';
import { BeanEditModal } from '../../src/components/beans/BeanEditModal';
import { BeanTopBar } from '../../src/components/beans/BeanTopBar';
import { BeanItemCard } from '../../src/components/beans/BeanItemCard';
import { runSave } from '../../lib/save-feedback';

export default function BeansScreen() {
  const router = useRouter();
  const { selectInventoryItem, beveragePreference, reloadFromDatabase } = useBrew();
  const { t } = useTranslation();
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>(() => {
    try {
      return getUnitSystem();
    } catch {
      return 'metric';
    }
  });

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'coffee' | 'tea' | 'archived'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCompendium, setShowCompendium] = useState(false);
  const [presetTemplate, setPresetTemplate] = useState<KnowledgeTemplate | null>(null);
  const pendingOpenCompendiumRef = useRef(false);
  const pendingOpenAddRef = useRef(false);

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

  const loadData = useCallback(() => {
    try {
      const all = getInventoryItems(true);
      setItems(all);
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

  const handleOpenAdd = () => {
    setPresetTemplate(null);
    setShowAddModal(true);
  };

  const handleUseKnowledgeTemplate = (template: KnowledgeTemplate) => {
    setPresetTemplate({ ...template });
    if (Platform.OS === 'ios' && showCompendium) {
      pendingOpenAddRef.current = true;
      setShowCompendium(false);
    } else {
      setShowCompendium(false);
      setShowAddModal(true);
    }
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
    if (!runSave(() => saveInventoryItem(updated), t.common)) return;
    loadData();
  };

  const handleToggleArchive = (item: InventoryItem) => {
    const updated: InventoryItem = {
      ...item,
      isArchived: !item.isArchived,
      updatedAt: new Date().toISOString(),
    };
    if (!runSave(() => saveInventoryItem(updated), t.common)) return;
    loadData();
    reloadFromDatabase?.();
  };

  const handleSelectForBrew = (item: InventoryItem) => {
    selectInventoryItem(item);
    router.navigate('/(tabs)');
  };

  const handleInventoryMutated = () => {
    loadData();
    reloadFromDatabase?.();
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
    <View testID="ekran:(tabs)/beans" style={styles.container}>

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
            <Text style={styles.emptyTitle}>{t.stash?.emptyTitle || 'Twoja spiżarnia jest pusta'}</Text>
            <Text style={styles.emptySub}>
              {t.stash.emptyDesc}
            </Text>
            <Pressable
              style={styles.emptyBtn}
              onPress={handleOpenAdd}
              accessibilityRole="button"
              accessibilityLabel={t.stash.emptyAddFirstBtn}
            >
              <Text style={styles.emptyBtnText}>{t.stash.emptyAddFirstBtn}</Text>
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
        onClose={() => {
          pendingOpenCompendiumRef.current = false;
          setShowAddModal(false);
        }}
        onDismiss={() => {
          if (pendingOpenCompendiumRef.current) {
            pendingOpenCompendiumRef.current = false;
            setShowCompendium(true);
          }
        }}
        beveragePreference={beveragePreference}
        onOpenCompendium={() => {
          if (Platform.OS === 'ios' && showAddModal) {
            pendingOpenCompendiumRef.current = true;
            setShowAddModal(false);
          } else {
            setShowAddModal(false);
            setShowCompendium(true);
          }
        }}
        presetTemplate={presetTemplate}
        onSaved={handleInventoryMutated}
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
        onSaved={handleInventoryMutated}
        onDeleted={handleInventoryMutated}
      />

      {/* Modal: Kompendium Wiedzy (BR-WIEDZA-001 & BR-WIEDZA-002) */}
      <BeanCompendiumModal
        visible={showCompendium}
        onClose={() => {
          pendingOpenAddRef.current = false;
          setShowCompendium(false);
        }}
        onDismiss={() => {
          if (pendingOpenAddRef.current) {
            pendingOpenAddRef.current = false;
            setShowAddModal(true);
          }
        }}
        beveragePreference={beveragePreference}
        onUseTemplate={handleUseKnowledgeTemplate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
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
    color: theme.colors.onAccent,
    fontWeight: '700',
    fontSize: 14,
  },
});
