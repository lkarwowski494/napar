// ============================================================================
// Napar (Steepwise) — Root Layout (Expo Router)
// Apps4Brew: Pure local state, zero login, artisanal dark theme
// Includes Crash Loop Guard & Safe Mode (TASK-R12-01 & TASK-R12-02)
// ============================================================================

import React, { useState, useEffect } from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar, View, ActivityIndicator } from 'react-native';
import { LanguageProvider, useTranslation } from '../src/core/i18n';
import { BrewProvider } from '../src/core/brew-context';
import { theme } from '../src/core/theme';
import { crashLoopGuard, recordStartupSuccess } from '../src/core/startup-guard';
import { SafeModeView } from '../src/components/SafeModeView';

function StartupSuccessNotifier() {
  useEffect(() => {
    void recordStartupSuccess();
  }, []);
  return null;
}

function RootStack() {
  const { language } = useTranslation();
  return (
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
          title: language === 'en' ? 'Settings & Backup' : 'Ustawienia i Kopia',
        }}
      />
      <Stack.Screen
        name="recipe-builder"
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="gongfu"
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [isSafeMode, setIsSafeMode] = useState<boolean>(false);
  const [isReady, setIsReady] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { shouldEnterSafeMode } = await crashLoopGuard.recordStartupAttempt();
        if (shouldEnterSafeMode) {
          if (active) setIsSafeMode(true);
        }
      } catch {
        if (active) setIsSafeMode(true);
      } finally {
        if (active) setIsReady(true);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleRetry = async () => {
    await crashLoopGuard.resetCrashCount();
    setIsSafeMode(false);
  };

  if (!isReady) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.copper} />
      </View>
    );
  }

  if (isSafeMode) {
    return (
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" />
        <SafeModeView onRetry={handleRetry} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <BrewProvider>
          <StatusBar barStyle="light-content" />
          <StartupSuccessNotifier />
          <RootStack />
        </BrewProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
