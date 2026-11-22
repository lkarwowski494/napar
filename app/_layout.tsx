// ============================================================================
// Napar — Root Layout (Expo Router)
// Apps4Brew: Pure local state, zero login, artisanal dark theme
// Includes Crash Loop Guard & Safe Mode (TASK-R12-01 & TASK-R12-02)
// ============================================================================

import React, { useState, useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar, View, ActivityIndicator, Pressable, Text } from 'react-native';
import { LanguageProvider, useTranslation } from '../src/core/i18n';
import { BrewProvider } from '../src/core/brew-context';
import { theme } from '../src/core/theme';
import { crashLoopGuard, recordStartupSuccess } from '../src/data/startup-guard';
import { SafeModeView, type SafeModeReason } from '../src/components/SafeModeView';
import { AppErrorBoundary } from '../src/components/AppErrorBoundary';
import { openDatabaseAtStartup, setDefaultUnitSystem } from '../src/data/database';
import { regionUnitSystem } from '../lib/region-units';

function StartupSuccessNotifier() {
  useEffect(() => {
    void recordStartupSuccess();
  }, []);
  return null;
}

// M1-audytor-generalny-041 (S1): natywny nagłówek modala ustawień ma „Zamknij” po lewej.
function ModalCloseHeaderButton() {
  const router = useRouter();
  const { t } = useTranslation();
  return (
    <Pressable
      testID="settings-close-btn"
      onPress={() => router.back()}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={t.common.close}
      style={{ minHeight: 44, minWidth: 44, justifyContent: 'center' }}
    >
      <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.textSecondary }}>{t.common.close}</Text>
    </Pressable>
  );
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
          headerLeft: () => <ModalCloseHeaderButton />,
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

// M1-audytor-generalny-034: domyślny system jednostek z regionu (bez zapisu; zapisane ustawienie wygrywa)
setDefaultUnitSystem(regionUnitSystem());

export default function RootLayout() {
  const [isSafeMode, setIsSafeMode] = useState<boolean>(false);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [safeReason, setSafeReason] = useState<SafeModeReason>('crash-loop');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { shouldEnterSafeMode } = await crashLoopGuard.recordStartupAttempt();
        if (shouldEnterSafeMode) {
          // M1-024: nie nadpisuj powodu `too-new` przez `crash-loop` przy 3. starcie
          let reason: SafeModeReason = 'crash-loop';
          try {
            const probe = openDatabaseAtStartup();
            if (!probe.ok && probe.reason === 'too-new') {
              reason = 'too-new';
            }
          } catch {
            // zostaje 'crash-loop'
          }
          if (active) {
            setSafeReason(reason);
            setIsSafeMode(true);
          }
        } else {
          // M1-audytor-generalny-005: baza otwierana przed pierwszym ekranem; błąd kopii/migracji → tryb awaryjny.
          const opened = openDatabaseAtStartup();
          if (!opened.ok && active) {
            setSafeReason(opened.reason);
            setIsSafeMode(true);
          }
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
    // Jedna próba: kolejny start bez kamienia milowego wraca od razu do trybu awaryjnego (M1-audytor-generalny-005).
    await crashLoopGuard.recordRetry();
    const opened = openDatabaseAtStartup();
    if (!opened.ok) {
      setSafeReason(opened.reason);
      return;
    }
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
        <SafeModeView onRetry={handleRetry} reason={safeReason} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <AppErrorBoundary>
        <LanguageProvider>
          <BrewProvider>
            <StatusBar barStyle="light-content" />
            <StartupSuccessNotifier />
            <RootStack />
          </BrewProvider>
        </LanguageProvider>
      </AppErrorBoundary>
    </SafeAreaProvider>
  );
}
