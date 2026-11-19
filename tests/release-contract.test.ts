// ============================================================================
// Kontrakt wydania — M1-audytor-generalny-014 (10-wydanie-015, 10-wydanie-013)
// 1) skan sekretów jest wymuszony: brak binarki gitleaks to błąd, a CI uruchamia gitleaks w przypiętej wersji;
// 2) numer buildu ma jedno źródło bazy (app.json), z którego czyta TestFlight.
// ============================================================================
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';

const root = path.join(__dirname, '..');
const read = (p: string) => fs.readFileSync(path.join(root, p), 'utf8');

test('gitleaks-range.sh kończy się błędem, gdy w środowisku nie ma gitleaks (bez cichego pominięcia)', () => {
  const r = spawnSync('bash', [path.join(root, '.github/scripts/gitleaks-range.sh'), 'HEAD', 'HEAD'], {
    cwd: root,
    env: { PATH: '/usr/bin:/bin', HOME: process.env.HOME ?? '/tmp' },
    encoding: 'utf8',
  });
  expect(r.status).not.toBe(0);
});

test('ci.yml ma zadanie skanu sekretów z gitleaks w przypiętej wersji', () => {
  const ci = read('.github/workflows/ci.yml');
  expect(ci).toMatch(/GITLEAKS_VERSION:\s*'?\d+\.\d+\.\d+'?/);
  expect(ci).toMatch(/gitleaks-range\.sh/);
});

test('baza numeru buildu ma jedno źródło: app.json (iOS = Android), TestFlight ją odczytuje', () => {
  const app = JSON.parse(read('app.json')).expo;
  expect(String(app.android.versionCode)).toBe(app.ios.buildNumber);
  const tf = read('.github/workflows/testflight.yml');
  expect(tf).not.toMatch(/BUILD_BASE:\s*'\d+'/);
  expect(tf).toMatch(/ios\.buildNumber/);
});

// M1-audytor-generalny-045 (12-niezawodnosc-008): stos JS z raportu awarii da się zmapować tylko
// mapą źródeł Hermesa z tego samego buildu — archiwizujemy ją razem z dSYM jako artefakt (bez wysyłki).
describe('testflight.yml archiwizuje mapę źródeł JS i dSYM z buildem', () => {
  const tf = read('.github/workflows/testflight.yml');

  test('krok Archive ustawia SOURCEMAP_FILE (react-native-xcode.sh składa mapę Hermesa)', () => {
    const archive = tf.slice(tf.indexOf('- name: Archive (Release'), tf.indexOf('- name: Prepare App Store Connect'));
    expect(archive).toMatch(/SOURCEMAP_FILE:\s*\$\{\{\s*runner\.temp\s*\}\}\/sourcemaps\/main\.jsbundle\.map/);
    expect(archive).toMatch(/mkdir -p "\$\(dirname "\$SOURCEMAP_FILE"\)"/);
  });

  test('artefakt actions/upload-artifact zawiera main.jsbundle.map i katalog dSYMs archiwum', () => {
    const start = tf.indexOf('- name: Archive Hermes sourcemaps and dSYM symbols');
    expect(start).toBeGreaterThan(-1);
    const step = tf.slice(start, tf.indexOf('- name:', start + 10));
    expect(step).toMatch(/uses: actions\/upload-artifact@v4/);
    expect(step).toMatch(/runner\.temp \}\}\/sourcemaps\/main\.jsbundle\.map/);
    expect(step).toMatch(/\.xcarchive\/dSYMs/);
    expect(step).toMatch(/retention-days: \d+/);
  });

  test('bez wysyłki map do usług zewnętrznych (zero telemetrii)', () => {
    expect(tf).not.toMatch(/sentry|bugsnag|crashlytics|datadog/i);
  });
});

// JAK-19 (D-060, C2 P1-2): e2e-ios.yml zapisuje wykonane.tsv jako artefakt, a testflight.yml
// egzekwuje pełną bramkę --build "$BUILD" --wykonane wykonane.tsv (nie tylko --statycznie).
describe('kontrakt bramki scenariuszy D-060: e2e-wykonane i pełny tryb w testflight.yml', () => {
  const e2e = read('.github/workflows/e2e-ios.yml');
  const tf = read('.github/workflows/testflight.yml');

  test('e2e-ios.yml zapisuje wykonane.tsv (GITHUB_SHA + PASS/FAIL) i wysyła artefakt e2e-wykonane', () => {
    expect(e2e).toMatch(/wykonane\.tsv/);
    expect(e2e).toMatch(/\$GITHUB_SHA/);
    expect(e2e).toMatch(/\\tPASS/);
    expect(e2e).toMatch(/\\tFAIL/);
    expect(e2e).toMatch(/uses: actions\/upload-artifact@v4[\s\S]{0,160}name:\s*e2e-wykonane/);
  });

  test('testflight.yml pobiera artefakt e2e-wykonane z zielonego e2e-ios.yml i uruchamia --build "$BUILD" --wykonane wykonane.tsv (D2-P2: bez zbędnego git fetch --tags)', () => {
    const gate = tf.slice(tf.indexOf('  gate:'), tf.indexOf('  build:'));
    expect(gate).toMatch(/fetch-depth:\s*0/);
    expect(gate).not.toMatch(/git fetch --tags/);
    expect(gate).toMatch(/gh run list[^\n]*--workflow e2e-ios\.yml[^\n]*--status success/);
    expect(gate).toMatch(/gh run download[^\n]*-n e2e-wykonane/);
    expect(gate).toMatch(/node scripts\/sprawdz-scenariusze\.mjs --build "\$BUILD" --wykonane wykonane\.tsv/);
    expect(gate).not.toMatch(/node scripts\/sprawdz-scenariusze\.mjs --statycznie/);
  });
});

