// ============================================================================
// Napar (Steepwise) — Skaner minimalnego pola dotyku (CLAUDE.md §2.4, NFR-A11Y)
// KAŻDA interaktywna kontrolka (Pressable / TouchableOpacity / ... / Switch)
// ma efektywny obszar dotyku co najmniej 44 × 44 pt na każdej osi:
//   obszar = rozmiar jawny (width/minWidth, height/minHeight; brak = 0) + 2 × hitSlop.
// Kontrolka bez jawnego rozmiaru musi mieć minimum albo hitSlop, który sam daje 44 pt.
// Wyjątki tylko z listy TOUCH_TARGET_EXCEPTIONS, z uzasadnieniem. Skaner działa
// statycznie na AST.
// ============================================================================

import fs from 'fs';
import path from 'path';
import * as babel from '@babel/core';

const ROOT = path.resolve(__dirname, '..');
const MIN_TOUCH_PT = 44;
const TOUCH_COMPONENTS = new Set([
  'Pressable',
  'TouchableOpacity',
  'TouchableHighlight',
  'TouchableWithoutFeedback',
  'TouchableNativeFeedback',
  'Switch',
]);

/**
 * Wyjątki od reguły 44 pt. Każdy wpis wskazuje plik, linię kontrolki i uzasadnienie,
 * dlaczego nie wolno jej powiększyć. Wpis, który przestaje pasować do naruszenia, failuje test.
 */
export const TOUCH_TARGET_EXCEPTIONS: ReadonlyArray<{
  file: string; // ścieżka względem katalogu głównego repo
  line: number;
  component: string;
  reason: string;
}> = [];

interface Violation {
  file: string;
  line: number;
  component: string;
  detail: string;
}

type AnyNode = any;

export function listSourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '__tests__') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...listSourceFiles(full));
    } else if (entry.name.endsWith('.tsx') && !entry.name.endsWith('.test.tsx')) {
      out.push(full);
    }
  }
  return out;
}

export function walk(node: AnyNode, visit: (n: AnyNode) => void): void {
  if (!node || typeof node.type !== 'string') return;
  visit(node);
  for (const key of Object.keys(node)) {
    if (key === 'loc' || key === 'start' || key === 'end') continue;
    const value = node[key];
    if (Array.isArray(value)) {
      value.forEach((child) => walk(child, visit));
    } else if (value && typeof value.type === 'string') {
      walk(value, visit);
    }
  }
}

function numericValue(node: AnyNode): number | undefined {
  if (!node) return undefined;
  if (node.type === 'NumericLiteral') return node.value;
  if (node.type === 'UnaryExpression' && node.operator === '-' && node.argument.type === 'NumericLiteral') {
    return -node.argument.value;
  }
  return undefined;
}

/** Wartości rozmiaru z obiektu stylu (literalne liczby). */
function sizeFromObject(obj: AnyNode): { width?: number; height?: number; minWidth?: number; minHeight?: number } {
  const result: Record<string, number> = {};
  for (const prop of obj.properties) {
    if (prop.type !== 'ObjectProperty') continue;
    const key = prop.key.type === 'Identifier' ? prop.key.name : prop.key.value;
    if (['width', 'height', 'minWidth', 'minHeight'].includes(key)) {
      const v = numericValue(prop.value);
      if (v !== undefined) result[key] = v;
    }
  }
  return result;
}

/** Zbiera źródła stylu z atrybutu style: styles.X, literały obiektów, tablice, wyrażenia warunkowe. */
function collectStyleSources(
  expr: AnyNode,
  styleSheet: Map<string, AnyNode>,
  out: AnyNode[]
): void {
  if (!expr) return;
  switch (expr.type) {
    case 'MemberExpression': {
      if (expr.object.type === 'Identifier' && expr.object.name === 'styles' && expr.property.type === 'Identifier') {
        const named = styleSheet.get(expr.property.name);
        if (named) out.push(named);
      }
      return;
    }
    case 'ObjectExpression':
      out.push(expr);
      return;
    case 'ArrayExpression':
      expr.elements.forEach((el: AnyNode) => collectStyleSources(el, styleSheet, out));
      return;
    case 'ConditionalExpression':
      collectStyleSources(expr.consequent, styleSheet, out);
      collectStyleSources(expr.alternate, styleSheet, out);
      return;
    case 'LogicalExpression':
      collectStyleSources(expr.right, styleSheet, out);
      return;
    case 'ArrowFunctionExpression':
      // style={({ pressed }) => [...]}: źródła z wyrażenia zwracanego (bez bloku)
      if (expr.body.type !== 'BlockStatement') collectStyleSources(expr.body, styleSheet, out);
      return;
    default:
      return;
  }
}

/** Obszar dotyku dopełniany hitSlop: undefined, gdy wartości nie da się odczytać statycznie. */
function hitSlopExtent(attr: AnyNode): { horizontal: number; vertical: number } | undefined {
  if (!attr) return { horizontal: 0, vertical: 0 };
  const value = attr.value && attr.value.type === 'JSXExpressionContainer' ? attr.value.expression : attr.value;
  const single = numericValue(value);
  if (single !== undefined) return { horizontal: single, vertical: single };
  if (value && value.type === 'ObjectExpression') {
    const sides: Record<string, number> = {};
    for (const prop of value.properties) {
      if (prop.type !== 'ObjectProperty') return undefined;
      const key = prop.key.type === 'Identifier' ? prop.key.name : prop.key.value;
      const v = numericValue(prop.value);
      if (v === undefined) return undefined;
      sides[key] = v;
    }
    return {
      horizontal: Math.max(sides.left ?? 0, sides.right ?? 0),
      vertical: Math.max(sides.top ?? 0, sides.bottom ?? 0),
    };
  }
  return undefined;
}

export function scanFileForTouchTargetViolations(filePath: string): Violation[] {
  const code = fs.readFileSync(filePath, 'utf8');
  const ast = babel.parseSync(code, {
    filename: filePath,
    babelrc: false,
    configFile: false,
    parserOpts: { plugins: ['jsx', 'typescript'] },
  });

  // Arkusze stylów: nazwa -> obiekt (tylko z StyleSheet.create)
  const styleSheet = new Map<string, AnyNode>();
  walk(ast, (node) => {
    if (
      node.type === 'CallExpression' &&
      node.callee.type === 'MemberExpression' &&
      node.callee.object.type === 'Identifier' &&
      node.callee.object.name === 'StyleSheet' &&
      node.arguments[0] &&
      node.arguments[0].type === 'ObjectExpression'
    ) {
      for (const prop of node.arguments[0].properties) {
        if (prop.type !== 'ObjectProperty' || prop.value.type !== 'ObjectExpression') continue;
        const key = prop.key.type === 'Identifier' ? prop.key.name : prop.key.value;
        styleSheet.set(key, prop.value);
      }
    }
  });

  const violations: Violation[] = [];
  walk(ast, (node) => {
    if (node.type !== 'JSXOpeningElement') return;
    if (node.name.type !== 'JSXIdentifier' || !TOUCH_COMPONENTS.has(node.name.name)) return;

    const attrs: AnyNode[] = node.attributes.filter((a: AnyNode) => a.type === 'JSXAttribute');
    const styleAttr = attrs.find((a) => a.name.name === 'style');
    const hitSlopAttr = attrs.find((a) => a.name.name === 'hitSlop');
    const sources: AnyNode[] = [];
    if (styleAttr && styleAttr.value && styleAttr.value.type === 'JSXExpressionContainer') {
      collectStyleSources(styleAttr.value.expression, styleSheet, sources);
    }

    // Jawny rozmiar: największa z wartości width/minWidth (osobno dla osi); brak = undefined
    const explicit = { width: undefined as number | undefined, height: undefined as number | undefined };
    for (const src of sources) {
      const s = sizeFromObject(src);
      const w = [s.width, s.minWidth].filter((v): v is number => v !== undefined);
      const h = [s.height, s.minHeight].filter((v): v is number => v !== undefined);
      if (w.length) explicit.width = Math.max(explicit.width ?? -Infinity, ...w);
      if (h.length) explicit.height = Math.max(explicit.height ?? -Infinity, ...h);
    }

    const line = node.loc ? node.loc.start.line : 0;
    const component = node.name.name;
    // hitSlop niebędący literałem liczy się jako 0 (konserwatywnie: nie zawyża obszaru)
    const slopLiteral = hitSlopExtent(hitSlopAttr);
    const slop = slopLiteral ?? { horizontal: 0, vertical: 0 };
    const failingAxes: string[] = [];
    const effectiveWidth = (explicit.width ?? 0) + 2 * slop.horizontal;
    const effectiveHeight = (explicit.height ?? 0) + 2 * slop.vertical;
    if (effectiveWidth < MIN_TOUCH_PT) {
      failingAxes.push(
        `szerokość ${explicit.width === undefined ? 'bez jawnego rozmiaru' : explicit.width} pt`
      );
    }
    if (effectiveHeight < MIN_TOUCH_PT) {
      failingAxes.push(
        `wysokość ${explicit.height === undefined ? 'bez jawnego rozmiaru' : explicit.height} pt`
      );
    }
    if (failingAxes.length) {
      violations.push({
        file: filePath,
        line,
        component,
        detail: `${failingAxes.join(', ')} (hitSlop ${slopLiteral ? `${slop.horizontal}/${slop.vertical}` : 'niebędący literałem, liczony jako 0'}), wymagane ${MIN_TOUCH_PT} pt na każdej osi`,
      });
    }
  });

  return violations;
}

function allSourceFiles(): string[] {
  return [
    ...listSourceFiles(path.join(ROOT, 'app')),
    ...listSourceFiles(path.join(ROOT, 'src')),
  ];
}

describe('Skaner pola dotyku: każda interaktywna kontrolka ma co najmniej 44 pt (§2.4)', () => {
  test('skaner znajduje naruszenia w zbudowanym przykładzie (test samego skanera)', () => {
    const tmpDir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'touch-scan-'));
    const sample = path.join(tmpDir, 'Sample.tsx');
    fs.writeFileSync(
      sample,
      `import { Pressable, StyleSheet } from 'react-native';
const styles = StyleSheet.create({
  small: { width: 28, height: 28 },
  big: { width: 44, height: 44 },
  padded: { width: 28, height: 28 },
  minimum: { minWidth: 44, minHeight: 44 },
  tall: { height: 44 },
});
export const A = () => <Pressable style={styles.small} onPress={() => {}} />;
export const B = () => <Pressable style={styles.big} onPress={() => {}} />;
export const C = () => <Pressable style={styles.padded} hitSlop={8} onPress={() => {}} />;
export const D = () => <Pressable style={[styles.minimum]} onPress={() => {}} />;
export const E = () => <Pressable style={{ width: 30, height: 50 }} onPress={() => {}} />;
export const F = () => <Pressable hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={styles.small} onPress={() => {}} />;
export const G = () => <Pressable onPress={() => {}} />;
export const H = () => <Pressable style={styles.tall} onPress={() => {}} />;
export const I = () => <Pressable style={styles.tall} hitSlop={11} onPress={() => {}} />;
`
    );
    const violations = scanFileForTouchTargetViolations(sample);
    fs.rmSync(tmpDir, { recursive: true, force: true });

    expect(violations.map((v) => v.line)).toEqual([9, 13, 15, 16, 17]);
  });

  test('wyjątki wskazują rzeczywiste naruszenia i mają uzasadnienie', () => {
    const all = new Map<string, Violation>();
    for (const file of allSourceFiles()) {
      for (const v of scanFileForTouchTargetViolations(file)) {
        all.set(`${path.relative(ROOT, v.file)}:${v.line}`, v);
      }
    }
    for (const ex of TOUCH_TARGET_EXCEPTIONS) {
      expect(ex.reason.trim().length).toBeGreaterThan(20);
      expect(all.has(`${ex.file}:${ex.line}`)).toBe(true);
    }
  });

  test('żadna interaktywna kontrolka w app/ i src/ nie jest mniejsza niż 44 × 44 pt (bez wyjątku)', () => {
    const excepted = new Set(TOUCH_TARGET_EXCEPTIONS.map((e) => `${e.file}:${e.line}`));
    const failing: Violation[] = [];
    for (const file of allSourceFiles()) {
      for (const v of scanFileForTouchTargetViolations(file)) {
        if (!excepted.has(`${path.relative(ROOT, v.file)}:${v.line}`)) failing.push(v);
      }
    }
    const report = failing
      .map((v) => `${path.relative(ROOT, v.file)}:${v.line} <${v.component}> ${v.detail}`)
      .join('\n');
    expect(report).toBe('');
  });
});
