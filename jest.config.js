module.exports = {
  preset: 'jest-expo/ios',
  setupFiles: ['./jest.setup.js'],
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
      statements: 94,
      branches: 80,
      functions: 94,
      lines: 94,
    },
    './src/core/': {
      statements: 98,
      branches: 90,
      functions: 98,
      lines: 98,
    },
    './app/': {
      statements: 90,
      branches: 70,
      functions: 90,
      lines: 90,
    },
  },
};
