import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../core/theme';
import { useTranslation, formatTemplate } from '../../core/i18n';
import { ModalHeader } from '../ui';
import type { BackupFileEntry } from '../../data/backup';

export interface JsonExportModalProps {
  visible: boolean;
  onClose: () => void;
  exportedJsonText: string;
  onShareFile?: () => void;
}

export const JsonExportModal: React.FC<JsonExportModalProps> = ({
  visible,
  onClose,
  exportedJsonText,
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
          <Text style={styles.modalTitle}>{t.settings.jsonExportModalTitle}</Text>
        </ModalHeader>
        <Text style={styles.modalSub}>
          {t.settings.jsonExportModalDesc}
        </Text>
        {onShareFile && (
          <Pressable
            testID="share-json-file-btn"
            style={styles.shareFileBtn}
            onPress={onShareFile}
            accessibilityRole="button"
            accessibilityLabel={t.settings.shareJsonFileBtn}
          >
            <Text style={styles.shareFileBtnText}>{t.settings.shareJsonFileBtn}</Text>
          </Pressable>
        )}
        <TextInput
          style={styles.jsonTextInput}
          multiline
          editable={false}
          selectTextOnFocus
          value={exportedJsonText}
        />
      </SafeAreaView>
    </Modal>
  );
};

export interface JsonImportModalProps {
  visible: boolean;
  onClose: () => void;
  onDismiss?: () => void;
  importJsonText?: string;
  jsonText?: string;
  onChangeImportJsonText?: (text: string) => void;
  onChangeJsonText?: (text: string) => void;
  onImport?: () => void;
  onConfirmImport?: () => void;
  backupFiles?: BackupFileEntry[];
  onSelectBackupFile?: (file: BackupFileEntry) => void;
  onRefreshBackupFiles?: () => void;
  loadedFileName?: string | null;
  t?: any;
}

export const JsonImportModal: React.FC<JsonImportModalProps> = ({
  visible,
  onClose,
  onDismiss,
  importJsonText,
  jsonText,
  onChangeImportJsonText,
  onChangeJsonText,
  onImport,
  onConfirmImport,
  backupFiles,
  onSelectBackupFile,
  onRefreshBackupFiles,
  loadedFileName,
}) => {
  const { t } = useTranslation();
  const textValue = jsonText !== undefined ? jsonText : (importJsonText || '');
  const handleChangeText = onChangeJsonText || onChangeImportJsonText || (() => {});
  const handleConfirm = onConfirmImport || onImport || (() => {});
  const showFilePicker = Boolean(onSelectBackupFile || onRefreshBackupFiles);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} onDismiss={onDismiss}>
      <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom', 'left', 'right']}>
        <KeyboardAvoidingView
          style={styles.flexOne}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ModalHeader
            onClose={onClose}
            closeLabel={t.common.cancel}
            onSave={handleConfirm}
            saveLabel={t.common.save}
            saveTestID="json-import-header-submit-btn"
            style={styles.modalHeader}
          >
            <Text style={styles.modalTitle}>{t.settings.jsonImportModalTitle}</Text>
          </ModalHeader>
          <ScrollView
            style={styles.flexOne}
            contentContainerStyle={styles.scrollContent}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.modalSub}>
              {t.settings.jsonImportModalDesc}
            </Text>

            {showFilePicker && (
              <View style={styles.filesCard} testID="json-import-files-section">
                <View style={styles.filesHeaderRow}>
                  <Text style={styles.filesCardTitle}>{t.settings.importFromFilesTitle}</Text>
                  {onRefreshBackupFiles && (
                    <Pressable
                      testID="json-import-refresh-files-btn"
                      style={styles.refreshBtn}
                      onPress={onRefreshBackupFiles}
                      accessibilityRole="button"
                      accessibilityLabel={t.settings.importRefreshFilesBtn}
                    >
                      <Text style={styles.refreshBtnText}>{t.settings.importRefreshFilesBtn}</Text>
                    </Pressable>
                  )}
                </View>
                <Text style={styles.filesHint}>{t.settings.importFromFilesHint}</Text>

                {backupFiles && backupFiles.length > 0 ? (
                  <View style={styles.filesList}>
                    {backupFiles.map((file, idx) => (
                      <Pressable
                        key={file.path}
                        testID={`json-import-file-${idx}`}
                        style={styles.fileItemBtn}
                        onPress={() => onSelectBackupFile?.(file)}
                        accessibilityRole="button"
                        accessibilityLabel={file.name}
                      >
                        <Text style={styles.fileItemName} numberOfLines={1}>
                          {file.name}
                        </Text>
                        <Text style={styles.fileItemSource}>
                          {file.source === 'backup'
                            ? t.settings.importSourceBackup
                            : t.settings.importSourceDocs}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                ) : (
                  <Text testID="json-import-no-files" style={styles.noFilesText}>
                    {t.settings.importNoFilesYet}
                  </Text>
                )}

                {loadedFileName ? (
                  <Text testID="json-import-loaded-file" style={styles.loadedFileText}>
                    {formatTemplate(t.settings.importFileLoaded, { name: loadedFileName })}
                  </Text>
                ) : null}
              </View>
            )}

            <TextInput
              testID="json-import-input"
              style={styles.jsonTextInput}
              multiline
              autoCapitalize="none"
              autoCorrect={false}
              spellCheck={false}
              autoComplete="off"
              placeholder='{"version": 1, ...}'
              placeholderTextColor={theme.colors.textMuted}
              value={textValue}
              onChangeText={handleChangeText}
            />
            <Pressable
              testID="json-import-submit-btn"
              style={styles.submitImportBtn}
              onPress={handleConfirm}
              accessibilityRole="button"
              accessibilityLabel={t.settings.importReplaceBtn}
            >
              <Text style={styles.submitImportBtnText}>{t.settings.importReplaceBtn}</Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  flexOne: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
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
  filesCard: {
    backgroundColor: theme.colors.bgCard,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: 12,
    marginBottom: 12,
  },
  filesHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  filesCardTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  refreshBtn: {
    minHeight: 44,
    paddingHorizontal: 10,
    justifyContent: 'center',
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.bgCardSecondary,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
  },
  refreshBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.copperLight,
  },
  filesHint: {
    fontSize: 12,
    color: theme.colors.textMuted,
    lineHeight: 16,
    marginBottom: 8,
  },
  filesList: {
    gap: 6,
  },
  fileItemBtn: {
    minHeight: 44,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.bgCardSecondary,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
  },
  fileItemName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginRight: 8,
  },
  fileItemSource: {
    fontSize: 11,
    color: theme.colors.copperLight,
    fontWeight: '600',
  },
  noFilesText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  loadedFileText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.successBright,
  },
  jsonTextInput: {
    flex: 1,
    minHeight: 160,
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
    minHeight: 44,
    backgroundColor: theme.colors.copper,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  submitImportBtnText: {
    color: theme.colors.onAccent,
    fontSize: 15,
    fontWeight: '700',
  },
});
