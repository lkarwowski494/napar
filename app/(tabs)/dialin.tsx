// ============================================================================
// Napar (Steepwise) — Dial-in Doctor & Kalkulatory Ekstrakcji
// Deterministyczny kompas sensoryczny, dwukierunkowe Ratio i TDS / EY%
// ============================================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  diagnoseExtractionTaste,
  calculateBrewWater,
  calculateBrewDose,
  calculateLiquidYield,
  calculateExtractionYield,
} from '../../src/core/domain-rules';
import {
  WATER_RECIPES,
  BOTTLED_WATER_BENCHMARKS,
  calculateWaterMinerals,
  diagnoseWaterSensoryImpact,
  WaterRecipe,
} from '../../src/core/water-chemistry';
import {
  SUPPORTED_GRINDERS,
  GRIND_CATEGORIES,
  convertMicronsToGrinder,
} from '../../src/core/grinder-converter';
import { CaffeineIcon } from '../../src/components/icons/CraftIcons';
import { theme } from '../../src/core/theme';
import { useTranslation } from '../../src/core/i18n';
import { getUnitSystem } from '../../src/core/database';
import { formatDoseWeight, formatWaterWeight } from '../../src/core/unit-converter';

export default function DialInScreen() {
  const router = useRouter();
  const { t, language } = useTranslation();
  const unitSystem = getUnitSystem();
  const [activeTab, setActiveTab] = useState<'doctor' | 'ratio' | 'ey' | 'water'>('doctor');

  // Stan: Dial-in Doctor
  const [selectedIssue, setSelectedIssue] = useState<string>('sour');

  // Stan: Kalkulator Mineralizacji Wody
  const [selectedWaterRecipeId, setSelectedWaterRecipeId] = useState<string>('barista_hustle_80_40');
  const [waterVolumeInput, setWaterVolumeInput] = useState<string>('1.0');
  const [customGhInput, setCustomGhInput] = useState<string>('80');
  const [customKhInput, setCustomKhInput] = useState<string>('40');
  const [isCustomWater, setIsCustomWater] = useState<boolean>(false);

  const selectedRecipeObj =
    WATER_RECIPES.find((r) => r.id === selectedWaterRecipeId) || WATER_RECIPES[0];

  const waterCalc = React.useMemo(() => {
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

  const waterDiagnosis = React.useMemo(
    () => diagnoseWaterSensoryImpact(waterCalc.targetGhPpm, waterCalc.targetKhPpm),
    [waterCalc]
  );

  // Stan: Przelicznik Młynków
  const [selectedGrindCategoryId, setSelectedGrindCategoryId] = useState<string>('pourover_v60');
  const activeGrindCategory =
    GRIND_CATEGORIES.find((c) => c.id === selectedGrindCategoryId) || GRIND_CATEGORIES[2];

  // Stan: Kalkulator Ratio
  const [calcDirection, setCalcDirection] = useState<'doseToWater' | 'waterToDose'>('doseToWater');
  const [doseInput, setDoseInput] = useState('18');
  const [waterInput, setWaterInput] = useState('300');
  const [ratioVal, setRatioVal] = useState(16.6);
  const [waterCalcResult, setWaterCalcResult] = useState<number>(() =>
    calculateBrewWater(18, 16.6)
  );
  const [doseCalcResult, setDoseCalcResult] = useState<number>(() =>
    calculateBrewDose(300, 16.6)
  );
  const [yieldResult, setYieldResult] = useState<number>(() =>
    calculateLiquidYield(300, 18)
  );

  // Stan: Kalkulator TDS / EY
  const [eyWater, setEyWater] = useState('250');
  const [eyDose, setEyDose] = useState('15');
  const [eyTds, setEyTds] = useState('1.35');

  // Diagnoza kompasu
  const diagnosis = React.useMemo(() => {
    let list = [];
    switch (selectedIssue) {
      case 'sour':
        list = diagnoseExtractionTaste({ isSour: true });
        break;
      case 'bitter':
        list = diagnoseExtractionTaste({ isBitter: true });
        break;
      case 'weak':
        list = diagnoseExtractionTaste({ isWatery: true });
        break;
      case 'astringent_tea':
        list = diagnoseExtractionTaste({ isAstringent: true });
        break;
      default:
        list = diagnoseExtractionTaste({});
        break;
    }
    return list[0] || {
      issue: 'Balans w normie',
      recommendationPl: 'Filiżanka mieści się w standardowym oknie ekstrakcji.',
    };
  }, [selectedIssue]);

  const handleDoseChange = (text: string) => {
    setDoseInput(text);
    const d = parseFloat(text);
    if (!isNaN(d) && d > 0) {
      const w = calculateBrewWater(d, ratioVal);
      setWaterCalcResult(w);
      setYieldResult(calculateLiquidYield(w, d));
    }
  };

  const handleWaterChange = (text: string) => {
    setWaterInput(text);
    const w = parseFloat(text);
    if (!isNaN(w) && w > 0) {
      const d = calculateBrewDose(w, ratioVal);
      setDoseCalcResult(d);
      setYieldResult(calculateLiquidYield(w, d));
    }
  };

  const handleRatioSelect = (newRatio: number) => {
    setRatioVal(newRatio);
    if (calcDirection === 'doseToWater') {
      const d = parseFloat(doseInput);
      if (!isNaN(d) && d > 0) {
        const w = calculateBrewWater(d, newRatio);
        setWaterCalcResult(w);
        setYieldResult(calculateLiquidYield(w, d));
      }
    } else {
      const w = parseFloat(waterInput);
      if (!isNaN(w) && w > 0) {
        const d = calculateBrewDose(w, newRatio);
        setDoseCalcResult(d);
        setYieldResult(calculateLiquidYield(w, d));
      }
    }
  };

  const handleDirectionChange = (dir: 'doseToWater' | 'waterToDose') => {
    setCalcDirection(dir);
    if (dir === 'doseToWater') {
      const d = parseFloat(doseInput);
      if (!isNaN(d) && d > 0) {
        const w = calculateBrewWater(d, ratioVal);
        setWaterCalcResult(w);
        setYieldResult(calculateLiquidYield(w, d));
      }
    } else {
      const w = parseFloat(waterInput);
      if (!isNaN(w) && w > 0) {
        const d = calculateBrewDose(w, ratioVal);
        setDoseCalcResult(d);
        setYieldResult(calculateLiquidYield(w, d));
      }
    }
  };

  // Obliczenie EY%
  const eyResult = React.useMemo(() => {
    const w = parseFloat(eyWater);
    const d = parseFloat(eyDose);
    const tds = parseFloat(eyTds);
    if (!isNaN(w) && !isNaN(d) && !isNaN(tds) && w > 0 && d > 0 && tds > 0) {
      try {
        return calculateExtractionYield(w, tds, d);
      } catch {
        return null;
      }
    }
    return null;
  }, [eyWater, eyDose, eyTds]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Przełącznik zakładek */}
      <View style={styles.segmentBar}>
        <Pressable
          style={[styles.segmentBtn, activeTab === 'doctor' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('doctor')}
        >
          <Text
            style={[
              styles.segmentBtnText,
              activeTab === 'doctor' && styles.segmentBtnTextActive,
            ]}
          >
            Dial-in Doctor
          </Text>
        </Pressable>

        <Pressable
          style={[styles.segmentBtn, activeTab === 'ratio' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('ratio')}
        >
          <Text
            style={[
              styles.segmentBtnText,
              activeTab === 'ratio' && styles.segmentBtnTextActive,
            ]}
          >
            Ratio & Uzysk
          </Text>
        </Pressable>

        <Pressable
          style={[styles.segmentBtn, activeTab === 'ey' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('ey')}
        >
          <Text
            style={[
              styles.segmentBtnText,
              activeTab === 'ey' && styles.segmentBtnTextActive,
            ]}
          >
            TDS & EY%
          </Text>
        </Pressable>

        <Pressable
          style={[styles.segmentBtn, activeTab === 'water' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('water')}
        >
          <Text
            style={[
              styles.segmentBtnText,
              activeTab === 'water' && styles.segmentBtnTextActive,
            ]}
          >
            {t.water.tabTitle}
          </Text>
        </Pressable>
      </View>

      {/* 1. DIAL-IN DOCTOR */}
      {activeTab === 'doctor' && (
        <View>
          <Text style={styles.sectionHeader}>Diagnoza Niepożądanego Smaku</Text>
          <Text style={styles.sectionSub}>
            Wybierz dominujący problem w filiżance. Kompas ekstrakcji wskaże precyzyjną korektę mielenia i temperatury.
          </Text>

          <View style={styles.issuesList}>
            {[
              {
                id: 'sour',
                title: '🍋 Zbyt kwaśna / ostra / trawiasta',
                desc: 'Brak słodyczy, cierpki finisz, cytrynowa kwasowość.',
              },
              {
                id: 'bitter',
                title: '🍫 Za gorzka / ściągająca / sucha',
                desc: 'Wrażenie suchości na języku (ashy), popiołowość, ciemna gorycz.',
              },
              {
                id: 'weak',
                title: '💧 Płaska / mdła / wodnista',
                desc: 'Brak ciała, herbaciana konsystencja bez wyrazistej słodyczy.',
              },
              {
                id: 'astringent_tea',
                title: '🍵 Herbata ściągająca gardło',
                desc: 'Zbyt wysoka temperatura zniszczyła subtelne katechiny i l-teaninę.',
              },
            ].map((issue) => (
              <Pressable
                key={issue.id}
                style={[
                  styles.issueCard,
                  selectedIssue === issue.id && styles.issueCardActive,
                ]}
                onPress={() => setSelectedIssue(issue.id)}
              >
                <Text style={styles.issueTitle}>{issue.title}</Text>
                <Text style={styles.issueDesc}>{issue.desc}</Text>
              </Pressable>
            ))}
          </View>

          {/* Wynik diagnozy */}
          <View style={styles.diagnosisCard}>
            <View style={styles.diagHeaderRow}>
              <Text style={styles.diagBadge}>RECEPTA SENSORYCZNA</Text>
              <Text style={styles.diagProblem}>{diagnosis.issue}</Text>
            </View>

            <Text style={styles.diagRecommendation}>
              {diagnosis.recommendationPl}
            </Text>

            <View style={styles.diagActionRow}>
              {diagnosis.grindAdjustment && (
                <View style={styles.diagActionBox}>
                  <Text style={styles.diagActionLabel}>KOREKTA MIELENIA</Text>
                  <Text style={styles.diagActionVal}>
                    {diagnosis.grindAdjustment === 'finer'
                      ? '▼ Zmiel drobniej (o 2–3 kliki)'
                      : '▲ Zmiel grubiej (o 2–4 kliki)'}
                  </Text>
                </View>
              )}

              {diagnosis.tempAdjustment && (
                <View style={styles.diagActionBox}>
                  <Text style={styles.diagActionLabel}>TEMPERATURA WODY</Text>
                  <Text style={styles.diagActionVal}>
                    {diagnosis.tempAdjustment === 'higher'
                      ? '🔥 Podnieś o +2°C do 95°C'
                      : '❄️ Obniż o 2–4°C'}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      )}

      {/* 2. KALKULATOR RATIO */}
      {activeTab === 'ratio' && (
        <View>
          <Text style={styles.sectionHeader}>{t.dialin.ratioTitle || 'Kalkulator Proporcji (Brew Ratio)'}</Text>
          <Text style={styles.sectionSub}>
            {t.dialin.ratioSubtitle || 'Wprowadź gramaturę ziaren, aby otrzymać precyzyjną wagę wody i szacowany uzysk w filiżance.'}
          </Text>

          <View style={styles.calcCard}>
            {/* Przełącznik kierunku przeliczania */}
            <View style={styles.directionToggleRow}>
              <Pressable
                style={[
                  styles.directionBtn,
                  calcDirection === 'doseToWater' && styles.directionBtnActive,
                ]}
                onPress={() => handleDirectionChange('doseToWater')}
              >
                <Text
                  style={[
                    styles.directionBtnText,
                    calcDirection === 'doseToWater' && styles.directionBtnTextActive,
                  ]}
                >
                  {t.dialin.directionDoseToWater || 'Doza → Woda'}
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.directionBtn,
                  calcDirection === 'waterToDose' && styles.directionBtnActive,
                ]}
                onPress={() => handleDirectionChange('waterToDose')}
              >
                <Text
                  style={[
                    styles.directionBtnText,
                    calcDirection === 'waterToDose' && styles.directionBtnTextActive,
                  ]}
                >
                  {t.dialin.directionWaterToDose || 'Woda → Doza'}
                </Text>
              </Pressable>
            </View>

            {calcDirection === 'doseToWater' ? (
              <>
                <Text style={styles.inputTitle}>{t.dialin.doseInputLabel || 'Doza suchej kawy / herbaty (g)'}</Text>
                <TextInput
                  style={styles.calcInput}
                  keyboardType="numeric"
                  value={doseInput}
                  onChangeText={handleDoseChange}
                  placeholder="18"
                  placeholderTextColor={theme.colors.textMuted}
                />
              </>
            ) : (
              <>
                <Text style={styles.inputTitle}>{t.dialin.waterInputLabel || 'Docelowa objętość wody (g)'}</Text>
                <TextInput
                  style={styles.calcInput}
                  keyboardType="numeric"
                  value={waterInput}
                  onChangeText={handleWaterChange}
                  placeholder="300"
                  placeholderTextColor={theme.colors.textMuted}
                />
              </>
            )}

            <Text style={styles.inputTitle}>{t.dialin.ratioSelectLabel || 'Wybierz Ratio (Kawa : Woda)'}</Text>
            <View style={styles.ratioPresetsRow}>
              {[
                { r: 15.0, label: '1:15 (Mocna)' },
                { r: 16.6, label: '1:16.6 (Standard)' },
                { r: 17.5, label: '1:17.5 (Lekka)' },
                { r: 20.0, label: '1:20 (Gongfu)' },
                { r: 2.0, label: '1:2 (Espresso)' },
                { r: 50.0, label: '1:50 (Herbata)' },
              ].map((item) => (
                <Pressable
                  key={item.r}
                  style={[
                    styles.ratioChip,
                    ratioVal === item.r && styles.ratioChipActive,
                  ]}
                  onPress={() => handleRatioSelect(item.r)}
                >
                  <Text
                    style={[
                      styles.ratioChipText,
                      ratioVal === item.r && styles.ratioChipTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.resultsBox}>
              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>
                  {calcDirection === 'doseToWater'
                    ? (t.dialin.calculatedWater || 'WODA DO ZALANIA')
                    : (t.dialin.calculatedDose || 'WYMAGANA DOZA ZIAREN')}
                </Text>
                <Text style={styles.resultVal}>
                  {calcDirection === 'doseToWater'
                    ? formatWaterWeight(waterCalcResult, unitSystem)
                    : formatDoseWeight(doseCalcResult, unitSystem)}
                </Text>
              </View>
              <View style={styles.resultItem}>
                <Text style={styles.resultLabel}>{t.dialin.calculatedYield || 'UZYSK W FILIŻANCE'}</Text>
                <Text style={styles.resultValSecondary}>{formatWaterWeight(yieldResult, unitSystem)}</Text>
                <Text style={styles.resultNote}>
                  {t.dialin.absorptionNote || 'Po absorpcji 2.0g/g przez ciastko'}
                </Text>
              </View>
            </View>
          </View>

          {/* PRZELICZNIK MŁYNKÓW (GRINDER DIAL-IN CONVERTER) */}
          <View style={[styles.calcCard, { marginTop: 16 }]}>
            <Text style={styles.sectionHeader}>{t.grinder.title}</Text>
            <Text style={styles.sectionSub}>{t.grinder.subtitle}</Text>

            <Text style={styles.inputTitle}>{t.grinder.categorySelect}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              {GRIND_CATEGORIES.map((cat) => (
                <Pressable
                  key={cat.id}
                  style={[
                    styles.grindCategoryChip,
                    selectedGrindCategoryId === cat.id && styles.grindCategoryChipActive,
                  ]}
                  onPress={() => setSelectedGrindCategoryId(cat.id)}
                >
                  <Text
                    style={[
                      styles.grindCategoryChipText,
                      selectedGrindCategoryId === cat.id && styles.grindCategoryChipTextActive,
                    ]}
                  >
                    {language === 'pl' ? cat.namePl : cat.nameEn}
                  </Text>
                  <Text style={styles.grindCategoryChipSub}>
                    ~{cat.defaultMicrons} µm
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <View style={styles.grinderCategoryDetailsCard}>
              <Text style={styles.grinderMethodsText}>
                📌 Metody: {language === 'pl' ? activeGrindCategory.methodsPl : activeGrindCategory.methodsEn}
              </Text>
              <Text style={styles.grinderMicronsRange}>
                Średnia cząstek: {activeGrindCategory.micronMin} – {activeGrindCategory.micronMax} µm (punkt odniesienia: {activeGrindCategory.defaultMicrons} µm)
              </Text>
            </View>

            <Text style={[styles.inputTitle, { marginTop: 12 }]}>
              {t.grinder.allGrindersHeader}
            </Text>

            <View style={styles.grindersGrid}>
              {SUPPORTED_GRINDERS.map((grinder) => {
                const setting = convertMicronsToGrinder(activeGrindCategory.defaultMicrons, grinder.id);
                return (
                  <View key={grinder.id} style={styles.grinderSettingCard}>
                    <Text style={styles.grinderNameText}>{grinder.name}</Text>
                    <Text style={styles.grinderBurrText}>{grinder.burrType}</Text>
                    <Text style={styles.grinderSettingValue}>{setting.formatted}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      )}

      {/* 3. KALKULATOR TDS & EY */}
      {activeTab === 'ey' && (
        <View>
          <Text style={styles.sectionHeader}>Extraction Yield (Wydajność Ekstrakcji)</Text>
          <Text style={styles.sectionSub}>
            Wprowadź parametry i odczyt refractometru TDS, aby zweryfikować czy Twoja filiżanka mieści się w złotym oknie SCA (18.0% – 22.0%).
          </Text>

          <View style={styles.calcCard}>
            <View style={styles.formRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputTitle}>Woda zalana (g)</Text>
                <TextInput
                  style={styles.calcInputSmall}
                  keyboardType="numeric"
                  value={eyWater}
                  onChangeText={setEyWater}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.inputTitle}>Doza kawy (g)</Text>
                <TextInput
                  style={styles.calcInputSmall}
                  keyboardType="numeric"
                  value={eyDose}
                  onChangeText={setEyDose}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.inputTitle}>TDS (%)</Text>
                <TextInput
                  style={styles.calcInputSmall}
                  keyboardType="numeric"
                  value={eyTds}
                  onChangeText={setEyTds}
                />
              </View>
            </View>

            {eyResult && (
              <View style={styles.eyResultBox}>
                <Text style={styles.eyTitle}>WYDAJNOŚĆ EKSTRAKCJI (EY)</Text>
                <Text style={styles.eyLargeNumber}>
                  {eyResult.extractionYieldPercent}%
                </Text>

                <View
                  style={[
                    styles.eyRatingBadge,
                    eyResult.rating === 'ideal'
                      ? styles.eyIdeal
                      : styles.eyWarning,
                  ]}
                >
                  <Text style={styles.eyRatingText}>
                    {eyResult.rating === 'ideal'
                      ? '✓ Złote Okno SCA (Idealna ekstrakcja)'
                      : eyResult.rating === 'under'
                      ? '⚠ Niedoparzenie (< 18%)'
                      : '⚠ Przeparzenie (> 22%)'}
                  </Text>
                </View>

                <Text style={styles.eyDescriptionText}>
                  {eyResult.descriptionPl}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* 4. MINERALIZACJA WODY (SCA WATER CHEMISTRY) */}
      {activeTab === 'water' && (
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
                    🎯 {language === 'pl' ? recipe.bestForPl : recipe.bestForEn}
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
              💡 {t.water.concentrateHelp}
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
      )}

      {/* Skrót do Kalkulatora Kofeiny (zintegrowany w Warsztacie po uproszczeniu dolnego paska nawigacji) */}
      <Pressable
        testID="open-caffeine-from-workshop"
        style={styles.caffeineWorkshopCard}
        onPress={() => router.push('/caffeine')}
        accessibilityRole="button"
        accessibilityLabel={t.caffeine?.title || 'Kalkulator Kofeiny'}
      >
        <View style={styles.caffeineWorkshopIconBox}>
          <CaffeineIcon size={24} color={theme.colors.copper} />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.caffeineWorkshopTitle}>
            {t.caffeine?.title || 'Kalkulator Kofeiny i Wchłaniania'}
          </Text>
          <Text style={styles.caffeineWorkshopSubtitle}>
            {language === 'pl'
              ? 'Sprawdź dawkę kofeiny, czas półtrwania i optymalne okno snu.'
              : 'Calculate caffeine intake, half-life metabolic decay, and sleep window.'}
          </Text>
        </View>
        <Text style={styles.caffeineWorkshopArrow}>→</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  content: {
    padding: theme.spacing.md,
    paddingBottom: 40,
  },
  segmentBar: {
    flexDirection: 'row',
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.md,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: theme.borderRadius.sm,
  },
  segmentBtnActive: {
    backgroundColor: theme.colors.copper,
  },
  segmentBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  segmentBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
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
  issuesList: {
    gap: 10,
    marginBottom: 16,
  },
  issueCard: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  issueCardActive: {
    borderColor: theme.colors.copper,
    backgroundColor: theme.colors.copperMuted,
  },
  issueTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  issueDesc: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  diagnosisCard: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: theme.colors.copper,
    marginBottom: 20,
  },
  diagHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  diagBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.copper,
    letterSpacing: 0.5,
  },
  diagProblem: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  diagRecommendation: {
    fontSize: 15,
    color: theme.colors.textPrimary,
    lineHeight: 22,
    marginBottom: 14,
  },
  diagActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  diagActionBox: {
    flex: 1,
    backgroundColor: theme.colors.bgCardSecondary,
    padding: 10,
    borderRadius: theme.borderRadius.sm,
  },
  diagActionLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: theme.colors.textMuted,
    marginBottom: 2,
  },
  diagActionVal: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.copperLight,
  },
  calcCard: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  directionToggleRow: {
    flexDirection: 'row',
    backgroundColor: theme.colors.bgCardSecondary,
    borderRadius: theme.borderRadius.md,
    padding: 3,
    marginBottom: 16,
  },
  directionBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: theme.borderRadius.sm,
  },
  directionBtnActive: {
    backgroundColor: theme.colors.copper,
  },
  directionBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  directionBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  inputTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 6,
    marginTop: 6,
  },
  calcInput: {
    backgroundColor: theme.colors.bgCardSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 14,
  },
  calcInputSmall: {
    backgroundColor: theme.colors.bgCardSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: 14,
  },
  ratioPresetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18,
  },
  ratioChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.bgCardSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  ratioChipActive: {
    backgroundColor: theme.colors.copperMuted,
    borderColor: theme.colors.copper,
  },
  ratioChipText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  ratioChipTextActive: {
    color: theme.colors.copper,
    fontWeight: '700',
  },
  resultsBox: {
    backgroundColor: theme.colors.bgCardSecondary,
    borderRadius: theme.borderRadius.md,
    padding: 16,
    flexDirection: 'row',
  },
  resultItem: {
    flex: 1,
    alignItems: 'center',
  },
  resultLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.textMuted,
    marginBottom: 4,
  },
  resultVal: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.copper,
  },
  resultValSecondary: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  resultNote: {
    fontSize: 10,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: 2,
  },
  formRow: {
    flexDirection: 'row',
  },
  eyResultBox: {
    backgroundColor: theme.colors.bgCardSecondary,
    borderRadius: theme.borderRadius.md,
    padding: 18,
    alignItems: 'center',
    marginTop: 10,
  },
  eyTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textMuted,
    letterSpacing: 0.5,
  },
  eyLargeNumber: {
    fontSize: 44,
    fontWeight: '800',
    color: theme.colors.copper,
    marginVertical: 4,
    fontVariant: ['tabular-nums'],
  },
  eyRatingBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: theme.borderRadius.full,
    marginBottom: 10,
  },
  eyIdeal: {
    backgroundColor: theme.colors.statusPeakMuted,
  },
  eyWarning: {
    backgroundColor: theme.colors.copperMuted,
  },
  eyRatingText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  eyDescriptionText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  cardSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 8,
  },
  waterVolumeCard: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 16,
  },
  volumeChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  volumeChip: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: theme.colors.bgCardSecondary,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  volumeChipActive: {
    backgroundColor: 'rgba(217, 119, 54, 0.2)',
    borderColor: theme.colors.copper,
  },
  volumeChipText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  volumeChipTextActive: {
    color: theme.colors.copper,
    fontWeight: '700',
  },
  volumeInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.bgCardSecondary,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 8,
    width: 65,
    height: 38,
  },
  volumeCustomInput: {
    flex: 1,
    color: theme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  volumeCustomUnit: {
    fontSize: 11,
    color: theme.colors.textMuted,
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
    backgroundColor: 'rgba(217, 119, 54, 0.08)',
  },
  waterRecipeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  waterRecipeName: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    flex: 1,
  },
  waterGhKhBadges: {
    flexDirection: 'row',
    gap: 6,
  },
  waterGhBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.copper,
    backgroundColor: 'rgba(217, 119, 54, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  waterKhBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.emeraldLight,
    backgroundColor: 'rgba(42, 123, 98, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  waterRecipeDesc: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 6,
    lineHeight: 16,
  },
  waterRecipeBestFor: {
    fontSize: 11,
    color: theme.colors.textMuted,
    fontWeight: '600',
  },
  customWaterInputsRow: {
    flexDirection: 'row',
    marginTop: 10,
  },
  customInputSubLabel: {
    fontSize: 10,
    color: theme.colors.textMuted,
    marginBottom: 4,
  },
  customWaterInput: {
    backgroundColor: theme.colors.bgCardSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
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
    backgroundColor: 'rgba(217, 119, 54, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginBottom: 8,
  },
  methodBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: theme.colors.copper,
    letterSpacing: 0.5,
  },
  methodTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  methodDesc: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 12,
    lineHeight: 16,
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
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  concentrateLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.textMuted,
    marginBottom: 4,
    textAlign: 'center',
  },
  concentrateValue: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.copper,
    marginBottom: 2,
    fontVariant: ['tabular-nums'],
  },
  concentrateSub: {
    fontSize: 10,
    color: theme.colors.textSecondary,
  },
  concentrateHelpText: {
    fontSize: 11,
    color: theme.colors.textMuted,
    lineHeight: 16,
  },
  drySaltRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  drySaltName: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  drySaltAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  grindCategoryChip: {
    backgroundColor: theme.colors.bgCardSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  grindCategoryChipActive: {
    backgroundColor: 'rgba(217, 119, 54, 0.15)',
    borderColor: theme.colors.copper,
  },
  grindCategoryChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  grindCategoryChipTextActive: {
    color: theme.colors.copper,
    fontWeight: '700',
  },
  grindCategoryChipSub: {
    fontSize: 10,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  grinderCategoryDetailsCard: {
    backgroundColor: theme.colors.bgCardSecondary,
    borderRadius: theme.borderRadius.sm,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 8,
  },
  grinderMethodsText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 4,
    lineHeight: 16,
  },
  grinderMicronsRange: {
    fontSize: 11,
    color: theme.colors.textMuted,
  },
  grindersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  grinderSettingCard: {
    width: '48%',
    backgroundColor: theme.colors.bgCardSecondary,
    borderRadius: theme.borderRadius.sm,
    padding: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  grinderNameText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  grinderBurrText: {
    fontSize: 10,
    color: theme.colors.textMuted,
    marginBottom: 6,
  },
  grinderSettingValue: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.copper,
    fontVariant: ['tabular-nums'],
  },
  caffeineWorkshopCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 16,
    marginTop: 20,
    marginBottom: 24,
  },
  caffeineWorkshopIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.bgCardSecondary,
    borderWidth: 1,
    borderColor: theme.colors.copper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  caffeineWorkshopTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  caffeineWorkshopSubtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  caffeineWorkshopArrow: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.copper,
    marginLeft: 8,
  },
});
