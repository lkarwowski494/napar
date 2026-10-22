// ============================================================================
// Napar (Steepwise) — BrewHeader Component (Apps4Craft Design System)
// Artisanal, calm header: Grinder Clicks, Recipe & Stash Selectors, Vector Icons.
// 100% Offline-First. Zero Emojis.
// ============================================================================

import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { theme } from '../../core/theme';
import { useTranslation } from '../../core/i18n';
import { InventoryItem } from '../../core/database-schema';
import {
  GrinderIcon,
  QrIcon,
  StarIcon,
} from '../icons/CraftIcons';

interface BrewHeaderProps {
  recipe: any;
  selectedInventoryItem: InventoryItem | null;
  waterTempCelsius: number;
  grinderRecommendation: {
    grinderName: string;
    formatted: string;
    microns?: number;
  };
  favoriteRecipes?: any[];
  isRunning?: boolean;
  beveragePreference?: 'both' | 'coffee' | 'tea';
  beverageType?: 'COFFEE' | 'TEA';
  onBeverageTypeChange?: (type: 'COFFEE' | 'TEA') => void;
  onSelectRecipe: (r: any) => void;
  onOpenRecipeModal: () => void;
  onOpenInventoryModal: () => void;
  onOpenGrinderModal: () => void;
  onOpenShareModal: () => void;
  onNavigateToGongfu: () => void;
  onNavigateToMilkDrinks?: () => void;
}

export function BrewHeader({
  recipe,
  selectedInventoryItem,
  waterTempCelsius,
  grinderRecommendation,
  favoriteRecipes = [],
  isRunning = false,
  beveragePreference = 'both',
  beverageType,
  onBeverageTypeChange,
  onSelectRecipe,
  onOpenRecipeModal,
  onOpenInventoryModal,
  onOpenGrinderModal,
  onOpenShareModal,
  onNavigateToGongfu,
  onNavigateToMilkDrinks,
}: BrewHeaderProps) {
  const { t } = useTranslation();

  const isTea =
    'beverageType' in recipe
      ? recipe.beverageType === 'TEA'
      : (recipe as any).type === 'TEA';

  const currentBeverageType = beverageType || (isTea ? 'TEA' : 'COFFEE');

  const filteredFavorites = favoriteRecipes.filter((fav) => {
    const favIsTea = 'beverageType' in fav ? fav.beverageType === 'TEA' : fav.type === 'TEA';
    if (beveragePreference === 'coffee' && favIsTea) return false;
    if (beveragePreference === 'tea' && !favIsTea) return false;
    return true;
  });

  return (
    <View style={styles.container}>
      {/* Przełącznik Kawa vs Herbata — ukryty gdy użytkownik ustawił 'Tylko kawa' lub 'Tylko herbata' */}
      {!isRunning && onBeverageTypeChange && (!beveragePreference || beveragePreference === 'both') && (
        <View style={styles.beverageToggleRow} accessibilityRole="tablist">
          <Pressable
            testID="beverage-toggle-coffee"
            style={[
              styles.beverageToggleBtn,
              currentBeverageType === 'COFFEE' && styles.beverageToggleBtnActiveCoffee,
            ]}
            onPress={() => onBeverageTypeChange('COFFEE')}
            accessibilityRole="tab"
            accessibilityState={{ selected: currentBeverageType === 'COFFEE' }}
            accessibilityLabel="Kategoria Kawa"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text
              style={[
                styles.beverageToggleText,
                currentBeverageType === 'COFFEE' && styles.beverageToggleTextActiveCoffee,
              ]}
            >
              Kawa Specialty
            </Text>
          </Pressable>

          <Pressable
            testID="beverage-toggle-tea"
            style={[
              styles.beverageToggleBtn,
              currentBeverageType === 'TEA' && styles.beverageToggleBtnActiveTea,
            ]}
            onPress={() => onBeverageTypeChange('TEA')}
            accessibilityRole="tab"
            accessibilityState={{ selected: currentBeverageType === 'TEA' }}
            accessibilityLabel="Kategoria Herbata"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text
              style={[
                styles.beverageToggleText,
                currentBeverageType === 'TEA' && styles.beverageToggleTextActiveTea,
              ]}
            >
              Herbata Rzemieślnicza
            </Text>
          </Pressable>
        </View>
      )}
      {/* 1-Click Szybkie Parzenie z Ulubionych Receptur */}
      {filteredFavorites.length > 0 && !isRunning && (
        <View style={styles.favoritesSection}>
          <View style={styles.favoritesTitleRow}>
            <StarIcon size={13} color={theme.colors.copper} filled={true} />
            <Text style={styles.favoritesSectionTitle}>{t.favorites.title}</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.favoritesScroll}
          >
            {filteredFavorites.map((fav) => {
              const isSelected = recipe.id === fav.id;
              const favDose =
                'doseGrams' in fav ? fav.doseGrams : fav.coffeeOrTeaDoseGrams;
              return (
                <Pressable
                  key={fav.id}
                  style={[
                    styles.favoriteChip,
                    isSelected && styles.favoriteChipActive,
                  ]}
                  onPress={() => onSelectRecipe(fav)}
                >
                  <Text
                    style={[
                      styles.favoriteChipText,
                      isSelected && styles.favoriteChipTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    {fav.name}
                  </Text>
                  <Text style={styles.favoriteChipSub}>
                    {fav.method} · {favDose}g
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Pigułka Młynka: Wyeksponowana na górze z dokładnymi klikami (tylko dla kawy) */}
      {!isTea && beveragePreference !== 'tea' && (
        <Pressable
          testID="grinder-pill-btn"
          style={styles.grinderPillCard}
          onPress={onOpenGrinderModal}
          accessibilityRole="button"
          accessibilityLabel={`Młynek: ${grinderRecommendation.grinderName}, nastawa ${grinderRecommendation.formatted}`}
        >
        <View style={styles.pillIconBox}>
          <GrinderIcon size={18} color={theme.colors.copper} />
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.pillEyebrow}>MŁYNEK</Text>
          <Text style={styles.pillValue} numberOfLines={1}>
            {grinderRecommendation.grinderName.split(' ')[0]}:{' '}
            <Text style={{ color: theme.colors.copper, fontWeight: '700' }}>
              {grinderRecommendation.formatted}
            </Text>
          </Text>
        </View>
        <Text style={styles.pillArrow}>›</Text>
      </Pressable>
      )}

      {/* Rząd selektorów: Receptura i Spiżarnia */}
      <View style={styles.selectorRow}>
        <Pressable
          testID="change-recipe-btn"
          style={styles.selectorCard}
          onPress={onOpenRecipeModal}
          accessibilityRole="button"
          accessibilityLabel={`Wybrany przepis: ${recipe.name}`}
        >
          <Text style={styles.selectorEyebrow}>RECEPTURA</Text>
          <Text style={styles.selectorValue} numberOfLines={1}>
            {recipe.name}
          </Text>
          <Text style={styles.selectorSub}>
            {recipe.method} · {waterTempCelsius}°C
          </Text>
        </Pressable>

        <Pressable
          testID="open-inventory-modal-btn"
          style={[
            styles.selectorCard,
            selectedInventoryItem && styles.selectorCardActive,
          ]}
          onPress={onOpenInventoryModal}
          accessibilityRole="button"
          accessibilityLabel="Wybierz ziarna ze spiżarni"
        >
          <Text style={styles.selectorEyebrow}>SPIŻARNIA</Text>
          <Text style={styles.selectorValue} numberOfLines={1}>
            {selectedInventoryItem ? selectedInventoryItem.name : 'Wybierz ziarno...'}
          </Text>
          <Text style={styles.selectorSub}>
            {selectedInventoryItem
              ? `${selectedInventoryItem.remainingWeightGrams}g w paczce`
              : 'Domyślna doza'}
          </Text>
        </Pressable>
      </View>

      {/* Pasek Udostępniania Receptury (Offline QR) */}
      <View style={styles.actionPillsRow}>
        <Pressable
          style={styles.actionPillCard}
          onPress={onOpenShareModal}
          accessibilityRole="button"
          accessibilityLabel="Udostępnij recepturę przez kod QR"
          testID="share-recipe-btn"
        >
          <View style={styles.pillIconBox}>
            <QrIcon size={16} color={theme.colors.copper} />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.pillEyebrow}>UDOSTĘPNIJ</Text>
            <Text style={styles.pillValue} numberOfLines={1}>
              Kod QR / Link
            </Text>
          </View>
          <Text style={styles.pillArrow}>↗</Text>
        </Pressable>
      </View>

      {/* Szybki przełącznik do trybu Gongfu Cha przy parzeniu herbaty */}
      {isTea && beveragePreference !== 'coffee' && (
        <Pressable
          testID="gongfu-mode-btn"
          style={styles.gongfuBanner}
          onPress={onNavigateToGongfu}
        >
          <Text style={styles.gongfuBannerText}>
            Przejdź do Trybu Wielokrotnych Zalań (Gongfu Cha Tracker) →
          </Text>
        </Pressable>
      )}

      {/* Poz. 32 MVP: przepisy na napoje mleczne i latte art (kawa) */}
      {!isTea && beveragePreference !== 'tea' && onNavigateToMilkDrinks && (
        <Pressable
          testID="milk-drinks-btn"
          style={styles.milkBanner}
          onPress={onNavigateToMilkDrinks}
          accessibilityRole="button"
        >
          <Text style={styles.milkBannerText}>{t.milkDrinks.entry}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  beverageToggleRow: {
    flexDirection: 'row',
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.full,
    padding: 3,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 12,
  },
  beverageToggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  beverageToggleBtnActiveCoffee: {
    backgroundColor: 'rgba(200, 106, 40, 0.16)',
    borderWidth: 1,
    borderColor: theme.colors.copper,
  },
  beverageToggleBtnActiveTea: {
    backgroundColor: 'rgba(42, 123, 98, 0.18)',
    borderWidth: 1,
    borderColor: theme.colors.emerald,
  },
  beverageToggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  beverageToggleTextActiveCoffee: {
    color: theme.colors.copperLight,
    fontWeight: '700',
  },
  beverageToggleTextActiveTea: {
    color: theme.colors.emeraldLight,
    fontWeight: '700',
  },
  favoritesSection: {
    marginBottom: 12,
  },
  favoritesTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  favoritesSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.copper,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  favoritesScroll: {
    gap: 8,
    paddingRight: 8,
  },
  favoriteChip: {
    backgroundColor: theme.colors.bgCard,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: 160,
  },
  favoriteChipActive: {
    backgroundColor: 'rgba(217, 119, 54, 0.12)',
    borderColor: theme.colors.copper,
  },
  favoriteChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  favoriteChipTextActive: {
    color: theme.colors.copper,
  },
  favoriteChipSub: {
    fontSize: 10,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  grinderPillCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 10,
    minHeight: 52,
  },
  pillIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(217, 119, 54, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillEyebrow: {
    fontSize: 9,
    fontWeight: '700',
    color: theme.colors.copper,
    letterSpacing: 0.8,
  },
  pillValue: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginTop: 1,
  },
  pillArrow: {
    fontSize: 16,
    color: theme.colors.textMuted,
    marginLeft: 6,
  },
  selectorRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  selectorCard: {
    flex: 1,
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minHeight: 68,
    justifyContent: 'center',
  },
  selectorCardActive: {
    borderColor: theme.colors.copper,
  },
  selectorEyebrow: {
    fontSize: 9,
    fontWeight: '700',
    color: theme.colors.copper,
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  selectorValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  selectorSub: {
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
  actionPillsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  actionPillCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minHeight: 52,
  },
  gongfuBanner: {
    backgroundColor: 'rgba(42, 123, 98, 0.12)',
    borderWidth: 1,
    borderColor: theme.colors.emerald,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginBottom: 12,
    minHeight: 48,
    justifyContent: 'center',
  },
  milkBanner: {
    backgroundColor: theme.colors.copperMuted,
    borderWidth: 1,
    borderColor: theme.colors.copper,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginBottom: 12,
    minHeight: 48,
    justifyContent: 'center',
  },
  milkBannerText: {
    color: theme.colors.copperLight,
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.2,
  },
  gongfuBannerText: {
    color: theme.colors.emeraldLight,
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.2,
  },
});
