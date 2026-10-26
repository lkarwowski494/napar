import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../core/theme';
import { InventoryItem } from '../../core/database-schema';

export interface InventorySelectModalProps {
  visible: boolean;
  onClose: () => void;
  inventory: InventoryItem[];
  selectedItem: InventoryItem | null;
  onSelectItem: (item: InventoryItem | null) => void;
  inline?: boolean;
  t?: any;
}

export const InventorySelectModal: React.FC<InventorySelectModalProps> = ({
  visible,
  onClose,
  inventory,
  selectedItem,
  onSelectItem,
  inline = false,
  t,
}) => {
  if (!inline && !visible) return null;

  const isUnassignedSelected = selectedItem === null;
  const isEn = t?.common?.close === 'Close' || (typeof t?.brew?.recipe === 'string' && t?.brew?.recipe.toLowerCase() === 'recipe');
  const safeInventory = (Array.isArray(inventory) ? inventory : []).filter(
    (item): item is InventoryItem => item !== null && typeof item === 'object' && typeof item.id === 'string'
  );

  const innerContent = (
    <ScrollView
      style={inline ? styles.inlineScrollView : undefined}
      nestedScrollEnabled={inline}
      accessibilityRole="radiogroup"
      accessibilityLabel={t?.brew?.selectInventoryTitle || (isEn ? 'Select from Stash' : 'Wybierz ze Spiżarni')}
    >
      <Text style={styles.modalTitle}>
        {t?.brew?.selectInventoryTitle || (isEn ? 'Select from Stash' : 'Wybierz ze Spiżarni')}
      </Text>
      <Pressable
        testID="close-inventory-modal-btn"
        style={styles.modalCloseBtn}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel={t?.common?.close || (isEn ? 'Close' : 'Zamknij')}
        accessibilityHint={t?.common?.closeHint || (isEn ? 'Closes stash item selection' : 'Zamyka okno wyboru ze spiżarni')}
      >
        <Text style={styles.modalCloseText}>{t?.common?.close || (isEn ? 'Close' : 'Zamknij')}</Text>
      </Pressable>

      <Pressable
        testID="inventory-option-unassigned"
        accessibilityRole="radio"
        accessibilityLabel={t?.brew?.unassignedInventory || (isEn ? 'Unassigned (general)' : 'Brak przypisania (ogólne)')}
        accessibilityHint={isEn ? 'Brew without linking to stash item and without deducting weight' : 'Parz bez przypisywania do paczki ze spiżarni i bez odliczania gramatury'}
        accessibilityState={{ selected: isUnassignedSelected }}
        style={[
          styles.recipeOptionItem,
          isUnassignedSelected && styles.recipeOptionActive,
        ]}
        onPress={() => {
          onSelectItem(null);
          onClose();
        }}
      >
        <Text style={styles.recipeOptionName}>
          {t?.brew?.unassignedInventory || (isEn ? 'Unassigned (general)' : 'Brak przypisania (ogólne)')}
        </Text>
        <Text style={styles.recipeOptionAuthor}>
          {t?.brew?.noStashDesc || (isEn ? 'Do not deduct weight from stash' : 'Nie odliczaj gramatury ze spiżarni')}
        </Text>
      </Pressable>

      {safeInventory.length === 0 ? (
        <Text style={styles.emptyNote}>
          {t?.stash?.emptyNote || (isEn ? 'No other items in stash' : 'Brak innych pozycji w spiżarni')}
        </Text>
      ) : (
        safeInventory.map((item) => {
          const isItemSelected = selectedItem?.id === item.id;
          const remGrams = typeof item.remainingWeightGrams === 'number' && Number.isFinite(item.remainingWeightGrams) ? item.remainingWeightGrams : 0;
          const initGrams = typeof item.initialWeightGrams === 'number' && Number.isFinite(item.initialWeightGrams) ? item.initialWeightGrams : 0;
          return (
            <Pressable
              key={item.id}
              testID={`inventory-option-${item.id}`}
              accessibilityRole="radio"
              accessibilityLabel={`${item.name || ''}, ${item.roasterOrProducer || ''}, ${isEn ? 'remaining' : 'pozostało'} ${remGrams}g`}
              accessibilityHint={isEn ? 'Selects this stash item for brewing' : 'Wybiera tę pozycję ze spiżarni do zaparzenia'}
              accessibilityState={{ selected: isItemSelected }}
              style={[
                styles.recipeOptionItem,
                isItemSelected && styles.recipeOptionActive,
              ]}
              onPress={() => {
                onSelectItem(item);
                onClose();
              }}
            >
              <Text style={styles.recipeOptionName}>{item.name || (isEn ? 'Unnamed item' : 'Bez nazwy')}</Text>
              <Text style={styles.recipeOptionAuthor}>
                {item.roasterOrProducer || (isEn ? 'Roastery' : 'Palarnia')} · {item.origin || ''}
              </Text>
              <Text style={styles.recipeOptionDetails}>
                {isEn ? `Remaining: ${remGrams}g of ${initGrams}g` : `Pozostało: ${remGrams}g z ${initGrams}g`}
              </Text>
            </Pressable>
          );
        })
      )}
    </ScrollView>
  );

  if (inline) {
    if (!visible) return null;
    return (
      <View style={styles.inlineContainer} testID="inventory-select-inline-panel">
        {innerContent}
      </View>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom', 'left', 'right']}>
        {innerContent}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  inlineContainer: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1.5,
    borderColor: theme.colors.copper,
    padding: theme.spacing.md,
    marginVertical: theme.spacing.sm,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  inlineScrollView: {
    maxHeight: 350,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    padding: theme.spacing.md,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 12,
  },
  modalCloseBtn: {
    alignSelf: 'flex-end',
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
    marginBottom: 16,
  },
  modalCloseText: {
    fontSize: 14,
    color: theme.colors.copper,
    fontWeight: '700',
  },
  recipeOptionItem: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.md,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  recipeOptionActive: {
    borderColor: theme.colors.copper,
    backgroundColor: theme.colors.copperMuted,
  },
  recipeOptionName: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  recipeOptionAuthor: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginBottom: 6,
  },
  recipeOptionDetails: {
    fontSize: 12,
    color: theme.colors.copper,
    fontWeight: '600',
  },
  emptyNote: {
    fontSize: 13,
    color: theme.colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 12,
  },
});

