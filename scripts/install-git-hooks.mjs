// M1-audytor-generalny-043 (07-jakosc-013): skrypt `prepare` — ustawia katalog hooków repo (.githooks),
// żeby `git push` uruchamiał `npm run verify` (.githooks/pre-push). Bez zależności npm.
// Pomija: brak repozytorium git (np. paczka bez .git), CI (CI=true) i brak programu git.
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';

if (process.env.CI === 'true' || process.env.CI === '1') {
  process.exit(0);
}
try {
  execFileSync('git', ['rev-parse', '--git-dir'], { stdio: 'ignore' });
} catch {
  process.exit(0);
}
if (!existsSync('.githooks/pre-push')) {
  process.exit(0);
}
execFileSync('git', ['config', 'core.hooksPath', '.githooks'], { stdio: 'inherit' });
console.log('[hooks] core.hooksPath = .githooks (pre-push: npm run verify)');
