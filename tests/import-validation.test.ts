// Parser danych importu z unknown (M1-audytor-generalny-006; 08-programista-011)
import {
  ImportFieldError,
  parseBrewSession,
  parseCaffeineLog,
  parseImportCollections,
  parseInventoryItem,
  parseSavedRecipe,
  type ParsedImport,
} from '../src/core/import-validation';

const fieldOf = (fn: () => unknown): string => {
  try {
    fn();
  } catch (e) {
    if (e instanceof ImportFieldError) return e.field;
    throw e;
  }
  return 'brak błędu';
};

describe('import-validation (M1-audytor-generalny-006)', () => {
  test('paczka: zły typ wagi i nieznany rodzaj dają nazwę pola; brak dat zostaje pusty', () => {
    expect(fieldOf(() => parseInventoryItem({ id: 'a', name: 'n', type: 'coffee', initialWeightGrams: '250', remainingWeightGrams: 1 }, 'inventory[0]'))).toBe('inventory[0].initialWeightGrams');
    expect(fieldOf(() => parseInventoryItem({ id: 'a', name: 'n', type: 'kakao', initialWeightGrams: 1, remainingWeightGrams: 1 }, 'inventory[0]'))).toBe('inventory[0].type');
    const ok = parseInventoryItem({ id: 'a', name: 'n', type: 'tea', initialWeightGrams: 1, remainingWeightGrams: 1, rating: null }, 'x');
    expect(ok.rating).toBeUndefined();
    expect(ok.createdAt).toBe('');
  });

  test('receptura, sesja i log: brak wymaganego pola i zły element listy', () => {
    expect(fieldOf(() => parseSavedRecipe({ id: 'r', name: 'n', beverageType: 'COFFEE', method: 'V60', doseGrams: 1, waterGrams: 1, waterTempCelsius: 90, stepsJson: '[]' }, 'customRecipes[0]'))).toBe('customRecipes[0].recommendedRatio');
    expect(fieldOf(() => parseBrewSession({ id: 's', beverageType: 'COFFEE', method: 'V60', doseGrams: 1, waterGrams: 1, waterTempCelsius: 90, totalTimeSeconds: 1, flavorTags: ['a', 2], brewedAt: 'x' }, 'sessions[0]'))).toBe('sessions[0].flavorTags[1]');
    expect(fieldOf(() => parseBrewSession({ id: 's', beverageType: 'COFFEE', method: 'V60', doseGrams: 1, waterGrams: 1, waterTempCelsius: 90, totalTimeSeconds: 1 }, 'sessions[0]'))).toBe('sessions[0].brewedAt');
    expect(fieldOf(() => parseCaffeineLog({ id: 'l', beverageName: 'n', beverageType: 'coffee', consumedAt: 'x', doseGrams: 1, caffeineMg: NaN }, 'caffeineLogs[0]'))).toBe('caffeineLogs[0].caffeineMg');
  });

  test('kolekcje: sekcja nie-lista i brakujące sekcje', () => {
    expect(fieldOf(() => parseImportCollections({ sessions: {} }))).toBe('sessions');
    const empty: ParsedImport = parseImportCollections({});
    expect(empty).toEqual({ inventory: [], customRecipes: [], sessions: [], caffeineLogs: [] });
    expect(new ImportFieldError('a.b', 'liczby').message).toContain('„a.b”');
  });
});
