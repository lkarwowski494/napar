// ============================================================================
// Apps4Craft Unified Design System — CraftHeader
// Universal safe navigation header adhering to strict kitchen-ergonomics & iOS safe-areas.
// ============================================================================

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { sharedCraftTokens } from '../../core/craft-suite-theme';
import { ChevronBackIcon, CloseIcon } from '../icons/CraftIcons';

export interface CraftHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  onClose?: () => void;
  backAccessibilityLabel?: string;
  closeAccessibilityLabel?: string;
  rightAction?: React.ReactNode;
  style?: ViewStyle;
  testID?: string;
}

export function CraftHeader({
  title,
  subtitle,
  onBack,
  onClose,
  backAccessibilityLabel = 'Wróć',
  closeAccessibilityLabel = 'Zamknij',
  rightAction,
  style,
  testID = 'craft-header',
}: CraftHeaderProps) {
  const insets = useSafeAreaInsets();

  const handlePress = (callback?: () => void) => {
    if (!callback) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    } catch {
      // ignore haptic errors
    }
    callback();
  };

  const hasLeftAction = Boolean(onBack || onClose);

  return (
    <View
      testID={testID}
      style={[
        styles.container,
        { paddingTop: Math.max(insets.top, 16) },
        style,
      ]}
      accessibilityRole="header"
    >
      <View style={styles.contentRow}>
        {hasLeftAction ? (
          <TouchableOpacity
            testID={onBack ? 'craft-header-back' : 'craft-header-close'}
            style={[styles.actionButton, styles.touchTarget]}
            hitSlop={sharedCraftTokens.hitSlopStandard}
            onPress={() => handlePress(onBack || onClose)}
            accessibilityRole="button"
            accessibilityLabel={onBack ? backAccessibilityLabel : closeAccessibilityLabel}
          >
            {onBack ? (
              <ChevronBackIcon size={22} color={sharedCraftTokens.colors.textPrimary} />
            ) : (
              <CloseIcon size={20} color={sharedCraftTokens.colors.textPrimary} />
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.actionPlaceholder} />
        )}

        <View style={styles.titleColumn}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        {rightAction ? (
          <View style={styles.rightActionContainer}>{rightAction}</View>
        ) : (
          <View style={styles.actionPlaceholder} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  touchTarget: { minWidth: 44, minHeight: 44 },
  container: {
    backgroundColor: sharedCraftTokens.colors.bgBasalt,
    borderBottomWidth: 1,
    borderBottomColor: sharedCraftTokens.colors.border,
    paddingHorizontal: sharedCraftTokens.spacing.md,
    paddingBottom: sharedCraftTokens.spacing.sm,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: sharedCraftTokens.touchTargetMin,
  },
  actionButton: {
    width: sharedCraftTokens.touchTargetMin,
    height: sharedCraftTokens.touchTargetMin,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: sharedCraftTokens.borderRadius.full,
    backgroundColor: sharedCraftTokens.colors.bgCardSecondary,
  },
  actionPlaceholder: {
    width: sharedCraftTokens.touchTargetMin,
    height: sharedCraftTokens.touchTargetMin,
  },
  titleColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: sharedCraftTokens.spacing.xs,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: sharedCraftTokens.colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: sharedCraftTokens.colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  rightActionContainer: {
    minWidth: sharedCraftTokens.touchTargetMin,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
