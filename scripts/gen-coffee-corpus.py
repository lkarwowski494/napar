#!/usr/bin/env python3
"""
scripts/gen-coffee-corpus.py — wyrocznia dziedzinowa (ekstrakcja, twardość wody, eliminacja kofeiny).

M1-audytor-generalny-044 / 07-jakosc-010: wartości oczekiwane NIE są przepisane z kodu aplikacji.
Każdy wektor ma pole "zrodla" z co najmniej jednym odwołaniem:
  - "brd:<plik>:<linia>"  — wektor albo wzór zapisany w BRD (cytat sprawdzany w trybie --check),
  - "rejestr:<ID>"        — twierdzenie z rejestr.json ze statusem „potwierdzone” (adres, cytat, data odczytu),
albo pole "do_ustalenia" z powodem — wtedy test nie sprawdza tej wartości.
Rachunek z definicji liczony innym narzędziem niż kod aplikacji: ułamki dokładne (fractions)
i Decimal z precyzją 50 cyfr; w aplikacji: liczby double w TypeScript.

Użycie:  python3 -I scripts/gen-coffee-corpus.py --check   (porównuje z plikiem w repo, nic nie zapisuje)
         python3 -I scripts/gen-coffee-corpus.py --write   (zapisuje tests/fixtures/coffee-corpus.json)
"""

import json
import os
import sys
from decimal import Decimal, getcontext
from fractions import Fraction as F

getcontext().prec = 50
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join("tests", "fixtures", "coffee-corpus.json")

BRD_C2 = "napar_brd/Napar BRD 0.1 · C2 · rozdz. 8 reguly dziedzinowe - RD-01…RD-16 (ekstrakcja, ratio, TDS, woda).md"
BRD_C3 = "napar_brd/Napar BRD 0.1 · C3 · rozdz. 8 reguly dziedzinowe - RD-17…RD-30 (metabolizm kofeiny, Gongfu, wektory).md"

# Cytaty ze źródeł (sprawdzane w --check: tekst musi stać w podanej linii pliku).
BRD_CYTATY = {
    f"brd:{BRD_C2}:30": "Optymalny zakres według standardu Golden Cup wynosi **18.0% – 22.0%**",
    f"brd:{BRD_C2}:32": r"\frac{\text{Masa naparu (g)} \times \text{TDS (\%)}}{\text{Doza sucha (g)}}",
    f"brd:{BRD_C2}:35": "= 297.0 / 15.0 = 19.80",
    f"brd:{BRD_C2}:36": "**Ideal (Golden Cup)**",
    f"brd:{BRD_C2}:37": "Doza = 20.0 g, Napar = 300.0 g, TDS = 1.00% -> $EY = 15.0\\,\\%$ -> **Under-extracted**",
    f"brd:{BRD_C3}:9": r"C(t) = C_0 \cdot e^{-k_e \cdot t} = C_0 \cdot \left(\frac{1}{2}\right)^{\frac{t}{t_{1/2}}}",
    f"brd:{BRD_C3}:12": "C(5) = 120 \\times 0.5 = 60.0",
    f"brd:{BRD_C3}:13": "C(10) = 120 \\times 0.25 = 30.0",
    f"brd:{BRD_C3}:14": "C(15) = 120 \\times 0.125 = 15.0",
}

# Tolerancje: połowa jednostki zaokrąglenia wyniku, które robi aplikacja (EY: 2 miejsca, jak 19.80 w BRD RD-03;
# dH i kofeina: 4 miejsca), plus 1e-9 na reprezentację double. To decyzja testu, nie liczba dziedzinowa.
TOL_EY = 0.005 + 1e-9
TOL_4DP = 0.00005 + 1e-9

# Pola zrodla wektorów z ocenianym zakresem 18–22 %. Rejestr SCA-GOLDENCUP-EY ma status „otwarte”
# (strona SCA nie pokazuje standardu bez JavaScriptu, 2026-11-15) — zakres pochodzi z BRD RD-03.
UWAGA_SCA = "[DO USTALENIA] potwierdzenie zakresu 18–22 % u źródła SCA (rejestr SCA-GOLDENCUP-EY: otwarte)"


def dec(x):
    return Decimal(str(x))


def ey_exact(beverage, tds, dose):
    # BRD RD-03 (C2:32): EY % = masa naparu × TDS % / doza sucha — ułamek dokładny
    return F(str(beverage)) * F(str(tds)) / F(str(dose))


def ocena_ey(ey):
    """Ocena wg zakresu BRD RD-03 (C2:30). Granice i okolice granicy (±0,005 — zaokrąglenie wyniku przed oceną)
    nie są rozstrzygnięte w źródle: włączność granic i kolejność zaokrąglenia — wtedy brak oczekiwanej oceny."""
    lo, hi, d = F(18), F(22), F(5, 1000)
    if abs(ey - lo) <= d or abs(ey - hi) <= d:
        return None
    if ey < lo:
        return "under"
    if ey > hi:
        return "over"
    return "ideal"


def wektory_ey():
    out = []
    # 1. Wektory zapisane w BRD (wartość oczekiwana przepisana ze źródła, nie liczona)
    out.append({"id": "EY-BRD-RD03-1", "beverageGrams": 220.0, "tdsPercent": 1.35, "coffeeDoseGrams": 15.0,
                "expectedExtractionYieldPercent": 19.80, "expectedRating": "ideal",
                "zrodla": [f"brd:{BRD_C2}:35", f"brd:{BRD_C2}:36"], "metoda": "wartość ze źródła",
                "uwaga": UWAGA_SCA})
    out.append({"id": "EY-BRD-RD03-2", "beverageGrams": 300.0, "tdsPercent": 1.00, "coffeeDoseGrams": 20.0,
                "expectedExtractionYieldPercent": 15.0, "expectedRating": "under",
                "zrodla": [f"brd:{BRD_C2}:37"], "metoda": "wartość ze źródła", "uwaga": UWAGA_SCA})
    # 2. Rachunek z definicji BRD RD-03 (ułamki dokładne); w tym przypadki przy granicach zakresu
    przypadki = [
        (200.0, 1.20, 12.0), (300.0, 1.45, 18.0), (500.0, 1.10, 30.0), (150.0, 1.80, 10.0),
        (250.0, 0.90, 15.0), (250.0, 1.60, 15.0), (350.0, 1.25, 20.0), (240.0, 1.50, 15.0),
        (400.0, 1.38, 25.0), (36.0, 9.5, 18.0),
        (200.0, 1.35, 15.0),   # EY = 18 dokładnie (granica)
        (220.0, 1.50, 15.0),   # EY = 22 dokładnie (granica)
        (199.0, 1.35, 15.0),   # tuż poniżej 18
        (221.0, 1.50, 15.0),   # tuż powyżej 22
    ]
    for i, (bev, tds, dose) in enumerate(przypadki, 1):
        ey = ey_exact(bev, tds, dose)
        ocena = ocena_ey(ey)
        w = {"id": f"EY-DEF-{i:02d}", "beverageGrams": bev, "tdsPercent": tds, "coffeeDoseGrams": dose,
             "expectedExtractionYieldPercent": float(ey), "expectedRating": ocena,
             "zrodla": [f"brd:{BRD_C2}:32", f"brd:{BRD_C2}:30"], "metoda": "rachunek z definicji (fractions)",
             "uwaga": UWAGA_SCA}
        if ocena is None:
            w["do_ustalenia_ocena"] = "granica 18/22 % (±0,005): BRD RD-03 i cytat SCA nie mówią, czy granica należy do zakresu ani czy ocenia się wynik zaokrąglony"
        out.append(w)
    return out


def przedzial_dh():
    """Przelicznik ppm CaCO3 na 1 °dH: 10 mg CaO × M(CaCO3)/M(CaO), jako przedział z mas atomowych CIAAW."""
    Ca = (F("40.074"), F("40.082"))          # 40.078(4)
    C = (F("12.0096"), F("12.0116"))
    O = (F("15.99903"), F("15.99977"))
    ks = [F(10) * (ca + c + 3 * o) / (ca + o) for ca in Ca for c in C for o in O]
    return min(ks), max(ks)


def wektory_dh():
    kmin, kmax = przedzial_dh()
    out = []
    for i, ppm in enumerate([17.848, 50.0, 68.0, 80.0, 120.0, 150.0, 175.0, 200.0, 300.0], 1):
        p = F(str(ppm))
        lo, hi = p / kmax, p / kmin
        out.append({"id": f"DH-DEF-{i:02d}", "ppmCaCO3": ppm,
                    "expectedDegreesDHMin": float(lo), "expectedDegreesDHMax": float(hi),
                    "zrodla": ["rejestr:BMLUK-STOPIEN-DH", "rejestr:CIAAW-MASY-ATOMOWE"],
                    "metoda": "rachunek z definicji: °dH = ppm / (10 mg CaO × M(CaCO3)/M(CaO)), przedział z mas CIAAW (fractions)"})
    return out, (float(kmin), float(kmax))


def c_def(c0, t, t12):
    # BRD RD-17 (C3:9) w postaci wykładniczej: C0 · e^(−ln2 · t / t½) — Decimal, inna postać niż 0.5^(t/t½) w aplikacji
    return dec(c0) * (-(Decimal(2).ln()) * dec(t) / dec(t12)).exp()


def wektory_kofeina():
    out = []
    for i, (t, v, ln) in enumerate([(5.0, 60.0, 12), (10.0, 30.0, 13), (15.0, 15.0, 14)], 1):
        out.append({"id": f"KOF-BRD-RD17-{i}", "initialMg": 120.0, "elapsedHours": t, "halfLifeHours": 5.0,
                    "expectedRemainingMg": v, "zrodla": [f"brd:{BRD_C3}:{ln}"], "metoda": "wartość ze źródła"})
    n = 0
    for t12 in [2.0, 4.0, 5.0, 8.0]:     # 2–8 h: zakres EFSA (rejestr EFSA-T12-ZAKRES); t½ jest parametrem funkcji
        for c0 in [80.0, 120.0, 200.0]:
            for t in [0.0, 1.0, 2.5, 7.5, 24.0]:
                n += 1
                out.append({"id": f"KOF-DEF-{n:02d}", "initialMg": c0, "elapsedHours": t, "halfLifeHours": t12,
                            "expectedRemainingMg": float(c_def(c0, t, t12)),
                            "zrodla": [f"brd:{BRD_C3}:9"], "metoda": "rachunek z definicji (Decimal, postać e^(−ln2·t/t½))"})
    return out


# Znane rozjazdy kodu aplikacji ze źródłem: {"<id wektora>": "<ID znaleziska>"}. Kod aplikacji naprawia rola 08;
# po naprawie test Jest pada (rozjazd zniknął) i wpis trzeba usunąć. Stan 2026-11-15: brak rozjazdów.
ZNANE_ROZJAZDY = {}


def oznacz_rozjazdy(corpus):
    for w in (x for v in corpus.values() if isinstance(v, list) for x in v):
        if w["id"] in ZNANE_ROZJAZDY:
            w["znany_rozjazd"] = ZNANE_ROZJAZDY[w["id"]]
    return corpus


def zbuduj():
    dh, (kmin, kmax) = wektory_dh()
    return {
        "metadata": {
            "generator": "scripts/gen-coffee-corpus.py",
            "version": "2.0",
            "description": "Wyrocznia ze źródeł (M1-audytor-generalny-044, 07-jakosc-010): wartości z BRD albo z rejestru twierdzeń, rachunek z definicji innym narzędziem niż kod",
            "tolerancje": {"extractionYieldPercent": TOL_EY, "degreesDH": TOL_4DP, "remainingMg": TOL_4DP},
            "ppmCaCO3NaStopienDH": {"min": kmin, "max": kmax},
        },
        "extraction_yield": wektory_ey(),
        "water_hardness": dh,
        "caffeine_decay": wektory_kofeina(),
    }


def sprawdz_zrodla(corpus):
    bledy = []
    rejestr = {t["id"]: t for t in json.load(open(os.path.join(ROOT, "rejestr.json"), encoding="utf-8"))}
    for klucz, cyt in BRD_CYTATY.items():
        plik, linia = klucz[len("brd:"):].rsplit(":", 1)
        sciezka = os.path.join(ROOT, plik)
        if not os.path.isfile(sciezka):
            bledy.append(f"brak pliku źródła {plik}")
            continue
        linie = open(sciezka, encoding="utf-8").read().split("\n")
        n = int(linia)
        if n > len(linie) or cyt not in linie[n - 1]:
            bledy.append(f"cytat nie stoi w {plik}:{n}: {cyt}")
    for grupa in ("extraction_yield", "water_hardness", "caffeine_decay"):
        for w in corpus[grupa]:
            zr = w.get("zrodla") or []
            if not zr and not w.get("do_ustalenia"):
                bledy.append(f"{w['id']}: wektor bez źródła i bez [DO USTALENIA]")
            for z in zr:
                if z.startswith("brd:"):
                    if z not in BRD_CYTATY:
                        bledy.append(f"{w['id']}: odwołanie {z} bez cytatu")
                elif z.startswith("rejestr:"):
                    t = rejestr.get(z[8:])
                    if not t or t.get("status") != "potwierdzone" or not all(s.get("adres") and s.get("cytat") and s.get("odczyt") for s in t.get("zrodla", [])):
                        bledy.append(f"{w['id']}: {z} nie jest potwierdzonym twierdzeniem z adresem, cytatem i datą")
                else:
                    bledy.append(f"{w['id']}: nieznany rodzaj źródła {z}")
    # Wartości przepisane z BRD muszą się zgadzać z rachunkiem z definicji tego samego BRD (spójność źródła)
    for w in corpus["extraction_yield"]:
        if w["metoda"] == "wartość ze źródła":
            ey = ey_exact(w["beverageGrams"], w["tdsPercent"], w["coffeeDoseGrams"])
            if abs(float(ey) - w["expectedExtractionYieldPercent"]) > TOL_EY or ocena_ey(ey) != w["expectedRating"]:
                bledy.append(f"{w['id']}: wartość z BRD niezgodna z wzorem BRD")
    for w in corpus["caffeine_decay"]:
        if w["metoda"] == "wartość ze źródła":
            if abs(float(c_def(w["initialMg"], w["elapsedHours"], w["halfLifeHours"])) - w["expectedRemainingMg"]) > TOL_4DP:
                bledy.append(f"{w['id']}: wartość z BRD niezgodna z wzorem BRD")
    return bledy


def main(argv):
    tryb = argv[1] if len(argv) > 1 else "--check"
    corpus = oznacz_rozjazdy(zbuduj())
    tekst = json.dumps(corpus, ensure_ascii=False, indent=2) + "\n"
    bledy = sprawdz_zrodla(corpus)
    for b in bledy:
        print(f"[gen-coffee-corpus] BŁĄD źródła: {b}")
    if bledy:
        return 1
    sciezka = os.path.join(ROOT, OUT)
    if tryb == "--write":
        with open(sciezka, "w", encoding="utf-8") as f:
            f.write(tekst)
        print(f"[gen-coffee-corpus] zapisano {OUT}")
        return 0
    if tryb != "--check":
        print("Użycie: gen-coffee-corpus.py --check | --write")
        return 2
    obecny = open(sciezka, encoding="utf-8").read() if os.path.isfile(sciezka) else ""
    if obecny != tekst:
        print(f"[gen-coffee-corpus] BŁĄD: {OUT} różni się od wyroczni (ręczna zmiana albo nieaktualny plik); "
              f"sprawdź źródło, potem: python3 -I scripts/gen-coffee-corpus.py --write")
        return 1
    n = sum(len(corpus[k]) for k in ("extraction_yield", "water_hardness", "caffeine_decay"))
    print(f"[gen-coffee-corpus] OK: {n} wektorów zgodnych z {OUT}; każdy ze źródłem")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
