#!/usr/bin/env python3
"""
scripts/gen-coffee-corpus.py
Generates independent ground-truth oracle fixtures for brewing physics,
extraction yield, water chemistry, and caffeine pharmacokinetics.
(BR-TEST-011, BR-TEST-012, ZP-06)
"""

import json
import os
import math

def calculate_ey(liquid_water, tds_percent, dose_grams):
    # EY% = (Liquid Water * TDS%) / Dose
    return round((liquid_water * tds_percent) / dose_grams, 4)

def classify_ey(ey):
    if ey < 18.0:
        return "under"
    elif ey > 22.0:
        return "over"
    return "ideal"

def water_ppm_to_dh(ppm):
    # 1 dH = 17.848 ppm CaCO3
    return round(ppm / 17.848, 4)

def caffeine_remaining(initial_mg, hours, half_life=5.0):
    return round(initial_mg * math.pow(0.5, hours / half_life), 4)

def main():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    fixtures_dir = os.path.join(root, "tests", "fixtures")
    os.makedirs(fixtures_dir, exist_ok=True)
    out_file = os.path.join(fixtures_dir, "coffee-corpus.json")

    corpus = {
        "metadata": {
            "generator": "scripts/gen-coffee-corpus.py",
            "version": "1.0",
            "description": "Domain calculation oracle corpus for Napar (Steepwise)"
        },
        "extraction_yield": [],
        "water_hardness": [],
        "caffeine_decay": []
    }

    # 1. Extraction yield vectors
    ey_cases = [
        (220.0, 1.35, 15.0),
        (200.0, 1.20, 12.0),
        (300.0, 1.45, 18.0),
        (500.0, 1.10, 30.0),
        (150.0, 1.80, 10.0),
        (250.0, 0.90, 15.0),
        (250.0, 1.60, 15.0),
        (350.0, 1.25, 20.0),
        (240.0, 1.50, 15.0),
        (400.0, 1.38, 25.0),
    ]

    for water, tds, dose in ey_cases:
        ey = calculate_ey(water, tds, dose)
        rating = classify_ey(ey)
        corpus["extraction_yield"].append({
            "waterGrams": water,
            "tdsPercent": tds,
            "coffeeDoseGrams": dose,
            "expectedExtractionYieldPercent": ey,
            "expectedRating": rating
        })

    # 2. Water hardness vectors
    ppm_cases = [0.0, 17.848, 50.0, 80.0, 120.0, 150.0, 200.0, 300.0]
    for ppm in ppm_cases:
        corpus["water_hardness"].append({
            "ppmCaCO3": ppm,
            "expectedDegreesDH": water_ppm_to_dh(ppm)
        })

    # 3. Caffeine decay vectors
    c0_values = [80.0, 120.0, 160.0, 200.0]
    hours_values = [0.0, 1.0, 2.5, 5.0, 7.5, 10.0, 15.0, 24.0]
    for c0 in c0_values:
        for h in hours_values:
            corpus["caffeine_decay"].append({
                "initialMg": c0,
                "elapsedHours": h,
                "halfLifeHours": 5.0,
                "expectedRemainingMg": caffeine_remaining(c0, h, 5.0)
            })

    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(corpus, f, indent=2)

    print(f"[gen-coffee-corpus] Saved {len(corpus['extraction_yield'])} EY, {len(corpus['water_hardness'])} Water, {len(corpus['caffeine_decay'])} Caffeine vectors to {out_file}")

if __name__ == "__main__":
    main()
