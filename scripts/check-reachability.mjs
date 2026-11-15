#!/usr/bin/env node
/**
 * Kontrola osiągalności src/core (DEC-02, M1-audytor-generalny-010)
 * oraz src/data, src/platform, src/hooks (M1-audytor-generalny-045).
 *
 * Każda deklaracja najwyższego poziomu w src/core (funkcja, stała, klasa, typ,
 * interfejs, enum) musi mieć drogę z interfejsu: odwołanie z pliku w app/ albo
 * src/components/ (korzenie), bezpośrednio albo przez inne osiągalne deklaracje
 * (także przez lib/). Odwołania z testów i skryptów nie liczą się: funkcja
 * używana tylko przez testy nie jest osiągalna.
 *
 * Dlaczego: pętle audytu P32–P105 dopisywały do src/core funkcje bez wejścia
 * z interfejsu (64% funkcji); bramka zatrzymuje nowe dopiski bez decyzji zakresu.
 * Nowa funkcja w src/core trafia do kodu razem z wywołaniem z UI albo z wpisem
 * w scripts/reachability-exceptions.json (powód + ID decyzji).
 *
 * Użycie: node scripts/check-reachability.mjs [--list]
 * Kod: 0 brak nieosiągalnych poza wyjątkami, 1 są nieosiągalne albo wyjątek nieaktualny.
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, relative, sep } from 'node:path';
import ts from 'typescript';

const root = fileURLToPath(new URL('..', import.meta.url));
const rel = (f) => relative(root, f).split(sep).join('/');
const listAll = process.argv.includes('--list');

function walk(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (name === '__tests__' || name === 'node_modules') continue;
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (/\.tsx?$/.test(name) && !/\.(test|spec)\.tsx?$/.test(name) && !name.endsWith('.d.ts')) out.push(p);
  }
  return out;
}

const ROOT_DIRS = ['app', 'src/components'];
const files = [...walk(join(root, 'app')), ...walk(join(root, 'src')), ...walk(join(root, 'lib'))];
const isRootFile = (f) => ROOT_DIRS.some((d) => rel(f).startsWith(`${d}/`));
// M1-audytor-generalny-045: warstwy wydzielone z src/core (adaptery platformy, zapis, hooki React)
// podlegają tej samej bramce co src/core.
const GATED = ['src/core/', 'src/data/', 'src/platform/', 'src/hooks/'];
const isGated = (file) => GATED.some((d) => file.startsWith(d));

const cfg = ts.readConfigFile(join(root, 'tsconfig.json'), ts.sys.readFile);
const parsed = ts.parseJsonConfigFileContent(cfg.config, ts.sys, root);
const program = ts.createProgram(files, { ...parsed.options, noEmit: true });
const checker = program.getTypeChecker();
const fileSet = new Set(files.map((f) => ts.sys.resolvePath(f)));

/** Jednostki: `plik#nazwa` dla deklaracji najwyższego poziomu w plikach spoza korzeni. */
const units = new Map(); // key -> { file, name, kind, exported, lines, line }
const edges = new Map(); // key -> Set(key)
const roots = new Set();
const ROOT = '<korzeń>';

function declNames(stmt) {
  if (ts.isVariableStatement(stmt)) return stmt.declarationList.declarations.map((d) => [d, ts.isIdentifier(d.name) ? d.name.text : d.name.getText()]);
  if ((ts.isFunctionDeclaration(stmt) || ts.isClassDeclaration(stmt)) && stmt.name) return [[stmt, stmt.name.text]];
  if (ts.isInterfaceDeclaration(stmt) || ts.isTypeAliasDeclaration(stmt) || ts.isEnumDeclaration(stmt)) return [[stmt, stmt.name.text]];
  if ((ts.isFunctionDeclaration(stmt) || ts.isClassDeclaration(stmt)) && !stmt.name) return [[stmt, 'default']];
  if (ts.isExportAssignment(stmt)) return [[stmt, 'default']];
  return null;
}
const kindOf = (stmt) =>
  ts.isFunctionDeclaration(stmt) ? 'funkcja' : ts.isClassDeclaration(stmt) ? 'klasa' : ts.isVariableStatement(stmt) ? 'stała'
    : ts.isInterfaceDeclaration(stmt) || ts.isTypeAliasDeclaration(stmt) ? 'typ' : ts.isEnumDeclaration(stmt) ? 'enum' : 'eksport';
const isExported = (stmt) => ts.isExportAssignment(stmt) || !!stmt.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);

/** Mapa węzeł deklaracji -> klucz jednostki. */
const declToUnit = new Map();
for (const sf of program.getSourceFiles()) {
  const f = ts.sys.resolvePath(sf.fileName);
  if (!fileSet.has(f) || isRootFile(f)) continue;
  for (const stmt of sf.statements) {
    const names = declNames(stmt);
    if (!names) continue; // import, export {…}, export * — nie są użyciem
    for (const [node, name] of names) {
      const key = `${rel(f)}#${name}`;
      const start = sf.getLineAndCharacterOfPosition(stmt.getStart(sf)).line + 1;
      const end = sf.getLineAndCharacterOfPosition(stmt.getEnd()).line + 1;
      const prev = units.get(key);
      units.set(key, {
        file: rel(f), name, kind: kindOf(stmt), exported: (prev?.exported ?? false) || isExported(stmt),
        line: prev?.line ?? start, lines: (prev?.lines ?? 0) + (end - start + 1),
      });
      declToUnit.set(node, key);
      if (node !== stmt) declToUnit.set(stmt, key);
    }
    // Instrukcje z efektem ubocznym na poziomie modułu (np. `declare global`) traktujemy jak korzeń.
  }
}

function unitOfDeclaration(decl) {
  for (let n = decl; n; n = n.parent) {
    const k = declToUnit.get(n);
    if (k) return k;
    if (n.parent && ts.isSourceFile(n.parent)) return null;
  }
  return null;
}

function addEdge(from, to) {
  if (!to || from === to) return;
  if (!edges.has(from)) edges.set(from, new Set());
  edges.get(from).add(to);
}

for (const sf of program.getSourceFiles()) {
  const f = ts.sys.resolvePath(sf.fileName);
  if (!fileSet.has(f)) continue;
  const rootFile = isRootFile(f);
  const visit = (node, owner) => {
    let cur = declToUnit.get(node) ?? owner;
    if (!rootFile && node.parent && ts.isSourceFile(node.parent)) {
      cur = declToUnit.get(node) ?? ROOT; // instrukcje modułu bez nazwy: korzeń (efekt uboczny importu)
      if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) return;
    }
    if (ts.isIdentifier(node)) {
      let sym = ts.isShorthandPropertyAssignment(node.parent) && node.parent.name === node
        ? checker.getShorthandAssignmentValueSymbol(node.parent)
        : checker.getSymbolAtLocation(node);
      if (sym && sym.flags & ts.SymbolFlags.Alias) {
        try { sym = checker.getAliasedSymbol(sym); } catch { /* nierozwiązany alias */ }
      }
      for (const d of sym?.declarations ?? []) {
        const df = ts.sys.resolvePath(d.getSourceFile().fileName);
        if (!fileSet.has(df) || isRootFile(df)) continue;
        addEdge(cur, unitOfDeclaration(d));
      }
    }
    ts.forEachChild(node, (c) => visit(c, cur));
  };
  ts.forEachChild(sf, (c) => visit(c, ROOT));
}

const reached = new Set([ROOT]);
const queue = [ROOT];
while (queue.length) {
  for (const n of edges.get(queue.shift()) ?? []) if (!reached.has(n)) reached.add(n), queue.push(n);
}

const exPath = join(root, 'scripts', 'reachability-exceptions.json');
const exceptions = existsSync(exPath) ? JSON.parse(readFileSync(exPath, 'utf8')) : {};
delete exceptions.$comment;

const core = [...units.entries()].filter(([, u]) => isGated(u.file));
const unreachable = core.filter(([k]) => !reached.has(k));
const errors = [];
for (const [k, u] of unreachable) {
  if (!exceptions[k]) errors.push(`NIEOSIĄGALNE ${u.file}:${u.line} ${u.kind} ${u.name}${u.exported ? ' (eksport)' : ''}, ${u.lines} linii`);
}
for (const [k, why] of Object.entries(exceptions)) {
  if (!units.has(k)) errors.push(`WYJĄTEK NIEAKTUALNY ${k}: brak takiej deklaracji`);
  else if (reached.has(k)) errors.push(`WYJĄTEK NIEAKTUALNY ${k}: deklaracja jest osiągalna, usuń wpis`);
  else if (!String(why).trim()) errors.push(`WYJĄTEK BEZ POWODU ${k}`);
}

// Pliki src/core, których nic osiągalnego nie dotyka.
const deadFiles = [...new Set(core.map(([, u]) => u.file))].filter((f) => core.filter(([, u]) => u.file === f).every(([k]) => !reached.has(k)));

if (listAll) for (const [k, u] of unreachable) console.log(`${u.file}\t${u.line}\t${u.kind}\t${u.name}\t${u.exported ? 'eksport' : 'lokalna'}\t${u.lines}\t${exceptions[k] ? 'wyjątek' : ''}`);
for (const e of errors) console.log(e);
const fns = core.filter(([, u]) => u.kind === 'funkcja');
console.log(
  `src/{core,data,platform,hooks}: ${core.length} deklaracji (${fns.length} funkcji), osiągalne ${core.length - unreachable.length}, ` +
  `nieosiągalne ${unreachable.length} (wyjątki ${unreachable.length - errors.filter((e) => e.startsWith('NIEOSIĄGALNE')).length}); ` +
  `pliki bez żadnej osiągalnej deklaracji: ${deadFiles.length ? deadFiles.join(', ') : 'brak'}`,
);
if (errors.length) {
  console.log(`BŁĄD: ${errors.length}. Nowa deklaracja w src/core potrzebuje wywołania z app/ albo src/components/ (DEC-02) albo wpisu w scripts/reachability-exceptions.json z powodem.`);
  process.exit(1);
}
console.log('OK: każda deklaracja src/core ma drogę z interfejsu albo nazwany wyjątek.');
