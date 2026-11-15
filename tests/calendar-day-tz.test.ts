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
import { evaluateRestingWindow } from '../src/core/domain-rules';
import { localISODate } from '../src/core/backup';
import { generateActionIcsContent } from '../src/core/bpr-engine';

/** Chwila w czasie lokalnym procesu (miesiąc 1–12). */
const local = (y: number, m: number, d: number, h: number, min: number) => new Date(y, m - 1, d, h, min, 0, 0);

describe('07-jakosc-008 · RD-07: dni od palenia liczone w lokalnych dniach kalendarzowych', () => {
  it(`[TZ=${process.env.TZ ?? '(domyślna)'}] palenie 2026-11-05: 23:59 lokalnie 11.11 → dzień 6 (degassing), 00:01 lokalnie 12.11 → dzień 7 (peak)`, () => {
    const before = evaluateRestingWindow('2026-11-05', local(2026, 11, 11, 23, 59));
    const after = evaluateRestingWindow('2026-11-05', local(2026, 11, 12, 0, 1));
    expect({ days: before.daysSinceRoast, stage: before.stage }).toEqual({ days: 6, stage: 'degassing' });
    expect({ days: after.daysSinceRoast, stage: after.stage }).toEqual({ days: 7, stage: 'peak' });
  });

  it('granice 35/36 i 60/61 dni zmieniają się o lokalnej północy', () => {
    expect(evaluateRestingWindow('2026-10-01', local(2026, 11, 5, 23, 59)).daysSinceRoast).toBe(35);
    expect(evaluateRestingWindow('2026-10-01', local(2026, 11, 6, 0, 1)).stage).toBe('stable');
    expect(evaluateRestingWindow('2026-09-01', local(2026, 10, 31, 23, 59)).stage).toBe('stable');
    expect(evaluateRestingWindow('2026-09-01', local(2026, 11, 1, 0, 1)).daysSinceRoast).toBe(61);
    expect(evaluateRestingWindow('2026-09-01', local(2026, 11, 1, 0, 1)).stage).toBe('aging');
  });

  it('przejście czasu (UE 25.10.2026, USA 1.11.2026, NZ 27.09.2026) nie przesuwa licznika dni', () => {
    // 7 dni kalendarzowych przez każde z przejść, minutę po lokalnej północy
    expect(evaluateRestingWindow('2026-10-20', local(2026, 10, 27, 0, 1)).daysSinceRoast).toBe(7);
    expect(evaluateRestingWindow('2026-10-28', local(2026, 11, 4, 0, 1)).daysSinceRoast).toBe(7);
    expect(evaluateRestingWindow('2026-09-24', local(2026, 10, 1, 0, 1)).daysSinceRoast).toBe(7);
    // i minutę przed północą wciąż 6
    expect(evaluateRestingWindow('2026-10-20', local(2026, 10, 26, 23, 59)).daysSinceRoast).toBe(6);
  });

  it('data palenia jako Date: liczy się jej lokalny dzień kalendarzowy', () => {
    expect(evaluateRestingWindow(local(2026, 11, 5, 23, 30), local(2026, 11, 12, 0, 1)).daysSinceRoast).toBe(7);
    expect(evaluateRestingWindow(local(2026, 11, 5, 0, 30), local(2026, 11, 11, 23, 59)).daysSinceRoast).toBe(6);
  });

  it('data palenia w przyszłości → 0; zła data kalendarzowa → komunikat o formacie', () => {
    expect(evaluateRestingWindow('2026-11-20', local(2026, 11, 12, 0, 1)).daysSinceRoast).toBe(0);
    expect(evaluateRestingWindow('2026-02-30', local(2026, 11, 12, 0, 1)).messageEn).toBe('Invalid roast date format');
  });
});

describe('07-jakosc-008 · „dziś” w interfejsie to lokalna data (domyślna data palenia, kalendarz, ICS)', () => {
  afterEach(() => jest.useRealTimers());

  it('minutę przed lokalną północą: localISODate i fallback ICS dają dzisiejszą lokalną datę', () => {
    jest.useFakeTimers().setSystemTime(local(2026, 11, 11, 23, 59));
    expect(localISODate()).toBe('2026-11-11');
    const ics = generateActionIcsContent({ id: 'a', titlePl: 'x', dateIso: '' } as any, 'pl');
    expect(ics).toContain('DTSTART:20261111T080000Z');
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
