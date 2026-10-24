// ============================================================================
// Napar (Steepwise) — Tabs Layout (Expo Router)
// Apps4Craft Studio: Minimalist vector icons, warm artisanal aesthetic.
// ============================================================================

import React, { useState } from 'react';
import { Tabs } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../src/core/theme';
import {
  BrewIcon,
  BeansIcon,
  JournalIcon,
  LabIcon,
  CaffeineIcon,
  SettingsIcon,
  CompassIcon,
} from '../../src/components/icons/CraftIcons';
import { AppGuideModal } from '../../src/components/AppGuideModal';

function AppGuideHeaderButton({ onOpen }: { onOpen: () => void }) {
  return (
    <Pressable
      testID="header-guide-btn"
      hitSlop={10}
      style={styles.headerGuideButton}
      onPress={onOpen}
      accessibilityRole="button"
      accessibilityLabel="Jak działa aplikacja?"
    >
      <CompassIcon size={14} color={theme.colors.copper} />
      <Text style={styles.headerGuideButtonText}>Jak działa aplikacja?</Text>
    </Pressable>
  );
}

export default function TabLayout() {
  const [showGuideModal, setShowGuideModal] = useState(false);

  let insets = { bottom: 0, top: 0, left: 0, right: 0 };
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    insets = useSafeAreaInsets();
  } catch {
    insets = { bottom: 0, top: 0, left: 0, right: 0 };
  }
  const bottomInset = Math.max(insets?.bottom || 0, 8);

  return (
    <>
      <Tabs
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.colors.bgCard,
            borderBottomColor: theme.colors.border,
            borderBottomWidth: 1,
            elevation: 0,
            shadowOpacity: 0,
          },
          headerTintColor: theme.colors.textPrimary,
          headerTitleStyle: {
            fontWeight: '700',
            fontSize: 18,
            letterSpacing: -0.3,
            color: theme.colors.textPrimary,
          },
          // Guide button moved to Settings (DEC-06)
          tabBarStyle: {
            backgroundColor: theme.colors.bgCard,
            borderTopColor: theme.colors.border,
            borderTopWidth: 1,
            height: 52 + bottomInset,
            paddingBottom: bottomInset,
            paddingTop: 6,
            elevation: 0,
          },
          tabBarActiveTintColor: theme.colors.copper,
          tabBarInactiveTintColor: theme.colors.textMuted,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
            letterSpacing: 0.2,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Parzenie',
            headerTitle: 'Napar',
            tabBarIcon: ({ focused }) => (
              <BrewIcon
                size={22}
                color={focused ? theme.colors.copper : theme.colors.textMuted}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="beans"
          options={{
            title: 'Spiżarnia',
            headerTitle: 'Spiżarnia',
            tabBarIcon: ({ focused }) => (
              <BeansIcon
                size={22}
                color={focused ? theme.colors.copper : theme.colors.textMuted}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="journal"
          options={{
            title: 'Dziennik',
            headerTitle: 'Dziennik Degustacji',
            tabBarIcon: ({ focused }) => (
              <JournalIcon
                size={22}
                color={focused ? theme.colors.copper : theme.colors.textMuted}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="dialin"
          options={{
            title: 'Warsztat',
            headerTitle: 'Warsztat & Dial-in',
            tabBarIcon: ({ focused }) => (
              <LabIcon
                size={22}
                color={focused ? theme.colors.copper : theme.colors.textMuted}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Ustawienia',
            headerTitle: 'Ustawienia & Kopia',
            tabBarIcon: ({ focused }) => (
              <SettingsIcon
                size={22}
                color={focused ? theme.colors.copper : theme.colors.textMuted}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="caffeine"
          options={{
            title: 'Kofeina',
            headerTitle: 'Monitor Kofeiny',
            tabBarIcon: ({ focused }) => (
              <CaffeineIcon
                size={22}
                color={focused ? theme.colors.copper : theme.colors.textMuted}
              />
            ),
          }}
        />
      </Tabs>
      <AppGuideModal
        visible={showGuideModal}
        onClose={() => setShowGuideModal(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  headerGuideButton: {
    marginRight: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.bgCardSecondary,
    borderWidth: 1,
    borderColor: theme.colors.copper,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerGuideButtonText: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.copper,
  },
});
