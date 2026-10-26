// ============================================================================
// Napar (Steepwise) — RecipeTypeSelector Component
// Beverage type toggle (Coffee vs Tea)
// ============================================================================

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { theme } from '../../core/theme';

interface RecipeTypeSelectorProps {
  beverageType: 'COFFEE' | 'TEA';
  onSelectType: (type: 'COFFEE' | 'TEA') => void;
  coffeeLabel: string;
  teaLabel: string;
}

export const RecipeTypeSelector: React.FC<RecipeTypeSelectorProps> = ({
  beverageType,
  onSelectType,
  coffeeLabel,
  teaLabel,
}) => {
  return (
    <View
      style={styles.typeSelectorRow}
      accessibilityRole="radiogroup"
      accessibilityLabel="Wybór typu naparu / Beverage type selection"
      testID="recipe-type-selector"
    >
      <Pressable
        style={[
          styles.typeTab,
          beverageType === 'COFFEE' && styles.typeTabActiveCoffee,
        ]}
        onPress={() => onSelectType('COFFEE')}
        accessibilityRole="radio"
        accessibilityState={{ selected: beverageType === 'COFFEE' }}
        accessibilityLabel={coffeeLabel}
        accessibilityHint="Przełącza parametry i metody na profil kawowy / Switches to coffee brewing profile"
      >
        <Text
          style={[
            styles.typeTabText,
            beverageType === 'COFFEE' && styles.typeTabTextActive,
          ]}
        >
          {coffeeLabel}
        </Text>
      </Pressable>
      <Pressable
        style={[
          styles.typeTab,
          beverageType === 'TEA' && styles.typeTabActiveTea,
        ]}
        onPress={() => onSelectType('TEA')}
        accessibilityRole="radio"
        accessibilityState={{ selected: beverageType === 'TEA' }}
        accessibilityLabel={teaLabel}
        accessibilityHint="Przełącza parametry i metody na profil herbaciany / Switches to tea brewing profile"
      >
        <Text
          style={[
            styles.typeTabText,
            beverageType === 'TEA' && styles.typeTabTextActive,
          ]}
        >
          {teaLabel}
        </Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  typeSelectorRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  typeTab: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: theme.colors.bgCard,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    minHeight: 48,
    justifyContent: 'center',
  },
  typeTabActiveCoffee: {
    backgroundColor: 'rgba(217, 119, 54, 0.15)',
    borderColor: theme.colors.copper,
  },
  typeTabActiveTea: {
    backgroundColor: 'rgba(42, 123, 98, 0.15)',
    borderColor: theme.colors.emerald,
  },
  typeTabText: {
    color: theme.colors.textSecondary,
    fontWeight: '600',
    fontSize: 14,
  },
  typeTabTextActive: {
    color: theme.colors.textPrimary,
    fontWeight: '700',
  },
});
