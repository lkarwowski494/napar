// M1-audytor-generalny-028 (04-studio-projektowe-003): kontrast tokenów motywu.
// Tekst ≥ 4,5:1, elementy interfejsu (obrysy pól, chipów, puste gwiazdki) ≥ 3:1 (WCAG 2.2: 1.4.3, 1.4.11).
// Przezroczyste tła nałożone na tło karty tak jak na ekranie (copperMuted 15% na bgCard).
// Próg 7:1 z docs/scope-contract.md nie jest tu sprawdzany — to osobna decyzja właściciela (raport M2).
import fs from 'fs';
import path from 'path';
import { theme } from '../src/core/theme';
import { getContrastRatio, readableTextOn } from '../src/core/contrast';
import { SCA_FLAVOR_WHEEL as FLAVOR_WHEEL } from '../src/core/flavor-wheel-data';

const c = theme.colors as Record<string, string>;
const over = (rgba: string, base: string): string => {
  const m = rgba.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
  if (!m) return rgba;
  const [r, g, b, a] = [Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4])];
  const bb = [1, 3, 5].map((i) => parseInt(base.slice(i, i + 2), 16));
  return '#' + [r, g, b].map((v, i) => Math.round(v * a + bb[i] * (1 - a)).toString(16).padStart(2, '0')).join('');
};

const TEXT: [string, string, string][] = [
  ['textPrimary / bg', c.textPrimary, c.bg],
  ['textPrimary / bgCard', c.textPrimary, c.bgCard],
  ['textSecondary / bgCard', c.textSecondary, c.bgCard],
  ['textSecondary / bgCardSecondary', c.textSecondary, c.bgCardSecondary],
  ['textMuted / bgCard', c.textMuted, c.bgCard],
  ['textMuted / bgCardSecondary', c.textMuted, c.bgCardSecondary],
  ['copper (tekst) / bgCard', c.copper, c.bgCard],
  ['copper (tekst) / bgCardSecondary', c.copper, c.bgCardSecondary],
  ['copperLight (chip aktywny) / copperMuted na bgCard', c.copperLight, over(c.copperMuted, c.bgCard)],
  ['emeraldLight (tekst) / bgCard', c.emeraldLight, c.bgCard],
  ['statusPeak (tekst) / bgCard', c.statusPeak, c.bgCard],
  ['danger (tekst) / bgCard', c.danger, c.bgCard],
  ['onAccent / copper (przyciski główne)', c.onAccent, c.copper],
  ['onAccent / danger (przycisk wypełniony)', c.onAccent, c.danger],
  ['white / emerald', c.white, c.emerald],
];
const UI: [string, string, string][] = [
  ['borderStrong / bgCard (obrys pola, chipa)', c.borderStrong, c.bgCard],
  ['borderStrong / bgCardSecondary', c.borderStrong, c.bgCardSecondary],
  ['borderStrong / bg', c.borderStrong, c.bg],
  ['pusta gwiazdka (borderStrong) / bgCard', c.borderStrong, c.bgCard],
];

describe('M1-audytor-generalny-028: kontrast tokenów motywu (04-studio-projektowe-003)', () => {
  test.each(TEXT)('tekst %s ≥ 4,5:1', (_n, fg, bg) => {
    expect([fg, bg]).toEqual([expect.stringMatching(/^#[0-9A-F]{6}$/i), expect.stringMatching(/^#[0-9A-F]{6}$/i)]);
    expect(getContrastRatio(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });
  test.each(UI)('element interfejsu %s ≥ 3:1', (_n, fg, bg) => {
    expect([fg, bg]).toEqual([expect.stringMatching(/^#[0-9A-F]{6}$/i), expect.stringMatching(/^#[0-9A-F]{6}$/i)]);
    expect(getContrastRatio(fg, bg)).toBeGreaterThanOrEqual(3);
  });
  test('wybrany deskryptor smaku: tekst czytelny na kolorze każdej kategorii', () => {
    for (const cat of FLAVOR_WHEEL) {
      expect(getContrastRatio(readableTextOn(cat.color), cat.color)).toBeGreaterThanOrEqual(4.5);
    }
  });
});

// Statyczna kontrola stylów: tekst na wypełnionej miedzi nie jest biały; pola, chipy i puste gwiazdki nie używają
// obrysu `border` (1,26:1). Para „przycisk / tekst” po nazwie stylu: xBtn ↔ xBtnText (tak nazywa ją cały kod).
const root = path.join(__dirname, '..');
const walk = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return ['__tests__', 'node_modules'].includes(e.name) ? [] : walk(p);
    return /\.tsx$/.test(e.name) ? [p] : [];
  });
const files = ['app', 'src'].map((d) => path.join(root, d)).flatMap(walk);
const stylesOf = (s: string): Map<string, string> => {
  const m = new Map<string, string>();
  for (const x of s.matchAll(/^ {2}(\w+): \{\n([\s\S]*?)\n {2}\},?$/gm)) m.set(x[1], x[2]);
  return m;
};
const prop = (body: string, key: string): string | undefined => body.match(new RegExp(`\\b${key}: *([^,\\n]+)`))?.[1].trim();
const COPPER = /^(theme\.colors\.copper|'#D97736')$/i;
const WHITE = /^('#FFFFFF'|'#FFF'|theme\.colors\.white)$/i;

describe('M1-audytor-generalny-028: style ekranów', () => {
  test('tekst na przycisku wypełnionym miedzią nie jest biały (3,16:1)', () => {
    const bad: string[] = [];
    for (const f of files) {
      const st = stylesOf(fs.readFileSync(f, 'utf8'));
      for (const [name, body] of st) {
        const col = prop(body, 'color');
        if (!col || !WHITE.test(col)) continue;
        const base = name.replace(/(Text|Label|Txt|Title|Icon|Value)(Active|Selected)?$/, '$2');
        const fills = [...st].filter(([n, b]) => n !== name && (n === base || n.startsWith(base)) && COPPER.test(prop(b, 'backgroundColor') ?? ''));
        if (fills.length) bad.push(`${path.relative(root, f)}: ${name} na ${fills.map(([n]) => n).join(', ')}`);
      }
    }
    expect(bad).toEqual([]);
  });

  test('pola tekstowe, chipy i puste gwiazdki nie mają obrysu/koloru `border` (1,26:1)', () => {
    const bad: string[] = [];
    for (const f of files) {
      const s = fs.readFileSync(f, 'utf8');
      const st = stylesOf(s);
      const names = new Set<string>();
      for (const m of s.matchAll(/<(TextInput|Field)\b([\s\S]*?)\/?>/g)) for (const n of m[2].matchAll(/styles\.(\w+)/g)) names.add(n[1]);
      for (const n of st.keys()) {
        if (/chip|Chip|pill|Pill|Tag\b|tag$/.test(n) && !/Active|Selected|Text|Row|List|Wrap|Container|Label/.test(n)) names.add(n);
      }
      for (const n of names) {
        const b = st.get(n);
        if (b && prop(b, 'borderColor') === 'theme.colors.border') bad.push(`${path.relative(root, f)}: ${n} (borderColor)`);
      }
      for (const [n, b] of st) if (/^starIcon$/.test(n) && prop(b, 'color') === 'theme.colors.border') bad.push(`${path.relative(root, f)}: ${n} (color)`);
    }
    expect(bad).toEqual([]);
  });
});
