// Bramka CLAUDE.md §2.1: pliki w src/core/ nie importują react, react-native ani expo-*.
// Istniejące naruszenia są w scripts/core-imports-allowlist.json (dług techniczny). Wpis znika z listy,
// gdy plik przestaje naruszać regułę; nowe naruszenie w pliku spoza listy kończy się błędem.
// Użycie: node scripts/check-core-imports.mjs
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const CORE = join(ROOT, 'src', 'core');
const ALLOWLIST = join(ROOT, 'scripts', 'core-imports-allowlist.json');
const FORBIDDEN = /^(react|react-native|expo(-[a-z0-9-]+)?)$/;
const IMPORT_RE = /(?:from\s+|import\s*\(\s*|require\s*\(\s*)['"]([^'"]+)['"]/g;

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      if (name !== '__tests__') walk(full, out);
    } else if (/\.(ts|tsx)$/.test(name) && !/\.(test|spec)\.(ts|tsx)$/.test(name)) {
      out.push(full);
    }
  }
  return out;
}

export function forbiddenImports(source) {
  const found = new Set();
  for (const m of source.matchAll(IMPORT_RE)) {
    if (FORBIDDEN.test(m[1])) found.add(m[1]);
  }
  return [...found].sort();
}

function main() {
  const allow = new Set(JSON.parse(readFileSync(ALLOWLIST, 'utf8')).files);
  const violating = new Map();
  for (const file of walk(CORE)) {
    const rel = relative(ROOT, file).split(sep).join('/');
    const bad = forbiddenImports(readFileSync(file, 'utf8'));
    if (bad.length) violating.set(rel, bad);
  }

  const errors = [];
  for (const [rel, bad] of violating) {
    if (!allow.has(rel)) errors.push(`nowe naruszenie: ${rel} importuje ${bad.join(', ')}`);
  }
  for (const rel of allow) {
    if (!violating.has(rel)) errors.push(`wpis do usunięcia z allowlisty (plik już nie narusza): ${rel}`);
  }

  if (errors.length) {
    console.error(errors.map((e) => `✗ ${e}`).join('\n'));
    process.exit(1);
  }
  console.log(`✓ src/core: ${violating.size} plików z długiem technicznym (allowlista), brak nowych naruszeń.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
