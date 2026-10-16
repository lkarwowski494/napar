// ============================================================================
// Apps4Craft Unified Design System — CraftStatDisplay
// "The Sacred Numbers" — High-contrast, glanceable stat widget for kitchen counter.
// ============================================================================

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { sharedCraftTokens } from '../../core/craft-suite-theme';

export interface CraftStatDisplayProps {
  value: string | number;
  label: string;
  unit?: string;
  accentColor?: string;
  subtext?: string;
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
  testID?: string;
}

export function CraftStatDisplay({
  value,
  label,
  unit,
  accentColor,
  subtext,
  size = 'md',
  style,
  testID = 'craft-stat-display',
}: CraftStatDisplayProps) {
  const isLarge = size === 'lg';
  const isSmall = size === 'sm';

  const valueFontSize = isLarge ? 38 : isSmall ? 20 : 28;

  return (
    <View testID={testID} style={[styles.container, style]}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.valueRow}>
        <Text
          style={[
            styles.value,
            { fontSize: valueFontSize, color: accentColor || sharedCraftTokens.colors.textPrimary },
          ]}
          numberOfLines={1}
        >
          {value}
        </Text>
        {unit ? (
          <Text
            style={[
              styles.unit,
              { color: accentColor ? accentColor : sharedCraftTokens.colors.textSecondary },
            ]}
          >
            {unit}
          </Text>
        ) : null}
      </View>
      {subtext ? <Text style={styles.subtext}>{subtext}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: sharedCraftTokens.spacing.xs,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: sharedCraftTokens.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
  },
  value: {
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
  },
  unit: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  subtext: {
    fontSize: 11,
    color: sharedCraftTokens.colors.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
});
