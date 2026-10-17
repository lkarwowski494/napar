import React, { useState, useEffect } from 'react';
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
            <Text style={styles.modalTitle}>Kompendium Wiedzy</Text>
            <Text style={styles.compendiumHeaderSub}>Odmiany botaniczne, obróbki, terroir i herbaty</Text>
          </View>
          <Pressable
            testID="compendium-close-button"
            style={styles.modalCloseBtn}
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Zamknij"
          >
            <Text style={styles.modalCloseText}>Zamknij</Text>
          </Pressable>
        </View>

        {/* Wyszukiwarka */}
        <View style={styles.compendiumSearchBox}>
          <TextInput
            style={styles.compendiumSearchInput}
            placeholder="Szukaj odmiany, kraju, nuty lub herbaty..."
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
                style={[styles.compTabBtn, compendiumTab === 'varieties' && styles.compTabBtnActive]}
                onPress={() => setCompendiumTab('varieties')}
              >
                <Text style={[styles.compTabText, compendiumTab === 'varieties' && styles.compTabTextActive]}>
                  Odmiany ({filteredVarieties.length})
                </Text>
              </Pressable>
              <Pressable
                style={[styles.compTabBtn, compendiumTab === 'processes' && styles.compTabBtnActive]}
                onPress={() => setCompendiumTab('processes')}
              >
                <Text style={[styles.compTabText, compendiumTab === 'processes' && styles.compTabTextActive]}>
                  Obróbki ({filteredProcesses.length})
                </Text>
              </Pressable>
              <Pressable
                style={[styles.compTabBtn, compendiumTab === 'origins' && styles.compTabBtnActive]}
                onPress={() => setCompendiumTab('origins')}
              >
                <Text style={[styles.compTabText, compendiumTab === 'origins' && styles.compTabTextActive]}>
                  Terroir ({filteredOrigins.length})
                </Text>
              </Pressable>
            </>
          )}
          {beveragePreference !== 'coffee' && (
            <Pressable
              style={[styles.compTabBtn, compendiumTab === 'tea' && styles.compTabBtnActive]}
              onPress={() => setCompendiumTab('tea')}
            >
              <Text style={[styles.compTabText, compendiumTab === 'tea' && styles.compTabTextActive]}>
                Herbaty ({filteredTeas.length})
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
                <Text style={styles.compCardSub}>Pochodzenie: {v.nativeRegion}</Text>
                <Text style={styles.compCardLineage}>Rodowód: {v.geneticLineage}</Text>
                <Text style={styles.compCardSensory}>{v.sensoryProfilePl}</Text>
                <Text style={styles.compCardDesc}>{v.descriptionPl}</Text>

                <View style={styles.badgesRow}>
                  <View style={styles.badgePill}><Text style={styles.badgeText}>Kwasowość: {v.cupCharacteristics.acidity}</Text></View>
                  <View style={styles.badgePill}><Text style={styles.badgeText}>Body: {v.cupCharacteristics.body}</Text></View>
                  <View style={styles.badgePill}><Text style={styles.badgeText}>Słodycz: {v.cupCharacteristics.sweetness}</Text></View>
                </View>

                <View style={styles.notesTagsRow}>
                  {v.keyNotesPl.map((n, i) => (
                    <View key={i} style={styles.noteTag}><Text style={styles.noteTagText}>#{n}</Text></View>
                  ))}
                </View>

                <Pressable
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
                  <Text style={styles.compUseBtnText}>+ Użyj jako szablon w spiżarni</Text>
                </Pressable>
              </View>
            ))}

          {compendiumTab === 'processes' &&
            filteredProcesses.map((p) => (
              <View key={p.id} style={styles.compCard}>
                <View style={styles.compCardHeader}>
                  <Text style={styles.compCardTitle}>{p.name}</Text>
                  <Text style={styles.compCardTag}>Suszenie: {p.dryingDurationDays}</Text>
                </View>
                <Text style={styles.compCardSub}>Zużycie wody: {p.waterConsumption}</Text>
                <Text style={styles.compCardSensory}>{p.sensoryImpactPl}</Text>
                <Text style={styles.compCardDesc}>{p.descriptionPl}</Text>

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
                <Text style={styles.compCardSub}>Główne regiony: {o.primaryRegions.join(', ')}</Text>
                <Text style={styles.compCardLineage}>Zbiory: {o.harvestMonths} · Odmiany: {o.mainVarieties.join(', ')}</Text>
                <Text style={styles.compCardSensory}>{o.flavorProfilePl}</Text>
                <Text style={styles.compCardDesc}>{o.descriptionPl}</Text>

                <Pressable
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
                  <Text style={styles.compUseBtnText}>+ Użyj jako szablon w spiżarni</Text>
                </Pressable>
              </View>
            ))}

          {compendiumTab === 'tea' &&
            filteredTeas.map((t) => (
              <View key={t.id} style={styles.compCard}>
                <View style={styles.compCardHeader}>
                  <Text style={styles.compCardTitle}>{`${t.namePl} · ${t.traditionalName}`}</Text>
                  <Text style={styles.compCardTag}>Oksydacja: {t.oxidationRangePercent}</Text>
                </View>
                <Text style={styles.compCardSub}>Temperatura parzenia: {t.waterTemperatureCelsius}°C</Text>
                <Text style={styles.compCardLineage}>Metoda Sha Qing: {t.killGreenMethod}</Text>
                <Text style={styles.compCardSensory}>{t.sensoryProfilePl}</Text>
                <Text style={styles.compCardDesc}>Słynne odmiany: {t.famousVarietiesPl.join(', ')}</Text>
                <Text style={styles.compCardHealth}>{t.healthAttributesPl}</Text>

                <Pressable
                  style={styles.compUseBtn}
                  onPress={() =>
                    onUseTemplate({
                      name: t.famousVarietiesPl[0].split('(')[0].trim(),
                      type: 'tea',
                      origin: t.famousRegions[0].split('(')[0].trim(),
                      notes: [t.namePl, 'Tradycyjna'],
                    })
                  }
                >
                  <Text style={styles.compUseBtnText}>+ Użyj jako szablon w spiżarni</Text>
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
