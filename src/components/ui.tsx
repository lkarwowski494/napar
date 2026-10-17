// ============================================================================
// Napar (Steepwise) — Common UI Components (S1..S16, NFR-INT-001..016)
// Komponenty interfejsu użytkownika: NumInput, Field, Empty, Missing, Btn, SearchField, SwipeRow
// ============================================================================

import React from 'react';
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  Pressable,
  PressableProps,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
  AccessibilityRole,
} from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../core/theme';
import { NumInput, NumInputProps } from './ui/NumInput';

export { NumInput, NumInputProps };

// ----------------------------------------------------------------------------
// S2 & NFR-INT-002: Field — Bezpieczne pole tekstowe z limitem znaków maxLength
// ----------------------------------------------------------------------------
export interface FieldProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
}

export const Field: React.FC<FieldProps> = ({
  label,
  error,
  maxLength = 256,
  style,
  containerStyle,
  ...rest
}) => {
  return (
    <View style={[styles.fieldContainer, containerStyle]}>
      {label && <Text style={styles.fieldLabel}>{label}</Text>}
      <TextInput
        maxLength={maxLength}
        placeholderTextColor={theme.colors.textMuted}
        style={[styles.fieldInput, error ? styles.fieldInputError : null, style]}
        {...rest}
      />
      {error && <Text style={styles.fieldErrorText}>{error}</Text>}
    </View>
  );
};

// ----------------------------------------------------------------------------
// S11 & NFR-INT-011: Empty — Stan pusty z wyjaśnieniem i przyciskiem kolejnego kroku
// ----------------------------------------------------------------------------
export interface EmptyProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export const Empty: React.FC<EmptyProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  style,
  testID = 'empty-state',
}) => {
  return (
    <View testID={testID} style={[styles.emptyContainer, style]}>
      <Text style={styles.emptyTitle}>{title}</Text>
      {description && <Text style={styles.emptyDescription}>{description}</Text>}
      {actionLabel && onAction && (
        <Pressable
          testID={`${testID}-action`}
          style={styles.emptyButton}
          onPress={onAction}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
        >
          <Text style={styles.emptyButtonText}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
};

// ----------------------------------------------------------------------------
// S12 & NFR-INT-012: Missing — Stan brakującego rekordu na trasach [id].tsx
// ----------------------------------------------------------------------------
export interface MissingProps {
  title?: string;
  message?: string;
  backLabel?: string;
  onBack?: () => void;
}

export const Missing: React.FC<MissingProps> = ({
  title = 'Nie znaleziono rekordu',
  message = 'Wybrany element nie istnieje lub został wcześniej usunięty.',
  backLabel = 'Wróć',
  onBack,
}) => {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      try {
        router.back();
      } catch {
        router.replace('/');
      }
    }
  };

  return (
    <View testID="missing-record-state" style={styles.missingContainer}>
      <Text style={styles.missingTitle}>{title}</Text>
      <Text style={styles.missingMessage}>{message}</Text>
      <Pressable
        testID="missing-back-button"
        style={styles.missingButton}
        onPress={handleBack}
        accessibilityRole="button"
        accessibilityLabel={backLabel}
      >
        <Text style={styles.missingButtonText}>{backLabel}</Text>
      </Pressable>
    </View>
  );
};

// ----------------------------------------------------------------------------
// S13 & NFR-INT-013: Btn — Hierarchia przycisków (primary, secondary, ghost, danger)
// ----------------------------------------------------------------------------
export type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export interface BtnProps extends PressableProps {
  title: string;
  variant?: BtnVariant;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const Btn: React.FC<BtnProps> = ({
  title,
  variant = 'secondary',
  style,
  textStyle,
  disabled,
  ...rest
}) => {
  const getVariantStyle = () => {
    switch (variant) {
      case 'primary':
        return styles.btnPrimary;
      case 'danger':
        return styles.btnDanger;
      case 'ghost':
        return styles.btnGhost;
      case 'secondary':
      default:
        return styles.btnSecondary;
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'primary':
        return styles.btnTextPrimary;
      case 'danger':
        return styles.btnTextDanger;
      case 'ghost':
        return styles.btnTextGhost;
      case 'secondary':
      default:
        return styles.btnTextSecondary;
    }
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btnBase,
        getVariantStyle(),
        pressed && styles.btnPressed,
        disabled && styles.btnDisabled,
        style,
      ]}
      {...rest}
    >
      <Text style={[getTextStyle(), disabled && styles.btnTextDisabled, textStyle]}>
        {title}
      </Text>
    </Pressable>
  );
};

// ----------------------------------------------------------------------------
// S15 & NFR-INT-015: SearchField — Wyszukiwarka z przyciskiem czyszczenia ×
// ----------------------------------------------------------------------------
export interface SearchFieldProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export const SearchField: React.FC<SearchFieldProps> = ({
  value,
  onChangeText,
  placeholder = 'Szukaj...',
  onClear,
  style,
  testID = 'search-field',
}) => {
  const handleClear = () => {
    onChangeText('');
    if (onClear) onClear();
  };

  return (
    <View style={[styles.searchContainer, style]}>
      <TextInput
        testID={testID}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textMuted}
        style={styles.searchInput}
        maxLength={128}
        returnKeyType="search"
        accessibilityRole="search"
        accessibilityLabel={placeholder}
      />
      {value.length > 0 && (
        <Pressable
          testID={`${testID}-clear`}
          style={styles.searchClearBtn}
          onPress={handleClear}
          accessibilityRole="button"
          accessibilityLabel="Wyczyść wyszukiwanie"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.searchClearText}>×</Text>
        </Pressable>
      )}
    </View>
  );
};

// ----------------------------------------------------------------------------
// S4 & NFR-INT-004: SwipeRow — Dwutorowe usuwanie elementu z listy
// ----------------------------------------------------------------------------
export interface SwipeRowProps {
  children: React.ReactNode;
  onDelete: () => void;
  deleteLabel?: string;
  style?: StyleProp<ViewStyle>;
}

export const SwipeRow: React.FC<SwipeRowProps> = ({
  children,
  onDelete,
  deleteLabel = 'Usuń',
  style,
}) => {
  return (
    <View
      style={[styles.swipeRowContainer, style]}
      accessible={true}
      accessibilityActions={[{ name: 'delete', label: deleteLabel }]}
      onAccessibilityAction={(event) => {
        if (event.nativeEvent.actionName === 'delete') {
          onDelete();
        }
      }}
    >
      <View style={styles.swipeRowContent}>{children}</View>
      <Pressable
        testID="swipe-row-delete-btn"
        style={styles.swipeRowDeleteBtn}
        onPress={onDelete}
        accessibilityRole="button"
        accessibilityLabel={deleteLabel}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.swipeRowDeleteText}>✕</Text>
      </Pressable>
    </View>
  );
};

// ----------------------------------------------------------------------------
// S1 & NFR-INT-001: CloseButton — Przycisk zamykania modala
// ----------------------------------------------------------------------------
export interface CloseButtonProps {
  onPress: () => void;
  label?: string;
  style?: StyleProp<ViewStyle>;
}

export const CloseButton: React.FC<CloseButtonProps> = ({
  onPress,
  label = 'Zamknij',
  style,
}) => {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[styles.closeButton, style]}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Text style={styles.closeButtonText}>✕</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldInput: {
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
  fieldInputError: {
    borderColor: '#DC2626',
  },
  fieldErrorText: {
    fontSize: 12,
    color: '#DC2626',
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  emptyButton: {
    minHeight: 44,
    minWidth: 120,
    backgroundColor: theme.colors.copper,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  missingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: theme.colors.bg,
  },
  missingTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  missingMessage: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  missingButton: {
    minHeight: 44,
    minWidth: 140,
    backgroundColor: theme.colors.bgCard,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  missingButtonText: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  btnBase: {
    minHeight: 44,
    minWidth: 44,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  btnPressed: {
    opacity: 0.8,
  },
  btnDisabled: {
    opacity: 0.4,
  },
  btnPrimary: {
    backgroundColor: theme.colors.copper,
  },
  btnSecondary: {
    backgroundColor: theme.colors.bgCard,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  btnGhost: {
    backgroundColor: 'transparent',
  },
  btnDanger: {
    backgroundColor: '#DC2626',
  },
  btnTextPrimary: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  btnTextSecondary: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  btnTextGhost: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  btnTextDanger: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  btnTextDisabled: {
    color: theme.colors.textMuted,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.bgCardSecondary,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 12,
    minHeight: 44,
  },
  searchInput: {
    flex: 1,
    color: theme.colors.textPrimary,
    fontSize: 15,
    paddingVertical: 8,
    minHeight: 44,
  },
  searchClearBtn: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchClearText: {
    color: theme.colors.textSecondary,
    fontSize: 18,
    fontWeight: '700',
  },
  swipeRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
    minHeight: 44,
  },
  swipeRowContent: {
    flex: 1,
  },
  swipeRowDeleteBtn: {
    minWidth: 44,
    minHeight: 44,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  swipeRowDeleteText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  closeButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  closeButtonText: {
    color: theme.colors.textSecondary,
    fontSize: 18,
    fontWeight: '700',
  },
});
