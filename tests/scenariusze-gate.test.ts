// ============================================================================
// Testy bramki scenariuszy użytkownika (D-060, zasada wspólna 22, JAK-19)
// Weryfikują działanie scripts/sprawdz-scenariusze.mjs w trybach:
// --statycznie, --szkielet, --protokol oraz --build <n> --wykonane <plik>.
// ============================================================================
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';

const REPO_ROOT = path.resolve(__dirname, '..');
const SCRIPT = path.join(REPO_ROOT, 'scripts', 'sprawdz-scenariusze.mjs');

function runGate(cwd: string, args: string[], env: Record<string, string> = {}) {
  return spawnSync(process.execPath, [SCRIPT, ...args], {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, ...env },
  });
}

function makeFixture(opts?: {
  screens?: string[];
  catalog?: string;
  flows?: Record<string, string>;
  protocols?: Record<string, string>;
  lastBuild?: string;
  initGit?: boolean;
}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'napar-scenariusze-'));
  const screens = opts?.screens ?? ['(tabs)/index', 'settings'];
  for (const s of screens) {
    const file = path.join(dir, 'app', `${s}.tsx`);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, 'export default function Screen() { return null; }\n', 'utf8');
  }
  const flows = opts?.flows ?? {
    '.maestro/01-start.yaml': [
      'appId: pl.lukasz.napar',
      '# PU-001 · ekran:(tabs)/index',
      '---',
      '- launchApp',
      '- assertVisible: "Parzenie"',
    ].join('\n'),
  };
  for (const [rel, body] of Object.entries(flows)) {
    const full = path.join(dir, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, body, 'utf8');
  }
  const catalog =
    opts?.catalog ??
    [
      '# Przypadki użycia — Test',
      'Ekrany: katalog `app`',
      'Przegląd: build 2 @ 1234567 (zmiany 0000001..1234567)',
      '',
      '| ID | Funkcja | Cel użytkownika od początku do końca | Warianty i błędy | Ekrany | Klasa | Test albo kroki | Powrót |',
      '|---|---|---|---|---|---|---|---|',
      '| PU-001 | `parzenie` | Użytkownik uruchamia aplikację i widzi ekran parzenia gotowy do pracy | czysty stan; brak zapisanych sesji | `(tabs)/index` | A | `.maestro/01-start.yaml` | n/d: zakładka główna |',
      '| PU-002 | `ustawienia` | Użytkownik otwiera ustawienia, zmienia język i wraca na poprzedni ekran | przełączenie PL/EN; anulowanie | `settings` | F | Ustawienia -> język -> zamknij; etykiety zmienione | tak |',
      '',
      '## Funkcje',
      '| Funkcja | Opis |',
      '|---|---|',
      '| `parzenie` | Ekran parzenia |',
      '| `ustawienia` | Preferencje |',
      '',
      '## Wyjątki B',
      '| PU | Powód | Termin (build) |',
      '|---|---|---|',
      '',
    ].join('\n');
  const catPath = path.join(dir, 'docs', 'jakosc', 'przypadki-uzycia.md');
  fs.mkdirSync(path.dirname(catPath), { recursive: true });
  fs.writeFileSync(catPath, catalog, 'utf8');

  if (opts?.protocols) {
    const pDir = path.join(dir, 'docs', 'jakosc', 'test-fizyczny');
    fs.mkdirSync(pDir, { recursive: true });
    for (const [name, body] of Object.entries(opts.protocols)) {
      fs.writeFileSync(path.join(pDir, name), body, 'utf8');
    }
  }
  if (opts?.lastBuild !== undefined) {
    const lbPath = path.join(dir, 'docs', 'wydanie', 'ostatni-build.txt');
    fs.mkdirSync(path.dirname(lbPath), { recursive: true });
    fs.writeFileSync(lbPath, opts.lastBuild, 'utf8');
  }
  let headSha = '';
  if (opts?.initGit) {
    execFileSync('git', ['init'], { cwd: dir, stdio: 'ignore' });
    execFileSync('git', ['config', 'user.name', 'Test'], { cwd: dir, stdio: 'ignore' });
    execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: dir, stdio: 'ignore' });
    execFileSync('git', ['add', '.'], { cwd: dir, stdio: 'ignore' });
    execFileSync('git', ['commit', '-m', 'init'], { cwd: dir, stdio: 'ignore' });
    headSha = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: dir, encoding: 'utf8' }).trim();
  }
  return { dir, headSha };
}

describe('JAK-19: bramka scenariuszy użytkownika (scripts/sprawdz-scenariusze.mjs)', () => {
  const tempDirs: string[] = [];
  afterEach(() => {
    while (tempDirs.length) {
      const d = tempDirs.pop();
      if (d && fs.existsSync(d)) fs.rmSync(d, { recursive: true, force: true });
    }
  });

  test('tryb --statycznie przechodzi (kod 0) na kompletnym katalogu', () => {
    const { dir } = makeFixture();
    tempDirs.push(dir);
    const res = runGate(dir, ['--statycznie']);
    expect(res.status).toBe(0);
    expect(res.stdout).toContain('BRAMKA ZIELONA');
  });

  test('tryb --statycznie odrzuca ekran w app/ bez pokrycia PU', () => {
    const { dir } = makeFixture({ screens: ['(tabs)/index', 'settings', 'gongfu'] });
    tempDirs.push(dir);
    const res = runGate(dir, ['--statycznie']);
    expect(res.status).toBe(1);
    expect(res.stderr).toContain('ekran `gongfu` nie ma żadnego PU');
  });

  test('tryb --statycznie odrzuca funkcję w ## Funkcje bez żadnego PU', () => {
    const { dir } = makeFixture({
      catalog: [
        '# Przypadki użycia — Test',
        'Ekrany: katalog `app`',
        'Przegląd: build 1 @ 1234567',
        '',
        '| ID | Funkcja | Cel użytkownika od początku do końca | Warianty i błędy | Ekrany | Klasa | Test albo kroki | Powrót |',
        '|---|---|---|---|---|---|---|---|',
        '| PU-001 | `parzenie` | Użytkownik uruchamia aplikację i widzi ekran parzenia gotowy do pracy | czysty stan; brak sesji | `(tabs)/index` | A | `.maestro/01-start.yaml` | n/d: zakładka główna |',
        '| PU-002 | `ustawienia` | Użytkownik zmienia język w ustawieniach i zamyka ekran | PL/EN; anulowanie | `settings` | F | Ustawienia -> język -> zamknij | tak |',
        '',
        '## Funkcje',
        '| Funkcja | Opis |',
        '|---|---|',
        '| `parzenie` | Ekran parzenia |',
        '| `ustawienia` | Preferencje |',
        '| `niepokryta` | Funkcja bez PU |',
        '',
        '## Wyjątki B',
        '| PU | Powód | Termin (build) |',
        '|---|---|---|',
      ].join('\n'),
    });
    tempDirs.push(dir);
    const res = runGate(dir, ['--statycznie']);
    expect(res.status).toBe(1);
    expect(res.stderr).toContain('funkcja `niepokryta` nie ma żadnego PU');
  });

  test('tryb --statycznie odrzuca scenariusz klasy A bez ID PU, bez ekran:<trasa> lub bez powrotu', () => {
    const { dir } = makeFixture({
      catalog: [
        '# Przypadki użycia — Test',
        'Ekrany: katalog `app`',
        'Przegląd: build 1 @ 1234567',
        '',
        '| ID | Funkcja | Cel użytkownika od początku do końca | Warianty i błędy | Ekrany | Klasa | Test albo kroki | Powrót |',
        '|---|---|---|---|---|---|---|---|',
        '| PU-001 | `parzenie` | Użytkownik otwiera ekran parzenia i wraca z niego | czysty stan; brak sesji | `(tabs)/index` | A | `.maestro/01-start.yaml` | tak |',
        '| PU-002 | `ustawienia` | Użytkownik zmienia język w ustawieniach i zamyka ekran | PL/EN; anulowanie | `settings` | F | Ustawienia -> język -> zamknij | tak |',
        '',
        '## Funkcje',
        '| Funkcja | Opis |',
        '|---|---|',
        '| `parzenie` | Ekran parzenia |',
        '| `ustawienia` | Preferencje |',
        '',
        '## Wyjątki B',
        '| PU | Powód | Termin (build) |',
        '|---|---|---|',
      ].join('\n'),
      flows: {
        '.maestro/01-start.yaml': 'appId: pl.lukasz.napar\n# PU-001\n---\n- launchApp\n',
      },
    });
    tempDirs.push(dir);
    const res = runGate(dir, ['--statycznie']);
    expect(res.status).toBe(1);
    expect(res.stderr).toContain('ekran:(tabs)/index');
    expect(res.stderr).toContain('powrót: (tabs)/index');
  });

  test('--szkielet tworzy protokół F dla buildu i nie nadpisuje istniejącego pliku', () => {
    const { dir } = makeFixture();
    tempDirs.push(dir);
    const first = runGate(dir, ['--szkielet', '2']);
    expect(first.status).toBe(0);
    const protoPath = path.join(dir, 'docs', 'jakosc', 'test-fizyczny', '2.md');
    expect(fs.existsSync(protoPath)).toBe(true);
    const content = fs.readFileSync(protoPath, 'utf8');
    expect(content).toContain('| PU-002 |');
    expect(content).not.toContain('| PU-001 |');

    const second = runGate(dir, ['--szkielet', '2']);
    expect(second.status).toBe(1);
    expect(second.stderr).toContain('już istnieje');
  });

  test('--protokol odrzuca puste i trywialne wyniki F, a akceptuje OK / BŁĄD / uzasadnione POMINIĘTE', () => {
    const { dir } = makeFixture({
      protocols: {
        '1.md': '| PU | Cel | Kroki | Wynik |\n|---|---|---|---|\n| PU-002 | cel | kroki | — |\n',
        '2.md': '| PU | Cel | Kroki | Wynik |\n|---|---|---|---|\n| PU-002 | cel | kroki | POMINIĘTE: aaa |\n',
        '3.md': '| PU | Cel | Kroki | Wynik |\n|---|---|---|---|\n| PU-002 | cel | kroki | OK |\n',
        '4.md': '| PU | Cel | Kroki | Wynik |\n|---|---|---|---|\n| PU-002 | cel | kroki | POMINIĘTE: brak zmian w ustawieniach od buildu 3 |\n',
      },
    });
    tempDirs.push(dir);
    expect(runGate(dir, ['--protokol', '1']).status).toBe(1);
    expect(runGate(dir, ['--protokol', '2']).status).toBe(1);
    expect(runGate(dir, ['--protokol', '3']).status).toBe(0);
    expect(runGate(dir, ['--protokol', '4']).status).toBe(0);
  });

  test('tryb pełny --build <n> --wykonane <plik> weryfikuje zamknięty protokół poprzedniego buildu i wyniki E2E na tym SHA', () => {
    const { dir, headSha } = makeFixture({
      initGit: true,
      lastBuild: '1\n',
      protocols: {
        '1.md': '| PU | Cel | Kroki | Wynik |\n|---|---|---|---|\n| PU-002 | cel | kroki | OK |\n',
        '2.md': '| PU | Cel | Kroki | Wynik |\n|---|---|---|---|\n| PU-002 | cel | kroki | — |\n',
      },
    });
    tempDirs.push(dir);
    const passFile = path.join(dir, 'wykonane-ok.tsv');
    fs.writeFileSync(passFile, `${headSha}\n.maestro/01-start.yaml\tPASS\n`, 'utf8');
    const ok = runGate(dir, ['--build', '2', '--wykonane', passFile], { GITHUB_SHA: headSha });
    expect(ok.status).toBe(0);
    expect(ok.stdout).toContain('BRAMKA ZIELONA');

    const failFile = path.join(dir, 'wykonane-fail.tsv');
    fs.writeFileSync(failFile, `${headSha}\n.maestro/01-start.yaml\tFAIL\n`, 'utf8');
    const failedE2E = runGate(dir, ['--build', '2', '--wykonane', failFile], { GITHUB_SHA: headSha });
    expect(failedE2E.status).toBe(1);
    expect(failedE2E.stderr).toContain('nie przeszedł w przebiegu E2E');

    // Otwarty protokół poprzedniego buildu (1.md z „—”) blokuje build 2
    fs.writeFileSync(
      path.join(dir, 'docs', 'jakosc', 'test-fizyczny', '1.md'),
      '| PU | Cel | Kroki | Wynik |\n|---|---|---|---|\n| PU-002 | cel | kroki | — |\n',
      'utf8'
    );
    const openPrev = runGate(dir, ['--build', '2', '--wykonane', passFile], { GITHUB_SHA: headSha });
    expect(openPrev.status).toBe(1);
    expect(openPrev.stderr).toContain('PU-002 bez wyniku');
  });

  test('bramka projektu przechodzi w trybie --statycznie i jest wpięta w verify oraz testflight.yml', () => {
    const res = runGate(REPO_ROOT, ['--statycznie']);
    expect(res.status).toBe(0);
    expect(res.stdout).toContain('BRAMKA ZIELONA');

    const pkg = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'package.json'), 'utf8'));
    expect(pkg.scripts['check:scenariusze']).toBe('node scripts/sprawdz-scenariusze.mjs --statycznie');
    expect(pkg.scripts.verify).toContain('npm run check:scenariusze');

    const tf = fs.readFileSync(path.join(REPO_ROOT, '.github', 'workflows', 'testflight.yml'), 'utf8');
    expect(tf).toMatch(/node scripts\/sprawdz-scenariusze\.mjs --build "\$BUILD" --wykonane wykonane\.tsv/);
    expect(tf).toMatch(/e2e-wykonane/);
    expect(tf).not.toMatch(/sprawdz-scenariusze\.mjs --statycznie/);
  });
});
