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

export interface CsvExportModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  csvText: string;
}

export const CsvExportModal: React.FC<CsvExportModalProps> = ({
  visible,
  onClose,
  title,
  csvText,
}) => {
  return (
    <Modal visible={visible} animationType="slide">
      <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom', 'left', 'right']}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{title}</Text>
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
          Oto wygenerowany arkusz CSV zgodny ze standardem RFC 4180 (kodowanie UTF-8). Możesz go skopiować do Notatnika, Numbers lub Excela:
        </Text>
        <TextInput
          style={styles.jsonTextInput}
          multiline
          editable={false}
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
});
