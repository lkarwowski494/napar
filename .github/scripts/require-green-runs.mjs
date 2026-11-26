#!/usr/bin/env node
// Bramka wysyłki do TestFlight (M1-audytor-generalny-036, DEC-11 a; 10-wydanie-008; DEEP-006).
// Wysyłka tylko wtedy, gdy:
// - CI (ci.yml) zakończył się sukcesem na dokładnym <sha>, oraz
// - E2E (e2e-ios.yml) zakończył się sukcesem na <sha> albo na najbliższym przodku,
//   którego różnica względem <sha> dotyczy wyłącznie plików w docs/jakosc/
//   (spójnie z scripts/sprawdz-scenariusze.mjs — bez deadlocka przy commicie protokołu F).
//
// Użycie: node require-green-runs.mjs <owner/repo> <sha>   (wymaga `gh` z GH_TOKEN i uprawnieniem actions: read)
// Kod wyjścia: 0 — oba zielone; 1 — brak zgody na wysyłkę; 2 — zły argument albo błąd API.
import { execFileSync } from 'node:child_process';

const CI_PATH = '.github/workflows/ci.yml';
const E2E_PATH = '.github/workflows/e2e-ios.yml';

const [repo, sha] = process.argv.slice(2);
if (!/^[\w.-]+\/[\w.-]+$/.test(repo ?? '') || !/^[0-9a-f]{40}$/.test(sha ?? '')) {
  console.error('::error::Użycie: require-green-runs.mjs <owner/repo> <pełny SHA>');
  process.exit(2);
}

function fetchRunsForSha(targetSha) {
  const out = execFileSync('gh', ['api', `repos/${repo}/actions/runs?head_sha=${targetSha}&per_page=100`], {
    encoding: 'utf8',
    maxBuffer: 1 << 26,
  });
  const parsed = JSON.parse(out).workflow_runs;
  if (!Array.isArray(parsed)) throw new Error('odpowiedź API bez workflow_runs');
  return parsed;
}

function latestRun(runs, workflowPath, targetSha) {
  return runs
    .filter((r) => r.path === workflowPath && r.head_sha === targetSha)
    .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)) || b.id - a.id)[0];
}

function resolveDocsOnlyAncestors(targetSha) {
  try {
    const logOut = execFileSync('git', ['rev-list', '--first-parent', '-n', '20', targetSha], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    const candidates = logOut.split('\n').map((s) => s.trim()).filter(Boolean).slice(1);
    const eligible = [];
    for (const anc of candidates) {
      const diff = execFileSync('git', ['diff', '--name-only', anc, targetSha], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim();
      const files = diff ? diff.split('\n').filter(Boolean) : [];
      if (files.length > 0 && files.every((f) => f.startsWith('docs/jakosc/'))) {
        eligible.push(anc);
      } else {
        break;
      }
    }
    return eligible;
  } catch {
    return [];
  }
}

let headRuns;
try {
  headRuns = fetchRunsForSha(sha);
} catch (e) {
  console.error(`::error::Nie udało się pobrać przebiegów dla ${sha}: ${e.message}`);
  process.exit(2);
}

const problems = [];

const latestCi = latestRun(headRuns, CI_PATH, sha);
if (!latestCi) {
  problems.push(`CI (${CI_PATH}): brak przebiegu na ${sha}. Uruchom go na tym commicie i ponów wysyłkę.`);
} else if (latestCi.status !== 'completed' || latestCi.conclusion !== 'success') {
  problems.push(`CI (${CI_PATH}): ostatni przebieg ${latestCi.html_url ?? latestCi.id} ma stan ${latestCi.status}/${latestCi.conclusion ?? '—'}.`);
} else {
  console.log(`OK CI: ${latestCi.html_url ?? latestCi.id} (success)`);
}

let resolvedE2eSha = sha;
let latestE2e = latestRun(headRuns, E2E_PATH, sha);

if (!latestE2e) {
  for (const anc of resolveDocsOnlyAncestors(sha)) {
    try {
      const ancRuns = fetchRunsForSha(anc);
      const found = latestRun(ancRuns, E2E_PATH, anc);
      if (found) {
        latestE2e = found;
        resolvedE2eSha = anc;
        break;
      }
    } catch {
      // ignoruj błąd API dla przodka i spróbuj kolejnego
    }
  }
}

if (!latestE2e) {
  problems.push(`E2E iOS (Maestro) (${E2E_PATH}): brak przebiegu na ${sha}. Uruchom go na tym commicie i ponów wysyłkę.`);
} else if (latestE2e.status !== 'completed' || latestE2e.conclusion !== 'success') {
  problems.push(`E2E iOS (Maestro) (${E2E_PATH}): ostatni przebieg ${latestE2e.html_url ?? latestE2e.id} ma stan ${latestE2e.status}/${latestE2e.conclusion ?? '—'}.`);
} else {
  console.log(`OK E2E iOS (Maestro): ${latestE2e.html_url ?? latestE2e.id} (success, sha=${resolvedE2eSha})`);
}

if (problems.length) {
  for (const p of problems) console.error(`::error::${p}`);
  console.error(`::error::Wysyłka do TestFlight zablokowana: CI i E2E muszą być zielone na ${sha} (DEC-11 a).`);
  process.exit(1);
}
console.log(`Bramka spełniona: CI (sha=${sha}) i E2E (sha=${resolvedE2eSha}) zielone.`);
