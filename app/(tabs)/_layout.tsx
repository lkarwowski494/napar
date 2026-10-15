// ============================================================================
// Napar (Steepwise) — Tabs Layout (Expo Router)
// 5 core tabs: Parzenie, Spiżarnia, Dziennik, Klinika & Kalkulator, Kofeina & Sen
// ============================================================================

import React from 'react';
import { Tabs, Link } from 'expo-router';
import { Text, Pressable, StyleSheet } from 'react-native';
import { theme } from '../../src/core/theme';

function TabIcon({ symbol, focused }: { symbol: string; focused: boolean }) {
  return (
    <Text style={[styles.tabIcon, { opacity: focused ? 1 : 0.45 }]}>
      {symbol}
    </Text>
  );
}

function SettingsHeaderButton() {
  return (
    <Link href="/settings" asChild>
      <Pressable
        hitSlop={12}
        style={styles.headerButton}
        accessibilityLabel="Otwórz ustawienia i kopię zapasową"
      >
        <Text style={styles.headerButtonText}>⚙️</Text>
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
        },
        headerTintColor: theme.colors.textPrimary,
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 18,
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
        },
        tabBarActiveTintColor: theme.colors.copper,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Parzenie',
          headerTitle: 'Napar · Asystent Parzenia',
          tabBarIcon: ({ focused }) => <TabIcon symbol="☕" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="beans"
        options={{
          title: 'Spiżarnia',
          headerTitle: 'Spiżarnia Ziaren i Liści',
          tabBarIcon: ({ focused }) => <TabIcon symbol="🫘" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          title: 'Dziennik',
          headerTitle: 'Dziennik Degustacji',
          tabBarIcon: ({ focused }) => <TabIcon symbol="📖" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="dialin"
        options={{
          title: 'Klinika & Kalk',
          headerTitle: 'Dial-in Doctor & Kalkulatory',
          tabBarIcon: ({ focused }) => <TabIcon symbol="🧭" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="caffeine"
        options={{
          title: 'Kofeina',
          headerTitle: 'Monitor Kofeiny i Snu',
          tabBarIcon: ({ focused }) => <TabIcon symbol="⚡" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  headerButton: {
    marginRight: 16,
    padding: 4,
  },
  headerButtonText: {
    fontSize: 20,
  },
});
