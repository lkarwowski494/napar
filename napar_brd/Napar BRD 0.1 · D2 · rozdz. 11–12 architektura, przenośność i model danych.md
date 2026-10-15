# **Napar BRD 0.1 — Część D2: Architektura techniczna, przenośność i model danych (Rozdziały 11–12)**

---

## **11. Architektura techniczna i przenośność**

* **Stos technologiczny:** Swift 6, SwiftUI, SwiftData / SQLite (GRDB.swift jako silnik deterministyczny), ActivityKit, WidgetKit, WatchKit, HealthKit.
* **Wzorzec architektoniczny:** MVVM + Clean Architecture z podziałem na domeny (`Domain`, `Data`, `Presentation`).
* **Zasada przenośności (ZP-15):** Identyfikatory zakupu IAP i kontenery App Group posiadają unikalny prefiks `group.com.apps4brew.napar`, co umożliwia bezproblemowy transfer aplikacji pomiędzy kontami deweloperskimi bez naruszania integralności danych.

---

## **12. Relacyjny model danych (Schemat SQLite)**

```sql
-- Kartoteka kawy i herbaty (Magazyn)
CREATE TABLE inventory_items (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK(type IN ('COFFEE', 'TEA')),
    name TEXT NOT NULL,
    roaster_or_brand TEXT,
    origin_country TEXT,
    region TEXT,
    farm_or_garden TEXT,
    varietal_or_cultivar TEXT,
    processing_method TEXT,
    roast_or_harvest_date TEXT NOT NULL,
    package_weight_grams REAL NOT NULL,
    remaining_weight_grams REAL NOT NULL,
    tasting_notes TEXT, -- JSON array
    is_archived INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
);

-- Receptury parzenia
CREATE TABLE recipes (
    id TEXT PRIMARY KEY,
    method TEXT NOT NULL, -- V60, AEROPRESS, CHEMEX, GONGFU, etc.
    name TEXT NOT NULL,
    author TEXT,
    coffee_or_tea_dose_grams REAL NOT NULL,
    water_weight_grams REAL NOT NULL,
    water_temperature_celsius REAL NOT NULL,
    grind_setting_description TEXT,
    is_master_recipe INTEGER NOT NULL DEFAULT 0,
    steps_json TEXT NOT NULL, -- JSON array of steps (time, water, instruction)
    created_at TEXT NOT NULL
);

-- Historia parzeń (Dziennik)
CREATE TABLE brew_sessions (
    id TEXT PRIMARY KEY,
    item_id TEXT REFERENCES inventory_items(id),
    recipe_id TEXT REFERENCES recipes(id),
    brew_date TEXT NOT NULL,
    actual_dose_grams REAL NOT NULL,
    actual_water_grams REAL NOT NULL,
    actual_time_seconds REAL NOT NULL,
    temperature_celsius REAL NOT NULL,
    rating_stars REAL,
    acidity_level INTEGER,
    sweetness_level INTEGER,
    bitterness_level INTEGER,
    flavor_tags TEXT, -- JSON array
    tds_percentage REAL,
    calculated_ey_percentage REAL,
    calculated_caffeine_mg REAL,
    user_notes TEXT
);

-- Dziennik kofeiny (Caffeine Tracker)
CREATE TABLE caffeine_logs (
    id TEXT PRIMARY KEY,
    session_id TEXT REFERENCES brew_sessions(id),
    timestamp TEXT NOT NULL,
    amount_mg REAL NOT NULL,
    synced_to_healthkit INTEGER NOT NULL DEFAULT 0
);
```
