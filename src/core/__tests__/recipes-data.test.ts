// ============================================================================
// Apps4Brew Studio — Unit Tests: Master Recipes Data & Lookups
// TASK-P12-08-PRO
// ============================================================================

import {
  MASTER_RECIPES,
  findMasterRecipeById,
  getMasterRecipesByType,
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
});
