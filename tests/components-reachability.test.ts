// Komponenty i moduły bez drogi importu z ekranów app/ to martwy kod (M1-audytor-generalny-010; DEC-02 a, przekazanie do 08).
// Bramka check:reachability traktuje src/components jako korzeń, więc nie widzi nieużywanych komponentów.
import fs from 'fs';
import path from 'path';

const root = path.join(__dirname, '..');

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === '__tests__' || e.name === 'node_modules' ? [] : walk(p);
    return /\.(ts|tsx)$/.test(e.name) ? [p] : [];
  });
}

function resolveImport(from: string, spec: string): string | null {
  if (!spec.startsWith('.')) return null;
  const base = path.resolve(path.dirname(from), spec);
  for (const c of [base, `${base}.ts`, `${base}.tsx`, path.join(base, 'index.ts'), path.join(base, 'index.tsx')]) {
    if (fs.existsSync(c) && fs.statSync(c).isFile()) return c;
  }
  return null;
}

test('każdy plik w src/components ma drogę importu z ekranów app/ (nie tylko z testów albo z innych martwych plików)', () => {
  const seen = new Set<string>();
  const queue = walk(path.join(root, 'app'));
  while (queue.length) {
    const file = queue.pop()!;
    if (seen.has(file)) continue;
    seen.add(file);
    const text = fs.readFileSync(file, 'utf8');
    for (const m of text.matchAll(/(?:from\s+|require\()\s*['"]([^'"]+)['"]/g)) {
      const target = resolveImport(file, m[1]);
      if (target && !seen.has(target)) queue.push(target);
    }
  }
  const unused = walk(path.join(root, 'src', 'components')).filter((f) => !seen.has(f));
  expect(unused.map((f) => path.relative(root, f))).toEqual([]);
});
