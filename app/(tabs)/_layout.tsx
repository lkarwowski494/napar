// ============================================================================
// Napar (Steepwise) — Tabs Layout (Expo Router)
// Apps4Craft Studio: Minimalist vector icons, warm artisanal aesthetic.
// ============================================================================

import React from 'react';
import { Tabs, Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { theme } from '../../src/core/theme';
import {
  BrewIcon,
  BeansIcon,
  JournalIcon,
  LabIcon,
  CaffeineIcon,
  SettingsIcon,
} from '../../src/components/icons/CraftIcons';

function SettingsHeaderButton() {
  return (
    <Link href="/settings" asChild>
      <Pressable
        hitSlop={12}
        style={styles.headerButton}
        accessibilityRole="button"
        accessibilityLabel="Otwórz ustawienia i kopię zapasową"
      >
        <SettingsIcon size={20} color={theme.colors.textSecondary} />
      </Pressable>
    </Link>
  );
}

export default function TabLayout() {
  return (
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
        headerRight: () => <SettingsHeaderButton />,
        tabBarStyle: {
          backgroundColor: theme.colors.bgCard,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
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
  );
}

const styles = StyleSheet.create({
  headerButton: {
    marginRight: 16,
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
