// jest.mutation.config.js — Dedykowana konfiguracja Jest dla Stryker Mutation Testing (BR-TEST-032)
// Wybiera wyłącznie szybkie testy domenowe w lekkim środowisku node (bez narzutu jest-expo/ios)
module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest',
  },
  setupFiles: ['./jest.mutation.setup.js'],
  setupFilesAfterEnv: ['./tests/jest-after-env.js'],
  testMatch: [
    '<rootDir>/src/core/__tests__/unit-converter.test.ts',
    '<rootDir>/src/core/__tests__/water-chemistry.test.ts',
    '<rootDir>/src/core/__tests__/domain-rules.test.ts',
    '<rootDir>/src/core/__tests__/timer-engine.test.ts',
    '<rootDir>/tests/domain-properties.test.ts',
    '<rootDir>/tests/oracle-coffee.test.ts',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    'perf-budget.test.ts',
  ],
};
