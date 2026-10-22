import React, { useState, useEffect, useRef } from 'react';
import {
  TextInput,
  TextInputProps,
  StyleSheet,
  StyleProp,
  TextStyle,
  NativeSyntheticEvent,
  TextInputFocusEventData,
} from 'react-native';
import { wInKeep, baseToDisplay } from '../../core/unit-converter';
import { theme } from '../../core/theme';

export interface NumInputProps extends Omit<TextInputProps, 'value' | 'onChangeText'> {
  value?: number | string;
  stored?: number;
  unit?: string;
  label?: string;
  min?: number;
  max?: number;
  onChangeNumber?: (val: number) => void;
  onChangeText?: (text: string) => void;
  style?: StyleProp<TextStyle>;
}

export const NumInput: React.FC<NumInputProps> = ({
  value,
  stored,
  unit = '',
  label,
  min,
  max,
  onChangeNumber,
  onChangeText,
  onBlur,
  style,
  keyboardType = 'decimal-pad',
  ...rest
}) => {
  const formatInitial = (v: number | string | undefined): string => {
    if (v === undefined || v === null || v === '') return '';
    return String(v);
  };

  const [rawText, setRawText] = useState<string>(formatInitial(value));
  const textRef = useRef<string>(formatInitial(value));
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // Synchronizacja gdy wartość z zewnątrz zmieni się w trakcie gdy pole nie jest edytowane
  useEffect(() => {
    if (!isEditing) {
      const init = formatInitial(value);
      setRawText(init);
      textRef.current = init;
    }
  }, [value, isEditing]);

  const handleChangeText = (text: string) => {
    textRef.current = text;
    setRawText(text);
    if (onChangeText) {
      onChangeText(text);
    }
  };

  const handleFocus = () => {
    setIsEditing(true);
  };

  const handleBlur = (e: any) => {
    setIsEditing(false);
    const trimmed = textRef.current.trim();
    if (trimmed === '') {
      textRef.current = '0';
      setRawText('0');
      if (onChangeNumber) onChangeNumber(0);
      if (onBlur) onBlur(e);
      return;
    }

    // RD-ENG-01: Użyj wInKeep z propem stored i unit
    let parsed = wInKeep(trimmed, unit, stored);

    // Ograniczenie min / max jeśli zdefiniowane
    if (min !== undefined && parsed < min) {
      parsed = min;
    }
    if (max !== undefined && parsed > max) {
      parsed = max;
    }

    // Pole pokazuje wartość w jednostce `unit`; wartość zwrotna i `stored` są w jednostce bazowej
    setRawText(String(baseToDisplay(parsed, unit)));
    if (onChangeNumber) {
      onChangeNumber(parsed);
    }
    if (onBlur) {
      onBlur(e);
    }
  };

  return (
    <TextInput
      value={rawText}
      onChangeText={handleChangeText}
      onFocus={handleFocus}
      onBlur={handleBlur}
      keyboardType={keyboardType}
      placeholderTextColor={theme.colors.textMuted}
      accessibilityLabel={rest.accessibilityLabel || label}
      style={[styles.input, style]}
      {...rest}
    />
  );
};

const styles = StyleSheet.create({
  input: {
    backgroundColor: theme.colors.bgCardSecondary,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    color: theme.colors.textPrimary,
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 44,
  },
});
