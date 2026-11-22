// Parser danych importu z unknown (M1-audytor-generalny-006; 08-programista-011)
import {
  ImportFieldError,
  isValidIsoDate,
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
    expect(fieldOf(() => parseBrewSession({ id: 's', beverageType: 'COFFEE', method: 'V60', doseGrams: 1, waterGrams: 1, waterTempCelsius: 90, totalTimeSeconds: 1, flavorTags: ['a', 2], brewedAt: '2026-11-19T12:00:00Z' }, 'sessions[0]'))).toBe('sessions[0].flavorTags[1]');
    expect(fieldOf(() => parseBrewSession({ id: 's', beverageType: 'COFFEE', method: 'V60', doseGrams: 1, waterGrams: 1, waterTempCelsius: 90, totalTimeSeconds: 1 }, 'sessions[0]'))).toBe('sessions[0].brewedAt');
    expect(fieldOf(() => parseCaffeineLog({ id: 'l', beverageName: 'n', beverageType: 'coffee', consumedAt: '2026-11-19T12:00:00Z', doseGrams: 1, caffeineMg: NaN }, 'caffeineLogs[0]'))).toBe('caffeineLogs[0].caffeineMg');
  });

  test('M1-audytor-generalny-006: niepoprawne daty ISO w imporcie są odrzucane', () => {
    expect(fieldOf(() => parseBrewSession({ id: 's', beverageType: 'COFFEE', method: 'V60', doseGrams: 15, waterGrams: 250, waterTempCelsius: 93, totalTimeSeconds: 180, brewedAt: 'not-a-date' }, 'sessions[0]'))).toBe('sessions[0].brewedAt');
    expect(fieldOf(() => parseBrewSession({ id: 's', beverageType: 'COFFEE', method: 'V60', doseGrams: 15, waterGrams: 250, waterTempCelsius: 93, totalTimeSeconds: 180, brewedAt: '   ' }, 'sessions[0]'))).toBe('sessions[0].brewedAt');
    expect(fieldOf(() => parseCaffeineLog({ id: 'l', beverageName: 'Espresso', beverageType: 'coffee', consumedAt: 'bad-iso', doseGrams: 18, caffeineMg: 120 }, 'caffeineLogs[0]'))).toBe('caffeineLogs[0].consumedAt');
    expect(fieldOf(() => parseInventoryItem({ id: 'a', name: 'n', type: 'coffee', initialWeightGrams: 250, remainingWeightGrams: 200, createdAt: 'invalid-date' }, 'inventory[0]'))).toBe('inventory[0].createdAt');
    expect(fieldOf(() => parseSavedRecipe({ id: 'r', name: 'n', beverageType: 'COFFEE', method: 'V60', doseGrams: 15, waterGrams: 250, waterTempCelsius: 93, recommendedRatio: 16.7, stepsJson: '[]', createdAt: 'invalid-date' }, 'customRecipes[0]'))).toBe('customRecipes[0].createdAt');

    const validInv = parseInventoryItem({ id: 'a', name: 'n', type: 'coffee', initialWeightGrams: 250, remainingWeightGrams: 200, createdAt: '2026-11-19T12:00:00Z', updatedAt: '' }, 'inventory[0]');
    expect(validInv.createdAt).toBe('2026-11-19T12:00:00Z');
    expect(validInv.updatedAt).toBe('');
  });

  test('kolekcje: sekcja nie-lista i brakujące sekcje', () => {
    expect(fieldOf(() => parseImportCollections({ sessions: {} }))).toBe('sessions');
    const empty: ParsedImport = parseImportCollections({});
    expect(empty).toEqual({ inventory: [], customRecipes: [], sessions: [], caffeineLogs: [], settings: {} });
    expect(new ImportFieldError('a.b', 'liczby').message).toContain('„a.b”');
  });

  test('M1-audytor-generalny-007: walidacja sekcji settings przy imporcie', () => {
    const parsed = parseImportCollections({
      settings: {
        caffeine_half_life: '5.5',
        bedtime_hour: 22,
        voice_announce_enabled: false,
        empty_val: null,
        '   ': 'ignored',
      },
    });
    expect(parsed.settings).toEqual({
      caffeine_half_life: '5.5',
      bedtime_hour: '22',
      voice_announce_enabled: 'false',
    });
    expect(fieldOf(() => parseImportCollections({ settings: 'bad' }))).toBe('settings');
    expect(fieldOf(() => parseImportCollections({ settings: { nested: { a: 1 } } }))).toBe('settings.nested');
  });

  test('M2-P1-R P2: regex ISO 8601 przed Date.parse oraz blokada kluczy prototypu i NaN/Infinity w settings', () => {
    expect(isValidIsoDate('2026-11-19')).toBe(true);
    expect(isValidIsoDate('2026-11-19T12:00:00Z')).toBe(true);
    expect(isValidIsoDate('2026/11/19')).toBe(false);
    expect(isValidIsoDate('2026-99-99')).toBe(false);
    // Odrzuca ciągi akceptowane przez luźny Date.parse ale niezgodne z ISO 8601
    expect(fieldOf(() => parseBrewSession({ id: 's', beverageType: 'COFFEE', method: 'V60', doseGrams: 15, waterGrams: 250, waterTempCelsius: 93, totalTimeSeconds: 180, brewedAt: '2026/11/19' }, 'sessions[0]'))).toBe('sessions[0].brewedAt');
    expect(fieldOf(() => parseBrewSession({ id: 's', beverageType: 'COFFEE', method: 'V60', doseGrams: 15, waterGrams: 250, waterTempCelsius: 93, totalTimeSeconds: 180, brewedAt: 'Nov 19, 2026' }, 'sessions[0]'))).toBe('sessions[0].brewedAt');
    // Pasuje do regex, ale niepoprawna kalendarzowo (Date.parse -> NaN)
    expect(fieldOf(() => parseBrewSession({ id: 's', beverageType: 'COFFEE', method: 'V60', doseGrams: 15, waterGrams: 250, waterTempCelsius: 93, totalTimeSeconds: 180, brewedAt: '2026-99-99' }, 'sessions[0]'))).toBe('sessions[0].brewedAt');
    // Poprawne formaty ISO 8601 (sama data, Z, offset)
    expect(parseBrewSession({ id: 's', beverageType: 'COFFEE', method: 'V60', doseGrams: 15, waterGrams: 250, waterTempCelsius: 93, totalTimeSeconds: 180, brewedAt: '2026-11-19' }, 'sessions[0]').brewedAt).toBe('2026-11-19');
    expect(parseBrewSession({ id: 's', beverageType: 'COFFEE', method: 'V60', doseGrams: 15, waterGrams: 250, waterTempCelsius: 93, totalTimeSeconds: 180, brewedAt: '2026-11-19T12:00:00.123+02:00' }, 'sessions[0]').brewedAt).toBe('2026-11-19T12:00:00.123+02:00');

    // Zakazane klucze w settings
    const withProto = JSON.parse('{"settings":{"__proto__":"polluted"}}');
    expect(fieldOf(() => parseImportCollections(withProto))).toBe('settings.__proto__');
    expect(fieldOf(() => parseImportCollections({ settings: { constructor: 'bad' } }))).toBe('settings.constructor');
    expect(fieldOf(() => parseImportCollections({ settings: { prototype: 'bad' } }))).toBe('settings.prototype');

    // Nieskończone liczby w settings
    expect(fieldOf(() => parseImportCollections({ settings: { bad_nan: Number.NaN } }))).toBe('settings.bad_nan');
    expect(fieldOf(() => parseImportCollections({ settings: { bad_inf: Number.POSITIVE_INFINITY } }))).toBe('settings.bad_inf');
  });
});



