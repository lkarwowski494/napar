// jest.mutation.config.js — Dedykowana konfiguracja Jest dla Stryker Mutation Testing (BR-TEST-032)
// Wybiera wyłącznie szybkie testy domenowe, wyklucza testy RNTL, widokowe i perf-budget
module.exports = {
  preset: 'jest-expo/ios',
  setupFiles: ['./jest.setup.js'],
  setupFilesAfterEnv: ['./tests/jest-after-env.js'],
  testMatch: [
    '<rootDir>/src/core/__tests__/unit-converter.test.ts',
    '<rootDir>/src/core/__tests__/water-chemistry.test.ts',
    '<rootDir>/src/core/__tests__/cost-calculator.test.ts',
    '<rootDir>/src/core/__tests__/domain-rules.test.ts',
    '<rootDir>/src/core/__tests__/timer-engine.test.ts',
    '<rootDir>/tests/domain-properties.test.ts',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    'perf-budget.test.ts',
  ],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|standard-navigation)',
  ],
};
