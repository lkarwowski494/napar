// ============================================================================
// M1-audytor-generalny-043 · 07-jakosc-008: dzień kalendarzowy liczony lokalnie, nie w UTC.
// Plik leży w tests/, bo workflow „Tests across Timezones” (.github/workflows/tests-tz.yml)
// uruchamia `npx jest tests/` w pętli po strefach: UTC, Europe/Warsaw, America/New_York,
// America/Los_Angeles, Asia/Tokyo, Pacific/Auckland, Pacific/Honolulu. Chwile budujemy z czasu
// lokalnego (new Date(r, m, d, h, min)), więc w każdej strefie test sprawdza minutę przed
// i minutę po LOKALNEJ północy.
// ============================================================================
import * as fs from 'fs';
import * as path from 'path';
import { localISODate } from '../src/data/backup';

/** Chwila w czasie lokalnym procesu (miesiąc 1–12). */
const local = (y: number, m: number, d: number, h: number, min: number) => new Date(y, m - 1, d, h, min, 0, 0);

describe('07-jakosc-008 · „dziś” w interfejsie to lokalna data (domyślna data palenia)', () => {
  afterEach(() => jest.useRealTimers());

  it('minutę przed lokalną północą: localISODate daje dzisiejszą lokalną datę', () => {
    jest.useFakeTimers().setSystemTime(local(2026, 11, 11, 23, 59));
    expect(localISODate()).toBe('2026-11-11');
  });

  it('minutę po lokalnej północy: następny dzień', () => {
    jest.useFakeTimers().setSystemTime(local(2026, 11, 12, 0, 1));
    expect(localISODate()).toBe('2026-11-12');
  });

  it('kod aplikacji nie bierze dnia kalendarzowego z toISOString().slice(0, 10) (data UTC)', () => {
    const root = path.join(__dirname, '..');
    const hits: string[] = [];
    const walk = (dir: string) => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, e.name);
        if (e.isDirectory()) {
          if (e.name !== '__tests__' && e.name !== 'node_modules') walk(full);
        } else if (/\.(ts|tsx)$/.test(e.name)) {
          const src = fs.readFileSync(full, 'utf8');
          if (/toISOString\(\)\.(slice\(0,\s*10\)|split\('T'\)\[0\])/.test(src)) hits.push(path.relative(root, full));
        }
      }
    };
    ['app', 'src', 'lib'].forEach((d) => walk(path.join(root, d)));
    expect(hits).toEqual([]);
  });
});

describe('07-jakosc-008 · workflow stref czasowych obejmuje ten plik', () => {
  it('tests-tz.yml uruchamia `npx jest tests/` w strefach, w tym Europe/Warsaw i America/New_York', () => {
    const wf = fs.readFileSync(path.join(__dirname, '..', '.github', 'workflows', 'tests-tz.yml'), 'utf8');
    const loop = wf.match(/for tz in ([^;]+);/);
    expect(loop).not.toBeNull();
    const zones = (loop as RegExpMatchArray)[1].trim().split(/\s+/);
    expect(zones).toEqual(expect.arrayContaining(['UTC', 'Europe/Warsaw', 'America/New_York']));
    expect(wf).toMatch(/TZ=\$tz npx jest tests\/ /);
    expect(path.relative(path.join(__dirname, '..'), __filename).startsWith('tests' + path.sep)).toBe(true);
  });
});
