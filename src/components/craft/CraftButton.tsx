// ============================================================================
// Apps4Craft Unified Design System — CraftButton
// Tactile, ergonomic button designed for kitchen workflow (min 44/52pt targets).
// ============================================================================

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { sharedCraftTokens } from '../../core/craft-suite-theme';

export type CraftButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type CraftButtonSize = 'md' | 'lg';

export interface CraftButtonProps {
  label: string;
  onPress: () => void;
  variant?: CraftButtonVariant;
  size?: CraftButtonSize;
  accentColor?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  labelStyle?: TextStyle;
  testID?: string;
  accessibilityLabel?: string;
}

export function CraftButton({
  label,
  onPress,
  variant = 'primary',
  size = 'lg',
  accentColor = '#C86A28', // domyślnie miedź (Napar)
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  style,
  labelStyle,
  testID = 'craft-button',
  accessibilityLabel,
}: CraftButtonProps) {
  const handlePress = () => {
    if (disabled || loading) return;
    try {
      Haptics.impactAsync(
        variant === 'primary'
          ? Haptics.ImpactFeedbackStyle.Medium
          : Haptics.ImpactFeedbackStyle.Light
      ).catch(() => {});
    } catch {
      // ignore
    }
    onPress();
  };

  const isPrimary = variant === 'primary';
  const isSecondary = variant === 'secondary';
  const isDanger = variant === 'danger';
  const isGhost = variant === 'ghost';

  const containerDynamicStyle: ViewStyle = {
    minHeight: size === 'lg' ? sharedCraftTokens.buttonHeightMin : sharedCraftTokens.touchTargetMin,
    backgroundColor: isPrimary
      ? accentColor
      : isSecondary
      ? sharedCraftTokens.colors.bgCard
      : isDanger
      ? sharedCraftTokens.colors.dangerMuted
      : 'transparent',
    borderColor: isPrimary
      ? accentColor
      : isSecondary
      ? sharedCraftTokens.colors.border
      : isDanger
      ? sharedCraftTokens.colors.danger
      : 'transparent',
    borderWidth: isGhost ? 0 : 1,
    opacity: disabled ? 0.45 : 1,
  };

  const textDynamicStyle: TextStyle = {
    color: isPrimary
      ? '#FFFFFF'
      : isDanger
      ? sharedCraftTokens.colors.danger
      : sharedCraftTokens.colors.textPrimary,
  };

  return (
    <TouchableOpacity
      testID={testID}
      activeOpacity={0.8}
      disabled={disabled || loading}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      style={[styles.baseButton, containerDynamicStyle, style, styles.touchTarget]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={isPrimary ? '#FFFFFF' : sharedCraftTokens.colors.textPrimary}
        />
      ) : (
        <View style={styles.contentRow}>
          {icon && iconPosition === 'left' ? <View style={styles.iconLeft}>{icon}</View> : null}
          <Text style={[styles.baseLabel, textDynamicStyle, labelStyle]}>{label}</Text>
          {icon && iconPosition === 'right' ? <View style={styles.iconRight}>{icon}</View> : null}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  touchTarget: { minWidth: 44, minHeight: 44 },
  baseButton: {
    borderRadius: sharedCraftTokens.borderRadius.md,
    paddingHorizontal: sharedCraftTokens.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  baseLabel: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  iconLeft: {
    marginRight: sharedCraftTokens.spacing.sm,
  },
  iconRight: {
    marginLeft: sharedCraftTokens.spacing.sm,
  },
});
