// ============================================================================
// Napar — Partia D4: Testy regresyjne (CI security, skrypty weryfikujące,
// izolacja --randomize, Maestro, check-reachability metod klas)
// ============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = path.join(__dirname, '..');
const read = (rel: string) => fs.readFileSync(path.join(root, rel), 'utf8');

describe('D4: Bezpieczeństwo CI i workflowów GitHub Actions', () => {
  test('gitleaks-range.sh używa --redact=100 (bez -v) i obsługuje commit korzeniowy / pusty zakres', () => {
    const script = read('.github/scripts/gitleaks-range.sh');
    expect(script).toContain('--redact=100');
    expect(script).not.toMatch(/\sgitleaks\s+detect[^\n]*\s-v(?:\s|$)/);
    expect(script).toContain('0000000000000000000000000000000000000000');
    expect(script).toMatch(/rev-parse --verify.*\^/);
  });

  test('ci.yml weryfikuje SHA-256 archiwum gitleaks, a e2e-ios.yml przypina Maestro CLI + SHA-256 bez curl|bash', () => {
    const ci = read('.github/workflows/ci.yml');
    expect(ci).toMatch(/GITLEAKS_SHA256:\s*'[0-9a-f]{64}'/);
    expect(ci).toContain('sha256sum -c -');

    const e2e = read('.github/workflows/e2e-ios.yml');
    expect(e2e).toMatch(/MAESTRO_RELEASE_TAG:\s*'cli-\d+\.\d+\.\d+'/);
    expect(e2e).toMatch(/MAESTRO_ZIP_SHA256:\s*'[0-9a-f]{64}'/);
    expect(e2e).toContain('shasum -a 256 -c -');
    expect(e2e).not.toContain('get.maestro.mobile.dev');
  });

  test('nightly.yml, tests-tz.yml i ios-unsigned.yml spełniają kontrakt spójności i izolacji', () => {
    const nightly = read('.github/workflows/nightly.yml');
    expect(nightly).toContain('npm run check:reachability');
    expect(nightly).toContain('npm run check:scenariusze');
    expect(nightly).toContain('npm run check:tresci');

    const tz = read('.github/workflows/tests-tz.yml');
    expect(tz).toContain('ubuntu-24.04');
    expect(tz).toContain('src/core/__tests__/unit-converter.test.ts');

    const unsigned = read('.github/workflows/ios-unsigned.yml');
    expect(unsigned).toMatch(/^concurrency:/m);
    expect(unsigned).toContain('persist-credentials: false');
  });
});

describe('D4: Skrypty weryfikujące (kontrole-tresci, licenses, verify-native, test-matrix, check-reachability)', () => {
  test('kontrole-tresci.mjs kończy się błędem przy 0 przeskanowanych plików bez --tylko-rejestr', () => {
    const failRun = spawnSync(
      process.execPath,
      [path.join(root, 'scripts', 'kontrole-tresci.mjs'), 'rejestr.json', 'rejestr.json'],
      { cwd: root, encoding: 'utf8' }
    );
    expect(failRun.status).toBe(1);
    expect(failRun.stdout).toContain('brak plików tekstowych');

    const okRun = spawnSync(
      process.execPath,
      [path.join(root, 'scripts', 'kontrole-tresci.mjs'), 'rejestr.json', '--tylko-rejestr'],
      { cwd: root, encoding: 'utf8' }
    );
    expect(okRun.status).toBe(0);
  });

  test('scripts/licenses.mjs poprawnie ocenia wyrażenia SPDX (OR / AND / nawiasy) i nie ma fałszywego fallbacku MIT', () => {
    const src = read('scripts/licenses.mjs');
    expect(src).not.toContain("lic || 'MIT'");
    expect(src).toContain('package-lock.json');

    const evalRun = spawnSync(
      process.execPath,
      [
        '--input-type=module',
        '-e',
        `import { evaluateSpdxExpression } from './scripts/licenses.mjs';
         const cases = [
           ['MIT', true],
           ['(MIT OR CC0-1.0)', true],
           ['(BSD-3-Clause OR GPL-2.0)', true],
           ['MIT AND Apache-2.0', true],
           ['GPL-3.0', false],
           ['(GPL-3.0 OR LGPL-2.1)', false],
           ['MIT AND GPL-3.0', false],
           ['UNLICENSED', false],
           ['', false],
           ['CUSTOM-PROPRIETARY', false],
         ];
         console.log(JSON.stringify(cases.map(([e, want]) => ({ e, got: evaluateSpdxExpression(e).allowed, want }))));`,
      ],
      { cwd: root, encoding: 'utf8' }
    );
    expect(evalRun.status).toBe(0);
    const results = JSON.parse(evalRun.stdout) as Array<{ e: string; got: boolean; want: boolean }>;
    for (const r of results) {
      expect([r.e, r.got]).toEqual([r.e, r.want]);
    }
  });

  test('verify-native.mjs nie ma tautologii UIRequiresFullScreen i wymaga pełnej listy skryptów audytowych', () => {
    const src = read('scripts/verify-native.mjs');
    expect(src).not.toMatch(/UIRequiresFullScreen[\s\S]{0,80}appJson\.ios\?\.requireFullScreen/);
    expect(src).toContain("'check:reachability'");
    expect(src).toContain("'check:scenariusze'");
    expect(src).toContain("'check:tresci'");
  });

  test('test-matrix.mjs nie akceptuje uszkodzonego matrix-exceptions.json i pilnuje dryfu dokumentu w --check', () => {
    const src = read('scripts/test-matrix.mjs');
    expect(src).not.toContain('code.includes(prefix)');
    expect(src).not.toContain('catch {}');
    expect(src).toContain('docDrift');
  });

  test('check-reachability.mjs rejestruje metody klas (statyczne i instancyjne)', () => {
    const src = read('scripts/check-reachability.mjs');
    expect(src).toContain('ts.isMethodDeclaration');
    expect(src).toContain('metoda statyczna');
  });

  test('przechwytywanie console.error (BR-TEST-017) nie jest duplikowane ani zasłaniane w jest.setup.js', () => {
    const setup = read('jest.setup.js');
    const afterEnv = read('tests/jest-after-env.js');
    expect(setup).not.toContain('[STRICT CONSOLE.ERROR]');
    expect(afterEnv).toContain('[BR-TEST-017]');
    expect(afterEnv).toContain('[BR-TEST-018]');
  });
});
