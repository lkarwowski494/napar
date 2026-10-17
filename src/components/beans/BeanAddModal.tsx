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
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../core/theme';
import { saveInventoryItem } from '../../core/database';
import { InventoryItem } from '../../core/database-schema';
import { KnowledgeTemplate } from './BeanCompendiumModal';

export interface BeanAddModalProps {
  visible: boolean;
  onClose: () => void;
  beveragePreference?: 'coffee' | 'tea' | 'both';
  canCreate: boolean;
  onRequirePaywall: () => void;
  onOpenCompendium: () => void;
  presetTemplate?: KnowledgeTemplate | null;
  onSaved: () => void;
}

export const BeanAddModal: React.FC<BeanAddModalProps> = ({
  visible,
  onClose,
  beveragePreference,
  canCreate,
  onRequirePaywall,
  onOpenCompendium,
  presetTemplate,
  onSaved,
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<'coffee' | 'tea'>(() => {
    return beveragePreference === 'tea' ? 'tea' : 'coffee';
  });
  const [roaster, setRoaster] = useState('');
  const [origin, setOrigin] = useState('');
  const [variety, setVariety] = useState('');
  const [process, setProcess] = useState('');
  const [roastDate, setRoastDate] = useState(new Date().toISOString().slice(0, 10));
  const [roastProfile, setRoastProfile] = useState('light');
  const [initialWeight, setInitialWeight] = useState('250');
  const [notesStr, setNotesStr] = useState('');

  useEffect(() => {
    if (beveragePreference === 'tea') {
      setType('tea');
    } else if (beveragePreference === 'coffee') {
      setType('coffee');
    }
  }, [beveragePreference]);

  useEffect(() => {
    if (presetTemplate) {
      setName(presetTemplate.name || '');
      setType(presetTemplate.type || (beveragePreference === 'tea' ? 'tea' : 'coffee'));
      setRoaster('');
      setOrigin(presetTemplate.origin || '');
      setVariety(presetTemplate.variety || '');
      setProcess(presetTemplate.process || '');
      setRoastDate(new Date().toISOString().slice(0, 10));
      setRoastProfile('light');
      setInitialWeight('250');
      setNotesStr((presetTemplate.notes || []).join(', '));
    }
  }, [presetTemplate]);

  const resetForm = () => {
    setName('');
    setType(beveragePreference === 'tea' ? 'tea' : 'coffee');
    setRoaster('');
    setOrigin('');
    setVariety('');
    setProcess('');
    setRoastDate(new Date().toISOString().slice(0, 10));
    setRoastProfile('light');
    setInitialWeight('250');
    setNotesStr('');
  };

  const handleAddItem = () => {
    if (!canCreate) {
      onClose();
      onRequirePaywall();
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
    onSaved();
    onClose();
    resetForm();
    Alert.alert('Dodano!', `Paczka "${newItem.name}" jest gotowa w spiżarni.`);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom', 'left', 'right']}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Dodaj do Spiżarni</Text>
          <Pressable
            style={styles.modalCloseBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Anuluj"
          >
            <Text style={styles.modalCloseText}>Anuluj</Text>
          </Pressable>
        </View>

        <ScrollView style={styles.formScroll}>
          {/* Typ: Kawa vs Herbata — widoczny wyłącznie gdy preferencja to 'both' */}
          {(!beveragePreference || beveragePreference === 'both') && (
            <View style={styles.typeSelectorRow}>
              <Pressable
                style={[styles.typeBtn, type === 'coffee' && styles.typeBtnActive]}
                onPress={() => setType('coffee')}
              >
                <Text style={[styles.typeBtnText, type === 'coffee' && styles.typeBtnTextActive]}>
                  Kawa ziarnista
                </Text>
              </Pressable>
              <Pressable
                style={[styles.typeBtn, type === 'tea' && styles.typeBtnActive]}
                onPress={() => setType('tea')}
              >
                <Text style={[styles.typeBtnText, type === 'tea' && styles.typeBtnTextActive]}>
                  Herbata liściasta
                </Text>
              </Pressable>
            </View>
          )}

          <Pressable
            style={styles.compendiumPromptBtn}
            onPress={onOpenCompendium}
          >
            <Text style={styles.compendiumPromptText}>
              Szukasz inspiracji? Otwórz Bazę Wiedzy (odmiany, terroir, herbata)
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
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
  modalCloseBtn: {
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.bgCardSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    fontSize: 14,
    color: theme.colors.copper,
    fontWeight: '700',
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
