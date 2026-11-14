// ============================================================================
// Napar (Steepwise) — Bramka osiągalności src/core (DEC-02, M1-audytor-generalny-010)
// Każda deklaracja w src/core ma drogę z app/ albo src/components/ albo nazwany
// wyjątek w scripts/reachability-exceptions.json. Test uruchamia ten sam skrypt
// co `npm run check:reachability`, żeby bramka działała też w CI (test:coverage).
// Dlaczego: pętle audytu P32–P105 dopisały ~64% funkcji src/core bez wejścia z UI.
// ============================================================================

import { spawnSync } from 'child_process';
import path from 'path';

describe('Bramka osiągalności src/core (03-zakres-003, DEC-02)', () => {
  test('żadna deklaracja src/core nie jest nieosiągalna z interfejsu poza listą wyjątków', () => {
    const root = path.join(__dirname, '..');
    const res = spawnSync(process.execPath, [path.join(root, 'scripts', 'check-reachability.mjs')], {
      cwd: root,
      encoding: 'utf8',
    });
    const out = `${res.stdout}\n${res.stderr}`;
    expect(out).toContain('OK: każda deklaracja src/core ma drogę z interfejsu');
    expect(res.status).toBe(0);
  }, 60000);
});
