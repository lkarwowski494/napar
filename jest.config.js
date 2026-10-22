module.exports = {
  preset: 'jest-expo/ios',
  setupFiles: ['./jest.setup.js'],
  setupFilesAfterEnv: ['./tests/jest-after-env.js'],
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|standard-navigation)',
  ],
  collectCoverageFrom: [
    'app/**/*.{ts,tsx}',
    'src/**/*.{ts,tsx}',
    '!**/__tests__/**',
  ],
  coverageThreshold: {
    global: {
      statements: 92,
      branches: 80,
      functions: 91,
      lines: 93,
    },
    './src/core/': {
      statements: 97,
      branches: 88,
      functions: 98,
      lines: 97,
    },
    './src/core/water-chemistry.ts': { statements: 100, branches: 100, functions: 100, lines: 100 },
    './src/core/cost-calculator.ts': { statements: 100, branches: 100, functions: 100, lines: 100 },
    './src/core/gongfu-session.ts': { statements: 100, branches: 100, functions: 100, lines: 100 },
    './src/core/domain-rules.ts': { statements: 100, branches: 100, functions: 100, lines: 100 },
    './src/core/unit-converter.ts': { statements: 100, branches: 100, functions: 100, lines: 100 },
    './src/core/grinder-converter.ts': { statements: 100, branches: 100, functions: 100, lines: 100 },
    // Poz. 14 MVP: zakres wagi bez sztywnego minimum (krok steperów, bez przycinania do 1 g ani 10 g)
    './src/core/weight-range.ts': { statements: 100, branches: 100, functions: 100, lines: 100 },
    // Poz. 11 MVP: własny młynek (walidacja, model dla konwertera, lista do wyboru) bez wyjątków
    './src/core/custom-grinder.ts': { statements: 100, branches: 100, functions: 100, lines: 100 },
    './src/core/parse-decimal.ts': { statements: 100, branches: 100, functions: 100, lines: 100 },
    './src/core/recipes-data.ts': { statements: 100, branches: 100, functions: 100, lines: 100 },
    './src/core/knowledge-data.ts': { statements: 96, branches: 87, functions: 100, lines: 97 },
    './src/core/flavor-wheel-data.ts': { statements: 100, branches: 100, functions: 100, lines: 100 },
    './src/core/database-schema.ts': { statements: 100, branches: 100, functions: 100, lines: 100 },
    './src/core/db-path.ts': { statements: 100, branches: 100, functions: 100, lines: 100 },
    './src/core/contrast.ts': { statements: 100, branches: 100, functions: 100, lines: 100 },
    './src/core/theme.ts': { statements: 100, branches: 100, functions: 100, lines: 100 },
    './src/core/search-utils.ts': { statements: 100, branches: 100, functions: 100, lines: 100 },
    './src/core/announce.ts': { statements: 100, branches: 100, functions: 100, lines: 100 },
    './src/core/app-access.ts': { statements: 100, branches: 100, functions: 100, lines: 100 },
    './src/core/access-policy.ts': { statements: 100, branches: 100, functions: 100, lines: 100 },
    // Etap 4b (sklep): port, produkty i mapowanie StoreKit w czystym core bez wyjątków
    './src/core/store-port.ts': { statements: 100, branches: 100, functions: 100, lines: 100 },
    './src/core/store-products.ts': { statements: 100, branches: 100, functions: 100, lines: 100 },
    './src/core/store-mapping.ts': { statements: 100, branches: 100, functions: 100, lines: 100 },
    // Adaptery platformy: expo-iap działa tu na atrapie API (wstrzykiwane), więc progi są pełne
    './src/platform/store-expo.ts': { statements: 100, branches: 100, functions: 100, lines: 100 },
    './src/platform/store-fake.ts': { statements: 100, branches: 100, functions: 100, lines: 100 },
    './src/platform/store.ts': { statements: 100, branches: 100, functions: 100, lines: 100 },
    './src/core/live-activity.ts': { statements: 100, branches: 100, functions: 100, lines: 100 },
    // Live Activity (ekran blokady, Dynamic Island): most stopera w platformie, decyzje w core/live-activity.ts
    './src/platform/live-activity-sync.tsx': { statements: 100, branches: 100, functions: 100, lines: 100 },
    './src/core/craft-suite-theme.ts': { statements: 100, branches: 100, functions: 100, lines: 100 },
    // Poz. 9 (własna woda z raportu wodociągów) i poz. 12 (kalibracja przelicznika kliknięć): 100% bez wyjątków
    './src/core/own-water.ts': { statements: 100, branches: 100, functions: 100, lines: 100 },
    './src/core/grinder-calibration.ts': { statements: 100, branches: 100, functions: 100, lines: 100 },
    // Poz. 31 (karta degustacyjna) i poz. 32 (napoje mleczne): czysty model i wartości bez wyjątków
    './src/core/tasting-card.ts': { statements: 100, branches: 100, functions: 100, lines: 100 },
    './src/core/milk-drinks.ts': { statements: 100, branches: 100, functions: 100, lines: 100 },
    // Przebudowa etapu 2 (persystencja i kopie): 100% bez wyjątków
    './src/core/repositories/': { statements: 100, branches: 100, functions: 100, lines: 100 },
    './src/core/backup.ts': { statements: 100, branches: 100, functions: 100, lines: 100 },
    './src/core/csv-export.ts': { statements: 100, branches: 100, functions: 100, lines: 100 },
    './src/core/db-location.ts': { statements: 100, branches: 100, functions: 100, lines: 100 },
    './app/': {
      statements: 88,
      branches: 70,
      functions: 85,
      lines: 88,
    },
  },
};
