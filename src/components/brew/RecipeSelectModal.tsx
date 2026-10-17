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
import { CopyIcon, EditIcon } from '../icons/CraftIcons';
import { formatDoseWeight, formatWaterWeight, formatTemperature } from '../../core/unit-converter';

export interface RecipeSelectModalProps {
  visible: boolean;
  onClose: () => void;
  recipes: any[];
  activeRecipeId: string;
  beveragePreference: 'coffee' | 'tea' | 'both';
  categoryFilter: 'ALL' | 'COFFEE' | 'TEA';
  onCategoryFilterChange: (cat: 'ALL' | 'COFFEE' | 'TEA') => void;
  onSelectRecipe: (recipe: any) => void;
  onToggleFavorite: (recipeId: string) => void;
  onDuplicateRecipe: (recipe: any) => void;
  onEditRecipe: (recipeId: string) => void;
  onAddCustomRecipe: () => void;
  onOpenGongfu: () => void;
  onOpenImport: () => void;
  onOpenQrScanner: () => void;
  unitSystem: 'metric' | 'imperial';
  t: any;
}

export const RecipeSelectModal: React.FC<RecipeSelectModalProps> = ({
  visible,
  onClose,
  recipes,
  activeRecipeId,
  beveragePreference,
  categoryFilter,
  onCategoryFilterChange,
  onSelectRecipe,
  onToggleFavorite,
  onDuplicateRecipe,
  onEditRecipe,
  onAddCustomRecipe,
  onOpenGongfu,
  onOpenImport,
  onOpenQrScanner,
  unitSystem,
  t,
}) => {
  const displayedRecipes = recipes.filter((r) => {
    if (categoryFilter === 'ALL') return true;
    const itemType = 'beverageType' in r ? r.beverageType : r.type;
    return itemType === categoryFilter;
  });

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom', 'left', 'right']}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{t.brew.chooseRecipe}</Text>
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
        <ScrollView>
          {/* Filtr Kawa vs Herbata — widoczny wyłącznie gdy preferencja to 'Kawa i Herbata' (both) */}
          {(!beveragePreference || beveragePreference === 'both') && (
            <View style={styles.recipeFilterTabsRow} accessibilityRole="tablist">
              <Pressable
                testID="recipe-filter-all"
                style={[
                  styles.recipeFilterTab,
                  categoryFilter === 'ALL' && styles.recipeFilterTabActive,
                ]}
                onPress={() => onCategoryFilterChange('ALL')}
                accessibilityRole="tab"
                accessibilityState={{ selected: categoryFilter === 'ALL' }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text
                  style={[
                    styles.recipeFilterTabText,
                    categoryFilter === 'ALL' && styles.recipeFilterTabTextActive,
                  ]}
                >
                  Wszystkie ({recipes.length})
                </Text>
              </Pressable>
              <Pressable
                testID="recipe-filter-coffee"
                style={[
                  styles.recipeFilterTab,
                  categoryFilter === 'COFFEE' && styles.recipeFilterTabActive,
                ]}
                onPress={() => onCategoryFilterChange('COFFEE')}
                accessibilityRole="tab"
                accessibilityState={{ selected: categoryFilter === 'COFFEE' }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text
                  style={[
                    styles.recipeFilterTabText,
                    categoryFilter === 'COFFEE' && styles.recipeFilterTabTextActive,
                  ]}
                >
                  Kawa ({recipes.filter((r) => ('beverageType' in r ? r.beverageType === 'COFFEE' : r.type === 'COFFEE')).length})
                </Text>
              </Pressable>
              <Pressable
                testID="recipe-filter-tea"
                style={[
                  styles.recipeFilterTab,
                  categoryFilter === 'TEA' && styles.recipeFilterTabActive,
                ]}
                onPress={() => onCategoryFilterChange('TEA')}
                accessibilityRole="tab"
                accessibilityState={{ selected: categoryFilter === 'TEA' }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text
                  style={[
                    styles.recipeFilterTabText,
                    categoryFilter === 'TEA' && styles.recipeFilterTabTextActive,
                  ]}
                >
                  Herbata ({recipes.filter((r) => ('beverageType' in r ? r.beverageType === 'TEA' : r.type === 'TEA')).length})
                </Text>
              </Pressable>
            </View>
          )}

          <View style={styles.modalActionButtonsRow}>
            <Pressable
              testID="add-custom-recipe-btn"
              style={styles.addCustomRecipeBtn}
              onPress={onAddCustomRecipe}
            >
              <Text style={styles.addCustomRecipeBtnText}>
                {t.brew.customRecipe}
              </Text>
            </Pressable>

            {beveragePreference !== 'coffee' && (
              <Pressable
                style={styles.gongfuModalBtn}
                onPress={onOpenGongfu}
              >
                <Text style={styles.gongfuModalBtnText}>Gongfu Cha</Text>
              </Pressable>
            )}

            <Pressable
              style={styles.importRecipeModalBtn}
              onPress={onOpenImport}
              testID="import-recipe-btn"
            >
              <Text style={styles.importRecipeModalBtnText}>
                {t.brew.importRecipe}
              </Text>
            </Pressable>

            <Pressable
              style={styles.scanQrModalBtn}
              onPress={onOpenQrScanner}
              testID="scan-qr-btn"
              accessibilityRole="button"
              accessibilityLabel="Skanuj kod QR receptury aparatem"
            >
              <Text style={styles.scanQrModalBtnText}>QR</Text>
            </Pressable>
          </View>

          {displayedRecipes.map((r) => (
            <Pressable
              key={r.id}
              style={[
                styles.recipeOptionItem,
                activeRecipeId === r.id && styles.recipeOptionActive,
              ]}
              onPress={() => onSelectRecipe(r)}
            >
              <View style={styles.recipeOptionHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.recipeOptionName}>{r.name}</Text>
                  <Text style={styles.recipeOptionMethod}>
                    {'beverageType' in r ? r.beverageType : r.type} · {r.method}
                    {r.isCustom ? ' · Autorska' : ''}
                  </Text>
                </View>
                <Pressable
                  style={styles.favToggleBtn}
                  hitSlop={10}
                  onPress={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(r.id);
                  }}
                  accessibilityLabel={`Ulubione: ${r.name}`}
                >
                  <Text
                    style={[
                      styles.favToggleIcon,
                      r.isFavorite && styles.favToggleIconActive,
                    ]}
                  >
                    {r.isFavorite ? '★' : '☆'}
                  </Text>
                </Pressable>
                <Pressable
                  style={styles.duplicateRecipeBtn}
                  hitSlop={8}
                  onPress={(e) => {
                    e?.stopPropagation?.();
                    onDuplicateRecipe(r);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`${t.brew.duplicateRecipe}: ${r.name}`}
                >
                  <CopyIcon size={16} color={theme.colors.textSecondary} />
                </Pressable>
                {r.isCustom && (
                  <Pressable
                    style={styles.editRecipeBtn}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel="Edytuj recepturę"
                    testID={`edit-recipe-${r.id}`}
                    onPress={(e) => {
                      e.stopPropagation();
                      onEditRecipe(r.id);
                    }}
                  >
                    <EditIcon size={16} color={theme.colors.textSecondary} />
                  </Pressable>
                )}
              </View>
              <Text style={styles.recipeOptionAuthor}>
                {r.author || 'Receptura własna'}
              </Text>
              <Text style={styles.recipeOptionDetails}>
                {formatDoseWeight(
                  'doseGrams' in r ? r.doseGrams : r.coffeeOrTeaDoseGrams,
                  unitSystem
                )}{' '}
                kawy/herbaty ·{' '}
                {formatWaterWeight(
                  'waterGrams' in r ? r.waterGrams : r.waterWeightGrams,
                  unitSystem
                )}{' '}
                wody ·{' '}
                {formatTemperature(
                  'waterTempCelsius' in r ? r.waterTempCelsius : r.waterTemperatureCelsius,
                  unitSystem
                )}
              </Text>
            </Pressable>
          ))}
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
  recipeFilterTabsRow: {
    flexDirection: 'row',
    marginBottom: 14,
    gap: 8,
  },
  recipeFilterTab: {
    flex: 1,
    minHeight: 36,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.bgCardSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  recipeFilterTabActive: {
    backgroundColor: theme.colors.copperMuted,
    borderColor: theme.colors.copper,
  },
  recipeFilterTabText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  recipeFilterTabTextActive: {
    color: theme.colors.copper,
    fontWeight: '700',
  },
  modalActionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  addCustomRecipeBtn: {
    flex: 2,
    backgroundColor: theme.colors.copper,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
  },
  addCustomRecipeBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  gongfuModalBtn: {
    flex: 1.5,
    backgroundColor: theme.colors.bgCardSecondary,
    borderWidth: 1,
    borderColor: '#4ade80',
    paddingVertical: 12,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
  },
  gongfuModalBtnText: {
    color: '#4ade80',
    fontWeight: '700',
    fontSize: 13,
  },
  importRecipeModalBtn: {
    flex: 1.5,
    backgroundColor: theme.colors.bgCardSecondary,
    borderWidth: 1,
    borderColor: theme.colors.copper,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
  },
  importRecipeModalBtnText: {
    color: theme.colors.copper,
    fontWeight: '700',
    fontSize: 13,
  },
  scanQrModalBtn: {
    width: 44,
    backgroundColor: theme.colors.bgCardSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanQrModalBtnText: {
    color: theme.colors.textPrimary,
    fontWeight: '700',
    fontSize: 12,
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
  recipeOptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  recipeOptionName: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  recipeOptionMethod: {
    fontSize: 12,
    color: theme.colors.copper,
    fontWeight: '600',
  },
  favToggleBtn: {
    padding: 4,
    marginLeft: 6,
  },
  favToggleIcon: {
    fontSize: 20,
    color: theme.colors.border,
  },
  favToggleIconActive: {
    color: '#FFD700',
  },
  duplicateRecipeBtn: {
    padding: 6,
    marginLeft: 6,
  },
  editRecipeBtn: {
    padding: 6,
    marginLeft: 6,
  },
  recipeOptionAuthor: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginBottom: 6,
  },
  recipeOptionDetails: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
});
