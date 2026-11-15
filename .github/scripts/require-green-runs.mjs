#!/usr/bin/env node
// Bramka wysyłki do TestFlight (M1-audytor-generalny-036, DEC-11 a; 10-wydanie-008).
// Wysyłka tylko wtedy, gdy na TYM SAMYM commicie ostatni przebieg CI (ci.yml) i E2E (e2e-ios.yml)
// zakończył się sukcesem. Brak przebiegu, przebieg w toku albo inny wynik = błąd przed archiwizacją.
// *Dlaczego:* build b1028 (c71a71a) trafił do testerów przy czerwonym „E2E iOS (Maestro)”.
//
// Użycie: node require-green-runs.mjs <owner/repo> <sha>   (wymaga `gh` z GH_TOKEN i uprawnieniem actions: read)
// Kod wyjścia: 0 — oba zielone; 1 — brak zgody na wysyłkę; 2 — zły argument albo błąd API.
import { execFileSync } from 'node:child_process';

const REQUIRED = [
  { path: '.github/workflows/ci.yml', label: 'CI' },
  { path: '.github/workflows/e2e-ios.yml', label: 'E2E iOS (Maestro)' },
];

const [repo, sha] = process.argv.slice(2);
if (!/^[\w.-]+\/[\w.-]+$/.test(repo ?? '') || !/^[0-9a-f]{40}$/.test(sha ?? '')) {
  console.error('::error::Użycie: require-green-runs.mjs <owner/repo> <pełny SHA>');
  process.exit(2);
}

let runs;
try {
  const out = execFileSync('gh', ['api', `repos/${repo}/actions/runs?head_sha=${sha}&per_page=100`], {
    encoding: 'utf8',
    maxBuffer: 1 << 26,
  });
  runs = JSON.parse(out).workflow_runs;
  if (!Array.isArray(runs)) throw new Error('odpowiedź API bez workflow_runs');
} catch (e) {
  console.error(`::error::Nie udało się pobrać przebiegów dla ${sha}: ${e.message}`);
  process.exit(2);
}

const problems = [];
for (const { path, label } of REQUIRED) {
  const latest = runs
    .filter((r) => r.path === path && r.head_sha === sha)
    .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)) || b.id - a.id)[0];
  if (!latest) {
    problems.push(`${label} (${path}): brak przebiegu na ${sha}. Uruchom go na tym commicie i ponów wysyłkę.`);
  } else if (latest.status !== 'completed' || latest.conclusion !== 'success') {
    problems.push(`${label} (${path}): ostatni przebieg ${latest.html_url ?? latest.id} ma stan ${latest.status}/${latest.conclusion ?? '—'}.`);
  } else {
    console.log(`OK ${label}: ${latest.html_url ?? latest.id} (success)`);
  }
}

if (problems.length) {
  for (const p of problems) console.error(`::error::${p}`);
  console.error(`::error::Wysyłka do TestFlight zablokowana: CI i E2E muszą być zielone na ${sha} (DEC-11 a).`);
  process.exit(1);
}
console.log(`Bramka spełniona: CI i E2E zielone na ${sha}.`);
