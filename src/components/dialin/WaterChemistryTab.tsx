import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput } from 'react-native';
import {
  WATER_RECIPES,
  BOTTLED_WATER_BENCHMARKS,
  calculateWaterMinerals,
  diagnoseWaterSensoryImpact,
} from '../../core/water-chemistry';
import { theme } from '../../core/theme';

export interface WaterChemistryTabProps {
  language: string;
  t: any;
}

export const WaterChemistryTab: React.FC<WaterChemistryTabProps> = ({ language, t }) => {
  const [selectedWaterRecipeId, setSelectedWaterRecipeId] = useState<string>('barista_hustle_80_40');
  const [waterVolumeInput, setWaterVolumeInput] = useState<string>('1.0');
  const [customGhInput, setCustomGhInput] = useState<string>('80');
  const [customKhInput, setCustomKhInput] = useState<string>('40');
  const [isCustomWater, setIsCustomWater] = useState<boolean>(false);

  const selectedRecipeObj =
    WATER_RECIPES.find((r) => r.id === selectedWaterRecipeId) || WATER_RECIPES[0];

  const waterCalc = useMemo(() => {
    const vol = parseFloat(waterVolumeInput) || 1.0;
    const gh = isCustomWater
      ? parseFloat(customGhInput) || 80
      : selectedRecipeObj.targetGhPpm;
    const kh = isCustomWater
      ? parseFloat(customKhInput) || 40
      : selectedRecipeObj.targetKhPpm;
    return calculateWaterMinerals(vol, gh, kh);
  }, [
    waterVolumeInput,
    isCustomWater,
    customGhInput,
    customKhInput,
    selectedRecipeObj,
  ]);

  const waterDiagnosis = useMemo(
    () => diagnoseWaterSensoryImpact(waterCalc.targetGhPpm, waterCalc.targetKhPpm),
    [waterCalc]
  );

  return (
    <View>
      <Text style={styles.sectionHeader}>{t.water.title}</Text>
      <Text style={styles.sectionSub}>{t.water.subtitle}</Text>

      {/* Szybki wybór objętości wody bazowej */}
      <View style={styles.waterVolumeCard}>
        <Text style={styles.cardSectionTitle}>{t.water.waterVolumeLabel}</Text>
        <View style={styles.volumeChipsRow}>
          {['1.0', '2.0', '5.0'].map((vol) => (
            <Pressable
              key={vol}
              style={[
                styles.volumeChip,
                waterVolumeInput === vol && styles.volumeChipActive,
              ]}
              onPress={() => setWaterVolumeInput(vol)}
            >
              <Text
                style={[
                  styles.volumeChipText,
                  waterVolumeInput === vol && styles.volumeChipTextActive,
                ]}
              >
                {vol} L
              </Text>
            </Pressable>
          ))}
          <View style={styles.volumeInputBox}>
            <TextInput
              style={styles.volumeCustomInput}
              keyboardType="decimal-pad"
              value={waterVolumeInput}
              onChangeText={setWaterVolumeInput}
            />
            <Text style={styles.volumeCustomUnit}>L</Text>
          </View>
        </View>
      </View>

      {/* Profile mineralizacji wody */}
      <Text style={styles.cardSectionTitle}>{t.water.recipeSelectLabel}</Text>
      <View style={styles.waterRecipesList}>
        {WATER_RECIPES.map((recipe) => {
          const isSelected = !isCustomWater && selectedWaterRecipeId === recipe.id;
          return (
            <Pressable
              key={recipe.id}
              style={[
                styles.waterRecipeCard,
                isSelected && styles.waterRecipeCardActive,
              ]}
              onPress={() => {
                setIsCustomWater(false);
                setSelectedWaterRecipeId(recipe.id);
              }}
            >
              <View style={styles.waterRecipeHeader}>
                <Text style={styles.waterRecipeName}>
                  {language === 'pl' ? recipe.namePl : recipe.nameEn}
                </Text>
                <View style={styles.waterGhKhBadges}>
                  <Text style={styles.waterGhBadge}>GH {recipe.targetGhPpm}</Text>
                  <Text style={styles.waterKhBadge}>KH {recipe.targetKhPpm}</Text>
                </View>
              </View>
              <Text style={styles.waterRecipeDesc}>
                {language === 'pl' ? recipe.descriptionPl : recipe.descriptionEn}
              </Text>
              <Text style={styles.waterRecipeBestFor}>
                {language === 'pl' ? recipe.bestForPl : recipe.bestForEn}
              </Text>
            </Pressable>
          );
        })}

        {/* Opcja własnego profilu (Custom GH/KH) */}
        <Pressable
          style={[
            styles.waterRecipeCard,
            isCustomWater && styles.waterRecipeCardActive,
          ]}
          onPress={() => setIsCustomWater(true)}
        >
          <Text style={styles.waterRecipeName}>Własny profil (Custom GH / KH)</Text>
          {isCustomWater && (
            <View style={styles.customWaterInputsRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.customInputSubLabel}>GH (ppm CaCO₃)</Text>
                <TextInput
                  style={styles.customWaterInput}
                  keyboardType="number-pad"
                  value={customGhInput}
                  onChangeText={setCustomGhInput}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.customInputSubLabel}>KH (ppm CaCO₃)</Text>
                <TextInput
                  style={styles.customWaterInput}
                  keyboardType="number-pad"
                  value={customKhInput}
                  onChangeText={setCustomKhInput}
                />
              </View>
            </View>
          )}
        </Pressable>
      </View>

      {/* KARTA METODY A: SYSTEM KONCENTRATÓW BARISTA HUSTLE */}
      <View style={styles.methodCard}>
        <View style={styles.methodHeaderBadge}>
          <Text style={styles.methodBadgeText}>REKOMENDOWANA METODA A</Text>
        </View>
        <Text style={styles.methodTitle}>{t.water.methodAHeader}</Text>
        <Text style={styles.methodDesc}>{t.water.methodADesc}</Text>

        <View style={styles.concentrateDoseRow}>
          <View style={styles.concentrateBox}>
            <Text style={styles.concentrateLabel}>{t.water.bufferGrams}</Text>
            <Text style={styles.concentrateValue}>
              {waterCalc.concentrateBufferGrams} g
            </Text>
            <Text style={styles.concentrateSub}>KH {waterCalc.targetKhPpm} ppm (bufor)</Text>
          </View>

          <View style={styles.concentrateBox}>
            <Text style={styles.concentrateLabel}>{t.water.hardnessGrams}</Text>
            <Text style={styles.concentrateValue}>
              {waterCalc.concentrateHardnessGrams} g
            </Text>
            <Text style={styles.concentrateSub}>GH {waterCalc.targetGhPpm} ppm (magnez)</Text>
          </View>
        </View>

        <Text style={styles.concentrateHelpText}>
          {t.water.concentrateHelp}
        </Text>
      </View>

      {/* KARTA METODY B: SUCHE SOLE */}
      <View style={[styles.methodCard, { marginTop: 12 }]}>
        <Text style={styles.methodTitle}>{t.water.methodBHeader}</Text>
        <Text style={styles.methodDesc}>
          Ważenie suchych soli prosto do {waterCalc.waterVolumeLiters}L wody:
        </Text>

        <View style={styles.drySaltRow}>
          <Text style={styles.drySaltName}>{t.water.dryBakingSoda}</Text>
          <Text style={styles.drySaltAmount}>{waterCalc.dryBakingSodaNaHCO3Grams} g</Text>
        </View>

        <View style={styles.drySaltRow}>
          <Text style={styles.drySaltName}>{t.water.dryEpsom}</Text>
          <Text style={styles.drySaltAmount}>{waterCalc.dryEpsomSaltMgSO4Grams} g</Text>
        </View>

        <View style={styles.drySaltRow}>
          <Text style={styles.drySaltName}>{t.water.dryCalcium} (opcja)</Text>
          <Text style={styles.drySaltAmount}>{waterCalc.dryCalciumChlorideCaCl2Grams} g</Text>
        </View>
      </View>

      {/* DIAGNOZA SENSORYCZNA WODY */}
      <View style={styles.waterInfoCard} testID="water-diagnosis-card">
        <Text style={styles.waterInfoHeader}>{t.water.diagnosisHeader}</Text>
        <Text style={styles.waterInfoLabel}>{t.water.diagnosisProblem}</Text>
        <Text style={styles.waterInfoText}>
          {language === 'pl' ? waterDiagnosis.problemPl : waterDiagnosis.problemEn}
        </Text>
        <Text style={styles.waterInfoLabel}>{t.water.diagnosisCause}</Text>
        <Text style={styles.waterInfoText}>
          {language === 'pl' ? waterDiagnosis.causePl : waterDiagnosis.causeEn}
        </Text>
        <Text style={styles.waterInfoLabel}>{t.water.diagnosisRemedy}</Text>
        <Text style={styles.waterInfoText}>
          {language === 'pl' ? waterDiagnosis.recommendationPl : waterDiagnosis.recommendationEn}
        </Text>
      </View>

      {/* BENCHMARK WÓD BUTELKOWANYCH */}
      <View style={styles.waterInfoCard} testID="bottled-water-card">
        <Text style={styles.waterInfoHeader}>{t.water.bottledHeader}</Text>
        <Text style={styles.waterInfoText}>{t.water.bottledSubtitle}</Text>
        {BOTTLED_WATER_BENCHMARKS.map((b) => (
          <View key={b.id} style={styles.bottledRow}>
            <View style={{ flex: 1, flexShrink: 1 }}>
              <Text style={styles.bottledName}>
                {b.brandName} · TDS {b.tdsPpm} · GH {b.estimatedGhPpm} · KH {b.estimatedKhPpm}
              </Text>
              <Text style={styles.waterInfoText}>
                {language === 'pl' ? b.verdictPl : b.verdictEn}
              </Text>
            </View>
            <Text style={styles.bottledBadge}>
              {t.water[`suitability${b.suitability}` as keyof typeof t.water]}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  sectionSub: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginBottom: 16,
    lineHeight: 18,
  },
  waterVolumeCard: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.md,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  volumeChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  volumeChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.bgCardSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  volumeChipActive: {
    backgroundColor: theme.colors.copperMuted,
    borderColor: theme.colors.copper,
  },
  volumeChipText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  volumeChipTextActive: {
    color: theme.colors.copperLight,
    fontWeight: '700',
  },
  volumeInputBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.bgCardSecondary,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 12,
  },
  volumeCustomInput: {
    flex: 1,
    paddingVertical: 10,
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  volumeCustomUnit: {
    fontSize: 13,
    color: theme.colors.textMuted,
    fontWeight: '600',
    marginLeft: 4,
  },
  waterRecipesList: {
    gap: 10,
    marginBottom: 16,
  },
  waterRecipeCard: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  waterRecipeCardActive: {
    borderColor: theme.colors.copper,
    backgroundColor: theme.colors.copperMuted,
  },
  waterRecipeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  waterRecipeName: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    flex: 1,
  },
  waterGhKhBadges: {
    flexDirection: 'row',
    gap: 6,
  },
  waterGhBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.copperLight,
    backgroundColor: theme.colors.copperMuted,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  waterKhBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    backgroundColor: theme.colors.bgCardSecondary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  waterRecipeDesc: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    lineHeight: 16,
    marginBottom: 6,
  },
  waterRecipeBestFor: {
    fontSize: 11,
    color: theme.colors.copper,
    fontWeight: '600',
  },
  customWaterInputsRow: {
    flexDirection: 'row',
    marginTop: 12,
  },
  customInputSubLabel: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    fontWeight: '600',
    marginBottom: 4,
  },
  customWaterInput: {
    backgroundColor: theme.colors.bgCardSecondary,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: theme.colors.textPrimary,
    fontSize: 14,
  },
  methodCard: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  methodHeaderBadge: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.copperMuted,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.sm,
    marginBottom: 8,
  },
  methodBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.copper,
    letterSpacing: 0.5,
  },
  methodTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 6,
  },
  methodDesc: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  concentrateDoseRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  concentrateBox: {
    flex: 1,
    backgroundColor: theme.colors.bgCardSecondary,
    borderRadius: theme.borderRadius.sm,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  concentrateLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  concentrateValue: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.copper,
    marginBottom: 2,
  },
  concentrateSub: {
    fontSize: 11,
    color: theme.colors.textMuted,
  },
  concentrateHelpText: {
    fontSize: 12,
    color: theme.colors.textMuted,
    lineHeight: 16,
  },
  drySaltRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  drySaltName: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  drySaltAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.copper,
  },
  waterInfoCard: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.md,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  waterInfoHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 8,
  },
  waterInfoLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.copper,
    marginTop: 8,
    textTransform: 'uppercase',
  },
  waterInfoText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  bottledRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    marginTop: 8,
  },
  bottledName: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  bottledBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
});
