#!/usr/bin/env node
/**
 * Apps4Brew Studio — AST Test Matrix Scanner (BR-TEST-028..031)
 * Strips comments, import declarations, and test/describe titles.
 * Validates 100% test coverage across 5 categories: EKRAN, UI, TEKST, LOGIKA, WYMIAR.
 */
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, relative } from 'node:path';
import ts from 'typescript';

const root = fileURLToPath(new URL('..', import.meta.url));
const isCheckMode = process.argv.includes('--check');

// ==========================================
// 1. Gather Files
// ==========================================
function getFiles(dir, ext = ['.ts', '.tsx']) {
  const res = [];
  if (!existsSync(dir)) return res;
  for (const item of readdirSync(dir)) {
    if (['node_modules', '.git', '.expo', 'dist', 'scratch'].includes(item)) continue;
    const p = join(dir, item);
    const s = statSync(p);
    if (s.isDirectory()) {
      res.push(...getFiles(p, ext));
    } else if (ext.some((e) => p.endsWith(e))) {
      res.push(p);
    }
  }
  return res;
}

const appFiles = getFiles(join(root, 'app')).filter((f) => !f.includes('_layout') && !f.includes('__tests__'));
const srcDomainFiles = [
  ...getFiles(join(root, 'src', 'core')),
].filter((f) => !f.includes('__tests__') && !f.endsWith('.d.ts'));

const compFiles = getFiles(join(root, 'src', 'components')).filter((f) => !f.includes('__tests__'));

const testFiles = [
  ...getFiles(join(root, 'tests')),
  ...getFiles(join(root, 'src')).filter((f) => f.includes('__tests__') && f.includes('.test.')),
  ...getFiles(join(root, 'app')).filter((f) => f.includes('__tests__') && f.includes('.test.')),
];

// ==========================================
// 2. Strip Non-Code from Tests (BR-TEST-029)
// ==========================================
function stripTsNonCode(filePath, content) {
  const sf = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);
  let cleaned = '';

  function visit(node) {
    // 1. Skip entire import declarations
    if (ts.isImportDeclaration(node)) {
      return;
    }

    // 2. Skip first argument (string title) of describe, test, it
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      ['describe', 'test', 'it'].includes(node.expression.text)
    ) {
      const args = node.arguments;
      if (args.length > 0 && ts.isStringLiteral(args[0])) {
        // visit remaining arguments only
        for (let i = 1; i < args.length; i++) {
          visit(args[i]);
        }
        return;
      }
    }

    // Append identifier or literal text
    if (ts.isIdentifier(node) || ts.isStringLiteral(node) || ts.isNumericLiteral(node)) {
      cleaned += ' ' + node.text;
    }

    ts.forEachChild(node, visit);
  }

  visit(sf);
  return cleaned;
}

const testCodeMap = new Map();
let allTestCleanedCode = '';

for (const tf of testFiles) {
  const raw = readFileSync(tf, 'utf-8');
  const cleaned = stripTsNonCode(tf, raw);
  testCodeMap.set(tf, cleaned);
  allTestCleanedCode += ' ' + cleaned;
}

// ==========================================
// 3. Extract 5 Categories from Code
// ==========================================
const items = [];

// Category 1: EKRAN (Routes in app/)
for (const af of appFiles) {
  const rel = relative(join(root, 'app'), af).replace(/\\/g, '/').replace(/\.tsx?$/, '');
  const baseName = af.split(/[\\/]/).pop().replace(/\.tsx?$/, '');
  items.push({
    category: 'EKRAN',
    name: `/${rel}`,
    file: relative(root, af).replace(/\\/g, '/'),
    matcher: (code) =>
      code.includes(rel) ||
      code.includes(`/${rel}`) ||
      code.includes(baseName) ||
      code.includes(`${baseName}Screen`),
  });
}

// Category 2 & 3: UI & TEKST (Translations from i18n AST)
const i18nFile = join(root, 'src', 'core', 'i18n.tsx');
if (existsSync(i18nFile)) {
  const i18nContent = readFileSync(i18nFile, 'utf-8');
  const sf = ts.createSourceFile(i18nFile, i18nContent, ts.ScriptTarget.Latest, true);

  function walkObj(node, prefix = '') {
    if (ts.isObjectLiteralExpression(node)) {
      for (const prop of node.properties) {
        if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name)) {
          const keyName = prop.name.text;
          const fullKey = prefix ? `${prefix}.${keyName}` : keyName;
          if (ts.isObjectLiteralExpression(prop.initializer)) {
            walkObj(prop.initializer, fullKey);
          } else {
            // Leaf translation item
            const isUi =
              fullKey.startsWith('common.') ||
              /save|cancel|delete|edit|close|confirm|back|next|finish|Btn|Button|Action|Tab|Select|Toggle|Filter/i.test(
                keyName
              );
            const category = isUi ? 'UI' : 'TEKST';
            items.push({
              category,
              name: fullKey,
              file: 'src/core/i18n.tsx',
              matcher: (code) =>
                code.includes(keyName) ||
                code.includes(fullKey) ||
                code.includes(prefix),
            });
          }
        }
      }
    }
  }

  function findTranslations(node) {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === 'translations' &&
      node.initializer &&
      ts.isObjectLiteralExpression(node.initializer)
    ) {
      for (const p of node.initializer.properties) {
        if (
          ts.isPropertyAssignment(p) &&
          ts.isIdentifier(p.name) &&
          p.name.text === 'pl' &&
          ts.isObjectLiteralExpression(p.initializer)
        ) {
          walkObj(p.initializer);
        }
      }
    }
    ts.forEachChild(node, findTranslations);
  }

  findTranslations(sf);
}

// Category 4: LOGIKA (Exported Functions in src/core/)
for (const f of srcDomainFiles) {
  const content = readFileSync(f, 'utf-8');
  const sf = ts.createSourceFile(f, content, ts.ScriptTarget.Latest, true);

  function findExports(node) {
    if (ts.isFunctionDeclaration(node) && node.name && node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)) {
      items.push({
        category: 'LOGIKA',
        name: node.name.text,
        file: relative(root, f).replace(/\\/g, '/'),
        matcher: (code) => new RegExp(`\\b${node.name.text}\\b`).test(code),
      });
    } else if (ts.isVariableStatement(node) && node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)) {
      for (const decl of node.declarationList.declarations) {
        if (ts.isIdentifier(decl.name) && decl.initializer && (ts.isArrowFunction(decl.initializer) || ts.isFunctionExpression(decl.initializer))) {
          items.push({
            category: 'LOGIKA',
            name: decl.name.text,
            file: relative(root, f).replace(/\\/g, '/'),
            matcher: (code) => new RegExp(`\\b${decl.name.text}\\b`).test(code),
          });
        }
      }
    }
    ts.forEachChild(node, findExports);
  }

  findExports(sf);
}

// Category 5: WYMIAR (Exported constant arrays and union types)
for (const f of srcDomainFiles) {
  const content = readFileSync(f, 'utf-8');
  const sf = ts.createSourceFile(f, content, ts.ScriptTarget.Latest, true);

  function findDimensions(node) {
    // Upper snake case constant array
    if (ts.isVariableStatement(node) && node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)) {
      for (const decl of node.declarationList.declarations) {
        if (ts.isIdentifier(decl.name) && /^[A-Z][A-Z0-9_]{2,}$/.test(decl.name.text)) {
          const name = decl.name.text;
          items.push({
            category: 'WYMIAR',
            name,
            file: relative(root, f).replace(/\\/g, '/'),
            matcher: (code) => new RegExp(`\\b${name}\\b`).test(code),
          });
        }
      }
    }
    // Union types
    if (ts.isTypeAliasDeclaration(node) && node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)) {
      if (ts.isUnionTypeNode(node.type)) {
        const typeName = node.name.text;
        items.push({
          category: 'WYMIAR',
          name: typeName,
          file: relative(root, f).replace(/\\/g, '/'),
          matcher: (code) => new RegExp(`\\b${typeName}\\b`).test(code),
        });
      }
    }
    ts.forEachChild(node, findDimensions);
  }

  findDimensions(sf);
}

// ==========================================
// 4. Exceptions Registry (BR-TEST-031)
// ==========================================
const exceptionsPath = join(root, 'tests', 'matrix-exceptions.json');
let exceptions = {};
if (existsSync(exceptionsPath)) {
  try {
    exceptions = JSON.parse(readFileSync(exceptionsPath, 'utf-8'));
  } catch {}
}

// Check for empty exception reasons
for (const [key, reason] of Object.entries(exceptions)) {
  if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
    console.error(`[test-matrix] Error: Exception "${key}" has an empty explanation.`);
    process.exit(1);
  }
}

// ==========================================
// 5. Evaluate Coverage
// ==========================================
let missingCount = 0;
const results = [];
const stats = {
  EKRAN: { total: 0, covered: 0 },
  UI: { total: 0, covered: 0 },
  TEKST: { total: 0, covered: 0 },
  LOGIKA: { total: 0, covered: 0 },
  WYMIAR: { total: 0, covered: 0 },
};

for (const item of items) {
  stats[item.category].total++;
  const matchedTests = [];

  for (const [tf, cleanCode] of testCodeMap.entries()) {
    if (item.matcher(cleanCode)) {
      matchedTests.push(relative(root, tf).replace(/\\/g, '/'));
    }
  }

  const isCovered = matchedTests.length > 0 || !!exceptions[item.name];
  if (isCovered) {
    stats[item.category].covered++;
  } else {
    missingCount++;
  }

  results.push({
    ...item,
    covered: isCovered,
    testFiles: matchedTests,
    exceptionReason: exceptions[item.name],
  });
}

// Check for stale exceptions
const staleExceptions = [];
for (const [name, reason] of Object.entries(exceptions)) {
  const item = items.find((i) => i.name === name);
  if (!item) {
    staleExceptions.push(`${name} (nie istnieje w kodzie źródłowym)`);
  } else {
    const matched = [];
    for (const [tf, cleanCode] of testCodeMap.entries()) {
      if (item.matcher(cleanCode)) {
        matched.push(tf);
      }
    }
    if (matched.length > 0) {
      staleExceptions.push(`${name} (ma już bezpośrednie testy: ${matched.length})`);
    }
  }
}

if (staleExceptions.length > 0) {
  console.error(
    `[test-matrix] BŁĄD: Wykryto przeterminowane wyjątki w matrix-exceptions.json:\n${staleExceptions
      .map((s) => '  - ' + s)
      .join('\n')}`
  );
  process.exit(1);
}

// ==========================================
// 6. Generate docs/22-macierz-testow.md
// ==========================================
let md = `# Macierz Testów (AST Coverage Matrix) — NAPAR (STEEPWISE)\n\n`;
md += `Wygenerowano automatycznie przez \`scripts/test-matrix.mjs\` zgodnie z wymaganiami **BR-TEST-028..031**.\n`;
md += `Zasada dowodu: wyłącznie wykonywalny kod testu (wycięte komentarze, importy i opisy \`test\`/\`describe\`).\n\n`;

md += `## Podsumowanie Pokrycia\n\n`;
md += `| Kategoria | Łącznie | Pokryte | Pokrycie % | Status |\n`;
md += `| :--- | :---: | :---: | :---: | :---: |\n`;

for (const cat of ['EKRAN', 'UI', 'TEKST', 'LOGIKA', 'WYMIAR']) {
  const c = stats[cat];
  const pct = c.total > 0 ? ((c.covered / c.total) * 100).toFixed(1) : '100.0';
  const ok = c.covered >= c.total;
  md += `| **${cat}** | ${c.total} | ${c.covered} | **${pct}%** | ${ok ? '✅ POKRYTE' : '❌ BRAKI'} |\n`;
}

md += `\nŁącznie elementów: **${items.length}** | Pokrytych: **${items.length - missingCount}** | Brakujących: **${missingCount}**\n\n`;

md += `## Szczegółowa Lista Elementów\n\n`;
md += `| Kategoria | Nazwa elementu | Plik źródłowy | Status | Pliki testowe |\n`;
md += `| :--- | :--- | :--- | :---: | :--- |\n`;

for (const r of results.slice(0, 300)) {
  const st = r.covered ? '✅' : '❌ BRAK';
  const testsStr =
    r.testFiles.length > 0
      ? r.testFiles.slice(0, 2).join(', ')
      : r.exceptionReason
      ? `*(Wyjątek: ${r.exceptionReason})*`
      : '—';
  md += `| \`${r.category}\` | \`${r.name.replace(/\|/g, '\\|')}\` | \`${r.file}\` | ${st} | ${testsStr} |\n`;
}

if (results.length > 300) {
  md += `\n*(... i ${results.length - 300} kolejnych elementów w pełnym wykazie)*\n`;
}

const matrixDocPath = join(root, 'docs', '22-macierz-testow.md');
writeFileSync(matrixDocPath, md, 'utf-8');

console.log(`[test-matrix] Zaktualizowano ${matrixDocPath}`);
console.log(
  `[test-matrix] Wyniki: ${items.length - missingCount}/${items.length} elementów (${
    missingCount === 0 ? '100%' : 'Braki: ' + missingCount
  })`
);

const missingByCat = { EKRAN: [], UI: [], TEKST: [], LOGIKA: [], WYMIAR: [] };
for (const r of results) {
  if (!r.covered) {
    missingByCat[r.category].push(r.name);
  }
}
if (missingCount > 0) {
  if (missingByCat.EKRAN.length) console.log('[test-matrix] Braki w EKRAN:', missingByCat.EKRAN);
  if (missingByCat.UI.length) console.log('[test-matrix] Braki w UI (pierwsze 10):', missingByCat.UI.slice(0, 10));
  if (missingByCat.TEKST.length) console.log('[test-matrix] Braki w TEKST (pierwsze 10):', missingByCat.TEKST.slice(0, 10));
  if (missingByCat.LOGIKA.length) console.log('[test-matrix] Braki w LOGIKA:', missingByCat.LOGIKA);
  if (missingByCat.WYMIAR.length) console.log('[test-matrix] Braki w WYMIAR:', missingByCat.WYMIAR);
}

if (isCheckMode && missingCount > 0) {
  console.error(`[test-matrix] BŁĄD BRAMKI: Wykryto ${missingCount} nieprzetestowanych elementów!`);
  process.exit(1);
}
