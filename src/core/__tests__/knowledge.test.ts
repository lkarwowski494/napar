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

  test('TASK-P18-06-TRE: funkcje findById są odporne na wielkość liter i białe znaki', () => {
    expect(findCoffeeVarietyById('  VARIETY-GEISHA  ')?.id).toBe('variety-geisha');
    expect(findCoffeeProcessById('Process-Washed')?.id).toBe('process-washed');
    expect(findCoffeeOriginById('ORIGIN-ETHIOPIA')?.id).toBe('origin-ethiopia');
    expect(findTeaCategoryById('TEA-GREEN')?.id).toBe('tea-green');
  });

  test('TASK-P19-06-TRE: searchCoffeeVarieties przeszukuje recommendedRoast i cupCharacteristics, a searchTeaCategories oxidation i killGreenMethod', () => {
    const byRoast = searchCoffeeVarieties('Omniroast');
    expect(byRoast.length).toBeGreaterThanOrEqual(1);

    const byBody = searchCoffeeVarieties('Jedwabiste');
    expect(byBody.length).toBeGreaterThanOrEqual(1);

    const byOxidation = searchTeaCategories('0%');
    expect(byOxidation.length).toBeGreaterThanOrEqual(1);

    const byKillGreen = searchTeaCategories('parowanie');
    expect(byKillGreen.length).toBeGreaterThanOrEqual(1);
  });

  test('TASK-P20-06-TRE: searchCoffeeOrigins przeszukuje harvestMonths oraz bezpiecznie obsługuje tablice regionów i odmian', () => {
    const byHarvest = searchCoffeeOrigins('październik');
    expect(byHarvest.length).toBeGreaterThanOrEqual(1);

    const byRegion = searchCoffeeOrigins('Sidama');
    expect(byRegion.length).toBeGreaterThanOrEqual(1);
  });
  test('TASK-P21-06-TRE: searchCoffeeProcesses defensywnie chroni przed brakującymi polami i spacjami w zapytaniu', () => {
    const res = searchCoffeeProcesses('   beztlenowa   ');
    expect(res.length).toBeGreaterThanOrEqual(1);
    expect(res.some((p) => p.id === 'process-anaerobic')).toBe(true);

    const emptyRes = searchCoffeeProcesses('   ');
    expect(emptyRes).toHaveLength(COFFEE_PROCESSES.length);
  });
  test('TASK-P22-06-TRE: findCoffeeOriginById i findTeaCategoryById bezpiecznie zwracają undefined dla nie-stringów i whitespace', () => {
    expect(findCoffeeOriginById(null as any)).toBeUndefined();
    expect(findCoffeeOriginById(undefined as any)).toBeUndefined();
    expect(findCoffeeOriginById(12345 as any)).toBeUndefined();
    expect(findCoffeeOriginById('   ')).toBeUndefined();

    expect(findTeaCategoryById(null as any)).toBeUndefined();
    expect(findTeaCategoryById(undefined as any)).toBeUndefined();
    expect(findTeaCategoryById({} as any)).toBeUndefined();
    expect(findTeaCategoryById('   ')).toBeUndefined();
  });

  test('TASK-P23-06-TRE: searchTeaCategories defensywnie przeszukuje odmiany i regiony oraz toleruje spacje', () => {
    const res = searchTeaCategories('   Uji   ');
    expect(res.length).toBeGreaterThanOrEqual(1);
    expect(res.some((t) => t.id === 'tea-green')).toBe(true);

    const varietyRes = searchTeaCategories('Longjing');
    expect(varietyRes.length).toBeGreaterThanOrEqual(1);
    expect(varietyRes.some((t) => t.id === 'tea-green')).toBe(true);

    const emptyRes = searchTeaCategories(null as any);
    expect(emptyRes).toHaveLength(TEA_CATEGORIES.length);
  });
  test('TASK-P24-06-TRE: searchCoffeeVarieties i searchCoffeeOrigins defensywnie przeszukują keyNotes', () => {
    const varietyRes = searchCoffeeVarieties('jaśmin');
    expect(varietyRes.length).toBeGreaterThanOrEqual(1);

    const originRes = searchCoffeeOrigins('bergamotka');
    expect(originRes.length).toBeGreaterThanOrEqual(1);
    expect(originRes.some((o) => o.id === 'origin-ethiopia')).toBe(true);
  });

  test('TASK-P25-06-TRE: getKnowledgeDescription i getKnowledgeSensoryProfile normalizują wielkość liter w ID', () => {
    const descPl = getKnowledgeDescription('   VARIETY-GEISHA   ', 'pl');
    expect(descPl.length).toBeGreaterThan(0);
    expect(descPl).toContain('Najbardziej ceniona');

    const sensoryPl = getKnowledgeSensoryProfile('VARIETY-GEISHA', 'pl');
    expect(sensoryPl.length).toBeGreaterThan(0);
    expect(sensoryPl).toContain('Krystaliczna czystość');

    const descEn = getKnowledgeDescription('VARIETY-SL28-SL34', 'en');
    expect(descEn.length).toBeGreaterThan(0);
    expect(descEn).toContain('Bred in Kenya');

    const sensoryEn = getKnowledgeSensoryProfile('VARIETY-SL28-SL34', 'en');
    expect(sensoryEn.length).toBeGreaterThan(0);
    expect(sensoryEn).toContain('phosphoric acidity');
  });

  test('TASK-P26-06-TRE: searchCoffeeOrigins defensywnie chroni przed brakującymi polami profilu', () => {
    const res = searchCoffeeOrigins('   Etiopia   ');
    expect(res.length).toBeGreaterThanOrEqual(1);
    expect(res[0].countryCode).toBe('ET');

    const emptyRes = searchCoffeeOrigins(null as any);
    expect(emptyRes.length).toBe(COFFEE_ORIGINS.length);
  });

  test('TASK-P27-06-TRE: findCoffeeProcessById oraz searchCoffeeProcesses i searchCoffeeVarieties są odporne na wielkość liter i spacje', () => {
    const washed = findCoffeeProcessById('  PROCESS-WASHED  ');
    expect(washed).toBeDefined();
    expect(washed?.id).toBe('process-washed');

    const natural = findCoffeeProcessById('\tprocess-natural\n');
    expect(natural).toBeDefined();
    expect(natural?.id).toBe('process-natural');

    const invalid = findCoffeeProcessById('   ');
    expect(invalid).toBeUndefined();

    const procRes = searchCoffeeProcesses('   fermentacja   ');
    expect(procRes.length).toBeGreaterThanOrEqual(1);

    const varRes = searchCoffeeVarieties('   geisha   ');
    expect(varRes.length).toBeGreaterThanOrEqual(1);
    expect(varRes.some((v) => v.id.toLowerCase().includes('geisha'))).toBe(true);
  });

  test('TASK-P28-06-TRE: searchTeaCategories defensywnie chroni przed brakującymi polami i spacjami', () => {
    const res = searchTeaCategories('   matcha   ');
    expect(res.length).toBeGreaterThanOrEqual(1);

    const emptyRes = searchTeaCategories(null as any);
    expect(emptyRes.length).toBe(TEA_CATEGORIES.length);
  });

  test('TASK-P29-06-TRE: findCoffeeOriginById wspiera wyszukiwanie po countryCode i id bez wzgledu na wielkosc liter', () => {
    const ethiopiaById = findCoffeeOriginById('origin-ethiopia');
    expect(ethiopiaById).toBeDefined();
    expect(ethiopiaById?.countryCode).toBe('ET');

    const ethiopiaByCode = findCoffeeOriginById('et');
    expect(ethiopiaByCode).toBeDefined();
    expect(ethiopiaByCode?.id).toBe('origin-ethiopia');

    const colombiaUpper = findCoffeeOriginById('CO');
    expect(colombiaUpper).toBeDefined();
    expect(colombiaUpper?.country).toBe('Kolumbia');

    expect(findCoffeeOriginById('   ')).toBeUndefined();
    expect(findCoffeeOriginById('UNKNOWN_CODE')).toBeUndefined();
  });

  test('TASK-P30-06-TRE: findTeaCategoryById wspiera wyszukiwanie po namePl, nameEn oraz traditionalName', () => {
    // Po namePl
    const greenByPl = findTeaCategoryById('Zielona herbata');
    expect(greenByPl).toBeDefined();
    expect(greenByPl?.id).toBe('tea-green');

    // Po nameEn
    const oolongByEn = findTeaCategoryById('Oolong Tea');
    expect(oolongByEn).toBeDefined();
    expect(oolongByEn?.id).toBe('tea-oolong');

    // Po traditionalName
    const matchaByTrad = findTeaCategoryById('Lü Cha');
    expect(matchaByTrad).toBeDefined();
    expect(matchaByTrad?.id).toBe('tea-green');

    // Po id
    const whiteById = findTeaCategoryById('tea-white');
    expect(whiteById).toBeDefined();

    expect(findTeaCategoryById('   ')).toBeUndefined();
    expect(findTeaCategoryById('Nieznana Herbata')).toBeUndefined();
  });

  test('TASK-P31-06-TRE: findCoffeeVarietyById oraz findCoffeeProcessById wspieraja wyszukiwanie po nazwie i typie procesu', () => {
    // Odmiana po nazwie
    const geishaByName = findCoffeeVarietyById('Geisha / Gesha');
    expect(geishaByName).toBeDefined();
    expect(geishaByName?.id).toBe('variety-geisha');

    const geishaBySubstr = findCoffeeVarietyById('Gesha');
    expect(geishaBySubstr).toBeDefined();
    expect(geishaBySubstr?.id).toBe('variety-geisha');

    // Proces po processType
    const washedByType = findCoffeeProcessById('WASHED');
    expect(washedByType).toBeDefined();
    expect(washedByType?.id).toBe('process-washed');

    // Proces po nazwie
    const naturalByName = findCoffeeProcessById('Sucha (Natural)');
    expect(naturalByName).toBeDefined();
    expect(naturalByName?.id).toBe('process-natural');

    expect(findCoffeeVarietyById('   ')).toBeUndefined();
    expect(findCoffeeProcessById('   ')).toBeUndefined();
  });

  test('TASK-P32-06-TRE: findCoffeeOriginById wspiera wyszukiwanie po polskiej i angielskiej nazwie kraju', () => {
    // Po polskiej nazwie
    const ethiopiaPl = findCoffeeOriginById('Etiopia');
    expect(ethiopiaPl).toBeDefined();
    expect(ethiopiaPl?.id).toBe('origin-ethiopia');

    // Po angielskiej nazwie
    const ethiopiaEn = findCoffeeOriginById('Ethiopia');
    expect(ethiopiaEn).toBeDefined();
    expect(ethiopiaEn?.id).toBe('origin-ethiopia');

    // Po polskiej nazwie z diakrytykami i bez
    const colombiaPl = findCoffeeOriginById('Kolumbia');
    expect(colombiaPl).toBeDefined();
    expect(colombiaPl?.countryCode).toBe('CO');

    const colombiaEn = findCoffeeOriginById('Colombia');
    expect(colombiaEn).toBeDefined();
    expect(colombiaEn?.id).toBe('origin-colombia');

    expect(findCoffeeOriginById('   ')).toBeUndefined();
    expect(findCoffeeOriginById('Nieznany Kraj')).toBeUndefined();
  });

  test('TASK-P33-06-TRE: findTeaCategoryById dopasowuje podciągi i tokeny nazw PL i EN', () => {
    // Po słowie kluczowym "zielona"
    const greenPl = findTeaCategoryById('zielona');
    expect(greenPl).toBeDefined();
    expect(greenPl?.id).toBe('tea-green');

    // Po słowie "green"
    const greenEn = findTeaCategoryById('green');
    expect(greenEn).toBeDefined();
    expect(greenEn?.id).toBe('tea-green');

    // Po słowie "czarna"
    const blackPl = findTeaCategoryById('czarna');
    expect(blackPl).toBeDefined();
    expect(blackPl?.id).toBe('tea-black');

    // Po słowie "oolong"
    const oolong = findTeaCategoryById('oolong');
    expect(oolong).toBeDefined();
    expect(oolong?.id).toBe('tea-oolong');

    expect(findTeaCategoryById('   ')).toBeUndefined();
    expect(findTeaCategoryById('nieznana herbata')).toBeUndefined();
  });

  test('TASK-P34-06-TRE: searchCoffeeVarieties, searchCoffeeProcesses, searchCoffeeOrigins i searchTeaCategories wspierają wyszukiwanie po identyfikatorze ID', () => {
    const varById = searchCoffeeVarieties('variety-geisha');
    expect(varById.length).toBeGreaterThanOrEqual(1);
    expect(varById[0].id).toBe('variety-geisha');

    const procById = searchCoffeeProcesses('process-washed');
    expect(procById.length).toBeGreaterThanOrEqual(1);
    expect(procById[0].id).toBe('process-washed');

    const origById = searchCoffeeOrigins('origin-kenya');
    expect(origById.length).toBeGreaterThanOrEqual(1);
    expect(origById[0].id).toBe('origin-kenya');

    const teaById = searchTeaCategories('tea-white');
    expect(teaById.length).toBeGreaterThanOrEqual(1);
    expect(teaById[0].id).toBe('tea-white');
  });

  test('TASK-P35-06-TRE: findCoffeeVarietyById wspiera popularne aliasy i warianty pisowni (gesha, sl-28, bourbon, typica)', () => {
    const gesha = findCoffeeVarietyById('gesha');
    expect(gesha).toBeDefined();
    expect(gesha?.id).toBe('variety-geisha');

    const sl28 = findCoffeeVarietyById('sl-28');
    expect(sl28).toBeDefined();
    expect(sl28?.id).toBe('variety-sl28-sl34');

    const bourbon = findCoffeeVarietyById('bourbon');
    expect(bourbon).toBeDefined();
    expect(bourbon?.id).toBe('variety-bourbon');

    const typica = findCoffeeVarietyById('typica');
    expect(typica).toBeDefined();
    expect(typica?.id).toBe('variety-typica');
  });

  test('TASK-P36-06-TRE: findCoffeeProcessById wspiera popularne aliasy (washed, mokra, natural, honey, anaerobic, carbonic, giling-basah)', () => {
    const washed = findCoffeeProcessById('washed');
    expect(washed).toBeDefined();
    expect(washed?.id).toBe('process-washed');

    const mokra = findCoffeeProcessById('mokra');
    expect(mokra).toBeDefined();
    expect(mokra?.id).toBe('process-washed');

    const natural = findCoffeeProcessById('natural');
    expect(natural).toBeDefined();
    expect(natural?.id).toBe('process-natural');

    const honey = findCoffeeProcessById('honey');
    expect(honey).toBeDefined();
    expect(honey?.id).toBe('process-honey');

    const anaerobic = findCoffeeProcessById('anaerobic');
    expect(anaerobic).toBeDefined();
    expect(anaerobic?.id).toBe('process-anaerobic');

    const carbonic = findCoffeeProcessById('carbonic');
    expect(carbonic).toBeDefined();
    expect(carbonic?.id).toBe('process-carbonic-maceration');

    const wetHulled = findCoffeeProcessById('giling-basah');
    expect(wetHulled).toBeDefined();
    expect(wetHulled?.id).toBe('process-wet-hulled');
  });

  test('TASK-P37-06-TRE: findTeaCategoryById wspiera popularne aliasy kategorii herbaty', () => {
    const white = findTeaCategoryById('white');
    expect(white).toBeDefined();
    expect(white?.id).toBe('tea-white');

    const biala = findTeaCategoryById('biala');
    expect(biala).toBeDefined();
    expect(biala?.id).toBe('tea-white');

    const green = findTeaCategoryById('green');
    expect(green).toBeDefined();
    expect(green?.id).toBe('tea-green');

    const zielona = findTeaCategoryById('zielona');
    expect(zielona).toBeDefined();
    expect(zielona?.id).toBe('tea-green');

    const oolong = findTeaCategoryById('oolong');
    expect(oolong).toBeDefined();
    expect(oolong?.id).toBe('tea-oolong');

    const turkusowa = findTeaCategoryById('turkusowa');
    expect(turkusowa).toBeDefined();
    expect(turkusowa?.id).toBe('tea-oolong');

    const black = findTeaCategoryById('black');
    expect(black).toBeDefined();
    expect(black?.id).toBe('tea-black');

    const czarna = findTeaCategoryById('czarna');
    expect(czarna).toBeDefined();
    expect(czarna?.id).toBe('tea-black');

    const puerh = findTeaCategoryById('puerh');
    expect(puerh).toBeDefined();
    expect(puerh?.id).toBe('tea-puerh');

    const ciemna = findTeaCategoryById('ciemna');
    expect(ciemna).toBeDefined();
    expect(ciemna?.id).toBe('tea-puerh');
  });

  test('TASK-P38-06-TRE: findCoffeeVarietyById wspiera odmiany caturra, catuai, pacamara, maragogype, castillo, colombia, heirloom', () => {
    expect(findCoffeeVarietyById('caturra')?.id).toBe('variety-caturra-catuai');
    expect(findCoffeeVarietyById('catuai')?.id).toBe('variety-caturra-catuai');
    expect(findCoffeeVarietyById('pacamara')?.id).toBe('variety-pacamara-maragogype');
    expect(findCoffeeVarietyById('maragogype')?.id).toBe('variety-pacamara-maragogype');
    expect(findCoffeeVarietyById('maragogipe')?.id).toBe('variety-pacamara-maragogype');
    expect(findCoffeeVarietyById('castillo')?.id).toBe('variety-castillo-colombia');
    expect(findCoffeeVarietyById('colombia')?.id).toBe('variety-castillo-colombia');
    expect(findCoffeeVarietyById('heirloom')?.id).toBe('variety-ethiopian-landraces');
    expect(findCoffeeVarietyById('ethiopian-heirloom')?.id).toBe('variety-ethiopian-landraces');
    expect(findCoffeeVarietyById('landraces')?.id).toBe('variety-ethiopian-landraces');
    expect(findCoffeeVarietyById('eugenioides')?.id).toBe('variety-eugenioides');
    expect(findCoffeeVarietyById('pink-bourbon')?.id).toBe('variety-pink-bourbon');
    expect(findCoffeeVarietyById('pinkbourbon')?.id).toBe('variety-pink-bourbon');
  });

  test('TASK-P39-06-TRE: findCoffeeProcessById wspiera aliasy semi-washed, pulped-natural, wet-hulled oraz szok termiczny', () => {
    expect(findCoffeeProcessById('semi-washed')?.id).toBe('process-honey');
    expect(findCoffeeProcessById('semiwashed')?.id).toBe('process-honey');
    expect(findCoffeeProcessById('pulped-natural')?.id).toBe('process-honey');
    expect(findCoffeeProcessById('wet-hulled')?.id).toBe('process-wet-hulled');
    expect(findCoffeeProcessById('giling-basah')?.id).toBe('process-wet-hulled');
    expect(findCoffeeProcessById('carbonic-maceration')?.id).toBe('process-carbonic-maceration');
    expect(findCoffeeProcessById('maceracja-weglowa')?.id).toBe('process-carbonic-maceration');
    expect(findCoffeeProcessById('thermal-shock')?.id).toBe('process-anaerobic');
    expect(findCoffeeProcessById('szok-termiczny')?.id).toBe('process-anaerobic');
  });

  test('TASK-P40-06-TRE: findCoffeeOriginById wspiera 3-literowe kody ISO oraz alternatywne warianty pisowni (eth, ken, col, gtm, cri, bra, pan)', () => {
    expect(findCoffeeOriginById('eth')?.id).toBe('origin-ethiopia');
    expect(findCoffeeOriginById('etiopia')?.id).toBe('origin-ethiopia');
    expect(findCoffeeOriginById('ken')?.id).toBe('origin-kenya');
    expect(findCoffeeOriginById('col')?.id).toBe('origin-colombia');
    expect(findCoffeeOriginById('kolumbia')?.id).toBe('origin-colombia');
    expect(findCoffeeOriginById('gtm')?.id).toBe('origin-guatemala');
    expect(findCoffeeOriginById('cri')?.id).toBe('origin-costa-rica');
    expect(findCoffeeOriginById('kostaryka')?.id).toBe('origin-costa-rica');
    expect(findCoffeeOriginById('bra')?.id).toBe('origin-brazil');
    expect(findCoffeeOriginById('brasil')?.id).toBe('origin-brazil');
    expect(findCoffeeOriginById('brazylia')?.id).toBe('origin-brazil');
    expect(findCoffeeOriginById('pan')?.id).toBe('origin-panama');
  });

  test('TASK-P41-06-TRE: findCoffeeVarietyById wspiera odmiany batian, ruiru-11, sidra, wush-wush, chiroso oraz tabi', () => {
    expect(findCoffeeVarietyById('batian')?.id).toBe('variety-sl28-sl34');
    expect(findCoffeeVarietyById('ruiru-11')?.id).toBe('variety-sl28-sl34');
    expect(findCoffeeVarietyById('ruiru 11')?.id).toBe('variety-sl28-sl34');
    expect(findCoffeeVarietyById('sidra')?.id).toBe('variety-bourbon');
    expect(findCoffeeVarietyById('wush-wush')?.id).toBe('variety-ethiopian-landraces');
    expect(findCoffeeVarietyById('wushwush')?.id).toBe('variety-ethiopian-landraces');
    expect(findCoffeeVarietyById('chiroso')?.id).toBe('variety-ethiopian-landraces');
    expect(findCoffeeVarietyById('tabi')?.id).toBe('variety-castillo-colombia');
  });

  test('TASK-P42-06-TRE: findCoffeeProcessById wspiera aliasy co-fermentation, lactic, double-washed i drozdze', () => {
    expect(findCoffeeProcessById('co-fermentation')?.id).toBe('process-anaerobic');
    expect(findCoffeeProcessById('cofermentation')?.id).toBe('process-anaerobic');
    expect(findCoffeeProcessById('kofermentacja')?.id).toBe('process-anaerobic');
    expect(findCoffeeProcessById('lactic')?.id).toBe('process-anaerobic');
    expect(findCoffeeProcessById('mleczna')?.id).toBe('process-anaerobic');
    expect(findCoffeeProcessById('double-washed')?.id).toBe('process-washed');
    expect(findCoffeeProcessById('doublewashed')?.id).toBe('process-washed');
    expect(findCoffeeProcessById('podwojnie-myta')?.id).toBe('process-washed');
    expect(findCoffeeProcessById('yeast-fermentation')?.id).toBe('process-anaerobic');
    expect(findCoffeeProcessById('drozdze')?.id).toBe('process-anaerobic');
  });

  test('TASK-P43-06-TRE: findTeaCategoryById wspiera aliasy popularnych odmian (sencha, matcha, darjeeling, oolong, baimudan)', () => {
    expect(findTeaCategoryById('sencha')?.id).toBe('tea-green');
    expect(findTeaCategoryById('gyokuro')?.id).toBe('tea-green');
    expect(findTeaCategoryById('matcha')?.id).toBe('tea-green');
    expect(findTeaCategoryById('genmaicha')?.id).toBe('tea-green');
    expect(findTeaCategoryById('longjing')?.id).toBe('tea-green');
    expect(findTeaCategoryById('darjeeling')?.id).toBe('tea-black');
    expect(findTeaCategoryById('assam')?.id).toBe('tea-black');
    expect(findTeaCategoryById('ceylon')?.id).toBe('tea-black');
    expect(findTeaCategoryById('earlgrey')?.id).toBe('tea-black');
    expect(findTeaCategoryById('earl-grey')?.id).toBe('tea-black');
    expect(findTeaCategoryById('lapsang')?.id).toBe('tea-black');
    expect(findTeaCategoryById('tieguanyin')?.id).toBe('tea-oolong');
    expect(findTeaCategoryById('dahongpao')?.id).toBe('tea-oolong');
    expect(findTeaCategoryById('dancong')?.id).toBe('tea-oolong');
    expect(findTeaCategoryById('silver-needle')?.id).toBe('tea-white');
    expect(findTeaCategoryById('baimudan')?.id).toBe('tea-white');
  });

  test('TASK-P44-06-TRE: findCoffeeOriginById wspiera mikroregiony kawowe (yirgacheffe, guji, nyeri, huila, narino, antigua, tarrazu, cerrado, boquete)', () => {
    expect(findCoffeeOriginById('yirgacheffe')?.id).toBe('origin-ethiopia');
    expect(findCoffeeOriginById('sidama')?.id).toBe('origin-ethiopia');
    expect(findCoffeeOriginById('guji')?.id).toBe('origin-ethiopia');
    expect(findCoffeeOriginById('harrar')?.id).toBe('origin-ethiopia');
    expect(findCoffeeOriginById('nyeri')?.id).toBe('origin-kenya');
    expect(findCoffeeOriginById('kirinyaga')?.id).toBe('origin-kenya');
    expect(findCoffeeOriginById('huila')?.id).toBe('origin-colombia');
    expect(findCoffeeOriginById('narino')?.id).toBe('origin-colombia');
    expect(findCoffeeOriginById('antigua')?.id).toBe('origin-guatemala');
    expect(findCoffeeOriginById('huehuetenango')?.id).toBe('origin-guatemala');
    expect(findCoffeeOriginById('tarrazu')?.id).toBe('origin-costa-rica');
    expect(findCoffeeOriginById('cerrado')?.id).toBe('origin-brazil');
    expect(findCoffeeOriginById('minas gerais')?.id).toBe('origin-brazil');
    expect(findCoffeeOriginById('boquete')?.id).toBe('origin-panama');
    expect(findCoffeeOriginById('volcan')?.id).toBe('origin-panama');
  });

  test('TASK-P45-06-TRE: findCoffeeVarietyById wspiera aliasy mokka, java, laurina, pacas, mundo novo, parainema oraz warianty bourbona', () => {
    expect(findCoffeeVarietyById('mokka')?.id).toBe('variety-typica');
    expect(findCoffeeVarietyById('mocha')?.id).toBe('variety-typica');
    expect(findCoffeeVarietyById('java')?.id).toBe('variety-typica');
    expect(findCoffeeVarietyById('laurina')?.id).toBe('variety-bourbon');
    expect(findCoffeeVarietyById('pacas')?.id).toBe('variety-pacamara-maragogype');
    expect(findCoffeeVarietyById('mundo novo')?.id).toBe('variety-caturra-catuai');
    expect(findCoffeeVarietyById('mundonovo')?.id).toBe('variety-caturra-catuai');
    expect(findCoffeeVarietyById('mundo-novo')?.id).toBe('variety-caturra-catuai');
    expect(findCoffeeVarietyById('parainema')?.id).toBe('variety-castillo-colombia');
    expect(findCoffeeVarietyById('yellow bourbon')?.id).toBe('variety-bourbon');
    expect(findCoffeeVarietyById('yellowbourbon')?.id).toBe('variety-bourbon');
    expect(findCoffeeVarietyById('red bourbon')?.id).toBe('variety-bourbon');
    expect(findCoffeeVarietyById('redbourbon')?.id).toBe('variety-bourbon');
    expect(findCoffeeVarietyById('orange bourbon')?.id).toBe('variety-bourbon');
  });

  test('TASK-P46-06-TRE: findCoffeeProcessById wspiera podwarianty obróbki honey (black, red, yellow, white, gold)', () => {
    expect(findCoffeeProcessById('black honey')?.id).toBe('process-honey');
    expect(findCoffeeProcessById('black-honey')?.id).toBe('process-honey');
    expect(findCoffeeProcessById('blackhoney')?.id).toBe('process-honey');
    expect(findCoffeeProcessById('red honey')?.id).toBe('process-honey');
    expect(findCoffeeProcessById('red-honey')?.id).toBe('process-honey');
    expect(findCoffeeProcessById('redhoney')?.id).toBe('process-honey');
    expect(findCoffeeProcessById('yellow honey')?.id).toBe('process-honey');
    expect(findCoffeeProcessById('yellow-honey')?.id).toBe('process-honey');
    expect(findCoffeeProcessById('yellowhoney')?.id).toBe('process-honey');
    expect(findCoffeeProcessById('white honey')?.id).toBe('process-honey');
    expect(findCoffeeProcessById('gold honey')?.id).toBe('process-honey');
  });

  test('TASK-P47-06-TRE: findCoffeeProcessById wspiera natural carbonic, anaerobic natural/washed oraz drozdzowa i experimental', () => {
    expect(findCoffeeProcessById('natural carbonic')?.id).toBe('process-carbonic-maceration');
    expect(findCoffeeProcessById('natural-carbonic')?.id).toBe('process-carbonic-maceration');
    expect(findCoffeeProcessById('natural carbonic maceration')?.id).toBe('process-carbonic-maceration');
    expect(findCoffeeProcessById('anaerobic natural')?.id).toBe('process-anaerobic');
    expect(findCoffeeProcessById('anaerobic-natural')?.id).toBe('process-anaerobic');
    expect(findCoffeeProcessById('anaerobic washed')?.id).toBe('process-anaerobic');
    expect(findCoffeeProcessById('anaerobic-washed')?.id).toBe('process-anaerobic');
    expect(findCoffeeProcessById('anaerobic honey')?.id).toBe('process-anaerobic');
    expect(findCoffeeProcessById('anaerobico')?.id).toBe('process-anaerobic');
    expect(findCoffeeProcessById('lavado')?.id).toBe('process-washed');
    expect(findCoffeeProcessById('winey')?.id).toBe('process-natural');
    expect(findCoffeeProcessById('wine process')?.id).toBe('process-natural');
    expect(findCoffeeProcessById('fermentacja drozdzowa')?.id).toBe('process-anaerobic');
    expect(findCoffeeProcessById('experimental')?.id).toBe('process-anaerobic');
    expect(findCoffeeProcessById('eksperymentalna')?.id).toBe('process-anaerobic');
  });

  test('TASK-P48-06-TRE: findCoffeeVarietyById wspiera odmiany maracaturra, anacafe-14, k7, obata, bourbon-pointu oraz findTeaCategoryById wspiera pu-erh, hojicha i kukicha', () => {
    expect(findCoffeeVarietyById('maracaturra')?.id).toBe('variety-pacamara-maragogype');
    expect(findCoffeeVarietyById('anacafe-14')?.id).toBe('variety-pacamara-maragogype');
    expect(findCoffeeVarietyById('anacafe14')?.id).toBe('variety-pacamara-maragogype');
    expect(findCoffeeVarietyById('k7')?.id).toBe('variety-sl28-sl34');
    expect(findCoffeeVarietyById('obata')?.id).toBe('variety-caturra-catuai');
    expect(findCoffeeVarietyById('catigua')?.id).toBe('variety-caturra-catuai');
    expect(findCoffeeVarietyById('bourbon-pointu')?.id).toBe('variety-bourbon');
    expect(findCoffeeVarietyById('bourbonpointu')?.id).toBe('variety-bourbon');
    expect(findCoffeeVarietyById('papayo')?.id).toBe('variety-bourbon');

    expect(findTeaCategoryById('pu-erh')?.id).toBe('tea-puerh');
    expect(findTeaCategoryById('pu erh')?.id).toBe('tea-puerh');
    expect(findTeaCategoryById("pu'erh")?.id).toBe('tea-puerh');
    expect(findTeaCategoryById('hojicha')?.id).toBe('tea-green');
    expect(findTeaCategoryById('houjicha')?.id).toBe('tea-green');
    expect(findTeaCategoryById('kukicha')?.id).toBe('tea-green');
    expect(findTeaCategoryById('fukamushi')?.id).toBe('tea-green');
  });

  test('TASK-P49-06-TRE: findCoffeeProcessById wspiera koji, aerobic, yeast-inoculated, extended-fermentation oraz findTeaCategoryById wspiera jasmine, oriental beauty i milk oolong', () => {
    expect(findCoffeeProcessById('koji')?.id).toBe('process-anaerobic');
    expect(findCoffeeProcessById('koji-fermentation')?.id).toBe('process-anaerobic');
    expect(findCoffeeProcessById('koji fermentation')?.id).toBe('process-anaerobic');
    expect(findCoffeeProcessById('aerobic')?.id).toBe('process-anaerobic');
    expect(findCoffeeProcessById('aerobic fermentation')?.id).toBe('process-anaerobic');
    expect(findCoffeeProcessById('yeast-inoculated')?.id).toBe('process-anaerobic');
    expect(findCoffeeProcessById('extended-fermentation')?.id).toBe('process-anaerobic');

    expect(findTeaCategoryById('jasmine')?.id).toBe('tea-green');
    expect(findTeaCategoryById('jasminowa')?.id).toBe('tea-green');
    expect(findTeaCategoryById('oriental beauty')?.id).toBe('tea-oolong');
    expect(findTeaCategoryById('oriental-beauty')?.id).toBe('tea-oolong');
    expect(findTeaCategoryById('dongfangmeiren')?.id).toBe('tea-oolong');
    expect(findTeaCategoryById('milk oolong')?.id).toBe('tea-oolong');
    expect(findTeaCategoryById('milk-oolong')?.id).toBe('tea-oolong');
    expect(findTeaCategoryById('jin xuan')?.id).toBe('tea-oolong');
  });

  test('TASK-P50-06-TRE: findCoffeeProcessById wspiera thermal-shock, cryo-maceration, nitro oraz findTeaCategoryById wspiera yancha, keemun, dianhong', () => {
    // 1. Procesy kawy
    expect(findCoffeeProcessById('thermal-shock')?.id).toBe('process-anaerobic');
    expect(findCoffeeProcessById('szok termiczny')?.id).toBe('process-anaerobic');
    expect(findCoffeeProcessById('cryo-maceration')?.id).toBe('process-anaerobic');
    expect(findCoffeeProcessById('nitro-maceration')?.id).toBe('process-anaerobic');

    // 2. Kategorie herbaty
    expect(findTeaCategoryById('yancha')?.id).toBe('tea-oolong');
    expect(findTeaCategoryById('wuyi rock')?.id).toBe('tea-oolong');
    expect(findTeaCategoryById('keemun')?.id).toBe('tea-black');
    expect(findTeaCategoryById('qimen')?.id).toBe('tea-black');
    expect(findTeaCategoryById('dianhong')?.id).toBe('tea-black');
    expect(findTeaCategoryById('jin-jun-mei')?.id).toBe('tea-black');
  });

  test('TASK-P51-06-TRE: findTeaCategoryById wspiera herbaty biale/zielone/oolong, findCoffeeOriginById i findCoffeeVarietyById wspieraja nowe regiony i kultywary', () => {
    // 1. Herbaty białe, zielone, oolong
    expect(findTeaCategoryById('silver needle')?.id).toBe('tea-white');
    expect(findTeaCategoryById('silver-needle')?.id).toBe('tea-white');
    expect(findTeaCategoryById('white peony')?.id).toBe('tea-white');
    expect(findTeaCategoryById('pai mu tan')?.id).toBe('tea-white');
    expect(findTeaCategoryById('longjing')?.id).toBe('tea-green');
    expect(findTeaCategoryById('dragonwell')?.id).toBe('tea-green');
    expect(findTeaCategoryById('bancha')?.id).toBe('tea-green');
    expect(findTeaCategoryById('tieguanyin')?.id).toBe('tea-oolong');
    expect(findTeaCategoryById('iron goddess')?.id).toBe('tea-oolong');
    expect(findTeaCategoryById('da hong pao')?.id).toBe('tea-oolong');
    expect(findTeaCategoryById('big red robe')?.id).toBe('tea-oolong');

    // 2. Regiony pochodzenia kawy
    expect(findCoffeeOriginById('limu')?.id).toBe('origin-ethiopia');
    expect(findCoffeeOriginById('jimma')?.id).toBe('origin-ethiopia');
    expect(findCoffeeOriginById('embu')?.id).toBe('origin-kenya');
    expect(findCoffeeOriginById('muranga')?.id).toBe('origin-kenya');
    expect(findCoffeeOriginById('coban')?.id).toBe('origin-guatemala');
    expect(findCoffeeOriginById('atitlan')?.id).toBe('origin-guatemala');
    expect(findCoffeeOriginById('mogiana')?.id).toBe('origin-brazil');
    expect(findCoffeeOriginById('renacimiento')?.id).toBe('origin-panama');

    // 3. Kultywary kawy
    expect(findCoffeeVarietyById('gesha 1931')?.id).toBe('variety-geisha');
    expect(findCoffeeVarietyById('panama geisha')?.id).toBe('variety-geisha');
    expect(findCoffeeVarietyById('villalobos')?.id).toBe('variety-typica');
    expect(findCoffeeVarietyById('san ramon')?.id).toBe('variety-typica');
    expect(findCoffeeVarietyById('marsellesa')?.id).toBe('variety-castillo-colombia');
  });

  test('TASK-P52-06-TRE: findTeaCategoryById wspiera huangcha, hei cha i genmaicha, a regiony i kultywary kawy wspieraja nowe aliasy', () => {
    // 1. Nowe kategorie herbaty
    expect(findTeaCategoryById('huangcha')?.id).toBe('tea-yellow');
    expect(findTeaCategoryById('yellow tea')?.id).toBe('tea-yellow');
    expect(findTeaCategoryById('junshan yinzhen')?.id).toBe('tea-yellow');
    expect(findTeaCategoryById('hei cha')?.id).toBe('tea-puerh');
    expect(findTeaCategoryById('liu bao')?.id).toBe('tea-puerh');
    expect(findTeaCategoryById('genmaicha')?.id).toBe('tea-green');

    // 2. Regiony kawy
    expect(findCoffeeOriginById('west valley')?.id).toBe('origin-costa-rica');
    expect(findCoffeeOriginById('tres rios')?.id).toBe('origin-costa-rica');
    expect(findCoffeeOriginById('pitalito')?.id).toBe('origin-colombia');
    expect(findCoffeeOriginById('san agustin')?.id).toBe('origin-colombia');
    expect(findCoffeeOriginById('jaramillo')?.id).toBe('origin-panama');

    // 3. Kultywary kawy
    expect(findCoffeeVarietyById('sidra')?.id).toBe('variety-bourbon');
    expect(findCoffeeVarietyById('mejorado')?.id).toBe('variety-typica');
    expect(findCoffeeVarietyById('arusha')?.id).toBe('variety-typica');
    expect(findCoffeeVarietyById('tekisic')?.id).toBe('variety-bourbon');
  });
});
