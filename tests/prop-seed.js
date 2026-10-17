// tests/prop-seed.js — Deterministyczne ziarno testów własnościowych i losowych (BR-TEST-008)
const raw = process.env.PROP_SEED || process.env.MATRIX_SEED;
const DEFAULT_SEED = 0x5eed1234;

let seed;
if (!raw || raw === 'default') {
  seed = DEFAULT_SEED;
} else if (raw === 'random') {
  seed = Math.floor(Math.random() * 0x7fffffff);
} else {
  const parsed = parseInt(raw, 10);
  seed = Number.isNaN(parsed) ? DEFAULT_SEED : parsed;
}

module.exports = {
  seed,
  getSeed: () => seed,
};
