// ============================================================================
// Napar (Steepwise) — RecipeStepEditor Component
// Multi-step infusion sequence builder with time, water target, and instructions
// ============================================================================

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Field, NumInput } from '../ui';
import { RecipeStep } from '../../core/recipes-data';
import { theme } from '../../core/theme';

interface RecipeStepEditorProps {
  steps: RecipeStep[];
  onAddStep: () => void;
  onRemoveStep: (index: number) => void;
  onUpdateStep: (index: number, key: keyof RecipeStep, value: any) => void;
  t: any;
}

export const RecipeStepEditor: React.FC<RecipeStepEditorProps> = ({
  steps,
  onAddStep,
  onRemoveStep,
  onUpdateStep,
  t,
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.stepsHeader}>
        <Text style={styles.cardTitle}>{t.recipeBuilder.stepsTitle}</Text>
        <Pressable
          style={styles.addStepBtn}
          onPress={onAddStep}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t.recipeBuilder.addStep}
          accessibilityHint="Dodaje nowy krok do receptury parzenia"
        >
          <Text style={styles.addStepBtnText}>{t.recipeBuilder.addStep}</Text>
        </Pressable>
      </View>

      {steps.map((step, index) => (
        <View key={index} style={styles.stepItem}>
          <View style={styles.stepItemHeader}>
            <Text style={styles.stepNumberBadge}>Krok {step.stepNumber}</Text>
            {steps.length > 0 && (
              <Pressable
                onPress={() => onRemoveStep(index)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.removeStepBtn}
                accessibilityRole="button"
                accessibilityLabel={`${t.recipeBuilder?.removeStep || 'Usuń krok'} ${step.stepNumber}`}
                accessibilityHint={`Usuwa krok ${step.stepNumber} z receptury`}
                testID={`remove-step-${step.stepNumber}`}
              >
                <Text style={styles.removeStepBtnText}>✕</Text>
              </Pressable>
            )}
          </View>

          <View style={styles.row}>
            <View style={styles.flex1}>
              <Text style={styles.subFieldLabel}>Nazwa kroku</Text>
              <Field
                value={step.namePl}
                onChangeText={(val) => onUpdateStep(index, 'namePl', val)}
              />
            </View>
            <View style={[styles.flex1, { marginHorizontal: 8 }]}>
              <Text style={styles.subFieldLabel}>Waga docelowa (g)</Text>
              <NumInput
                value={step.targetWaterGrams}
                onChangeNumber={(val) => onUpdateStep(index, 'targetWaterGrams', val)}
                unit="g"
              />
            </View>
            <View style={styles.flex1}>
              <Text style={styles.subFieldLabel}>Czas (sekundy)</Text>
              <NumInput
                value={step.durationSeconds}
                onChangeNumber={(val) =>
                  onUpdateStep(index, 'durationSeconds', Math.round(val))
                }
                unit="s"
              />
            </View>
          </View>

          <Text style={[styles.subFieldLabel, { marginTop: 6 }]}>
            {t.recipeBuilder.stepInstruction}
          </Text>
          <Field
            value={step.instructionPl}
            onChangeText={(val) => onUpdateStep(index, 'instructionPl', val)}
            placeholder={t.recipeBuilder.stepInstructionPlaceholder}
          />
        </View>
      ))}
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
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  stepsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  addStepBtn: {
    backgroundColor: theme.colors.copper,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    minHeight: 48,
    minWidth: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addStepBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  stepItem: {
    backgroundColor: theme.colors.bgCardSecondary,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  stepItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepNumberBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.copper,
    textTransform: 'uppercase',
  },
  removeStepBtn: {
    padding: 4,
    minHeight: 48,
    minWidth: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeStepBtnText: {
    color: theme.colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flex1: {
    flex: 1,
  },
  subFieldLabel: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginBottom: 4,
    fontWeight: '600',
  },
});
