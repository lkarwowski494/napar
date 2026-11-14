// ============================================================================
// Kontrakt E2E iOS (Maestro) — M1-audytor-generalny-012 (07-jakosc-002, 07-jakosc-006)
// Scenariusze i workflow sprawdzalne bez macOS: build z paczką JS, log zawsze w CI,
// każdy selektor tekstowy istnieje w słowniku PL, każdy selektor id istnieje jako testID.
// ============================================================================
import fs from 'fs';
import path from 'path';
import { translations } from '../src/core/i18n';

const root = path.join(__dirname, '..');
const wf = fs.readFileSync(path.join(root, '.github/workflows/e2e-ios.yml'), 'utf8');
const maestroDir = path.join(root, '.maestro');
const flows = fs.readdirSync(maestroDir).filter((f) => /^\d{2}-.*\.yaml$/.test(f));

function strings(o: unknown, out: Set<string>): Set<string> {
  if (typeof o === 'string') out.add(o);
  else if (o && typeof o === 'object') Object.values(o).forEach((v) => strings(v, out));
  return out;
}
const plTexts = strings(translations.pl, new Set<string>());

function codeTestIds(): Set<string> {
  const ids = new Set<string>();
  const walk = (dir: string) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (!['__tests__', 'node_modules'].includes(e.name)) walk(p);
      } else if (/\.tsx?$/.test(e.name)) {
        for (const m of fs.readFileSync(p, 'utf8').matchAll(/testID=["{`']+([A-Za-z0-9_-]+)/g)) ids.add(m[1]);
      }
    }
  };
  ['app', 'src'].forEach((d) => walk(path.join(root, d)));
  return ids;
}

test('build symulatora zawiera paczkę JS (Release albo FORCE_BUNDLING), nie Debug bez paczki', () => {
  expect(wf).not.toMatch(/-configuration Debug\b(?![\s\S]{0,200}FORCE_BUNDLING)/);
  expect(wf).toMatch(/-configuration Release|FORCE_BUNDLING=1/);
});

test('log Maestro trafia do CI także przy porażce, a zrzuty są artefaktem', () => {
  expect(wf).toMatch(/set \+e/);
  expect(wf).toMatch(/--test-output-dir/);
  expect(wf).toMatch(/if: always\(\)[\s\S]{0,200}upload-artifact/);
});

test('każdy selektor tekstowy scenariusza istnieje w słowniku PL, a każdy id istnieje jako testID', () => {
  const ids = codeTestIds();
  const missing: string[] = [];
  const typed = new Set<string>();
  for (const f of flows) {
    for (const m of fs.readFileSync(path.join(maestroDir, f), 'utf8').matchAll(/inputText:\s*"([^"]+)"/g)) typed.add(m[1]);
  }
  for (const f of flows) {
    const body = fs.readFileSync(path.join(maestroDir, f), 'utf8');
    for (const m of body.matchAll(/^\s*-\s*(?:tapOn|assertVisible):\s*"([^"]+)"/gm)) {
      if (!plTexts.has(m[1]) && !typed.has(m[1])) missing.push(`${f}: tekst „${m[1]}”`);
    }
    for (const m of body.matchAll(/id:\s*"([^"]+)"/g)) {
      if (!ids.has(m[1])) missing.push(`${f}: id „${m[1]}”`);
    }
  }
  expect(missing).toEqual([]);
});

test('jest scenariusz z wynikiem w danych (paczka zapisana w spiżarni) i sprawdzenie danych po ponownej instalacji', () => {
  const all = flows.map((f) => fs.readFileSync(path.join(maestroDir, f), 'utf8')).join('\n');
  expect(all).toMatch(/inputText:\s*"E2E Kenia"/);
  const after = flows.filter((f) => /aktualizacja-sprawdz/.test(f)).map((f) => fs.readFileSync(path.join(maestroDir, f), 'utf8')).join('\n');
  expect(after).toMatch(/assertVisible:\s*"E2E Kenia"/);
});

test('lista „tylko telefon” istnieje w repo', () => {
  const doc = path.join(root, 'docs', 'tylko-telefon.md');
  expect(fs.existsSync(doc)).toBe(true);
});
