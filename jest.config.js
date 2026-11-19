module.exports = {
  preset: 'jest-expo/ios',
  setupFiles: ['./jest.setup.js'],
  setupFilesAfterEnv: ['./tests/jest-after-env.js'],
  // M1-audytor-generalny-011: budżety czasu CPU poza bramką (07-jakosc-003) — osobno: npm run test:perf.
  testPathIgnorePatterns: ['/node_modules/', 'perf-budget\\.test\\.ts$'],
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
  // Zapadka z 2026-11-14 (07-jakosc-004 (a), zadania 011/013): progi tylko w górę; niepokryte gałęzie
  // w plikach poniżej to głównie obrony nieosiągalne — wzrost do 100% wymaga refaktoru (osobne zadanie).
  coverageThreshold: {
    global: {
      statements: 85,
      branches: 75,
      functions: 88,
      lines: 85,
    },
    './src/core/': {
      statements: 93,
      branches: 87,
      functions: 98,
      lines: 94,
    },
    // M1-audytor-generalny-045 (05-architekt-012): warstwy wydzielone z src/core trzymają próg src/core.
    // Pliki przeszły tu bez zmiany treści (adaptery platformy, zapis, hooki React); src/core po przeniesieniu
    // podniósł próg gałęzi i funkcji (stan po przeniesieniu: 88,91% / 99,02%; przed: 88,62% / 96,93%).
    './src/platform/': { statements: 93, branches: 85, functions: 95, lines: 94 },
    './src/data/': { statements: 93, branches: 85, functions: 95, lines: 94 },
    './src/hooks/useJournalAnalytics.ts': { statements: 100, branches: 94, functions: 100, lines: 100 },
    // Hooki React (src/hooks/): w src/core liczyły się tylko w sumie katalogu; tu każdy dostaje własną zapadkę
    // od stanu z 2026-11-15 (useBrewWorkflow 90,33 / 64,42 / 92,68 / 91,35 % — margines jednej gałęzi/funkcji).
    // Bez progu katalogu: Jest liczy katalog razem z plikami o własnym progu, a useBrewWorkflow go nie spełnia.
    './src/hooks/useBrewWorkflow.ts': { statements: 89, branches: 63, functions: 92, lines: 90 },
    './src/core/water-chemistry.ts': { statements: 91, branches: 89, functions: 100, lines: 100 },
    './src/core/gongfu-session.ts': { statements: 100, branches: 100, functions: 100, lines: 100 },
    './src/core/recipes-data.ts': { statements: 100, branches: 100, functions: 100, lines: 100 },
    './src/core/knowledge-data.ts': { statements: 95, branches: 85, functions: 100, lines: 95 },
    './src/core/flavor-wheel-data.ts': { statements: 100, branches: 100, functions: 100, lines: 100 },
    './src/core/database-schema.ts': { statements: 100, branches: 100, functions: 100, lines: 100 },
    './src/core/db-path.ts': { statements: 100, branches: 100, functions: 100, lines: 100 },
    './src/core/contrast.ts': { statements: 97, branches: 77, functions: 100, lines: 97 },
    './src/core/theme.ts': { statements: 100, branches: 100, functions: 100, lines: 100 },
    './src/core/search-utils.ts': { statements: 95, branches: 94, functions: 100, lines: 100 },
    './src/platform/announce.ts': { statements: 100, branches: 100, functions: 100, lines: 100 },
    './app/': {
      statements: 85,
      branches: 62,
      functions: 80,
      lines: 85,
    },
  },
};
