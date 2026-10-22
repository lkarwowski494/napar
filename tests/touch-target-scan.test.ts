// ============================================================================
// Napar (Steepwise) — Skaner minimalnego pola dotyku (CLAUDE.md §2.4, NFR-A11Y)
// Każda interaktywna kontrolka (Pressable / TouchableOpacity / ...) ma efektywny
// obszar dotyku co najmniej 44 × 44 pt: przez width/height/minWidth/minHeight
// albo przez hitSlop, który dopełnia obszar. Skaner działa statycznie na AST.
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
]);

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

export function scanFileForTouchTargetViolations(
  filePath: string,
  onUnsized?: (line: number, component: string) => void
): Violation[] {
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

    // Efektywny rozmiar: największa z wartości width/minWidth (osobno dla osi)
    const sizes = { width: undefined as number | undefined, height: undefined as number | undefined };
    for (const src of sources) {
      const s = sizeFromObject(src);
      const w = [s.width, s.minWidth].filter((v): v is number => v !== undefined);
      const h = [s.height, s.minHeight].filter((v): v is number => v !== undefined);
      if (w.length) sizes.width = Math.max(sizes.width ?? -Infinity, ...w);
      if (h.length) sizes.height = Math.max(sizes.height ?? -Infinity, ...h);
    }

    const slop = hitSlopExtent(hitSlopAttr);
    const line = node.loc ? node.loc.start.line : 0;
    const component = node.name.name;

    if (sizes.width === undefined && sizes.height === undefined) {
      // Rozmiar wynika z zawartości; nie da się go sprawdzić statycznie
      onUnsized?.(line, component);
      return;
    }
    if (slop === undefined) {
      violations.push({
        file: filePath,
        line,
        component,
        detail: 'hitSlop nie jest liczbą literalną, nie da się sprawdzić obszaru dotyku',
      });
      return;
    }
    const failingAxes: string[] = [];
    if (sizes.width !== undefined && sizes.width + 2 * slop.horizontal < MIN_TOUCH_PT) {
      failingAxes.push(`szerokość ${sizes.width}`);
    }
    if (sizes.height !== undefined && sizes.height + 2 * slop.vertical < MIN_TOUCH_PT) {
      failingAxes.push(`wysokość ${sizes.height}`);
    }
    if (failingAxes.length) {
      violations.push({
        file: filePath,
        line,
        component,
        detail: `${failingAxes.join(', ')} pt (hitSlop ${slop.horizontal}/${slop.vertical}), wymagane ${MIN_TOUCH_PT}`,
      });
    }
  });

  return violations;
}

describe('Skaner pola dotyku: interaktywne kontrolki mają co najmniej 44 pt (§2.4)', () => {
  const files = [
    ...listSourceFiles(path.join(ROOT, 'app')),
    ...listSourceFiles(path.join(ROOT, 'src')),
  ];

  test('skaner znajduje naruszenie w zbudowanym przykładzie (test samego skanera)', () => {
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
});
export const A = () => <Pressable style={styles.small} onPress={() => {}} />;
export const B = () => <Pressable style={styles.big} onPress={() => {}} />;
export const C = () => <Pressable style={styles.padded} hitSlop={8} onPress={() => {}} />;
export const D = () => <Pressable style={[styles.minimum]} onPress={() => {}} />;
export const E = () => <Pressable style={{ width: 30, height: 50 }} onPress={() => {}} />;
export const F = () => <Pressable hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={styles.small} onPress={() => {}} />;
`
    );
    const violations = scanFileForTouchTargetViolations(sample);
    fs.rmSync(tmpDir, { recursive: true, force: true });

    expect(violations.map((v) => v.line)).toEqual([8, 12]);
  });

  test('żadna interaktywna kontrolka w app/ i src/ nie jest mniejsza niż 44 × 44 pt', () => {
    const all: Violation[] = [];
    for (const file of files) {
      all.push(...scanFileForTouchTargetViolations(file));
    }
    const report = all
      .map((v) => `${path.relative(ROOT, v.file)}:${v.line} <${v.component}> ${v.detail}`)
      .join('\n');
    expect(report).toBe('');
  });
});
