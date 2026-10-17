// ============================================================================
// Napar (Steepwise) — State Sequences & Invariants (BR-TEST-007..010)
// 30-50 random operations on application state with guaranteed opening step
// and invariant assertion after each mutation
// ============================================================================

interface BeanState {
  id: string;
  name: string;
  roaster: string;
  weightGrams: number;
  roastDate: string;
  isFavorite: boolean;
}

interface PourStepState {
  id: string;
  name: string;
  waterGrams: number;
  durationSeconds: number;
}

interface RecipeState {
  id: string;
  name: string;
  method: string;
  coffeeDoseGrams: number;
  waterTotalGrams: number;
  grindClicks: number;
  steps: PourStepState[];
}

interface BrewSessionState {
  id: string;
  recipeId: string;
  beanId?: string;
  timestampMs: number;
  actualDurationSeconds: number;
  rating: number; // 0..5
}

interface AppState {
  beans: BeanState[];
  recipes: RecipeState[];
  sessions: BrewSessionState[];
  preferences: {
    unit: 'g' | 'oz';
    tempUnit: 'c' | 'f';
    vibrationEnabled: boolean;
  };
}

/**
 * Twarda weryfikacja niezmienników stanu aplikacji (BR-TEST-007, BR-TEST-010)
 */
function assertStateInvariants(state: AppState) {
  // 1. Brak zduplikowanych identyfikatorów
  const beanIds = new Set<string>();
  for (const b of state.beans) {
    expect(beanIds.has(b.id)).toBe(false);
    beanIds.add(b.id);
    expect(b.name.trim().length).toBeGreaterThan(0);
    expect(b.weightGrams).toBeGreaterThanOrEqual(0);
  }

  const recipeIds = new Set<string>();
  for (const r of state.recipes) {
    expect(recipeIds.has(r.id)).toBe(false);
    recipeIds.add(r.id);
    expect(r.coffeeDoseGrams).toBeGreaterThan(0);
    expect(r.waterTotalGrams).toBeGreaterThan(0);
    expect(r.grindClicks).toBeGreaterThanOrEqual(0);

    // Suma kroków musi zgadzać się z całkowitą wodą receptury (w granicach 0.1g)
    if (r.steps.length > 0) {
      const stepWaterSum = r.steps.reduce((sum, s) => sum + s.waterGrams, 0);
      expect(Math.abs(stepWaterSum - r.waterTotalGrams)).toBeLessThanOrEqual(0.1);
    }
  }

  const sessionIds = new Set<string>();
  for (const s of state.sessions) {
    expect(sessionIds.has(s.id)).toBe(false);
    sessionIds.add(s.id);

    // Integralność kluczy obcych (foreign keys)
    expect(recipeIds.has(s.recipeId)).toBe(true);
    if (s.beanId) {
      expect(beanIds.has(s.beanId)).toBe(true);
    }

    expect(s.rating).toBeGreaterThanOrEqual(0);
    expect(s.rating).toBeLessThanOrEqual(5);
    expect(s.actualDurationSeconds).toBeGreaterThanOrEqual(0);
    expect(s.timestampMs).toBeLessThanOrEqual(Date.now() + 5000);
  }

  // 2. Poprawność preferencji
  expect(['g', 'oz']).toContain(state.preferences.unit);
  expect(['c', 'f']).toContain(state.preferences.tempUnit);
  expect(typeof state.preferences.vibrationEnabled).toBe('boolean');
}

describe('State Sequences & Invariant Guard (BR-TEST-007..010)', () => {
  test('wykonuje 40 losowych akcji ze stanem początkowym i spełnia assertStateInvariants', () => {
    // Statystyki trafień w reguły (BR-TEST-008, BR-TEST-009)
    const stats: Record<string, number> = {
      addBean: 0,
      editBean: 0,
      deleteBean: 0,
      createRecipe: 0,
      scaleRecipe: 0,
      addSession: 0,
      toggleFavorite: 0,
      toggleUnit: 0,
    };

    // GWARANTOWANY KROK OTWIERAJĄCY (BR-TEST-008) — zapobiega pustej prawdzie (vacuous truth)
    const state: AppState = {
      beans: [
        {
          id: 'bean-init-1',
          name: 'Ethiopia Yirgacheffe Gedeb',
          roaster: 'Hard Beans',
          weightGrams: 250,
          roastDate: '2026-10-01',
          isFavorite: true,
        },
      ],
      recipes: [
        {
          id: 'recipe-init-1',
          name: 'V60 4:6 Method',
          method: 'v60',
          coffeeDoseGrams: 20,
          waterTotalGrams: 300,
          grindClicks: 24,
          steps: [
            { id: 's1', name: 'Bloom', waterGrams: 50, durationSeconds: 45 },
            { id: 's2', name: 'Pour 2', waterGrams: 70, durationSeconds: 45 },
            { id: 's3', name: 'Pour 3', waterGrams: 60, durationSeconds: 45 },
            { id: 's4', name: 'Pour 4', waterGrams: 60, durationSeconds: 45 },
            { id: 's5', name: 'Pour 5', waterGrams: 60, durationSeconds: 45 },
          ],
        },
      ],
      sessions: [
        {
          id: 'session-init-1',
          recipeId: 'recipe-init-1',
          beanId: 'bean-init-1',
          timestampMs: Date.now() - 3600000,
          actualDurationSeconds: 210,
          rating: 5,
        },
      ],
      preferences: {
        unit: 'g',
        tempUnit: 'c',
        vibrationEnabled: true,
      },
    };

    assertStateInvariants(state);

    let idCounter = 100;
    const TOTAL_ACTIONS = 40;

    for (let step = 0; step < TOTAL_ACTIONS; step++) {
      // Gwarancja wykonania każdej z 8 reguł przynajmniej raz (BR-TEST-009)
      const actionPick = step < 8 ? step : Math.floor(Math.random() * 8);

      switch (actionPick) {
        case 0: {
          // addBean
          idCounter++;
          state.beans.push({
            id: `bean-${idCounter}`,
            name: `Specialty Bean #${idCounter}`,
            roaster: 'Coffeedesk Roasters',
            weightGrams: Math.floor(100 + Math.random() * 400),
            roastDate: '2026-10-10',
            isFavorite: Math.random() > 0.5,
          });
          stats.addBean++;
          break;
        }

        case 1: {
          // editBean
          if (state.beans.length > 0) {
            const b = state.beans[Math.floor(Math.random() * state.beans.length)];
            b.weightGrams = Math.max(0, b.weightGrams - 15);
            b.name = `${b.name} (Zaktualizowano)`;
            stats.editBean++;
          }
          break;
        }

        case 2: {
          // deleteBean (tylko jeśli nie jest powiązany z istniejącą sesją lub sesje aktualizujemy)
          if (state.beans.length > 1) {
            const victimIdx = Math.floor(Math.random() * state.beans.length);
            const victimId = state.beans[victimIdx].id;
            // Bezpieczne usuwanie powiązania w sesjach
            state.sessions.forEach((s) => {
              if (s.beanId === victimId) {
                delete s.beanId;
              }
            });
            state.beans.splice(victimIdx, 1);
            stats.deleteBean++;
          }
          break;
        }

        case 3: {
          // createRecipe
          idCounter++;
          const dose = 15;
          const water = 250;
          state.recipes.push({
            id: `recipe-${idCounter}`,
            name: `AeroPress Recipe #${idCounter}`,
            method: 'aeropress',
            coffeeDoseGrams: dose,
            waterTotalGrams: water,
            grindClicks: 18,
            steps: [
              { id: `step-${idCounter}-1`, name: 'Preinfusion', waterGrams: 50, durationSeconds: 30 },
              { id: `step-${idCounter}-2`, name: 'Main Pour', waterGrams: 200, durationSeconds: 60 },
            ],
          });
          stats.createRecipe++;
          break;
        }

        case 4: {
          // scaleRecipe
          if (state.recipes.length > 0) {
            const r = state.recipes[Math.floor(Math.random() * state.recipes.length)];
            const newDose = Math.floor(12 + Math.random() * 18);
            const scaleFactor = newDose / r.coffeeDoseGrams;
            r.coffeeDoseGrams = newDose;
            r.waterTotalGrams = Math.round(r.waterTotalGrams * scaleFactor * 10) / 10;
            // Skaluj kroki tak, aby suma równała się waterTotalGrams
            if (r.steps.length > 0) {
              let allocated = 0;
              r.steps.forEach((s, idx) => {
                if (idx === r.steps.length - 1) {
                  s.waterGrams = Math.round((r.waterTotalGrams - allocated) * 10) / 10;
                } else {
                  s.waterGrams = Math.round(s.waterGrams * scaleFactor * 10) / 10;
                  allocated += s.waterGrams;
                }
              });
            }
            stats.scaleRecipe++;
          }
          break;
        }

        case 5: {
          // addSession
          if (state.recipes.length > 0) {
            idCounter++;
            const recipe = state.recipes[Math.floor(Math.random() * state.recipes.length)];
            const bean = state.beans.length > 0 ? state.beans[Math.floor(Math.random() * state.beans.length)] : undefined;
            state.sessions.push({
              id: `session-${idCounter}`,
              recipeId: recipe.id,
              beanId: bean?.id,
              timestampMs: Date.now() - Math.floor(Math.random() * 86400000),
              actualDurationSeconds: 180 + Math.floor(Math.random() * 60),
              rating: Math.floor(1 + Math.random() * 5),
            });
            stats.addSession++;
          }
          break;
        }

        case 6: {
          // toggleFavorite
          if (state.beans.length > 0) {
            const b = state.beans[Math.floor(Math.random() * state.beans.length)];
            b.isFavorite = !b.isFavorite;
            stats.toggleFavorite++;
          }
          break;
        }

        case 7: {
          // toggleUnit
          state.preferences.unit = state.preferences.unit === 'g' ? 'oz' : 'g';
          state.preferences.tempUnit = state.preferences.tempUnit === 'c' ? 'f' : 'c';
          stats.toggleUnit++;
          break;
        }
      }

      // Niezmiennik sprawdzany po KAŻDYM pojedynczym kroku mutującym!
      assertStateInvariants(state);
    }

    // Weryfikacja liczników trafień: każda reguła z puli została wywołana przynajmniej raz (BR-TEST-009)
    Object.entries(stats).forEach(([ruleName, count]) => {
      expect(count).toBeGreaterThan(0);
    });
  });
});
