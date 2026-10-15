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
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useBrew } from '../../src/core/brew-context';
import {
  getInventoryItems,
  saveInventoryItem,
  deleteInventoryItem,
} from '../../src/core/database';
import { InventoryItem } from '../../src/core/database-schema';
import { evaluateRestingWindow } from '../../src/core/domain-rules';
import { theme } from '../../src/core/theme';

export default function BeansScreen() {
  const router = useRouter();
  const { selectInventoryItem } = useBrew();

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'coffee' | 'tea' | 'archived'>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // Formularz nowej paczki
  const [name, setName] = useState('');
  const [type, setType] = useState<'coffee' | 'tea'>('coffee');
  const [roaster, setRoaster] = useState('');
  const [origin, setOrigin] = useState('');
  const [roastDate, setRoastDate] = useState(new Date().toISOString().slice(0, 10));
  const [roastProfile, setRoastProfile] = useState('light');
  const [initialWeight, setInitialWeight] = useState('250');
  const [notesStr, setNotesStr] = useState('');

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

  const handleAddItem = () => {
    if (!name.trim()) {
      Alert.alert('Błąd', 'Podaj nazwę kawy lub herbaty.');
      return;
    }
    const weightNum = parseFloat(initialWeight) || 250;
    const notesArray = notesStr
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const newItem: InventoryItem = {
      id: `item-${Date.now()}`,
      name: name.trim(),
      type,
      roasterOrProducer: roaster.trim() || undefined,
      origin: origin.trim() || undefined,
      roastOrHarvestDate: roastDate.trim() || undefined,
      roastProfile: roastProfile.trim() || undefined,
      initialWeightGrams: weightNum,
      remainingWeightGrams: weightNum,
      flavorNotes: notesArray,
      isFavorite: false,
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveInventoryItem(newItem);
    loadData();
    setShowAddModal(false);
    resetForm();
    Alert.alert('Dodano!', `Paczka "${newItem.name}" jest gotowa w spiżarni.`);
  };

  const resetForm = () => {
    setName('');
    setType('coffee');
    setRoaster('');
    setOrigin('');
    setRoastDate(new Date().toISOString().slice(0, 10));
    setRoastProfile('light');
    setInitialWeight('250');
    setNotesStr('');
  };

  const handleSelectForBrew = (item: InventoryItem) => {
    selectInventoryItem(item);
    router.navigate('/(tabs)');
  };

  const handleToggleFavorite = (item: InventoryItem) => {
    saveInventoryItem({
      ...item,
      isFavorite: !item.isFavorite,
    });
    loadData();
  };

  const handleToggleArchive = (item: InventoryItem) => {
    saveInventoryItem({
      ...item,
      isArchived: !item.isArchived,
    });
    loadData();
  };

  const filteredItems = items.filter((item) => {
    if (filter === 'archived') return item.isArchived;
    if (item.isArchived) return false;
    if (filter === 'coffee') return item.type === 'coffee';
    if (filter === 'tea') return item.type === 'tea';
    return true;
  });

  return (
    <View style={styles.container}>
      {/* Pasek filtrów i dodawania */}
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
              Kawa ☕
            </Text>
          </Pressable>
          <Pressable
            style={[styles.filterChip, filter === 'tea' && styles.filterChipActive]}
            onPress={() => setFilter('tea')}
          >
            <Text style={[styles.filterChipText, filter === 'tea' && styles.filterChipTextActive]}>
              Herbata 🍵
            </Text>
          </Pressable>
          <Pressable
            style={[styles.filterChip, filter === 'archived' && styles.filterChipActive]}
            onPress={() => setFilter('archived')}
          >
            <Text style={[styles.filterChipText, filter === 'archived' && styles.filterChipTextActive]}>
              Archiwum 📦
            </Text>
          </Pressable>
        </ScrollView>

        <Pressable style={styles.addButton} onPress={() => setShowAddModal(true)}>
          <Text style={styles.addButtonText}>+ Dodaj</Text>
        </Pressable>
      </View>

      {/* Lista paczek */}
      <ScrollView contentContainerStyle={styles.listContent}>
        {filteredItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🫙</Text>
            <Text style={styles.emptyTitle}>Twoja spiżarnia jest pusta</Text>
            <Text style={styles.emptySub}>
              Dodaj świeżo wypaloną kawę lub ulubioną herbatę liściastą, aby śledzić okno świeżości i gramaturę.
            </Text>
            <Pressable style={styles.emptyBtn} onPress={() => setShowAddModal(true)}>
              <Text style={styles.emptyBtnText}>+ Dodaj pierwszą paczkę</Text>
            </Pressable>
          </View>
        ) : (
          filteredItems.map((item) => {
            const resting =
              item.type === 'coffee' && item.roastOrHarvestDate
                ? evaluateRestingWindow(item.roastOrHarvestDate)
                : null;

            const remainingPercent = Math.min(
              100,
              Math.max(0, Math.round((item.remainingWeightGrams / item.initialWeightGrams) * 100))
            );

            return (
              <View key={item.id} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemSubtitle}>
                      {item.roasterOrProducer || 'Rzemieślnicza palarnia'} · {item.origin || ''}
                    </Text>
                  </View>
                  <Pressable onPress={() => handleToggleFavorite(item)} hitSlop={10}>
                    <Text style={[styles.favIcon, item.isFavorite && styles.favIconActive]}>
                      ★
                    </Text>
                  </Pressable>
                </View>

                {/* Badge świeżości (Resting Window) */}
                {resting && (
                  <View
                    style={[
                      styles.restingBadge,
                      resting.stage === 'peak' && styles.restingPeak,
                      resting.stage === 'degassing' && styles.restingDegas,
                      resting.stage === 'stable' && styles.restingStable,
                      resting.stage === 'aging' && styles.restingAging,
                    ]}
                  >
                    <Text style={styles.restingBadgeText}>
                      {resting.stage === 'peak' ? '🟢 ' : resting.stage === 'degassing' ? '🟠 ' : '🔵 '}
                      {resting.messagePl} ({resting.daysSinceRoast} dni od palenia)
                    </Text>
                  </View>
                )}

                {/* Wskaźnik zapasu w paczce */}
                <View style={styles.weightSection}>
                  <View style={styles.weightLabelRow}>
                    <Text style={styles.weightLabel}>Zapas w paczce:</Text>
                    <Text style={styles.weightValue}>
                      {item.remainingWeightGrams} g / {item.initialWeightGrams} g ({remainingPercent}%)
                    </Text>
                  </View>
                  <View style={styles.weightTrack}>
                    <View
                      style={[
                        styles.weightFill,
                        {
                          width: `${remainingPercent}%`,
                          backgroundColor:
                            remainingPercent < 20 ? theme.colors.danger : theme.colors.copper,
                        },
                      ]}
                    />
                  </View>
                </View>

                {/* Nuty sensoryczne */}
                {item.flavorNotes && item.flavorNotes.length > 0 && (
                  <View style={styles.notesRow}>
                    {item.flavorNotes.map((note, idx) => (
                      <View key={idx} style={styles.noteChip}>
                        <Text style={styles.noteChipText}>{note}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Akcje */}
                <View style={styles.itemActionsRow}>
                  <Pressable
                    style={styles.actionBrewBtn}
                    onPress={() => handleSelectForBrew(item)}
                  >
                    <Text style={styles.actionBrewText}>☕ Parz z tych ziaren</Text>
                  </Pressable>
                  <Pressable
                    style={styles.actionArchiveBtn}
                    onPress={() => handleToggleArchive(item)}
                  >
                    <Text style={styles.actionArchiveText}>
                      {item.isArchived ? 'Przywróć' : 'Archiwizuj'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Modal dodawania nowej paczki */}
      <Modal visible={showAddModal} animationType="slide" transparent={false}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Dodaj do Spiżarni</Text>
            <Pressable onPress={() => setShowAddModal(false)}>
              <Text style={styles.modalCloseText}>Anuluj</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.formScroll}>
            {/* Typ: Kawa vs Herbata */}
            <View style={styles.typeSelectorRow}>
              <Pressable
                style={[styles.typeBtn, type === 'coffee' && styles.typeBtnActive]}
                onPress={() => setType('coffee')}
              >
                <Text style={[styles.typeBtnText, type === 'coffee' && styles.typeBtnTextActive]}>
                  ☕ Kawa ziarnista
                </Text>
              </Pressable>
              <Pressable
                style={[styles.typeBtn, type === 'tea' && styles.typeBtnActive]}
                onPress={() => setType('tea')}
              >
                <Text style={[styles.typeBtnText, type === 'tea' && styles.typeBtnTextActive]}>
                  🍵 Herbata liściasta
                </Text>
              </Pressable>
            </View>

            <Text style={styles.inputLabel}>Nazwa ziaren / herbaty *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="np. Etiopia Yirgacheffe Washed"
              placeholderTextColor={theme.colors.textMuted}
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.inputLabel}>Palarnia / Producent</Text>
            <TextInput
              style={styles.textInput}
              placeholder="np. Hard Beans, Coffeedesk, Wuyi Star"
              placeholderTextColor={theme.colors.textMuted}
              value={roaster}
              onChangeText={setRoaster}
            />

            <Text style={styles.inputLabel}>Kraj / Pochodzenie</Text>
            <TextInput
              style={styles.textInput}
              placeholder="np. Yirgacheffe, Etiopia"
              placeholderTextColor={theme.colors.textMuted}
              value={origin}
              onChangeText={setOrigin}
            />

            <View style={styles.formRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Data palenia / zbioru</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={theme.colors.textMuted}
                  value={roastDate}
                  onChangeText={setRoastDate}
                />
              </View>

              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.inputLabel}>Waga paczki (g)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="250"
                  placeholderTextColor={theme.colors.textMuted}
                  keyboardType="numeric"
                  value={initialWeight}
                  onChangeText={setInitialWeight}
                />
              </View>
            </View>

            <Text style={styles.inputLabel}>Nuty smakowe (po przecinku)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="np. jaśmin, brzoskwinia, bergamotka"
              placeholderTextColor={theme.colors.textMuted}
              value={notesStr}
              onChangeText={setNotesStr}
            />

            <Pressable style={styles.saveSubmitBtn} onPress={handleAddItem}>
              <Text style={styles.saveSubmitText}>Zapisz w Spiżarni</Text>
            </Pressable>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
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
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
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
    paddingVertical: 6,
    borderRadius: theme.borderRadius.sm,
    marginBottom: 10,
  },
  restingPeak: {
    backgroundColor: theme.colors.statusPeakMuted,
  },
  restingDegas: {
    backgroundColor: theme.colors.copperMuted,
  },
  restingStable: {
    backgroundColor: 'rgba(61, 132, 168, 0.15)',
  },
  restingAging: {
    backgroundColor: 'rgba(120, 120, 128, 0.15)',
  },
  restingBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  weightSection: {
    marginBottom: 12,
  },
  weightLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  weightLabel: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  weightValue: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  weightTrack: {
    width: '100%',
    height: 6,
    backgroundColor: theme.colors.bgCardSecondary,
    borderRadius: 3,
    overflow: 'hidden',
  },
  weightFill: {
    height: '100%',
  },
  notesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  noteChip: {
    backgroundColor: theme.colors.bgCardSecondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
  },
  noteChipText: {
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
  itemActionsRow: {
    flexDirection: 'row',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 12,
  },
  actionBrewBtn: {
    flex: 2,
    backgroundColor: theme.colors.copperMuted,
    borderWidth: 1,
    borderColor: theme.colors.copper,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
  },
  actionBrewText: {
    color: theme.colors.copperLight,
    fontWeight: '700',
    fontSize: 13,
  },
  actionArchiveBtn: {
    flex: 1,
    backgroundColor: theme.colors.bgCardSecondary,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
  },
  actionArchiveText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    padding: theme.spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  modalCloseText: {
    fontSize: 16,
    color: theme.colors.copper,
    fontWeight: '600',
  },
  formScroll: {
    flex: 1,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.bgCard,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  typeBtnActive: {
    borderColor: theme.colors.copper,
    backgroundColor: theme.colors.copperMuted,
  },
  typeBtnText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  typeBtnTextActive: {
    color: theme.colors.copperLight,
    fontWeight: '700',
  },
  inputLabel: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 8,
  },
  textInput: {
    backgroundColor: theme.colors.bgCard,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: theme.colors.textPrimary,
    fontSize: 15,
    marginBottom: 8,
  },
  formRow: {
    flexDirection: 'row',
  },
  saveSubmitBtn: {
    backgroundColor: theme.colors.copper,
    paddingVertical: 16,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  saveSubmitText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
