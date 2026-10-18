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
}

export const InventorySelectModal: React.FC<InventorySelectModalProps> = ({
  visible,
  onClose,
  inventory,
  selectedItem,
  onSelectItem,
  inline = false,
}) => {
  const innerContent = (
    <ScrollView style={inline ? styles.inlineScrollView : undefined} nestedScrollEnabled={inline}>
      <Text style={styles.modalTitle}>Wybierz ze Spiżarni</Text>
      <Pressable
        testID="close-inventory-modal-btn"
        style={styles.modalCloseBtn}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Zamknij"
      >
        <Text style={styles.modalCloseText}>Zamknij</Text>
      </Pressable>

      <Pressable
        style={styles.recipeOptionItem}
        onPress={() => {
          onSelectItem(null);
          onClose();
        }}
      >
        <Text style={styles.recipeOptionName}>Brak przypisania (ogólne)</Text>
        <Text style={styles.recipeOptionAuthor}>
          Nie odliczaj gramatury ze spiżarni
        </Text>
      </Pressable>

      {inventory.map((item) => (
        <Pressable
          key={item.id}
          testID={`inventory-option-${item.id}`}
          style={[
            styles.recipeOptionItem,
            selectedItem?.id === item.id && styles.recipeOptionActive,
          ]}
          onPress={() => {
            onSelectItem(item);
            onClose();
          }}
        >
          <Text style={styles.recipeOptionName}>{item.name}</Text>
          <Text style={styles.recipeOptionAuthor}>
            {item.roasterOrProducer || 'Palarnia'} · {item.origin || ''}
          </Text>
          <Text style={styles.recipeOptionDetails}>
            Pozostało: {item.remainingWeightGrams}g z {item.initialWeightGrams}g
          </Text>
        </Pressable>
      ))}
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
});

