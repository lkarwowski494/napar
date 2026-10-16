// ============================================================================
// Napar (Steepwise) — BrewHeader Component (Kitchen-Proof UI)
// Prominent Grinder Dial-in Clicks, Recipe & Stash Selectors, Quick Actions.
// Apps4Brew Studio — 100% Offline-First.
// ============================================================================

import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { theme } from '../../core/theme';
import { useTranslation } from '../../core/i18n';
import { InventoryItem } from '../../core/database-schema';

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
  onSelectRecipe: (r: any) => void;
  onOpenRecipeModal: () => void;
  onOpenInventoryModal: () => void;
  onOpenGrinderModal: () => void;
  onOpenShareModal: () => void;
  onNavigateToGongfu: () => void;
}

export function BrewHeader({
  recipe,
  selectedInventoryItem,
  waterTempCelsius,
  grinderRecommendation,
  favoriteRecipes = [],
  isRunning = false,
  onSelectRecipe,
  onOpenRecipeModal,
  onOpenInventoryModal,
  onOpenGrinderModal,
  onOpenShareModal,
  onNavigateToGongfu,
}: BrewHeaderProps) {
  const { t } = useTranslation();

  const isTea =
    'beverageType' in recipe
      ? recipe.beverageType === 'TEA'
      : (recipe as any).type === 'TEA';

  return (
    <View style={styles.container}>
      {/* 1-Click Szybkie Parzenie z Ulubionych Receptur */}
      {favoriteRecipes.length > 0 && !isRunning && (
        <View style={styles.favoritesSection}>
          <Text style={styles.favoritesSectionTitle}>⭐ {t.favorites.title}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.favoritesScroll}
          >
            {favoriteRecipes.map((fav) => {
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

      {/* Pigułka Młynka: Wyeksponowana na górze z dokładnymi klikami */}
      <Pressable
        testID="grinder-pill-btn"
        style={styles.actionPillCard}
        onPress={onOpenGrinderModal}
        accessibilityRole="button"
        accessibilityLabel={`Młynek: ${grinderRecommendation.grinderName}, nastawa ${grinderRecommendation.formatted}`}
      >
        <Text style={styles.actionPillIcon}>⚙️</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.actionPillLabel}>MŁYNEK</Text>
          <Text style={styles.actionPillValue} numberOfLines={1}>
            {grinderRecommendation.grinderName.split(' ')[0]}:{' '}
            <Text style={{ color: theme.colors.copper, fontWeight: '700' }}>
              {grinderRecommendation.formatted}
            </Text>
          </Text>
        </View>
        <Text style={styles.actionPillArrow}>›</Text>
      </Pressable>

      {/* Rząd selektorów: Receptura i Spiżarnia */}
      <View style={styles.selectorRow}>
        <Pressable
          style={styles.selectorCard}
          onPress={onOpenRecipeModal}
          accessibilityRole="button"
          accessibilityLabel={`Wybrany przepis: ${recipe.name}`}
        >
          <Text style={styles.selectorLabel}>RECEPTURA</Text>
          <Text style={styles.selectorValue} numberOfLines={1}>
            {recipe.name}
          </Text>
          <Text style={styles.selectorSub}>
            {recipe.method} · {waterTempCelsius}°C
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.selectorCard,
            selectedInventoryItem && styles.selectorCardActive,
          ]}
          onPress={onOpenInventoryModal}
          accessibilityRole="button"
          accessibilityLabel="Wybierz ziarna ze spiżarni"
        >
          <Text style={styles.selectorLabel}>SPIŻARNIA</Text>
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
          <Text style={styles.actionPillIcon}>📱</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.actionPillLabel}>UDOSTĘPNIJ</Text>
            <Text style={styles.actionPillValue} numberOfLines={1}>
              Kod QR / Link
            </Text>
          </View>
          <Text style={styles.actionPillArrow}>↗</Text>
        </Pressable>
      </View>

      {/* Szybki przełącznik do trybu Gongfu Cha przy parzeniu herbaty */}
      {isTea && (
        <Pressable style={styles.gongfuBanner} onPress={onNavigateToGongfu}>
          <Text style={styles.gongfuBannerText}>
            🍵 Przejdź do Trybu Wielokrotnych Zalań (Gongfu Cha Tracker) →
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  favoritesSection: {
    marginBottom: 12,
  },
  favoritesSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.copper,
    letterSpacing: 0.5,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  favoritesScroll: {
    gap: 8,
    paddingRight: 8,
  },
  favoriteChip: {
    backgroundColor: theme.colors.bgCardSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: 160,
  },
  favoriteChipActive: {
    backgroundColor: 'rgba(217, 119, 54, 0.15)',
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
  },
  selectorCardActive: {
    borderColor: theme.colors.copper,
  },
  selectorLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.copper,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  selectorValue: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  selectorSub: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  actionPillsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  actionPillCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.md,
    padding: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 10,
  },
  actionPillIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  actionPillLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: theme.colors.copper,
    letterSpacing: 0.5,
  },
  actionPillValue: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  actionPillArrow: {
    fontSize: 16,
    color: theme.colors.textMuted,
    marginLeft: 4,
  },
  gongfuBanner: {
    backgroundColor: 'rgba(42, 123, 98, 0.15)',
    borderWidth: 1,
    borderColor: theme.colors.emerald,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  gongfuBannerText: {
    color: theme.colors.emeraldLight,
    fontWeight: '700',
    fontSize: 13,
  },
});
