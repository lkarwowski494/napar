// ============================================================================
// Napar (Steepwise) — Root Layout (Expo Router)
// Apps4Brew: Pure local state, zero login, artisanal dark theme
// ============================================================================

import React from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import { BrewProvider } from '../src/core/brew-context';
import { theme } from '../src/core/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <BrewProvider>
        <StatusBar barStyle="light-content" />
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: theme.colors.bgCard,
            },
            headerTintColor: theme.colors.textPrimary,
            headerTitleStyle: {
              fontWeight: '600',
              fontSize: 17,
            },
            contentStyle: {
              backgroundColor: theme.colors.bg,
            },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="settings"
            options={{
              presentation: 'modal',
              title: 'Ustawienia i Kopia',
            }}
          />
        </Stack>
      </BrewProvider>
    </SafeAreaProvider>
  );
}
