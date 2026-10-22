// ============================================================================
// Napar (Steepwise) — Otwieranie linku receptury (napar://recipe?v=1&d=...)
// Podgląd przed zapisem: nic nie trafia do bazy, dopóki użytkownik nie kliknie Zapisz.
// Dekodowanie wyłącznie przez src/core/recipe-share.ts (offline, bez sieci).
// ============================================================================

import React, { useMemo } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { saveRecipe, getUnitSystem } from '../src/core/database';
import { decodeRecipeFromShareUrl } from '../src/core/recipe-share';
import { formatDoseWeight, formatWaterWeight, formatTemperature } from '../src/core/unit-converter';
import { announce } from '../src/core/announce';
import { theme } from '../src/core/theme';
import { useTranslation } from '../src/core/i18n';

export default function RecipeLinkScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ d?: string }>();
  const unitSystem = getUnitSystem();

  const rawData = typeof params.d === 'string' ? params.d : '';
  // Dekodowanie raz na link; identyfikator nowej receptury powstaje tutaj
  const decoded = useMemo(() => decodeRecipeFromShareUrl(rawData), [rawData]);

  const closeScreen = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  const handleSave = () => {
    if (!decoded) return;
    try {
      saveRecipe(decoded.recipe);
      announce(t.recipeLink.saved);
      closeScreen();
    } catch {
      Alert.alert(t.recipeLink.title, t.recipeLink.saveFailed);
    }
  };

  const recipe = decoded?.recipe;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable
          testID="recipe-link-close-btn"
          onPress={closeScreen}
          hitSlop={8}
          style={styles.headerBtn}
          accessibilityRole="button"
          accessibilityLabel={t.common.close}
        >
          <Text style={styles.headerBtnText}>✕ {t.common.close}</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{t.recipeLink.title}</Text>
        <Pressable
          testID="recipe-link-save-btn"
          onPress={handleSave}
          disabled={!recipe}
          hitSlop={8}
          style={[styles.saveBtn, !recipe && styles.saveBtnDisabled]}
          accessibilityRole="button"
          accessibilityState={{ disabled: !recipe }}
          accessibilityLabel={t.common.save}
        >
          <Text style={styles.saveBtnText}>{t.common.save}</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {!recipe ? (
          <Text testID="recipe-link-invalid" style={styles.invalidText}>
            {t.recipeLink.invalid}
          </Text>
        ) : (
          <>
            <Text style={styles.previewNote}>{t.recipeLink.preview}</Text>
            <View style={styles.card}>
              <Text testID="recipe-link-name" style={styles.recipeName}>
                {recipe.name}
              </Text>
              <Text style={styles.row}>
                {t.recipeLink.method}: {recipe.method}
              </Text>
              <Text style={styles.row}>
                {t.recipeLink.dose}: {formatDoseWeight(recipe.doseGrams, unitSystem)}
              </Text>
              <Text style={styles.row}>
                {t.recipeLink.water}: {formatWaterWeight(recipe.waterGrams, unitSystem)}
              </Text>
              <Text style={styles.row}>
                {t.recipeLink.temperature}: {formatTemperature(recipe.waterTempCelsius, unitSystem)}
              </Text>
            </View>

            <Text style={styles.sectionTitle}>{t.recipeLink.steps}</Text>
            <View style={styles.card}>
              {decoded.originalSteps.length === 0 ? (
                <Text style={styles.row}>{t.recipeLink.noSteps}</Text>
              ) : (
                decoded.originalSteps.map((step) => (
                  <Text key={step.stepNumber} style={styles.row}>
                    {step.stepNumber}. {step.namePl}
                    {step.targetWaterGrams > 0
                      ? ` (${formatWaterWeight(step.targetWaterGrams, unitSystem)})`
                      : ''}
                  </Text>
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.bgCard,
  },
  headerBtn: {
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
  },
  headerBtnText: {
    color: theme.colors.textSecondary,
    fontSize: 15,
  },
  headerTitle: {
    color: theme.colors.textPrimary,
    fontSize: 17,
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: theme.colors.copper,
    paddingHorizontal: 16,
    borderRadius: 8,
    minHeight: 44,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.4,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  previewNote: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    marginBottom: 12,
  },
  invalidText: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 32,
  },
  card: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 16,
    marginBottom: 16,
  },
  recipeName: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  row: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    lineHeight: 22,
  },
  sectionTitle: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
});
