import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../core/theme';
import { CopyIcon, EditIcon } from '../icons/CraftIcons';
import { formatDoseWeight, formatWaterWeight, formatTemperature } from '../../core/unit-converter';
import { normSearch } from '../../core/search-utils';

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
  inline?: boolean;
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
  inline = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [subsetFilter, setSubsetFilter] = useState<'ALL' | 'FAVORITES' | 'CUSTOM'>('ALL');
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  const toggleCategoryCollapse = (catKey: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [catKey]: !prev[catKey],
    }));
  };

  if (!inline && !visible) return null;

  const safeRecipes = Array.isArray(recipes) ? recipes : [];
  const displayedRecipes = safeRecipes.filter((r) => {
    if (!r || typeof r !== 'object') return false;
    const itemType = 'beverageType' in r ? r.beverageType : r.type;
    if (categoryFilter !== 'ALL' && itemType !== categoryFilter) {
      return false;
    }
    if (subsetFilter === 'FAVORITES' && !r.isFavorite) {
      return false;
    }
    if (subsetFilter === 'CUSTOM' && !r.isCustom) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = normSearch(searchQuery);
      const matchName = normSearch(r.name || '').includes(q);
      const matchMethod = normSearch(r.method || '').includes(q);
      const matchAuthor = normSearch(r.author || '').includes(q);
      const matchDesc = normSearch(r.description || '').includes(q);
      if (!matchName && !matchMethod && !matchAuthor && !matchDesc) return false;
    }
    return true;
  });

  const coffeeGroup = displayedRecipes.filter(
    (r) => r && typeof r === 'object' && ('beverageType' in r ? r.beverageType : r.type) === 'COFFEE'
  );
  const teaGroup = displayedRecipes.filter(
    (r) => r && typeof r === 'object' && ('beverageType' in r ? r.beverageType : r.type) === 'TEA'
  );

  const isEn =
    t?.common?.close === 'Close' ||
    (typeof t?.brew?.recipe === 'string' && t?.brew?.recipe.toLowerCase() === 'recipe');

  const renderRecipeCard = (r: any) => {
    const recipeName = r?.name || '';
    const selectLabel = isEn ? `Select recipe: ${recipeName}` : `Wybierz przepis: ${recipeName}`;
    const favLabel = isEn ? `Favorite: ${recipeName}` : `Ulubione: ${recipeName}`;
    const customSuffix = r?.isCustom ? (isEn ? ' · Custom' : ' · Autorska') : '';
    const authorText = r?.author || (isEn ? 'Custom recipe' : 'Receptura własna');
    const doseUnitText = isEn ? ' coffee/tea · ' : ' kawy/herbaty · ';
    const waterUnitText = isEn ? ' water · ' : ' wody · ';

    return (
      <Pressable
        key={r.id}
        testID={`recipe-option-${r.id}`}
        accessibilityRole="button"
        accessibilityState={{ selected: activeRecipeId === r.id }}
        accessibilityLabel={selectLabel}
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
              {customSuffix}
            </Text>
          </View>
          <Pressable
            testID={`fav-toggle-${r.id}`}
            style={styles.favToggleBtn}
            hitSlop={10}
            onPress={(e) => {
              e.stopPropagation();
              onToggleFavorite(r.id);
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: Boolean(r.isFavorite) }}
            accessibilityLabel={favLabel}
            accessibilityHint={
              r.isFavorite
                ? (t?.stash?.favoriteRemove || (isEn ? 'Remove from favorites' : 'Usuń z ulubionych'))
                : (t?.stash?.favoriteAdd || (isEn ? 'Add to favorites' : 'Dodaj do ulubionych'))
            }
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
            testID={`duplicate-recipe-${r.id}`}
            style={styles.duplicateRecipeBtn}
            hitSlop={8}
            onPress={(e) => {
              e?.stopPropagation?.();
              onDuplicateRecipe(r);
            }}
            accessibilityRole="button"
            accessibilityLabel={`${t?.brew?.duplicateRecipe || (isEn ? 'Duplicate recipe' : 'Duplikuj recepturę')}: ${recipeName}`}
          >
            <CopyIcon size={16} color={theme.colors.textSecondary} />
          </Pressable>
          {r.isCustom && (
            <Pressable
              style={styles.editRecipeBtn}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={t?.brew?.editRecipe || (isEn ? 'Edit recipe' : 'Edytuj recepturę')}
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
          {authorText}
        </Text>
        <Text style={styles.recipeOptionDetails}>
          {formatDoseWeight(
            'doseGrams' in r ? r.doseGrams : r.coffeeOrTeaDoseGrams,
            unitSystem
          )}
          {doseUnitText}
          {formatWaterWeight(
            'waterGrams' in r ? r.waterGrams : r.waterWeightGrams,
            unitSystem
          )}
          {waterUnitText}
          {formatTemperature(
            'waterTempCelsius' in r ? r.waterTempCelsius : r.waterTemperatureCelsius,
            unitSystem
          )}
        </Text>
      </Pressable>
    );
  };

  const innerContent = (
    <>
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle} testID="recipe-modal-title">{t?.brew?.chooseRecipe || 'Wybierz recepturę'}</Text>
        <Pressable
          testID="close-recipe-modal-btn"
          style={styles.modalCloseBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={t?.common?.close || (isEn ? 'Close' : 'Zamknij')}
          accessibilityHint={t?.common?.closeHint || (isEn ? 'Closes recipe selection' : 'Zamyka okno wyboru receptury')}
        >
          <Text style={styles.modalCloseText}>{t?.common?.close || (isEn ? 'Close' : 'Zamknij')}</Text>
        </Pressable>
      </View>
      <ScrollView style={inline ? styles.inlineScrollView : undefined} nestedScrollEnabled={inline}>
        {/* Wyszukiwarka receptur (BPR Pillar 3) */}
          <View style={styles.searchBox}>
            <TextInput
              testID="recipe-search-input"
              style={styles.searchInput}
              placeholder={t?.brew?.recipeSearchPlaceholder || 'Szukaj receptury, metody (V60, AeroPress, Gaiwan)...'}
              placeholderTextColor={theme.colors.textMuted}
              value={searchQuery}
              onChangeText={(txt) => setSearchQuery(typeof txt === 'string' ? txt.slice(0, 100) : '')}
              accessibilityRole="search"
              accessibilityLabel={t?.brew?.recipeSearchPlaceholder || 'Szukaj receptury, metody'}
              accessibilityHint={t?.brew?.recipeSearchHint || 'Wpisz nazwę, metodę lub autora aby przefiltrować listę'}
            />
            {searchQuery.length > 0 && (
              <Pressable
                testID="clear-recipe-search-btn"
                onPress={() => setSearchQuery('')}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityRole="button"
                accessibilityLabel={t?.brew?.clearSearch || 'Wyczyść wyszukiwanie'}
                style={styles.clearSearchBtn}
              >
                <Text style={styles.clearSearchText}>✕</Text>
              </Pressable>
            )}
          </View>

          {/* Filtr pierwszego rzędu: Klasyki i Ulubione / Wszystkie / Własne Presety (BPR Pillar 1) */}
          <View style={styles.subsetFilterRow} accessibilityRole="tablist">
            <Pressable
              testID="subset-filter-all"
              style={[
                styles.subsetChip,
                subsetFilter === 'ALL' && styles.subsetChipActive,
              ]}
              onPress={() => setSubsetFilter('ALL')}
              accessibilityRole="tab"
              accessibilityState={{ selected: subsetFilter === 'ALL' }}
              accessibilityLabel={t?.brew?.subsetAll || 'Wszystkie presety i klasyki'}
            >
              <Text
                style={[
                  styles.subsetChipText,
                  subsetFilter === 'ALL' && styles.subsetChipTextActive,
                ]}
              >
                {t?.brew?.subsetAll || 'Wszystkie'}
              </Text>
            </Pressable>
            <Pressable
              testID="subset-filter-favorites"
              style={[
                styles.subsetChip,
                subsetFilter === 'FAVORITES' && styles.subsetChipActive,
              ]}
              onPress={() => setSubsetFilter('FAVORITES')}
              accessibilityRole="tab"
              accessibilityState={{ selected: subsetFilter === 'FAVORITES' }}
              accessibilityLabel={t?.brew?.subsetFavorites || 'Klasyki i Ulubione'}
            >
              <Text
                style={[
                  styles.subsetChipText,
                  subsetFilter === 'FAVORITES' && styles.subsetChipTextActive,
                ]}
              >
                {t?.brew?.subsetFavorites || 'Klasyki / Ulubione'}
              </Text>
            </Pressable>
            <Pressable
              testID="subset-filter-custom"
              style={[
                styles.subsetChip,
                subsetFilter === 'CUSTOM' && styles.subsetChipActive,
              ]}
              onPress={() => setSubsetFilter('CUSTOM')}
              accessibilityRole="tab"
              accessibilityState={{ selected: subsetFilter === 'CUSTOM' }}
              accessibilityLabel={t?.brew?.subsetCustom || 'Własne receptury'}
            >
              <Text
                style={[
                  styles.subsetChipText,
                  subsetFilter === 'CUSTOM' && styles.subsetChipTextActive,
                ]}
              >
                {t?.brew?.subsetCustom || 'Własne Presety'}
              </Text>
            </Pressable>
          </View>

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
                  {`${t?.brew?.all || (isEn ? 'All' : 'Wszystkie')} (${safeRecipes.filter((r) => r && typeof r === 'object').length})`}
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
                  {`${t?.brew?.coffee || (isEn ? 'Coffee' : 'Kawa')} (${safeRecipes.filter((r) => r && typeof r === 'object' && ('beverageType' in r ? r.beverageType === 'COFFEE' : r.type === 'COFFEE')).length})`}
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
                  {`${t?.brew?.tea || (isEn ? 'Tea' : 'Herbata')} (${safeRecipes.filter((r) => r && typeof r === 'object' && ('beverageType' in r ? r.beverageType === 'TEA' : r.type === 'TEA')).length})`}
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
                {t?.brew?.customRecipe || (isEn ? 'Custom recipe' : 'Receptura autorska')}
              </Text>
            </Pressable>

            {beveragePreference !== 'coffee' && (
              <Pressable
                testID="gongfu-mode-btn"
                style={styles.gongfuModalBtn}
                onPress={onOpenGongfu}
                accessibilityRole="button"
                accessibilityLabel={t?.brew?.gongfuModeBtn || 'Gongfu Cha'}
                accessibilityHint={t?.brew?.gongfuModeHint || (isEn ? 'Launches traditional Gongfu Cha tea brewing with multi-infusions' : 'Uruchamia tradycyjną ceremonię parzenia herbaty Gongfu Cha z wielokrotnymi infuzjami')}
              >
                <Text style={styles.gongfuModalBtnText}>{t?.brew?.gongfuModeBtn || 'Gongfu Cha'}</Text>
              </Pressable>
            )}

            <Pressable
              style={styles.importRecipeModalBtn}
              onPress={onOpenImport}
              testID="import-recipe-btn"
            >
              <Text style={styles.importRecipeModalBtnText}>
                {t?.brew?.importRecipe || (isEn ? 'Import' : 'Importuj')}
              </Text>
            </Pressable>

            <Pressable
              style={styles.scanQrModalBtn}
              onPress={onOpenQrScanner}
              testID="scan-qr-btn"
              accessibilityRole="button"
              accessibilityLabel={t?.brew?.scanQrA11y || (isEn ? 'Scan recipe QR code with camera' : 'Skanuj kod QR receptury aparatem')}
            >
              <Text style={styles.scanQrModalBtnText}>QR</Text>
            </Pressable>
          </View>

          {/* Zwijana kategoria 1: Kawa Specialty */}
          {coffeeGroup.length > 0 && (
            <View style={styles.categoryGroupSection}>
              <Pressable
                testID="recipe-cat-toggle-COFFEE"
                style={styles.categoryAccordionHeader}
                onPress={() => toggleCategoryCollapse('COFFEE')}
                accessibilityRole="button"
                accessibilityLabel={isEn ? 'Collapse or expand Specialty Coffee category' : 'Zwiń lub rozwiń kategorię Kawa Specialty'}
              >
                <Text style={styles.categoryAccordionTitle}>
                  {isEn ? 'Specialty Coffee — Filter & Immersion' : 'Kawa Specialty — Przelew i Immersion'} ({coffeeGroup.length})
                </Text>
                <Text style={styles.categoryAccordionArrow}>
                  {collapsedCategories['COFFEE'] ? '▸' : '▾'}
                </Text>
              </Pressable>
              {!collapsedCategories['COFFEE'] && coffeeGroup.map(renderRecipeCard)}
            </View>
          )}

          {/* Zwijana kategoria 2: Herbata Rzemieślnicza */}
          {teaGroup.length > 0 && (
            <View style={styles.categoryGroupSection}>
              <Pressable
                testID="recipe-cat-toggle-TEA"
                style={styles.categoryAccordionHeader}
                onPress={() => toggleCategoryCollapse('TEA')}
                accessibilityRole="button"
                accessibilityLabel={isEn ? 'Collapse or expand Artisan Tea category' : 'Zwiń lub rozwiń kategorię Herbata Rzemieślnicza'}
              >
                <Text style={styles.categoryAccordionTitle}>
                  {isEn ? 'Artisan Tea & Gongfu' : 'Herbata Rzemieślnicza & Gongfu'} ({teaGroup.length})
                </Text>
                <Text style={styles.categoryAccordionArrow}>
                  {collapsedCategories['TEA'] ? '▸' : '▾'}
                </Text>
              </Pressable>
              {!collapsedCategories['TEA'] && teaGroup.map(renderRecipeCard)}
            </View>
          )}
        </ScrollView>
    </>
  );

  if (inline) {
    if (!visible) return null;
    return (
      <View style={styles.inlineContainer} testID="recipe-select-inline-panel">
        {innerContent}
      </View>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom', 'left', 'right']}>
        {innerContent}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  inlineContainer: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1.5,
    borderColor: theme.colors.copper,
    padding: theme.spacing.md,
    marginVertical: theme.spacing.sm,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  inlineScrollView: {
    maxHeight: 450,
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
  searchBox: {
    marginBottom: 10,
    position: 'relative',
    justifyContent: 'center',
  },
  searchInput: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 12,
    paddingRight: 36,
    paddingVertical: 10,
    fontSize: 13,
    color: theme.colors.textPrimary,
  },
  clearSearchBtn: {
    position: 'absolute',
    right: 10,
    minWidth: 24,
    minHeight: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearSearchText: {
    fontSize: 14,
    color: theme.colors.textMuted,
    fontWeight: '700',
  },
  subsetFilterRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  subsetChip: {
    flex: 1,
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.bgCardSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  subsetChipActive: {
    borderColor: theme.colors.copper,
    backgroundColor: theme.colors.copperMuted,
  },
  subsetChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  subsetChipTextActive: {
    color: theme.colors.copper,
    fontWeight: '800',
  },
  categoryGroupSection: {
    marginBottom: 14,
  },
  categoryAccordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.bgCardSecondary,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.copper,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  categoryAccordionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.copper,
    letterSpacing: 0.4,
  },
  categoryAccordionArrow: {
    fontSize: 14,
    fontWeight: '900',
    color: theme.colors.copper,
  },
});
