// M1-audytor-generalny-043 (07-jakosc-013): skrypt `prepare` — ustawia katalog hooków repo (.githooks),
// żeby `git push` uruchamiał `npm run verify` (.githooks/pre-push). Bez zależności npm.
// Pomija: CI (CI=true), brak programu git, katalog, który nie jest korzeniem własnego repo (np. paczka
// w node_modules cudzego projektu), oraz już ustawiony inny core.hooksPath (np. .husky dewelopera).
// Nigdy nie przerywa instalacji paczek (przegląd partii 5, P2).
import { execFileSync } from 'node:child_process';
import { existsSync, realpathSync } from 'node:fs';

const git = (...args) => execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();

try {
  if (process.env.CI === 'true' || process.env.CI === '1') process.exit(0);
  if (!existsSync('.githooks/pre-push')) process.exit(0);
  let top;
  try {
    top = git('rev-parse', '--show-toplevel');
  } catch {
    process.exit(0); // brak repo albo brak programu git
  }
  if (realpathSync(top) !== realpathSync(process.cwd())) process.exit(0); // nie nasze repo
  let current = '';
  try {
    current = git('config', '--local', '--get', 'core.hooksPath');
  } catch {
    current = '';
  }
  if (current && current !== '.githooks') {
    console.log(`[hooks] core.hooksPath = ${current} — bez zmian; pre-push z verify: .githooks/pre-push`);
    process.exit(0);
  }
  if (current !== '.githooks') git('config', '--local', 'core.hooksPath', '.githooks');
  console.log('[hooks] core.hooksPath = .githooks (pre-push: npm run verify)');
} catch (e) {
  console.log(`[hooks] pominięto: ${e instanceof Error ? e.message : String(e)}`);
}
process.exit(0);
