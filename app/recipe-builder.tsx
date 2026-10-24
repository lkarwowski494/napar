// ============================================================================
// Napar (Steepwise) — Kreator Własnych Receptur (Custom Recipe Builder)
// Apps4Brew: 100% Offline-first, Zero login, SQLite local persistence
// ============================================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Field } from '../src/components/ui';
import { getRecipeById, saveRecipe, deleteRecipe, duplicateRecipe, getUnitSystem } from '../src/core/database';
import { SavedRecipe } from '../src/core/database-schema';
import { RecipeStep } from '../src/core/recipes-data';
import { calculateBrewRatio } from '../src/core/domain-rules';
import { theme } from '../src/core/theme';
import { confirmAction } from '../src/core/confirm';
import { announce } from '../src/core/announce';
import { useTranslation } from '../src/core/i18n';
import { useAppAccess } from '../src/core/app-access';
import { Apps4BrewPassModal } from '../src/components/Apps4BrewPassModal';
import { RecipeBasicInfoCard } from '../src/components/recipe-builder/RecipeBasicInfoCard';
import { RecipeParamsCard } from '../src/components/recipe-builder/RecipeParamsCard';
import { RecipeStepEditor } from '../src/components/recipe-builder/RecipeStepEditor';
import { RecipeTypeSelector } from '../src/components/recipe-builder/RecipeTypeSelector';

export default function RecipeBuilderScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { t, language } = useTranslation();
  const { canCreate, refresh } = useAppAccess();
  const [unitSystem] = useState<'metric' | 'imperial'>(() => {
    try {
      return getUnitSystem();
    } catch {
      return 'metric';
    }
  });
  const [showPaywall, setShowPaywall] = useState(false);

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
    announce(`Dodano krok ${nextNumber}`);
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
    announce(`Usunięto krok`);
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
    if (!canCreate) {
      setShowPaywall(true);
      return;
    }

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
      doseGrams: doseNum,
      waterGrams: waterNum,
      waterTempCelsius: parseFloat(waterTempCelsius) || 93,
      grindSizeDescription: grindSize.trim() || undefined,
      recommendedRatio: currentRatio,
      stepsJson: JSON.stringify(steps),
      isCustom: true,
      isFavorite: false,
      createdAt: new Date().toISOString(),
    };

    saveRecipe(recipe);
    announce(t.recipeBuilder.saveRecipeBtn);
    router.back();
  };

  const handleDelete = () => {
    if (!id) return;
    if (!canCreate) {
      setShowPaywall(true);
      return;
    }
    confirmAction({
      title: t.recipeBuilder.deleteRecipeConfirmTitle,
      message: t.recipeBuilder.deleteRecipeConfirmMsg,
      actionText: t.common.delete,
      destructive: true,
      onConfirm: () => {
        deleteRecipe(id);
        announce(t.common.delete);
        router.back();
      },
    });
  };

  const handleDuplicate = () => {
    if (!id) return;
    if (!canCreate) {
      setShowPaywall(true);
      return;
    }
    const existing = getRecipeById(id);
    if (!existing) return;
    const cloned = duplicateRecipe(existing);
    announce(t.recipeBuilder.duplicateBtn);
    Alert.alert('Zduplikowano', `Utworzono kopię: "${cloned.name}"`);
    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable
          onPress={handleClose}
          hitSlop={8}
          style={styles.headerBtn}
          accessibilityRole="button"
          accessibilityLabel={t.common.cancel}
        >
          <Text style={styles.headerBtnText}>{t.common.cancel}</Text>
        </Pressable>
        <Text style={styles.headerTitle}>
          {isEditing ? t.recipeBuilder.titleEdit : t.recipeBuilder.titleNew}
        </Text>
        <Pressable
          onPress={handleSave}
          hitSlop={8}
          style={styles.saveBtn}
          accessibilityRole="button"
          accessibilityLabel={t.common.save}
        >
          <Text style={styles.saveBtnText}>{t.common.save}</Text>
        </Pressable>
      </View>

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

        {/* Przycisk zapisu */}
        <Pressable
          testID="recipe-builder-save-btn"
          style={styles.mainSaveBtn}
          onPress={handleSave}
          accessibilityRole="button"
          accessibilityLabel={t.recipeBuilder.saveRecipeBtn}
        >
          <Text style={styles.mainSaveBtnText}>{t.recipeBuilder.saveRecipeBtn}</Text>
        </Pressable>

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
      <Apps4BrewPassModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        onPurchaseSuccess={refresh}
        onSubscribed={refresh}
      />
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
    padding: 6,
    minHeight: 48,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBtnText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  saveBtn: {
    backgroundColor: theme.colors.copper,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minHeight: 48,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  mainSaveBtn: {
    backgroundColor: theme.colors.copper,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
    minHeight: 48,
    justifyContent: 'center',
  },
  mainSaveBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
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
