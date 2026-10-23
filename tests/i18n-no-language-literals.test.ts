// ============================================================================
// Napar (Steepwise) — Skaner wyborów języka w widokach (CLAUDE.md §2.3, NFR-I18N-001)
// W app/ i src/components/ nie wolno wybierać tekstu przez porównanie języka
// (`language === 'pl' ? ... : ...`, `lang === 'en'`, `isEn`). Teksty idą przez
// `t` z locales/*.json (wszystkie 35 języków), dane dwujęzyczne przez pickBilingual.
// Wyjątki tylko z listy LANGUAGE_LITERAL_EXCEPTIONS, z uzasadnieniem.
// ============================================================================

import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(__dirname, '..');
const SCANNED_ROOTS = ['app', path.join('src', 'components')];

/**
 * Wyjątki od reguły. Każdy wpis wskazuje plik, linię i uzasadnienie.
 * Wpis, który nie pasuje do żadnego naruszenia, także failuje test.
 */
export const LANGUAGE_LITERAL_EXCEPTIONS: ReadonlyArray<{
  file: string; // ścieżka względem katalogu głównego repo
  line: number;
  reason: string;
}> = [];

const LANGUAGE_LITERAL_PATTERNS: ReadonlyArray<RegExp> = [
  /(?:===|!==)\s*['"](?:pl|en)['"]/,
  /\b(?:language|lang)\s*(?:===|!==)/,
  /\bisEn\b/,
];

export interface LanguageLiteralViolation {
  line: number;
  text: string;
}

/** Zwraca linie źródła, w których pojawia się wybór języka przez porównanie. */
export function findLanguageLiteralViolations(source: string): LanguageLiteralViolation[] {
  const out: LanguageLiteralViolation[] = [];
  source.split('\n').forEach((text, index) => {
    if (LANGUAGE_LITERAL_PATTERNS.some((re) => re.test(text))) {
      out.push({ line: index + 1, text: text.trim() });
    }
  });
  return out;
}

export function listScannedFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '__tests__') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...listScannedFiles(full));
    } else if (/\.(ts|tsx)$/.test(entry.name) && !/\.test\.(ts|tsx)$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

function collectViolations(): Array<{ file: string } & LanguageLiteralViolation> {
  const violations: Array<{ file: string } & LanguageLiteralViolation> = [];
  for (const root of SCANNED_ROOTS) {
    for (const full of listScannedFiles(path.join(ROOT, root))) {
      const rel = path.relative(ROOT, full).split(path.sep).join('/');
      for (const v of findLanguageLiteralViolations(fs.readFileSync(full, 'utf8'))) {
        violations.push({ file: rel, ...v });
      }
    }
  }
  return violations;
}

describe('Skaner wyborów języka w widokach (NFR-I18N-001)', () => {
  test('skaner wykrywa wzorce wyboru języka (sprawdzenie samego skanera)', () => {
    const sample = [
      "const a = language === 'pl' ? 'x' : 'y';",
      'const b = lang === "en" ? 1 : 2;',
      'const c = isEn ? 1 : 2;',
      "if (language !== 'en') {}",
      "const d = t.brewScreen.stepOneTitle;",
    ].join('\n');
    expect(findLanguageLiteralViolations(sample).map((v) => v.line)).toEqual([1, 2, 3, 4]);
  });

  test('w app/ i src/components/ nie ma wyborów tekstu po języku (wszystkie teksty przez t)', () => {
    const violations = collectViolations().filter(
      (v) => !LANGUAGE_LITERAL_EXCEPTIONS.some((e) => e.file === v.file && e.line === v.line)
    );
    expect(violations.map((v) => `${v.file}:${v.line}: ${v.text}`)).toEqual([]);
  });

  test('każdy wpis wyjątku wskazuje rzeczywiste naruszenie (brak martwych wyjątków)', () => {
    const violations = collectViolations();
    const stale = LANGUAGE_LITERAL_EXCEPTIONS.filter(
      (e) => !violations.some((v) => v.file === e.file && v.line === e.line)
    );
    expect(stale).toEqual([]);
  });
});
