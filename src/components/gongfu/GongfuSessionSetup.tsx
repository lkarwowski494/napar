// ============================================================================
// Napar (Steepwise) — GongfuSessionSetup Component
// Tea type selection and Leaf/Vessel parameter setup
// ============================================================================

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Field, NumInput } from '../ui';
import { GongfuTeaType } from '../../core/gongfu-session';
import { baseToDisplay } from '../../core/unit-converter';
import { theme } from '../../core/theme';
import { parseDecimal } from '../../core/parse-decimal';

interface GongfuSessionSetupProps {
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
  t: any;
}

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
  t,
}) => {
  // Wartości w stanie są zawsze w jednostkach bazowych (g, ml, °C); pole wyświetla je w wybranym układzie
  const imperial = unitSystem === 'imperial';
  const leafBase = parseDecimal(leafDoseGrams) || 0;
  const vesselBase = parseDecimal(vesselCapacityMl) || 0;
  const tempBase = parseDecimal(waterTempCelsius) || 0;
  const leafUnit = imperial ? 'oz' : 'g';
  const vesselUnit = imperial ? 'fl oz' : 'ml';
  const tempUnit = imperial ? '°F' : '°C';

  return (
    <>
      {/* Wybór rodzaju herbaty */}
      <View style={styles.teaTypeRow}>
        {(
          [
            { id: 'wulong_rock', label: 'Wulong Skalny' },
            { id: 'puerh_sheng', label: 'Sheng Puerh' },
            { id: 'puerh_shou', label: 'Shou Puerh' },
            { id: 'white', label: 'Biała' },
            { id: 'black', label: 'Czarna' },
          ] as const
        ).map((item) => (
          <Pressable
            key={item.id}
            style={[styles.teaTypeChip, teaType === item.id && styles.teaTypeChipActive]}
            onPress={() => onSelectTeaType(item.id)}
          >
            <Text
              style={[
                styles.teaTypeChipText,
                teaType === item.id && styles.teaTypeChipTextActive,
              ]}
            >
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Karta Parametrów Liścia */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>{t.gongfu.modeDesc}</Text>
        <Field
          value={teaName}
          onChangeText={onChangeTeaName}
          placeholder="Nazwa herbaty..."
        />

        <View style={styles.paramsRow}>
          <View style={styles.paramBox}>
            <Text style={styles.paramSub}>{t.gongfu.leafDose}</Text>
            <NumInput
              value={String(baseToDisplay(leafBase, leafUnit))}
              stored={leafBase}
              onChangeNumber={(n) => onChangeLeafDose(n.toString())}
              unit={leafUnit}
            />
            <Text style={styles.unitText}>{leafUnit}</Text>
          </View>
          <View style={styles.paramBox}>
            <Text style={styles.paramSub}>{t.gongfu.vesselCapacity}</Text>
            <NumInput
              value={String(baseToDisplay(vesselBase, vesselUnit))}
              stored={vesselBase}
              onChangeNumber={(n) => onChangeVesselCapacity(n.toString())}
              unit={vesselUnit}
            />
            <Text style={styles.unitText}>{vesselUnit}</Text>
          </View>
          <View style={styles.paramBox}>
            <Text style={styles.paramSub}>{t.gongfu.waterTemp}</Text>
            <NumInput
              value={String(baseToDisplay(tempBase, tempUnit))}
              stored={tempBase}
              onChangeNumber={(n) => onChangeWaterTemp(n.toString())}
              unit={tempUnit}
            />
            <Text style={styles.unitText}>{tempUnit}</Text>
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
