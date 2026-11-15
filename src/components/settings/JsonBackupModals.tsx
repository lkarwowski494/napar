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
import { useTranslation } from '../../core/i18n';

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
  const { t } = useTranslation();
  return (
    <Modal visible={visible} animationType="slide">
      <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom', 'left', 'right']}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{t.settings.jsonExportModalTitle}</Text>
          <Pressable
            style={styles.modalCloseBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={t.common.close}
          >
            <Text style={styles.modalCloseText}>{t.common.close}</Text>
          </Pressable>
        </View>
        <Text style={styles.modalSub}>
          {t.settings.jsonExportModalDesc}
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
  const { t } = useTranslation();
  const textValue = jsonText !== undefined ? jsonText : (importJsonText || '');
  const handleChangeText = onChangeJsonText || onChangeImportJsonText || (() => {});
  const handleConfirm = onConfirmImport || onImport || (() => {});
  return (
    <Modal visible={visible} animationType="slide">
      <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom', 'left', 'right']}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{t.settings.jsonImportModalTitle}</Text>
          <Pressable
            style={styles.modalCloseBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={t.common.cancel}
          >
            <Text style={styles.modalCloseText}>{t.common.cancel}</Text>
          </Pressable>
        </View>
        <Text style={styles.modalSub}>
          {t.settings.jsonImportModalDesc}
        </Text>
        <TextInput
          style={styles.jsonTextInput}
          multiline
          placeholder='{"version": 1, ...}'
          placeholderTextColor={theme.colors.textMuted}
          value={textValue}
          onChangeText={handleChangeText}
        />
        <Pressable style={styles.submitImportBtn} onPress={handleConfirm} accessibilityRole="button" accessibilityLabel={t.settings.importReplaceBtn}>
          <Text style={styles.submitImportBtnText}>{t.settings.importReplaceBtn}</Text>
        </Pressable>
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
  jsonTextInput: {
    flex: 1,
    backgroundColor: theme.colors.bgCard,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.borderRadius.md,
    padding: 14,
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.monospace,
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
    color: theme.colors.onAccent,
    fontSize: 15,
    fontWeight: '700',
  },
});
