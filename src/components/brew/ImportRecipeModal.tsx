import React, { useState } from 'react';
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
import { decodeRecipeFromShareUrl } from '../../core/recipe-share';
import { saveRecipe } from '../../core/database';
import { formatDoseWeight, formatWaterWeight, formatTemperature } from '../../core/unit-converter';

export interface ImportRecipeModalProps {
  visible: boolean;
  onClose: () => void;
  onImportSuccess: (importedRecipe: any) => void;
  unitSystem: 'metric' | 'imperial';
  t: any;
}

export const ImportRecipeModal: React.FC<ImportRecipeModalProps> = ({
  visible,
  onClose,
  onImportSuccess,
  unitSystem,
  t,
}) => {
  const [importUrlInput, setImportUrlInput] = useState('');
  const [importParsedRecipe, setImportParsedRecipe] = useState<any>(null);

  const handleConfirmImport = () => {
    if (!importParsedRecipe) return;
    try {
      saveRecipe(importParsedRecipe.recipe);
      onImportSuccess(importParsedRecipe.recipe);
      setImportUrlInput('');
      setImportParsedRecipe(null);
      onClose();
      Alert.alert('Sukces!', t.brew.importSuccess);
    } catch {
      Alert.alert('Błąd', t.brew.importError);
    }
  };

  return (
    <Modal visible={visible} animationType="slide">
      <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom', 'left', 'right']}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{t.brew.importModalTitle}</Text>
          <Pressable
            testID="close-import-modal-btn"
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
          <Text style={styles.modalSub}>{t.brew.importModalDesc}</Text>
          <TextInput
            style={[styles.importTextInput, { minHeight: 80 }]}
            multiline
            placeholder={t.brew.importInputPlaceholder}
            placeholderTextColor={theme.colors.textMuted}
            value={importUrlInput}
            onChangeText={(txt) => {
              setImportUrlInput(txt);
              const dec = decodeRecipeFromShareUrl(txt);
              setImportParsedRecipe(dec);
            }}
            testID="import-recipe-input"
          />

          {importParsedRecipe && (
            <View style={styles.importPreviewCard} testID="import-recipe-preview">
              <Text style={styles.importPreviewTitle}>
                {importParsedRecipe.recipe.name}
              </Text>
              <Text style={styles.importPreviewSubtitle}>
                {importParsedRecipe.recipe.method} ·{' '}
                {formatDoseWeight(importParsedRecipe.recipe.doseGrams, unitSystem)} /{' '}
                {formatWaterWeight(importParsedRecipe.recipe.waterGrams, unitSystem)} ·{' '}
                {formatTemperature(importParsedRecipe.recipe.waterTempCelsius, unitSystem)}
              </Text>
              <Text style={styles.importPreviewStepsCount}>
                Liczba kroków parzenia: {importParsedRecipe.originalSteps.length}
              </Text>
              <Pressable
                style={styles.confirmImportBtn}
                onPress={handleConfirmImport}
                testID="confirm-import-btn"
              >
                <Text style={styles.confirmImportBtnText}>
                  {t.brew.importActionBtn}
                </Text>
              </Pressable>
            </View>
          )}
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
  importTextInput: {
    backgroundColor: theme.colors.bgCard,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: 14,
    color: theme.colors.textPrimary,
    fontSize: 14,
    marginBottom: 16,
  },
  importPreviewCard: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.copper,
    marginBottom: 20,
  },
  importPreviewTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  importPreviewSubtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  importPreviewStepsCount: {
    fontSize: 12,
    color: theme.colors.copper,
    marginBottom: 14,
    fontWeight: '600',
  },
  confirmImportBtn: {
    backgroundColor: theme.colors.copper,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
  },
  confirmImportBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
