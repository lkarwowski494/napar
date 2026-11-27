import React from 'react';
import {
  Text,
  StyleSheet,
  Modal,
  TextInput,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../core/theme';
import { useTranslation } from '../../core/i18n';
import { ModalHeader } from '../ui';

export interface CsvExportModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  csvText: string;
  onShareFile?: () => void;
}

export const CsvExportModal: React.FC<CsvExportModalProps> = ({
  visible,
  onClose,
  title,
  csvText,
  onShareFile,
}) => {
  const { t } = useTranslation();
  if (!visible) return null;
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom', 'left', 'right']}>
        <ModalHeader
          onClose={onClose}
          closeLabel={t.common.close}
          style={styles.modalHeader}
        >
          <Text style={styles.modalTitle}>{title}</Text>
        </ModalHeader>
        <Text style={styles.modalSub}>
          {t.settings.csvModalDesc}
        </Text>
        {onShareFile && (
          <Pressable
            testID="share-csv-file-btn"
            style={styles.shareFileBtn}
            onPress={onShareFile}
            accessibilityRole="button"
            accessibilityLabel={t.settings.shareCsvFileBtn}
          >
            <Text style={styles.shareFileBtnText}>{t.settings.shareCsvFileBtn}</Text>
          </Pressable>
        )}
        <TextInput
          style={styles.jsonTextInput}
          multiline
          editable={false}
          selectTextOnFocus
          value={csvText}
        />
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
    marginBottom: 12,
    lineHeight: 18,
  },
  shareFileBtn: {
    minHeight: 44,
    backgroundColor: theme.colors.copper,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  shareFileBtnText: {
    color: theme.colors.onAccent,
    fontSize: 15,
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
});
