import React from 'react';
import {
  Text,
  StyleSheet,
  Pressable,
  Modal,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../core/theme';

export interface JsonExportModalProps {
  visible: boolean;
  onClose: () => void;
  exportedJsonText: string;
}

export const JsonExportModal: React.FC<JsonExportModalProps> = ({
  visible,
  onClose,
  exportedJsonText,
}) => {
  return (
    <Modal visible={visible} animationType="slide">
      <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom', 'left', 'right']}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Kopia Zapasowa (JSON)</Text>
          <Pressable
            style={styles.modalCloseBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Zamknij"
          >
            <Text style={styles.modalCloseText}>Zamknij</Text>
          </Pressable>
        </View>
        <Text style={styles.modalSub}>
          Poniższy kod JSON zawiera wszystkie Twoje wpisy ze spiżarni, historię parzeń oraz logi kofeiny. Możesz go skopiować i bezpiecznie zapisać:
        </Text>
        <TextInput
          style={styles.jsonTextInput}
          multiline
          editable={false}
          value={exportedJsonText}
        />
      </SafeAreaView>
    </Modal>
  );
};

export interface JsonImportModalProps {
  visible: boolean;
  onClose: () => void;
  importJsonText?: string;
  jsonText?: string;
  onChangeImportJsonText?: (text: string) => void;
  onChangeJsonText?: (text: string) => void;
  onImport?: () => void;
  onConfirmImport?: () => void;
  t?: any;
}

export const JsonImportModal: React.FC<JsonImportModalProps> = ({
  visible,
  onClose,
  importJsonText,
  jsonText,
  onChangeImportJsonText,
  onChangeJsonText,
  onImport,
  onConfirmImport,
}) => {
  const textValue = jsonText !== undefined ? jsonText : (importJsonText || '');
  const handleChangeText = onChangeJsonText || onChangeImportJsonText || (() => {});
  const handleConfirm = onConfirmImport || onImport || (() => {});
  return (
    <Modal visible={visible} animationType="slide">
      <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom', 'left', 'right']}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Importuj Dane JSON</Text>
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
        <Text style={styles.modalSub}>
          Wklej poniżej treść pliku JSON z kopią zapasową aplikacji Napar:
        </Text>
        <TextInput
          style={styles.jsonTextInput}
          multiline
          placeholder='{"version": 1, ...}'
          placeholderTextColor={theme.colors.textMuted}
          value={textValue}
          onChangeText={handleChangeText}
        />
        <Pressable style={[styles.submitImportBtn, styles.touchTarget]} onPress={handleConfirm}>
          <Text style={styles.submitImportBtnText}>Zaimportuj i Zastąp Dane</Text>
        </Pressable>
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
  jsonTextInput: {
    flex: 1,
    backgroundColor: theme.colors.bgCard,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: 14,
    color: theme.colors.textPrimary,
    fontFamily: 'Courier',
    fontSize: 12,
    marginBottom: 16,
    textAlignVertical: 'top',
  },
  submitImportBtn: {
    backgroundColor: theme.colors.copper,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginBottom: 16,
  },
  submitImportBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
