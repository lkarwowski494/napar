// ============================================================================
// Napar (Steepwise) — Unit & Contract Tests: Knowledge Base
// (BR-WIEDZA-001 & BR-WIEDZA-002)
// Specialty Coffee Varieties, Processes, Origins & Artisan Tea Classification
// ============================================================================

import {
  COFFEE_VARIETIES,
  COFFEE_PROCESSES,
  COFFEE_ORIGINS,
  TEA_CATEGORIES,
  searchCoffeeVarieties,
  searchCoffeeProcesses,
  searchCoffeeOrigins,
  searchTeaCategories,
  findCoffeeVarietyById,
  findCoffeeProcessById,
  findCoffeeOriginById,
  findTeaCategoryById,
  getKnowledgeDescription,
  getKnowledgeSensoryProfile,
} from '../knowledge-data';

describe('Baza Wiedzy: Odmiany Botaniczne Kawy (COFFEE_VARIETIES)', () => {
  test('Zawiera minimum 10 wzorcowych odmian botanicznych o unikalnych ID', () => {
    expect(COFFEE_VARIETIES.length).toBeGreaterThanOrEqual(10);
    const ids = new Set<string>();

    for (const variety of COFFEE_VARIETIES) {
      expect(ids.has(variety.id)).toBe(false);
      ids.add(variety.id);

      expect(variety.name.trim().length).toBeGreaterThan(0);
      expect(variety.nativeRegion.trim().length).toBeGreaterThan(0);
      expect(variety.geneticLineage.trim().length).toBeGreaterThan(0);
      expect(variety.sensoryProfilePl.trim().length).toBeGreaterThan(0);
      expect(variety.sensoryProfileEn.trim().length).toBeGreaterThan(0);
      expect(variety.descriptionPl.trim().length).toBeGreaterThan(0);
      expect(variety.descriptionEn.trim().length).toBeGreaterThan(0);

      expect(variety.cupCharacteristics.acidity).toBeTruthy();
      expect(variety.cupCharacteristics.body).toBeTruthy();
      expect(variety.cupCharacteristics.sweetness).toBeTruthy();

      expect(variety.keyNotesPl.length).toBeGreaterThan(0);
      expect(variety.keyNotesEn.length).toBeGreaterThan(0);
      expect(variety.keyNotesPl.length).toBe(variety.keyNotesEn.length);
    }
  });

  test('Wyszukiwanie i pobieranie odmian botanicznych działa prawidłowo', () => {
    expect(searchCoffeeVarieties('')).toHaveLength(COFFEE_VARIETIES.length);
    expect(searchCoffeeVarieties('   ')).toHaveLength(COFFEE_VARIETIES.length);

    const geishaResults = searchCoffeeVarieties('Geisha');
    expect(geishaResults.length).toBeGreaterThanOrEqual(1);
    expect(geishaResults[0].id).toBe('variety-geisha');

    const jasminResults = searchCoffeeVarieties('jaśmin');
    expect(jasminResults.length).toBeGreaterThanOrEqual(1);

    expect(findCoffeeVarietyById('variety-geisha')).toBeDefined();
    expect(findCoffeeVarietyById('non-existent-id')).toBeUndefined();

    // TASK-P12-06-TRE: Wyszukiwanie odmian po geneticLineage oraz opisach
    const lineageResults = searchCoffeeVarieties('Tanganyika');
    expect(lineageResults.length).toBeGreaterThanOrEqual(1);
    expect(lineageResults.some((v) => v.id === 'variety-sl28-sl34')).toBe(true);

    // TASK-P13-06-TRE: Sanacja i trimowanie id w funkcjach pomocniczych find*ById
    expect(findCoffeeVarietyById('  variety-geisha  ')).toBeDefined();
    expect(findCoffeeVarietyById('')).toBeUndefined();
    expect(findCoffeeVarietyById(null as any)).toBeUndefined();

    expect(findCoffeeProcessById('  process-washed  ')).toBeDefined();
    expect(findCoffeeProcessById('')).toBeUndefined();
    expect(findCoffeeProcessById(null as any)).toBeUndefined();

    expect(findCoffeeOriginById('  origin-ethiopia  ')).toBeDefined();
    expect(findCoffeeOriginById('')).toBeUndefined();

    expect(findTeaCategoryById('  tea-green  ')).toBeDefined();
    expect(findTeaCategoryById('')).toBeUndefined();
  });
});

describe('Baza Wiedzy: Metody Obróbki Kawy (COFFEE_PROCESSES)', () => {
  test('Zawiera 6 kluczowych metod obróbki ziaren z parametrami technicznymi', () => {
    expect(COFFEE_PROCESSES.length).toBe(6);
    const ids = new Set<string>();

    for (const proc of COFFEE_PROCESSES) {
      expect(ids.has(proc.id)).toBe(false);
      ids.add(proc.id);

      expect(proc.name.trim().length).toBeGreaterThan(0);
      expect(proc.processType.trim().length).toBeGreaterThan(0);
      expect(proc.dryingDurationDays.trim().length).toBeGreaterThan(0);
      expect(proc.waterConsumption.trim().length).toBeGreaterThan(0);
      expect(proc.sensoryImpactPl.trim().length).toBeGreaterThan(0);
      expect(proc.sensoryImpactEn.trim().length).toBeGreaterThan(0);
      expect(proc.descriptionPl.trim().length).toBeGreaterThan(0);
      expect(proc.descriptionEn.trim().length).toBeGreaterThan(0);

      expect(proc.keyNotesPl.length).toBeGreaterThan(0);
      expect(proc.keyNotesEn.length).toBeGreaterThan(0);
    }
  });

  test('Wyszukiwanie i pobieranie metod obróbki', () => {
    expect(searchCoffeeProcesses('')).toHaveLength(COFFEE_PROCESSES.length);

    const anaerobic = searchCoffeeProcesses('anaerobic');
    expect(anaerobic.length).toBeGreaterThanOrEqual(1);
    expect(anaerobic[0].id).toBe('process-anaerobic');

    const honey = searchCoffeeProcesses('miód');
    expect(honey.length).toBeGreaterThanOrEqual(1);

    // TASK-P10-06-TRE: Wyszukiwanie w polskim i angielskim opisie technologicznym
    const descPlSearch = searchCoffeeProcesses('XIX wieku');
    expect(descPlSearch.length).toBeGreaterThanOrEqual(1);
    expect(descPlSearch[0].id).toBe('process-washed');

    const descEnSearch = searchCoffeeProcesses('19th century');
    expect(descEnSearch.length).toBeGreaterThanOrEqual(1);
    expect(descEnSearch[0].id).toBe('process-washed');

    expect(findCoffeeProcessById('process-washed')).toBeDefined();
    expect(findCoffeeProcessById('non-existent-process')).toBeUndefined();
  });
});

describe('Baza Wiedzy: Terroir i Regiony Kawowe (COFFEE_ORIGINS)', () => {
  test('Zawiera 7 najważniejszych krajów specialty o unikalnych kodach ISO', () => {
    expect(COFFEE_ORIGINS.length).toBe(7);
    const ids = new Set<string>();
    const countryCodes = new Set<string>();

    for (const origin of COFFEE_ORIGINS) {
      expect(ids.has(origin.id)).toBe(false);
      ids.add(origin.id);

      expect(countryCodes.has(origin.countryCode)).toBe(false);
      countryCodes.add(origin.countryCode);

      expect(origin.country.trim().length).toBeGreaterThan(0);
      expect(origin.primaryRegions.length).toBeGreaterThan(0);
      expect(origin.typicalAltitudeMeters.trim().length).toBeGreaterThan(0);
      expect(origin.harvestMonths.trim().length).toBeGreaterThan(0);
      expect(origin.mainVarieties.length).toBeGreaterThan(0);
      expect(origin.flavorProfilePl.trim().length).toBeGreaterThan(0);
      expect(origin.flavorProfileEn.trim().length).toBeGreaterThan(0);
      expect(origin.keyNotesPl.length).toBeGreaterThan(0);
      expect(origin.keyNotesEn.length).toBeGreaterThan(0);
      expect(origin.keyNotesPl.length).toBe(origin.keyNotesEn.length);
    }
  });

  test('Wyszukiwanie i pobieranie regionów kawowych', () => {
    expect(searchCoffeeOrigins('')).toHaveLength(COFFEE_ORIGINS.length);

    const ethiopia = searchCoffeeOrigins('Etiopia');
    expect(ethiopia.length).toBe(1);
    expect(ethiopia[0].countryCode).toBe('ET');

    const yirgacheffe = searchCoffeeOrigins('Yirgacheffe');
    expect(yirgacheffe.length).toBe(1);
    expect(yirgacheffe[0].id).toBe('origin-ethiopia');

    // TASK-P9-06-TRE: Wyszukiwanie po angielskiej nazwie kraju
    const ethiopiaEn = searchCoffeeOrigins('Ethiopia');
    expect(ethiopiaEn.length).toBe(1);
    expect(ethiopiaEn[0].id).toBe('origin-ethiopia');

    const brazilEn = searchCoffeeOrigins('Brazil');
    expect(brazilEn.length).toBe(1);
    expect(brazilEn[0].id).toBe('origin-brazil');

    const costaRicaEn = searchCoffeeOrigins('Costa Rica');
    expect(costaRicaEn.length).toBe(1);
    expect(costaRicaEn[0].id).toBe('origin-costa-rica');

    expect(findCoffeeOriginById('origin-kenya')).toBeDefined();
    expect(findCoffeeOriginById('non-existent-origin')).toBeUndefined();
  });
});

describe('Baza Wiedzy: Klasyfikacja Herbaty Rzemieślniczej (TEA_CATEGORIES)', () => {
  test('Zawiera 6 tradycyjnych kategorii herbaty z parametrami temperaturowymi', () => {
    expect(TEA_CATEGORIES.length).toBe(6);
    const ids = new Set<string>();

    for (const tea of TEA_CATEGORIES) {
      expect(ids.has(tea.id)).toBe(false);
      ids.add(tea.id);

      expect(tea.namePl.trim().length).toBeGreaterThan(0);
      expect(tea.nameEn.trim().length).toBeGreaterThan(0);
      expect(tea.traditionalName.trim().length).toBeGreaterThan(0);
      expect(tea.oxidationRangePercent.trim().length).toBeGreaterThan(0);
      expect(tea.killGreenMethod.trim().length).toBeGreaterThan(0);
      expect(tea.waterTemperatureCelsius).toBeGreaterThanOrEqual(60);
      expect(tea.waterTemperatureCelsius).toBeLessThanOrEqual(100);
      expect(tea.sensoryProfilePl.trim().length).toBeGreaterThan(0);
      expect(tea.sensoryProfileEn.trim().length).toBeGreaterThan(0);
      expect(tea.famousVarietiesPl.length).toBeGreaterThan(0);
      expect(tea.famousVarietiesEn.length).toBeGreaterThan(0);
      expect(tea.famousVarietiesPl.length).toBe(tea.famousVarietiesEn.length);
      expect(tea.famousRegions.length).toBeGreaterThan(0);
      expect(tea.healthAttributesPl.trim().length).toBeGreaterThan(0);
    }
  });

  test('Wyszukiwanie i pobieranie kategorii herbaty', () => {
    expect(searchTeaCategories('')).toHaveLength(TEA_CATEGORIES.length);

    const green = searchTeaCategories('zielona');
    expect(green.length).toBe(1);
    expect(green[0].id).toBe('tea-green');

    const oolong = searchTeaCategories('Da Hong Pao');
    expect(oolong.length).toBe(1);
    expect(oolong[0].id).toBe('tea-oolong');

    const puerh = searchTeaCategories('Yunnan');
    expect(puerh.length).toBeGreaterThanOrEqual(1);

    expect(findTeaCategoryById('tea-white')).toBeDefined();

    // TASK-P8-06-TRE: Wyszukiwanie herbat po angielskich nazwach odmian
    const dragonWell = searchTeaCategories('Dragon Well');
    expect(dragonWell.length).toBe(1);
    expect(dragonWell[0].id).toBe('tea-green');

    const bigRedRobe = searchTeaCategories('Big Red Robe');
    expect(bigRedRobe.length).toBe(1);
    expect(bigRedRobe[0].id).toBe('tea-oolong');
    expect(findTeaCategoryById('non-existent-tea')).toBeUndefined();
  });

  test('Wyszukiwanie wielojęzyczne i filtry zaawansowane', () => {
    // Odmiany - wyszukiwanie po regionie i angielskich nutach
    const byRegion = searchCoffeeVarieties('Scott Agricultural');
    expect(byRegion.length).toBeGreaterThanOrEqual(1);

    const byEnNote = searchCoffeeVarieties('blackcurrant');
    expect(byEnNote.length).toBeGreaterThanOrEqual(1);

    const bySensory = searchCoffeeVarieties('krystaliczna czystość');
    expect(bySensory.length).toBeGreaterThanOrEqual(1);

    // Obróbki - wyszukiwanie po sensoryce i typie obróbki
    const byProcType = searchCoffeeProcesses('WET_HULLED');
    expect(byProcType.length).toBeGreaterThanOrEqual(1);

    const byProcSensory = searchCoffeeProcesses('wilgotności');
    expect(byProcSensory.length).toBeGreaterThanOrEqual(1);

    // Terroir - wyszukiwanie po odmianach i profilu sensorycznym
    const byVarietyInOrigin = searchCoffeeOrigins('Bourbon');
    expect(byVarietyInOrigin.length).toBeGreaterThanOrEqual(1);

    const bySensoryOrigin = searchCoffeeOrigins('jaśmin');
    expect(bySensoryOrigin.length).toBeGreaterThanOrEqual(1);

    // Herbata - wyszukiwanie po nazwie angielskiej i regionie
    const byEnTea = searchTeaCategories('White Tea');
    expect(byEnTea.length).toBeGreaterThanOrEqual(1);

    const byTeaRegion = searchTeaCategories('Fujian');
    expect(byTeaRegion.length).toBeGreaterThanOrEqual(1);

    const byTeaSensory = searchTeaCategories('kwiatowy');
    expect(byTeaSensory.length).toBeGreaterThanOrEqual(1);

    // TASK-P7-06-TRE: Wyszukiwanie po angielskich profilach sensorycznych i deskryptorach
    const byVarEnSensory = searchCoffeeVarieties('crystal clarity');
    expect(byVarEnSensory.length).toBeGreaterThanOrEqual(1);
    expect(byVarEnSensory[0].id).toBe('variety-geisha');

    const byProcEnSensory = searchCoffeeProcesses('cleanliness');
    expect(byProcEnSensory.length).toBeGreaterThanOrEqual(1);

    const byTeaEnSensory = searchTeaCategories('silky');
    expect(byTeaEnSensory.length).toBeGreaterThanOrEqual(1);
  });

  test('Pobieranie opisów i profili sensorycznych przez getKnowledgeDescription i getKnowledgeSensoryProfile', () => {
    // Opisy
    expect(getKnowledgeDescription('variety-geisha', 'pl')).toContain('Najbardziej ceniona');
    expect(getKnowledgeDescription('variety-geisha', 'en')).toContain('The most prestigious');

    // Profile sensoryczne odmian
    expect(getKnowledgeSensoryProfile('variety-geisha', 'pl')).toContain('Krystaliczna czystość');
    expect(getKnowledgeSensoryProfile('variety-geisha', 'en')).toContain('Crystal clarity');

    // Profile sensoryczne obróbek
    expect(getKnowledgeSensoryProfile('process-washed', 'pl')).toContain('przejrzystość');
    expect(getKnowledgeSensoryProfile('process-washed', 'en')).toContain('clarity');

    // Profile sensoryczne terroir
    expect(getKnowledgeSensoryProfile('origin-ethiopia', 'pl')).toContain('jaśmin');
    expect(getKnowledgeSensoryProfile('origin-ethiopia', 'en')).toContain('jasmine');
  });

  test('TASK-P11-06-TRE: searchCoffeeOrigins i searchTeaCategories przeszukują pola opisowe descriptionPl i descriptionEn', () => {
    // Terroir - wyszukiwanie po słowach obecnych w descriptionPl / descriptionEn
    const byOriginDescPl = searchCoffeeOrigins('kolebka');
    expect(byOriginDescPl.length).toBeGreaterThanOrEqual(1);
    expect(byOriginDescPl[0].id).toBe('origin-ethiopia');

    const byOriginDescEn = searchCoffeeOrigins('birthplace');
    expect(byOriginDescEn.length).toBeGreaterThanOrEqual(1);
    expect(byOriginDescEn[0].id).toBe('origin-ethiopia');

    // Herbata - wyszukiwanie po słowach obecnych w descriptionPl / descriptionEn
    const byTeaDescPl = searchTeaCategories('liści');
    expect(byTeaDescPl.length).toBeGreaterThanOrEqual(1);

    const byTeaDescEn = searchTeaCategories('leaves');
    expect(byTeaDescEn.length).toBeGreaterThanOrEqual(1);
  });

  test('TASK-P14-06-TRE: getKnowledgeDescription i getKnowledgeSensoryProfile bezpiecznie zwracają pusty string dla nieznanych ID i nullish', () => {
    expect(getKnowledgeDescription('non-existent-id')).toBe('');
    expect(getKnowledgeDescription('')).toBe('');
    expect(getKnowledgeDescription(null as any)).toBe('');

    expect(getKnowledgeSensoryProfile('non-existent-id')).toBe('');
    expect(getKnowledgeSensoryProfile('')).toBe('');
    expect(getKnowledgeSensoryProfile(null as any)).toBe('');
  });

  test('TASK-P15-06-TRE: searchTeaCategories uwzględnia healthAttributesPl oraz chroni przed wartościami niebędącymi stringiem', () => {
    // Odporność na non-string query we wszystkich wyszukiwarkach
    expect(searchTeaCategories(null as any)).toHaveLength(TEA_CATEGORIES.length);
    expect(searchTeaCategories(123 as any)).toHaveLength(TEA_CATEGORIES.length);
    expect(searchCoffeeVarieties(null as any)).toHaveLength(COFFEE_VARIETIES.length);
    expect(searchCoffeeProcesses(undefined as any)).toHaveLength(COFFEE_PROCESSES.length);
    expect(searchCoffeeOrigins({} as any)).toHaveLength(COFFEE_ORIGINS.length);

    // Wyszukiwanie po atrybutach zdrowotnych (healthAttributesPl)
    const byLTheanine = searchTeaCategories('L-teaninę');
    expect(byLTheanine.length).toBeGreaterThanOrEqual(1);
    expect(byLTheanine[0].id).toBe('tea-green');

    const byPolifenole = searchTeaCategories('polifenole');
    expect(byPolifenole.length).toBeGreaterThanOrEqual(1);
  });

  test('TASK-P16-06-TRE: searchCoffeeOrigins przeszukuje countryCode oraz typicalAltitudeMeters', () => {
    const byCode = searchCoffeeOrigins('ET');
    expect(byCode.some((o) => o.countryCode === 'ET')).toBe(true);

    const byAltitude = searchCoffeeOrigins('2200');
    expect(byAltitude.length).toBeGreaterThanOrEqual(1);
  });

  test('TASK-P17-06-TRE: searchCoffeeProcesses przeszukuje dryingDurationDays oraz waterConsumption', () => {
    const byWater = searchCoffeeProcesses('Zerowe');
    expect(byWater.length).toBeGreaterThanOrEqual(1);
    expect(byWater.some((p) => p.waterConsumption === 'Zerowe')).toBe(true);

    const byDrying = searchCoffeeProcesses('dni');
    expect(byDrying.length).toBeGreaterThanOrEqual(1);
  });
});
