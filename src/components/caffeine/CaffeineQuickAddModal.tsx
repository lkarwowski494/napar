// ============================================================================
// Napar (Steepwise) — CaffeineQuickAddModal Component
// Modal with preset beverage options for rapid caffeine logging
// ============================================================================

import React from 'react';
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import { formatDoseWeight } from '../../core/unit-converter';
import { estimateCoffeeCaffeineMg } from '../../core/domain-rules';
import { theme } from '../../core/theme';

interface CaffeineQuickAddModalProps {
  visible: boolean;
  unitSystem: 'metric' | 'imperial';
  onClose: () => void;
  onSelectOption: (name: string, type: 'coffee' | 'tea', doseG: number, mg: number) => void;
}

export const CaffeineQuickAddModal: React.FC<CaffeineQuickAddModalProps> = ({
  visible,
  unitSystem,
  onClose,
  onSelectOption,
}) => {
  return (
    <Modal visible={visible} animationType="fade" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalCardTitle}>Szybkie dodanie kofeiny</Text>

          {(() => {
            const v60Mg = Math.round(estimateCoffeeCaffeineMg(18, 'arabica', 'filter'));
            const doubleEspressoMg = Math.round(estimateCoffeeCaffeineMg(18, 'arabica', 'espresso'));
            const singleEspressoMg = Math.round(estimateCoffeeCaffeineMg(9, 'arabica', 'espresso'));
            const aeropressMg = Math.round(estimateCoffeeCaffeineMg(15, 'arabica', 'immersion'));
            return (
              <>
                <Pressable
                  style={styles.quickOption}
                  onPress={() => onSelectOption('Kawa przelewowa (V60 / Drip)', 'coffee', 18, v60Mg)}
                >
                  <Text style={styles.quickOptionName}>Przelew / Drip (V60, Chemex)</Text>
                  <Text style={styles.quickOptionMg}>~{v60Mg} mg ({formatDoseWeight(18, unitSystem)})</Text>
                </Pressable>

                <Pressable
                  style={styles.quickOption}
                  onPress={() => onSelectOption('Podwójne Espresso', 'coffee', 18, doubleEspressoMg)}
                >
                  <Text style={styles.quickOptionName}>Podwójne Espresso (Doppio)</Text>
                  <Text style={styles.quickOptionMg}>~{doubleEspressoMg} mg ({formatDoseWeight(18, unitSystem)})</Text>
                </Pressable>

                <Pressable
                  style={styles.quickOption}
                  onPress={() => onSelectOption('Pojedyncze Espresso', 'coffee', 9, singleEspressoMg)}
                >
                  <Text style={styles.quickOptionName}>Pojedyncze Espresso</Text>
                  <Text style={styles.quickOptionMg}>~{singleEspressoMg} mg ({formatDoseWeight(9, unitSystem)})</Text>
                </Pressable>

                <Pressable
                  style={styles.quickOption}
                  onPress={() => onSelectOption('AeroPress', 'coffee', 15, aeropressMg)}
                >
                  <Text style={styles.quickOptionName}>AeroPress</Text>
                  <Text style={styles.quickOptionMg}>~{aeropressMg} mg ({formatDoseWeight(15, unitSystem)})</Text>
                </Pressable>
              </>
            );
          })()}

          <Pressable
            style={styles.quickOption}
            onPress={() => onSelectOption('Herbata Gongfu / Liściasta', 'tea', 5, 45)}
          >
            <Text style={styles.quickOptionName}>Herbata liściasta (infuzja)</Text>
            <Text style={styles.quickOptionMg}>~45 mg ({formatDoseWeight(5, unitSystem)})</Text>
          </Pressable>

          <Pressable
            style={styles.modalCancelBtn}
            onPress={onClose}
          >
            <Text style={styles.modalCancelText}>Anuluj</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  modalCard: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modalCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  quickOption: {
    backgroundColor: theme.colors.bgCardSecondary,
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  quickOptionName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  quickOptionMg: {
    fontSize: 12,
    color: theme.colors.copper,
    fontWeight: '600',
  },
  modalCancelBtn: {
    marginTop: 8,
    padding: 12,
    alignItems: 'center',
  },
  modalCancelText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
});
