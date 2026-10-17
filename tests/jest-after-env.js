// tests/jest-after-env.js — Twarde oblewanie testu przy ostrzeżeniach act() i console.error (BR-TEST-017, BR-TEST-018)
const { seed } = require('./prop-seed');

const originalError = console.error;

beforeAll(() => {
  if (!process.env.SUPPRESS_SEED_LOG) {
    // eslint-disable-next-line no-console
    console.log(`[prop-seed] PROP_SEED=${seed} (odtwórz: PROP_SEED=${seed} npm test)`);
  }
});

console.error = function (...args) {
  const msg = args.map((a) => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ');

  // Twarde oblewanie testu przy ostrzeżeniach act(...)
  if (
    msg.includes('was not wrapped in act(') ||
    (msg.includes('An update to') && msg.includes('inside a test was not wrapped in act'))
  ) {
    originalError.apply(console, args);
    throw new Error(`[BR-TEST-017] Wykryto brakujące opakowanie w act():\n${msg}`);
  }

  // Twarde oblewanie testu przy nieoczekiwanym console.error (jeśli nie jest szpiegowany)
  originalError.apply(console, args);
  throw new Error(`[BR-TEST-017] Wykryto nieoczekiwany console.error w trakcie testu:\n${msg}`);
};

afterEach(() => {
  jest.clearAllTimers();
});
