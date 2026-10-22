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
import { parseDecimal } from '../../core/parse-decimal';
import { confirm } from '../../core/confirm';
import { saveInventoryItem, deleteInventoryItem } from '../../core/database';
import { InventoryItem } from '../../core/database-schema';

export interface BeanEditModalProps {
  visible: boolean;
  item: InventoryItem | null;
  onClose: () => void;
  beveragePreference?: 'coffee' | 'tea' | 'both';
  onSaved: () => void;
  onDeleted: () => void;
}

export const BeanEditModal: React.FC<BeanEditModalProps> = ({
  visible,
  item,
  onClose,
  beveragePreference,
  onSaved,
  onDeleted,
}) => {
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

  useEffect(() => {
    if (item) {
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
    }
  }, [item]);

  const handleAdjustRemainingWeight = (delta: number) => {
    const cur = parseDecimal(editRemainingWeight) || 0;
    const next = Math.max(0, cur + delta);
    setEditRemainingWeight(next.toString());
  };

  const handleSaveEdit = () => {
    if (!item) return;
    if (!editName.trim()) {
      Alert.alert('Błąd', 'Podaj nazwę kawy lub herbaty.');
      return;
    }
    const initW = parseDecimal(editInitialWeight) || 250;
    let remW = parseDecimal(editRemainingWeight);
    if (isNaN(remW) || remW < 0) remW = 0;

    const notesArray = editNotesStr
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const isAutoArchived = remW === 0 ? true : editIsArchived;

    const updatedItem: InventoryItem = {
      ...item,
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
    onSaved();
    onClose();
    Alert.alert('Zapisano!', `Paczka "${updatedItem.name}" została zaktualizowana.`);
  };

  const handleMarkAsFinished = () => {
    if (!item) return;
    const updatedItem: InventoryItem = {
      ...item,
      remainingWeightGrams: 0,
      isArchived: true,
      updatedAt: new Date().toISOString(),
    };
    saveInventoryItem(updatedItem);
    onSaved();
    onClose();
    Alert.alert('Zarchiwizowano', 'Paczka została oznaczona jako zużyta (0 g) i przeniesiona do archiwum.');
  };

  // Trwałe usunięcie wyłącznie po potwierdzeniu (lib/confirm, CLAUDE.md §2.2 / S5)
  const handleDeleteItem = () => {
    if (!item) return;
    confirm({
      title: 'Usunąć paczkę?',
      message: `Czy na pewno chcesz bezpowrotnie usunąć "${item.name}" ze spiżarni?`,
      confirmText: 'Usuń',
      destructive: true,
      onConfirm: () => {
        deleteInventoryItem(item.id);
        onDeleted();
        onClose();
      },
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom', 'left', 'right']}>
        <View style={styles.modalHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.modalTitle}>Edytuj Paczkę</Text>
            <Text style={styles.modalHeaderSub}>Koryguj wagę, parametry lub zarchiwizuj</Text>
          </View>
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
                style={[styles.typeBtn, editType === 'coffee' && styles.typeBtnActive, styles.touchTarget]}
                onPress={() => setEditType('coffee')}
              >
                <Text style={[styles.typeBtnText, editType === 'coffee' && styles.typeBtnTextActive]}>
                  Kawa ziarnista
                </Text>
              </Pressable>
              <Pressable
                style={[styles.typeBtn, editType === 'tea' && styles.typeBtnActive, styles.touchTarget]}
                onPress={() => setEditType('tea')}
              >
                <Text style={[styles.typeBtnText, editType === 'tea' && styles.typeBtnTextActive]}>
                  Herbata liściasta
                </Text>
              </Pressable>
            </View>
          )}

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
                style={[styles.quickWeightBtn, styles.touchTarget]}
                onPress={() => handleAdjustRemainingWeight(-15)}
              >
                <Text style={styles.quickWeightBtnText}>-15 g</Text>
              </Pressable>
              <Pressable
                style={[styles.quickWeightBtn, styles.touchTarget]}
                onPress={() => handleAdjustRemainingWeight(-18)}
              >
                <Text style={styles.quickWeightBtnText}>-18 g</Text>
              </Pressable>
              <Pressable
                style={[styles.quickWeightBtn, styles.touchTarget]}
                onPress={() => handleAdjustRemainingWeight(15)}
              >
                <Text style={styles.quickWeightBtnText}>+15 g</Text>
              </Pressable>
              <Pressable
                style={[styles.quickWeightBtn, styles.quickWeightZeroBtn, styles.touchTarget]}
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
          <Text style={styles.inputLabel}>Ocena paczki (1-5)</Text>
          <View style={styles.starRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Pressable
                key={star}
                onPress={() => setEditRating(editRating === star ? undefined : star)}
                hitSlop={8}
                style={[styles.starBtn, styles.touchTarget]}
              >
                <Text style={[styles.starIcon, (editRating || 0) >= star && styles.starIconActive]}>
                  ★
                </Text>
              </Pressable>
            ))}
          </View>

          <Pressable
            style={[styles.saveSubmitBtn, styles.touchTarget]}
            onPress={handleSaveEdit}
            accessibilityRole="button"
            accessibilityLabel="Zapisz zmiany"
          >
            <Text style={styles.saveSubmitText}>Zapisz zmiany</Text>
          </Pressable>

          <Pressable
            style={[styles.markFinishedBtn, styles.touchTarget]}
            onPress={handleMarkAsFinished}
            accessibilityRole="button"
            accessibilityLabel="Oznacz jako zużytą i zarchiwizuj"
          >
            <Text style={styles.markFinishedText}>Oznacz jako zużytą i zarchiwizuj</Text>
          </Pressable>

          <Pressable
            style={[styles.deletePackBtn, styles.touchTarget]}
            onPress={handleDeleteItem}
            accessibilityRole="button"
            accessibilityLabel="Usuń paczkę ze spiżarni"
          >
            <Text style={styles.deletePackText}>Usuń paczkę ze spiżarni</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  touchTarget: { minWidth: 44, minHeight: 44 },
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
  weightEditSection: {
    marginVertical: 4,
  },
  weightQuickButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
    marginBottom: 8,
  },
  quickWeightBtn: {
    flex: 1,
    backgroundColor: theme.colors.bgCardSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
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
  saveSubmitBtn: {
    backgroundColor: theme.colors.copper,
    paddingVertical: 16,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 12,
  },
  saveSubmitText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
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
});
