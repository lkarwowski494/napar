// check:corpus — bramka wyroczni dziedzinowych (M1-audytor-generalny-044; 07-jakosc-010).
// Generatory w Pythonie działają w trybie --check: liczą wektory ze źródeł (BRD, rejestr.json), sprawdzają cytaty
// i porównują wynik z plikami w tests/fixtures. Bramka NIE zapisuje plików śledzonych; ręczna zmiana wartości
// w fixture albo nieaktualny plik daje kod 1. Regeneracja świadomie: npm run gen:corpus.
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('..', import.meta.url));
const write = process.argv.includes('--write');
const [py, ...pyArgs] = process.platform === 'win32' ? ['python'] : ['python3', '-I'];

const scripts = ['scripts/gen-coffee-corpus.py', 'scripts/gen-theme-contrast-corpus.py'];
const fixtures = ['tests/fixtures/coffee-corpus.json', 'tests/fixtures/theme-contrast-corpus.json'];
const hash = () => fixtures.map((f) => (existsSync(join(root, f)) ? createHash('sha256').update(readFileSync(join(root, f))).digest('hex') : '-')).join();

const before = hash();
let failed = false;
console.log(`[check:corpus] Wyrocznie ze źródeł, tryb ${write ? '--write' : '--check'}`);
for (const script of scripts) {
  try {
    const out = execFileSync(py, [...pyArgs, script, write ? '--write' : '--check'], { cwd: root, encoding: 'utf-8' });
    console.log(`  ✓ ${out.trim()}`);
  } catch (err) {
    console.error(`  ✗ ${script}:\n${String(err.stdout ?? '').trim() || err.message}`);
    failed = true;
  }
}
if (!write && hash() !== before) {
  console.error('  ✗ Bramka zmieniła pliki w tests/fixtures — tryb --check nie może zapisywać (JAK-17)');
  failed = true;
}
if (failed) process.exit(1);

// Znane rozjazdy kod ↔ źródło: wektor z polem "znany_rozjazd": "<ID znaleziska>" (test Jest sprawdza, że rozjazd trwa).
const known = fixtures.flatMap((f) => {
  const c = JSON.parse(readFileSync(join(root, f), 'utf-8'));
  return Object.values(c).filter(Array.isArray).flat().filter((v) => v.znany_rozjazd).map((v) => `${v.id} → ${v.znany_rozjazd}`);
});
console.log(`[check:corpus] OK. Znane rozjazdy kodu ze źródłem: ${known.length ? known.join(', ') : 'brak'}`);
