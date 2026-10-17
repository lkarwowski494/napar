#!/usr/bin/env python3
"""
scripts/gen-theme-contrast-corpus.py
Computes relative luminance and contrast ratios per WCAG 2.1 (RD-ENG-02, BR-TEST-013, NFR-A11Y-005)
for all UI palette pairs and validates AA/AAA compliance.
"""

import json
import os

def hex_to_rgb(hex_str):
    hex_clean = hex_str.lstrip("#")
    if len(hex_clean) == 3:
        hex_clean = "".join([c * 2 for c in hex_clean])
    r = int(hex_clean[0:2], 16)
    g = int(hex_clean[2:4], 16)
    b = int(hex_clean[4:6], 16)
    return r, g, b

def channel_luminance(c):
    c_norm = c / 255.0
    if c_norm <= 0.04045:
        return c_norm / 12.92
    else:
        return math_pow((c_norm + 0.055) / 1.055, 2.4)

def math_pow(base, exp):
    return base ** exp

def relative_luminance(hex_str):
    r, g, b = hex_to_rgb(hex_str)
    return 0.2126 * channel_luminance(r) + 0.7152 * channel_luminance(g) + 0.0722 * channel_luminance(b)

def contrast_ratio(hex1, hex2):
    l1 = relative_luminance(hex1)
    l2 = relative_luminance(hex2)
    lighter = max(l1, l2)
    darker = min(l1, l2)
    return round((lighter + 0.05) / (darker + 0.05), 4)

def main():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    fixtures_dir = os.path.join(root, "tests", "fixtures")
    os.makedirs(fixtures_dir, exist_ok=True)
    out_file = os.path.join(fixtures_dir, "theme-contrast-corpus.json")

    # Canonical RD-ENG-02 test vectors from BRD
    rd_eng_vectors = [
        ("#FFFFFF", "#000000", 21.0, True, True),
        ("#767676", "#FFFFFF", 4.54, True, False),
        ("#777777", "#FFFFFF", 4.48, False, False),
        ("#9CA3AF", "#F3F4F6", 2.25, False, False),
    ]

    # Theme colors from src/core/theme.ts
    theme_colors = {
        "bg": "#121214",
        "bgCard": "#1C1C1F",
        "bgCardSecondary": "#242428",
        "copper": "#D97736",
        "copperLight": "#E88B4D",
        "emerald": "#2A7B62",
        "emeraldLight": "#3AA584",
        "textPrimary": "#F4EFEA",
        "textSecondary": "#A09C96",
        "textMuted": "#8C8884",
        "danger": "#D9534F"
    }

    pairs_to_evaluate = [
        ("textPrimary", "bg"),
        ("textPrimary", "bgCard"),
        ("textSecondary", "bgCard"),
        ("copperLight", "bg"),
        ("emeraldLight", "bg"),
        ("danger", "bg"),
        ("textPrimary", "copper"),
    ]

    corpus = {
        "metadata": {
            "generator": "scripts/gen-theme-contrast-corpus.py",
            "standard": "WCAG 2.1 relative luminance & contrast ratio (RD-ENG-02)"
        },
        "canonical_rd_vectors": [],
        "theme_pairs": []
    }

    for c1, c2, exp_ratio, exp_aa, exp_aaa in rd_eng_vectors:
        ratio = contrast_ratio(c1, c2)
        corpus["canonical_rd_vectors"].append({
            "color1": c1,
            "color2": c2,
            "contrastRatio": ratio,
            "passAA": ratio >= 4.5,
            "passAAA": ratio >= 7.0
        })

    for name1, name2 in pairs_to_evaluate:
        hex1 = theme_colors[name1]
        hex2 = theme_colors[name2]
        ratio = contrast_ratio(hex1, hex2)
        corpus["theme_pairs"].append({
            "foregroundName": name1,
            "foregroundHex": hex1,
            "backgroundName": name2,
            "backgroundHex": hex2,
            "contrastRatio": ratio,
            "passAA_NormalText": ratio >= 4.5,
            "passAA_LargeTextOrUI": ratio >= 3.0,
            "passAAA_NormalText": ratio >= 7.0
        })

    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(corpus, f, indent=2)

    print(f"[gen-theme-contrast-corpus] Saved {len(corpus['canonical_rd_vectors'])} canonical & {len(corpus['theme_pairs'])} theme pairs to {out_file}")

if __name__ == "__main__":
    main()
