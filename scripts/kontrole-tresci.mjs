// kontrole-tresci.mjs — kontrole mechaniczne treści względem rejestru twierdzeń. Bez zależności.
// Kopia skryptu z modułu „kontrole-mechaniczne” roli 06-tresci (biblioteka zasad 2026-10-18); wprowadzona w M1-audytor-generalny-019.
// Walidację rejestru uruchamia test tests/audit-fixes.test.tsx (M1-audytor-generalny-019) w npm run verify.
// Użycie: node kontrole-tresci.mjs <rejestr.json> <plik.md|katalog>... [--konfiguracja konf.json] [--przed-przegladem] [--przeglad zastępczy] [--skroty] [--inwentarz]
// Kod wyjścia: 0 bez błędów, 1 są błędy, 2 złe wywołanie.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';

const ZNACZNIK = /\[T:([^\]]*)\]/g; // [T:ID], [T:ID,ID]; [T:-] = zdanie bez twierdzenia
const SKROT = /(?:^|[\s(„"])(?:np|ok|r|w|ul|al|pl|św|tzw|m\.in|itd|itp|wg|tj|dr|prof|ks|nr|godz|min|tys|mln|mld|zob|por|gen|płk|cyt|maks|[IVXLCDM]+|[A-ZĄĆĘŁŃÓŚŹŻ])\.$/;
const KONIEC = /[.!?…]["”»)]*\s+(?=["„«(]?[A-ZĄĆĘŁŃÓŚŹŻ0-9])|\n(?=[ \t]*(?:[-*+]|\d+[.)])[ \t])|\n[ \t]*\n/g; // koniec zdania, punkt listy, akapit
const LICZBA = /(?<![\p{L}\d.,])([−-](?=\d))?(\d{1,3}(?:[ \u00a0\u202f]\d{3})+|\d+)(?:[.,](\d+))?(?![\d\p{L}])/gu;
const GRANICE = [ // formy z zaprzeczeniem przed prostymi
  ['<=', /(?<!\p{L})(?:≤|<=|nie więcej niż|nie wyższ\p{L}* niż|najwyżej|maksymalnie|maksimum|maks\.|nie przekracza\p{L}*|at most|no more than)\s*$/iu, /^\s*\S{0,8}\s*(?:lub mniej|lub niższ\p{L}*|or below|or less|or lower)/iu],
  ['>=', /(?<!\p{L})(?:≥|>=|nie mniej niż|nie niższ\p{L}* niż|co najmniej|przynajmniej|minimum|at least|no less than)\s*$/iu, /^\s*\S{0,8}\s*(?:lub więcej|lub wyższ\p{L}*|or above|or more|or higher)/iu],
  ['<', /(?<!\p{L})(?:<|poniżej|mniej niż|mniejsz\p{L}* (?:niż|od)|niższ\p{L}* niż|below|less than|under)\s*$/iu],
  ['>', /(?<!\p{L})(?:>|powyżej|ponad|więcej niż|większ\p{L}* (?:niż|od)|przekracza\p{L}*|wyższ\p{L}* niż|above|greater than|more than|over)\s*$/iu],
];

export function zdania(t) { // podział na zdania z ochroną skrótów („ul.”, „np.”, „XIX w.”, inicjały)
  const out = []; let s = 0;
  for (const m of t.matchAll(KONIEC)) {
    const k = m.index + m[0].trimEnd().length;
    if (SKROT.test(t.slice(Math.max(s, k - 8), k))) continue;
    out.push(t.slice(s, k).trim()); s = m.index + m[0].length;
  }
  out.push(t.slice(s).trim());
  return out.filter((z) => /\p{L}/u.test(z));
}

const JEDN = /^\s?(%|‰|°\s?[CF]|[kmµ]?g|[mcd]?l|L|[mck]?m|h|min|s|ppm)(?![\p{L}\d])/u;
const RZYM = /(?<!\p{L})([IVXLC]{1,7})(?=\s*(?:w\.|wiek|stuleci))/gu, R = { I: 1, V: 5, X: 10, L: 50, C: 100 };
const rzym = (r) => [...r].reduce((s, c, i) => s + (R[c] < (R[r[i + 1]] ?? 0) ? -R[c] : R[c]), 0);
export function liczby(t) { // [{ wartosc, granica, jednostka, surowa }], także minus i wiek rzymski
  const arabskie = [...t.matchAll(LICZBA)].map((m) => {
    const przed = t.slice(Math.max(0, m.index - 30), m.index), po = t.slice(m.index + m[0].length, m.index + m[0].length + 30);
    const g = GRANICE.find(([, pre, suf]) => pre.test(przed) || suf?.test(po));
    const wartosc = (m[1] ? -1 : 1) * Number(m[2].replace(/\D/g, '') + (m[3] ? '.' + m[3] : ''));
    return { wartosc, granica: g?.[0] ?? null, jednostka: po.match(JEDN)?.[1].replace(/\s/g, '') ?? null, surowa: m[0] };
  });
  return [...arabskie, ...[...t.matchAll(RZYM)].map((m) => ({ wartosc: rzym(m[1]), granica: null, jednostka: 'wiek', surowa: m[1] }))];
}

// Treść = jednostki zakończone znacznikiem; każda liczba z jednostką i granicą musi być w twierdzeniach ze znacznika.
export function sprawdzTekst(tekst, rejestr, plik = '') {
  const bledy = [], uwagi = [], uzycia = [], wg = new Map(rejestr.map((t) => [t.id, t]));
  const c = tekst.replace(/<!--[\s\S]*?-->/g, (s) => s.replace(/[^\n]/g, ' ')).replace(/^#.*$/gm, '');
  const gdzie = (i) => `${plik}:${c.slice(0, i).split('\n').length}`;
  let od = 0;
  for (const m of c.matchAll(ZNACZNIK)) {
    const tresc = c.slice(od, m.index), g = gdzie(od + Math.max(0, tresc.search(/\S/))), z = zdania(tresc);
    const ids = m[1].split(',').map((s) => s.trim()).filter(Boolean);
    od = m.index + m[0].length;
    if (!z.length || !ids.length) { bledy.push(`${g}: znacznik bez zdania albo bez ID`); continue; }
    if (z.length > 1) bledy.push(`${g}: zdanie bez znacznika: „${z[0].slice(0, 80)}”`);
    if (ids.join() === '-') { for (const n of liczby(tresc)) bledy.push(`${g}: liczba ${n.surowa} w zdaniu [T:-]`); continue; }
    const tw = [];
    for (const id of ids) {
      uzycia.push([id, z.join(' ')]);
      const t = wg.get(id);
      if (!t) bledy.push(`${g}: nieznane twierdzenie ${id}`);
      else if (t.status !== 'potwierdzone') bledy.push(`${g}: twierdzenie ${id} ma status „${t.status}”`);
      else tw.push(...liczby(t.twierdzenie), ...(t.wartosc != null ? [{ wartosc: Number(t.wartosc), granica: null, jednostka: null }] : []));
    }
    if (!ids.some((id) => wg.get(id)?.status === 'potwierdzone')) continue;
    const kryt = ids.some((id) => wg.get(id)?.krytyczne);
    for (const n of liczby(tresc)) {
      const w = tw.filter((x) => x.wartosc === n.wartosc), gr = w.filter((x) => x.granica);
      if (!w.length) bledy.push(`${g}: liczba ${n.surowa} nie występuje w ${ids.join(',')}`);
      else if (n.jednostka && w.every((x) => x.jednostka && x.jednostka !== n.jednostka)) bledy.push(`${g}: ${n.surowa} ${n.jednostka}, w rejestrze ${w[0].jednostka} (${ids.join(',')})`);
      else if (n.granica && gr.length && !gr.some((x) => x.granica === n.granica)) bledy.push(`${g}: granica „${n.granica} ${n.surowa}”, w rejestrze „${gr[0].granica}” (${ids.join(',')})`);
      else if (!n.granica && gr.length) (kryt ? bledy : uwagi).push(`${g}: ${n.surowa} bez słowa granicy, w rejestrze „${gr[0].granica}”`);
    }
  }
  const reszta = zdania(c.slice(od));
  if (reszta.length) bledy.push(`${gdzie(od + c.slice(od).search(/\p{L}/u))}: zdanie bez znacznika: „${reszta[0].slice(0, 80)}”`);
  return { bledy, uwagi, uzycia };
}
// Skrót zdań, w których użyto twierdzenia: przegląd człowieka dotyczy tej wersji tekstu (pole przeglad.sha).
export const skrot = (zd) => createHash('sha256').update([...zd].sort().join('\n')).digest('hex').slice(0, 12);

export const ZASTEPCZY = 'weryfikacja zastępcza (subagent)'; // D-027: ważny tylko z opcją przeglad „zastępczy”
// Rejestr: źródła, szczeble, przegląd krytycznych, jedna wartość wielkości, konfiguracja = rejestr.
export function sprawdzRejestr(rejestr, konfiguracja = [], opcje = {}, uwagi = []) {
  const bledy = [], wg = new Map(), wielk = new Map();
  for (const t of rejestr) {
    if (wg.has(t.id)) bledy.push(`rejestr: powtórzone ID ${t.id}`);
    wg.set(t.id, t);
    if (t.status !== 'potwierdzone') continue;
    const zr = t.zrodla ?? [];
    if (!zr.length || zr.some((z) => !z.adres || !(z.cytat || z.miejsce) || !/^\d{4}-\d\d-\d\d$/.test(z.odczyt ?? '') || ![1, 2, 3, 4, 5].includes(z.szczebel))) bledy.push(`rejestr ${t.id}: źródło bez adresu, cytatu lub miejsca, daty odczytu albo szczebla`);
    else if (zr.every((z) => z.szczebel === 5)) bledy.push(`rejestr ${t.id}: jedyne źródła ze szczebla 5`);
    const p = t.przeglad, zast = p?.kto === ZASTEPCZY && !/^zast[eę]pczy$/.test(opcje.przeglad ?? '');
    if (t.krytyczne && (zast || !(p?.kto && !/^</.test(p.kto) && /^\d{4}-\d\d-\d\d$/.test(p?.data ?? '') && /^[0-9a-f]{12}$/.test(p?.sha ?? '')))) (opcje.przedPrzegladem ? uwagi : bledy).push(`rejestr ${t.id}: krytyczne bez przeglądu człowieka${zast ? ' (zastępczy bez polityki D-027)' : ''}`);
    if (t.krytyczne && t.wartosc != null && !t.decyzja && zr.length && !zr.some((z) => z.szczebel <= 3)) bledy.push(`rejestr ${t.id}: liczba krytyczna bez źródła ze szczebla 1–3`);
    if (t.wielkosc) wielk.set(t.wielkosc, [...(wielk.get(t.wielkosc) ?? []), t]);
  }
  for (const [w, ts] of wielk) {
    if (new Set(ts.map((t) => `${Number(t.wartosc)} ${t.jednostka ?? ''}`)).size > 1 && !ts.every((t) => t.decyzja)) bledy.push(`rejestr: wielkość ${w} ma różne wartości bez decyzji: ${ts.map((t) => `${t.id}=${t.wartosc}`).join(', ')}`);
  }
  for (const p of konfiguracja) {
    const t = wg.get(p.twierdzenie);
    if (t?.status !== 'potwierdzone') bledy.push(`konfiguracja ${p.parametr}: twierdzenie ${p.twierdzenie ?? '(brak)'} nieznane albo niepotwierdzone`);
    else if (Number(p.wartosc) !== Number(t.wartosc) || (p.jednostka && t.jednostka && p.jednostka !== t.jednostka)) bledy.push(`konfiguracja ${p.parametr}=${p.wartosc}, rejestr ${t.id}=${t.wartosc}`);
  }
  return bledy;
}

const pliki = (p) => statSync(p).isDirectory() ? readdirSync(p).sort().flatMap((f) => pliki(join(p, f))) : ['.md', '.txt'].includes(extname(p)) ? [p] : [];

export function main(argv) {
  const a = { _: [] };
  for (let i = 0; i < argv.length; i++) ['--inwentarz', '--przed-przegladem', '--skroty', '--tylko-rejestr'].includes(argv[i]) ? (a[argv[i].slice(2)] = true) : argv[i].startsWith('--') ? (a[argv[i].slice(2)] = argv[++i]) : a._.push(argv[i]);
  if (a._.length < 1 || (!a['tylko-rejestr'] && a._.length < 2)) { console.error('Użycie: node kontrole-tresci.mjs <rejestr.json> (<plik|katalog>... | --tylko-rejestr) [opcje z nagłówka]'); return 2; }
  const rejestr = JSON.parse(readFileSync(a._[0], 'utf8'));
  const uwagi = [], uzycia = [], bledy = sprawdzRejestr(rejestr, a.konfiguracja ? JSON.parse(readFileSync(a.konfiguracja, 'utf8')) : [], { przedPrzegladem: a['przed-przegladem'], przeglad: a.przeglad }, uwagi);
  const plikiDocelowe = a['tylko-rejestr'] ? [] : a._.slice(1).flatMap(pliki);
  if (!a['tylko-rejestr'] && plikiDocelowe.length === 0) {
    bledy.push('brak plików tekstowych (.md/.txt) do sprawdzenia (użyj --tylko-rejestr, aby zweryfikować wyłącznie rejestr)');
  }
  for (const f of plikiDocelowe) {
    const t = readFileSync(f, 'utf8');
    if (a.inwentarz) { for (const z of zdania(t.replace(ZNACZNIK, ''))) console.log(`${f}\t${liczby(z).map((n) => (n.granica ?? '') + n.surowa).join(' ')}\t${z}`); continue; }
    const w = sprawdzTekst(t, rejestr, f); bledy.push(...w.bledy); uwagi.push(...w.uwagi); uzycia.push(...w.uzycia);
  }
  for (const t of rejestr.filter((x) => x.krytyczne && x.status === 'potwierdzone')) {
    const s = skrot(uzycia.filter(([id]) => id === t.id).map(([, z]) => z));
    if (!a.skroty && t.przeglad?.kto) console.log(`PRZEGLĄD ${t.id} ${t.przeglad.kto === ZASTEPCZY ? 'zastępczy' : 'człowiek'}`);
    if (a.skroty) console.log(`SKRÓT ${t.id} ${s}`);
    else if (t.przeglad?.sha && t.przeglad.sha !== s) (a['przed-przegladem'] ? uwagi : bledy).push(`rejestr ${t.id}: przegląd dotyczy innej wersji zdań (${t.przeglad.sha}, teraz ${s})`);
  }
  for (const b of bledy) console.log(`BŁĄD ${b}`);
  for (const u of uwagi) console.log(`UWAGA ${u}`);
  console.log(`${bledy.length} błędów, ${uwagi.length} uwag`);
  return bledy.length ? 1 : 0;
}
if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) process.exitCode = main(process.argv.slice(2));
