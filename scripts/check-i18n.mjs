// ============================================================================
// Apps4Brew Studio — i18n Verification Gate (check-i18n.mjs)
// Symetria kluczy PL/EN, niepuste wartości i parametry w src/core/i18n.tsx;
// zestaw języków w app.json = słowniki ładowane przez aplikację; teksty Info.plist w każdym języku
// (M1-audytor-generalny-032, DEC-03 a: PL i EN do czasu prawdziwych tłumaczeń);
// teksty poza słownikiem w widokach + zapadka dwujęzycznych wyborów (M1-audytor-generalny-033)
//
// Użycie: node scripts/check-i18n.mjs [--update-baseline] [--extra <plik>]...
//   --update-baseline  zapisuje bieżące liczby wyborów pl/en do scripts/i18n-baseline.json
//                      (tylko gdy żadna nie wzrosła — zapadka wolno tylko maleć)
//   --extra <plik>     dołącza plik do skanu tekstów (test, że kontrola umie paść)
// ============================================================================

import { fileURLToPath } from 'node:url';
import { readFileSync, existsSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import babel from '@babel/core';

const require = createRequire(import.meta.url);
const argv = process.argv.slice(2);
const updateBaseline = argv.includes('--update-baseline');
const extraFiles = argv.flatMap((a, i) => (a === '--extra' && argv[i + 1] ? [argv[i + 1]] : []));

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

// 4. Teksty poza słownikiem (M1-audytor-generalny-033; 09-lokalizacja-001, -006, 04-studio-projektowe-010,
//    08-programista-009). Dlaczego: przy języku EN ekran parzenia, kofeina, spiżarnia i Gongfu pokazywały
//    polskie teksty wpisane w JSX, a bramka sprawdzała tylko symetrię słowników.
const scan = scanSourceTexts();
const literalErrors = scan.errors;
if (literalErrors.length > 0) {
  console.error(`[i18n] Teksty poza słownikiem (${literalErrors.length}) — przenieś do translations.pl/en w src/core/i18n.tsx`);
  console.error('       albo (nazwa własna, jednostka) dopisz do scripts/i18n-exceptions.json z powodem:');
  literalErrors.forEach((e) => console.error(`  - ${e}`));
}
const baselineErrors = scan.ratchet.errors;
if (baselineErrors.length > 0) {
  console.error(`[i18n] Zapadka dwujęzycznych wyborów pl/en i polskich zapasów (scripts/i18n-baseline.json) — liczba wzrosła (${baselineErrors.length}):`);
  baselineErrors.forEach((e) => console.error(`  - ${e}`));
  console.error('       Nowy tekst dodaj jako klucz słownika, nie jako `isEn ? … : …` ani `t.x || \'…\'`.');
}
if (scan.ratchet.lower.length > 0 && !updateBaseline) {
  console.log(`[i18n] Liczba wyborów pl/en spadła w ${scan.ratchet.lower.length} plikach — zapisz: npm run check:i18n -- --update-baseline`);
}
console.log(`[i18n] Skan tekstów: ${scan.fileCount} plików, wybory pl/en i zapasy razem ${scan.ratchet.total} (lista bazowa ${scan.ratchet.baselineTotal}).`);

const hasErrors =
  literalErrors.length > 0 ||
  baselineErrors.length > 0 ||
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

// ============================================================================
// Skan tekstów (M1-audytor-generalny-033)
// Zakres: app/, src/components/, lib/ i pliki .tsx w src/core/ (bez __tests__ i słownika i18n.tsx).
// (a) BŁĄD: literał z polskimi znakami (JSX, accessibilityLabel/Hint, Alert, Share, stałe w widoku);
//     BŁĄD: tekst w JSX (dziecko elementu, accessibilityLabel/Hint, placeholder, title, label)
//     oraz argument Alert.alert / Share.share z literami poza wyjątkami (nazwy własne, jednostki).
// (b) Zapadka: istniejące dwujęzyczne wybory (`isEn ? 'A' : 'B'`, `language === 'en' ? …`),
//     polskie zapasy `t.x || '…'` i dane z kluczem *Pl liczone per plik; liczba nie może wzrosnąć.
// Komentarze nie są tekstem: parser AST ich nie widzi (powód zapisany w pliku wyjątków).
// ============================================================================
function scanSourceTexts() {
  const PL_CHARS = /[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/;
  const LETTER = /\p{L}/u;
  const LANG_TEST = /\b(isEn|isPl|isEnglish|isPolish|language|lang|cleanLang|locale)\b/;
  const TEXT_ATTRS = new Set(['accessibilityLabel', 'accessibilityHint', 'placeholder', 'title', 'label']);
  const rel = (f) => f.slice(root.length).replace(/\\/g, '/').replace(/^\//, '');
  const exceptionsPath = join(root, 'scripts/i18n-exceptions.json');
  const baselinePath = join(root, 'scripts/i18n-baseline.json');
  const exc = JSON.parse(readFileSync(exceptionsPath, 'utf8'));
  const skipFiles = new Set((exc.pliki || []).map((x) => x.plik));
  const exactTexts = new Map((exc.teksty || []).map((x) => [`${x.plik}\u0000${x.tekst}`, x]));
  const usedTexts = new Set();
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const tokens = [...(exc.tokeny || [])].map((x) => x.token).sort((a, b) => b.length - a.length);
  const tokenRe = tokens.length
    ? new RegExp(`(?<![\\p{L}\\p{N}])(?:${tokens.map(esc).join('|')})(?![\\p{L}\\p{N}])`, 'gu')
    : null;
  const stripTokens = (s) => (tokenRe ? s.replace(tokenRe, ' ') : s);

  const walkDir = (dir) => {
    if (!existsSync(dir)) return [];
    return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
      const p = join(dir, e.name);
      if (e.isDirectory()) return ['__tests__', 'node_modules'].includes(e.name) ? [] : walkDir(p);
      return /\.(tsx?|jsx?)$/.test(e.name) && !/\.(test|spec)\./.test(e.name) && !e.name.endsWith('.d.ts') ? [p] : [];
    });
  };
  const coreTsx = readdirSync(join(root, 'src/core'))
    .filter((f) => f.endsWith('.tsx'))
    .map((f) => join(root, 'src/core', f));
  const files = [
    ...walkDir(join(root, 'app')),
    ...walkDir(join(root, 'src/components')),
    ...walkDir(join(root, 'lib')),
    ...coreTsx,
    ...extraFiles.map((f) => (f.startsWith('/') ? f : join(root, f))),
  ].filter((f) => !skipFiles.has(rel(f)));

  const errors = [];
  const counts = {};
  for (const file of files) {
    const code = readFileSync(file, 'utf8');
    const ast = babel.parseSync(code, {
      filename: file,
      babelrc: false,
      configFile: false,
      parserOpts: { sourceType: 'module', plugins: ['typescript', 'jsx'] },
    });
    const relFile = rel(file);
    const src = (n) => code.slice(n.start, n.end);
    let ratchet = 0;
    const hasLetterLiteral = (node) => {
      let found = false;
      babel.traverse.cheap(node, (n) => {
        if (n.type === 'StringLiteral' && LETTER.test(n.value)) found = true;
        if (n.type === 'TemplateLiteral' && n.quasis.some((q) => LETTER.test(q.value.cooked || ''))) found = true;
        if (n.type === 'JSXText' && LETTER.test(n.value)) found = true;
      });
      return found;
    };
    const isTFallback = (n) =>
      (n.type === 'LogicalExpression' && (n.operator === '||' || n.operator === '??')) &&
      /^\(?\s*(t|tr|b|translations)\s*(\?\.|\.|\[)/.test(src(n.left));
    const isPlKey = (n) =>
      n.type === 'ObjectProperty' && /(Pl|_pl|^pl)$/.test(n.key?.name ?? n.key?.value ?? '');
    /** Czy ścieżka leży w gałęzi dwujęzycznego wyboru, w polskim zapasie albo w danych *Pl. */
    const inBilingual = (path) =>
      Boolean(
        path.findParent((p) => {
          const n = p.node;
          if (n.type === 'ConditionalExpression' && LANG_TEST.test(src(n.test))) {
            return path.isDescendant(p.get('consequent')) || path.isDescendant(p.get('alternate')) ||
              p.get('consequent') === path || p.get('alternate') === path;
          }
          if (isTFallback(n)) return path.isDescendant(p.get('right')) || p.get('right') === path;
          if (isPlKey(n)) return true;
          return false;
        }),
      );
    const textOf = (n) =>
      n.type === 'TemplateLiteral' ? n.quasis.map((q) => q.value.cooked || '').join(' ') : n.value;
    const report = (n, kind) => {
      const raw = textOf(n).replace(/\s+/g, ' ').trim();
      const key = `${relFile}\u0000${raw}`;
      if (exactTexts.has(key)) {
        usedTexts.add(key);
        return;
      }
      errors.push(`${relFile}:${n.loc.start.line} [${kind}] „${raw.slice(0, 90)}”`);
    };
    const isUiCall = (callee) =>
      /^(Alert\.alert|Alert\.prompt|Share\.share|confirmAction|confirmDelete|announce|AccessibilityInfo\.announceForAccessibility)$/.test(
        callee ? src(callee) : '',
      );

    babel.traverse(ast, {
      ConditionalExpression(p) {
        if (LANG_TEST.test(src(p.node.test)) && (hasLetterLiteral(p.node.consequent) || hasLetterLiteral(p.node.alternate))) ratchet++;
      },
      LogicalExpression(p) {
        if (isTFallback(p.node) && hasLetterLiteral(p.node.right)) ratchet++;
      },
      ObjectProperty(p) {
        if (isPlKey(p.node) && hasLetterLiteral(p.node.value)) ratchet++;
      },
      'StringLiteral|TemplateLiteral|JSXText'(p) {
        const n = p.node;
        if (p.parentPath.isTemplateLiteral()) return;
        if (n.type === 'StringLiteral' && (p.parentPath.isImportDeclaration() || p.parentPath.isExportDeclaration())) return;
        if (n.type === 'StringLiteral' && p.parentPath.isObjectProperty() && p.key === 'key') return;
        if (n.type === 'StringLiteral' && p.parentPath.isTSLiteralType()) return;
        const txt = textOf(n);
        if (!LETTER.test(txt)) return;
        if (inBilingual(p)) return;
        if (PL_CHARS.test(txt)) {
          report(n, 'polskie znaki');
          return;
        }
        // Tekst bez polskich znaków: tylko w miejscach, które widać lub słychać.
        let visible = false;
        if (n.type === 'JSXText') visible = true;
        // Wspinaczka przez `a ? 'x' : 'y'`, `a && 'x'`, `(…)` do miejsca użycia tekstu.
        let up = p;
        while (
          up.parentPath &&
          ((up.parentPath.isConditionalExpression() && up.key !== 'test') ||
            up.parentPath.isLogicalExpression() ||
            up.parentPath.isParenthesizedExpression() ||
            up.parentPath.isTSAsExpression())
        ) {
          up = up.parentPath;
        }
        const parent = up.parentPath;
        if (parent.isJSXAttribute() && TEXT_ATTRS.has(parent.node.name.name)) visible = true;
        if (parent.isJSXExpressionContainer()) {
          const gp = parent.parentPath;
          if (gp.isJSXElement() || gp.isJSXFragment()) visible = true;
          if (gp.isJSXAttribute() && TEXT_ATTRS.has(gp.node.name.name)) visible = true;
        }
        if (parent.isCallExpression() && isUiCall(parent.node.callee)) visible = true;
        if (parent.isObjectProperty() && /^(title|message)$/.test(parent.node.key?.name ?? '') &&
            parent.parentPath.parentPath?.isCallExpression() && isUiCall(parent.parentPath.parentPath.node.callee)) visible = true;
        if (!visible) return;
        if (!LETTER.test(stripTokens(txt))) return;
        report(n, 'tekst poza słownikiem');
      },
    });
    if (ratchet > 0) counts[relFile] = ratchet;
  }

  for (const [key, x] of exactTexts) {
    if (!usedTexts.has(key) && !extraFiles.length) errors.push(`${x.plik} [nieaktualny wyjątek] „${x.tekst}” nie występuje — usuń z scripts/i18n-exceptions.json`);
  }

  // Zapadka (b)
  const baseline = existsSync(baselinePath) ? JSON.parse(readFileSync(baselinePath, 'utf8')) : { pliki: {} };
  const base = baseline.pliki || {};
  const rErrors = [];
  const lower = [];
  for (const [f, n] of Object.entries(counts)) {
    const was = base[f] ?? 0;
    if (n > was) rErrors.push(`${f}: ${n} > ${was} (lista bazowa)`);
    else if (n < was) lower.push(f);
  }
  for (const f of Object.keys(base)) if (!(f in counts) && !extraFiles.length) lower.push(f);
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const baselineTotal = Object.values(base).reduce((a, b) => a + b, 0);
  if (updateBaseline) {
    if (rErrors.length && existsSync(baselinePath)) {
      console.error('[i18n] --update-baseline odrzucone: liczba wzrosła (zapadka wolno tylko maleć).');
    } else {
      const sorted = Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)));
      const out = {
        _opis: baseline._opis ||
          'Zapadka M1-audytor-generalny-033: liczba dwujęzycznych wyborów pl/en (isEn ? … : …, language === … ? … : …), polskich zapasów t.x || … i danych *Pl w pliku. Wolno tylko maleć; aktualizacja: npm run check:i18n -- --update-baseline.',
        razem: total,
        pliki: sorted,
      };
      writeFileSync(baselinePath, `${JSON.stringify(out, null, 2)}\n`);
      console.log(`[i18n] Zapisano listę bazową: ${total} wyborów w ${Object.keys(sorted).length} plikach.`);
    }
  }
  return { errors, fileCount: files.length, ratchet: { errors: rErrors, lower, total, baselineTotal } };
}
