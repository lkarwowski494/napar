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
        {t.recipeBuilder.nameLabel} *
      </Text>
      <Field
        value={name}
        onChangeText={onChangeName}
        placeholder={t.recipeBuilder.namePlaceholder}
        accessibilityLabel={t.recipeBuilder.nameLabel}
        testID="recipe-name-field"
      />

      <View style={styles.row}>
        <View style={styles.flex1}>
          <Text style={styles.fieldLabel}>{t.recipeBuilder.methodLabel}</Text>
          <Field
            value={method}
            onChangeText={onChangeMethod}
            placeholder={t.recipeBuilder.methodPlaceholder}
            accessibilityLabel={t.recipeBuilder.methodLabel}
            testID="recipe-method-field"
          />
        </View>
        <View style={[styles.flex1, { marginLeft: 10 }]}>
          <Text style={styles.fieldLabel}>{t.recipeBuilder.authorLabel}</Text>
          <Field
            value={author}
            onChangeText={onChangeAuthor}
            placeholder={t.recipeBuilder.authorPlaceholder}
            accessibilityLabel={t.recipeBuilder.authorLabel}
            testID="recipe-author-field"
          />
        </View>
      </View>

      <Text style={styles.fieldLabel}>{t.recipeBuilder.descriptionLabel}</Text>
      <Field
        value={description}
        onChangeText={onChangeDescription}
        placeholder={t.recipeBuilder.descriptionPlaceholder}
        accessibilityLabel={t.recipeBuilder.descriptionLabel}
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
