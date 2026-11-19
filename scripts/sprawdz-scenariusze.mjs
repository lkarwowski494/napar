// sprawdz-scenariusze.mjs — bramka scenariuszy użytkownika (D-060). Kod 0 zielona, 1 czerwona.
// --statycznie (CI PR) | --build <n>|z-protokolu --wykonane <plik> (przed buildem TestFlight)
// --protokol <n> (przed wysyłką buildu <n> do recenzji) | --szkielet <n> (protokół F buildu <n>, przed buildem)
// Poprzedni wysłany build: najwyższy tag v*-b<N> poniżej <n>; bez tagów: docs/wydanie/ostatni-build.txt.
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const arg = (n) => { const i = process.argv.indexOf(n); return i < 0 ? undefined : process.argv[i + 1] ?? ''; };
const KATALOG = 'docs/jakosc/przypadki-uzycia.md';
const PROTOKOLY = 'docs/jakosc/test-fizyczny';
const OSTATNI = 'docs/wydanie/ostatni-build.txt';
const bledy = [];
const wiersze = (t, re = /^\|\s*PU-\d{3}\s*\|/) => t.split('\n').filter((l) => re.test(l)).map((l) => l.split('|').slice(1, -1).map((k) => k.trim()));
const kody = (k) => [...(k || '').matchAll(/`([^`]+)`/g)].map((m) => m[1]);
const calk = (x) => (/^\d+$/.test((x ?? '').trim()) ? Number(x) : NaN);
const plikOk = (f) => existsSync(f) && statSync(f).isFile();
const git = (...a) => { try { return execFileSync('git', a, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { return null; } };
function ekranyZKatalogu(dir, pre = '') {
  return readdirSync(dir).flatMap((n) => {
    if (/^[_.]/.test(n) || (n.startsWith('+') && !n.startsWith('+not-found')) || /(\+api|\.test|\.spec|\.d)\.\w+$/.test(n)) return [];
    if (statSync(join(dir, n)).isDirectory()) return ekranyZKatalogu(join(dir, n), `${pre}${n}/`);
    return /\.(tsx|jsx|ts|js)$/.test(n) ? [`${pre}${n.replace(/\.\w+$/, '')}`] : [];
  });
}
function koniec() {
  if (bledy.length) { console.error(`BRAMKA CZERWONA (${bledy.length}):\n- ${bledy.join('\n- ')}`); process.exit(1); }
  console.log('BRAMKA ZIELONA'); process.exit(0);
}

if (!existsSync(KATALOG)) { bledy.push(`brak ${KATALOG}`); koniec(); }
const tekst = readFileSync(KATALOG, 'utf8');
const czesci = tekst.split(/^## /m);
const sekcja = (n) => (czesci.find((c) => c.startsWith(`${n}\n`) || c.startsWith(`${n}\r`)) || '');
const pu = wiersze(czesci[0]).map(([id, funkcja, cel, warianty, ekrany, klasa, test, powrot]) => ({ id, funkcja: kody(funkcja), cel: cel || '', warianty: warianty || '', ekrany: kody(ekrany), klasa, test: test || '', powrot: powrot || '' }));
const funkcje = wiersze(sekcja('Funkcje'), /^\|\s*`/).map((k) => kody(k[0])[0]);
const wyjatki = new Map(wiersze(sekcja('Wyjątki B')).map(([id, powod, termin]) => [id, { powod: powod || '', termin: calk(termin) }]));
const obce = tekst.split('\n').filter((l) => /^\|\s*PU-/i.test(l) && !/^\|\s*PU-\d{3}\s*\|.*\|\s*$/.test(l));
const poza = czesci.slice(1).filter((c) => !c.startsWith('Wyjątki B')).flatMap((c) => wiersze(c));
if (obce.length || poza.length) bledy.push(`wiersze PU poza główną tabelą albo z ID innym niż PU-NNN: ${[...obce, ...poza.map((k) => k[0])].join('; ')}`);
const numery = existsSync(PROTOKOLY) ? readdirSync(PROTOKOLY).map((f) => calk(f.replace(/\.md$/, ''))).filter(Number.isInteger) : [];
const tryb = arg('--szkielet') !== undefined ? 'szkielet' : arg('--protokol') !== undefined ? 'protokol' : process.argv.includes('--statycznie') ? 'statycznie' : 'pelny';
if (process.argv.slice(2).filter((a) => ['--szkielet', '--protokol', '--statycznie', '--build'].includes(a)).length > 1) bledy.push('jeden tryb na wywołanie: --statycznie | --build | --protokol | --szkielet');
const build = arg('--build') === 'z-protokolu' && numery.length ? Math.max(...numery) : calk(arg('--build'));

const naglowek = tekst.match(/^Ekrany: (katalog|lista) (.+)$/m);
const router = ['app', 'src/app'].find((d) => existsSync(d));
if (!naglowek) bledy.push('brak linii „Ekrany: katalog `<dir>`” albo „Ekrany: lista `a`, `b`”');
else if (router && !(naglowek[1] === 'katalog' && kody(naglowek[2])[0] === router)) bledy.push(`Ekrany: przy routerze plikowym wymagany katalog \`${router}\``);
const inwentarz = !naglowek ? [] : naglowek[1] === 'lista' ? kody(naglowek[2]) : existsSync(kody(naglowek[2])[0] || '') ? ekranyZKatalogu(kody(naglowek[2])[0]) : (bledy.push(`brak katalogu ekranów ${naglowek[2]}`), []);
if (!pu.length) bledy.push('katalog nie ma żadnego PU');
if (!funkcje.length) bledy.push('sekcja „## Funkcje” jest pusta: wypisz każdą funkcję aplikacji');

const widziane = new Set();
for (const p of pu) {
  if (widziane.has(p.id)) bledy.push(`${p.id}: zdublowane ID`); widziane.add(p.id);
  if (!['A', 'B', 'F'].includes(p.klasa)) bledy.push(`${p.id}: klasa „${p.klasa}” (dozwolone A, B, F)`);
  if (!p.funkcja.length || p.funkcja.some((f) => !funkcje.includes(f))) bledy.push(`${p.id}: funkcja spoza sekcji „## Funkcje”`);
  if (p.cel.length < 15) bledy.push(`${p.id}: brak celu użytkownika od początku do końca`);
  if (p.warianty.length < 10 && !/^n\/d: .{5,}/.test(p.warianty)) bledy.push(`${p.id}: kolumna „Warianty i błędy” pusta (albo „n/d: <powód>”)`);
  if (!p.ekrany.length) bledy.push(`${p.id}: brak ekranów`);
  for (const e of p.ekrany) if (naglowek && !inwentarz.includes(e)) bledy.push(`${p.id}: ekran \`${e}\` nie istnieje w inwentarzu`);
  if (p.klasa === 'A') {
    const pliki = kody(p.test);
    const tresc = pliki.filter(plikOk).map((f) => readFileSync(f, 'utf8')).join('\n');
    if (!pliki.length || pliki.some((f) => !plikOk(f) || !readFileSync(f, 'utf8').includes(p.id))) bledy.push(`${p.id}: klasa A wymaga pliku scenariusza, który zawiera „${p.id}” (${p.test || 'pusto'})`);
    else for (const e of p.ekrany) {
      if (!tresc.includes(`ekran:${e}`)) bledy.push(`${p.id}: scenariusz nie odwiedza ekranu \`${e}\` (brak „ekran:${e}”: testID korzenia ekranu)`);
      if (p.powrot === 'tak' && !tresc.includes(`powrót: ${e}`)) bledy.push(`${p.id}: brak kroku powrotu z \`${e}\` („# powrót: ${e}” przy akcji wstecz)`);
    }
  }
  if (p.klasa === 'F' && p.test.length < 10) bledy.push(`${p.id}: klasa F bez kroków i oczekiwanego wyniku`);
  if (p.klasa === 'B') {
    const w = wyjatki.get(p.id);
    if (!w || w.powod.length < 10 || !Number.isInteger(w.termin)) bledy.push(`${p.id}: klasa B bez wyjątku (powód i build-termin liczbą w „Wyjątki B”)`);
    else if (tryb === 'pelny' && build > w.termin) bledy.push(`${p.id}: wyjątek B po terminie (build ${w.termin}); zaprogramuj scenariusz`);
    else if (tryb === 'pelny' && w.termin > build + 3) bledy.push(`${p.id}: termin wyjątku B dalej niż 3 buildy naprzód`);
  }
  if (p.powrot !== 'tak' && !/^n\/d: .{5,}/.test(p.powrot)) bledy.push(`${p.id}: kolumna Powrót ma mieć „tak” albo „n/d: <powód>”`);
}
for (const e of inwentarz) if (!pu.some((p) => p.ekrany.includes(e))) bledy.push(`ekran \`${e}\` nie ma żadnego PU: dopisz scenariusz w ${KATALOG}`);
for (const f of funkcje) if (!pu.some((p) => p.funkcja.includes(f))) bledy.push(`funkcja \`${f}\` nie ma żadnego PU`);

const F = pu.filter((p) => p.klasa === 'F').map((p) => ({ ...p, od: calk((p.test.match(/\(od buildu (\d+)\)/) || [])[1]) }));
const graniczny = tryb === 'szkielet' ? calk(arg('--szkielet')) : build;
for (const p of F) if (Number.isInteger(p.od) && Number.isInteger(graniczny) && p.od > graniczny) bledy.push(`${p.id}: „(od buildu ${p.od})” późniejsze niż build ${graniczny}`);
function protokolZamkniety(n) {
  const plik = join(PROTOKOLY, `${n}.md`);
  if (!plikOk(plik)) return bledy.push(`brak protokołu F buildu ${n}: ${plik} (test wykonuje właściciel na buildzie z TestFlight)`);
  const lista = wiersze(readFileSync(plik, 'utf8'));
  const wyniki = new Map(lista.map((k) => [k[0], k[k.length - 1]]));
  if (wyniki.size !== lista.length) bledy.push(`${plik}: zdublowane pozycje`);
  for (const p of F) if (!wyniki.has(p.id) && !(p.od > n)) bledy.push(`${plik}: brak pozycji ${p.id} (nowa pozycja F: dopisz w katalogu „(od buildu <n>)”)`);
  for (const [id, w] of wyniki) if (!(w === 'OK' || /^BŁĄD → \S+/.test(w) || (/^POMINIĘTE: /.test(w) && new Set(w.slice(11).replace(/\s/g, '')).size >= 8))) bledy.push(`${plik}: ${id} bez wyniku („${w}”): OK | BŁĄD → <ID> | POMINIĘTE: <uzasadnienie zdaniem>`);
}
// Poprzedni wysłany build: tagi v*-b<N> (workflow taguje po wysyłce), bez tagów plik OSTATNI (skrypt wydania po wysyłce).
function wyslane() {
  const tagi = (git('tag', '--list', 'v*-b*') || '').split('\n').map((t) => calk((t.match(/-b(\d+)$/) || [])[1])).filter(Number.isInteger);
  if (tagi.length) return { zrodlo: 'tagi v*-b<N>', numery: tagi };
  if (plikOk(OSTATNI)) { const n = calk(readFileSync(OSTATNI, 'utf8')); return { zrodlo: OSTATNI, numery: Number.isInteger(n) ? [n] : (bledy.push(`${OSTATNI}: numer liczbą`), []) }; }
  return { zrodlo: 'brak tagów v*-b<N> i pliku ' + OSTATNI, numery: [] };
}

if (tryb === 'szkielet') {
  const n = calk(arg('--szkielet')); const plik = join(PROTOKOLY, `${n}.md`);
  if (!Number.isInteger(n)) bledy.push('--szkielet <n>: numer buildu liczbą całkowitą');
  else if (existsSync(plik)) bledy.push(`${plik} już istnieje (nie nadpisuję wyników właściciela)`);
  if (bledy.length) koniec();
  mkdirSync(PROTOKOLY, { recursive: true });
  writeFileSync(plik, `# Test fizyczny — build ${n}\n\nWykonuje właściciel na buildzie ${n} zainstalowanym z TestFlight. Wynik: OK | BŁĄD → <ID zgłoszenia> | POMINIĘTE: <uzasadnienie>\n\n| PU | Cel użytkownika | Kroki i oczekiwany wynik | Wynik |\n|---|---|---|---|\n${F.filter((p) => !(p.od > n)).map((p) => `| ${p.id} | ${p.cel} | ${p.test} | — |`).join('\n')}\n`, { flag: 'wx' });
  console.log(`zapisano ${plik}`); process.exit(0);
}
if (tryb === 'protokol') protokolZamkniety(calk(arg('--protokol')));
if (tryb === 'pelny') {
  if (!Number.isInteger(build)) bledy.push('tryb pełny wymaga --build <n> liczbą całkowitą albo z-protokolu (w CI PR: --statycznie)');
  else {
    const prz = tekst.match(/^Przegląd: build (\d+) @ ([0-9a-f]{7,40})/m);
    if (!prz || Number(prz[1]) !== build) bledy.push(`katalog nie ma linii „Przegląd: build ${build} @ <sha>”: przejrzyj zmiany od poprzedniego buildu i zaktualizuj funkcje, PU i warianty`);
    if (!numery.includes(build)) bledy.push(`brak ${PROTOKOLY}/${build}.md na tym SHA: --szkielet ${build} i commit przed buildem`);
    const w = wyslane();
    if (w.numery.some((n) => n >= build)) bledy.push(`build ${build} nie jest wyższy niż już wysłany (${w.zrodlo}: ${Math.max(...w.numery)}); numer buildu rośnie w całej aplikacji`);
    const poprzedni = w.numery.filter((n) => n < build);
    if (poprzedni.length) protokolZamkniety(Math.max(...poprzedni));
    else if (numery.some((n) => n < build)) bledy.push(`protokoły starszych buildów istnieją, a ${w.zrodlo}: przywróć źródło numeru wysłanych buildów`);
    const wyk = arg('--wykonane');
    if (!wyk || !plikOk(wyk)) bledy.push('tryb pełny wymaga --wykonane <plik> z przebiegu E2E na tym SHA (1. linia: sha, potem „plik<TAB>PASS”)');
    else {
      const [sha, ...l] = readFileSync(wyk, 'utf8').trim().split('\n').map((x) => x.trim());
      const head = process.env.GITHUB_SHA || git('rev-parse', 'HEAD');
      const roznica = head && sha !== head ? git('diff', '--name-only', sha, head) : '';
      if (!head || roznica === null || roznica.split('\n').some((f) => f && !f.startsWith('docs/jakosc/'))) bledy.push(`--wykonane: przebieg E2E z innego SHA (${sha}) niż kandydat (${head}) z różnicą poza docs/jakosc/`);
      const ok = new Set(l.filter((x) => /\tPASS$/.test(x)).map((x) => x.split('\t')[0]));
      for (const p of pu.filter((x) => x.klasa === 'A')) for (const f of kody(p.test)) if (!ok.has(f)) bledy.push(`${p.id}: ${f} nie przeszedł w przebiegu E2E na tym SHA`);
    }
  }
}
console.log(`PU: ${pu.length}, w tym F: ${F.length}; funkcje: ${funkcje.length}; ekrany: ${inwentarz.length}`);
koniec();
