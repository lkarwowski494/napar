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
import { CheckIcon } from '../icons/CraftIcons';
import {
  SUPPORTED_GRINDERS,
  getRecommendedGrindForRecipe,
} from '../../core/grinder-converter';
import { MasterRecipe } from '../../core/recipes-data';
import { SavedRecipe } from '../../core/database-schema';

export interface GrinderSelectModalProps {
  visible: boolean;
  onClose: () => void;
  grinderId: string;
  onSelectGrinder: (grinderId: string) => void;
  recipe: MasterRecipe | SavedRecipe;
  t: any;
}

export const GrinderSelectModal: React.FC<GrinderSelectModalProps> = ({
  visible,
  onClose,
  grinderId,
  onSelectGrinder,
  recipe,
  t,
}) => {
  if (!visible) return null;

  const recLabel = t?.grinder?.recommendationLabel || (t?.common?.save ? 'Rekomendacja:' : 'Recommendation:');

  return (
    <Modal visible={visible} animationType="slide">
      <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom', 'left', 'right']}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{t.brew.grinderModalTitle}</Text>
          <Pressable
            testID="close-grinder-modal-btn"
            style={styles.modalCloseBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={t.common.close}
          >
            <Text style={styles.modalCloseText}>{t.common.close}</Text>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <Text style={styles.modalSub}>{t.brew.grinderModalDesc}</Text>
          {SUPPORTED_GRINDERS.map((grinder) => {
            const isSelected = grinderId === grinder.id;
            const rec = getRecommendedGrindForRecipe(recipe, grinder.id);
            return (
              <Pressable
                key={grinder.id}
                testID={`grinder-item-${grinder.id}`}
                style={[
                  styles.grinderItemCard,
                  isSelected && styles.grinderItemCardActive,
                ]}
                onPress={() => {
                  onSelectGrinder(grinder.id);
                  onClose();
                }}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={`${grinder.name}, ${rec.formatted}`}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.grinderItemName,
                      isSelected && {
                        color: theme.colors.copper,
                        fontWeight: '700',
                      },
                    ]}
                  >
                    {grinder.name}
                  </Text>
                  <Text style={styles.grinderItemRecommendation}>
                    {recLabel} {rec.formatted} ({rec.microns} µm)
                  </Text>
                </View>
                {isSelected ? (
                  <CheckIcon size={18} color={theme.colors.copper} />
                ) : (
                  <View
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 9,
                      borderWidth: 1.5,
                      borderColor: theme.colors.border,
                    }}
                  />
                )}
              </Pressable>
            );
          })}
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
  modalSub: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginBottom: 16,
    lineHeight: 18,
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
  grinderItemCard: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.md,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  grinderItemCardActive: {
    borderColor: theme.colors.copper,
    backgroundColor: theme.colors.copperMuted,
  },
  grinderItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  grinderItemRecommendation: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
});
