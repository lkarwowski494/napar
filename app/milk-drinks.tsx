// ============================================================================
// Napar (Steepwise) — Napoje mleczne i latte art (poz. 32 MVP)
// Ekran modalny: pięć przepisów z domyślnymi proporcjami [OCENA].
// Logika w src/core/milk-drinks.ts; karta w src/components/milk/MilkDrinkCard.tsx.
// ============================================================================

import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getUnitSystem } from '../src/core/database';
import { MILK_DRINKS } from '../src/core/milk-drinks';
import { theme } from '../src/core/theme';
import { useTranslation } from '../src/core/i18n';
import { MilkDrinkCard } from '../src/components/milk/MilkDrinkCard';

export default function MilkDrinksScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const unitSystem = getUnitSystem();

  const closeScreen = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable
          testID="milk-drinks-close-btn"
          onPress={closeScreen}
          hitSlop={8}
          style={styles.headerBtn}
          accessibilityRole="button"
          accessibilityLabel={t.common.close}
        >
          <Text style={styles.headerBtnText}>✕ {t.common.close}</Text>
        </Pressable>
        <Text style={styles.headerTitle} accessibilityRole="header">
          {t.milkDrinks.title}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.intro}>{t.milkDrinks.intro}</Text>
        {MILK_DRINKS.map((drink) => (
          <MilkDrinkCard key={drink.id} drink={drink} unitSystem={unitSystem} />
        ))}
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
  headerSpacer: {
    width: 44,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  intro: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
});
