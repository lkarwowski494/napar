import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput } from 'react-native';
import {
  deleteCustomGrinder,
  getAppSetting,
  listCustomGrinders,
  saveCustomGrinder,
  setAppSetting,
} from '../../core/database';
import {
  validateCustomGrinderForm,
  type CustomGrinder,
  type CustomGrinderError,
  type CustomGrinderField,
} from '../../core/custom-grinder';
import { confirm } from '../../core/confirm';
import { theme } from '../../core/theme';

export interface CustomGrinderCardProps {
  t: any;
  /** Wywoływane po dodaniu lub usunięciu młynka, żeby lista przeliczenia i wybór odświeżyły się. */
  onChanged: () => void;
}

const DEFAULT_GRINDER_ID = 'comandante_c40';

/**
 * Własny młynek (poz. 11 MVP): nazwa i przelicznik µm na klik. Zapis w ustawieniach (jak własna woda),
 * więc wybór młynka i kopia zapasowa obejmują go bez dodatkowej obsługi.
 */
export const CustomGrinderCard: React.FC<CustomGrinderCardProps> = ({ t, onChanged }) => {
  const [grinders, setGrinders] = useState<CustomGrinder[]>(() => listCustomGrinders());
  const [name, setName] = useState<string>('');
  const [stepInput, setStepInput] = useState<string>('');
  const [errors, setErrors] = useState<Partial<Record<CustomGrinderField, CustomGrinderError>>>({});
  const [saveFailed, setSaveFailed] = useState<boolean>(false);

  const errorText = (field: CustomGrinderField): string | null => {
    const error = errors[field];
    if (!error) return null;
    if (field === 'name') return t.grinder.customErrName;
    if (error === 'invalid') return t.grinder.customErrStepInvalid;
    if (error === 'range') return t.grinder.customErrStepRange;
    return t.grinder.customErrStepEmpty;
  };

  const nameError = errorText('name');
  const stepError = errorText('step');

  const addGrinder = () => {
    const result = validateCustomGrinderForm(
      { name, stepText: stepInput },
      `custom-grinder-${Date.now()}`,
      new Date().toISOString()
    );
    if (!result.ok) {
      setErrors(result.errors);
      setSaveFailed(false);
      return;
    }
    try {
      saveCustomGrinder(result.grinder);
    } catch {
      setSaveFailed(true);
      return;
    }
    setGrinders(listCustomGrinders());
    setName('');
    setStepInput('');
    setErrors({});
    setSaveFailed(false);
    onChanged();
  };

  const removeGrinder = (grinder: CustomGrinder) => {
    confirm({
      title: t.grinder.customDeleteTitle,
      message: t.grinder.customDeleteMessage,
      confirmText: t.grinder.customDeleteAction,
      destructive: true,
      onConfirm: () => {
        try {
          deleteCustomGrinder(grinder.id);
        } catch {
          return;
        }
        // Usunięty młynek nie może zostać domyślnym wyborem bez wpisu na liście
        if (getAppSetting('default_grinder', DEFAULT_GRINDER_ID) === grinder.id) {
          setAppSetting('default_grinder', DEFAULT_GRINDER_ID);
        }
        setGrinders(listCustomGrinders());
        onChanged();
      },
    });
  };

  return (
    <View style={styles.card} testID="custom-grinder-card">
      <Text style={styles.header}>{t.grinder.customTitle}</Text>
      <Text style={styles.help}>{t.grinder.customHelp}</Text>

      {grinders.length === 0 ? (
        <Text style={styles.empty}>{t.grinder.customListEmpty}</Text>
      ) : (
        grinders.map((grinder) => (
          <View key={grinder.id} style={styles.row} testID={`custom-grinder-row-${grinder.id}`}>
            <View style={styles.rowText}>
              <Text style={styles.rowName}>{grinder.name}</Text>
              <Text style={styles.rowSub}>{`${grinder.stepMicrons} ${t.grinder.customStepUnit}`}</Text>
            </View>
            <Pressable
              style={[styles.deleteBtn, styles.touchTarget]}
              onPress={() => removeGrinder(grinder)}
              accessibilityRole="button"
              accessibilityLabel={`${t.grinder.customDeleteAction}: ${grinder.name}`}
            >
              <Text style={styles.deleteText}>{t.grinder.customDeleteAction}</Text>
            </Pressable>
          </View>
        ))
      )}

      <Text style={styles.label}>{t.grinder.customNameLabel}</Text>
      <TextInput
        testID="custom-grinder-name-input"
        style={styles.input}
        value={name}
        onChangeText={setName}
        accessibilityLabel={t.grinder.customNameLabel}
      />
      {nameError && <Text style={styles.error}>{nameError}</Text>}

      <Text style={styles.label}>{t.grinder.customStepLabel}</Text>
      <TextInput
        testID="custom-grinder-step-input"
        style={styles.input}
        keyboardType="decimal-pad"
        value={stepInput}
        onChangeText={setStepInput}
        accessibilityLabel={t.grinder.customStepLabel}
      />
      {stepError && <Text style={styles.error}>{stepError}</Text>}

      {saveFailed && <Text style={styles.error}>{t.grinder.customSaveFailed}</Text>}

      <Pressable
        testID="custom-grinder-add-btn"
        style={[styles.addBtn, styles.touchTarget]}
        onPress={addGrinder}
        accessibilityRole="button"
        accessibilityLabel={t.grinder.customAdd}
      >
        <Text style={styles.addText}>{t.grinder.customAdd}</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  touchTarget: { minHeight: 44, minWidth: 44 },
  card: {
    backgroundColor: theme.colors.bgCardSecondary,
    borderRadius: theme.borderRadius.sm,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginTop: 12,
  },
  header: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  help: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    lineHeight: 17,
    marginBottom: 10,
  },
  empty: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  rowText: { flex: 1 },
  rowName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  rowSub: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  deleteBtn: {
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  deleteText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    marginTop: 10,
    marginBottom: 6,
  },
  input: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 12,
    minHeight: 44,
    color: theme.colors.textPrimary,
    fontSize: 14,
  },
  error: {
    fontSize: 12,
    color: theme.colors.textPrimary,
    marginTop: 4,
  },
  addBtn: {
    marginTop: 12,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.copper,
  },
  addText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.bgCard,
  },
});
