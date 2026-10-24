// ============================================================================
// Napar (Steepwise) — GongfuSessionSetup Component
// Tea type selection and Leaf/Vessel parameter setup
// ============================================================================

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Field, NumInput } from '../ui';
import { GongfuTeaType } from '../../core/gongfu-session';
import { gramsToOunces, mlToFluidOunces, celsiusToFahrenheit } from '../../core/unit-converter';
import { theme } from '../../core/theme';

export interface GongfuSessionSetupProps {
  teaType: GongfuTeaType;
  onSelectTeaType: (type: GongfuTeaType) => void;
  teaName: string;
  onChangeTeaName: (name: string) => void;
  leafDoseGrams: string;
  onChangeLeafDose: (dose: string) => void;
  vesselCapacityMl: string;
  onChangeVesselCapacity: (cap: string) => void;
  waterTempCelsius: string;
  onChangeWaterTemp: (temp: string) => void;
  unitSystem: 'metric' | 'imperial';
  language?: 'pl' | 'en';
  t: any;
}

const TEA_TYPE_OPTIONS: Array<{ id: GongfuTeaType; labelPl: string; labelEn: string }> = [
  { id: 'wulong_rock', labelPl: 'Wulong Skalny', labelEn: 'Rock Oolong' },
  { id: 'wulong_high_mountain', labelPl: 'Wysokogórski', labelEn: 'High Mountain' },
  { id: 'puerh_sheng', labelPl: 'Sheng Puerh', labelEn: 'Sheng Puerh' },
  { id: 'puerh_shou', labelPl: 'Shou Puerh', labelEn: 'Shou Puerh' },
  { id: 'white', labelPl: 'Biała', labelEn: 'White' },
  { id: 'black', labelPl: 'Czarna', labelEn: 'Black' },
  { id: 'green', labelPl: 'Zielona', labelEn: 'Green' },
];

export const GongfuSessionSetup: React.FC<GongfuSessionSetupProps> = ({
  teaType,
  onSelectTeaType,
  teaName,
  onChangeTeaName,
  leafDoseGrams,
  onChangeLeafDose,
  vesselCapacityMl,
  onChangeVesselCapacity,
  waterTempCelsius,
  onChangeWaterTemp,
  unitSystem,
  language = 'pl',
  t,
}) => {
  const isEn = language === 'en';
  const isImp = unitSystem === 'imperial';
  const leafBase = parseFloat(leafDoseGrams) || 0;
  const vesselBase = parseFloat(vesselCapacityMl) || 0;
  const tempBase = parseFloat(waterTempCelsius) || 0;

  const displayLeaf = isImp ? gramsToOunces(leafBase) : leafBase;
  const displayVessel = isImp ? mlToFluidOunces(vesselBase) : vesselBase;
  const displayTemp = isImp ? celsiusToFahrenheit(tempBase) : tempBase;

  return (
    <>
      {/* Wybór rodzaju herbaty */}
      <View style={styles.teaTypeRow}>
        {TEA_TYPE_OPTIONS.map((item) => {
          const isActive = teaType === item.id;
          const label = isEn ? item.labelEn : item.labelPl;
          return (
            <Pressable
              key={item.id}
              style={[styles.teaTypeChip, isActive && styles.teaTypeChipActive]}
              onPress={() => onSelectTeaType(item.id)}
            >
              <Text
                style={[
                  styles.teaTypeChipText,
                  isActive && styles.teaTypeChipTextActive,
                ]}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Karta Parametrów Liścia */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>{t.gongfu.modeDesc}</Text>
        <Field
          value={teaName}
          onChangeText={onChangeTeaName}
          placeholder={isEn ? 'Tea name...' : 'Nazwa herbaty...'}
        />

        <View style={styles.paramsRow}>
          <View style={styles.paramBox}>
            <Text style={styles.paramSub}>{t.gongfu.leafDose}</Text>
            <NumInput
              value={displayLeaf}
              stored={leafBase}
              onChangeNumber={(n) => onChangeLeafDose(n.toString())}
              unit={isImp ? 'oz' : 'g'}
            />
            <Text style={styles.unitText}>{isImp ? 'oz' : 'g'}</Text>
          </View>
          <View style={styles.paramBox}>
            <Text style={styles.paramSub}>{t.gongfu.vesselCapacity}</Text>
            <NumInput
              value={displayVessel}
              stored={vesselBase}
              onChangeNumber={(n) => onChangeVesselCapacity(n.toString())}
              unit={isImp ? 'fl oz' : 'ml'}
            />
            <Text style={styles.unitText}>{isImp ? 'fl oz' : 'ml'}</Text>
          </View>
          <View style={styles.paramBox}>
            <Text style={styles.paramSub}>{t.gongfu.waterTemp}</Text>
            <NumInput
              value={displayTemp}
              stored={tempBase}
              onChangeNumber={(n) => onChangeWaterTemp(n.toString())}
              unit={isImp ? '°F' : '°C'}
            />
            <Text style={styles.unitText}>{isImp ? '°F' : '°C'}</Text>
          </View>
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  teaTypeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  teaTypeChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: theme.colors.bgCard,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  teaTypeChipActive: {
    backgroundColor: 'rgba(42, 123, 98, 0.2)',
    borderColor: theme.colors.emerald,
  },
  teaTypeChipText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  teaTypeChipTextActive: {
    color: theme.colors.emeraldLight,
    fontWeight: '700',
  },
  card: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 16,
  },
  cardLabel: {
    fontSize: 11,
    color: theme.colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  paramsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  paramBox: {
    flex: 1,
    alignItems: 'center',
  },
  paramSub: {
    fontSize: 10,
    color: theme.colors.textMuted,
    marginBottom: 4,
    textAlign: 'center',
  },
  unitText: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
});
