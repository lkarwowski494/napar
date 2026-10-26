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
  const stepPrefix = t?.recipeBuilder?.stepNumberPrefix || 'Krok';

  return (
    <View style={styles.card}>
      <View style={styles.stepsHeader}>
        <Text style={styles.cardTitle} accessibilityRole="header">
          {t?.recipeBuilder?.stepsTitle || 'Kroki parzenia'}
        </Text>
        <Pressable
          testID="add-step-btn"
          style={styles.addStepBtn}
          onPress={onAddStep}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t?.recipeBuilder?.addStep || '+ Dodaj krok'}
          accessibilityHint={t?.recipeBuilder?.addStepHint || 'Dodaje nowy krok do receptury parzenia'}
        >
          <Text style={styles.addStepBtnText}>{t?.recipeBuilder?.addStep || '+ Dodaj krok'}</Text>
        </Pressable>
      </View>

      {(Array.isArray(steps) ? steps : []).map((step, index) => {
        if (!step || typeof step !== 'object') return null;
        const stepNum = step.stepNumber || index + 1;
        return (
        <View key={index} style={styles.stepItem}>
          <View style={styles.stepItemHeader}>
            <Text style={styles.stepNumberBadge} accessibilityRole="text">
              {`${stepPrefix} ${stepNum}`}
            </Text>
            {steps && steps.length > 0 && (
              <Pressable
                onPress={() => onRemoveStep(index)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.removeStepBtn}
                accessibilityRole="button"
                accessibilityLabel={`${t?.recipeBuilder?.removeStep || 'Usuń krok'} ${stepNum}`}
                accessibilityHint={`Usuwa krok ${stepNum} z receptury`}
                testID={`remove-step-${stepNum}`}
              >
                <Text style={styles.removeStepBtnText}>✕</Text>
              </Pressable>
            )}
          </View>

          <View style={styles.row}>
            <View style={styles.flex1}>
              <Text style={styles.subFieldLabel}>
                {t?.recipeBuilder?.stepName || 'Nazwa kroku'}
              </Text>
              <Field
                testID={`step-name-${stepNum}`}
                value={step.namePl ?? ''}
                onChangeText={(val) => onUpdateStep(index, 'namePl', typeof val === 'string' ? val.slice(0, 100) : '')}
                accessibilityLabel={`${t?.recipeBuilder?.stepName || 'Nazwa kroku'} ${stepNum}`}
                accessibilityHint={t?.recipeBuilder?.stepNameHint || 'Wpisz nazwę tego kroku parzenia'}
              />
            </View>
            <View style={[styles.flex1, { marginHorizontal: 8 }]}>
              <Text style={styles.subFieldLabel}>
                {t?.recipeBuilder?.stepWaterGrams || 'Waga docelowa (g)'}
              </Text>
              <NumInput
                testID={`step-water-${stepNum}`}
                value={step.targetWaterGrams}
                onChangeNumber={(val) => {
                  const parsedVal = typeof val === 'number'
                    ? val
                    : (typeof val === 'string' ? parseFloat(val.replace(',', '.')) : 0);
                  const rawVal = Number.isFinite(parsedVal) ? parsedVal : 0;
                  const safeVal = Math.max(0, Math.min(50000, Math.round(rawVal)));
                  onUpdateStep(index, 'targetWaterGrams', Object.is(safeVal, -0) ? 0 : safeVal);
                }}
                unit="g"
                accessibilityLabel={`${t?.recipeBuilder?.stepWaterGrams || 'Waga docelowa'} ${stepNum}`}
                accessibilityHint={t?.recipeBuilder?.stepWaterHint || 'Wpisz docelową wagę wody w gramach'}
              />
            </View>
            <View style={styles.flex1}>
              <Text style={styles.subFieldLabel}>
                {t?.recipeBuilder?.stepDurationSec || 'Czas trwania kroku (s)'}
              </Text>
              <NumInput
                testID={`step-duration-${stepNum}`}
                value={step.durationSeconds}
                onChangeNumber={(val) => {
                  const parsedVal = typeof val === 'number'
                    ? val
                    : (typeof val === 'string' ? parseFloat(val.replace(',', '.')) : 0);
                  const rawVal = Number.isFinite(parsedVal) ? parsedVal : 0;
                  const safeVal = Math.max(0, Math.min(86400, Math.round(rawVal)));
                  onUpdateStep(index, 'durationSeconds', Object.is(safeVal, -0) ? 0 : safeVal);
                }}
                unit="s"
                accessibilityLabel={`${t?.recipeBuilder?.stepDurationSec || 'Czas trwania kroku'} ${stepNum}`}
                accessibilityHint={t?.recipeBuilder?.stepDurationHint || 'Wpisz czas trwania tego kroku w sekundach'}
              />
            </View>
          </View>

          <Text style={[styles.subFieldLabel, { marginTop: 6 }]}>
            {t?.recipeBuilder?.stepInstruction || 'Instrukcja kroku'}
          </Text>
          <Field
            testID={`step-instruction-${stepNum}`}
            value={step.instructionPl ?? ''}
            onChangeText={(val) => onUpdateStep(index, 'instructionPl', typeof val === 'string' ? val.slice(0, 2000) : '')}
            placeholder={t?.recipeBuilder?.stepInstructionPlaceholder || 'np. Wlej 50g wody'}
            accessibilityLabel={`${t?.recipeBuilder?.stepInstruction || 'Instrukcja kroku'} ${stepNum}`}
            accessibilityHint={t?.recipeBuilder?.stepInstructionHint || 'Wpisz szczegółową instrukcję wykonania kroku'}
          />
        </View>
        );
      })}
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
