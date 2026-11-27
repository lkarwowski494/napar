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
import { ModalHeader } from '../ui';

export interface GrinderSelectModalProps {
  visible: boolean;
  onClose: () => void;
  grinderId: string;
  onSelectGrinder: (grinderId: string) => void;
  recipe: MasterRecipe | SavedRecipe;
  t: any;
  language?: 'pl' | 'en';
}

export const GrinderSelectModal: React.FC<GrinderSelectModalProps> = ({
  visible,
  onClose,
  grinderId,
  onSelectGrinder,
  recipe,
  t,
  language = 'pl',
}) => {
  if (!visible) return null;

  const recLabel = t?.grinder?.recommendationLabel || '';

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom', 'left', 'right']}>
        <ModalHeader
          onClose={onClose}
          closeLabel={t.common.close}
          closeAccessibilityHint={t?.common?.modalClose || 'Zamknij okno'}
          closeTestID="close-grinder-modal-btn"
          style={styles.modalHeader}
        >
          <Text style={styles.modalTitle}>{t.brew.grinderModalTitle}</Text>
        </ModalHeader>
        <ScrollView
          contentContainerStyle={{ padding: 16 }}
          accessibilityRole="radiogroup"
          accessibilityLabel={t.brew.grinderModalTitle}
        >
          <Text style={styles.modalSub}>{t.brew.grinderModalDesc}</Text>
          {SUPPORTED_GRINDERS.map((grinder) => {
            const isSelected = grinderId === grinder.id;
            const rec = getRecommendedGrindForRecipe(recipe, grinder.id, language);
            const displayName = rec.grinderName;
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
                accessibilityLabel={`${displayName}, ${rec.formatted}`}
                accessibilityHint={isSelected ? (t?.common?.selected || 'Wybrany młynek') : (t?.common?.select || 'Wybierz ten młynek')}
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
                    {displayName}
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
