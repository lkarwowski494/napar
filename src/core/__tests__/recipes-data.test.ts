// ============================================================================
// Apps4Brew Studio — Unit Tests: Master Recipes Data & Lookups
// TASK-P12-08-PRO
// ============================================================================

import {
  MASTER_RECIPES,
  findMasterRecipeById,
  getMasterRecipesByType,
  filterRecipes,
  RecipeFilterCriteria,
} from '../recipes-data';

describe('Master Recipes Data (MASTER_RECIPES)', () => {
  test('zawiera dokładnie 24 zdefiniowane receptury wzorcowe o unikalnych ID', () => {
    expect(MASTER_RECIPES.length).toBe(24);

    const ids = new Set<string>();
    for (const r of MASTER_RECIPES) {
      expect(ids.has(r.id)).toBe(false);
      ids.add(r.id);

      expect(r.id.trim().length).toBeGreaterThan(0);
      expect(r.name.trim().length).toBeGreaterThan(0);
      expect(['COFFEE', 'TEA']).toContain(r.type);
      expect(r.coffeeOrTeaDoseGrams).toBeGreaterThan(0);
      expect(r.waterWeightGrams).toBeGreaterThan(0);
      expect(r.waterTemperatureCelsius).toBeGreaterThan(0);
      expect(r.recommendedRatio).toBeGreaterThan(0);
      expect(Array.isArray(r.steps)).toBe(true);
      expect(r.steps.length).toBeGreaterThan(0);
    }
  });

  test('findMasterRecipeById wyszukuje recepturę lub zwraca undefined przy braku', () => {
    const v60 = findMasterRecipeById('v60-kasuya-4-6');
    expect(v60).toBeDefined();
    expect(v60?.author).toContain('Tetsu Kasuya');

    const chai = findMasterRecipeById('  masala-chai-traditional  ');
    expect(chai).toBeDefined();
    expect(chai?.type).toBe('TEA');

    expect(findMasterRecipeById('nieistniejaca-receptura')).toBeUndefined();
    expect(findMasterRecipeById('')).toBeUndefined();
    expect(findMasterRecipeById(null as any)).toBeUndefined();
    expect(findMasterRecipeById(undefined as any)).toBeUndefined();
  });

  test('getMasterRecipesByType filtruje kawę i herbatę bez utraty spójności sumy', () => {
    const coffeeRecipes = getMasterRecipesByType('COFFEE');
    const teaRecipes = getMasterRecipesByType('TEA');

    expect(coffeeRecipes.length).toBeGreaterThan(0);
    expect(teaRecipes.length).toBeGreaterThan(0);
    expect(coffeeRecipes.every((r) => r.type === 'COFFEE')).toBe(true);
    expect(teaRecipes.every((r) => r.type === 'TEA')).toBe(true);
    expect(coffeeRecipes.length + teaRecipes.length).toBe(MASTER_RECIPES.length);
  });

  describe('TASK-P68-01-ODK: filterRecipes wyszukiwanie i filtrowanie receptur', () => {
    it('filtruje receptury po typie (COFFEE / TEA)', () => {
      const criteria: RecipeFilterCriteria = { type: 'COFFEE' };
      const filtered = filterRecipes(MASTER_RECIPES, criteria);
      expect(filtered.length).toBeGreaterThan(0);
      expect(filtered.every((r) => r.type === 'COFFEE')).toBe(true);
    });

    it('filtruje receptury po metodzie parzenia (case-insensitive substring)', () => {
      const v60s = filterRecipes(MASTER_RECIPES, { method: 'v60' });
      expect(v60s.length).toBeGreaterThan(0);
      expect(v60s.every((r) => r.method.toLowerCase().includes('v60'))).toBe(true);

      const gongfu = filterRecipes(MASTER_RECIPES, { method: 'GONGFU' });
      expect(gongfu.length).toBeGreaterThan(0);
      expect(gongfu.every((r) => r.method === 'GONGFU')).toBe(true);
    });

    it('filtruje receptury po minimalnej i maksymalnej wadze wody', () => {
      const singleCup = filterRecipes(MASTER_RECIPES, { maxWaterWeightGrams: 250 });
      expect(singleCup.length).toBeGreaterThan(0);
      expect(singleCup.every((r) => r.waterWeightGrams <= 250)).toBe(true);

      const largeBrews = filterRecipes(MASTER_RECIPES, { minWaterWeightGrams: 300 });
      expect(largeBrews.length).toBeGreaterThan(0);
      expect(largeBrews.every((r) => r.waterWeightGrams >= 300)).toBe(true);
    });

    it('wyszukuje receptury tekstowo po nazwie lub autorze', () => {
      const hoffmann = filterRecipes(MASTER_RECIPES, { query: 'hoffmann' });
      expect(hoffmann.length).toBeGreaterThan(0);
      expect(hoffmann.some((r) => r.author.toLowerCase().includes('hoffmann'))).toBe(true);

      const kasuya = filterRecipes(MASTER_RECIPES, { query: 'kasuya' });
      expect(kasuya.length).toBeGreaterThan(0);
    });

    it('bezpiecznie reaguje na brak kryteriów, puste wejście lub null', () => {
      expect(filterRecipes(MASTER_RECIPES).length).toBe(MASTER_RECIPES.length);
      expect(filterRecipes(null as any)).toEqual([]);
      expect(filterRecipes(MASTER_RECIPES, {})).toEqual(MASTER_RECIPES);
      expect(filterRecipes(MASTER_RECIPES, { query: 'nieistniejace_zapytanie_xyz123' })).toEqual([]);
    });
  });
});
