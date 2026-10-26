import React, { useState, useEffect } from 'react';
import { useTranslation, formatTemplate } from '../../core/i18n';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../core/theme';
import {
  searchCoffeeVarieties,
  searchCoffeeProcesses,
  searchCoffeeOrigins,
  searchTeaCategories,
} from '../../core/knowledge-data';

export interface KnowledgeTemplate {
  name: string;
  type: 'coffee' | 'tea';
  origin?: string;
  variety?: string;
  process?: string;
  notes: string[];
}

export interface BeanCompendiumModalProps {
  visible: boolean;
  onClose: () => void;
  beveragePreference?: 'coffee' | 'tea' | 'both';
  onUseTemplate: (template: KnowledgeTemplate) => void;
}

export const BeanCompendiumModal: React.FC<BeanCompendiumModalProps> = ({
  visible,
  onClose,
  beveragePreference,
  onUseTemplate,
}) => {
  const { t, language } = useTranslation();
  const isEn = language === 'en';
  const [compendiumTab, setCompendiumTab] = useState<'varieties' | 'processes' | 'origins' | 'tea'>(() => {
    return beveragePreference === 'tea' ? 'tea' : 'varieties';
  });
  const [compendiumSearch, setCompendiumSearch] = useState('');

  useEffect(() => {
    if (beveragePreference === 'tea') {
      setCompendiumTab('tea');
    } else if (beveragePreference === 'coffee') {
      setCompendiumTab('varieties');
    }
  }, [beveragePreference]);

  const filteredVarieties = searchCoffeeVarieties(compendiumSearch);
  const filteredProcesses = searchCoffeeProcesses(compendiumSearch);
  const filteredOrigins = searchCoffeeOrigins(compendiumSearch);
  const filteredTeas = searchTeaCategories(compendiumSearch);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.compendiumModalContainer} edges={['top', 'bottom', 'left', 'right']}>
        <View style={styles.modalHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.modalTitle}>{t.stash?.compendium || (isEn ? 'Knowledge Compendium' : 'Kompendium Wiedzy')}</Text>
            <Text style={styles.compendiumHeaderSub}>{t.stash?.compendiumSubtitle || (isEn ? 'Botanical varieties, processes, terroir and tea' : 'Odmiany botaniczne, obróbki, terroir i herbaty')}</Text>
          </View>
          <Pressable
            testID="compendium-close-button"
            style={styles.modalCloseBtn}
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel={t.common?.close || (isEn ? 'Close' : 'Zamknij')}
          >
            <Text style={styles.modalCloseText}>{t.common?.close || (isEn ? 'Close' : 'Zamknij')}</Text>
          </Pressable>
        </View>

        {/* Wyszukiwarka */}
        <View style={styles.compendiumSearchBox}>
          <TextInput
            style={styles.compendiumSearchInput}
            placeholder={isEn ? 'Search variety, origin, flavor or tea...' : 'Szukaj odmiany, kraju, nuty lub herbaty...'}
            placeholderTextColor={theme.colors.textMuted}
            value={compendiumSearch}
            onChangeText={setCompendiumSearch}
          />
        </View>

        {/* Przełącznik zakładek */}
        <View style={styles.compendiumTabsRow}>
          {beveragePreference !== 'tea' && (
            <>
              <Pressable
                testID="compendium-tab-varieties"
                accessibilityRole="tab"
                accessibilityState={{ selected: compendiumTab === 'varieties' }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={[styles.compTabBtn, compendiumTab === 'varieties' && styles.compTabBtnActive]}
                onPress={() => setCompendiumTab('varieties')}
              >
                <Text style={[styles.compTabText, compendiumTab === 'varieties' && styles.compTabTextActive]}>
                  {isEn ? `Varieties (${filteredVarieties.length})` : `Odmiany (${filteredVarieties.length})`}
                </Text>
              </Pressable>
              <Pressable
                testID="compendium-tab-processes"
                accessibilityRole="tab"
                accessibilityState={{ selected: compendiumTab === 'processes' }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={[styles.compTabBtn, compendiumTab === 'processes' && styles.compTabBtnActive]}
                onPress={() => setCompendiumTab('processes')}
              >
                <Text style={[styles.compTabText, compendiumTab === 'processes' && styles.compTabTextActive]}>
                  {isEn ? `Processes (${filteredProcesses.length})` : `Obróbki (${filteredProcesses.length})`}
                </Text>
              </Pressable>
              <Pressable
                testID="compendium-tab-origins"
                accessibilityRole="tab"
                accessibilityState={{ selected: compendiumTab === 'origins' }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={[styles.compTabBtn, compendiumTab === 'origins' && styles.compTabBtnActive]}
                onPress={() => setCompendiumTab('origins')}
              >
                <Text style={[styles.compTabText, compendiumTab === 'origins' && styles.compTabTextActive]}>
                  {isEn ? `Terroir (${filteredOrigins.length})` : `Terroir (${filteredOrigins.length})`}
                </Text>
              </Pressable>
            </>
          )}
          {beveragePreference !== 'coffee' && (
            <Pressable
              testID="compendium-tab-tea"
              accessibilityRole="tab"
              accessibilityState={{ selected: compendiumTab === 'tea' }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={[styles.compTabBtn, compendiumTab === 'tea' && styles.compTabBtnActive]}
              onPress={() => setCompendiumTab('tea')}
            >
              <Text style={[styles.compTabText, compendiumTab === 'tea' && styles.compTabTextActive]}>
                {isEn ? `Teas (${filteredTeas.length})` : `Herbaty (${filteredTeas.length})`}
              </Text>
            </Pressable>
          )}
        </View>

        {/* Zawartość zakładek */}
        <ScrollView style={styles.compendiumContent} contentContainerStyle={{ paddingBottom: 40 }}>
          {compendiumTab === 'varieties' &&
            filteredVarieties.map((v) => (
              <View key={v.id} style={styles.compCard}>
                <View style={styles.compCardHeader}>
                  <Text style={styles.compCardTitle}>{v.name}</Text>
                  <Text style={styles.compCardTag}>{v.recommendedRoast}</Text>
                </View>
                <Text style={styles.compCardSub}>{isEn ? `Origin: ${v.nativeRegion}` : `Pochodzenie: ${v.nativeRegion}`}</Text>
                <Text style={styles.compCardLineage}>{isEn ? `Lineage: ${v.geneticLineage}` : `Rodowód: ${v.geneticLineage}`}</Text>
                <Text style={styles.compCardSensory}>{(isEn && v.sensoryProfileEn) ? v.sensoryProfileEn : v.sensoryProfilePl}</Text>
                <Text style={styles.compCardDesc}>{(isEn && v.descriptionEn) ? v.descriptionEn : v.descriptionPl}</Text>

                <View style={styles.badgesRow}>
                  <View style={styles.badgePill}><Text style={styles.badgeText}>{isEn ? `Acidity: ${v.cupCharacteristics.acidity}` : `Kwasowość: ${v.cupCharacteristics.acidity}`}</Text></View>
                  <View style={styles.badgePill}><Text style={styles.badgeText}>{isEn ? `Body: ${v.cupCharacteristics.body}` : `Body: ${v.cupCharacteristics.body}`}</Text></View>
                  <View style={styles.badgePill}><Text style={styles.badgeText}>{isEn ? `Sweetness: ${v.cupCharacteristics.sweetness}` : `Słodycz: ${v.cupCharacteristics.sweetness}`}</Text></View>
                </View>

                <View style={styles.notesTagsRow}>
                  {v.keyNotesPl.map((n, i) => (
                    <View key={i} style={styles.noteTag}><Text style={styles.noteTagText}>#{n}</Text></View>
                  ))}
                </View>

                <Pressable
                  testID={`comp-use-btn-${v.id}`}
                  accessibilityRole="button"
                  accessibilityLabel={isEn ? `Use ${v.name} as template` : `Użyj ${v.name} jako szablon`}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={styles.compUseBtn}
                  onPress={() =>
                    onUseTemplate({
                      name: `${v.name} Specialty`,
                      type: 'coffee',
                      origin: v.nativeRegion.split('/')[0].trim(),
                      notes: v.keyNotesPl,
                    })
                  }
                >
                  <Text style={styles.compUseBtnText}>{(t as any).stash?.useTemplate || (isEn ? '+ Use as template in stash' : '+ Użyj jako szablon w spiżarni')}</Text>
                </Pressable>
              </View>
            ))}

          {compendiumTab === 'processes' &&
            filteredProcesses.map((p) => (
              <View key={p.id} style={styles.compCard}>
                <View style={styles.compCardHeader}>
                  <Text style={styles.compCardTitle}>{p.name}</Text>
                  <Text style={styles.compCardTag}>{isEn ? `Drying: ${p.dryingDurationDays}` : `Suszenie: ${p.dryingDurationDays}`}</Text>
                </View>
                <Text style={styles.compCardSub}>{isEn ? `Water consumption: ${p.waterConsumption}` : `Zużycie wody: ${p.waterConsumption}`}</Text>
                <Text style={styles.compCardSensory}>{(isEn && p.sensoryImpactEn) ? p.sensoryImpactEn : p.sensoryImpactPl}</Text>
                <Text style={styles.compCardDesc}>{(isEn && p.descriptionEn) ? p.descriptionEn : p.descriptionPl}</Text>

                <View style={styles.notesTagsRow}>
                  {p.keyNotesPl.map((n, i) => (
                    <View key={i} style={styles.noteTag}><Text style={styles.noteTagText}>#{n}</Text></View>
                  ))}
                </View>
              </View>
            ))}

          {compendiumTab === 'origins' &&
            filteredOrigins.map((o) => (
              <View key={o.id} style={styles.compCard}>
                <View style={styles.compCardHeader}>
                  <Text style={styles.compCardTitle}>{`${o.country} (${o.countryCode})`}</Text>
                  <Text style={styles.compCardTag}>{o.typicalAltitudeMeters}</Text>
                </View>
                <Text style={styles.compCardSub}>{isEn ? `Primary regions: ${o.primaryRegions.join(', ')}` : `Główne regiony: ${o.primaryRegions.join(', ')}`}</Text>
                <Text style={styles.compCardLineage}>{isEn ? `Harvest: ${o.harvestMonths} · Varieties: ${o.mainVarieties.join(', ')}` : `Zbiory: ${o.harvestMonths} · Odmiany: ${o.mainVarieties.join(', ')}`}</Text>
                <Text style={styles.compCardSensory}>{(isEn && o.flavorProfileEn) ? o.flavorProfileEn : o.flavorProfilePl}</Text>
                <Text style={styles.compCardDesc}>{(isEn && o.descriptionEn) ? o.descriptionEn : o.descriptionPl}</Text>

                <Pressable
                  testID={`comp-use-btn-${o.id}`}
                  accessibilityRole="button"
                  accessibilityLabel={isEn ? `Use ${o.country} as template` : `Użyj ${o.country} jako szablon`}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={styles.compUseBtn}
                  onPress={() =>
                    onUseTemplate({
                      name: `${o.country} ${o.primaryRegions[0]} Washed`,
                      type: 'coffee',
                      origin: `${o.primaryRegions[0]}, ${o.country}`,
                      notes: o.keyNotesPl,
                    })
                  }
                >
                  <Text style={styles.compUseBtnText}>{(t as any).stash?.useTemplate || (isEn ? '+ Use as template in stash' : '+ Użyj jako szablon w spiżarni')}</Text>
                </Pressable>
              </View>
            ))}

          {compendiumTab === 'tea' &&
            filteredTeas.map((teaItem) => (
              <View key={teaItem.id} style={styles.compCard}>
                <View style={styles.compCardHeader}>
                  <Text style={styles.compCardTitle}>{`${isEn && teaItem.nameEn ? teaItem.nameEn : teaItem.namePl} · ${teaItem.traditionalName}`}</Text>
                  <Text style={styles.compCardTag}>{isEn ? `Oxidation: ${teaItem.oxidationRangePercent}` : `Oksydacja: ${teaItem.oxidationRangePercent}`}</Text>
                </View>
                <Text style={styles.compCardSub}>{isEn ? `Brewing temp: ${teaItem.waterTemperatureCelsius}°C` : `Temperatura parzenia: ${teaItem.waterTemperatureCelsius}°C`}</Text>
                <Text style={styles.compCardLineage}>{isEn ? `Sha Qing method: ${teaItem.killGreenMethod}` : `Metoda Sha Qing: ${teaItem.killGreenMethod}`}</Text>
                <Text style={styles.compCardSensory}>{(isEn && teaItem.sensoryProfileEn) ? teaItem.sensoryProfileEn : teaItem.sensoryProfilePl}</Text>
                <Text style={styles.compCardDesc}>{isEn ? `Famous varieties: ${teaItem.famousVarietiesPl.join(', ')}` : `Słynne odmiany: ${teaItem.famousVarietiesPl.join(', ')}`}</Text>
                <Text style={styles.compCardHealth}>{teaItem.healthAttributesPl}</Text>

                <Pressable
                  testID={`comp-use-btn-${teaItem.id}`}
                  accessibilityRole="button"
                  accessibilityLabel={isEn ? `Use ${teaItem.nameEn || teaItem.namePl} as template` : `Użyj ${teaItem.namePl} jako szablon`}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={styles.compUseBtn}
                  onPress={() =>
                    onUseTemplate({
                      name: teaItem.famousVarietiesPl[0].split('(')[0].trim(),
                      type: 'tea',
                      origin: teaItem.famousRegions[0].split('(')[0].trim(),
                      notes: [teaItem.namePl, 'Tradycyjna'],
                    })
                  }
                >
                  <Text style={styles.compUseBtnText}>{(t as any).stash?.useTemplate || (isEn ? '+ Use as template in stash' : '+ Użyj jako szablon w spiżarni')}</Text>
                </Pressable>
              </View>
            ))}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  compendiumModalContainer: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    padding: theme.spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  compendiumHeaderSub: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  modalCloseBtn: {
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.bgCardSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    fontSize: 14,
    color: theme.colors.copper,
    fontWeight: '700',
  },
  compendiumSearchBox: {
    marginBottom: 12,
  },
  compendiumSearchInput: {
    backgroundColor: theme.colors.bgCard,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: theme.colors.textPrimary,
    fontSize: 14,
  },
  compendiumTabsRow: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 6,
  },
  compTabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.bgCardSecondary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  compTabBtnActive: {
    backgroundColor: theme.colors.copperMuted,
    borderColor: theme.colors.copper,
  },
  compTabText: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  compTabTextActive: {
    color: theme.colors.copper,
    fontWeight: '700',
  },
  compendiumContent: {
    flex: 1,
  },
  compCard: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.md,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  compCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  compCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    flex: 1,
  },
  compCardTag: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.copper,
    backgroundColor: theme.colors.copperMuted,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.full,
    overflow: 'hidden',
  },
  compCardSub: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '600',
    marginBottom: 2,
  },
  compCardLineage: {
    fontSize: 11,
    color: theme.colors.textMuted,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  compCardSensory: {
    fontSize: 13,
    color: theme.colors.textPrimary,
    lineHeight: 18,
    marginBottom: 8,
  },
  compCardDesc: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    lineHeight: 16,
    marginBottom: 8,
  },
  compCardHealth: {
    fontSize: 12,
    color: '#4ade80',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  badgePill: {
    backgroundColor: theme.colors.bgCardSecondary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  badgeText: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  notesTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  noteTag: {
    backgroundColor: theme.colors.copperMuted,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  noteTagText: {
    fontSize: 11,
    color: theme.colors.copperLight,
    fontWeight: '600',
  },
  compUseBtn: {
    backgroundColor: theme.colors.copper,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
    marginTop: 4,
  },
  compUseBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
