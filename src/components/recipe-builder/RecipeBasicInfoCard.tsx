// ============================================================================
// Napar (Steepwise) — RecipeBasicInfoCard Component
// Name, method, author, and description fields
// ============================================================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Field } from '../ui';
import { theme } from '../../core/theme';

interface RecipeBasicInfoCardProps {
  name: string;
  onChangeName: (name: string) => void;
  method: string;
  onChangeMethod: (method: string) => void;
  author: string;
  onChangeAuthor: (author: string) => void;
  description: string;
  onChangeDescription: (desc: string) => void;
  t: any;
}

export const RecipeBasicInfoCard: React.FC<RecipeBasicInfoCardProps> = ({
  name,
  onChangeName,
  method,
  onChangeMethod,
  author,
  onChangeAuthor,
  description,
  onChangeDescription,
  t,
}) => {
  return (
    <View style={styles.card} testID="recipe-basic-info-card">
      <Text style={styles.fieldLabel} accessibilityRole="header">
        {t?.recipeBuilder?.nameLabel || 'Nazwa'} *
      </Text>
      <Field
        value={name ?? ''}
        onChangeText={(text) => onChangeName(typeof text === 'string' ? text.slice(0, 100) : '')}
        maxLength={100}
        placeholder={t?.recipeBuilder?.namePlaceholder || 'np. Etiopia V60'}
        accessibilityLabel={t?.recipeBuilder?.nameLabel || 'Nazwa'}
        accessibilityHint={t?.recipeBuilder?.namePlaceholder || 'Wprowadź nazwę przepisu'}
        testID="recipe-name-field"
      />

      <View style={styles.row}>
        <View style={styles.flex1}>
          <Text style={styles.fieldLabel}>{t?.recipeBuilder?.methodLabel || 'Metoda'}</Text>
          <Field
            value={method ?? ''}
            onChangeText={(text) => onChangeMethod(typeof text === 'string' ? text.slice(0, 50) : '')}
            maxLength={50}
            placeholder={t?.recipeBuilder?.methodPlaceholder || 'np. V60'}
            accessibilityLabel={t?.recipeBuilder?.methodLabel || 'Metoda'}
            accessibilityHint={t?.recipeBuilder?.methodPlaceholder || 'Wprowadź metodę parzenia'}
            testID="recipe-method-field"
          />
        </View>
        <View style={[styles.flex1, { marginLeft: 10 }]}>
          <Text style={styles.fieldLabel}>{t?.recipeBuilder?.authorLabel || 'Autor'}</Text>
          <Field
            value={author ?? ''}
            onChangeText={(text) => onChangeAuthor(typeof text === 'string' ? text.slice(0, 50) : '')}
            maxLength={50}
            placeholder={t?.recipeBuilder?.authorPlaceholder || 'np. James Hoffmann'}
            accessibilityLabel={t?.recipeBuilder?.authorLabel || 'Autor'}
            accessibilityHint={t?.recipeBuilder?.authorPlaceholder || 'Wprowadź autora przepisu'}
            testID="recipe-author-field"
          />
        </View>
      </View>

      <Text style={styles.fieldLabel}>{t?.recipeBuilder?.descriptionLabel || 'Opis'}</Text>
      <Field
        value={description ?? ''}
        onChangeText={(text) => onChangeDescription(typeof text === 'string' ? text.slice(0, 1000) : '')}
        maxLength={1000}
        placeholder={t?.recipeBuilder?.descriptionPlaceholder || 'np. Przepis na słodki, owocowy przelew...'}
        accessibilityLabel={t?.recipeBuilder?.descriptionLabel || 'Opis'}
        accessibilityHint={t?.recipeBuilder?.descriptionPlaceholder || 'Wprowadź opis przepisu'}
        testID="recipe-description-field"
        multiline
        numberOfLines={2}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  flex1: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 6,
  },
});
