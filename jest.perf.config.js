// Budżety czasu CPU (informacyjnie, poza bramką) — M1-audytor-generalny-011 (07-jakosc-003).
// Wynik nie blokuje scalenia; czas zegarowy na współdzielonym runnerze nie jest stabilną asercją.
const base = require('./jest.config.js');

module.exports = {
  ...base,
  testPathIgnorePatterns: ['/node_modules/'],
  testMatch: ['**/__tests__/perf-budget.test.ts'],
  collectCoverage: false,
  coverageThreshold: undefined,
};
