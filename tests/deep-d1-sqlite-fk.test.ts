// ============================================================================
// Napar — Real SQLite FK Regression Tests: Partia D1 (DEEP-002)
// ============================================================================

jest.mock('expo-sqlite', () => require('./support/expo-sqlite-node').createExpoSqliteMock());

type DbModule = typeof import('../src/data/database');
type SqliteMock = {
  __setNextPath: (p: string) => void;
  __closeAll: () => void;
  __clearFailures: () => void;
};

function loadDatabase(): { db: DbModule; sqlite: SqliteMock } {
  let db!: DbModule;
  let sqlite!: SqliteMock;
  jest.isolateModules(() => {
    sqlite = require('expo-sqlite');
    sqlite.__clearFailures();
    sqlite.__setNextPath(':memory:');
    db = require('../src/data/database');
  });
  return { db, sqlite };
}

describe('Partia D1 — DEEP-002: SQLite FOREIGN KEY na prawdziwym SQLite (PRAGMA foreign_keys = ON)', () => {
  test('logCaffeine z pustym/białym lub osieroconym brewSessionId nie rzuca SQLITE_CONSTRAINT_FOREIGNKEY', () => {
    const { db, sqlite } = loadDatabase();
    try {
      expect(() =>
        db.logCaffeine({
          id: 'caff-empty-fk',
          brewSessionId: '   ',
          beverageName: 'Espresso',
          beverageType: 'coffee',
          consumedAt: '2026-11-26T08:00:00.000Z',
          doseGrams: 18,
          caffeineMg: 162,
        })
      ).not.toThrow();

      expect(() =>
        db.logCaffeine({
          id: 'caff-orphan-fk',
          brewSessionId: 'non-existent-session',
          beverageName: 'V60',
          beverageType: 'coffee',
          consumedAt: '2026-11-26T09:00:00.000Z',
          doseGrams: 15,
          caffeineMg: 158,
        })
      ).not.toThrow();

      const logs = db.getCaffeineLogs();
      expect(logs.find((l) => l.id === 'caff-empty-fk')?.brewSessionId).toBeUndefined();
      expect(logs.find((l) => l.id === 'caff-orphan-fk')?.brewSessionId).toBeUndefined();
    } finally {
      sqlite.__closeAll();
    }
  });

  test('saveBrewSession i recordBrewSessionTransaction z usuniętą paczką/recepturą zachowują nazwy i nie rzucają FK error', () => {
    const { db, sqlite } = loadDatabase();
    try {
      expect(() =>
        db.recordBrewSessionTransaction(
          {
            id: 'sess-orphan-fk',
            recipeId: 'deleted-recipe-id',
            recipeName: 'Usunięta receptura',
            inventoryItemId: 'deleted-bean-id',
            inventoryItemName: 'Usunięta paczka',
            beverageType: 'COFFEE',
            method: 'V60',
            doseGrams: 15,
            waterGrams: 250,
            waterTempCelsius: 93,
            totalTimeSeconds: 180,
            flavorTags: [],
            brewedAt: '2026-11-26T10:00:00.000Z',
          },
          { itemId: 'deleted-bean-id', doseGrams: 15 },
          {
            id: 'caff-linked-ok',
            brewSessionId: 'sess-orphan-fk',
            beverageName: 'Usunięta paczka',
            beverageType: 'coffee',
            consumedAt: '2026-11-26T10:00:00.000Z',
            doseGrams: 15,
            caffeineMg: 158,
          }
        )
      ).not.toThrow();

      const savedSess = db.getBrewSessions().find((s) => s.id === 'sess-orphan-fk');
      expect(savedSess).toBeTruthy();
      expect(savedSess?.recipeId).toBeUndefined();
      expect(savedSess?.inventoryItemId).toBeUndefined();
      expect(savedSess?.recipeName).toBe('Usunięta receptura');
      expect(savedSess?.inventoryItemName).toBe('Usunięta paczka');
    } finally {
      sqlite.__closeAll();
    }
  });

  test('importDataJson z osieroconymi FK w sessions i caffeineLogs kończy się sukcesem', () => {
    const { db, sqlite } = loadDatabase();
    try {
      const backupWithOrphans = JSON.stringify({
        version: 1,
        exportedAt: '2026-11-26T11:00:00.000Z',
        inventory: [],
        customRecipes: [],
        sessions: [
          {
            id: 'imp-sess-1',
            recipeId: 'missing-recipe-999',
            recipeName: 'Stary V60',
            inventoryItemId: 'missing-bean-999',
            inventoryItemName: 'Stara Etiopia',
            beverageType: 'COFFEE',
            method: 'V60',
            doseGrams: 18,
            waterGrams: 300,
            waterTempCelsius: 94,
            totalTimeSeconds: 190,
            flavorTags: [],
            brewedAt: '2026-11-25T08:00:00.000Z',
          },
        ],
        caffeineLogs: [
          {
            id: 'imp-caff-1',
            brewSessionId: 'missing-session-999',
            beverageName: 'Stary V60',
            beverageType: 'coffee',
            consumedAt: '2026-11-25T08:00:00.000Z',
            doseGrams: 18,
            caffeineMg: 190,
          },
        ],
      });
      expect(() => db.importDataJson(backupWithOrphans)).not.toThrow();
      expect(db.getBrewSessions().find((s) => s.id === 'imp-sess-1')?.recipeName).toBe('Stary V60');
      expect(db.getCaffeineLogs().find((l) => l.id === 'imp-caff-1')?.brewSessionId).toBeUndefined();
    } finally {
      sqlite.__closeAll();
    }
  });

  test('deleteRecipe na recepturze bazowej (is_custom = 0) nie odłącza historycznych sesji', () => {
    const { db, sqlite } = loadDatabase();
    try {
      const masterId = db.getRecipes()[0].id;
      db.saveBrewSession({
        id: 'sess-master-fk',
        recipeId: masterId,
        recipeName: 'Master',
        beverageType: 'COFFEE',
        method: 'V60',
        doseGrams: 15,
        waterGrams: 250,
        waterTempCelsius: 93,
        totalTimeSeconds: 180,
        flavorTags: [],
        brewedAt: '2026-11-26T12:00:00.000Z',
      });
      db.deleteRecipe(masterId);
      const stillLinked = db.getBrewSessions().find((s) => s.id === 'sess-master-fk');
      expect(stillLinked?.recipeId).toBe(masterId);
    } finally {
      sqlite.__closeAll();
    }
  });

  test('initDatabase dosiewa brakującą recepturę bazową nawet gdy COUNT(*) >= MASTER_RECIPES.length', () => {
    const { db, sqlite } = loadDatabase();
    try {
      const target = db.getRecipes()[0];
      const rawDb = db.getDatabase();
      rawDb.runSync('DELETE FROM recipes WHERE id = ?', [target.id]);
      rawDb.runSync(
        `INSERT INTO recipes (id, name, beverage_type, method, dose_g, water_g, water_temp_c, recommended_ratio, steps_json, is_custom, is_favorite, created_at)
         VALUES ('legacy-master-placeholder', 'Legacy', 'COFFEE', 'V60', 15, 250, 93, 16.6, '[]', 0, 0, '2026-01-01T00:00:00.000Z')`
      );
      expect(db.getRecipeById(target.id)).toBeNull();
      db.initDatabase(rawDb);
      expect(db.getRecipeById(target.id)).not.toBeNull();
    } finally {
      sqlite.__closeAll();
    }
  });
});
