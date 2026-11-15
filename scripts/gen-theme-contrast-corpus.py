#!/usr/bin/env python3
"""
scripts/gen-theme-contrast-corpus.py — wyrocznia kontrastu WCAG 2.1 dla par kolorów motywu.

M1-audytor-generalny-044 / 07-jakosc-010: wzór pochodzi z tekstu W3C (rejestr WCAG21-KONTRAST, odczyt 2026-11-15),
liczony w Decimal z precyzją 50 cyfr (aplikacja: double w TypeScript). Kolory motywu są WEJŚCIEM (przedmiot testu)
i są czytane z src/core/theme.ts przy każdym przebiegu — kopia w skrypcie rozjechała się z motywem (textMuted, danger).
Wartości stwierdzone w źródle: 21 (biały/czarny) i 1 (ten sam kolor) — W3C: „Contrast ratios can range from 1 to 21”.

Użycie:  python3 -I scripts/gen-theme-contrast-corpus.py --check | --write
"""

import json
import os
import re
import sys
from decimal import Decimal, getcontext

getcontext().prec = 50
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join("tests", "fixtures", "theme-contrast-corpus.json")
THEME = os.path.join("src", "core", "theme.ts")
ZRODLO = "rejestr:WCAG21-KONTRAST"
TOL = 0.00005 + 1e-9  # aplikacja zaokrągla współczynnik do 4 miejsc (src/core/contrast.ts); decyzja testu
AA, AAA, DUZY = Decimal("4.5"), Decimal(7), Decimal(3)  # WCAG 2.1 SC 1.4.3 i 1.4.6 (rejestr WCAG21-KONTRAST)

PARY = [  # pary tekst/tło ciemnego motywu (theme.colors), jak w poprzedniej wersji korpusu
    ("textPrimary", "bg"), ("textPrimary", "bgCard"), ("textSecondary", "bgCard"), ("textMuted", "bgCard"),
    ("textMuted", "bgCardSecondary"), ("copperLight", "bg"), ("emeraldLight", "bg"), ("danger", "bg"),
    ("danger", "bgCard"), ("onAccent", "copper"),
]


def kanal(c8):
    # W3C: RsRGB = R8bit/255; if RsRGB <= 0.04045 then R = RsRGB/12.92 else R = ((RsRGB+0.055)/1.055) ^ 2.4
    s = Decimal(c8) / Decimal(255)
    if s <= Decimal("0.04045"):
        return s / Decimal("12.92")
    return ((s + Decimal("0.055")) / Decimal("1.055")) ** Decimal("2.4")


def luminancja(hexkol):
    h = hexkol.lstrip("#")
    r, g, b = (int(h[i:i + 2], 16) for i in (0, 2, 4))
    # W3C: L = 0.2126 * R + 0.7152 * G + 0.0722 * B
    return Decimal("0.2126") * kanal(r) + Decimal("0.7152") * kanal(g) + Decimal("0.0722") * kanal(b)


def kontrast(a, b):
    l1, l2 = sorted((luminancja(a), luminancja(b)), reverse=True)
    # W3C: contrast ratio (L1 + 0.05) / (L2 + 0.05), L1 — jaśniejszy
    return (l1 + Decimal("0.05")) / (l2 + Decimal("0.05"))


def kolory_motywu():
    tekst = open(os.path.join(ROOT, THEME), encoding="utf-8").read()
    start = tekst.index("\n  colors: {")
    blok = tekst[start:tekst.index("\n  },", start)]
    return dict(re.findall(r"^\s+(\w+):\s*'(#[0-9A-Fa-f]{6})'", blok, flags=re.M))


def wpis(id_, a, b, extra):
    r = kontrast(a, b)
    return {"id": id_, **extra, "foregroundHex": a, "backgroundHex": b, "contrastRatio": float(r),
            "passAA_NormalText": r >= AA, "passAA_LargeTextOrUI": r >= DUZY, "passAAA_NormalText": r >= AAA,
            "zrodla": [ZRODLO], "metoda": "rachunek z definicji W3C (Decimal)"}


# Znane rozjazdy kodu aplikacji ze źródłem: {"<id wektora>": "<ID znaleziska>"}. Kod aplikacji naprawia rola 08;
# po naprawie test Jest pada (rozjazd zniknął) i wpis trzeba usunąć. Stan 2026-11-15: brak rozjazdów.
ZNANE_ROZJAZDY = {}


def oznacz_rozjazdy(corpus):
    for w in (x for v in corpus.values() if isinstance(v, list) for x in v):
        if w["id"] in ZNANE_ROZJAZDY:
            w["znany_rozjazd"] = ZNANE_ROZJAZDY[w["id"]]
    return corpus


def zbuduj():
    kol = kolory_motywu()
    stwierdzone = [  # wartości wprost ze źródła (granice zakresu 1..21)
        {"id": "WCAG-ZAKRES-21", "color1": "#FFFFFF", "color2": "#000000", "contrastRatio": 21.0},
        {"id": "WCAG-ZAKRES-1", "color1": "#767676", "color2": "#767676", "contrastRatio": 1.0},
    ]
    for s in stwierdzone:
        s.update({"zrodla": [ZRODLO], "metoda": "wartość ze źródła („Contrast ratios can range from 1 to 21”)"})
    definicyjne = []
    for i, (a, b) in enumerate([("#767676", "#FFFFFF"), ("#777777", "#FFFFFF"), ("#9CA3AF", "#F3F4F6"),
                                ("#0A0A0A", "#FFFFFF"), ("#0B0B0B", "#FFFFFF")], 1):
        # #0A/#0B: kanał 10/255 = 0.0392 (≤ 0.04045, gałąź liniowa) i 11/255 = 0.0431 (gałąź potęgowa)
        definicyjne.append(wpis(f"WCAG-DEF-{i:02d}", a, b, {}))
    pary = [wpis(f"MOTYW-{f}-{t}", kol[f], kol[t], {"foregroundName": f, "backgroundName": t}) for f, t in PARY]
    return {
        "metadata": {
            "generator": "scripts/gen-theme-contrast-corpus.py",
            "version": "2.0",
            "standard": "WCAG 2.1, https://www.w3.org/TR/WCAG21/ (odczyt 2026-11-15; rejestr WCAG21-KONTRAST)",
            "kolory": "src/core/theme.ts, theme.colors (wejście, czytane przy każdym przebiegu)",
            "tolerancja": TOL,
        },
        "canonical_rd_vectors": stwierdzone + definicyjne,
        "theme_pairs": pary,
    }


def sprawdz_zrodla(corpus):
    bledy = []
    rejestr = {t["id"]: t for t in json.load(open(os.path.join(ROOT, "rejestr.json"), encoding="utf-8"))}
    t = rejestr.get(ZRODLO.split(":", 1)[1])
    if not t or t.get("status") != "potwierdzone":
        bledy.append(f"{ZRODLO} nie jest potwierdzonym twierdzeniem w rejestr.json")
    for w in corpus["canonical_rd_vectors"]:
        if w["metoda"].startswith("wartość ze źródła") and abs(float(kontrast(w["color1"], w["color2"])) - w["contrastRatio"]) > TOL:
            bledy.append(f"{w['id']}: wartość ze źródła niezgodna ze wzorem źródła")
    for w in corpus["canonical_rd_vectors"] + corpus["theme_pairs"]:
        if not w.get("zrodla"):
            bledy.append(f"{w['id']}: bez źródła")
    return bledy


def main(argv):
    tryb = argv[1] if len(argv) > 1 else "--check"
    corpus = oznacz_rozjazdy(zbuduj())
    tekst = json.dumps(corpus, ensure_ascii=False, indent=2) + "\n"
    bledy = sprawdz_zrodla(corpus)
    for b in bledy:
        print(f"[gen-theme-contrast-corpus] BŁĄD źródła: {b}")
    if bledy:
        return 1
    sciezka = os.path.join(ROOT, OUT)
    if tryb == "--write":
        with open(sciezka, "w", encoding="utf-8") as f:
            f.write(tekst)
        print(f"[gen-theme-contrast-corpus] zapisano {OUT}")
        return 0
    if tryb != "--check":
        print("Użycie: gen-theme-contrast-corpus.py --check | --write")
        return 2
    obecny = open(sciezka, encoding="utf-8").read() if os.path.isfile(sciezka) else ""
    if obecny != tekst:
        print(f"[gen-theme-contrast-corpus] BŁĄD: {OUT} różni się od wyroczni (ręczna zmiana, zmiana motywu albo nieaktualny plik); "
              f"sprawdź, potem: python3 -I scripts/gen-theme-contrast-corpus.py --write")
        return 1
    print(f"[gen-theme-contrast-corpus] OK: {len(corpus['canonical_rd_vectors'])} wektorów W3C i {len(corpus['theme_pairs'])} par motywu zgodnych z {OUT}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
