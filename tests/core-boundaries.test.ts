// ============================================================================
// Granice warstw src/core — M1-audytor-generalny-045 (05-architekt-012, ARCH-03)
// CLAUDE.md §2.1: zakaz importu `react`, `react-native`, `expo-*` w logice src/core.
// Do tej pory reguła żyła tylko w dokumencie i naruszenia narastały (40 w 22 plikach).
//
// „Plik logiki” = każdy plik *.ts w src/core (rekurencyjnie, bez testów i *.d.ts).
// Adaptery platformy (expo-haptics, expo-audio, AccessibilityInfo, Alert, AppState,
// keep-awake, Platform) mieszkają w src/platform/, warstwa zapisu (expo-sqlite,
// expo-file-system: baza, kopie, strażnik startu, ratunek) w src/data/, hooki React
// w src/hooks/. Pliki *.tsx w src/core to komponenty i konteksty React (warstwa UI)
// z zamkniętej, nazwanej listy poniżej — nowy plik .tsx w src/core czerwieni test,
// a wpis znika z listy, gdy plik wyjdzie z src/core (krok dalszy: src/components/).
// ============================================================================
import fs from 'fs';
import path from 'path';
import ts from 'typescript';

const root = path.join(__dirname, '..');
const coreDir = path.join(root, 'src', 'core');

/** Specyfikatory frameworka i wejścia-wyjścia zakazane w plikach logiki src/core. */
const FORBIDDEN =
  /^(react|react-dom|react-native|expo)(\/|$)|^(expo|react-native)-|^@react-native(-community)?\/|^@expo\/|^(node:)?(fs|fs\/promises|child_process|net|http|https|dgram)$/;

/** Komponenty i konteksty React (.tsx), które dziś leżą w src/core — lista tylko maleje. */
const UI_TSX_IN_CORE: Record<string, string> = {
  'QrScannerModal.tsx': 'komponent modala skanera (expo-camera) — miejsce docelowe src/components/',
  'brew-context.tsx': 'kontekst React stanu parzenia (BrewProvider) — warstwa UI łącząca logikę z zapisem',
  'caffeine-chart.tsx': 'komponent wykresu kofeiny (react-native) — miejsce docelowe src/components/',
  'flavor-wheel-picker.tsx': 'komponent koła smaków (react-native) — miejsce docelowe src/components/',
  'i18n.tsx': 'słownik PL/EN + kontekst React; ścieżkę czytają check:i18n i check:matrix — przeniesienie osobno',
  'qr-code.tsx': 'komponent kodu QR (react-native-svg) — miejsce docelowe src/components/',
  'radar-chart.tsx': 'komponent wykresu radarowego (react-native-svg) — miejsce docelowe src/components/',
};

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (name === '__tests__' || name === 'node_modules') continue;
    if (fs.statSync(p).isDirectory()) out.push(...walk(p));
    else if (/\.tsx?$/.test(name) && !/\.(test|spec)\.tsx?$/.test(name) && !name.endsWith('.d.ts')) out.push(p);
  }
  return out;
}

/** Wszystkie specyfikatory modułów: import/export … from, import x = require, require(), import(). */
function moduleSpecifiers(code: string, fileName = 'x.ts'): string[] {
  const sf = ts.createSourceFile(fileName, code, ts.ScriptTarget.Latest, true);
  const found: string[] = [];
  const visit = (node: ts.Node) => {
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
      found.push(node.moduleSpecifier.text);
    } else if (ts.isImportEqualsDeclaration(node) && ts.isExternalModuleReference(node.moduleReference)) {
      const e = node.moduleReference.expression;
      if (ts.isStringLiteral(e)) found.push(e.text);
    } else if (ts.isCallExpression(node) && node.arguments.length > 0 && ts.isStringLiteralLike(node.arguments[0])) {
      const callee = node.expression;
      if (callee.kind === ts.SyntaxKind.ImportKeyword || (ts.isIdentifier(callee) && callee.text === 'require')) {
        found.push((node.arguments[0] as ts.StringLiteral).text);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return found;
}

function frameworkImports(code: string, fileName = 'x.ts'): string[] {
  return moduleSpecifiers(code, fileName).filter((s) => FORBIDDEN.test(s));
}

const rel = (f: string) => path.relative(root, f).split(path.sep).join('/');
const coreFiles = walk(coreDir);
const logicFiles = coreFiles.filter((f) => f.endsWith('.ts'));

describe('granice src/core (CLAUDE.md §2.1, 05-architekt-012)', () => {
  test('detektor łapie każdą formę importu frameworka i I/O, a przepuszcza moduły własne', () => {
    const code = [
      "import React from 'react';",
      "import { View } from 'react-native';",
      "import * as Haptics from 'expo-haptics';",
      "import * as FS from 'expo-file-system/legacy';",
      "import Svg from 'react-native-svg';",
      "export { useRouter } from 'expo-router';",
      "import fs = require('fs');",
      "const p = require('node:child_process');",
      "const m = import('@react-native/js-polyfills');",
      "import Constants from 'expo';",
      "import { a } from './recipes-data';",
      "import { b } from '../platform/signals';",
      "import { c } from 'qrcode';",
      "import { d } from 'reactive-lib';",
      "import { e } from 'expose';",
    ].join('\n');
    expect(frameworkImports(code)).toEqual([
      'react',
      'react-native',
      'expo-haptics',
      'expo-file-system/legacy',
      'react-native-svg',
      'expo-router',
      'fs',
      'node:child_process',
      '@react-native/js-polyfills',
      'expo',
    ]);
  });

  test('żaden plik logiki src/core (*.ts) nie importuje react, react-native, expo-* ani modułów I/O', () => {
    expect(logicFiles.length).toBeGreaterThan(20);
    const violations = logicFiles.flatMap((f) =>
      frameworkImports(fs.readFileSync(f, 'utf8'), f).map((s) => `${rel(f)} → ${s}`)
    );
    expect(violations).toEqual([]);
  });

  test('pliki .tsx w src/core to tylko nazwane komponenty/konteksty UI (bez nowych; lista bez martwych wpisów)', () => {
    const tsx = coreFiles.filter((f) => f.endsWith('.tsx')).map((f) => path.relative(coreDir, f).split(path.sep).join('/')).sort();
    expect(tsx).toEqual(Object.keys(UI_TSX_IN_CORE).sort());
    for (const reason of Object.values(UI_TSX_IN_CORE)) expect(reason.length).toBeGreaterThan(20);
  });
});
