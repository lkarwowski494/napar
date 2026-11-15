// ============================================================================
// Kontrakt bramki jakości — M1-audytor-generalny-011 (07-jakosc-001, 07-jakosc-003, 07-jakosc-009, 08-programista-006)
// 1) ci.yml i npm run verify uruchamiają ten sam zestaw (pokrycie, check:native, osiągalność, typy);
// 2) w zestawie bramki nie ma asercji czasu wykonania (budżety CPU są osobnym, informacyjnym zadaniem);
// 3) progi pokrycia to zapadka: nie mogą spaść poniżej stanu z 2026-11-14 (07-jakosc-004 (a), zadanie 013).
// ============================================================================
import fs from 'fs';
import path from 'path';

const root = path.join(__dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const ciYml = fs.readFileSync(path.join(root, '.github/workflows/ci.yml'), 'utf8');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const jestConfig = require('../jest.config.js');

test('npm run verify zawiera pokrycie z progami, check:native, osiągalność i typy', () => {
  const verify: string = pkg.scripts.verify;
  for (const step of ['check:i18n', 'check:licenses', 'check:corpus', 'check:matrix', 'check:reachability', 'check:native', 'typecheck', 'test:coverage']) {
    expect([step, verify.includes(`npm run ${step}`)]).toEqual([step, true]);
  }
});

test('blokujące zadanie CI uruchamia dokładnie npm run verify (jedna definicja bramki)', () => {
  const verifyJob = (ciYml.match(/\n {2}verify:\n([\s\S]*?)(?=\n {2}[A-Za-z_-]+:\n|$)/) ?? ['', ''])[1];
  expect(verifyJob).toMatch(/run:\s*npm run verify\b/);
  expect(verifyJob).not.toMatch(/run:\s*npm run test:coverage/);
});

test('zestaw bramki nie zawiera asercji czasu wykonania (cpuUsage / performance.now)', () => {
  const ignored: string[] = jestConfig.testPathIgnorePatterns ?? [];
  const walk = (dir: string): string[] =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) return e.name === 'node_modules' ? [] : walk(p);
      return /\.test\.(ts|tsx)$/.test(e.name) ? [p] : [];
    });
  const timed = ['src', 'tests', 'app']
    .map((d) => path.join(root, d))
    .filter(fs.existsSync)
    .flatMap(walk)
    .filter((f) => f !== __filename)
    .filter((f) => !ignored.some((pattern) => new RegExp(pattern).test(f)))
    .filter((f) => /process\.cpuUsage|performance\.now/.test(fs.readFileSync(f, 'utf8')))
    .map((f) => path.relative(root, f));
  expect(timed).toEqual([]);
});

test('progi pokrycia nie spadają poniżej zapadki z 2026-11-14', () => {
  const ratchet: Record<string, Partial<Record<'statements' | 'branches' | 'functions' | 'lines', number>>> = {
    global: { statements: 85, branches: 75, functions: 88, lines: 85 },
    // Bez budżetów czasu (poza bramką) pokrycie src/core to 93,38% / 94,91% — testy czasu wykonywały kod bez testów funkcjonalnych.
    './src/core/': { statements: 93, branches: 87, functions: 98, lines: 94 },
    // M1-audytor-generalny-045: warstwy wydzielone z src/core (2026-11-15) — ten sam próg co src/core.
    './src/platform/': { statements: 93, branches: 85, functions: 95, lines: 94 },
    './src/platform/announce.ts': { statements: 100, branches: 100, functions: 100, lines: 100 },
    './src/data/': { statements: 93, branches: 85, functions: 95, lines: 94 },
    './src/hooks/useJournalAnalytics.ts': { statements: 100, branches: 94, functions: 100, lines: 100 },
    './src/hooks/useBrewWorkflow.ts': { statements: 89, branches: 63, functions: 92, lines: 90 },
    './src/core/water-chemistry.ts': { statements: 91, branches: 89, functions: 100, lines: 100 },
    './src/core/cost-calculator.ts': { statements: 96, branches: 98, functions: 100, lines: 100 },
    './src/core/contrast.ts': { statements: 97, branches: 77, functions: 100, lines: 97 },
    './src/core/search-utils.ts': { statements: 95, branches: 94, functions: 100, lines: 100 },
    './app/': { statements: 85, branches: 62, functions: 80, lines: 85 },
  };
  const t = jestConfig.coverageThreshold;
  for (const [file, metrics] of Object.entries(ratchet)) {
    for (const [metric, min] of Object.entries(metrics)) {
      expect([file, metric, t[file]?.[metric] >= (min as number)]).toEqual([file, metric, true]);
    }
  }
});
