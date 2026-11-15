// ============================================================================
// Napar — nazwa aplikacji (M1-audytor-generalny-024; 11-wzrost-007)
// „Steepwise” to nazwa cudzej aplikacji do herbaty w App Store (od 2026-11-05).
// Decyzja nocna M2 (wariant c): bez „Steepwise” w kodzie, tekstach, stronie i metadanych;
// nazwa we wszystkich językach tymczasowo „Napar”. Nazwa ostateczna — decyzja właściciela
// przed rekordem w App Store Connect (11-wzrost-010: „Napar” też jest zajęta w sklepie).
// ============================================================================
import fs from 'fs';
import path from 'path';
import { translations } from '../src/core/i18n';

const root = path.join(__dirname, '..');
const SELF = path.relative(root, __filename);

// Katalogi i pliki, w których nazwa jest widoczna dla użytkownika, recenzenta albo w metadanych.
const SCAN = ['app', 'src', 'lib', 'site', 'locales', 'scripts', 'docs', 'tests', 'app.json', 'package.json', 'README.md'];
// Wyjątki techniczne (identyfikator, którego zmiana zmienia tożsamość aplikacji albo dane użytkownika).
// Dziś pusta: bundle identifier, scheme napar://, pliki bazy i kopii ani klucze app_settings nie zawierają tej nazwy.
const EXCEPTIONS: string[] = [];
const TEXT = /\.(ts|tsx|js|mjs|cjs|json|md|html|css|py|txt|xml|plist|yml|yaml)$/;

function walk(p: string): string[] {
  if (!fs.existsSync(p)) return [];
  const st = fs.statSync(p);
  if (st.isFile()) return TEXT.test(p) ? [p] : [];
  return fs.readdirSync(p, { withFileTypes: true }).flatMap((e) =>
    ['node_modules', 'coverage', '.git'].includes(e.name) ? [] : walk(path.join(p, e.name)),
  );
}

test('nazwa „Steepwise” nie występuje w aplikacji, na stronie ani w metadanych', () => {
  const hits: string[] = [];
  for (const f of SCAN.flatMap((s) => walk(path.join(root, s)))) {
    const rel = path.relative(root, f);
    if (rel === SELF || EXCEPTIONS.includes(rel)) continue;
    fs.readFileSync(f, 'utf8').split('\n').forEach((line, i) => {
      if (/steepwise/i.test(line)) hits.push(`${rel}:${i + 1}`);
    });
  }
  expect(hits).toEqual([]);
});

// M1-audytor-generalny-032 (DEC-03 a): sklonowane słowniki locales/*.json usunięte; nazwa pod ikoną
// w każdym języku pochodzi z plików expo.locales (ios.CFBundleDisplayName), a w interfejsie z `translations`.
test('appName w każdym słowniku i18n i nazwa pod ikoną w każdym pliku expo.locales są zgodne z CFBundleDisplayName', () => {
  const appJson = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8'));
  const display = appJson.expo.ios.infoPlist.CFBundleDisplayName;
  expect(display).toBe('Napar');
  expect(appJson.expo.name).toBe(display);
  const langs = Object.keys(translations).sort();
  expect(langs).toEqual(['en', 'pl']);
  for (const l of langs) expect((translations as Record<string, { appName: string }>)[l].appName).toBe(display);
  expect(Object.keys(appJson.expo.locales).sort()).toEqual(langs);
  const wrong = Object.entries(appJson.expo.locales as Record<string, string>).filter(
    ([, rel]) => JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8')).ios?.CFBundleDisplayName !== display,
  );
  expect(wrong).toEqual([]);
});
