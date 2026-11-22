// ============================================================================
// Napar — Kreator Własnych Receptur (Custom Recipe Builder)
// Apps4Brew: 100% Offline-first, Zero login, SQLite local persistence
// ============================================================================

import React, { useState, useEffect } from 'react';
import {
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Field, ModalHeader } from '../src/components/ui';
import { getRecipeById, saveRecipe, deleteRecipe, duplicateRecipe, getUnitSystem } from '../src/data/database';
import { SavedRecipe } from '../src/core/database-schema';
import { RecipeStep } from '../src/core/recipes-data';
import { calculateBrewRatio } from '../src/core/domain-rules';
import { theme } from '../src/core/theme';
import { confirmAction } from '../src/platform/confirm';
import { announce } from '../src/platform/announce';
import { useTranslation, formatTemplate } from '../src/core/i18n';
import { RecipeBasicInfoCard } from '../src/components/recipe-builder/RecipeBasicInfoCard';
import { RecipeParamsCard } from '../src/components/recipe-builder/RecipeParamsCard';
import { RecipeStepEditor } from '../src/components/recipe-builder/RecipeStepEditor';
import { RecipeTypeSelector } from '../src/components/recipe-builder/RecipeTypeSelector';
import { runSave } from '../lib/save-feedback';

export default function RecipeBuilderScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { t, language } = useTranslation();
  const [unitSystem] = useState<'metric' | 'imperial'>(() => {
    try {
      return getUnitSystem();
    } catch {
      return 'metric';
    }
  });

  const isEditing = Boolean(id);

  // Form State
  const [name, setName] = useState('');
  const [beverageType, setBeverageType] = useState<'COFFEE' | 'TEA'>('COFFEE');
  const [method, setMethod] = useState('V60');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');
  const [doseGrams, setDoseGrams] = useState('15.0');
  const [waterGrams, setWaterGrams] = useState('250.0');
  const [waterTempCelsius, setWaterTempCelsius] = useState('93');
  const [grindSize, setGrindSize] = useState('');
  const [steps, setSteps] = useState<RecipeStep[]>([
    {
      stepNumber: 1,
      namePl: 'Preinfuzja (Bloom)',
      targetWaterGrams: 50,
      durationSeconds: 45,
      instructionPl: 'Zalej 50g wody spiralnym ruchem, odgazuj.',
    },
    {
      stepNumber: 2,
      namePl: 'Główne zalanie',
      targetWaterGrams: 250,
      durationSeconds: 105,
      instructionPl: 'Zalewaj ciągłym, spokojnym strumieniem do 250g.',
    },
  ]);

  const [originalIsFavorite, setOriginalIsFavorite] = useState<boolean>(false);
  const [originalCreatedAt, setOriginalCreatedAt] = useState<string | null>(null);

  // Wczytanie istniejącej receptury w trybie edycji
  useEffect(() => {
    if (id) {
      try {
        const existing = getRecipeById(id);
        if (existing) {
          setName(existing.name);
          setBeverageType(existing.beverageType);
          setMethod(existing.method);
          setAuthor(existing.author || '');
          setDescription(existing.description || '');
          setDoseGrams(existing.doseGrams.toString());
          setWaterGrams(existing.waterGrams.toString());
          setWaterTempCelsius(existing.waterTempCelsius.toString());
          setGrindSize(existing.grindSizeDescription || '');
          setOriginalIsFavorite(Boolean(existing.isFavorite));
          setOriginalCreatedAt(existing.createdAt || null);

          if (existing.stepsJson) {
            try {
              const parsed = JSON.parse(existing.stepsJson);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setSteps(parsed);
              }
            } catch {
              // fallback
            }
          }
        }
      } catch (err) {
        console.warn('[recipe-builder] Failed to load recipe:', err);
      }
    }
  }, [id]);

  const doseNum = parseFloat(doseGrams) || 15;
  const waterNum = parseFloat(waterGrams) || 250;
  const currentRatio = calculateBrewRatio(doseNum, waterNum);

  const handleAddStep = () => {
    const nextNumber = steps.length + 1;
    const lastWater = steps.length > 0 ? steps[steps.length - 1].targetWaterGrams : 0;
    const nextWater = Math.min(waterNum, lastWater + 60);

    const newStep: RecipeStep = {
      stepNumber: nextNumber,
      namePl: `Zalanie ${nextNumber}`,
      targetWaterGrams: nextWater > lastWater ? nextWater : lastWater + 30,
      durationSeconds: 40,
      instructionPl: `Zalewaj równomiernie do ${nextWater}g.`,
    };

    setSteps([...steps, newStep]);
    announce(formatTemplate(t.recipeBuilder.stepAddedAnnounce, { number: nextNumber }));
  };

  const handleRemoveStep = (index: number) => {
    if (steps.length <= 1) {
      Alert.alert(t.recipeBuilder.removeStep, t.recipeBuilder.fillRequired);
      return;
    }
    const filtered = steps
      .filter((_, i) => i !== index)
      .map((s, idx) => ({
        ...s,
        stepNumber: idx + 1,
        namePl: s.namePl.startsWith('Zalanie') ? `Zalanie ${idx + 1}` : s.namePl,
      }));
    setSteps(filtered);
    announce(t.recipeBuilder.stepRemovedAnnounce);
  };

  const handleUpdateStep = (
    index: number,
    field: keyof RecipeStep,
    value: string | number
  ) => {
    const updated = [...steps];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setSteps(updated);
  };

  const isDirty = name.trim().length > 0 || author.trim().length > 0 || description.trim().length > 0 || grindSize.trim().length > 0;

  const handleClose = () => {
    if (isDirty) {
      Alert.alert(
        language === 'en' ? 'Discard changes?' : 'Odrzucić zmiany?',
        language === 'en'
          ? 'You have unsaved changes. Are you sure you want to discard them?'
          : 'Masz niezapisane zmiany w formularzu. Czy na pewno chcesz je odrzucić?',
        [
          { text: language === 'en' ? 'Keep Editing' : 'Wróć do edycji', style: 'cancel' },
          {
            text: language === 'en' ? 'Discard' : 'Odrzuć zmiany',
            style: 'destructive',
            onPress: () => router.back(),
          },
        ]
      );
    } else {
      router.back();
    }
  };

  const handleSave = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert(t.recipeBuilder.titleNew, t.recipeBuilder.fillRequired);
      return;
    }

    if (steps.length === 0) {
      Alert.alert(t.recipeBuilder.titleNew, t.recipeBuilder.fillRequired);
      return;
    }

    const recipe: SavedRecipe = {
      id: id || `custom-${Date.now()}`,
      name: trimmedName,
      beverageType,
      method: method.trim() || 'Manual Drip',
      author: author.trim() || undefined,
      description: description.trim() || undefined,
      doseGrams: parseFloat(doseGrams.replace(',', '.')),
      waterGrams: parseFloat(waterGrams.replace(',', '.')),
      // M1-audytor-generalny-008: bez 93 °C / 15 g / 250 g w miejsce złej liczby; saveRecipe zgłasza błąd walidacji.
      waterTempCelsius: parseFloat(waterTempCelsius.replace(',', '.')),
      grindSizeDescription: grindSize.trim() || undefined,
      recommendedRatio: currentRatio,
      stepsJson: JSON.stringify(steps),
      isCustom: true,
      isFavorite: id ? originalIsFavorite : false,
      createdAt: id && originalCreatedAt ? originalCreatedAt : new Date().toISOString(),
    };

    if (!runSave(() => saveRecipe(recipe), t.common)) return;
    announce(t.recipeBuilder.saveRecipeBtn);
    router.back();
  };

  const handleDelete = () => {
    if (!id) return;
    confirmAction({
      title: t.recipeBuilder.deleteRecipeConfirmTitle,
      message: t.recipeBuilder.deleteRecipeConfirmMsg,
      actionText: t.common.delete,
      destructive: true,
      onConfirm: () => {
        if (!runSave(() => deleteRecipe(id), t.common)) return;
        announce(t.common.delete);
        router.back();
      },
    });
  };

  const handleDuplicate = () => {
    if (!id) return;
    const existing = getRecipeById(id);
    if (!existing) return;
    let cloned: ReturnType<typeof duplicateRecipe> | undefined;
    if (!runSave(() => { cloned = duplicateRecipe(existing); }, t.common) || !cloned) return;
    announce(t.recipeBuilder.duplicateBtn);
    Alert.alert(t.recipeBuilder.duplicatedTitle, formatTemplate(t.recipeBuilder.duplicatedMsg, { name: cloned.name }));
    router.back();
  };

  return (
    <SafeAreaView testID="ekran:recipe-builder" style={styles.safeArea}>
      <ModalHeader
        onClose={handleClose}
        closeLabel={t.common.cancel}
        title={isEditing ? t.recipeBuilder.titleEdit : t.recipeBuilder.titleNew}
        onSave={handleSave}
        saveLabel={t.common.save}
        saveTestID="recipe-builder-save-btn"
        style={styles.header}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Typ naparu: Kawa / Herbata */}
        <RecipeTypeSelector
          beverageType={beverageType}
          onSelectType={setBeverageType}
          coffeeLabel={t.recipeBuilder.coffee}
          teaLabel={t.recipeBuilder.tea}
        />

        {/* Podstawowe dane */}
        <RecipeBasicInfoCard
          name={name}
          onChangeName={setName}
          method={method}
          onChangeMethod={setMethod}
          author={author}
          onChangeAuthor={setAuthor}
          description={description}
          onChangeDescription={setDescription}
          t={t}
        />

        {/* Parametry parzenia i Ratio (RD-01) */}
        <RecipeParamsCard
          doseGrams={doseGrams}
          onChangeDose={setDoseGrams}
          waterGrams={waterGrams}
          onChangeWater={setWaterGrams}
          waterTempCelsius={waterTempCelsius}
          onChangeWaterTemp={setWaterTempCelsius}
          grindSize={grindSize}
          onChangeGrindSize={setGrindSize}
          currentRatio={currentRatio}
          unitSystem={unitSystem}
          t={t}
        />

        {/* Kroki parzenia (Steps) */}
        <RecipeStepEditor
          steps={steps}
          onAddStep={handleAddStep}
          onRemoveStep={handleRemoveStep}
          onUpdateStep={handleUpdateStep}
          t={t}
        />

        {/* Akcje dodatkowe: Duplikuj / Usuń w trybie edycji */}
        {isEditing && (
          <>
            <Pressable
              style={styles.duplicateBtn}
              onPress={handleDuplicate}
              accessibilityRole="button"
              accessibilityLabel={t.recipeBuilder.duplicateBtn}
            >
              <Text style={styles.duplicateBtnText}>{t.recipeBuilder.duplicateBtn}</Text>
            </Pressable>

            <Pressable
              style={styles.deleteBtn}
              onPress={handleDelete}
              accessibilityRole="button"
              accessibilityLabel={t.common.delete}
            >
              <Text style={styles.deleteBtnText}>{t.common.delete}</Text>
            </Pressable>
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
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  duplicateBtn: {
    backgroundColor: theme.colors.bgCardSecondary,
    borderWidth: 1,
    borderColor: theme.colors.copper,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 10,
    minHeight: 48,
    justifyContent: 'center',
  },
  duplicateBtnText: {
    color: theme.colors.copperLight,
    fontWeight: '600',
    fontSize: 14,
  },
  deleteBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.danger,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  deleteBtnText: {
    color: theme.colors.danger,
    fontWeight: '600',
    fontSize: 14,
  },
});
