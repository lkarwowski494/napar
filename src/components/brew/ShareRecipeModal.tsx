import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  Share,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../core/theme';
import { QrCodeSvg } from '../../core/qr-code';
import { formatDoseWeight, formatWaterWeight, formatTemperature } from '../../core/unit-converter';
import { MasterRecipe } from '../../core/recipes-data';
import { SavedRecipe } from '../../core/database-schema';

export interface ShareRecipeModalProps {
  visible: boolean;
  onClose: () => void;
  recipe: MasterRecipe | SavedRecipe;
  shareUrl: string;
  waterTempCelsius: number;
  unitSystem: 'metric' | 'imperial';
  t: any;
}

export const ShareRecipeModal: React.FC<ShareRecipeModalProps> = ({
  visible,
  onClose,
  recipe,
  shareUrl,
  waterTempCelsius,
  unitSystem,
  t,
}) => {
  return (
    <Modal visible={visible} animationType="slide">
      <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom', 'left', 'right']}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{t.brew.qrModalTitle}</Text>
          <Pressable
            testID="close-share-modal-btn"
            style={styles.modalCloseBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={t.common.close}
          >
            <Text style={styles.modalCloseText}>{t.common.close}</Text>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={{ padding: 20, alignItems: 'center' }}>
          <Text style={[styles.modalSub, { textAlign: 'center', marginBottom: 16 }]}>
            {t.brew.qrModalDesc}
          </Text>

          <View style={styles.qrCard}>
            <QrCodeSvg value={shareUrl} size={220} testID="recipe-qr-code-svg" />
          </View>

          <Text style={styles.shareRecipeName}>{recipe.name}</Text>
          <Text style={styles.shareRecipeDetails}>
            {recipe.method} ·{' '}
            {formatDoseWeight(
              'doseGrams' in recipe ? recipe.doseGrams : recipe.coffeeOrTeaDoseGrams,
              unitSystem
            )}{' '}
            /{' '}
            {formatWaterWeight(
              'waterGrams' in recipe ? recipe.waterGrams : recipe.waterWeightGrams,
              unitSystem
            )}{' '}
            · {formatTemperature(waterTempCelsius, unitSystem)}
          </Text>

          <View style={styles.shareButtonsRow}>
            <Pressable
              testID="share-link-btn"
              style={styles.shareActionBtn}
              accessibilityRole="button"
              accessibilityLabel={t.brew.qrShareLink}
              accessibilityHint="Otwiera arkusz udostępniania linku do receptury w komunikatorach lub poczcie"
              onPress={() => {
                Share.share({
                  title: recipe.name,
                  message: t?.appName === 'Steepwise'
                    ? `${recipe.name} — brew recipe in Steepwise:\n${shareUrl}`
                    : `${recipe.name} — receptura parzenia w Napar:\n${shareUrl}`,
                  url: shareUrl,
                });
              }}
            >
              <Text style={styles.shareActionBtnText}>
                {t.brew.qrShareLink}
              </Text>
            </Pressable>

            <Pressable
              testID="copy-link-btn"
              style={[styles.shareActionBtn, styles.shareActionBtnSecondary]}
              accessibilityRole="button"
              accessibilityLabel={t.brew.qrCopyLink}
              accessibilityHint="Kopiuje link receptury do schowka systemowego"
              onPress={() => {
                Alert.alert(t.brew?.qrCopied || 'Link receptury', shareUrl);
              }}
            >
              <Text style={styles.shareActionBtnTextSecondary}>
                {t.brew.qrCopyLink}
              </Text>
            </Pressable>
          </View>
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
  qrCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  shareRecipeName: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 6,
    textAlign: 'center',
  },
  shareRecipeDetails: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  shareButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  shareActionBtn: {
    flex: 1,
    backgroundColor: theme.colors.copper,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  shareActionBtnSecondary: {
    backgroundColor: theme.colors.bgCardSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  shareActionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  shareActionBtnTextSecondary: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
});
