// ============================================================================
// Napar (Steepwise) — Bramka i18n (check-i18n.mjs)
// Źródło prawdy kluczy: locales/pl.json. Sprawdza wszystkie 35 plików w locales/:
// - dokładnie te 35 plików i zgodność listy z LANGS w src/core/i18n-loader.ts,
// - te same klucze co pl.json (brak = błąd, nadmiarowe = błąd),
// - wartości tekstowe, niepuste,
// - identyczne parametry {nazwa} jak w pl.json,
// - brak fraz o HealthKit / Apple Health i twardych cen w walucie.
// ============================================================================

import { fileURLToPath } from 'node:url';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = fileURLToPath(new URL('..', import.meta.url));
const localesDir = join(root, 'locales');
const loaderPath = join(root, 'src', 'core', 'i18n-loader.ts');
const SOURCE = 'pl';

const EXPECTED_LOCALES = [
  'ar', 'bg', 'ca', 'cs', 'da', 'de', 'el', 'es', 'fi', 'fr', 'he', 'hi', 'hr', 'hu', 'id', 'it',
  'ja', 'ko', 'ms', 'nl', 'no', 'pl', 'pt-BR', 'pt-PT', 'ro', 'ru', 'sk', 'sv', 'th', 'tr', 'uk',
  'vi', 'zh-Hans', 'zh-Hant', 'en',
];

const FORBIDDEN = [
  { re: /apple health|healthkit/i, label: 'fraza o HealthKit / Apple Health' },
  {
    re: /(?:[$€£]|USD|EUR|GBP)\s?\d|\d[\d.,]*\s?(?:[$€£]|USD|EUR|GBP|zł|PLN)/,
    label: 'twarda cena w walucie',
  },
];

const errors = [];

// 1. Zestaw plików i zgodność z LANGS w loaderze
const loaderSource = readFileSync(loaderPath, 'utf8');
const langsMatch = loaderSource.match(/export const LANGS = \[([\s\S]*?)\] as const;/);
if (!langsMatch) {
  errors.push('Nie znaleziono `export const LANGS = [...] as const` w src/core/i18n-loader.ts');
} else {
  const loaderLangs = [...langsMatch[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
  if (new Set(loaderLangs).size !== loaderLangs.length) {
    errors.push('LANGS w src/core/i18n-loader.ts zawiera duplikaty');
  }
  for (const code of EXPECTED_LOCALES) {
    if (!loaderLangs.includes(code)) errors.push(`LANGS nie zawiera języka: ${code}`);
  }
  for (const code of loaderLangs) {
    if (!EXPECTED_LOCALES.includes(code)) errors.push(`LANGS zawiera nieoczekiwany język: ${code}`);
  }
}

const filesOnDisk = readdirSync(localesDir)
  .filter((f) => f.endsWith('.json'))
  .map((f) => f.slice(0, -'.json'.length))
  .sort();
const expectedSorted = [...EXPECTED_LOCALES].sort();
for (const code of expectedSorted) {
  if (!filesOnDisk.includes(code)) errors.push(`Brak pliku słownika: locales/${code}.json`);
}
for (const name of filesOnDisk) {
  if (!EXPECTED_LOCALES.includes(name)) errors.push(`Nadmiarowy plik w locales/: ${name}.json`);
}

// 2. Porównanie kluczy i wartości z pl.json
const flatten = (node, prefix = '', out = new Map()) => {
  for (const [key, value] of Object.entries(node)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      flatten(value, path, out);
    } else {
      out.set(path, value);
    }
  }
  return out;
};

const paramsOf = (value) =>
  typeof value === 'string'
    ? [...value.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',')
    : '';

const loadLocale = (code) => {
  try {
    return JSON.parse(readFileSync(join(localesDir, `${code}.json`), 'utf8'));
  } catch (err) {
    errors.push(`[${code}] Nieczytelny JSON: ${err.message}`);
    return null;
  }
};

const sourceData = loadLocale(SOURCE);
const sourceMap = sourceData ? flatten(sourceData) : new Map();
if (sourceData) {
  for (const [path, value] of sourceMap) {
    if (typeof value !== 'string' || value.trim() === '') {
      errors.push(`[${SOURCE}] Wartość źródłowa musi być niepustym tekstem: ${path}`);
    }
  }
}

let verifiedLocales = 0;
for (const code of EXPECTED_LOCALES) {
  if (!filesOnDisk.includes(code)) continue;
  const data = loadLocale(code);
  if (!data) continue;
  verifiedLocales++;
  const map = flatten(data);

  for (const [path, sourceValue] of sourceMap) {
    if (!map.has(path)) {
      errors.push(`[${code}] Brak klucza: ${path}`);
      continue;
    }
    const value = map.get(path);
    if (typeof value !== 'string') {
      errors.push(`[${code}] Wartość nie jest tekstem: ${path}`);
      continue;
    }
    if (value.trim() === '') {
      errors.push(`[${code}] Pusta wartość: ${path}`);
      continue;
    }
    const wanted = paramsOf(sourceValue);
    const got = paramsOf(value);
    if (wanted !== got) {
      errors.push(`[${code}] Niezgodne parametry dla ${path}: ${SOURCE} {${wanted}} vs {${got}}`);
    }
  }

  for (const path of map.keys()) {
    if (!sourceMap.has(path)) errors.push(`[${code}] Nadmiarowy klucz: ${path}`);
  }

  for (const [path, value] of map) {
    if (typeof value !== 'string') continue;
    for (const rule of FORBIDDEN) {
      if (rule.re.test(value)) errors.push(`[${code}] ${rule.label}: ${path}`);
    }
  }
}

// 3. Raport
const keyCount = sourceMap.size;
console.log(`[i18n] Klucze źródłowe (${SOURCE}.json): ${keyCount}.`);
console.log(`[i18n] Zweryfikowano ${verifiedLocales} z ${EXPECTED_LOCALES.length} słowników względem ${SOURCE}.json.`);

if (errors.length > 0) {
  console.error(`[i18n] Błędy (${errors.length}):`);
  errors.slice(0, 60).forEach((e) => console.error(`  - ${e}`));
  if (errors.length > 60) console.error(`  ...oraz ${errors.length - 60} dalszych błędów.`);
  console.error('[i18n] Weryfikacja nie powiodła się.');
  process.exit(1);
}

console.log(`[i18n] 100% symetrii kluczy i parametrów (${EXPECTED_LOCALES.length} języków) zachowane bez błędów.`);
process.exit(0);
