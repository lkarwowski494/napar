// ============================================================================
// Napar (Steepwise) — Karta napoju mlecznego (poz. 32 MVP)
// Składniki w mililitrach (lub fl oz), zakres temperatury mleka z zastrzeżeniem,
// zmiana objętości filiżanki i kroki w stylu receptur (jak app/recipe.tsx).
// ============================================================================

import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { theme } from '../../core/theme';
import { useTranslation } from '../../core/i18n';
import { formatTemperature, mlToFluidOunces, UnitSystem } from '../../core/unit-converter';
import {
  MILK_CUP_MAX_ML,
  MILK_CUP_MIN_ML,
  MilkDrinkRecipe,
  scaleMilkDrinkComponents,
  stepMilkCupVolumeMl,
} from '../../core/milk-drinks';

interface MilkDrinkCardProps {
  drink: MilkDrinkRecipe;
  unitSystem: UnitSystem;
}

export function formatMilkVolume(ml: number, unitSystem: UnitSystem): string {
  if (unitSystem === 'imperial') {
    return `${mlToFluidOunces(ml)} fl oz`;
  }
  return `${ml} ml`;
}

export function MilkDrinkCard({ drink, unitSystem }: MilkDrinkCardProps) {
  const { t } = useTranslation();
  const texts = t.milkDrinks;
  const drinkTexts = texts.drinks[drink.id] as Record<string, string>;
  const [cupMl, setCupMl] = useState(drink.cupVolumeMl);
  const components = scaleMilkDrinkComponents(drink, cupMl);
  const temperature = drink.milkTemperatureC;

  return (
    <View style={styles.card} testID={`milk-drink-${drink.id}`}>
      <Text style={styles.name}>{drinkTexts.name}</Text>
      <Text style={styles.description}>{drinkTexts.description}</Text>

      <Text style={styles.sectionTitle}>{texts.cupLabel}</Text>
      {drink.scalable ? (
        <View style={styles.cupRow}>
          <Pressable
            testID={`milk-cup-smaller-${drink.id}`}
            onPress={() => setCupMl((v) => stepMilkCupVolumeMl(v, -1))}
            disabled={cupMl <= MILK_CUP_MIN_ML}
            accessibilityRole="button"
            accessibilityLabel={texts.cupSmaller}
            accessibilityState={{ disabled: cupMl <= MILK_CUP_MIN_ML }}
            style={[styles.cupBtn, cupMl <= MILK_CUP_MIN_ML && styles.cupBtnDisabled]}
          >
            <Text style={styles.cupBtnText}>−</Text>
          </Pressable>
          <Text style={styles.cupValue}>
            {texts.cupValue.replace('{volume}', formatMilkVolume(cupMl, unitSystem))}
          </Text>
          <Pressable
            testID={`milk-cup-larger-${drink.id}`}
            onPress={() => setCupMl((v) => stepMilkCupVolumeMl(v, 1))}
            disabled={cupMl >= MILK_CUP_MAX_ML}
            accessibilityRole="button"
            accessibilityLabel={texts.cupLarger}
            accessibilityState={{ disabled: cupMl >= MILK_CUP_MAX_ML }}
            style={[styles.cupBtn, cupMl >= MILK_CUP_MAX_ML && styles.cupBtnDisabled]}
          >
            <Text style={styles.cupBtnText}>+</Text>
          </Pressable>
        </View>
      ) : (
        <Text style={styles.row}>
          {texts.cupValue.replace('{volume}', formatMilkVolume(drink.cupVolumeMl, unitSystem))}
          {' · '}
          {texts.fixedCup}
        </Text>
      )}

      <Text style={styles.sectionTitle}>{texts.ingredients}</Text>
      {components.map((c, index) => (
        <Text key={`${c.kind}-${index}`} style={styles.row} testID={`milk-ingredient-${drink.id}-${c.kind}`}>
          {texts.ingredient[c.kind]}: {formatMilkVolume(c.volumeMl, unitSystem)}
        </Text>
      ))}

      <Text style={styles.sectionTitle}>{texts.milkTemperature}</Text>
      {temperature ? (
        <>
          <Text style={styles.row}>
            {formatTemperature(temperature.minC, unitSystem)} – {formatTemperature(temperature.maxC, unitSystem)}
          </Text>
          <Text style={styles.note}>{texts.milkTemperatureNote}</Text>
        </>
      ) : (
        <Text style={styles.row}>{texts.noMilk}</Text>
      )}

      <Text style={styles.sectionTitle}>{texts.steps}</Text>
      {drink.stepKeys.map((key, index) => (
        <Text key={key} style={styles.row}>
          {index + 1}. {drinkTexts[key]}
        </Text>
      ))}

      <View style={styles.tip}>
        <Text style={styles.sectionTitle}>{texts.tipTitle}</Text>
        <Text style={styles.row}>{drinkTexts.tip}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 16,
    marginBottom: 16,
  },
  name: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  description: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    marginBottom: 8,
  },
  sectionTitle: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 6,
  },
  row: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    lineHeight: 22,
  },
  note: {
    color: theme.colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
  cupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cupBtn: {
    minWidth: 44,
    minHeight: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cupBtnDisabled: {
    opacity: 0.4,
  },
  cupBtnText: {
    color: theme.colors.copper,
    fontSize: 20,
    fontWeight: '700',
  },
  cupValue: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  tip: {
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
});
