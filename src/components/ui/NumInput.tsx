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
import {
  wInKeep,
  roundTo,
  celsiusToFahrenheit,
  gramsToOunces,
  mlToFluidOunces,
} from '../../core/unit-converter';
import { theme } from '../../core/theme';

function formatBaseToUnitDisplay(baseVal: number, unit: string): string {
  const u = typeof unit === 'string' ? unit.toLowerCase().trim() : '';
  if (u === '°f' || u === 'f') {
    return String(celsiusToFahrenheit(baseVal));
  }
  if (u === 'oz') {
    return String(gramsToOunces(baseVal));
  }
  if (u === 'fl oz' || u === 'floz') {
    return String(mlToFluidOunces(baseVal));
  }
  if (u === 'lb' || u === 'lbs') {
    return String(roundTo(baseVal * 2.20462262185, 1));
  }
  return String(baseVal);
}

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
    if (!isEditing && value !== undefined) {
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

  const clampValue = (n: number): number => {
    let clamped = n;
    if (min !== undefined && clamped < min) {
      clamped = min;
    }
    if (max !== undefined && clamped > max) {
      clamped = max;
    }
    return clamped;
  };

  const handleBlur = (e: any) => {
    setIsEditing(false);
    const trimmed = textRef.current.trim();
    if (trimmed === '') {
      const emptyVal = clampValue(0);
      const displayStr = formatBaseToUnitDisplay(emptyVal, unit);
      textRef.current = displayStr;
      setRawText(displayStr);
      if (onChangeNumber) onChangeNumber(emptyVal);
      if (onBlur) onBlur(e);
      return;
    }

    // RD-ENG-01: Użyj wInKeep z propem stored i unit
    const parsed = clampValue(wInKeep(trimmed, unit, stored));
    const displayStr = formatBaseToUnitDisplay(parsed, unit);
    textRef.current = displayStr;
    setRawText(displayStr);

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
    borderColor: theme.colors.borderStrong,
    color: theme.colors.textPrimary,
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 44,
  },
});
