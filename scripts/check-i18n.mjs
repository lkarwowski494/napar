// ============================================================================
// Apps4Brew Studio — i18n Verification Gate (check-i18n.mjs)
// Symetria kluczy PL/EN, niepuste wartości i parametry w src/core/i18n.tsx;
// zestaw języków w app.json = słowniki ładowane przez aplikację; teksty Info.plist w każdym języku
// (M1-audytor-generalny-032, DEC-03 a: PL i EN do czasu prawdziwych tłumaczeń)
// ============================================================================

import { fileURLToPath } from 'node:url';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import babel from '@babel/core';

const require = createRequire(import.meta.url);

const root = fileURLToPath(new URL('..', import.meta.url));
const i18nPath = join(root, 'src/core/i18n.tsx');

const code = readFileSync(i18nPath, 'utf8');

const transformed = babel.transformSync(code, {
  filename: 'i18n.tsx',
  presets: ['babel-preset-expo'],
}).code;

const context = {
  exports: {},
  module: { exports: {} },
  require,
};
vm.createContext(context);
vm.runInContext(transformed, context);

const tr = context.exports.translations || context.module.exports.translations;
if (!tr || !tr.pl || !tr.en) {
  console.error('Error: translations.pl or translations.en not found in i18n.tsx');
  process.exit(1);
}

let totalKeys = 0;
const missingInEn = [];
const missingInPl = [];
const emptyValues = [];
const badParams = [];

const extractParams = (str) =>
  [...String(str).matchAll(/\{(\w+)\}/g)]
    .map((m) => m[1])
    .sort()
    .join(',');

function checkSymmetry(plObj, enObj, prefix = '') {
  const plKeys = Object.keys(plObj);
  const enKeys = Object.keys(enObj);

  for (const k of plKeys) {
    const fullPath = prefix ? `${prefix}.${k}` : k;
    if (!(k in enObj)) {
      missingInEn.push(fullPath);
      continue;
    }

    const plVal = plObj[k];
    const enVal = enObj[k];

    if (typeof plVal === 'object' && plVal !== null) {
      if (typeof enVal !== 'object' || enVal === null) {
        missingInEn.push(`${fullPath} (type mismatch: object vs ${typeof enVal})`);
      } else {
        checkSymmetry(plVal, enVal, fullPath);
      }
    } else {
      totalKeys++;
      if (typeof plVal === 'string' && plVal.trim() === '') {
        emptyValues.push(`PL: ${fullPath}`);
      }
      if (typeof enVal === 'string' && enVal.trim() === '') {
        emptyValues.push(`EN: ${fullPath}`);
      }

      const plParams = extractParams(plVal);
      const enParams = extractParams(enVal);
      if (plParams !== enParams) {
        badParams.push(`${fullPath} (PL: {${plParams}} vs EN: {${enParams}})`);
      }
    }
  }

  for (const k of enKeys) {
    const fullPath = prefix ? `${prefix}.${k}` : k;
    if (!(k in plObj)) {
      missingInPl.push(fullPath);
    }
  }
}

// 1. Weryfikacja symetrii PL/EN w kodzie i18n.tsx
checkSymmetry(tr.pl, tr.en);
console.log(`[i18n] Zweryfikowano ${totalKeys} kluczy w słownikach PL i EN.`);

// 2. Zestaw języków (M1-audytor-generalny-032, DEC-03 a): system i sklep dostają tylko języki,
//    których słowniki aplikacja ładuje (klucze `translations`). Dlaczego: deklaracja języka bez
//    słownika dawała interfejs po angielsku przy wyborze np. „Deutsch” w Ustawieniach iOS.
const localeErrors = [];
const loaded = Object.keys(tr).sort();
const appJson = JSON.parse(readFileSync(join(root, 'app.json'), 'utf8')).expo;
const sameSet = (label, list) => {
  const got = Array.isArray(list) ? [...list].sort() : null;
  if (!got || got.join(',') !== loaded.join(',')) {
    localeErrors.push(`${label} = [${got ?? 'brak'}], a aplikacja ładuje słowniki [${loaded}]`);
  }
};
const locPlugin = (appJson.plugins || []).find((p) => Array.isArray(p) && p[0] === 'expo-localization');
const declared = locPlugin?.[1]?.supportedLocales;
const perPlatform = Array.isArray(declared) ? { ios: declared, android: declared } : declared || {};
sameSet('app.json expo-localization supportedLocales.ios', perPlatform.ios);
sameSet('app.json expo-localization supportedLocales.android', perPlatform.android);
sameSet('app.json ios.infoPlist.CFBundleLocalizations', appJson.ios?.infoPlist?.CFBundleLocalizations);
sameSet('app.json locales', appJson.locales ? Object.keys(appJson.locales) : null);

// 3. Teksty systemowe (Info.plist) w każdym języku: nazwa pod ikoną i każdy NS…UsageDescription
//    z bazowego infoPlist (10-wydanie-016). Dlaczego: prośba o aparat po angielsku w interfejsie PL.
const baseInfo = appJson.ios?.infoPlist || {};
const requiredNative = ['CFBundleDisplayName', ...Object.keys(baseInfo).filter((k) => /^NS\w+UsageDescription$/.test(k))];
let verifiedLocalesCount = 0;
for (const [loc, rel] of Object.entries(appJson.locales || {})) {
  const file = join(root, rel);
  if (!existsSync(file)) {
    localeErrors.push(`[${loc}] brak pliku ${rel}`);
    continue;
  }
  const ios = JSON.parse(readFileSync(file, 'utf8')).ios || {};
  for (const k of requiredNative) {
    if (typeof ios[k] !== 'string' || ios[k].trim() === '') localeErrors.push(`[${loc}] ${rel}: brak ios.${k}`);
  }
  if (ios.CFBundleDisplayName !== baseInfo.CFBundleDisplayName) {
    localeErrors.push(`[${loc}] ${rel}: CFBundleDisplayName „${ios.CFBundleDisplayName}” ≠ „${baseInfo.CFBundleDisplayName}”`);
  }
  verifiedLocalesCount++;
}
// Tekst systemowy języka innego niż angielski nie może być kopią angielskiego (sklonowany słownik).
const nativeOf = (loc) => appJson.locales?.[loc] && existsSync(join(root, appJson.locales[loc]))
  ? JSON.parse(readFileSync(join(root, appJson.locales[loc]), 'utf8')).ios || {}
  : {};
for (const loc of Object.keys(appJson.locales || {}).filter((l) => l !== 'en')) {
  for (const k of requiredNative.filter((x) => x !== 'CFBundleDisplayName')) {
    if (nativeOf(loc)[k] && nativeOf(loc)[k] === nativeOf('en')[k]) localeErrors.push(`[${loc}] ios.${k} jest kopią tekstu EN`);
  }
}

console.log(`[i18n] Zestaw języków [${loaded}] porównany z app.json; teksty systemowe przeczytane z ${verifiedLocalesCount} plikach locales.`);

if (missingInEn.length > 0) {
  console.error(`[i18n] Brakujące klucze w słowniku EN (${missingInEn.length}):`);
  missingInEn.forEach((k) => console.error(`  - ${k}`));
}

if (missingInPl.length > 0) {
  console.error(`[i18n] Brakujące klucze w słowniku PL (${missingInPl.length}):`);
  missingInPl.forEach((k) => console.error(`  - ${k}`));
}

if (emptyValues.length > 0) {
  console.error(`[i18n] Puste wartości tłumaczeń (${emptyValues.length}):`);
  emptyValues.forEach((k) => console.error(`  - ${k}`));
}

if (badParams.length > 0) {
  console.error(`[i18n] Niezgodne parametry {placeholder} (${badParams.length}):`);
  badParams.forEach((k) => console.error(`  - ${k}`));
}

if (localeErrors.length > 0) {
  console.error(`[i18n] Błędy zestawu języków i tekstów systemowych (${localeErrors.length}):`);
  localeErrors.slice(0, 20).forEach((err) => console.error(`  - ${err}`));
  if (localeErrors.length > 20) {
    console.error(`  ...oraz ${localeErrors.length - 20} dalszych błędów.`);
  }
}

const hasErrors =
  missingInEn.length > 0 ||
  missingInPl.length > 0 ||
  emptyValues.length > 0 ||
  badParams.length > 0 ||
  localeErrors.length > 0;

if (hasErrors) {
  console.error('[i18n] Weryfikacja symetrii nie powiodła się.');
  process.exit(1);
} else {
  console.log(`[i18n] Symetria PL/EN i zestaw języków [${loaded}] bez błędów.`);
  process.exit(0);
}
