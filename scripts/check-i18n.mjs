// ============================================================================
// Apps4Brew Studio — i18n Verification Gate (check-i18n.mjs)
// Verifies 100% key symmetry, non-empty values, and param integrity between PL & EN
// ============================================================================

import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
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

checkSymmetry(tr.pl, tr.en);

console.log(`[i18n] Zweryfikowano ${totalKeys} kluczy w słownikach PL i EN.`);

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

const hasErrors =
  missingInEn.length > 0 ||
  missingInPl.length > 0 ||
  emptyValues.length > 0 ||
  badParams.length > 0;

if (hasErrors) {
  console.error('[i18n] Weryfikacja symetrii nie powiodła się.');
  process.exit(1);
} else {
  console.log('[i18n] 100% symetrii językowej PL/EN zachowane bez błędów.');
  process.exit(0);
}
