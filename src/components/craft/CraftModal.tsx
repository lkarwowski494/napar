// ============================================================================
// Apps4Craft Unified Design System — CraftModal
// Full-bleed ceramic modal with guaranteed Safe Area spacing and collision-free controls.
// ============================================================================

import React from 'react';
import {
  Modal,
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { sharedCraftTokens } from '../../core/craft-suite-theme';
import { CraftHeader } from './CraftHeader';

export interface CraftModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  contentContainerStyle?: ViewStyle;
  testID?: string;
  scrollable?: boolean;
}

export function CraftModal({
  visible,
  onClose,
  title,
  subtitle,
  children,
  footer,
  contentContainerStyle,
  testID = 'craft-modal',
  scrollable = true,
}: CraftModalProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
      testID={testID}
      accessibilityViewIsModal
    >
      <View style={styles.container}>
        <CraftHeader
          testID="craft-modal-header"
          title={title}
          subtitle={subtitle}
          onClose={onClose}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardAvoiding}
        >
          {scrollable ? (
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={[
                styles.scrollContent,
                { paddingBottom: Math.max(insets.bottom, 24) + (footer ? 80 : 24) },
                contentContainerStyle,
              ]}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {children}
            </ScrollView>
          ) : (
            <View
              style={[
                styles.fixedContent,
                { paddingBottom: Math.max(insets.bottom, 24) + (footer ? 80 : 24) },
                contentContainerStyle,
              ]}
            >
              {children}
            </View>
          )}

          {footer ? (
            <View
              style={[
                styles.footerContainer,
                { paddingBottom: Math.max(insets.bottom, 16) },
              ]}
            >
              {footer}
            </View>
          ) : null}
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: sharedCraftTokens.colors.bgBasalt,
  },
  keyboardAvoiding: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: sharedCraftTokens.spacing.md,
  },
  fixedContent: {
    flex: 1,
    padding: sharedCraftTokens.spacing.md,
  },
  footerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: sharedCraftTokens.colors.bgBasalt,
    borderTopWidth: 1,
    borderTopColor: sharedCraftTokens.colors.border,
    paddingTop: sharedCraftTokens.spacing.sm,
    paddingHorizontal: sharedCraftTokens.spacing.md,
  },
});
