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
import { Field, NumInput } from '../src/components/ui';
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
import { formatTemperature, formatDoseWeight, formatWaterWeight } from '../src/core/unit-converter';

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
              // fallback do domyślnych
            }
          }
        }
      } catch (err) {
        console.warn('Błąd wczytywania receptury:', err);
      }
    }
  }, [id]);

  // Kalkulacja Ratio (RD-01)
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
          onPress={() => router.back()}
          hitSlop={8}
          style={styles.headerBtn}
          accessibilityRole="button"
          accessibilityLabel={t.common.close}
        >
          <Text style={styles.headerBtnText}>✕ {t.common.close}</Text>
        </Pressable>
        <Text style={styles.headerTitle}>
          {isEditing ? t.recipeBuilder.titleEdit : t.recipeBuilder.titleNew}
        </Text>
        <Pressable onPress={handleSave} hitSlop={8} style={styles.saveBtn}>
          <Text style={styles.saveBtnText}>{t.common.save}</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Typ naparu: Kawa / Herbata */}
        <View style={styles.typeSelectorRow}>
          <Pressable
            style={[
              styles.typeTab,
              beverageType === 'COFFEE' && styles.typeTabActiveCoffee,
            ]}
            onPress={() => setBeverageType('COFFEE')}
          >
            <Text
              style={[
                styles.typeTabText,
                beverageType === 'COFFEE' && styles.typeTabTextActive,
              ]}
            >
              {t.recipeBuilder.coffee}
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.typeTab,
              beverageType === 'TEA' && styles.typeTabActiveTea,
            ]}
            onPress={() => setBeverageType('TEA')}
          >
            <Text
              style={[
                styles.typeTabText,
                beverageType === 'TEA' && styles.typeTabTextActive,
              ]}
            >
              {t.recipeBuilder.tea}
            </Text>
          </Pressable>
        </View>

        {/* Podstawowe dane */}
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>{t.recipeBuilder.nameLabel} *</Text>
          <Field
            value={name}
            onChangeText={setName}
            placeholder={t.recipeBuilder.namePlaceholder}
          />

          <View style={styles.row}>
            <View style={styles.flex1}>
              <Text style={styles.fieldLabel}>{t.recipeBuilder.methodLabel}</Text>
              <Field
                value={method}
                onChangeText={setMethod}
                placeholder={t.recipeBuilder.methodPlaceholder}
              />
            </View>
            <View style={[styles.flex1, { marginLeft: 10 }]}>
              <Text style={styles.fieldLabel}>{t.recipeBuilder.authorLabel}</Text>
              <Field
                value={author}
                onChangeText={setAuthor}
                placeholder={t.recipeBuilder.authorPlaceholder}
              />
            </View>
          </View>

          <Text style={styles.fieldLabel}>{t.recipeBuilder.descriptionLabel}</Text>
          <Field
            value={description}
            onChangeText={setDescription}
            placeholder={t.recipeBuilder.descriptionPlaceholder}
            multiline
            numberOfLines={2}
          />
        </View>

        {/* Parametry parzenia i Ratio (RD-01) */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Parametry & Proporcja</Text>

          <View style={styles.row}>
            <View style={styles.flex1}>
              <Text style={styles.fieldLabel}>{t.recipeBuilder.doseLabel}</Text>
              <NumInput
                value={parseFloat(doseGrams) || 0}
                onChangeNumber={(n) => setDoseGrams(n.toString())}
                unit="g"
              />
            </View>
            <View style={[styles.flex1, { marginHorizontal: 10 }]}>
              <Text style={styles.fieldLabel}>{t.recipeBuilder.waterLabel}</Text>
              <NumInput
                value={parseFloat(waterGrams) || 0}
                onChangeNumber={(n) => setWaterGrams(n.toString())}
                unit="g"
              />
            </View>
            <View style={styles.flex1}>
              <Text style={styles.fieldLabel}>{t.recipeBuilder.tempLabel}</Text>
              <NumInput
                value={parseFloat(waterTempCelsius) || 0}
                onChangeNumber={(n) => setWaterTempCelsius(n.toString())}
                unit="°C"
              />
            </View>
          </View>

          {/* Badge wyliczonego ratio */}
          <View style={styles.ratioBadge}>
            <Text style={styles.ratioBadgeText}>
              Wyliczona proporcja: <Text style={styles.ratioValue}>1 : {currentRatio}</Text>
            </Text>
          </View>

          {/* Podgląd w wybranym układzie jednostek */}
          <View style={styles.unitPreviewBadge}>
            <Text style={styles.unitPreviewBadgeText}>
              {formatDoseWeight(doseNum, unitSystem)} / {formatWaterWeight(waterNum, unitSystem)} · {formatTemperature(parseFloat(waterTempCelsius) || 93, unitSystem)}
            </Text>
          </View>

          <Text style={styles.fieldLabel}>{t.recipeBuilder.grindLabel}</Text>
          <Field
            value={grindSize}
            onChangeText={setGrindSize}
            placeholder={t.recipeBuilder.grindPlaceholder}
          />
        </View>

        {/* Kroki parzenia (Steps) */}
        <View style={styles.card}>
          <View style={styles.stepsHeader}>
            <Text style={styles.cardTitle}>{t.recipeBuilder.stepsTitle}</Text>
            <Pressable
              style={styles.addStepBtn}
              onPress={handleAddStep}
              hitSlop={8}
            >
              <Text style={styles.addStepBtnText}>{t.recipeBuilder.addStep}</Text>
            </Pressable>
          </View>

          {steps.map((step, index) => (
            <View key={index} style={styles.stepItem}>
              <View style={styles.stepItemHeader}>
                <Text style={styles.stepNumberBadge}>Krok {step.stepNumber}</Text>
                {steps.length > 1 && (
                  <Pressable
                    onPress={() => handleRemoveStep(index)}
                    hitSlop={6}
                    style={styles.removeStepBtn}
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
                    onChangeText={(val) => handleUpdateStep(index, 'namePl', val)}
                  />
                </View>
                <View style={[styles.flex1, { marginHorizontal: 8 }]}>
                  <Text style={styles.subFieldLabel}>Waga docelowa (g)</Text>
                  <NumInput
                    value={step.targetWaterGrams}
                    onChangeNumber={(val) =>
                      handleUpdateStep(index, 'targetWaterGrams', val)
                    }
                    unit="g"
                  />
                </View>
                <View style={styles.flex1}>
                  <Text style={styles.subFieldLabel}>Czas (sekundy)</Text>
                  <NumInput
                    value={step.durationSeconds}
                    onChangeNumber={(val) =>
                      handleUpdateStep(index, 'durationSeconds', Math.round(val))
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
                onChangeText={(val) => handleUpdateStep(index, 'instructionPl', val)}
                placeholder={t.recipeBuilder.stepInstructionPlaceholder}
              />
            </View>
          ))}
        </View>

        {/* Przycisk zapisu */}
        <Pressable testID="recipe-builder-save-btn" style={styles.mainSaveBtn} onPress={handleSave}>
          <Text style={styles.mainSaveBtnText}>{t.recipeBuilder.saveRecipeBtn}</Text>
        </Pressable>

        {/* Przycisk usuwania i duplikowania (w trybie edycji) */}
        {isEditing && (
          <>
            <Pressable style={styles.duplicateBtn} onPress={handleDuplicate}>
              <Text style={styles.duplicateBtnText}>{t.recipeBuilder.duplicateBtn}</Text>
            </Pressable>
            <Pressable style={styles.deleteBtn} onPress={handleDelete}>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.bgCard,
  },
  headerBtn: {
    padding: 4,
  },
  headerBtnText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  headerTitle: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  saveBtn: {
    backgroundColor: theme.colors.copper,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
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
  card: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 6,
  },
  subFieldLabel: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginBottom: 4,
  },
  input: {
    backgroundColor: theme.colors.bgCardSecondary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: theme.colors.textPrimary,
    fontSize: 14,
    marginBottom: 12,
  },
  textArea: {
    height: 60,
    textAlignVertical: 'top',
  },
  smallInput: {
    backgroundColor: theme.colors.bgCardSecondary,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 8,
    paddingVertical: 6,
    color: theme.colors.textPrimary,
    fontSize: 13,
  },
  row: {
    flexDirection: 'row',
  },
  flex1: {
    flex: 1,
  },
  ratioBadge: {
    backgroundColor: 'rgba(217, 119, 54, 0.1)',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 54, 0.3)',
  },
  ratioBadgeText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
  },
  ratioValue: {
    color: theme.colors.copper,
    fontWeight: '700',
    fontSize: 15,
  },
  unitPreviewBadge: {
    backgroundColor: theme.colors.bgCardSecondary,
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  unitPreviewBadgeText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  stepsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  addStepBtn: {
    backgroundColor: 'rgba(217, 119, 54, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  addStepBtnText: {
    color: theme.colors.copper,
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
  },
  removeStepBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(217, 83, 79, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeStepBtnText: {
    color: theme.colors.danger,
    fontSize: 12,
    fontWeight: '700',
  },
  mainSaveBtn: {
    backgroundColor: theme.colors.copper,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
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
  },
  deleteBtnText: {
    color: theme.colors.danger,
    fontWeight: '600',
    fontSize: 14,
  },
});
