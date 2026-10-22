// ============================================================================
// Apps4Craft Unified Design System — CraftCard
// Dark ceramic card container with tactile depth and artisanal borders.
// ============================================================================

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { sharedCraftTokens } from '../../core/craft-suite-theme';

export interface CraftCardProps {
  children: React.ReactNode;
  headerTitle?: string;
  headerBadge?: React.ReactNode;
  headerIcon?: React.ReactNode;
  accentBorder?: string;
  onPress?: () => void;
  style?: ViewStyle;
  testID?: string;
}

export function CraftCard({
  children,
  headerTitle,
  headerBadge,
  headerIcon,
  accentBorder,
  onPress,
  style,
  testID = 'craft-card',
}: CraftCardProps) {
  const handlePress = () => {
    if (!onPress) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    } catch {
      // ignore
    }
    onPress();
  };

  const cardStyle: ViewStyle = {
    borderColor: accentBorder || sharedCraftTokens.colors.border,
    borderWidth: accentBorder ? 1.5 : 1,
  };

  const hasHeader = Boolean(headerTitle || headerBadge || headerIcon);

  if (onPress) {
    return (
      <TouchableOpacity
        testID={testID}
        activeOpacity={0.85}
        onPress={handlePress}
        style={[styles.container, cardStyle, style, styles.touchTarget]}
      >
        {hasHeader ? (
          <View style={styles.headerRow}>
            <View style={styles.headerTitleGroup}>
              {headerIcon ? <View style={styles.headerIcon}>{headerIcon}</View> : null}
              {headerTitle ? <Text style={styles.headerTitle}>{headerTitle}</Text> : null}
            </View>
            {headerBadge ? <View>{headerBadge}</View> : null}
          </View>
        ) : null}
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View testID={testID} style={[styles.container, cardStyle, style]}>
      {hasHeader ? (
        <View style={styles.headerRow}>
          <View style={styles.headerTitleGroup}>
            {headerIcon ? <View style={styles.headerIcon}>{headerIcon}</View> : null}
            {headerTitle ? <Text style={styles.headerTitle}>{headerTitle}</Text> : null}
          </View>
          {headerBadge ? <View>{headerBadge}</View> : null}
        </View>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  touchTarget: { minWidth: 44, minHeight: 44 },
  container: {
    backgroundColor: sharedCraftTokens.colors.bgCard,
    borderRadius: sharedCraftTokens.borderRadius.lg,
    padding: sharedCraftTokens.spacing.md,
    marginBottom: sharedCraftTokens.spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: sharedCraftTokens.spacing.sm,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    marginRight: sharedCraftTokens.spacing.xs,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: sharedCraftTokens.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
