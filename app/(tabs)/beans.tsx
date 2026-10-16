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
  getUnitSystem,
} from '../../src/core/database';
import { InventoryItem } from '../../src/core/database-schema';
import { evaluateRestingWindow } from '../../src/core/domain-rules';
import { theme } from '../../src/core/theme';
import {
  searchCoffeeVarieties,
  searchCoffeeProcesses,
  searchCoffeeOrigins,
  searchTeaCategories,
} from '../../src/core/knowledge-data';
import { useAppAccess } from '../../src/core/app-access';
import { Apps4BrewPassModal } from '../../src/components/Apps4BrewPassModal';
import { formatDoseWeight } from '../../src/core/unit-converter';
import { BeansIcon } from '../../src/components/icons/CraftIcons';

export default function BeansScreen() {
  const router = useRouter();
  const { selectInventoryItem } = useBrew();
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
  const [compendiumTab, setCompendiumTab] = useState<'varieties' | 'processes' | 'origins' | 'tea'>('varieties');
  const [compendiumSearch, setCompendiumSearch] = useState('');

  // Formularz nowej paczki
  const [name, setName] = useState('');
  const [type, setType] = useState<'coffee' | 'tea'>('coffee');
  const [roaster, setRoaster] = useState('');
  const [origin, setOrigin] = useState('');
  const [variety, setVariety] = useState('');
  const [process, setProcess] = useState('');
  const [roastDate, setRoastDate] = useState(new Date().toISOString().slice(0, 10));
  const [roastProfile, setRoastProfile] = useState('light');
  const [initialWeight, setInitialWeight] = useState('250');
  const [notesStr, setNotesStr] = useState('');

  // Stan edycji paczki (BR-MAG-001 & BR-MAG-004)
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState<'coffee' | 'tea'>('coffee');
  const [editRoaster, setEditRoaster] = useState('');
  const [editOrigin, setEditOrigin] = useState('');
  const [editVariety, setEditVariety] = useState('');
  const [editProcess, setEditProcess] = useState('');
  const [editRoastDate, setEditRoastDate] = useState('');
  const [editRoastProfile, setEditRoastProfile] = useState('light');
  const [editInitialWeight, setEditInitialWeight] = useState('250');
  const [editRemainingWeight, setEditRemainingWeight] = useState('250');
  const [editNotesStr, setEditNotesStr] = useState('');
  const [editRating, setEditRating] = useState<number | undefined>(undefined);
  const [editIsArchived, setEditIsArchived] = useState(false);

  const filteredVarieties = searchCoffeeVarieties(compendiumSearch);
  const filteredProcesses = searchCoffeeProcesses(compendiumSearch);
  const filteredOrigins = searchCoffeeOrigins(compendiumSearch);
  const filteredTeas = searchTeaCategories(compendiumSearch);

  const handleUseKnowledgeTemplate = (template: {
    name: string;
    type: 'coffee' | 'tea';
    origin?: string;
    variety?: string;
    process?: string;
    notes: string[];
  }) => {
    if (!canCreate) {
      setShowCompendium(false);
      setShowPaywall(true);
      return;
    }
    setName(template.name);
    setType(template.type);
    if (template.origin) setOrigin(template.origin);
    if (template.variety) setVariety(template.variety);
    if (template.process) setProcess(template.process);
    setNotesStr(template.notes.join(', '));
    setShowCompendium(false);
    setShowAddModal(true);
  };

  const handleOpenAdd = () => {
    if (!canCreate) {
      setShowPaywall(true);
      return;
    }
    setShowAddModal(true);
  };

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
    if (!canCreate) {
      setShowAddModal(false);
      setShowPaywall(true);
      return;
    }
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
      variety: variety.trim() || undefined,
      process: process.trim() || undefined,
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
    setVariety('');
    setProcess('');
    setRoastDate(new Date().toISOString().slice(0, 10));
    setRoastProfile('light');
    setInitialWeight('250');
    setNotesStr('');
  };

  const handleOpenEdit = (item: InventoryItem) => {
    if (!canCreate) {
      setShowPaywall(true);
      return;
    }
    setEditingItem(item);
    setEditName(item.name);
    setEditType(item.type);
    setEditRoaster(item.roasterOrProducer || '');
    setEditOrigin(item.origin || '');
    setEditVariety(item.variety || '');
    setEditProcess(item.process || '');
    setEditRoastDate(item.roastOrHarvestDate || '');
    setEditRoastProfile(item.roastProfile || 'light');
    setEditInitialWeight(item.initialWeightGrams.toString());
    setEditRemainingWeight(item.remainingWeightGrams.toString());
    setEditNotesStr((item.flavorNotes || []).join(', '));
    setEditRating(item.rating);
    setEditIsArchived(item.isArchived);
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    if (!editingItem) return;
    if (!canCreate) {
      setShowEditModal(false);
      setShowPaywall(true);
      return;
    }
    if (!editName.trim()) {
      Alert.alert('Błąd', 'Podaj nazwę kawy lub herbaty.');
      return;
    }
    const initW = parseFloat(editInitialWeight) || 250;
    let remW = parseFloat(editRemainingWeight);
    if (isNaN(remW) || remW < 0) remW = 0;

    const notesArray = editNotesStr
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const isAutoArchived = remW === 0 ? true : editIsArchived;

    const updatedItem: InventoryItem = {
      ...editingItem,
      name: editName.trim(),
      type: editType,
      roasterOrProducer: editRoaster.trim() || undefined,
      origin: editOrigin.trim() || undefined,
      variety: editVariety.trim() || undefined,
      process: editProcess.trim() || undefined,
      roastOrHarvestDate: editRoastDate.trim() || undefined,
      roastProfile: editRoastProfile.trim() || undefined,
      initialWeightGrams: initW,
      remainingWeightGrams: remW,
      flavorNotes: notesArray,
      rating: editRating,
      isArchived: isAutoArchived,
      updatedAt: new Date().toISOString(),
    };

    saveInventoryItem(updatedItem);
    loadData();
    setShowEditModal(false);
    setEditingItem(null);
    Alert.alert('Zapisano!', `Paczka "${updatedItem.name}" została zaktualizowana.`);
  };

  const handleMarkAsFinished = () => {
    if (!editingItem) return;
    if (!canCreate) {
      setShowEditModal(false);
      setShowPaywall(true);
      return;
    }
    const updatedItem: InventoryItem = {
      ...editingItem,
      remainingWeightGrams: 0,
      isArchived: true,
      updatedAt: new Date().toISOString(),
    };
    saveInventoryItem(updatedItem);
    loadData();
    setShowEditModal(false);
    setEditingItem(null);
    Alert.alert('Zarchiwizowano', 'Paczka została oznaczona jako zużyta (0 g) i przeniesiona do archiwum.');
  };

  const handleDeleteItem = () => {
    if (!editingItem) return;
    if (!canCreate) {
      setShowEditModal(false);
      setShowPaywall(true);
      return;
    }
    Alert.alert(
      'Usunąć paczkę?',
      `Czy na pewno chcesz bezpowrotnie usunąć "${editingItem.name}" ze spiżarni?`,
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Usuń',
          style: 'destructive',
          onPress: () => {
            deleteInventoryItem(editingItem.id);
            loadData();
            setShowEditModal(false);
            setEditingItem(null);
          },
        },
      ]
    );
  };

  const handleAdjustRemainingWeight = (delta: number) => {
    if (!canCreate) {
      setShowEditModal(false);
      setShowPaywall(true);
      return;
    }
    const current = parseFloat(editRemainingWeight) || 0;
    const next = Math.max(0, Number((current + delta).toFixed(1)));
    setEditRemainingWeight(next.toString());
  };

  const handleSelectForBrew = (item: InventoryItem) => {
    selectInventoryItem(item);
    router.navigate('/(tabs)');
  };

  const handleToggleFavorite = (item: InventoryItem) => {
    if (!canCreate) {
      setShowPaywall(true);
      return;
    }
    saveInventoryItem({
      ...item,
      isFavorite: !item.isFavorite,
    });
    loadData();
  };

  const handleToggleArchive = (item: InventoryItem) => {
    if (!canCreate) {
      setShowPaywall(true);
      return;
    }
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

        <Pressable
          testID="compendium-open-button"
          style={styles.compendiumButton}
          onPress={() => setShowCompendium(true)}
        >
          <Text style={styles.compendiumButtonText}>📚 Baza wiedzy</Text>
        </Pressable>
        <Pressable testID="beans-add-button" style={styles.addButton} onPress={handleOpenAdd}>
          <Text style={styles.addButtonText}>+ Dodaj</Text>
        </Pressable>
      </View>

      {isHistoryReadOnly && (
        <View style={styles.readOnlyBanner}>
          <Text style={styles.readOnlyText}>
            🛡️ Spiżarnia w trybie Read-Only · Twoje paczki są bezpieczne. Odblokuj Apps4Brew Pass, aby dodawać nowe.
          </Text>
        </View>
      )}

      {/* Lista paczek */}
      <ScrollView contentContainerStyle={styles.listContent}>
        {filteredItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={{ marginBottom: 12 }}>
              <BeansIcon size={48} color={theme.colors.copper} />
            </View>
            <Text style={styles.emptyTitle}>Twoja spiżarnia jest pusta</Text>
            <Text style={styles.emptySub}>
              Dodaj świeżo wypaloną kawę lub ulubioną herbatę liściastą, aby śledzić okno świeżości i gramaturę.
            </Text>
            <Pressable testID="beans-empty-add-button" style={styles.emptyBtn} onPress={handleOpenAdd}>
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
                      {formatDoseWeight(item.remainingWeightGrams, unitSystem)} / {formatDoseWeight(item.initialWeightGrams, unitSystem)} ({remainingPercent}%)
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

                {/* Alert o zużyciu paczki (BR-MAG-004) */}
                {item.remainingWeightGrams === 0 && !item.isArchived && (
                  <View style={styles.emptyAlertBanner}>
                    <Text style={styles.emptyAlertText}>
                      ⚠️ Paczka skończona (0 g). Przenieść do archiwum?
                    </Text>
                    <Pressable
                      style={styles.emptyAlertBtn}
                      onPress={() => handleToggleArchive(item)}
                    >
                      <Text style={styles.emptyAlertBtnText}>Archiwizuj teraz</Text>
                    </Pressable>
                  </View>
                )}

                {/* Odmiana botaniczna i obróbka (BR-MAG-001) */}
                {(item.variety || item.process) && (
                  <View style={styles.varietyProcessRow}>
                    {item.variety ? (
                      <View style={styles.varietyChip}>
                        <Text style={styles.varietyChipText}>🌱 {item.variety}</Text>
                      </View>
                    ) : null}
                    {item.process ? (
                      <View style={styles.processChip}>
                        <Text style={styles.processChipText}>⚗️ {item.process}</Text>
                      </View>
                    ) : null}
                  </View>
                )}

                {/* Ocena paczki */}
                {item.rating !== undefined && item.rating > 0 && (
                  <View style={styles.ratingBadge}>
                    <Text style={styles.ratingBadgeText}>
                      {'★'.repeat(item.rating)}{'☆'.repeat(5 - item.rating)}
                    </Text>
                  </View>
                )}

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
                    style={styles.actionEditBtn}
                    onPress={() => handleOpenEdit(item)}
                  >
                    <Text style={styles.actionEditText}>✏️ Edytuj</Text>
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

            <Pressable
              style={styles.compendiumPromptBtn}
              onPress={() => {
                setShowAddModal(false);
                setShowCompendium(true);
              }}
            >
              <Text style={styles.compendiumPromptText}>
                💡 Szukasz inspiracji? Otwórz 📚 Bazę Wiedzy (odmiany, terroir, herbata)
              </Text>
            </Pressable>

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
                <Text style={styles.inputLabel}>Odmiana botaniczna</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="np. Geisha, SL28, Bourbon"
                  placeholderTextColor={theme.colors.textMuted}
                  value={variety}
                  onChangeText={setVariety}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.inputLabel}>Obróbka (Process)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="np. Washed, Natural, Honey"
                  placeholderTextColor={theme.colors.textMuted}
                  value={process}
                  onChangeText={setProcess}
                />
              </View>
            </View>

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

      {/* Modal edycji paczki (BR-MAG-001 & BR-MAG-004) */}
      <Modal visible={showEditModal} animationType="slide" transparent={false}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalTitle}>Edytuj Paczkę</Text>
              <Text style={styles.modalHeaderSub}>Koryguj wagę, parametry lub zarchiwizuj</Text>
            </View>
            <Pressable onPress={() => { setShowEditModal(false); setEditingItem(null); }}>
              <Text style={styles.modalCloseText}>Anuluj</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.formScroll}>
            {/* Typ: Kawa vs Herbata */}
            <View style={styles.typeSelectorRow}>
              <Pressable
                style={[styles.typeBtn, editType === 'coffee' && styles.typeBtnActive]}
                onPress={() => setEditType('coffee')}
              >
                <Text style={[styles.typeBtnText, editType === 'coffee' && styles.typeBtnTextActive]}>
                  ☕ Kawa ziarnista
                </Text>
              </Pressable>
              <Pressable
                style={[styles.typeBtn, editType === 'tea' && styles.typeBtnActive]}
                onPress={() => setEditType('tea')}
              >
                <Text style={[styles.typeBtnText, editType === 'tea' && styles.typeBtnTextActive]}>
                  🍵 Herbata liściasta
                </Text>
              </Pressable>
            </View>

            <Text style={styles.inputLabel}>Nazwa ziaren / herbaty *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="np. Etiopia Yirgacheffe Washed"
              placeholderTextColor={theme.colors.textMuted}
              value={editName}
              onChangeText={setEditName}
            />

            <Text style={styles.inputLabel}>Palarnia / Producent</Text>
            <TextInput
              style={styles.textInput}
              placeholder="np. Hard Beans, Coffeedesk, Wuyi Star"
              placeholderTextColor={theme.colors.textMuted}
              value={editRoaster}
              onChangeText={setEditRoaster}
            />

            <Text style={styles.inputLabel}>Kraj / Pochodzenie</Text>
            <TextInput
              style={styles.textInput}
              placeholder="np. Yirgacheffe, Etiopia"
              placeholderTextColor={theme.colors.textMuted}
              value={editOrigin}
              onChangeText={setEditOrigin}
            />

            <View style={styles.formRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Odmiana botaniczna</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="np. Geisha, SL28, Bourbon"
                  placeholderTextColor={theme.colors.textMuted}
                  value={editVariety}
                  onChangeText={setEditVariety}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.inputLabel}>Obróbka (Process)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="np. Washed, Natural, Honey"
                  placeholderTextColor={theme.colors.textMuted}
                  value={editProcess}
                  onChangeText={setEditProcess}
                />
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Data palenia / zbioru</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={theme.colors.textMuted}
                  value={editRoastDate}
                  onChangeText={setEditRoastDate}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.inputLabel}>Waga początkowa (g)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="250"
                  placeholderTextColor={theme.colors.textMuted}
                  keyboardType="numeric"
                  value={editInitialWeight}
                  onChangeText={setEditInitialWeight}
                />
              </View>
            </View>

            {/* Pozostała waga z szybkimi przyciskami korekty (BR-MAG-004) */}
            <View style={styles.weightEditSection}>
              <Text style={styles.inputLabel}>Pozostała waga w paczce (g) *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="np. 180"
                placeholderTextColor={theme.colors.textMuted}
                keyboardType="numeric"
                value={editRemainingWeight}
                onChangeText={setEditRemainingWeight}
              />
              <View style={styles.weightQuickButtonsRow}>
                <Pressable
                  style={styles.quickWeightBtn}
                  onPress={() => handleAdjustRemainingWeight(-15)}
                >
                  <Text style={styles.quickWeightBtnText}>-15 g</Text>
                </Pressable>
                <Pressable
                  style={styles.quickWeightBtn}
                  onPress={() => handleAdjustRemainingWeight(-18)}
                >
                  <Text style={styles.quickWeightBtnText}>-18 g</Text>
                </Pressable>
                <Pressable
                  style={styles.quickWeightBtn}
                  onPress={() => handleAdjustRemainingWeight(15)}
                >
                  <Text style={styles.quickWeightBtnText}>+15 g</Text>
                </Pressable>
                <Pressable
                  style={[styles.quickWeightBtn, styles.quickWeightZeroBtn]}
                  onPress={() => setEditRemainingWeight('0')}
                >
                  <Text style={styles.quickWeightZeroText}>0 g (pusta)</Text>
                </Pressable>
              </View>
            </View>

            <Text style={styles.inputLabel}>Nuty smakowe (po przecinku)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="np. jaśmin, brzoskwinia, bergamotka"
              placeholderTextColor={theme.colors.textMuted}
              value={editNotesStr}
              onChangeText={setEditNotesStr}
            />

            {/* Ocena paczki */}
            <Text style={styles.inputLabel}>Ocena paczki (1-5★)</Text>
            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Pressable
                  key={star}
                  onPress={() => setEditRating(editRating === star ? undefined : star)}
                  hitSlop={8}
                  style={styles.starBtn}
                >
                  <Text style={[styles.starIcon, (editRating || 0) >= star && styles.starIconActive]}>
                    ★
                  </Text>
                </Pressable>
              ))}
            </View>

            <Pressable style={styles.saveSubmitBtn} onPress={handleSaveEdit}>
              <Text style={styles.saveSubmitText}>Zapisz zmiany</Text>
            </Pressable>

            <Pressable style={styles.markFinishedBtn} onPress={handleMarkAsFinished}>
              <Text style={styles.markFinishedText}>📦 Oznacz jako zużytą i zarchiwizuj</Text>
            </Pressable>

            <Pressable style={styles.deletePackBtn} onPress={handleDeleteItem}>
              <Text style={styles.deletePackText}>🗑️ Usuń paczkę ze spiżarni</Text>
            </Pressable>
          </ScrollView>
        </View>
      </Modal>

      {/* Modal: Kompendium Wiedzy (BR-WIEDZA-001 & BR-WIEDZA-002) */}
      <Modal visible={showCompendium} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.compendiumModalContainer}>
          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalTitle}>📚 Kompendium Wiedzy</Text>
              <Text style={styles.compendiumHeaderSub}>Odmiany botaniczne, obróbki, terroir i herbaty</Text>
            </View>
            <Pressable testID="compendium-close-button" onPress={() => setShowCompendium(false)} hitSlop={10}>
              <Text style={styles.modalCloseText}>Zamknij</Text>
            </Pressable>
          </View>

          {/* Wyszukiwarka */}
          <View style={styles.compendiumSearchBox}>
            <TextInput
              style={styles.compendiumSearchInput}
              placeholder="Szukaj odmiany, kraju, nuty lub herbaty..."
              placeholderTextColor={theme.colors.textMuted}
              value={compendiumSearch}
              onChangeText={setCompendiumSearch}
            />
          </View>

          {/* Przełącznik zakładek */}
          <View style={styles.compendiumTabsRow}>
            <Pressable
              style={[styles.compTabBtn, compendiumTab === 'varieties' && styles.compTabBtnActive]}
              onPress={() => setCompendiumTab('varieties')}
            >
              <Text style={[styles.compTabText, compendiumTab === 'varieties' && styles.compTabTextActive]}>
                ☕ Odmiany ({filteredVarieties.length})
              </Text>
            </Pressable>
            <Pressable
              style={[styles.compTabBtn, compendiumTab === 'processes' && styles.compTabBtnActive]}
              onPress={() => setCompendiumTab('processes')}
            >
              <Text style={[styles.compTabText, compendiumTab === 'processes' && styles.compTabTextActive]}>
                ⚗️ Obróbki ({filteredProcesses.length})
              </Text>
            </Pressable>
            <Pressable
              style={[styles.compTabBtn, compendiumTab === 'origins' && styles.compTabBtnActive]}
              onPress={() => setCompendiumTab('origins')}
            >
              <Text style={[styles.compTabText, compendiumTab === 'origins' && styles.compTabTextActive]}>
                🌍 Terroir ({filteredOrigins.length})
              </Text>
            </Pressable>
            <Pressable
              style={[styles.compTabBtn, compendiumTab === 'tea' && styles.compTabBtnActive]}
              onPress={() => setCompendiumTab('tea')}
            >
              <Text style={[styles.compTabText, compendiumTab === 'tea' && styles.compTabTextActive]}>
                🍃 Herbaty ({filteredTeas.length})
              </Text>
            </Pressable>
          </View>

          {/* Zawartość zakładek */}
          <ScrollView style={styles.compendiumContent} contentContainerStyle={{ paddingBottom: 40 }}>
            {compendiumTab === 'varieties' &&
              filteredVarieties.map((v) => (
                <View key={v.id} style={styles.compCard}>
                  <View style={styles.compCardHeader}>
                    <Text style={styles.compCardTitle}>{v.name}</Text>
                    <Text style={styles.compCardTag}>{v.recommendedRoast}</Text>
                  </View>
                  <Text style={styles.compCardSub}>Pochodzenie: {v.nativeRegion}</Text>
                  <Text style={styles.compCardLineage}>Rodowód: {v.geneticLineage}</Text>
                  <Text style={styles.compCardSensory}>{v.sensoryProfilePl}</Text>
                  <Text style={styles.compCardDesc}>{v.descriptionPl}</Text>

                  <View style={styles.badgesRow}>
                    <View style={styles.badgePill}><Text style={styles.badgeText}>Kwasowość: {v.cupCharacteristics.acidity}</Text></View>
                    <View style={styles.badgePill}><Text style={styles.badgeText}>Body: {v.cupCharacteristics.body}</Text></View>
                    <View style={styles.badgePill}><Text style={styles.badgeText}>Słodycz: {v.cupCharacteristics.sweetness}</Text></View>
                  </View>

                  <View style={styles.notesTagsRow}>
                    {v.keyNotesPl.map((n, i) => (
                      <View key={i} style={styles.noteTag}><Text style={styles.noteTagText}>#{n}</Text></View>
                    ))}
                  </View>

                  <Pressable
                    style={styles.compUseBtn}
                    onPress={() =>
                      handleUseKnowledgeTemplate({
                        name: `${v.name} Specialty`,
                        type: 'coffee',
                        origin: v.nativeRegion.split('/')[0].trim(),
                        notes: v.keyNotesPl,
                      })
                    }
                  >
                    <Text style={styles.compUseBtnText}>+ Użyj jako szablon w spiżarni</Text>
                  </Pressable>
                </View>
              ))}

            {compendiumTab === 'processes' &&
              filteredProcesses.map((p) => (
                <View key={p.id} style={styles.compCard}>
                  <View style={styles.compCardHeader}>
                    <Text style={styles.compCardTitle}>{p.name}</Text>
                    <Text style={styles.compCardTag}>Suszenie: {p.dryingDurationDays}</Text>
                  </View>
                  <Text style={styles.compCardSub}>Zużycie wody: {p.waterConsumption}</Text>
                  <Text style={styles.compCardSensory}>{p.sensoryImpactPl}</Text>
                  <Text style={styles.compCardDesc}>{p.descriptionPl}</Text>

                  <View style={styles.notesTagsRow}>
                    {p.keyNotesPl.map((n, i) => (
                      <View key={i} style={styles.noteTag}><Text style={styles.noteTagText}>#{n}</Text></View>
                    ))}
                  </View>
                </View>
              ))}

            {compendiumTab === 'origins' &&
              filteredOrigins.map((o) => (
                <View key={o.id} style={styles.compCard}>
                  <View style={styles.compCardHeader}>
                    <Text style={styles.compCardTitle}>{`${o.country} (${o.countryCode})`}</Text>
                    <Text style={styles.compCardTag}>{o.typicalAltitudeMeters}</Text>
                  </View>
                  <Text style={styles.compCardSub}>Główne regiony: {o.primaryRegions.join(', ')}</Text>
                  <Text style={styles.compCardLineage}>Zbiory: {o.harvestMonths} · Odmiany: {o.mainVarieties.join(', ')}</Text>
                  <Text style={styles.compCardSensory}>{o.flavorProfilePl}</Text>
                  <Text style={styles.compCardDesc}>{o.descriptionPl}</Text>

                  <Pressable
                    style={styles.compUseBtn}
                    onPress={() =>
                      handleUseKnowledgeTemplate({
                        name: `${o.country} ${o.primaryRegions[0]} Washed`,
                        type: 'coffee',
                        origin: `${o.primaryRegions[0]}, ${o.country}`,
                        notes: o.keyNotesPl,
                      })
                    }
                  >
                    <Text style={styles.compUseBtnText}>+ Użyj jako szablon w spiżarni</Text>
                  </Pressable>
                </View>
              ))}

            {compendiumTab === 'tea' &&
              filteredTeas.map((t) => (
                <View key={t.id} style={styles.compCard}>
                  <View style={styles.compCardHeader}>
                    <Text style={styles.compCardTitle}>{`${t.namePl} · ${t.traditionalName}`}</Text>
                    <Text style={styles.compCardTag}>Oksydacja: {t.oxidationRangePercent}</Text>
                  </View>
                  <Text style={styles.compCardSub}>Temperatura parzenia: {t.waterTemperatureCelsius}°C</Text>
                  <Text style={styles.compCardLineage}>Metoda Sha Qing: {t.killGreenMethod}</Text>
                  <Text style={styles.compCardSensory}>{t.sensoryProfilePl}</Text>
                  <Text style={styles.compCardDesc}>Słynne odmiany: {t.famousVarietiesPl.join(', ')}</Text>
                  <Text style={styles.compCardHealth}>✨ {t.healthAttributesPl}</Text>

                  <Pressable
                    style={styles.compUseBtn}
                    onPress={() =>
                      handleUseKnowledgeTemplate({
                        name: t.famousVarietiesPl[0].split('(')[0].trim(),
                        type: 'tea',
                        origin: t.famousRegions[0].split('(')[0].trim(),
                        notes: [t.namePl, 'Tradycyjna'],
                      })
                    }
                  >
                    <Text style={styles.compUseBtnText}>+ Użyj jako szablon w spiżarni</Text>
                  </Pressable>
                </View>
              ))}
          </ScrollView>
        </View>
      </Modal>

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
  },
  readOnlyText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '600',
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
  emptyAlertBanner: {
    backgroundColor: 'rgba(255, 149, 0, 0.12)',
    borderWidth: 1,
    borderColor: '#FF9500',
    borderRadius: theme.borderRadius.sm,
    padding: 10,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  emptyAlertText: {
    fontSize: 12,
    color: theme.colors.textPrimary,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  emptyAlertBtn: {
    backgroundColor: theme.colors.copper,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.sm,
  },
  emptyAlertBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  varietyProcessRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  varietyChip: {
    backgroundColor: theme.colors.bgCardSecondary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  varietyChipText: {
    fontSize: 11,
    color: theme.colors.copperLight,
    fontWeight: '600',
  },
  processChip: {
    backgroundColor: theme.colors.bgCardSecondary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  processChipText: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  ratingBadge: {
    marginBottom: 8,
  },
  ratingBadgeText: {
    color: '#FFD700',
    fontSize: 14,
    letterSpacing: 2,
  },
  itemActionsRow: {
    flexDirection: 'row',
    gap: 8,
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
  actionEditBtn: {
    flex: 1,
    backgroundColor: theme.colors.bgCardSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
  },
  actionEditText: {
    color: theme.colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
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
  weightEditSection: {
    marginVertical: 4,
  },
  weightQuickButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
    marginBottom: 8,
  },
  quickWeightBtn: {
    flex: 1,
    backgroundColor: theme.colors.bgCardSecondary,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  quickWeightBtnText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  quickWeightZeroBtn: {
    borderColor: theme.colors.copperMuted,
    backgroundColor: theme.colors.copperMuted,
  },
  quickWeightZeroText: {
    fontSize: 12,
    color: theme.colors.copperLight,
    fontWeight: '700',
  },
  starRow: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 8,
  },
  starBtn: {
    padding: 4,
  },
  starIcon: {
    fontSize: 26,
    color: theme.colors.border,
  },
  starIconActive: {
    color: '#FFD700',
  },
  markFinishedBtn: {
    backgroundColor: theme.colors.bgCardSecondary,
    borderWidth: 1,
    borderColor: theme.colors.copper,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginBottom: 12,
  },
  markFinishedText: {
    color: theme.colors.copper,
    fontSize: 14,
    fontWeight: '700',
  },
  deletePackBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: theme.colors.danger,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginBottom: 40,
  },
  deletePackText: {
    color: theme.colors.danger,
    fontSize: 14,
    fontWeight: '700',
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
  modalHeaderSub: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2,
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
  compendiumButton: {
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
  compendiumPromptBtn: {
    backgroundColor: theme.colors.bgCardSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: 12,
    marginBottom: 16,
  },
  compendiumPromptText: {
    color: theme.colors.copperLight,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  compendiumModalContainer: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    padding: theme.spacing.md,
  },
  compendiumHeaderSub: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  compendiumSearchBox: {
    marginBottom: 12,
  },
  compendiumSearchInput: {
    backgroundColor: theme.colors.bgCard,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: theme.colors.textPrimary,
    fontSize: 14,
  },
  compendiumTabsRow: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 6,
  },
  compTabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.bgCardSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  compTabBtnActive: {
    backgroundColor: theme.colors.copperMuted,
    borderColor: theme.colors.copper,
  },
  compTabText: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  compTabTextActive: {
    color: theme.colors.copper,
    fontWeight: '700',
  },
  compendiumContent: {
    flex: 1,
  },
  compCard: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.md,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  compCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  compCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    flex: 1,
  },
  compCardTag: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.copper,
    backgroundColor: theme.colors.copperMuted,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.full,
    overflow: 'hidden',
  },
  compCardSub: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '600',
    marginBottom: 2,
  },
  compCardLineage: {
    fontSize: 11,
    color: theme.colors.textMuted,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  compCardSensory: {
    fontSize: 13,
    color: theme.colors.textPrimary,
    lineHeight: 18,
    marginBottom: 8,
  },
  compCardDesc: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    lineHeight: 16,
    marginBottom: 8,
  },
  compCardHealth: {
    fontSize: 12,
    color: '#4ade80',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  badgePill: {
    backgroundColor: theme.colors.bgCardSecondary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  badgeText: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  notesTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  noteTag: {
    backgroundColor: theme.colors.copperMuted,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  noteTagText: {
    fontSize: 11,
    color: theme.colors.copperLight,
    fontWeight: '600',
  },
  compUseBtn: {
    backgroundColor: theme.colors.copper,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
    marginTop: 4,
  },
  compUseBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
